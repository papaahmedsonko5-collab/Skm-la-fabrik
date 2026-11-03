import { defineMiddleware } from 'astro:middleware';
import { ADMIN_ENTREE } from 'astro:env/server';
import { supabaseConfigured, supabaseForRequest } from '@/lib/admin/supabase';

/** Pages de connexion (étape 1 : mot de passe ; étape 2 : code de l'application). */
const ETAPE_1 = '/admin/connexion';
const ETAPE_1_PAGES = new Set([ETAPE_1, '/admin/mot-de-passe-oublie']);
/** Arrivée depuis l'e-mail « mot de passe oublié ». */
const RETOUR = '/admin/retour';
const COOKIE_REINIT = 'skm_admin_reinit';
const ETAPE_2 = new Set(['/admin/verification', '/admin/securite', '/admin/deconnexion']);
const COOKIE_ENTREE = 'skm_admin_entree';

async function empreinte(valeur: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`skm-admin:${valeur}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Comparaison à durée constante, pour ne rien révéler du lien secret. */
function egal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Garde de l'espace d'administration.
 *
 * - Un visiteur sans session ne voit rien : toute adresse /admin répond
 *   « page introuvable », comme une page qui n'existe pas. Seul le lien secret
 *   (/admin?cle=… , valeur ADMIN_ENTREE dans Vercel) ouvre la page de connexion
 *   sur l'appareil utilisé.
 * - Après le mot de passe, le code de l'application d'authentification est
 *   obligatoire (double authentification). La base refuse aussi toute écriture
 *   sans ce second facteur.
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

  // Réponse identique à celle d'une adresse qui n'existe pas.
  const introuvable = async () => {
    let html = '<!doctype html><title>Page introuvable</title><p>Page introuvable.</p>';
    try {
      const r = await fetch(new URL('/404.html', context.url), { signal: AbortSignal.timeout(3000) });
      if (r.ok) html = await r.text();
    } catch {
      /* page de secours ci-dessus */
    }
    return finish(new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }));
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
    return introuvable();
  }

  const supabase = supabaseForRequest(context.request, context.cookies);
  context.locals.supabase = supabase;

  // Lien reçu par e-mail (avant toute lecture de session, qui effacerait la preuve) : il n'est valable que dans le navigateur qui a fait
  // la demande (preuve gardée dans un cookie). Sinon, page introuvable.
  if (pathname === RETOUR) {
    const code = context.url.searchParams.get('code');
    if (!code) return introuvable();
    const flowId = context.url.searchParams.get('sb_flow_id');
    const { error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    if (error) return introuvable();
    if (ADMIN_ENTREE) {
      context.cookies.set(COOKIE_ENTREE, await empreinte(ADMIN_ENTREE), {
        path: '/admin',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    // Le nouveau mot de passe sera demandé après le code de sécurité.
    context.cookies.set(COOKIE_REINIT, '1', { path: '/admin', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 30 });
    return finish(context.redirect('/admin/verification', 303));
  }
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    if (ADMIN_ENTREE) {
      const attendu = await empreinte(ADMIN_ENTREE);
      const cle = context.url.searchParams.get('cle');
      if (pathname === '/admin' && cle && egal(await empreinte(cle), attendu)) {
        // Mémorise l'appareil 30 jours : la connexion y reste accessible.
        context.cookies.set(COOKIE_ENTREE, attendu, { path: '/admin', httpOnly: true, secure: true, sameSite: 'strict', maxAge: 60 * 60 * 24 * 30 });
        return finish(context.redirect(ETAPE_1, 303));
      }
      const memorise = context.cookies.get(COOKIE_ENTREE)?.value ?? '';
      if (!egal(memorise, attendu)) return introuvable();
    }
    if (ETAPE_1_PAGES.has(pathname)) return finish(await next());
    if (pathname.startsWith('/api/admin/')) return introuvable();
    return finish(context.redirect(ETAPE_1, 303));
  }

  // Session ouverte : le compte doit être dans la liste des admins.
  const { data: inscrit } = await supabase.rpc('est_admin_inscrit');
  if (inscrit !== true) {
    await supabase.auth.signOut();
    return introuvable();
  }

  // Double authentification obligatoire.
  const { data: niveau } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (niveau?.currentLevel !== 'aal2') {
    if (ETAPE_2.has(pathname)) return finish(await next());
    if (pathname.startsWith('/api/admin/')) {
      return finish(new Response(JSON.stringify({ ok: false, message: 'Code de sécurité requis.' }), { status: 401, headers: { 'content-type': 'application/json' } }));
    }
    return finish(context.redirect(niveau?.nextLevel === 'aal2' ? '/admin/verification' : '/admin/securite', 303));
  }

  if (ETAPE_1_PAGES.has(pathname) || pathname === RETOUR || pathname === '/admin/configuration') return finish(context.redirect('/admin', 303));
  context.locals.admin = { id: user.id, email: user.email ?? '' };
  return finish(await next());
});
