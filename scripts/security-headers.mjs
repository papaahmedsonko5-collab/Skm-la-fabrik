// Ajoute les en-têtes de sécurité à la sortie Vercel (.vercel/output/config.json)
// après `astro build`. Les empreintes SHA-256 des scripts en ligne sont calculées
// à partir des pages générées, ce qui permet une CSP stricte sans 'unsafe-inline'.
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUTPUT = '.vercel/output';
const STATIC = join(OUTPUT, 'static');
const CONFIG = join(OUTPUT, 'config.json');

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const hashes = new Set();
const SCRIPT_RE = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
for (const file of await htmlFiles(STATIC)) {
  const html = await readFile(file, 'utf8');
  for (const [, attrs, body] of html.matchAll(SCRIPT_RE)) {
    if (/type=["']?application\/(ld\+)?json/i.test(attrs) || body.trim() === '') continue;
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
}

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].sort().join(' ')}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  'frame-src https://www.youtube-nocookie.com',
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = {
  'Content-Security-Policy': csp,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const config = JSON.parse(await readFile(CONFIG, 'utf8'));
config.routes = config.routes ?? [];
// Relancer le script remplace la règle existante au lieu de la dupliquer.
config.routes = config.routes.filter((r) => !r.headers?.['Content-Security-Policy']);
config.routes.unshift({ src: '/(.*)', headers: securityHeaders, continue: true });
await writeFile(CONFIG, JSON.stringify(config, null, 2));
console.log(`[security-headers] ${Object.keys(securityHeaders).length} en-têtes ajoutés, ${hashes.size} script(s) en ligne autorisé(s) par empreinte.`);
