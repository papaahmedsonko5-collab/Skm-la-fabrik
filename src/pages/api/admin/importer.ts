import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { AdminClient } from '@/lib/admin/supabase';
import { slugify } from '@/lib/admin/data';

export const prerender = false;

/**
 * Import unique du contenu actuel du site (fichiers du dépôt) dans l'admin :
 * actualités, projets et leurs photos. Ne fait rien si l'admin contient déjà
 * des actualités ou des projets, pour ne jamais écraser une saisie.
 */
export const POST: APIRoute = async ({ locals, request, redirect }) => {
  const supabase = locals.supabase!;

  const [{ count: nA }, { count: nP }] = await Promise.all([
    supabase.from('actualites').select('id', { count: 'exact', head: true }),
    supabase.from('projets').select('id', { count: 'exact', head: true }),
  ]);
  if ((nA ?? 0) > 0 || (nP ?? 0) > 0) return redirect('/admin?erreur=import', 303);

  const cache = new Map<string, string>();
  async function upload(src: string, folder: 'actualites' | 'projets', client: AdminClient): Promise<string | null> {
    if (cache.has(src)) return cache.get(src)!;
    try {
      const res = await fetch(new URL(src, request.url), { signal: AbortSignal.timeout(20000) });
      if (!res.ok) return null;
      const type = res.headers.get('content-type') ?? 'image/jpeg';
      const name = slugify(src.split('/').pop()!.replace(/\.[^.]+$/, '').replace(/\.[A-Za-z0-9_-]{6,}$/, '')) || 'photo';
      const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
      const path = `${folder}/import-${name}.${ext}`;
      const { error } = await client.storage.from('medias').upload(path, await res.arrayBuffer(), { contentType: type, upsert: true, cacheControl: '31536000' });
      if (error) return null;
      cache.set(src, path);
      return path;
    } catch {
      return null;
    }
  }

  const actus = await getCollection('actualites');
  for (const a of actus) {
    const d = a.data;
    await supabase.from('actualites').insert({
      slug: a.id,
      title: d.title,
      type: d.type,
      date: d.date ? d.date.toISOString().slice(0, 10) : null,
      period: d.period,
      summary: d.summary,
      body: a.body ?? '',
      cover_path: await upload(d.cover.src, 'actualites', supabase),
      cover_alt: d.coverAlt,
      cover_position: d.coverPosition,
      featured: d.featured,
      draft: d.draft,
    });
  }

  const projets = await getCollection('projets');
  for (const p of projets) {
    const d = p.data;
    const gallery: { path: string; alt: string }[] = [];
    for (const g of d.gallery) {
      const path = await upload(g.src.src, 'projets', supabase);
      if (path) gallery.push({ path, alt: g.alt });
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
      cover_path: d.cover ? await upload(d.cover.src, 'projets', supabase) : null,
      cover_alt: d.coverAlt ?? '',
      gallery,
      videos: d.videos,
      related_page: d.relatedPage ?? null,
      missing: d.missing,
      featured: d.featured,
      draft: false,
    });
  }

  return redirect('/admin?ok=importe', 303);
};
