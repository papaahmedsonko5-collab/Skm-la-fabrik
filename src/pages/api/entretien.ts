import type { APIRoute } from 'astro';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from 'astro:env/server';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

/**
 * Tâche quotidienne (vercel.json › crons) : efface les données arrivées à
 * échéance et, par la même occasion, garde le projet Supabase actif (un
 * projet gratuit sans activité pendant 7 jours est mis en pause).
 * Sans risque si quelqu'un d'autre l'appelle : elle n'efface que ce qui a
 * dépassé la durée de conservation.
 */
export const GET: APIRoute = async () => {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return new Response(JSON.stringify({ ok: false, message: 'Supabase non configuré.' }), { status: 503, headers });
  }
  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc('entretien_quotidien');
  if (error) {
    console.error('[entretien]', error.message);
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers });
  }
  console.log('[entretien]', JSON.stringify(data));
  return new Response(JSON.stringify({ ok: true, ...(data as object) }), { status: 200, headers });
};
