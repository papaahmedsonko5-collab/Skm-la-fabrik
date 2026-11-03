import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { AdminClient } from '@/lib/admin/supabase';
import { slugify } from '@/lib/admin/data';

export const prerender = false;

/**
 * Import du contenu actuel du site (fichiers du dépôt) dans l'admin :
 * actualités, projets et leurs photos.
 *
 * - Admin vide : crée les fiches.
 * - Fiches déjà importées mais sans photo (import interrompu) : ajoute
 *   seulement les photos manquantes, sans toucher au reste de la fiche.
 * Une fiche qui a déjà une photo n'est jamais modifiée.
 *
 * Les photos sont lues sur le site public (et non sur l'adresse de la requête),
 * car les versions de test Vercel sont protégées par une connexion.
 */
export const POST: APIRoute = async ({ locals, redirect }) => {
  const supabase = locals.supabase!;
  const origine = import.meta.env.SITE ?? 'https://skm-la-fabrik.vercel.app';

  const [{ data: actusDb }, { data: projetsDb }] = await Promise.all([
    supabase.from('actualites').select('slug, cover_path'),
    supabase.from('projets').select('slug, cover_path, gallery'),
  ]);
  const actusExistantes = new Map((actusDb ?? []).map((r) => [r.slug as string, r]));
  const projetsExistants = new Map((projetsDb ?? []).map((r) => [r.slug as string, r]));

  let echecs = 0;
  const cache = new Map<string, string>();
  async function upload(src: string, folder: 'actualites' | 'projets', client: AdminClient): Promise<string | null> {
    if (cache.has(src)) return cache.get(src)!;
    try {
      const res = await fetch(new URL(src, origine), { signal: AbortSignal.timeout(20000) });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !type.startsWith('image/')) throw new Error('photo illisible');
      const name = slugify(src.split('/').pop()!.replace(/\.[^.]+$/, '').replace(/\.[A-Za-z0-9_-]{6,}$/, '')) || 'photo';
      const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('avif') ? 'avif' : 'jpg';
      const path = `${folder}/import-${name}.${ext}`;
      const { error } = await client.storage
        .from('medias')
        .upload(path, await res.arrayBuffer(), { contentType: type, upsert: true, cacheControl: '31536000' });
      if (error) throw error;
      cache.set(src, path);
      return path;
    } catch {
      echecs++;
      return null;
    }
  }

  for (const a of await getCollection('actualites')) {
    const d = a.data;
    const existante = actusExistantes.get(a.id);
    if (existante) {
      if (existante.cover_path) continue;
      const cover_path = await upload(d.cover.src, 'actualites', supabase);
      // La fiche avait été mise en brouillon faute de photo : on la remet comme sur le site.
      if (cover_path) await supabase.from('actualites').update({ cover_path, draft: d.draft }).eq('slug', a.id);
      continue;
    }
    const cover_path = await upload(d.cover.src, 'actualites', supabase);
    await supabase.from('actualites').insert({
      slug: a.id,
      title: d.title,
      type: d.type,
      date: d.date ? d.date.toISOString().slice(0, 10) : null,
      period: d.period,
      summary: d.summary,
      body: a.body ?? '',
      cover_path,
      cover_alt: d.coverAlt,
      cover_position: d.coverPosition,
      featured: d.featured,
      // Sans photo, une actualité n'est pas publiable : elle reste en brouillon.
      draft: cover_path ? d.draft : true,
    });
  }

  for (const p of await getCollection('projets')) {
    const d = p.data;
    const existant = projetsExistants.get(p.id);
    const aDesPhotos = Boolean(d.cover) || d.gallery.length > 0;
    if (existant && (existant.cover_path || (existant.gallery as unknown[]).length > 0)) continue;

    const gallery: { path: string; alt: string }[] = [];
    for (const g of d.gallery) {
      const path = await upload(g.src.src, 'projets', supabase);
      if (path) gallery.push({ path, alt: g.alt });
    }
    const cover_path = d.cover ? await upload(d.cover.src, 'projets', supabase) : null;
    const photosCompletes = gallery.length === d.gallery.length && (!d.cover || cover_path);

    if (existant) {
      if (!photosCompletes) continue; // on réessaiera plus tard, la fiche reste en brouillon
      await supabase.from('projets').update({ cover_path, gallery, draft: false }).eq('slug', p.id);
      continue;
    }
    await supabase.from('projets').insert({
      slug: p.id,
      title: d.title,
      category: d.category,
      period: d.period,
      year: d.year ?? null,
      place: d.place,
      partners: d.partners,
      summary: d.summary,
      body: p.body ?? '',
      cover_path,
      cover_alt: d.coverAlt ?? '',
      gallery,
      videos: d.videos,
      related_page: d.relatedPage ?? null,
      missing: d.missing,
      featured: d.featured,
      draft: aDesPhotos && !photosCompletes,
    });
  }

  return redirect(echecs > 0 ? '/admin?erreur=photos' : '/admin?ok=importe', 303);
};
