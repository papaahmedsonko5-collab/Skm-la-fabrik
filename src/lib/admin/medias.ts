/**
 * Envoi d'une image déjà vérifiée dans le stockage « medias », et bilan d'un
 * import en plusieurs éléments (réussis / échoués), pour ne jamais annoncer
 * une réussite complète quand une partie a échoué.
 */
import type { ImageVerifiee } from '@/lib/images';

/** Le strict nécessaire du client Supabase pour envoyer un fichier (facile à simuler en test). */
export interface ClientStockage {
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        body: Uint8Array<ArrayBuffer>,
        options: { contentType: string; upsert: boolean; cacheControl: string },
      ): PromiseLike<{ error: { message: string } | null }>;
    };
  };
}

export type Televersement = { ok: true; path: string } | { ok: false; raison: 'stockage'; detail: string };

/** Envoie l'image avec son type réel (jamais le type déclaré par le navigateur ou le serveur d'origine). */
export async function televerser(client: ClientStockage, path: string, image: ImageVerifiee, upsert: boolean): Promise<Televersement> {
  try {
    const { error } = await client.storage
      .from('medias')
      .upload(path, image.octets, { contentType: image.type, upsert, cacheControl: '31536000' });
    if (error) return { ok: false, raison: 'stockage', detail: error.message };
    return { ok: true, path };
  } catch (err) {
    return { ok: false, raison: 'stockage', detail: err instanceof Error ? err.message : 'erreur inconnue' };
  }
}

export interface Echec {
  element: string;
  raison: string;
}

export class BilanImport {
  readonly reussis: string[] = [];
  readonly echecs: Echec[] = [];

  reussi(element: string): void {
    this.reussis.push(element);
  }

  echec(element: string, raison: string): void {
    this.echecs.push({ element, raison });
  }

  /** Erreur renvoyée par Supabase (base ou stockage) : comptée comme un échec. Renvoie true si erreur. */
  verifier(element: string, error: { message?: string } | null | undefined): boolean {
    if (!error) return false;
    this.echec(element, `supabase : ${error.message ?? 'erreur inconnue'}`);
    return true;
  }

  get complet(): boolean {
    return this.echecs.length === 0;
  }

  /**
   * Paramètres de l'adresse de retour vers le tableau de bord. Les noms d'éléments
   * en échec (identifiants de fiches ou chemins de photos) sont limités à 10 et
   * nettoyés : jamais de message d'erreur brut ni de secret dans l'adresse.
   */
  parametres(): URLSearchParams {
    const p = new URLSearchParams();
    if (this.complet) {
      p.set('ok', 'importe');
      p.set('reussis', String(this.reussis.length));
      return p;
    }
    p.set('erreur', 'import_partiel');
    p.set('reussis', String(this.reussis.length));
    p.set('echecs', String(this.echecs.length));
    const noms = [...new Set(this.echecs.map((e) => e.element.replace(/[^a-z0-9/._-]/gi, '').slice(0, 80)))].filter(Boolean);
    if (noms.length) p.set('liste', noms.slice(0, 10).join(','));
    return p;
  }
}
