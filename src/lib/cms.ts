import { contenus } from '@/data/contenus';

// Fichier écrit au moment de la construction par scripts/sync-cms.mjs (absent sinon).
const fichiers = import.meta.glob<{ default: Record<string, string> }>('/src/.cms/contenus.json', { eager: true });
const valeurs = Object.values(fichiers)[0]?.default ?? {};

const defauts = new Map(contenus.map((c) => [c.key, c.value]));
const saisis = valeurs as Record<string, string>;

/** Texte d'une clé : valeur saisie dans l'admin, sinon texte d'origine. */
export function t(key: string): string {
  const v = saisis[key];
  if (typeof v === 'string' && v.trim() !== '') return v;
  const d = defauts.get(key);
  if (d === undefined) throw new Error(`Clé de contenu inconnue : ${key}`);
  return d;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Titre enrichi : [mots] en or (classe .accent), retour à la ligne = <br>. HTML échappé. */
export function richTitle(value: string): string {
  return value
    .split('\n')
    .map((line) => escapeHtml(line.trim()).replace(/\[([^\]]+)\]/g, '<span class="accent">$1</span>'))
    .join(' <br />');
}

export const tt = (key: string): string => richTitle(t(key));
