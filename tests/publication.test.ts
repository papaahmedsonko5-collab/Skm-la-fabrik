import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adresseRetour,
  AVANT_ENVOI,
  classerErreur,
  classerReponse,
  constatBuild,
  etatPublication,
  publier,
  type Appel,
  type ClientRpc,
} from '../src/lib/admin/publication';
import { flashFrom } from '../src/lib/admin/data';

const HOOK = 'https://api.vercel.com/v1/integrations/deploy/prj_SECRETPROJET/SECRETHOOK';
const CLE = '0b6f3c1e-9d2a-4c8b-a1e5-7f3d2c1b0a99';
const JETON = '5e7a1c2b-3d4f-4a6b-8c9d-0e1f2a3b4c5d';
const BLOQUE = '2026-11-06T16:10:00.000Z';

type Rpc = { data: unknown; error: { code?: string; message?: string } | null };

/** Faux client : rejoue les réponses données pour chaque fonction, et note les appels. */
function client(reponses: { reserver?: Rpc | (() => Rpc); terminer?: Rpc | 'exception' } = {}) {
  const appels: { fn: string; args: Record<string, unknown> }[] = [];
  const c: ClientRpc = {
    rpc: async (fn, args) => {
      appels.push({ fn, args });
      if (fn === 'reserver_publication') {
        const r = reponses.reserver ?? { data: { resultat: 'reservee', id: 42, statut: 'reservee', bloque_jusqua: BLOQUE, jeton: JETON }, error: null };
        return typeof r === 'function' ? r() : r;
      }
      if (reponses.terminer === 'exception') throw new Error('réseau coupé');
      return reponses.terminer ?? { data: { resultat: 'enregistree' }, error: null };
    },
  };
  return { c, appels };
}

/** Faux fetch : renvoie la réponse donnée, ou lève l'erreur donnée. */
function hook(r: Response | Error | (() => Response | Error)) {
  const appels: { url: string; init: RequestInit }[] = [];
  const f: Appel = async (url, init) => {
    appels.push({ url, init });
    const v = typeof r === 'function' ? r() : r;
    if (v instanceof Error) throw v;
    return v;
  };
  return { f, appels };
}
const erreurReseau = (code: string) => Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(`connect ${code} ${HOOK}`), { code }) });
const delai = () => new DOMException('The operation was aborted due to timeout', 'TimeoutError');
const ok201 = () => new Response(JSON.stringify({ job: { id: 'okzCd50AIap1O31g0gne', state: 'PENDING', createdAt: 1 } }), { status: 201 });

let journal: unknown[][] = [];
beforeEach(() => {
  journal = [];
  for (const m of ['error', 'warn', 'log', 'info'] as const) vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void journal.push(a));
});
afterEach(() => vi.restoreAllMocks());
const toutLeJournal = () => JSON.stringify(journal);

describe('classerErreur : échec certain seulement si la requête n’est jamais partie', () => {
  it.each([...AVANT_ENVOI])('%s → echec', (code) => {
    expect(classerErreur(erreurReseau(code)).issue).toBe('echec');
  });

  it.each(['ECONNRESET', 'UND_ERR_SOCKET', 'EPIPE', 'UND_ERR_HEADERS_TIMEOUT', 'ETIMEDOUT', 'CODE_INCONNU'])('%s → incertaine', (code) => {
    expect(classerErreur(erreurReseau(code)).issue).toBe('incertaine');
  });

  it('délai dépassé → incertaine', () => {
    expect(classerErreur(delai())).toMatchObject({ issue: 'incertaine', detail: 'delai depasse' });
  });

  it('code absent ou exception quelconque → incertaine', () => {
    expect(classerErreur(new TypeError('fetch failed')).issue).toBe('incertaine');
    expect(classerErreur('chaîne').issue).toBe('incertaine');
    expect(classerErreur(null).issue).toBe('incertaine');
  });

  it('erreur groupée : echec seulement si toutes les tentatives sont avant envoi', () => {
    const groupee = (codes: string[]) =>
      Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new AggregateError(codes.map((code) => Object.assign(new Error(code), { code }))), {}) });
    expect(classerErreur(groupee(['ECONNREFUSED', 'ECONNREFUSED'])).issue).toBe('echec');
    expect(classerErreur(groupee(['ECONNREFUSED', 'ECONNRESET'])).issue).toBe('incertaine');
  });

  it('n’utilise jamais le message de l’erreur (il peut contenir l’URL)', () => {
    expect(JSON.stringify(classerErreur(erreurReseau('ENOTFOUND')))).not.toContain('SECRET');
    expect(JSON.stringify(classerErreur(erreurReseau('ECONNRESET')))).not.toContain('SECRET');
  });
});

