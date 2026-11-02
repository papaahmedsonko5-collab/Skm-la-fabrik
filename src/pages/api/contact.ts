import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY } from 'astro:env/server';
import { site } from '@/data/site';
import { buildEmail, validateContact } from '@/lib/contact';
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

  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) {
    console.error('[contact] Envoi impossible : RESEND_API_KEY ou CONTACT_TO_EMAIL manquant.');
    return wantsJson
      ? json(503, { ok: false, message: `L’envoi en ligne est temporairement indisponible. Écrivez-nous à ${site.contact.email}.` })
      : redirect(request, 'indisponible');
  }

  const mail = buildEmail(result.data);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL ?? 'SKM La Fabrik <onboarding@resend.dev>',
        to: [CONTACT_TO_EMAIL],
        reply_to: result.data.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[contact] Resend a répondu ${res.status}`);
      return wantsJson ? json(502, { ok: false, message: 'L’envoi a échoué. Merci de réessayer plus tard.' }) : redirect(request, 'erreur');
    }
  } catch (err) {
    console.error('[contact] Erreur réseau vers Resend', err instanceof Error ? err.name : 'inconnue');
    return wantsJson ? json(504, { ok: false, message: 'Le service d’envoi ne répond pas. Merci de réessayer plus tard.' }) : redirect(request, 'erreur');
  } finally {
    clearTimeout(timer);
  }

  return wantsJson ? json(200, { ok: true, message: 'Merci, votre demande a bien été envoyée.' }) : redirect(request, 'envoye');
};

export const ALL: APIRoute = () => json(405, { ok: false, message: 'Méthode non autorisée.' }, { allow: 'POST' });
