import type { ImageMetadata } from 'astro';
import { photos } from '@/data/photos';
import type { GalleryItem } from '@/components/Gallery.astro';

// Écrits au moment de la construction par scripts/sync-cms.mjs (absents sinon).
const liste = import.meta.glob<{ default: { file: string; alt: string; categorie: string; large: boolean }[] }>('/src/.cms/photos.json', {
  eager: true,
});
const images = import.meta.glob<{ default: ImageMetadata }>('/src/.cms/medias/galerie/*.{jpg,jpeg,png,webp,avif}', { eager: true });

/** Galerie d'origine, utilisée tant que la galerie de l'admin est vide. */
export const galerieDepot: GalleryItem[] = [
  { ...photos.rffFoule, large: true, categorie: 'Festivals' },
  { ...photos.studio, categorie: 'Studio' },
  { ...photos.formation, categorie: 'Formations' },
  { ...photos.scene2, categorie: 'Concerts' },
  { ...photos.scene3, categorie: 'Concerts' },
  { ...photos.defile, large: true, categorie: 'Festivals' },
  { ...photos.echecs, categorie: 'Festivals' },
  { ...photos.handischool, categorie: 'Communauté' },
  { ...photos.setSetal, categorie: 'Communauté' },
  { ...photos.chanteuse, categorie: 'Concerts' },
];

function depuisAdmin(): GalleryItem[] | null {
  const entrees = Object.values(liste)[0]?.default;
  if (!entrees || entrees.length === 0) return null;
  const items: GalleryItem[] = [];
  for (const e of entrees) {
    const img = images[`/src/.cms/${e.file}`]?.default;
    if (img) items.push({ src: img, alt: e.alt, large: e.large, categorie: e.categorie });
  }
  return items.length > 0 ? items : null;
}

/** Photos de la galerie : celles de l'admin si elles existent, sinon celles du dépôt. */
export const galerie: GalleryItem[] = depuisAdmin() ?? galerieDepot;
