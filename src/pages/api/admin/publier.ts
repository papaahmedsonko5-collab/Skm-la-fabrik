import type { APIRoute } from 'astro';
import { DEPLOY_HOOK_URL } from 'astro:env/server';

export const prerender = false;

/** Déclenche une nouvelle mise en ligne du site (Vercel Deploy Hook). */
export const POST: APIRoute = async ({ locals, redirect }) => {
  const supabase = locals.supabase!;
  const email = locals.admin?.email ?? '';
  if (!DEPLOY_HOOK_URL) return redirect('/admin?erreur=hook', 303);

  let ok: boolean;
  try {
    const res = await fetch(DEPLOY_HOOK_URL, { method: 'POST', signal: AbortSignal.timeout(8000) });
    ok = res.ok;
  } catch {
    ok = false;
  }
  await supabase.from('publications').insert({ user_email: email, ok });
  return redirect(ok ? '/admin?ok=publie' : '/admin?erreur=publication', 303);
};
