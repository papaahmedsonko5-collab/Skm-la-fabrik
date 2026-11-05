import type { APIRoute } from 'astro';
import {
  CRON_SECRET,
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} from 'astro:env/server';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export const GET: APIRoute = async ({ request }) => {
  // Vérification de la configuration serveur.
  if (!CRON_SECRET || !PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[entretien] Configuration serveur incomplète.');
    return new Response(
      JSON.stringify({ ok: false, message: 'Service temporairement indisponible.' }),
      { status: 503, headers },
    );
  }

  // Seul Vercel Cron, muni du secret, peut déclencher l'entretien.
  if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return new Response(
      JSON.stringify({ ok: false, message: 'Non autorisé.' }),
      { status: 401, headers },
    );
  }

  // Client privilégié, utilisé exclusivement côté serveur.
  const supabase = createClient(
    PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data, error } = await supabase.rpc('entretien_quotidien');

  if (error) {
    console.error('[entretien]', error.message);
    return new Response(
      JSON.stringify({ ok: false, message: 'Échec de la tâche d’entretien.' }),
      { status: 500, headers },
    );
  }

  console.log('[entretien] Exécution réussie.');

  return new Response(
    JSON.stringify({ ok: true, ...(data as Record<string, unknown>) }),
    { status: 200, headers },
  );
};