describe('classerReponse : seul un 2xx vaut « lancée »', () => {
  it('201 avec job.id → lancee et identifiant', async () => {
    expect(await classerReponse(ok201())).toEqual({ issue: 'lancee', http: 201, job: 'okzCd50AIap1O31g0gne', detail: null });
  });

  it('2xx sans corps lisible → lancee quand même', async () => {
    expect(await classerReponse(new Response('pas du json', { status: 200 }))).toMatchObject({ issue: 'lancee', job: null });
    expect(await classerReponse(new Response(null, { status: 204 }))).toMatchObject({ issue: 'lancee', job: null });
  });

  it('identifiant de tâche suspect ignoré', async () => {
    const r = await classerReponse(new Response(JSON.stringify({ job: { id: '<script>' } }), { status: 201 }));
    expect(r.job).toBeNull();
  });

  it.each([101, 301, 308, 400, 401, 403, 404, 405, 409, 429, 500, 502, 503, 504])('HTTP %i → incertaine', async (status) => {
    const res = status === 101 ? ({ status, body: null, headers: new Headers() } as unknown as Response) : new Response(null, { status });
    expect(await classerReponse(res)).toMatchObject({ issue: 'incertaine', http: status, detail: `HTTP ${status}` });
  });
});

describe('publier : enchaînement réservation → hook → issue', () => {
  it('clé absente ou mal formée : ni base, ni hook', async () => {
    for (const cle of ['', 'abc', `${CLE}x`, CLE.toUpperCase()]) {
      const { c, appels } = client();
      const h = hook(ok201());
      expect(await publier(c, cle, HOOK, h.f)).toEqual({ code: 'requete_invalide' });
      expect(appels).toHaveLength(0);
      expect(h.appels).toHaveLength(0);
    }
  });

  it('succès : un seul appel POST, issue lancee transmise avec l’id et le jeton', async () => {
    const { c, appels } = client();
    const h = hook(ok201());
    expect(await publier(c, CLE, HOOK, h.f)).toEqual({ code: 'publie' });
    expect(h.appels).toHaveLength(1);
    expect(h.appels[0]?.init).toMatchObject({ method: 'POST', redirect: 'manual' });
    expect(appels[1]).toEqual({
      fn: 'terminer_publication',
      args: { p_id: 42, p_jeton: JETON, p_issue: 'lancee', p_http: 201, p_job: 'okzCd50AIap1O31g0gne', p_detail: null },
    });
  });

  it.each([
    [{ resultat: 'occupee', statut: 'reservee', bloque_jusqua: BLOQUE }, { code: 'publication_occupee', jusqua: BLOQUE }],
    [{ resultat: 'trop_tot', statut: 'lancee', bloque_jusqua: BLOQUE }, { code: 'publication_trop_tot', jusqua: BLOQUE }],
    [{ resultat: 'deja_traitee', statut: 'incertaine', bloque_jusqua: BLOQUE }, { code: 'publication_deja', statut: 'incertaine', jusqua: BLOQUE }],
    [{ resultat: 'cle_deja_utilisee' }, { code: 'publication_cle' }],
    [{ resultat: 'autre chose' }, { code: 'publication_indisponible' }],
    [null, { code: 'publication_indisponible' }],
  ])('réservation refusée (%j) : le hook n’est jamais appelé', async (data, attendu) => {
    const { c, appels } = client({ reserver: { data, error: null } });
    const h = hook(ok201());
    expect(await publier(c, CLE, HOOK, h.f)).toEqual(attendu);
    expect(h.appels).toHaveLength(0);
    expect(appels).toHaveLength(1);
  });

  it('erreur Supabase à la réservation : pas d’appel, erreur journalisée sans détail sensible', async () => {
    const { c } = client({ reserver: { data: null, error: { code: '42501', message: 'réservé aux admins' } } });
    const h = hook(ok201());
    expect(await publier(c, CLE, HOOK, h.f)).toEqual({ code: 'publication_indisponible' });
    expect(h.appels).toHaveLength(0);
    expect(toutLeJournal()).toContain('réservation refusée');
  });

  it('réservation mal formée (sans jeton) : pas d’appel', async () => {
    const { c } = client({ reserver: { data: { resultat: 'reservee', id: 42 }, error: null } });
    const h = hook(ok201());
    expect(await publier(c, CLE, HOOK, h.f)).toEqual({ code: 'publication_indisponible' });
    expect(h.appels).toHaveLength(0);
  });

  it('délai dépassé : incertaine, une seule tentative, jamais de nouvel essai', async () => {
    const { c, appels } = client();
    const h = hook(delai());
    expect(await publier(c, CLE, HOOK, h.f)).toEqual({ code: 'publication_incertaine', jusqua: BLOQUE });
    expect(h.appels).toHaveLength(1);
    expect(appels[1]?.args).toMatchObject({ p_id: 42, p_jeton: JETON, p_issue: 'incertaine', p_http: null });
  });

  it('HTTP 503 : incertaine avec le code', async () => {
    const { c } = client();
    expect(await publier(c, CLE, HOOK, hook(new Response(null, { status: 503 })).f)).toEqual({ code: 'publication_incertaine', jusqua: BLOQUE, http: 503 });
  });

  it('nom introuvable : echec certain, bouton libéré', async () => {
    const { c, appels } = client();
    expect(await publier(c, CLE, HOOK, hook(erreurReseau('ENOTFOUND')).f)).toEqual({ code: 'publication_echec' });
    expect(appels[1]?.args).toMatchObject({ p_issue: 'echec', p_detail: 'ENOTFOUND' });
  });

  it.each([
    ['refus de la base', { data: null, error: { code: '40001' } } as Rpc],
    ['réservation expirée', { data: { resultat: 'expiree' }, error: null } as Rpc],
    ['jeton refusé', { data: { resultat: 'refusee' }, error: null } as Rpc],
    ['exception réseau', 'exception' as const],
  ])('2xx puis issue non enregistrée (%s) : message honnête et journal', async (_nom, terminer) => {
    const { c } = client({ terminer });
    expect(await publier(c, CLE, HOOK, hook(ok201()).f)).toEqual({ code: 'publication_non_enregistree', statut: 'lancee', jusqua: BLOQUE, http: 201 });
    expect(toutLeJournal()).toContain('issue non enregistrée');
  });

  it('deux demandes simultanées sur une base qui n’accepte qu’une réservation : un seul appel au hook', async () => {
    let occupe = false;
    const { c } = client({
      reserver: () => {
        if (occupe) return { data: { resultat: 'occupee', statut: 'reservee', bloque_jusqua: BLOQUE }, error: null };
        occupe = true;
        return { data: { resultat: 'reservee', id: 42, statut: 'reservee', bloque_jusqua: BLOQUE, jeton: JETON }, error: null };
      },
    });
    const h = hook(ok201);
    const r = await Promise.all([publier(c, CLE, HOOK, h.f), publier(c, '1b6f3c1e-9d2a-4c8b-a1e5-7f3d2c1b0a99', HOOK, h.f)]);
    expect(r.map((x) => x.code).sort()).toEqual(['publication_occupee', 'publie']);
    expect(h.appels).toHaveLength(1);
  });

  it('jamais de jeton ni d’URL du hook dans les journaux, les adresses de retour ou les arguments de terminer', async () => {
    const cas: [Rpc | 'exception' | undefined, Response | Error][] = [
      [undefined, ok201()],
      [undefined, delai()],
      [undefined, erreurReseau('ENOTFOUND')],
      [undefined, erreurReseau('ECONNRESET')],
      [{ data: null, error: { code: 'x', message: JETON } }, ok201()],
      ['exception', new Response(null, { status: 404 })],
    ];
    for (const [terminer, rep] of cas) {
      const { c, appels } = client(terminer ? { terminer } : {});
      const retour = await publier(c, CLE, HOOK, hook(rep).f);
      const adresse = adresseRetour(retour);
      expect(adresse).not.toContain(JETON);
      expect(adresse).not.toContain('SECRET');
      expect(JSON.stringify(appels.map((a) => a.args))).not.toContain('SECRET');
    }
    expect(toutLeJournal()).not.toContain(JETON);
    expect(toutLeJournal()).not.toContain('SECRET');
    // Même une réponse de réservation inattendue n'est pas journalisée en entier.
    const { c } = client({ reserver: { data: { resultat: 'bizarre', jeton: JETON }, error: null } });
    await publier(c, CLE, HOOK, hook(ok201()).f);
    expect(toutLeJournal()).not.toContain(JETON);
  });
});

