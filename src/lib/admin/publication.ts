/**
 * Publication du site (bouton « Publier ») protégée contre les doubles déclenchements.
 *
 * 1. reserver_publication : réservation enregistrée en base AVANT l'appel au Deploy Hook.
 *    Elle rend un jeton, gardé seulement dans une variable de cette requête.
 * 2. Un seul appel au Deploy Hook, sans nouvel essai automatique.
 * 3. terminer_publication : issue enregistrée avec ce jeton.
 *
 * « echec » seulement quand la requête n'a jamais quitté le serveur ; tout le reste
 * d'ambigu est « incertaine » et bloque toute nouvelle publication 10 minutes.
 * Ni le jeton ni l'URL du hook ne sont écrits dans un journal, une adresse ou une page.
 */
import { lireFlux } from '@/lib/corps';

export type Issue = 'lancee' | 'echec' | 'incertaine';
export interface Classement {
  issue: Issue;
  http: number | null;
  job: string | null;
  detail: string | null;
}

export const CLE_VALIDE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Codes d'erreur réseau (Node, moteur undici) qui prouvent que la requête HTTP n'est
 * jamais partie : échec de résolution du nom, connexion refusée ou impossible, adresse
 * invalide, certificat TLS refusé (la requête n'est envoyée qu'après la poignée de main).
 */
export const AVANT_ENVOI: ReadonlySet<string> = new Set([
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'UND_ERR_CONNECT_TIMEOUT',
  'ERR_INVALID_URL',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);

const propre = (s: string) => s.replace(/[^A-Za-z0-9_, -]/g, '').slice(0, 100);

/** Codes portés par la cause d'une erreur fetch ; une erreur groupée donne un code par tentative ('' si absent). */
function codes(err: unknown): string[] {
  const cause = (err as { cause?: unknown } | null)?.cause as { code?: unknown; errors?: unknown } | undefined;
  const code = (e: unknown) => {
    const c = (e as { code?: unknown } | null)?.code;
    return typeof c === 'string' ? c : '';
  };
  if (cause && Array.isArray(cause.errors) && cause.errors.length > 0) return cause.errors.map(code);
  return [code(cause)];
}

/** Classe une exception levée par fetch. On n'utilise jamais son message : il peut contenir l'URL. */
export function classerErreur(err: unknown): Classement {
  const nom = err instanceof Error || err instanceof DOMException ? err.name : '';
  if (nom === 'TimeoutError' || nom === 'AbortError') {
    return { issue: 'incertaine', http: null, job: null, detail: 'delai depasse' };
  }
  const liste = codes(err);
  if (liste.length > 0 && liste.every((c) => AVANT_ENVOI.has(c))) {
    return { issue: 'echec', http: null, job: null, detail: propre(liste.join(',')) };
  }
  const connus = liste.filter(Boolean);
  return { issue: 'incertaine', http: null, job: null, detail: propre(connus.length ? connus.join(',') : nom || 'erreur inconnue') };
}

/** Classe une réponse HTTP du Deploy Hook. Seul un 2xx vaut « lancée ». */
export async function classerReponse(res: Response): Promise<Classement> {
  if (res.status >= 200 && res.status < 300) {
    let job: string | null = null;
    const lu = await lireFlux(res.body, res.headers.get('content-length'), 4096, { exacte: false });
    if (lu.ok) {
      try {
        const id = (JSON.parse(new TextDecoder().decode(lu.octets)) as { job?: { id?: unknown } } | null)?.job?.id;
        if (typeof id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(id)) job = id;
      } catch {
        // Corps illisible : l'issue reste « lancée », seul l'identifiant manque.
      }
    }
    return { issue: 'lancee', http: res.status, job, detail: job ? null : 'reponse sans job.id' };
  }
  await res.body?.cancel().catch(() => undefined);
  return { issue: 'incertaine', http: res.status, job: null, detail: `HTTP ${res.status}` };
}

/** Le strict nécessaire du client Supabase (facile à simuler en test). */
export interface ClientRpc {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>;
}
export type Appel = (url: string, init: RequestInit) => Promise<Response>;

export type CodeRetour =
  | 'publie'
  | 'requete_invalide'
  | 'publication_echec'
  | 'publication_incertaine'
  | 'publication_occupee'
  | 'publication_trop_tot'
  | 'publication_deja'
  | 'publication_cle'
  | 'publication_indisponible'
  | 'publication_non_enregistree';
export interface Retour {
  code: CodeRetour;
  jusqua?: string | undefined;
  statut?: string | undefined;
  http?: number | undefined;
}

const STATUTS = new Set(['historique', 'reservee', 'lancee', 'echec', 'incertaine', 'expiree']);
const objet = (d: unknown): Record<string, unknown> => (d && typeof d === 'object' && !Array.isArray(d) ? (d as Record<string, unknown>) : {});
const heure = (v: unknown) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : undefined);
const statut = (v: unknown) => (typeof v === 'string' && STATUTS.has(v) ? v : undefined);

