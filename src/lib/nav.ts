/** Indique si un lien de navigation correspond à la page courante (ou à une sous-page). */
export function isActive(currentPath: string, href: string): boolean {
  const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);
  const current = clean(currentPath);
  const target = clean(href);
  if (target === '/') return current === '/';
  return current === target || current.startsWith(`${target}/`);
}