describe('adresseRetour et messages du tableau de bord', () => {
  const msg = (adresse: string) => flashFrom(new URL(`https://www.skmlafabrik.com${adresse}`));

  it('publie → message de succès', () => {
    expect(adresseRetour({ code: 'publie' })).toBe('/admin?ok=publie');
    expect(msg('/admin?ok=publie')).toEqual({ type: 'ok', text: expect.stringContaining('Publication lancée') });
  });

  it('incertaine → peut-être lancée, avec l’heure de disponibilité', () => {
    const a = adresseRetour({ code: 'publication_incertaine', jusqua: BLOQUE, http: 503 });
    expect(a).toBe('/admin?erreur=publication_incertaine&jusqua=2026-11-06T16%3A10%3A00.000Z&http=503');
    const m = msg(a);
    expect(m?.text).toContain('peut-être été lancée');
    expect(m?.text).toContain('HTTP 503');
    expect(m?.text).toContain('16:10');
  });

  it.each([
    ['publication_occupee', 'déjà en cours'],
    ['publication_trop_tot', 'vient d’être lancée'],
    ['publication_echec', 'rien n’a été lancé'],
    ['publication_deja', 'déjà été traitée'],
    ['publication_cle', 'déjà servi'],
    ['publication_indisponible', 'Rien n’a été lancé'],
    ['publication_non_enregistree', 'n’a pas pu être enregistré'],
  ])('%s', (code, extrait) => {
    expect(msg(`/admin?erreur=${code}`)?.text).toContain(extrait);
  });

  it('paramètres falsifiés ignorés', () => {
    const m = msg('/admin?erreur=publication_incertaine&jusqua=<script>&http=9999&statut=<b>');
    expect(m?.text).not.toMatch(/<|9999|undefined|null/);
  });
});

