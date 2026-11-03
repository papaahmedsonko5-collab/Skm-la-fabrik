// Avant `astro build` : récupère le contenu publié depuis l'admin (Supabase)
// et le prépare pour la construction du site statique.
//  - textes des pages  -> src/.cms/contenus.json
//  - galerie photo     -> src/.cms/photos.json (+ photos dans src/.cms/medias)
//  - actualités/projets -> src/.cms/<collection>/<slug>.md (+ photos dans src/.cms/medias)
// Sans configuration Supabase, ou tant qu'une collection est vide côté admin,
// le site garde les fichiers du dépôt (src/content/...). Lecture seule, clé publiable.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const URL_ = process.env.PUBLIC_SUPABASE_URL;
const KEY = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const ROOT = 'src/.cms';
const CONTENUS = join(ROOT, 'contenus.json');

if (!URL_ || !KEY) {
  console.log('[sync-cms] Supabase non configuré : contenu du dépôt utilisé.');
  process.exit(0);
}

const headers = { apikey: KEY, authorization: `Bearer ${KEY}` };

async function rest(path) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, { headers, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${path} : HTTP ${res.status}`);
  return res.json();
}

const yaml = (v) => JSON.stringify(v); // JSON est du YAML valide.

async function download(path) {
  const dest = join(ROOT, 'medias', path);
  const url = `${URL_}/storage/v1/object/public/medias/${path.split('/').map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`photo ${path} : HTTP ${res.status}`);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  // Chemin relatif depuis src/.cms/<collection>/<slug>.md
  return `../medias/${path}`;
}

function frontmatter(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || (Array.isArray(v) && v.length === 0)) continue;
    lines.push(`${k}: ${yaml(v)}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

async function main() {
  await rm(ROOT, { recursive: true, force: true });

  // Textes des pages
  const contenus = await rest('contenus?select=key,value');
  const valeurs = Object.fromEntries(contenus.filter((c) => c.value && c.value.trim()).map((c) => [c.key, c.value]));
  await mkdir(ROOT, { recursive: true });
  await writeFile(CONTENUS, JSON.stringify(valeurs, null, 2) + '\n');
  console.log(`[sync-cms] ${Object.keys(valeurs).length} texte(s) personnalisé(s).`);

  // Galerie photo (page Actualités)
  const photos = await rest('photos?select=path,alt,categorie,large&visible=eq.true&order=position.asc,created_at.asc');
  if (photos.length > 0) {
    const liste = [];
    for (const ph of photos) {
      const rel = await download(ph.path); // ../medias/<chemin>
      liste.push({ file: rel.replace(/^\.\.\//, ''), alt: ph.alt ?? '', categorie: ph.categorie, large: Boolean(ph.large) });
    }
    await writeFile(join(ROOT, 'photos.json'), JSON.stringify(liste, null, 2) + '\n');
    console.log(`[sync-cms] ${photos.length} photo(s) de galerie depuis l'admin.`);
  } else {
    console.log('[sync-cms] Galerie vide dans l’admin : galerie du dépôt conservée.');
  }

  // Actualités
  const actus = await rest('actualites?select=*&draft=eq.false&order=date.desc.nullslast');
  if (actus.length > 0) {
    for (const a of actus) {
      if (!a.cover_path) continue; // une actualité sans photo n'est pas publiable
      const fm = {
        title: a.title,
        type: a.type,
        date: a.date ?? undefined,
        period: a.period,
        summary: a.summary,
        cover: await download(a.cover_path),
        coverAlt: a.cover_alt,
        coverPosition: a.cover_position,
        featured: a.featured,
      };
      const file = join(ROOT, 'actualites', `${a.slug}.md`);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, frontmatter(fm) + (a.body ?? '') + '\n');
    }
    console.log(`[sync-cms] ${actus.length} actualité(s) depuis l'admin.`);
  } else {
    console.log('[sync-cms] Aucune actualité publiée dans l’admin : fichiers du dépôt conservés.');
  }

  // Projets
  const projets = await rest('projets?select=*&draft=eq.false');
  if (projets.length > 0) {
    for (const p of projets) {
      const gallery = [];
      for (const g of p.gallery ?? []) gallery.push({ src: await download(g.path), alt: g.alt ?? '' });
      const fm = {
        title: p.title,
        category: p.category,
        period: p.period,
        year: p.year ?? undefined,
        place: p.place,
        partners: p.partners,
        summary: p.summary,
        cover: p.cover_path ? await download(p.cover_path) : undefined,
        coverAlt: p.cover_path ? p.cover_alt : undefined,
        gallery,
        videos: p.videos,
        relatedPage: p.related_page ?? undefined,
        missing: p.missing,
        featured: p.featured,
      };
      const file = join(ROOT, 'projets', `${p.slug}.md`);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, frontmatter(fm) + (p.body ?? '') + '\n');
    }
    console.log(`[sync-cms] ${projets.length} projet(s) depuis l'admin.`);
  } else {
    console.log('[sync-cms] Aucun projet publié dans l’admin : fichiers du dépôt conservés.');
  }
}

main().catch((err) => {
  // Un échec réseau ne doit pas publier un site vide : on arrête la construction.
  console.error('[sync-cms] Échec :', err.message);
  process.exit(1);
});
