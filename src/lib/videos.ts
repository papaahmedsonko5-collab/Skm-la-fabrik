import type { ImageMetadata } from 'astro';
import { photos } from '@/data/photos';

export interface VideoSite {
  titre: string;
  id: string;
  type: 'video' | 'playlist';
  categorie: string;
  poster: ImageMetadata;
}

// Écrits au moment de la construction par scripts/sync-cms.mjs (absents sinon).
const liste = import.meta.glob<{ default: { titre: string; id: string; type: 'video' | 'playlist'; categorie: string; poster: string | null }[] }>(
  '/src/.cms/videos.json',
  { eager: true },
);
const vignettes = import.meta.glob<{ default: ImageMetadata }>('/src/.cms/medias/videos/*.jpg', { eager: true });

/** Vidéos choisies dans l'admin (vide tant qu'aucune n'est publiée). */
export const videos: VideoSite[] = (Object.values(liste)[0]?.default ?? []).map((v) => ({
  ...v,
  poster: (v.poster && vignettes[`/src/.cms/${v.poster}`]?.default) || photos.sceneNuit.src,
}));