describe('etatPublication : tuile « Dernière publication »', () => {
  const maintenant = new Date('2026-11-06T16:00:00Z');
  const ligne = (statut: string, extra: Partial<{ ok: boolean; actif: boolean; bloque_jusqua: string; created_at: string }> = {}) => ({
    created_at: '2026-11-06T15:55:00Z',
    ok: false,
    statut,
    actif: false,
    bloque_jusqua: null,
    ...extra,
  });

  it('aucune ligne → rien', () => {
    expect(etatPublication([], null, maintenant)).toBeNull();
  });

  it('anciennes lignes : comme avant', () => {
    expect(etatPublication([ligne('historique', { ok: false })], null, maintenant)?.aide).toBe('La dernière tentative a échoué.');
    expect(etatPublication([ligne('historique', { ok: true })], null, maintenant)?.aide).toBeNull();
  });

  it('incertaine active : peut-être lancée, heure de disponibilité', () => {
    const e = etatPublication([ligne('incertaine', { actif: true, bloque_jusqua: '2026-11-06T16:05:00Z' })], null, maintenant);
    expect(e?.aide).toContain('peut-être été lancée');
    expect(e?.aide).toContain('16:05');
  });

  it('constat : seulement pour une issue inconnue, et jamais présenté comme une preuve', () => {
    const apres = '2026-11-06T15:57:00Z';
    for (const s of ['incertaine', 'expiree']) {
      const c = etatPublication([ligne(s)], apres, maintenant)?.constat;
      expect(c).toBe(constatBuild(apres));
      expect(c).toContain('Cela ne confirme pas que la demande a été reçue par Vercel');
      expect(c).not.toMatch(/réussi|confirmée|preuve que/i);
    }
    expect(etatPublication([ligne('lancee', { ok: true })], apres, maintenant)?.constat).toBeNull();
    expect(etatPublication([ligne('echec')], apres, maintenant)?.constat).toBeNull();
    expect(etatPublication([ligne('incertaine')], '2026-11-06T15:50:00Z', maintenant)?.constat).toBeNull();
    expect(etatPublication([ligne('incertaine')], null, maintenant)?.constat).toBeNull();
  });
});
