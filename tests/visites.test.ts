import { describe, expect, it } from 'vitest';
import { appareilDe, cheminValide, empreinte, estRobot, libellePage, provenanceDe } from '../src/lib/visites';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const ANDROID_TAB = 'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

describe('visites', () => {
  it('reconnaît les robots', () => {
    expect(estRobot('Googlebot/2.1')).toBe(true);
    expect(estRobot('facebookexternalhit/1.1')).toBe(true);
    expect(estRobot('')).toBe(true);
    expect(estRobot(PC)).toBe(false);
  });
  it('classe les appareils', () => {
    expect(appareilDe(IPHONE)).toBe('mobile');
    expect(appareilDe(ANDROID_TAB)).toBe('tablette');
    expect(appareilDe(PC)).toBe('ordinateur');
  });
  it('nettoie et filtre les chemins', () => {
    expect(cheminValide('/a-propos/')).toBe('/a-propos');
    expect(cheminValide('/projets/fort-b?x=1#y')).toBe('/projets/fort-b');
    expect(cheminValide('/')).toBe('/');
    expect(cheminValide('/admin')).toBeNull();
    expect(cheminValide('/admin/visites')).toBeNull();
    expect(cheminValide('/api/contact')).toBeNull();
    expect(cheminValide('//evil.com')).toBeNull();
    expect(cheminValide('https://x.com/')).toBeNull();
    expect(cheminValide('/<script>')).toBeNull();
    expect(cheminValide(42)).toBeNull();
    expect(cheminValide('/' + 'a'.repeat(250))).toBeNull();
  });
  it('garde seulement le nom du site de provenance', () => {
    expect(provenanceDe('https://www.google.com/search?q=skm', 'skm-la-fabrik.vercel.app')).toBe('google.com');
    expect(provenanceDe('https://l.facebook.com/l.php?u=x', 'skm-la-fabrik.vercel.app')).toBe('facebook.com');
    expect(provenanceDe('https://skm-la-fabrik.vercel.app/contact', 'skm-la-fabrik.vercel.app')).toBe('');
    expect(provenanceDe('', 'skm-la-fabrik.vercel.app')).toBe('');
    expect(provenanceDe('javascript:alert(1)', 'skm-la-fabrik.vercel.app')).toBe('');
  });
  it('produit une empreinte hexadécimale stable', async () => {
    const a = await empreinte('1.2.3.4', PC);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await empreinte('1.2.3.4', PC)).toBe(a);
    expect(await empreinte('1.2.3.5', PC)).not.toBe(a);
  });
  it('donne des libellés lisibles', () => {
    expect(libellePage('/')).toBe('Accueil');
    expect(libellePage('/projets/handischool-day')).toBe('Projet : handischool day');
  });
});
