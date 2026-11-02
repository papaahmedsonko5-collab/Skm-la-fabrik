/**
 * Apparition douce des blocs marqués `data-reveal` lorsqu'ils entrent dans
 * l'écran. Sans JavaScript, ou si l'utilisateur limite les animations,
 * tout reste visible immédiatement.
 */
export function initReveal(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (items.length === 0) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => observer.observe(el));
}
