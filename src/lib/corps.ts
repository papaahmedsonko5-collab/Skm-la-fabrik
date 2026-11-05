/**
 * Lecture bornée du corps d'une requête HTTP.
 *
 * L'en-tête Content-Length n'est qu'une déclaration du client : il peut être
 * absent (envoi par morceaux), faux ou trop petit. On lit donc le flux morceau
 * par morceau en comptant les octets, et on s'arrête dès que la limite est
 * dépassée : un corps trop gros n'est jamais chargé entièrement en mémoire.
 */
export type LectureCorps =
  | { ok: true; octets: Uint8Array<ArrayBuffer> }
  | { ok: false; raison: 'trop_gros' | 'illisible' };

export async function lireCorps(request: Request, max: number): Promise<LectureCorps> {
  if (request.bodyUsed) return { ok: false, raison: 'illisible' };
  return lireFlux(request.body, request.headers.get('content-length'), max);
}

/**
 * Lit un flux d'octets (corps de requête, réponse HTTP, fichier) sans jamais
 * dépasser `max` octets en mémoire. `declare` est la longueur annoncée
 * (Content-Length), ou null si elle est inconnue. Avec `exacte: false`, la
 * longueur annoncée sert seulement à refuser tôt un contenu trop gros : c'est le
 * cas d'une réponse HTTP compressée, dont Content-Length compte les octets compressés.
 */
export async function lireFlux(
  flux: ReadableStream<Uint8Array> | null,
  declare: string | null,
  max: number,
  { exacte = true }: { exacte?: boolean } = {},
): Promise<LectureCorps> {
  let attendu: number | null = null;
  if (declare !== null) {
    // Seul un entier décimal positif est une longueur valable.
    if (!/^\d{1,15}$/.test(declare.trim())) return { ok: false, raison: 'illisible' };
    attendu = Number(declare.trim());
    if (attendu > max) {
      await flux?.cancel().catch(() => undefined);
      return { ok: false, raison: 'trop_gros' };
    }
  }
  if (!flux) return { ok: true, octets: new Uint8Array(0) };

  const lecteur = flux.getReader();
  const morceaux: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await lecteur.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > max) {
        await lecteur.cancel().catch(() => undefined);
        return { ok: false, raison: 'trop_gros' };
      }
      morceaux.push(value);
    }
  } catch {
    return { ok: false, raison: 'illisible' };
  } finally {
    lecteur.releaseLock();
  }
  // Longueur déclarée différente de ce qui a été reçu : corps tronqué ou falsifié.
  if (exacte && attendu !== null && attendu !== total) return { ok: false, raison: 'illisible' };

  const octets = new Uint8Array(total);
  let position = 0;
  for (const m of morceaux) {
    octets.set(m, position);
    position += m.byteLength;
  }
  return { ok: true, octets };
}

/** Décode un formulaire (urlencoded ou multipart) à partir des octets déjà lus. */
export async function formulaireDepuis(octets: Uint8Array, typeContenu: string | null): Promise<FormData | null> {
  if (!typeContenu) return null;
  try {
    return await new Response(octets as Uint8Array<ArrayBuffer>, { headers: { 'content-type': typeContenu } }).formData();
  } catch {
    return null;
  }
}

/** Décode du texte UTF-8 strict : un encodage invalide renvoie null. */
export function texteDepuis(octets: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(octets);
  } catch {
    return null;
  }
}

/**
 * Vrai si l'en-tête Origin désigne le même hôte que la requête.
 * Un en-tête malformé (par exemple « null ») est refusé au lieu de provoquer une erreur.
 */
export function memeOrigine(origin: string, hote: string): boolean {
  try {
    return new URL(origin).host === hote;
  } catch {
    return false;
  }
}
