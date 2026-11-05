import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { AdminClient } from '@/lib/admin/supabase';
import { slugify } from '@/lib/admin/data';
import { galerieDepot } from '@/lib/galerie';
import { cheminImport, photosEnAttente } from '@/lib/admin/photos-a-ajouter';
import { BilanImport, televerser, type ClientStockage } from '@/lib/admin/medias';
import { lireImage, MESSAGE_REFUS } from '@/lib/images';

export const prerender = false;

/**
 * Import du contenu actuel du site (fichiers du dépôt) dans l'admin :
 * actualités, projets et leurs photos, et la galerie photo.
 *
 * - Admin vide : crée les fiches.
 * - Fiches déjà importées mais sans photo (import interrompu) : ajoute
 *   seulement les photos manquantes, sans toucher au reste de la fiche.
 * - Galerie vide : copie les photos de la galerie actuelle.
 * Une fiche qui a déjà une photo n'est jamais modifiée.
 *
 * Chaque photo est lue avec une limite de 15 Mo et vérifiée sur son contenu
 * réel. Chaque réponse de Supabase est contrôlée : le tableau de bord affiche
 * un bilan (réussis / en échec) et jamais « importé » si une partie a échoué.
 *
 * Les photos sont lues sur le site public (et non sur l'adresse de la requête),
 * car les versions de test Vercel sont protégées par une connexion.
 */
