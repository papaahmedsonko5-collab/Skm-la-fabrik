import { describe, expect, it } from 'vitest';
import { buildEmail, contactObjectForCategory, escapeHtml, isContactObject, validateContact } from '../src/lib/contact';
import { isActive } from '../src/lib/nav';

const NOW = 1_800_000_000_000;

function form(overrides: Record<string, string> = {}): FormData {
  const f = new FormData();
  const base: Record<string, string> = {
    objet: 'partenariat',
    detail: 'Partenaire événement',
    name: 'Awa Diop',
    organization: 'Association test',
    email: 'Awa.Diop@example.sn',
    phone: '+221 77 000 00 00',
    message: 'Bonjour, nous souhaitons soutenir la prochaine édition du festival.',
    consent: 'oui',
    site_web: '',
    started_at: String(NOW - 20_000),
    ...overrides,
  };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  return f;
}

describe('validateContact', () => {
  it('accepte une demande complète et normalise l’e-mail', () => {
    const r = validateContact(form(), NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.email).toBe('awa.diop@example.sn');
  });

  it('rejette le champ piège rempli par un robot', () => {
    const r = validateContact(form({ site_web: 'http://spam.example' }), NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.form).toBeDefined();
  });

  it('rejette un envoi en moins de 3 secondes', () => {
    const r = validateContact(form({ started_at: String(NOW - 1000) }), NOW);
    expect(r.ok).toBe(false);
  });

  it('refuse un détail qui ne correspond pas à l’objet', () => {
    const r = validateContact(form({ objet: 'formation', detail: 'Partenaire événement' }), NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.detail).toBeDefined();
  });

  it('signale chaque champ invalide', () => {
    const r = validateContact(
      form({ objet: 'inconnu', name: 'A', email: 'pas-un-email', phone: 'abc', message: 'court', consent: '' }),
      NOW,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(['consent', 'detail', 'email', 'message', 'name', 'objet', 'phone']);
    }
  });

  it('accepte un téléphone vide et limite la longueur du message', () => {
    expect(validateContact(form({ phone: '' }), NOW).ok).toBe(true);
    expect(validateContact(form({ message: 'x'.repeat(4001) }), NOW).ok).toBe(false);
  });
});

describe('escapeHtml et buildEmail', () => {
  it('échappe les caractères HTML', () => {
    expect(escapeHtml(`<script>"a" & 'b'</script>`)).toBe('&lt;script&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/script&gt;');
  });

  it('n’insère jamais de HTML saisi dans l’e-mail', () => {
    const r = validateContact(form({ name: 'Awa <b>Diop</b>' }), NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const mail = buildEmail(r.data);
    expect(mail.html).not.toContain('<b>');
    expect(mail.subject).toContain('Partenariat');
    expect(mail.text).toContain('Awa <b>Diop</b>');
  });
});

describe('aides', () => {
  it('associe une catégorie de projet à un objet de contact', () => {
    expect(contactObjectForCategory('Productions musicales')).toBe('production');
    expect(contactObjectForCategory('Formations')).toBe('formation');
    expect(contactObjectForCategory('Autre')).toBe('contact');
  });

  it('reconnaît les objets valides', () => {
    expect(isContactObject('prestation')).toBe(true);
    expect(isContactObject('admin')).toBe(false);
    expect(isContactObject(undefined)).toBe(false);
  });

  it('détecte la rubrique active de la navigation', () => {
    expect(isActive('/projets/fort-b', '/projets')).toBe(true);
    expect(isActive('/projets', '/projets')).toBe(true);
    expect(isActive('/projetsx', '/projets')).toBe(false);
    expect(isActive('/', '/a-propos')).toBe(false);
  });
});
