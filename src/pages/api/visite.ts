import type { APIRoute } from 'astro';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from 'astro:env/server';
import { createClient } from '@supabase/supabase-js';
import { lireCorps, memeOrigine, texteDepuis } from '@/lib/corps';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { appareilDe, cheminValide, empreinte, estRobot, provenanceDe } from '@/lib/visites';

export const prerender = false;

/** 120 pages vues par adresse IP et par tranche de 10 minutes, au-delà on ignore. */
const limiter = createRateLimiter(120, 10 * 60 * 1000);
const MAX_BODY = 2000;

const rien = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

/**
 * Compte une page vue. Répond toujours 204 : le visiteur ne doit jamais être
 * gêné par la mesure d'audience, même si elle échoue.
 */
export const POST: APIRoute = async ({ request }) => {
  const hote = new URL(request.url).host;
  const origin = request.headers.get('origin');
  if (!origin || !memeOrigine(origin, hote)) return rien();
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_PUBLISHABLE_KEY) return rien();

  const userAgent = request.headers.get('user-agent') ?? '';
  if (estRobot(userAgent)) return rien();

  const ip = clientKey(request.headers);
  if (!limiter.hit(ip).allowed) return rien();

  // Lecture bornée à MAX_BODY octets, quel que soit l'en-tête Content-Length.
  const lu = await lireCorps(request, MAX_BODY);
  const texte = lu.ok ? texteDepuis(lu.octets) : null;
  if (texte === null) return rien();
  let corps: { chemin?: unknown; provenance?: unknown };
  try {
    const brut: unknown = JSON.parse(texte);
    if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return rien();
    corps = brut as { chemin?: unknown; provenance?: unknown };
  } catch {
    return rien();
  }
  const chemin = cheminValide(corps.chemin);
  if (!chemin) return rien();

  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.rpc('enregistrer_visite', {
    p_chemin: chemin,
    p_provenance: provenanceDe(corps.provenance, new URL(request.url).hostname),
    p_appareil: appareilDe(userAgent),
    p_empreinte: await empreinte(ip, userAgent),
  });
  if (error) console.error('[visite]', error.message);
  return rien();
};
