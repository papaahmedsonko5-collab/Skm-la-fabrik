/**
 * Types et petites aides partagés par les pages de l'admin.
 * Toutes les requêtes passent par le client lié à la session (RLS).
 */
import { contactObjects, type ContactObject } from '@/lib/contact';

export const statuts = ['nouvelle', 'en_cours', 'traitee', 'archivee'] as const;
export type Statut = (typeof statuts)[number];
export const statutLabels: Record<Statut, string> = {
  nouvelle: 'Nouvelle',
  en_cours: 'En cours',
  traitee: 'Traitée',
  archivee: 'Archivée',
};
export function isStatut(v: unknown): v is Statut {
  return typeof v === 'string' && (statuts as readonly string[]).includes(v);
}

export interface Demande {
  id: string;
  created_at: string;
  objet: ContactObject;
  detail: string;
  nom: string;
  organisation: string;
  email: string;
  telephone: string;
  message: string;
  statut: Statut;
  note_interne: string;
}

export function objetLabel(o: string): string {
  return (contactObjects as Record<string, { label: string }>)[o]?.label ?? o;
}

export interface Actualite {
  id: string;
  slug: string;
  title: string;
  type: string;
  date: string | null;
  period: string;
  summary: string;
  body: string;
  cover_path: string | null;
  cover_alt: string;
  cover_position: string;
  featured: boolean;
  draft: boolean;
  updated_at: string;
}

export interface Projet {
  id: string;
  slug: string;
  title: string;
  category: string;
  period: string;
  year: number | null;
  place: string;
  partners: string[];
  summary: string;
  body: string;
  cover_path: string | null;
  cover_alt: string;
  gallery: { path: string; alt: string }[];
  videos: { title: string; url: string }[];
  related_page: string | null;
  missing: string[];
  featured: boolean;
  draft: boolean;
  updated_at: string;
}

export const categoriesPhotos = ['Festivals', 'Concerts', 'Formations', 'Communauté', 'Studio', 'Événements'] as const;
export type CategoriePhoto = (typeof categoriesPhotos)[number];
export const isCategoriePhoto = (v: unknown): v is CategoriePhoto =>
  typeof v === 'string' && (categoriesPhotos as readonly string[]).includes(v);

export interface PhotoGalerie {
  id: string;
  path: string;
  alt: string;
  categorie: CategoriePhoto;
  position: number;
  visible: boolean;
  large: boolean;
}

export interface VideoGalerie {
  id: string;
  titre: string;
  youtube_id: string;
  type: 'video' | 'playlist';
  categorie: CategoriePhoto;
  position: number;
  visible: boolean;
}

/**
 * Lit un lien YouTube (vidéo, Shorts, youtu.be ou playlist) et renvoie son
 * identifiant. Refuse tout autre site.
 */
export function lireLienYoutube(lien: string): { type: 'video' | 'playlist'; id: string } | null {
  let u: URL;
  try {
    u = new URL(lien.trim());
  } catch {
    return null;
  }
  const hote = u.hostname.replace(/^(www\.|m\.|music\.)/, '');
  const ok = (v: string | null | undefined, min: number) => (v && new RegExp(`^[A-Za-z0-9_-]{${min},64}$`).test(v) ? v : null);
  if (hote === 'youtu.be') {
    const id = ok(u.pathname.slice(1).split('/')[0], 11);
    return id ? { type: 'video', id } : null;
  }
  if (hote !== 'youtube.com' && hote !== 'youtube-nocookie.com') return null;
  const v = ok(u.searchParams.get('v'), 11);
  if (v) return { type: 'video', id: v };
  const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/);
  const chemin = ok(m?.[1], 11);
  if (chemin && chemin !== 'videoseries') return { type: 'video', id: chemin };
  const list = ok(u.searchParams.get('list'), 10);
  if (list) return { type: 'playlist', id: list };
  return null;
}

export interface Contenu {
  key: string;
  page: string;
  label: string;
  value: string;
  multiline: boolean;
  position: number;
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Dakar' });
const dateHeureFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Dakar',
});
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateHeure = (iso: string) => dateHeureFmt.format(new Date(iso));

/** Transforme un titre en identifiant d'URL (« Rio Fresco Fest 2026 » → « rio-fresco-fest-2026 »). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Lit un champ texte d'un formulaire, nettoyé et borné. */
export function field(form: FormData, name: string, max = 10_000): string {
  const v = form.get(name);
  return typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim().slice(0, max) : '';
}

/** Liste « une valeur par ligne » ou séparée par des virgules. */
export function listField(form: FormData, name: string): string[] {
  return field(form, name)
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_IMAGE = 15 * 1024 * 1024;

/** Envoie une photo dans le stockage « medias » et renvoie son chemin. */
export async function uploadImage(
  supabase: import('./supabase').AdminClient,
  file: FormDataEntryValue | null,
  folder: 'actualites' | 'projets' | 'galerie',
): Promise<{ path: string } | { error: string } | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!IMAGE_TYPES.has(file.type)) return { error: 'Format de photo non accepté (JPEG, PNG, WebP ou AVIF).' };
  if (file.size > MAX_IMAGE) return { error: 'Photo trop lourde (15 Mo au maximum).' };
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/avif' ? 'avif' : 'jpg';
  const base = slugify(file.name.replace(/\.\w+$/, '')) || 'photo';
  const path = `${folder}/${Date.now().toString(36)}-${base}.${ext}`;
  const { error } = await supabase.storage.from('medias').upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
  if (error) return { error: 'L’envoi de la photo a échoué.' };
  return { path };
}

/** Lit un message de retour passé dans l'URL après une redirection. */
export function flashFrom(url: URL): { type: 'ok' | 'erreur'; text: string } | null {
  const ok = url.searchParams.get('ok');
  const err = url.searchParams.get('erreur');
  const messages: Record<string, string> = {
    enregistre: 'Modifications enregistrées. Pensez à publier pour mettre le site à jour.',
    supprime: 'Élément supprimé. Pensez à publier pour mettre le site à jour.',
    publie: 'Publication lancée : le site sera à jour dans une à deux minutes.',
    statut: 'Statut mis à jour.',
    importe: 'Contenu actuel du site importé. Vérifiez-le, puis publiez.',
    securite: 'Double authentification activée. Gardez l’application sur votre téléphone : elle sera demandée à chaque connexion.',
    video: 'Vidéo ajoutée. Pensez à publier pour mettre le site à jour.',
    ajoute: 'Photos ajoutées. Ajoutez une description à chacune, puis publiez.',
  };
  if (ok && messages[ok]) return { type: 'ok', text: messages[ok] };
  const erreurs: Record<string, string> = {
    publication: 'La publication n’a pas pu être lancée. Réessayez dans un instant.',
    hook: 'Le bouton Publier n’est pas encore configuré (DEPLOY_HOOK_URL manquant dans Vercel).',
    introuvable: 'Élément introuvable.',
    photos: 'Certaines photos n’ont pas pu être copiées. Les fiches concernées restent en brouillon : relancez « Récupérer les photos ».',
  };
  if (err) return { type: 'erreur', text: erreurs[err] ?? 'Une erreur est survenue.' };
  return null;
}
