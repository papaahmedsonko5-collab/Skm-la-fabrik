/**
 * Limiteur de débit en mémoire (fenêtre glissante). Sur Vercel, chaque instance
 * de fonction garde sa propre mémoire : c'est une protection de premier niveau
 * contre les envois répétés, complétée par le champ piège et le délai minimal.
 */
export interface RateLimiter {
  /** Enregistre une tentative et indique si elle est autorisée. */
  hit(key: string, now?: number): { allowed: boolean; retryAfter: number };
}

export function createRateLimiter(max: number, windowMs: number, maxKeys = 5000): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    hit(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        const oldest = recent[0] ?? now;
        return { allowed: false, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
      }
      recent.push(now);
      hits.delete(key);
      hits.set(key, recent);
      if (hits.size > maxKeys) {
        const first = hits.keys().next().value;
        if (first !== undefined) hits.delete(first);
      }
      return { allowed: true, retryAfter: 0 };
    },
  };
}

/** Adresse IP du visiteur d'après les en-têtes posés par Vercel. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || 'inconnu';
}
