import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { existsSync } from 'node:fs';

/** Contenu publié depuis l'admin (scripts/sync-cms.mjs), sinon fichiers du dépôt. */
const base = (name: 'projets' | 'actualites') => (existsSync(`./src/.cms/${name}`) ? `./src/.cms/${name}` : `./src/content/${name}`);

export const projectCategories = [
  'Festivals',
  'Événements',
  'Productions musicales',
  'Formations',
  'Initiatives communautaires',
] as const;

export const newsTypes = ['Actualité', 'Annonce', 'Reportage', 'Événement'] as const;

const video = z.object({
  title: z.string(),
  url: z.url({ protocol: /^https$/ }),
});

const projets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: base('projets') }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(projectCategories),
      /** Libellé affiché (« 2015 », « 10 – 14 juin 2026 », « [Année à préciser] »). */
      period: z.string(),
      /** Année de tri. Laisser vide si inconnue. */
      year: z.number().int().min(2000).max(2100).optional(),
      place: z.string(),
      partners: z.array(z.string()).default([]),
      summary: z.string().max(180),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      gallery: z.array(z.object({ src: image(), alt: z.string() })).default([]),
      videos: z.array(video).default([]),
      /** Lien vers une page dédiée du site, si elle existe (ex. /rio-fresco-fest). */
      relatedPage: z.string().startsWith('/').optional(),
      /** Champs restant à documenter, affichés en interne dans la fiche. */
      missing: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
    }),
});

const actualites = defineCollection({
  loader: glob({ pattern: '**/*.md', base: base('actualites') }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      type: z.enum(newsTypes),
      /** Date de publication. Laisser vide tant qu'elle n'est pas fixée. */
      date: z.coerce.date().optional(),
      /** Repère temporel du sujet traité (ex. « Juin 2026 »). */
      period: z.string(),
      summary: z.string().max(220),
      cover: image(),
      coverAlt: z.string(),
      /** Point focal CSS (object-position) quand la photo est recadrée, ex. « center 15% ». */
      coverPosition: z.string().regex(/^[a-z0-9% .]+$/).default('center'),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projets, actualites };