export const POST: APIRoute = async ({ locals, redirect }) => {
  const supabase = locals.supabase!;
  const origine = import.meta.env.SITE ?? 'https://www.skmlafabrik.com';

  const bilan = new BilanImport();
  const [lectureActus, lectureProjets, lecturePhotos] = await Promise.all([
    supabase.from('actualites').select('slug, cover_path'),
    supabase.from('projets').select('slug, cover_path, gallery, updated_at'),
    supabase.from('photos').select('id', { count: 'exact', head: true }),
  ]);
  // Sans état initial fiable, on n'écrit rien : on risquerait des doublons ou d'écraser une fiche.
  if (lectureActus.error || lectureProjets.error || lecturePhotos.error) {
    console.error('[importer] Lecture initiale refusée', lectureActus.error?.message ?? lectureProjets.error?.message ?? lecturePhotos.error?.message);
    return redirect('/admin?erreur=import_lecture', 303);
  }
  const actusDb = lectureActus.data;
  const projetsDb = lectureProjets.data;
  const nPhotos = lecturePhotos.count;
  const actusExistantes = new Map((actusDb ?? []).map((r) => [r.slug as string, r]));
  const projetsExistants = new Map((projetsDb ?? []).map((r) => [r.slug as string, r]));

  const cache = new Map<string, string>();
  /** Copie une photo du site public dans le stockage. Renvoie son chemin, ou null (échec noté dans le bilan). */
  async function upload(src: string, folder: 'actualites' | 'projets' | 'galerie', client: AdminClient): Promise<string | null> {
    if (cache.has(src)) return cache.get(src)!;
    const name = slugify(src.split('/').pop()!.replace(/\.[^.]+$/, '').replace(/\.[A-Za-z0-9_-]{6,}$/, '')) || 'photo';
    let res: Response;
    try {
      res = await fetch(new URL(src, origine), { signal: AbortSignal.timeout(20000) });
    } catch {
      bilan.echec(`${folder}/${name}`, 'photo injoignable');
      return null;
    }
    const image = await lireImage(res);
    if (!image.ok) {
      bilan.echec(`${folder}/${name}`, MESSAGE_REFUS[image.raison]);
      return null;
    }
    const envoi = await televerser(client as unknown as ClientStockage, `${folder}/import-${name}.${image.ext}`, image, true);
    if (!envoi.ok) {
      bilan.echec(`${folder}/${name}`, `stockage : ${envoi.detail}`);
      return null;
    }
    cache.set(src, envoi.path);
    return envoi.path;
  }

  for (const a of await getCollection('actualites')) {
    const d = a.data;
    const existante = actusExistantes.get(a.id);
    if (existante) {
      if (existante.cover_path) continue;
      const cover_path = await upload(d.cover.src, 'actualites', supabase);
      // La fiche avait été mise en brouillon faute de photo : on la remet comme sur le site.
      if (cover_path) {
        const { error } = await supabase.from('actualites').update({ cover_path, draft: d.draft }).eq('slug', a.id);
        if (!bilan.verifier(`actualite/${a.id}`, error)) bilan.reussi(`actualite/${a.id}`);
      }
      continue;
    }
    const cover_path = await upload(d.cover.src, 'actualites', supabase);
    const { error: erreurActu } = await supabase.from('actualites').insert({
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
    // Sans photo, la fiche est créée en brouillon : c'est un import incomplet, déjà compté par upload().
    if (!bilan.verifier(`actualite/${a.id}`, erreurActu) && cover_path) bilan.reussi(`actualite/${a.id}`);
  }

  for (const p of await getCollection('projets')) {
    const d = p.data;
    const existant = projetsExistants.get(p.id);
    const aDesPhotos = Boolean(d.cover) || d.gallery.length > 0;
    if (existant && (!aDesPhotos || existant.cover_path || (existant.gallery as unknown[]).length > 0)) continue;

    const gallery: { path: string; alt: string }[] = [];
    for (const g of d.gallery) {
      const path = await upload(g.src.src, 'projets', supabase);
      if (path) gallery.push({ path, alt: g.alt });
    }
    const cover_path = d.cover ? await upload(d.cover.src, 'projets', supabase) : null;
    const photosCompletes = gallery.length === d.gallery.length && (!d.cover || cover_path);

    if (existant) {
      if (!photosCompletes) continue; // on réessaiera plus tard, la fiche reste en brouillon (échec déjà compté)
      const { error } = await supabase.from('projets').update({ cover_path, gallery, draft: false }).eq('slug', p.id);
      if (!bilan.verifier(`projet/${p.id}`, error)) bilan.reussi(`projet/${p.id}`);
      continue;
    }
    const { error: erreurProjet } = await supabase.from('projets').insert({
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
    if (!bilan.verifier(`projet/${p.id}`, erreurProjet) && photosCompletes) bilan.reussi(`projet/${p.id}`);
  }

  if ((nPhotos ?? 0) === 0) {
    let position = 1;
    for (const ph of galerieDepot) {
      const path = await upload(ph.src.src, 'galerie', supabase);
      if (!path) continue;
      const { error } = await supabase
        .from('photos')
        .insert({ path, alt: ph.alt, categorie: ph.categorie ?? 'Événements', large: Boolean(ph.large), position: position++ });
      if (!bilan.verifier(path, error)) bilan.reussi(path);
    }
  }

  // Photos de projets envoyées par l'équipe (public/import/projets).
  // État lu avant l'import : une fiche modifiée à la main depuis l'envoi n'est pas touchée.
  const lectureFiches = await supabase.from('projets').select('slug, cover_path, gallery, updated_at');
  const attente = photosEnAttente((projetsDb ?? []) as Parameters<typeof photosEnAttente>[0]);
  if (attente.length > 0 && bilan.verifier('photos-en-attente', lectureFiches.error)) {
    // Fiches illisibles : on ne touche pas aux photos en attente, elles seront reprises au prochain import.
  } else {
    const fiches = lectureFiches.data ?? [];
    for (const slug of new Set(attente.map((ph) => ph.slug))) {
      const fiche = fiches.find((f) => f.slug === slug);
      if (!fiche) {
        bilan.echec(`projet/${slug}`, 'fiche introuvable');
        continue;
      }
      let cover_path = fiche.cover_path as string | null;
      const gallery = [...((fiche.gallery as { path: string; alt: string }[]) ?? [])];
      let ajoutees = 0;
      for (const ph of attente.filter((x) => x.slug === slug)) {
        let res: Response;
        try {
          res = await fetch(new URL(`/import/projets/${ph.fichier}`, origine), { signal: AbortSignal.timeout(20000) });
        } catch {
          bilan.echec(ph.fichier, 'photo injoignable');
          continue;
        }
        const image = await lireImage(res);
        if (!image.ok) {
          bilan.echec(ph.fichier, MESSAGE_REFUS[image.raison]);
          continue;
        }
        // Chemin inchangé (déjà référencé par les fiches) ; type réel du contenu.
        const envoi = await televerser(supabase as unknown as ClientStockage, cheminImport(ph.fichier), image, true);
        if (!envoi.ok) {
          bilan.echec(ph.fichier, `stockage : ${envoi.detail}`);
          continue;
        }
        if (ph.role === 'couverture') cover_path = envoi.path;
        else gallery.push({ path: envoi.path, alt: ph.alt });
        ajoutees++;
      }
      if (ajoutees === 0) continue;
      const { error } = await supabase.from('projets').update({ cover_path, gallery }).eq('slug', slug);
      if (!bilan.verifier(`projet/${slug}`, error)) bilan.reussi(`projet/${slug}`);
    }
  }

  if (!bilan.complet) console.error('[importer] Import incomplet', JSON.stringify(bilan.echecs));
  return redirect(`/admin?${bilan.parametres().toString()}`, 303);
};
