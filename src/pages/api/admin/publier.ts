import type { APIRoute } from 'astro';
import { DEPLOY_HOOK_URL } from 'astro:env/server';
import { formulaireDepuis, lireCorps } from '@/lib/corps';
import { adresseRetour, publier, type ClientRpc } from '@/lib/admin/publication';

export const prerender = false;

/**
 * Déclenche une nouvelle mise en ligne du site (Vercel Deploy Hook), au plus une à la fois.
 * Réservation en base avant l'appel, issue enregistrée après : voir src/lib/admin/publication.ts.
 */
export const POST: APIRoute = async ({ locals, request, redirect }) => {
  if (!DEPLOY_HOOK_URL) return redirect('/admin?erreur=hook', 303);

  const lu = await lireCorps(request, 2000);
  const form = lu.ok ? await formulaireDepuis(lu.octets, request.headers.get('content-type')) : null;
  const cle = form?.get('cle');
  const retour = await publier(locals.supabase as unknown as ClientRpc, typeof cle === 'string' ? cle : '', DEPLOY_HOOK_URL);
  if (retour.code === 'requete_invalide') {
    return new Response('Requête invalide. Rechargez le tableau de bord.', {
      status: 400,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }
  return redirect(adresseRetour(retour), 303);
};
