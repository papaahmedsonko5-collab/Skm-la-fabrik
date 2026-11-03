/**
 * Mesure d'audience sans cookie : fonctions pures utilisées par /api/visite
 * (et testées dans tests/visites.test.ts).
 */

const ROBOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch|go-http/i;

export function estRobot(userAgent: string): boolean {
  return !userAgent || ROBOTS.test(userAgent);
}

export type Appareil = 'mobile' | 'tablette' | 'ordinateur';

export function appareilDe(userAgent: string): Appareil {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return 'tablette';
  if (/mobi|iphone|ipod|android/i.test(userAgent)) return 'mobile';
  return 'ordinateur';
}

/** Chemin propre (sans paramètres ni barre finale), ou null s'il ne doit pas être compté. */
export function cheminValide(brut: unknown): string | null {
  if (typeof brut !== 'string' || !brut.startsWith('/') || brut.startsWith('//')) return null;
  let chemin = brut.split(/[?#]/)[0] ?? '';
  try {
    chemin = decodeURI(chemin);
  } catch {
    return null;
  }
  chemin = chemin.replace(/\/+$/, '') || '/';
  if (chemin.length > 200 || /[\s<>"'\\]/.test(chemin)) return null;
  if (/^\/(admin|api|_image|_astro|import)(\/|$)/.test(chemin)) return null;
  return chemin;
}

/** Nom du site d'où vient le visiteur ('' : accès direct ou navigation interne). */
export function provenanceDe(referrer: unknown, hoteDuSite: string): string {
  if (typeof referrer !== 'string' || referrer === '') return '';
  try {
    const url = new URL(referrer);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    const hote = url.hostname.toLowerCase().replace(/^www\.|^m\.|^l\.|^lm\./, '');
    if (hote === hoteDuSite.toLowerCase().replace(/^www\./, '')) return '';
    return hote.slice(0, 100);
  } catch {
    return '';
  }
}

/** Hachage SHA-256 hexadécimal (l'adresse IP n'est jamais transmise en clair à la base). */
export async function empreinte(...parties: string[]): Promise<string> {
  const donnees = new TextEncoder().encode(parties.join('|'));
  const hash = await crypto.subtle.digest('SHA-256', donnees);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Libellés lisibles des pages du site pour l'admin. */
const LIBELLES: Record<string, string> = {
  '/': 'Accueil',
  '/a-propos': 'À propos',
  '/activites': 'Activités',
  '/projets': 'Projets',
  '/rio-fresco-fest': 'Rio Fresco Fest',
  '/sunu-kaddu-music': 'Sunu Kaddu Music',
  '/impact': 'Impact',
  '/actualites': 'Actualités',
  '/contact': 'Contact',
  '/faq': 'Questions fréquentes',
  '/confidentialite': 'Confidentialité',
  '/mentions-legales': 'Mentions légales',
  '/conditions-utilisation': 'Conditions d’utilisation',
};

export function libellePage(chemin: string): string {
  if (LIBELLES[chemin]) return LIBELLES[chemin];
  const m = chemin.match(/^\/(projets|actualites)\/(.+)$/);
  if (m) return `${m[1] === 'projets' ? 'Projet' : 'Actualité'} : ${m[2]!.replace(/-/g, ' ')}`;
  return chemin;
}
