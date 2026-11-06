import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = 'supabase/migrations';
const migrations = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => ({ f, sql: readFileSync(join(DIR, f), 'utf8').toLowerCase() }));

/** Instructions SQL (sans les commentaires) qui touchent une fonction donnée. */
function instructions(fonction: string): string[] {
  return migrations.flatMap(({ sql }) =>
    sql
      .replace(/--[^\n]*/g, '')
      .split(';')
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => (s.startsWith('grant') || s.startsWith('revoke')) && s.includes(`function public.${fonction}(`)),
  );
}

describe('migrations : entretien quotidien', () => {
  const droits = instructions('entretien_quotidien');

  it('ne donne jamais l’exécution à anon ni à authenticated', () => {
    for (const d of droits.filter((s) => s.startsWith('grant'))) {
      expect(d).not.toMatch(/\bto\b.*\b(anon|authenticated|public)\b/);
    }
  });

  it('retire les droits à public, anon et authenticated, puis accorde service_role', () => {
    const revoke = droits.find((s) => s.startsWith('revoke'));
    expect(revoke).toBeDefined();
    for (const role of ['public', 'anon', 'authenticated']) expect(revoke).toMatch(new RegExp(`\\b${role}\\b`));
    expect(droits.some((s) => s.startsWith('grant execute') && /\bto service_role$/.test(s))).toBe(true);
  });
});

describe('migration : réservation des publications (étape E)', () => {
  const brut = readFileSync(join(DIR, '20261106000000_publications_reservation.sql'), 'utf8');
  const sql = brut.replace(/--[^\n]*/g, '').toLowerCase();
  const inverse = readFileSync('supabase/rollback/20261106000000_publications_reservation.down.sql', 'utf8').replace(/--[^\n]*/g, '').toLowerCase();
  const corps = (nom: string) => {
    const m = sql.match(new RegExp(`create or replace function public\\.${nom}\\(([\\s\\S]*?)\\$\\$([\\s\\S]*?)\\$\\$;`));
    expect(m, nom).not.toBeNull();
    return { entete: m![1]!, code: m![2]! };
  };
  const fonctions = ['reserver_publication', 'terminer_publication'];

  it.each(fonctions)('%s : security definer, search_path vide, is_admin() en premier', (nom) => {
    const { entete, code } = corps(nom);
    expect(entete).toContain('security definer');
    expect(entete).toContain("set search_path = ''");
    expect(code.replace(/^[\s\S]*?\bbegin\b/, '').trim()).toMatch(/^if not public\.is_admin\(\) then\s+raise exception/);
  });

  it('horloge réelle : aucun now() dans le code (seulement clock_timestamp())', () => {
    expect(sql).not.toMatch(/\bnow\(\)/);
    expect(sql.match(/clock_timestamp\(\)/g)?.length).toBeGreaterThan(5);
  });

  it('droits : retirés à public, anon et service_role ; accordés à authenticated seulement', () => {
    for (const nom of fonctions) {
      const revoke = sql.match(new RegExp(`revoke all on function public\\.${nom}\\([^)]*\\) from ([^;]+);`));
      expect(revoke?.[1]?.split(',').map((s) => s.trim()).sort()).toEqual(['anon', 'public', 'service_role']);
      const grants = [...sql.matchAll(new RegExp(`grant execute on function public\\.${nom}\\([^)]*\\) to ([^;]+);`, 'g'))].map((g) => g[1]!.trim());
      expect(grants).toEqual(['authenticated']);
    }
  });

  it('une seule ligne active : index unique partiel sur actif', () => {
    expect(sql).toMatch(/create unique index publications_une_active on public\.publications \(actif\) where actif;/);
  });

  it('unique_violation : distingue les deux contraintes réelles et remonte toute autre violation', () => {
    const { code } = corps('reserver_publication');
    expect(code).toContain('get stacked diagnostics v_contrainte = constraint_name');
    expect(code).toContain("v_contrainte = 'publications_cle_unique'");
    expect(code).toMatch(/v_contrainte is distinct from 'publications_une_active' then\s+raise;/);
    expect(sql).toContain('add constraint publications_cle_unique unique (cle)');
  });

  it('terminer : verrou, puis contrôle à l’heure réelle, puis transition vérifiée', () => {
    const { code } = corps('terminer_publication');
    const verrou = code.indexOf('for update');
    const controle = code.indexOf('v.bloque_jusqua <= clock_timestamp()');
    const maj = code.indexOf('update public.publications');
    expect(verrou).toBeGreaterThan(0);
    expect(controle).toBeGreaterThan(verrou);
    expect(maj).toBeGreaterThan(controle);
    expect(code).toContain('get diagnostics n = row_count');
    expect(code).toContain('p.jeton_hash = v_hash and p.user_id = auth.uid()');
  });

  it('le jeton n’est jamais stocké en clair', () => {
    expect(sql).toContain("sha256(convert_to(v_jeton::text, 'utf8'))");
    expect(sql).not.toMatch(/add column if not exists jeton\b/);
  });

  it('l’inverse retire exactement les fonctions, l’index et les contraintes ajoutés', () => {
    const contraintes = [...sql.matchAll(/add constraint (\w+)/g)].map((m) => m[1]).sort();
    const retirees = [...inverse.matchAll(/drop constraint if exists (\w+)/g)].map((m) => m[1]).sort();
    expect(retirees).toEqual(contraintes);
    expect(inverse).toContain('drop index if exists public.publications_une_active');
    expect(inverse).toContain('drop function if exists public.terminer_publication(bigint, uuid, text, integer, text, text)');
    expect(inverse).toContain('drop function if exists public.reserver_publication(uuid)');
    expect(sql).toContain('function public.terminer_publication(bigint, uuid, text, integer, text, text)');
    expect(inverse).not.toMatch(/drop column|drop table|delete from|truncate/);
  });

  it('la simulation des tests SQL utilise la même is_admin() que la migration du dépôt', () => {
    const norm = (s: string) => s.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim();
    const extraire = (s: string) => norm(s).match(/create or replace function public\.is_admin\(\)[\s\S]*?\$\$;/)?.[0];
    const depot = extraire(readFileSync(join(DIR, '20261103020000_double_authentification.sql'), 'utf8'));
    const simu = extraire(readFileSync('supabase/tests/publication/supabase-simule.sql', 'utf8'));
    expect(depot).toBeDefined();
    expect(simu).toBe(depot);
  });
});
