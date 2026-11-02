import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from 'astro:env/server';

export const supabaseConfigured = Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_PUBLISHABLE_KEY);

/**
 * Client Supabase lié à la requête : la session de l'admin voyage dans des
 * cookies httpOnly. Toutes les lectures et écritures passent par les règles RLS.
 */
export function supabaseForRequest(request: Request, cookies: AstroCookies) {
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Supabase non configuré (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_PUBLISHABLE_KEY).');
  }
  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('cookie') ?? '').map(({ name, value }) => ({ name, value: value ?? '' }));
      },
      setAll(list) {
        for (const { name, value, options } of list) {
          cookies.set(name, value, { ...options, path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
        }
      },
    },
  });
}

export type AdminClient = ReturnType<typeof supabaseForRequest>;

/** URL publique d'un fichier du stockage « medias ». */
export function mediaUrl(path: string): string {
  return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/medias/${path.split('/').map(encodeURIComponent).join('/')}`;
}
