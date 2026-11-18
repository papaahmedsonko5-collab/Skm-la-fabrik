/**
 * Comparaison de deux textes en durée constante : le temps de réponse ne
 * dépend pas du nombre de caractères identiques, ce qui ne laisse rien
 * deviner d'un secret (lien d'entrée de l'admin, secret du cron).
 */
export function egal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
