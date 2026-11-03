/**
 * Règles du formulaire de contact, partagées entre la page (attributs HTML)
 * et la fonction serveur (validation). Module pur, testé par Vitest.
 */

export const contactObjects = {
  contact: { label: 'Contact', detailLabel: 'Sujet', options: ['Question générale', 'Presse et médias', 'Autre'] },
  partenariat: {
    label: 'Partenariat',
    detailLabel: 'Type de partenariat',
    options: ['Partenaire événement', 'Partenaire fondateur', 'Mécénat / RSE', 'Partenariat institutionnel'],
  },
  prestation: {
    label: 'Prestation',
    detailLabel: 'Formule souhaitée',
    options: ['Voix & pub Starter', 'Formule Pro', 'Formule Premium', 'Couverture d’événement', 'Autre besoin'],
  },
  formation: {
    label: 'Formation',
    detailLabel: 'Domaine',
    options: ['Audiovisuel', 'Production sonore', 'Montage vidéo', 'Graphisme', 'Communication digitale', 'Atelier pour un groupe'],
  },
  production: {
    label: 'Production musicale',
    detailLabel: 'Projet',
    options: ['Single', 'EP (5 titres)', 'Mixtape (10 titres)', 'Album (15 titres)', 'Location du studio', 'Mixage / mastering'],
  },
  accreditation: {
    label: 'Accréditation',
    detailLabel: 'Vous êtes',
    options: ['Presse écrite', 'Radio', 'Télévision', 'Média en ligne', 'Photographe', 'Vidéaste', 'Créateur de contenu', 'Partenaire ou exposant'],
  },
} as const;

export type ContactObject = keyof typeof contactObjects;

export const contactObjectKeys = Object.keys(contactObjects) as ContactObject[];

export function isContactObject(value: unknown): value is ContactObject {
  return typeof value === 'string' && (contactObjectKeys as string[]).includes(value);
}

/** Objet de contact proposé par défaut depuis une fiche projet. */
export function contactObjectForCategory(category: string): ContactObject {
  switch (category) {
    case 'Festivals':
    case 'Initiatives communautaires':
      return 'partenariat';
    case 'Événements':
      return 'prestation';
    case 'Productions musicales':
      return 'production';
    case 'Formations':
      return 'formation';
    default:
      return 'contact';
  }
}

export const LIMITS = {
  name: 120,
  organization: 160,
  email: 254,
  phone: 30,
  message: 4000,
  messageMin: 20,
  evenement: 120,
  lien: 300,
} as const;

export interface ContactInput {
  objet: ContactObject;
  detail: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; data: ContactInput }
  | { ok: false; errors: Partial<Record<keyof ContactInput | 'consent' | 'form' | 'evenement' | 'lien', string>> };

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE_RE = /^[+()\d\s.-]{6,30}$/;

const text = (v: FormDataEntryValue | null): string =>
  typeof v === 'string' ? v.split(String.fromCharCode(0)).join('').replace(/\r\n?/g, '\n').trim() : '';

/**
 * Valide les champs du formulaire. Le champ piège `site_web` doit rester vide
 * (les robots le remplissent) ; `startedAt` écarte les envois en moins de 3 s.
 */
export function validateContact(form: FormData, now: number = Date.now()): ValidationResult {
  const errors: Partial<Record<keyof ContactInput | 'consent' | 'form' | 'evenement' | 'lien', string>> = {};

  if (text(form.get('site_web')) !== '') {
    return { ok: false, errors: { form: 'Votre envoi n’a pas pu être traité.' } };
  }
  const startedAt = Number(text(form.get('started_at')));
  if (Number.isFinite(startedAt) && startedAt > 0 && now - startedAt < 3000) {
    return { ok: false, errors: { form: 'Votre envoi a été trop rapide. Merci de réessayer.' } };
  }

  const objetRaw = text(form.get('objet'));
  const objet: ContactObject = isContactObject(objetRaw) ? objetRaw : 'contact';
  if (!isContactObject(objetRaw)) errors.objet = 'Choisissez l’objet de votre demande.';

  const allowed: readonly string[] = contactObjects[objet].options;
  const detail = text(form.get('detail'));
  if (!allowed.includes(detail)) errors.detail = 'Choisissez une option dans la liste.';

  const name = text(form.get('name'));
  if (name.length < 2) errors.name = 'Indiquez votre nom.';
  else if (name.length > LIMITS.name) errors.name = 'Ce nom est trop long.';

  const organization = text(form.get('organization'));
  if (organization.length > LIMITS.organization) errors.organization = 'Ce nom de structure est trop long.';

  const email = text(form.get('email')).toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) errors.email = 'Indiquez une adresse e-mail valide.';

  const phone = text(form.get('phone'));
  if (phone !== '' && !PHONE_RE.test(phone)) errors.phone = 'Ce numéro ne semble pas valide.';

  // Accréditation : l'événement est obligatoire, le média aussi ; le lien vers
  // les publications est facultatif. Ils sont ajoutés en tête du message.
  let entete = '';
  if (objet === 'accreditation') {
    const evenement = text(form.get('evenement'));
    if (evenement.length < 2) errors.evenement = 'Indiquez l’événement concerné.';
    else if (evenement.length > LIMITS.evenement) errors.evenement = 'Ce nom d’événement est trop long.';
    if (organization.length < 2 && !errors.organization) errors.organization = 'Indiquez votre média ou votre structure.';
    const lien = text(form.get('lien'));
    if (lien !== '' && !lienValide(lien)) errors.lien = 'Indiquez un lien complet, commençant par https://';
    entete = `Événement : ${evenement}\n${lien ? `Publications : ${lien}\n` : ''}\n`;
  }

  const message = text(form.get('message'));
  if (message.length < LIMITS.messageMin) errors.message = `Votre message doit compter au moins ${LIMITS.messageMin} caractères.`;
  else if (message.length > LIMITS.message) errors.message = `Votre message ne doit pas dépasser ${LIMITS.message} caractères.`;

  if (!errors.message && entete.length + message.length > LIMITS.message) {
    errors.message = `Votre message est trop long : raccourcissez-le de ${entete.length + message.length - LIMITS.message} caractères.`;
  }

  if (text(form.get('consent')) !== 'oui') errors.consent = 'Votre accord est nécessaire pour traiter la demande.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { objet, detail, name, organization, email, phone, message: entete + message } };
}

function lienValide(valeur: string): boolean {
  if (valeur.length > LIMITS.lien) return false;
  try {
    const url = new URL(valeur);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Échappe le texte saisi avant insertion dans un e-mail HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildEmail(data: ContactInput): { subject: string; text: string; html: string } {
  const label = contactObjects[data.objet].label;
  const subject = `[Site] ${label} · ${data.detail} · ${data.name}`.slice(0, 180);
  const rows: [string, string][] = [
    ['Objet', `${label} · ${data.detail}`],
    ['Nom', data.name],
    ['Structure', data.organization || 'non renseigné'],
    ['E-mail', data.email],
    ['Téléphone', data.phone || 'non renseigné'],
  ];
  const textBody = `${rows.map(([k, v]) => `${k} : ${v}`).join('\n')}\n\n${data.message}`;
  const html = `<table>${rows
    .map(([k, v]) => `<tr><th align="left">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join('')}</table><p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>`;
  return { subject, text: textBody, html };
}
