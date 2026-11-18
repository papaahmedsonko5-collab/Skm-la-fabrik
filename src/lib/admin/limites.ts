import { createRateLimiter } from '@/lib/rate-limit';

/**
 * Freins aux essais répétés sur la connexion de l'admin : 5 mots de passe puis
 * 5 codes à 6 chiffres par adresse IP et par quart d'heure. Complète les limites
 * de Supabase Auth (la mémoire est propre à chaque instance du serveur).
 */
export const essaisMotDePasse = createRateLimiter(5, 15 * 60 * 1000);
export const essaisCode = createRateLimiter(5, 15 * 60 * 1000);

export function messageAttente(secondes: number): string {
  const minutes = Math.max(1, Math.ceil(secondes / 60));
  return `Trop d’essais. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`;
}
