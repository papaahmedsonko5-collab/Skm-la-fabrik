import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL, RESEND_API_KEY } from 'astro:env/server';
import { createClient } from '@supabase/supabase-js';
import { site } from '@/data/site';
import { buildEmail, validateContact, type ContactInput } from '@/lib/contact';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';

export const prerender = false;

/** 5 envois par adresse IP et par tranche de 10 minutes. */
const limiter = createRateLimiter(5, 10 * 60 * 1000);
const MAX_BODY = 20_000;

type Status = 'envoye' | 'erreur' | 'indisponible' | 'limite';

function json(status: number, body: Record<string, unknown>, extra: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });
}

/** Sans JavaScript, le formulaire est envoyé classiquement : on renvoie vers la page avec un statut. */
function redirect(request: Request, status: Status): Response {
  const url = new URL('/contact', request.url);
  url.searchParams.set('statut', status);
  url.hash = 'formulaire';
  return new Response(null, { status: 303, headers: { location: url.toString(), 'cache-control': 'no-store' } });
}

export const POST: APIRoute = async ({ request }) => {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');

  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json(403, { ok: false, message: 'Origine non autorisée.' });
  }

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY) {
    return wantsJson ? json(413, { ok: false, message: 'Votre message est trop volumineux.' }) : redirect(request, 'erreur');
  }

  const rate = limiter.hit(clientKey(request.headers));
  if (!rate.allowed) {
    return wantsJson
      ? json(429, { ok: false, message: 'Trop d’envois en peu de temps. Merci de réessayer dans quelques minutes.' }, { 'retry-after': String(rate.retryAfter) })
      : redirect(request, 'limite');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return wantsJson ? json(400, { ok: false, message: 'Le formulaire n’a pas pu être lu.' }) : redirect(request, 'erreur');
  }

  const result = validateContact(form);
  if (!result.ok) {
    return wantsJson ? json(422, { ok: false, errors: result.errors, message: 'Certains champs sont à corriger.' }) : redirect(request, 'erreur');
  }

  const hasStore = Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const hasMail = Boolean(RESEND_API_KEY && CONTACT_TO_EMAIL);
  if (!hasStore && !hasMail) {
    console.error('[contact] Aucun canal configuré (Supabase ou Resend).');
    return wantsJson
      ? json(503, { ok: false, message: `L’envoi en ligne est temporairement indisponible. Écrivez-nous à ${site.contact.email}.` })
      : redirect(request, 'indisponible');
  }

  // 1. Enregistrement dans la boîte de réception de l'admin (Supabase).
  if (hasStore) {
    const supabase = createClient(PUBLIC_SUPABASE_URL!, PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
    const d = result.data;
    const { error } = await supabase.rpc('submit_demande', {
      p_objet: d.objet,
      p_detail: d.detail,
      p_nom: d.name,
      p_organisation: d.organization,
      p_email: d.email,
      p_telephone: d.phone,
      p_message: d.message,
    });
    if (error) {
      console.error('[contact] Enregistrement Supabase refusé', error.code);
      if (error.message?.includes('limite')) {
        return wantsJson ? json(429, { ok: false, message: 'Trop d’envois aujourd’hui avec cette adresse. Merci de réessayer demain.' }) : redirect(request, 'limite');
      }
      if (!hasMail) {
        return wantsJson ? json(502, { ok: false, message: 'L’envoi a échoué. Merci de réessayer plus tard.' }) : redirect(request, 'erreur');
      }
    } else if (!hasMail) {
      return wantsJson ? json(200, { ok: true, message: 'Merci, votre demande a bien été envoyée.' }) : redirect(request, 'envoye');
    }
    // Enregistré : l'e-mail ci-dessous n'est plus qu'une notification.
    if (!error) {
      await notify(result.data).catch(() => undefined);
      return wantsJson ? json(200, { ok: true, message: 'Merci, votre demande a bien été envoyée.' }) : redirect(request, 'envoye');
    }
  }

  // 2. Sans Supabase (ou s'il a échoué) : envoi par e-mail.
  const sent = await notify(result.data);
  if (sent === 'erreur') return wantsJson ? json(502, { ok: false, message: 'L’envoi a échoué. Merci de réessayer plus tard.' }) : redirect(request, 'erreur');
  if (sent === 'delai') return wantsJson ? json(504, { ok: false, message: 'Le service d’envoi ne répond pas. Merci de réessayer plus tard.' }) : redirect(request, 'erreur');

  return wantsJson ? json(200, { ok: true, message: 'Merci, votre demande a bien été envoyée.' }) : redirect(request, 'envoye');
};

export const ALL: APIRoute = () => json(405, { ok: false, message: 'Méthode non autorisée.' }, { allow: 'POST' });

/** E-mail via Resend (notification ou canal principal). */
async function notify(data: ContactInput): Promise<'ok' | 'erreur' | 'delai' | 'absent'> {
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) return 'absent';
  const mail = buildEmail(data);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL ?? 'SKM La Fabrik <onboarding@resend.dev>',
        to: [CONTACT_TO_EMAIL],
        reply_to: data.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[contact] Resend a répondu ${res.status}`);
      return 'erreur';
    }
    return 'ok';
  } catch (err) {
    console.error('[contact] Erreur réseau vers Resend', err instanceof Error ? err.name : 'inconnue');
    return 'delai';
  } finally {
    clearTimeout(timer);
  }
}
