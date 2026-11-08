import type { ImageMetadata } from 'astro';
import { getCollection } from 'astro:content';
import type { GalleryItem } from '@/components/Gallery.astro';
import * as banque from '@/data/photos';
import { galerie } from '@/lib/galerie';

const estImage = (v: unknown): v is ImageMetadata =>
  typeof v === 'object' && v !== null && typeof (v as ImageMetadata).src === 'string' && typeof (v as ImageMetadata).width === 'number';

/** Toutes les photos { src, alt } d'une valeur (objet ou tableau), dans l'ordre. */
function photosDe(valeur: unknown, sortie: { src: ImageMetadata; alt: string }[] = []) {
  if (Array.isArray(valeur)) valeur.forEach((v) => photosDe(v, sortie));
  else if (typeof valeur === 'object' && valeur !== null) {
    const v = valeur as { src?: unknown; alt?: unknown };
    if (estImage(v.src) && typeof v.alt === 'string') sortie.push({ src: v.src, alt: v.alt });
    else if (!estImage(valeur)) Object.values(valeur).forEach((x) => photosDe(x, sortie));
  }
  return sortie;
}

/** Catégories de la galerie de l'admin ramenées à celles de cette page. */
const CATEGORIES: Record<string, string> = { Festivals: 'Rio Fresco Fest', Studio: 'Le lieu', Formations: 'Projets' };
const CONCERT = /concert|micro|rappeur|chanteuse|artiste|dj\b/i;
const FESTIVAL = /rio fresco|festival|loge des po[eè]tes|parade|calèche|digue|village/i;
const LIEU = /studio|skm la fabrik|co-working|cabine|clavier|enceinte|interface|orgue|couloir|affiche « nul|keyiam|mur d’affiches|cadres photo/i;

/**
 * Toutes les photos du site, pour la page Galerie : galerie de l'admin,
 * photos des projets et des actualités (contenu publié depuis l'admin),
 * puis photos du dépôt. Une même photo n'apparaît qu'une fois.
 */
export async function toutesLesPhotos(): Promise<GalleryItem[]> {
  const items: GalleryItem[] = [];
  const vus = new Set<string>();
  const ajouter = (src: ImageMetadata, alt: string, categorie: string, large = false) => {
    const cleAlt = alt.trim().toLowerCase();
    if (!alt.trim() || vus.has(src.src) || vus.has(cleAlt)) return;
    vus.add(src.src);
    vus.add(cleAlt);
    items.push({ src, alt, categorie, large });
  };

  for (const g of galerie) ajouter(g.src, g.alt, CATEGORIES[g.categorie ?? ''] ?? g.categorie ?? 'Communauté', Boolean(g.large));

  const projets = await getCollection('projets');
  projets.sort((a, b) => (b.data.year ?? 0) - (a.data.year ?? 0));
  for (const p of projets) {
    const categorie = p.data.category === 'Festivals' ? 'Rio Fresco Fest' : 'Projets';
    if (p.data.cover) ajouter(p.data.cover, p.data.coverAlt ?? p.data.title, categorie);
    for (const g of p.data.gallery) ajouter(g.src, g.alt, categorie);
  }

  const actualites = await getCollection('actualites', ({ data }) => !data.draft);
  for (const a of actualites) ajouter(a.data.cover, a.data.coverAlt, 'Actualités');

  for (const ph of photosDe(Object.values(banque))) {
    const categorie = FESTIVAL.test(ph.alt) ? 'Rio Fresco Fest' : LIEU.test(ph.alt) ? 'Le lieu' : CONCERT.test(ph.alt) ? 'Concerts' : 'Communauté';
    ajouter(ph.src, ph.alt, categorie);
  }
  return items;
}
