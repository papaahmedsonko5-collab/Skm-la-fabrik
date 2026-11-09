/**
 * Validation des images envoyées dans le stockage « medias ».
 *
 * Partagée par l'envoi depuis l'admin (uploadImage) et par l'import du contenu
 * du site (api/admin/importer). Le type déclaré (Content-Type, extension, type
 * du fichier choisi dans le navigateur) n'est jamais cru : seul le contenu réel
 * compte. On reconnaît la signature binaire de chaque format et on vérifie que
 * le fichier n'est pas tronqué (marqueur ou bloc de fin présent, tailles
 * internes cohérentes).
 */
import { lireFlux } from '@/lib/corps';

/** 15 Mo, comme la limite du bucket « medias ». */
export const MAX_IMAGE = 15 * 1024 * 1024;

export type TypeImage = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
export const EXTENSION: Record<TypeImage, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export type RaisonRefus = 'vide' | 'trop_gros' | 'format' | 'tronque' | 'illisible';
export type ImageVerifiee = { ok: true; octets: Uint8Array<ArrayBuffer>; type: TypeImage; ext: string };
export type ImageRefusee = { ok: false; raison: RaisonRefus };

export const MESSAGE_REFUS: Record<RaisonRefus, string> = {
  vide: 'Le fichier est vide.',
  trop_gros: 'Photo trop lourde (15 Mo au maximum).',
  format: 'Ce fichier n’est pas une photo JPEG, PNG, WebP ou AVIF valide.',
  tronque: 'La photo semble incomplète (fichier tronqué). Envoyez-la à nouveau.',
  illisible: 'La photo n’a pas pu être lue.',
};

const ascii = (o: Uint8Array, debut: number, texte: string) =>
  o.length >= debut + texte.length && [...texte].every((c, i) => o[debut + i] === c.charCodeAt(0));
const u32be = (o: Uint8Array, i: number) => ((o[i]! << 24) >>> 0) + (o[i + 1]! << 16) + (o[i + 2]! << 8) + o[i + 3]!;
const u32le = (o: Uint8Array, i: number) => o[i]! + (o[i + 1]! << 8) + (o[i + 2]! << 16) + ((o[i + 3]! << 24) >>> 0);

function jpeg(o: Uint8Array): 'ok' | 'tronque' | null {
  if (!(o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff)) return null;
  // Marqueur de fin FF D9. Certains appareils ajoutent quelques octets après :
  // on le cherche dans le dernier kilo-octet.
  for (let i = o.length - 2; i >= Math.max(3, o.length - 1024); i--) {
    if (o[i] === 0xff && o[i + 1] === 0xd9) return 'ok';
  }
  return 'tronque';
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_IEND = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];
function png(o: Uint8Array): 'ok' | 'tronque' | null {
  if (!PNG_SIGNATURE.every((b, i) => o[i] === b)) return null;
  if (!ascii(o, 12, 'IHDR')) return null;
  const fin = o.length - PNG_IEND.length;
  return fin > 20 && PNG_IEND.every((b, i) => o[fin + i] === b) ? 'ok' : 'tronque';
}

function webp(o: Uint8Array): 'ok' | 'tronque' | null {
  if (!ascii(o, 0, 'RIFF') || !ascii(o, 8, 'WEBP')) return null;
  if (!(ascii(o, 12, 'VP8 ') || ascii(o, 12, 'VP8L') || ascii(o, 12, 'VP8X'))) return null;
  // La taille RIFF annonce tout le fichier moins les 8 premiers octets.
  const attendu = u32le(o, 4) + 8;
  if (o.length < attendu) return 'tronque';
  return o.length - attendu <= 1 ? 'ok' : null;
}

/** AVIF (conteneur ISO BMFF) : boîte ftyp avec la marque avif/avis, puis boîtes qui couvrent exactement le fichier. */
function avif(o: Uint8Array): 'ok' | 'tronque' | null {
  if (!ascii(o, 4, 'ftyp')) return null;
  const tailleFtyp = u32be(o, 0);
  if (tailleFtyp < 16 || tailleFtyp > o.length) return null;
  const marques: string[] = [];
  for (let i = 8; i + 4 <= tailleFtyp; i += 4) {
    if (i === 12) continue; // version mineure
    marques.push(String.fromCharCode(o[i]!, o[i + 1]!, o[i + 2]!, o[i + 3]!));
  }
  if (!marques.includes('avif') && !marques.includes('avis')) return null;

  let i = 0;
  let meta = false;
  let donnees = false;
  while (i < o.length) {
    if (i + 8 > o.length) return 'tronque';
    let taille = u32be(o, i);
    const nom = String.fromCharCode(o[i + 4]!, o[i + 5]!, o[i + 6]!, o[i + 7]!);
    if (taille === 1) {
      if (i + 16 > o.length) return 'tronque';
      const haut = u32be(o, i + 8);
      if (haut > 0x1fffff) return null; // au-delà de ce qu'un nombre JavaScript représente exactement
      taille = haut * 2 ** 32 + u32be(o, i + 12);
    } else if (taille === 0) {
      taille = o.length - i; // boîte jusqu'à la fin du fichier
    }
    if (taille < 8) return null;
    if (nom === 'meta') meta = true;
    if (nom === 'mdat') donnees = true;
    if (i + taille > o.length) return 'tronque';
    i += taille;
  }
  return meta && donnees ? 'ok' : 'tronque';
}

/** Reconnaît le format réel d'après le contenu, et vérifie que le fichier est complet. */
export function verifierImage(o: Uint8Array<ArrayBuffer>): ImageVerifiee | ImageRefusee {
  if (o.length === 0) return { ok: false, raison: 'vide' };
  if (o.length > MAX_IMAGE) return { ok: false, raison: 'trop_gros' };
  const essais: [TypeImage, (o: Uint8Array) => 'ok' | 'tronque' | null][] = [
    ['image/jpeg', jpeg],
    ['image/png', png],
    ['image/webp', webp],
    ['image/avif', avif],
  ];
  for (const [type, test] of essais) {
    const r = test(o);
    if (r === 'ok') return { ok: true, octets: o, type, ext: EXTENSION[type] };
    if (r === 'tronque') return { ok: false, raison: 'tronque' };
  }
  return { ok: false, raison: 'format' };
}

/**
 * Lit puis vérifie une image venant d'un fichier envoyé (File) ou d'une réponse
 * HTTP. La lecture s'arrête dès que MAX_IMAGE est dépassé : un fichier trop
 * lourd n'est jamais chargé entier en mémoire.
 */
export async function lireImage(source: Blob | Response): Promise<ImageVerifiee | ImageRefusee> {
  if (source instanceof Response) {
    if (!source.ok) {
      await source.body?.cancel().catch(() => undefined);
      return { ok: false, raison: 'illisible' };
    }
    const lu = await lireFlux(source.body, source.headers.get('content-length'), MAX_IMAGE, { exacte: false });
    if (!lu.ok) return { ok: false, raison: lu.raison };
    return verifierImage(lu.octets);
  }
  if (source.size === 0) return { ok: false, raison: 'vide' };
  if (source.size > MAX_IMAGE) return { ok: false, raison: 'trop_gros' };
  const lu = await lireFlux(source.stream(), String(source.size), MAX_IMAGE);
  if (!lu.ok) return { ok: false, raison: lu.raison };
  return verifierImage(lu.octets);
}
