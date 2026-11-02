import { defineMiddleware } from 'astro:middleware';
import { supabaseConfigured, supabaseForRequest } from '@/lib/admin/supabase';

const PUBLIC_ADMIN = new Set(['/admin/connexion', '/admin/configuration']);

/**
 * Garde de l'espace d'administration : toute page /admin (et /api/admin) exige
 * une session Supabase valide ET une ligne dans la table `admins`.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');
  if (!isAdmin || context.isPrerendered) return next();

  const finish = (res: Response) => {
    res.headers.set('cache-control', 'no-store');
    res.headers.set('x-robots-tag', 'noindex, nofollow');
    return res;
  };

  // Formulaires de l'admin : refuse les envois venant d'un autre site (CSRF).
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    const origin = context.request.headers.get('origin');
    if (!origin || new URL(origin).host !== context.url.host) {
      return finish(new Response('Origine non autorisée.', { status: 403 }));
    }
  }

  if (!supabaseConfigured) {
    if (pathname === '/admin/configuration') return finish(await next());
    return finish(context.redirect('/admin/configuration', 303));
  }

  const supabase = supabaseForRequest(context.request, context.cookies);
  context.locals.supabase = supabase;

  if (PUBLIC_ADMIN.has(pathname)) return finish(await next());

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  let allowed = false;
  if (user) {
    const { data: ok } = await supabase.rpc('is_admin');
    allowed = ok === true;
  }
  if (!user || !allowed) {
    if (pathname.startsWith('/api/admin/')) {
      return finish(new Response(JSON.stringify({ ok: false, message: 'Non autorisé.' }), { status: 401, headers: { 'content-type': 'application/json' } }));
    }
    const to = new URL('/admin/connexion', context.url);
    if (user && !allowed) to.searchParams.set('erreur', 'acces');
    else if (pathname !== '/admin') to.searchParams.set('suite', pathname);
    return finish(context.redirect(to.pathname + to.search, 303));
  }

  context.locals.admin = { id: user.id, email: user.email ?? '' };
  return finish(await next());
});
