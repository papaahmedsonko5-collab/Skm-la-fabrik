import type { CollectionEntry } from 'astro:content';
import { projectCategories } from '@/content.config';

type News = CollectionEntry<'actualites'>;
type Project = CollectionEntry<'projets'>;

/** Actualités : la une d'abord, puis par date de publication décroissante. */
export function sortNews(entries: News[]): News[] {
  return [...entries].sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    return (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0);
  });
}

/** Projets : mis en avant d'abord, puis par année décroissante, années inconnues en dernier. */
export function sortProjects(entries: Project[]): Project[] {
  const order = new Map<string, number>(projectCategories.map((c, i) => [c, i]));
  return [...entries].sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    const ya = a.data.year ?? -1;
    const yb = b.data.year ?? -1;
    if (ya !== yb) return yb - ya;
    return (order.get(a.data.category) ?? 0) - (order.get(b.data.category) ?? 0);
  });
}