export async function publier(client: ClientRpc, cle: string, hookUrl: string, appel: Appel = fetch, delaiMs = 8000): Promise<Retour> {
  if (!CLE_VALIDE.test(cle)) return { code: 'requete_invalide' };

  // 1. Réservation. En cas de doute sur la base, on n'appelle jamais le hook.
  let reponse: { data: unknown; error: { code?: string; message?: string } | null };
  try {
    reponse = await client.rpc('reserver_publication', { p_cle: cle });
  } catch {
    reponse = { data: null, error: { code: 'exception' } };
  }
  if (reponse.error) {
    console.error('[publier] réservation refusée', { code: reponse.error.code ?? 'inconnu' });
    return { code: 'publication_indisponible' };
  }
  const r = objet(reponse.data);
  switch (r.resultat) {
    case 'reservee':
      break;
    case 'occupee':
      return { code: 'publication_occupee', jusqua: heure(r.bloque_jusqua) };
    case 'trop_tot':
      return { code: 'publication_trop_tot', jusqua: heure(r.bloque_jusqua) };
    case 'deja_traitee':
      return { code: 'publication_deja', statut: statut(r.statut), jusqua: heure(r.bloque_jusqua) };
    case 'cle_deja_utilisee':
      return { code: 'publication_cle' };
    default:
      // On ne journalise jamais l'objet entier : une réponse « reservee » contient le jeton.
      console.error('[publier] réponse de réservation inattendue', { resultat: typeof r.resultat === 'string' ? propre(r.resultat) : typeof r.resultat });
      return { code: 'publication_indisponible' };
  }
  const id = r.id;
  const jeton = r.jeton;
  const bloque = heure(r.bloque_jusqua);
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || typeof jeton !== 'string' || !CLE_VALIDE.test(jeton)) {
    console.error('[publier] réservation mal formée');
    // La ligne réservée bloque 10 minutes : on le dit plutôt que de laisser réessayer.
    return { code: 'publication_indisponible' };
  }

  // 2. Un seul appel au Deploy Hook.
  let classement: Classement;
  try {
    const res = await appel(hookUrl, { method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(delaiMs) });
    classement = await classerReponse(res);
  } catch (err) {
    classement = classerErreur(err);
  }

  // 3. Issue enregistrée avec le jeton de cette opération.
  let fin: { data: unknown; error: { code?: string; message?: string } | null };
  try {
    fin = await client.rpc('terminer_publication', {
      p_id: id,
      p_jeton: jeton,
      p_issue: classement.issue,
      p_http: classement.http,
      p_job: classement.job,
      p_detail: classement.detail,
    });
  } catch {
    fin = { data: null, error: { code: 'exception' } };
  }
  const resultat = objet(fin.data).resultat;
  if (fin.error || resultat !== 'enregistree') {
    console.error('[publier] issue non enregistrée', {
      id,
      issue: classement.issue,
      http: classement.http,
      code: fin.error?.code,
      resultat: typeof resultat === 'string' ? propre(resultat) : undefined,
    });
    return { code: 'publication_non_enregistree', statut: classement.issue, jusqua: bloque, http: classement.http ?? undefined };
  }
  if (classement.issue === 'lancee') return { code: 'publie' };
  if (classement.issue === 'echec') return { code: 'publication_echec' };
  return { code: 'publication_incertaine', jusqua: bloque, http: classement.http ?? undefined };
}

/** Adresse de retour vers le tableau de bord. Ne contient que des valeurs contrôlées. */
export function adresseRetour(r: Retour): string {
  const p = new URLSearchParams();
  if (r.code === 'publie') p.set('ok', 'publie');
  else p.set('erreur', r.code);
  if (r.jusqua) p.set('jusqua', new Date(r.jusqua).toISOString());
  if (r.statut && STATUTS.has(r.statut)) p.set('statut', r.statut);
  if (r.http && r.http >= 100 && r.http <= 599) p.set('http', String(r.http));
  return `/admin?${p.toString()}`;
}

/* ---------- Tableau de bord ---------- */

export interface LignePublication {
  created_at: string;
  ok: boolean;
  statut?: string | null;
  actif?: boolean | null;
  bloque_jusqua?: string | null;
}

const heureFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' });
const dateHeureFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' });
export const formatHeure = (iso: string) => heureFmt.format(new Date(iso));

/** Phrase du constat : jamais présentée comme une preuve. */
export const constatBuild = (lecture: string) =>
  `Information : la version en ligne a été construite avec le contenu lu le ${dateHeureFmt.format(new Date(lecture))}, après cette demande. Cela ne confirme pas que la demande a été reçue par Vercel.`;

/**
 * État affiché dans la tuile « Dernière publication ». `lecture` est l'heure de lecture
 * du contenu par la construction en ligne (ou null). Le constat n'est qu'informatif :
 * il ne change rien en base et n'apparaît que pour une issue inconnue.
 */
export function etatPublication(
  lignes: LignePublication[],
  lecture: string | null,
  maintenant: Date,
): { date: string; aide: string | null; constat: string | null } | null {
  const d = lignes[0];
  if (!d) return null;
  const s = d.statut ?? 'historique';
  const bloque = d.actif && d.bloque_jusqua && Date.parse(d.bloque_jusqua) > maintenant.getTime() ? d.bloque_jusqua : null;
  const dispo = bloque ? ` Bouton de nouveau disponible à ${formatHeure(bloque)}.` : '';
  let aide: string | null = null;
  if (s === 'historique') aide = d.ok ? null : 'La dernière tentative a échoué.';
  else if (s === 'reservee') aide = bloque ? `Publication en cours.${dispo}` : 'La dernière demande est restée sans réponse connue de Vercel.';
  else if (s === 'incertaine') aide = `Vercel n’a pas confirmé la dernière demande : elle a peut-être été lancée.${dispo}`;
  else if (s === 'lancee') aide = bloque ? `Publication lancée.${dispo}` : null;
  else if (s === 'echec') aide = 'La dernière tentative a échoué : rien n’a été lancé.';
  else if (s === 'expiree') aide = 'La dernière demande a expiré sans réponse connue de Vercel.';

  const inconnue = s === 'incertaine' || s === 'expiree' || (s === 'reservee' && !bloque);
  const constat = inconnue && lecture && Date.parse(lecture) > Date.parse(d.created_at) ? constatBuild(lecture) : null;
  return { date: d.created_at, aide, constat };
}
