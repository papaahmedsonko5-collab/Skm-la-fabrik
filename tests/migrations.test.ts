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
