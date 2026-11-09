import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
import { BilanImport, televerser, type ClientStockage } from '../src/lib/admin/medias';
import { flashFrom, uploadImage } from '../src/lib/admin/data';
import { lireImage, MAX_IMAGE, verifierImage, type ImageVerifiee, type TypeImage } from '../src/lib/images';

const vraies: Partial<Record<TypeImage, Uint8Array<ArrayBuffer>>> = {};
const u8 = (b: Buffer) => new Uint8Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)) as Uint8Array<ArrayBuffer>;

beforeAll(async () => {
  const base = () => sharp({ create: { width: 16, height: 16, channels: 3, background: '#c9a13b' } });
  vraies['image/jpeg'] = u8(await base().jpeg().toBuffer());
  vraies['image/png'] = u8(await base().png().toBuffer());
  vraies['image/webp'] = u8(await base().webp().toBuffer());
  vraies['image/avif'] = u8(await base().avif().toBuffer());
});

const types = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;

/** Client de stockage simulé : enregistre les envois, ou renvoie l'erreur demandée. */
function stockage(reponse: { error: { message: string } | null } | 'exception' = { error: null }) {
  const envois: { path: string; type: string; taille: number; upsert: boolean }[] = [];
  const client: ClientStockage = {
    storage: {
      from: () => ({
        upload: async (path, body, options) => {
          if (reponse === 'exception') throw new Error('réseau coupé');
          envois.push({ path, type: options.contentType, taille: body.byteLength, upsert: options.upsert });
          return reponse;
        },
      }),
    },
  };
  return { client, envois };
}

describe('verifierImage : signatures réelles', () => {
  it.each(types)('reconnaît un vrai fichier %s', (type) => {
    const r = verifierImage(vraies[type]!);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.type).toBe(type);
  });

  it('refuse un fichier vide', () => {
    expect(verifierImage(new Uint8Array(0))).toEqual({ ok: false, raison: 'vide' });
  });

  it('refuse du texte, du HTML ou un SVG même nommés comme des photos', () => {
    for (const t of ['Bonjour', '<html><script>alert(1)</script>', '<svg xmlns="http://www.w3.org/2000/svg"/>', 'GIF89a......']) {
      expect(verifierImage(new TextEncoder().encode(t) as Uint8Array<ArrayBuffer>)).toEqual({ ok: false, raison: 'format' });
    }
  });

  it('refuse une signature de début seule (en-tête JPEG ou PNG suivi de rien d’utile)', () => {
    expect(verifierImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]) as Uint8Array<ArrayBuffer>).ok).toBe(false);
    expect(verifierImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) as Uint8Array<ArrayBuffer>).ok).toBe(false);
  });

  it.each(types)('détecte un fichier %s tronqué', (type) => {
    const o = vraies[type]!;
    const coupe = o.slice(0, Math.floor(o.length * 0.6));
    expect(verifierImage(coupe)).toEqual({ ok: false, raison: 'tronque' });
  });

  it('refuse un contenu au-delà de 15 Mo', () => {
    expect(verifierImage(new Uint8Array(MAX_IMAGE + 1))).toEqual({ ok: false, raison: 'trop_gros' });
  });
});

describe('lireImage : type déclaré ignoré, taille bornée', () => {
  it('se fie au contenu et non au type annoncé par le navigateur', async () => {
    const pngDeguise = new File([vraies['image/png']!], 'photo.jpg', { type: 'image/jpeg' });
    const r = await lireImage(pngDeguise);
    expect(r.ok && r.type).toBe('image/png');
    const texteDeguise = new File(['pas une image'], 'photo.jpg', { type: 'image/jpeg' });
    expect(await lireImage(texteDeguise)).toEqual({ ok: false, raison: 'format' });
  });

  it('refuse un fichier envoyé de plus de 15 Mo', async () => {
    const gros = new File([new Uint8Array(MAX_IMAGE + 1)], 'gros.jpg', { type: 'image/jpeg' });
    expect(await lireImage(gros)).toEqual({ ok: false, raison: 'trop_gros' });
  });

  it('refuse une réponse qui annonce plus de 15 Mo, sans la lire', async () => {
    const res = new Response(new Uint8Array(10), { headers: { 'content-length': String(MAX_IMAGE + 1) } });
    expect(await lireImage(res)).toEqual({ ok: false, raison: 'trop_gros' });
  });

  it('arrête la lecture d’une réponse sans longueur dès 15 Mo dépassés', async () => {
    const morceau = new Uint8Array(1024 * 1024);
    let lus = 0;
    const flux = new ReadableStream<Uint8Array>({
      pull(c) {
        lus++;
        if (lus > 100) c.close();
        else c.enqueue(morceau);
      },
    });
    expect(await lireImage(new Response(flux))).toEqual({ ok: false, raison: 'trop_gros' });
    expect(lus).toBeLessThanOrEqual(17);
  });

  it('refuse une réponse en erreur HTTP', async () => {
    expect(await lireImage(new Response('introuvable', { status: 404 }))).toEqual({ ok: false, raison: 'illisible' });
  });

  it('accepte une vraie photo servie par HTTP', async () => {
    const r = await lireImage(new Response(vraies['image/webp']!, { headers: { 'content-type': 'image/jpeg' } }));
    expect(r.ok && r.type).toBe('image/webp');
  });
});

