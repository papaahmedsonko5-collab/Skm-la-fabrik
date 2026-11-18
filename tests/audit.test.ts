import { describe, expect, it } from 'vitest';
import { egal } from '../src/lib/egal';
import { validateContact } from '../src/lib/contact';

describe('egal', () => {
  it('compare deux textes', () => {
    expect(egal('abc', 'abc')).toBe(true);
    expect(egal('abc', 'abd')).toBe(false);
    expect(egal('abc', 'abcd')).toBe(false);
  });
});

describe('contact : champs d’une ligne', () => {
  it('remplace les retours à la ligne du nom par des espaces', () => {
    const f = new FormData();
    f.set('objet', 'contact');
    f.set('detail', 'Question générale');
    f.set('name', 'Jean\nBcc: x@y.com');
    f.set('email', 'a@b.sn');
    f.set('message', 'Un message assez long pour passer.');
    f.set('consent', 'oui');
    const r = validateContact(f, Date.now());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.name).not.toContain('\n');
  });
});
