// Fichier écrit au début de la construction par scripts/sync-cms.mjs (absent sinon).
const fichiers = import.meta.glob<{ default: { lecture?: unknown } }>('/src/.cms/build.json', { eager: true });
const brut = Object.values(fichiers)[0]?.default?.lecture;

/** Heure à laquelle la version en ligne a lu le contenu de l'admin, ou null. Indicatif seulement. */
export const lectureBuild: string | null = typeof brut === 'string' && !Number.isNaN(Date.parse(brut)) ? brut : null;