describe('televerser : erreurs du stockage Supabase', () => {
  const image = (): ImageVerifiee => ({ ok: true, octets: vraies['image/png']!, type: 'image/png', ext: 'png' });

  it('envoie avec le type réel', async () => {
    const { client, envois } = stockage();
    expect(await televerser(client, 'galerie/a.png', image(), false)).toEqual({ ok: true, path: 'galerie/a.png' });
    expect(envois[0]).toMatchObject({ path: 'galerie/a.png', type: 'image/png', upsert: false });
  });

  it('remonte une erreur renvoyée par Supabase', async () => {
    const { client } = stockage({ error: { message: 'The resource already exists' } });
    expect(await televerser(client, 'galerie/a.png', image(), false)).toEqual({ ok: false, raison: 'stockage', detail: 'The resource already exists' });
  });

  it('remonte une exception réseau', async () => {
    const { client } = stockage('exception');
    expect(await televerser(client, 'galerie/a.png', image(), false)).toMatchObject({ ok: false, raison: 'stockage' });
  });
});

describe('uploadImage (admin)', () => {
  type Client = Parameters<typeof uploadImage>[0];

  it('refuse un faux fichier image sans rien envoyer', async () => {
    const { client, envois } = stockage();
    const r = await uploadImage(client as unknown as Client, new File(['<script>'], 'x.png', { type: 'image/png' }), 'galerie');
    expect(r).toEqual({ error: expect.stringContaining('n’est pas une photo') });
    expect(envois).toHaveLength(0);
  });

  it('refuse une photo tronquée', async () => {
    const { client, envois } = stockage();
    const coupe = vraies['image/jpeg']!.slice(0, 200);
    const r = await uploadImage(client as unknown as Client, new File([coupe], 'x.jpg', { type: 'image/jpeg' }), 'projets');
    expect(r).toEqual({ error: expect.stringContaining('incomplète') });
    expect(envois).toHaveLength(0);
  });

  it('donne l’extension et le type réels', async () => {
    const { client, envois } = stockage();
    const r = await uploadImage(client as unknown as Client, new File([vraies['image/webp']!], 'Ma Photo.jpg', { type: 'image/jpeg' }), 'actualites');
    expect(r && 'path' in r && r.path).toMatch(/^actualites\/[a-z0-9]+-ma-photo\.webp$/);
    expect(envois[0]?.type).toBe('image/webp');
  });

  it('signale l’échec quand Supabase refuse l’envoi', async () => {
    const { client } = stockage({ error: { message: 'quota' } });
    const r = await uploadImage(client as unknown as Client, new File([vraies['image/png']!], 'a.png', { type: 'image/png' }), 'galerie');
    expect(r).toEqual({ error: 'L’envoi de la photo a échoué.' });
  });

  it('ignore un champ vide, comme avant', async () => {
    const { client } = stockage();
    expect(await uploadImage(client as unknown as Client, new File([], 'vide.jpg'), 'galerie')).toBeNull();
    expect(await uploadImage(client as unknown as Client, null, 'galerie')).toBeNull();
  });
});

describe('BilanImport : jamais de fausse réussite', () => {
  it('annonce la réussite seulement sans aucun échec', () => {
    const b = new BilanImport();
    b.reussi('projet/a');
    expect(b.parametres().toString()).toBe('ok=importe&reussis=1');
  });

  it('compte les erreurs Supabase comme des échecs', () => {
    const b = new BilanImport();
    expect(b.verifier('projet/a', null)).toBe(false);
    expect(b.verifier('projet/b', { message: 'violates row-level security policy' })).toBe(true);
    expect(b.complet).toBe(false);
    expect(b.echecs[0]).toEqual({ element: 'projet/b', raison: 'supabase : violates row-level security policy' });
  });

  it('donne un bilan partiel précis, sans message brut dans l’adresse', () => {
    const b = new BilanImport();
    b.reussi('projet/a');
    b.reussi('galerie/import-x.jpg');
    b.echec('projet/b', 'supabase : secret détail <script>');
    b.echec('photo dé<b>.jpg', 'format');
    const p = b.parametres();
    expect(p.get('erreur')).toBe('import_partiel');
    expect(p.get('reussis')).toBe('2');
    expect(p.get('echecs')).toBe('2');
    expect(p.get('liste')).toBe('projet/b,photodb.jpg');
    expect(p.toString()).not.toMatch(/secret|script/);
  });

  it('le tableau de bord affiche le bilan partiel', () => {
    const url = new URL('https://www.skmlafabrik.com/admin?erreur=import_partiel&reussis=5&echecs=2&liste=projet/b,galerie/x.jpg');
    const f = flashFrom(url);
    expect(f?.type).toBe('erreur');
    expect(f?.text).toContain('5 élément(s) importé(s), 2 en échec');
    expect(f?.text).toContain('projet/b, galerie/x.jpg');
  });

  it('nettoie un bilan falsifié dans l’adresse', () => {
    const f = flashFrom(new URL('https://x.sn/admin?erreur=import_partiel&reussis=abc&echecs=99999&liste=<img src=x>'));
    expect(f?.text).toContain('0 élément(s) importé(s), 0 en échec');
    expect(f?.text).not.toContain('<');
  });
});
