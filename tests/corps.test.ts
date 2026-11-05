import { describe, expect, it } from 'vitest';
import { formulaireDepuis, lireCorps, memeOrigine, texteDepuis } from '../src/lib/corps';

const URL_ = 'https://www.skmlafabrik.com/api/contact';

/** Corps envoyé en flux, morceau par morceau, sans Content-Length. */
function flux(morceaux: Uint8Array[], onPull?: () => void): ReadableStream<Uint8Array> {
  let i = 0;
  return new ReadableStream({
    pull(c) {
      onPull?.();
      if (i < morceaux.length) c.enqueue(morceaux[i++]!);
      else c.close();
    },
  });
}

function requete(body: BodyInit | null, headers: Record<string, string> = {}): Request {
  return new Request(URL_, { method: 'POST', body, headers, duplex: 'half' } as RequestInit);
}

describe('lireCorps', () => {
  it('lit un petit corps normal', async () => {
    const r = await lireCorps(requete('a=1&b=2', { 'content-type': 'application/x-www-form-urlencoded' }), 100);
    expect(r.ok).toBe(true);
    if (r.ok) expect(new TextDecoder().decode(r.octets)).toBe('a=1&b=2');
  });

  it('refuse un Content-Length déclaré trop grand sans lire le corps', async () => {
    const r = await lireCorps(requete('x', { 'content-length': '999999' }), 100);
    expect(r).toEqual({ ok: false, raison: 'trop_gros' });
  });

  it('refuse un Content-Length malformé', async () => {
    for (const v of ['abc', '-5', '1e3', '12 34']) {
      const r = await lireCorps(requete('x', { 'content-length': v }), 100);
      expect(r).toEqual({ ok: false, raison: 'illisible' });
    }
  });

  it('borne un corps sans Content-Length et arrête la lecture tôt', async () => {
    const morceau = new Uint8Array(64);
    let lus = 0;
    const r = await lireCorps(requete(flux(Array.from({ length: 1000 }, () => morceau), () => lus++)), 200);
    expect(r).toEqual({ ok: false, raison: 'trop_gros' });
    // 200 octets autorisés : la lecture s'arrête après 4 morceaux de 64, pas après 1000.
    expect(lus).toBeLessThan(10);
  });

  it('accepte un corps en flux sous la limite', async () => {
    const r = await lireCorps(requete(flux([new TextEncoder().encode('{"a":'), new TextEncoder().encode('1}')])), 100);
    expect(r.ok).toBe(true);
    if (r.ok) expect(texteDepuis(r.octets)).toBe('{"a":1}');
  });

  it('accepte un corps vide', async () => {
    const r = await lireCorps(requete(null), 100);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.octets.byteLength).toBe(0);
  });

  it('signale une erreur de lecture du flux', async () => {
    const casse = new ReadableStream({
      pull(c) {
        c.error(new Error('coupure'));
      },
    });
    expect(await lireCorps(requete(casse), 100)).toEqual({ ok: false, raison: 'illisible' });
  });
});

describe('décodage', () => {
  it('décode un formulaire urlencoded', async () => {
    const f = await formulaireDepuis(new TextEncoder().encode('name=Awa&email=a%40b.sn'), 'application/x-www-form-urlencoded');
    expect(f?.get('name')).toBe('Awa');
    expect(f?.get('email')).toBe('a@b.sn');
  });

  it('décode un formulaire multipart', async () => {
    const src = new FormData();
    src.set('name', 'Awa');
    const req = new Request(URL_, { method: 'POST', body: src });
    const octets = new Uint8Array(await req.arrayBuffer());
    const f = await formulaireDepuis(octets, req.headers.get('content-type'));
    expect(f?.get('name')).toBe('Awa');
  });

  it('renvoie null pour un formulaire malformé ou sans type', async () => {
    expect(await formulaireDepuis(new TextEncoder().encode('--x\r\nn'), 'multipart/form-data; boundary=x')).toBeNull();
    expect(await formulaireDepuis(new TextEncoder().encode('a=1'), null)).toBeNull();
  });

  it('refuse un texte UTF-8 invalide', () => {
    expect(texteDepuis(new Uint8Array([0xff, 0xfe]))).toBeNull();
    expect(texteDepuis(new TextEncoder().encode('é'))).toBe('é');
  });
});

describe('memeOrigine', () => {
  it('compare les hôtes sans lever d’exception', () => {
    expect(memeOrigine('https://www.skmlafabrik.com', 'www.skmlafabrik.com')).toBe(true);
    expect(memeOrigine('https://autre.example', 'www.skmlafabrik.com')).toBe(false);
    expect(memeOrigine('null', 'www.skmlafabrik.com')).toBe(false);
    expect(memeOrigine('', 'www.skmlafabrik.com')).toBe(false);
  });
});
