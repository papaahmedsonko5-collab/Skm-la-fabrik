/**
 * Photos de projets reçues hors de l'admin (envoyées par l'équipe), à copier
 * dans l'admin avec le bouton « Récupérer les photos » du tableau de bord.
 *
 * Les fichiers sont dans public/import/projets/. Une photo n'est ajoutée que si
 * la fiche n'a pas été modifiée depuis `depuis` : une photo retirée ensuite à la
 * main n'est donc jamais remise.
 */
export interface PhotoAAjouter {
  slug: string;
  fichier: string;
  alt: string;
  role: 'couverture' | 'galerie';
  depuis: string;
}

export const photosAAjouter: PhotoAAjouter[] = [
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-groupe-2024.jpg',
    alt: 'Photo de groupe des enfants, de l’équipe Sunu Kaddu et des invités dans la cour de l’école Le Petit Prince',
    role: 'galerie',
    depuis: '2026-11-03T09:05:00Z',
  },
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-affiche-2024.jpg',
    alt: 'Affiche du Handi School Day du 24 mai 2024 à l’école inclusive Le Petit Prince',
    role: 'galerie',
    depuis: '2026-11-03T09:05:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-atelier-lycee-2024.jpg',
    alt: 'Élèves d’un lycée de Rufisque avec l’équipe du concours, dessins en main, dans leur salle de classe',
    role: 'couverture',
    depuis: '2026-11-03T09:05:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-exposition-2024.jpg',
    alt: 'Élèves participants et organisateurs réunis lors de l’exposition des œuvres',
    role: 'galerie',
    depuis: '2026-11-03T09:05:00Z',
  },
];

/** Chemin de stockage donné à la photo une fois copiée. */
export const cheminImport = (fichier: string) => `projets/import-${fichier.replace(/\.[^.]+$/, '')}.jpg`;

type Fiche = { slug: string; cover_path: string | null; gallery: unknown; updated_at: string };

/** Photos de la liste qui restent à copier pour ces fiches. */
export function photosEnAttente(fiches: Fiche[]): PhotoAAjouter[] {
  return photosAAjouter.filter((ph) => {
    const f = fiches.find((x) => x.slug === ph.slug);
    if (!f || new Date(f.updated_at) >= new Date(ph.depuis)) return false;
    if (ph.role === 'couverture') return !f.cover_path;
    return !((f.gallery as { path: string }[]) ?? []).some((g) => g.path === cheminImport(ph.fichier));
  });
}
