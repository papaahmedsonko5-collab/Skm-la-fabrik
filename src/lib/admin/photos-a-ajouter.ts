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
  // Envoyées le 8 novembre 2026 : Handischool Day (école Le Petit Prince) et visite du Musée des Civilisations noires (Nio Far).
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-2024-accueil.jpg',
    alt: 'Trois membres de l’équipe et de l’école posent dans le couloir de l’école Le Petit Prince',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-2024-atelier-cercle.jpg',
    alt: 'Atelier en cercle : un animateur de Sunu Kaddu assis au sol au milieu des enfants',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-2024-atelier-classe.jpg',
    alt: 'Enfants, familles et équipe réunis en cercle dans une salle de classe pendant un atelier',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-2024-photo-groupe.jpg',
    alt: 'Photo de groupe des enfants, de l’équipe et des invités dans la cour de l’école',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-2024-repas.jpg',
    alt: 'Préparation des repas offerts aux enfants pendant la journée',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-2024-don-ordinateurs.jpg',
    alt: 'Un membre de l’équipe Sunu Kaddu déballe les ordinateurs portables offerts à l’école',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-2024-prestation-artiste.jpg',
    alt: 'Prestation d’un artiste au micro dans la cour de l’école Le Petit Prince',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-2024-ordinateurs-offerts.jpg',
    alt: 'Les ordinateurs portables offerts pour la salle informatique, posés sur leurs cartons',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'handischool-day',
    fichier: 'handischool-day-2024-percussions.jpg',
    alt: 'Percussions et danse dans une salle de classe pendant le Handischool Day',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-atlantites.jpg',
    alt: 'Élèves en visite devant l’exposition « Atlantités » au Musée des Civilisations noires',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-entree.jpg',
    alt: 'Élèves en uniforme au contrôle d’entrée du Musée des Civilisations noires',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-cyanotypes.jpg',
    alt: 'Élèves devant une série de cyanotypes exposés au musée',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-hall.jpg',
    alt: 'Arrivée des élèves dans le hall du Musée des Civilisations noires',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-salles.jpg',
    alt: 'Élèves du lycée Seydina Limamoulaye dans les salles d’exposition',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-grand-hall.jpg',
    alt: 'Groupe d’élèves dans le grand hall du musée, près du mur de portraits',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-galeries.jpg',
    alt: 'Un accompagnateur et deux élèves dans les galeries du musée',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-ombres.jpg',
    alt: 'Élèves jouant avec leurs ombres sur une projection vidéo',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-ombres-mains.jpg',
    alt: 'Ombres de mains sur une installation vidéo pendant la visite',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-projection.jpg',
    alt: 'Élèves devant une projection vidéo dans une salle sombre',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-noo-far.jpg',
    alt: 'Membre de l’équipe en tee-shirt « Ñoo far, We are together » devant une installation vidéo',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-tapisserie.jpg',
    alt: 'Une médiatrice présente une tapisserie aux élèves',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-peinture-masques.jpg',
    alt: 'Élèves en uniforme écoutant un médiateur devant une peinture de masques',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-salle-projection.jpg',
    alt: 'Élèves alignés le long du mur d’une salle de projection',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
  },
  {
    slug: 'concours-art-scolaire-2024',
    fichier: 'nio-far-musee-2024-parvis.jpg',
    alt: 'Arrivée des élèves et d’un accompagnateur sur le parvis du musée',
    role: 'galerie',
    depuis: '2026-11-08T20:00:00Z',
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
