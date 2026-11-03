# SKM La Fabrik · site officiel

Site du Creative Hub SKM La Fabrik (Rufisque, Sénégal), de son label Sunu Kaddu Music et du Rio Fresco Fest.

- Production : https://www.skmlafabrik.com (skmlafabrik.com et l’ancienne adresse https://skm-la-fabrik.vercel.app y redirigent)
- Pile : Astro 7 (pages statiques), adaptateur Vercel (une seule fonction serveur, pour le formulaire), TypeScript strict, ESLint, Vitest.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:4321
```

Avant chaque envoi sur GitHub :

```bash
npm run build && npm run lint && npm run typecheck && npm test
```

Node 22 (voir `.nvmrc`).

## Architecture

```
src/
  assets/brand/      logos officiels, non modifiés
  assets/photos/     photos extraites des documents de la structure
  components/        en-tête, pied de page, boutons, galerie, lecteur vidéo, chiffres…
  content/projets/   une fiche Markdown par projet (portfolio)
  content/actualites une fiche Markdown par actualité
  data/              textes et données institutionnelles (site, pôles, tarifs, RFF, label, impact)
  layouts/           gabarit commun : SEO, Open Graph, JSON-LD, accessibilité
  lib/               logique testée : formulaire, limite de requêtes, navigation, tri
  pages/             une page par rubrique ; pages/api/contact.ts est la seule route serveur
scripts/security-headers.mjs   ajoute les en-têtes de sécurité après le build
tests/                         tests unitaires (Vitest)
```

## Espace d’administration (`/admin`)

Les actualités, les projets, les photos et les textes des pages se gèrent depuis `/admin`, ainsi que les demandes reçues par le formulaire. Les données sont dans Supabase (projet « SKM La Fabrik »), protégées par RLS : le public ne lit que le contenu publié et ne peut qu’envoyer une demande.

- **Accès** : un compte créé dans Supabase › Authentication › Users, puis ajouté à la table `public.admins`.
- **Connexion cachée** : sans session, toute adresse `/admin` répond « page introuvable ». La page de connexion s’ouvre par le lien secret `/admin?cle=<ADMIN_ENTREE>`, puis reste accessible sur cet appareil pendant un an, délai renouvelé à chaque visite de l’admin.
- **Double authentification** : obligatoire (application Google ou Microsoft Authenticator). La base elle-même refuse l’accès sans ce second facteur. Téléphone perdu : dans Supabase › Authentication › Users, ouvrir le compte et supprimer son facteur MFA ; il sera redemandé à la connexion suivante.
- **Mot de passe oublié** : lien sous le formulaire de connexion. L’e-mail renvoie vers `/admin/retour`, qui ne marche que dans le navigateur qui a fait la demande ; le code de sécurité est demandé avant le nouveau mot de passe. À régler une fois dans Supabase › Authentication › URL Configuration : Site URL `https://www.skmlafabrik.com`, et dans Redirect URLs `https://www.skmlafabrik.com/admin/retour**`. Une fois connecté, « Mot de passe » dans le menu permet aussi de le changer.
- **Visites** : chaque page publique envoie un signal à `/api/visite` (sans cookie). La base garde la page, le site de provenance, le type d’appareil et un code visiteur recalculé chaque jour avec un sel effacé le lendemain : aucune adresse IP n’est stockée. Robots, navigateurs automatisés et pages `/admin` ne sont pas comptés ; les données sont effacées après 13 mois. Les statistiques sont dans Admin › Visites et s’affichent en direct, sans publier.
- **Publier** : les modifications sont enregistrées tout de suite, mais le site public change après « Publier le site » (tableau de bord), qui relance la construction via le Deploy Hook Vercel.
- **Construction** : `scripts/sync-cms.mjs` récupère le contenu publié dans `src/.cms/` (ignoré par Git). Tant qu’une collection est vide dans l’admin, les fichiers de `src/content/` restent utilisés.
- **Schéma** : `supabase/migrations/`.

## Modifier le contenu à la main

- **Ajouter un projet** : créer `src/content/projets/mon-projet.md` en copiant une fiche existante. Le schéma (`src/content.config.ts`) refuse une catégorie inconnue ou un résumé trop long.
- **Ajouter une actualité** : créer `src/content/actualites/mon-actu.md`. Renseigner `date` dès qu’elle est connue ; `draft: true` masque la fiche.
- **Coordonnées et réseaux** : `src/data/site.ts`. WhatsApp et réseaux sociaux confirmés le 2 novembre 2026 ; le téléphone fixe reste à `null` tant qu’il n’est pas confirmé. Passer `emailConfirmed` à `true` active le lien `mailto:`.
- **FAQ** : `src/data/faq.ts` (page `/faq`, avec données structurées FAQPage).
- **Chiffres d’impact** : `blueprintStats` et `rff2026Stats` dans `src/data/site.ts`. Ils sont affichés avec leur source et la mention « Données en cours de validation » tant que `validated` vaut `false`.

## Variables d’environnement (Vercel › Settings › Environment Variables)

| Variable | Rôle |
| --- | --- |
| `SITE_URL` | URL publique (canonique, sitemap). Par défaut `https://www.skmlafabrik.com`. |
| `RESEND_API_KEY` | Clé secrète Resend pour envoyer les demandes du formulaire. |
| `CONTACT_TO_EMAIL` | Adresse qui reçoit les demandes. |
| `CONTACT_FROM_EMAIL` | Expéditeur, sur un domaine vérifié dans Resend. |
| `PUBLIC_SUPABASE_URL` | Adresse du projet Supabase (publique). |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publiable Supabase (publique, limitée par RLS). |
| `DEPLOY_HOOK_URL` | Deploy Hook Vercel du bouton « Publier le site » (secret). |
| `ADMIN_ENTREE` | Mot secret du lien de connexion admin (secret). |

Avec Supabase configuré, les demandes arrivent dans l’admin ; Resend ajoute alors une notification par e-mail. Sans Supabase ni Resend, le formulaire répond proprement qu’il est indisponible et invite à écrire par e-mail. Aucune clé ne doit être commitée : `.env` est ignoré par Git.

## Sécurité

- En-têtes : CSP stricte (scripts autorisés par empreinte SHA-256, aucun `unsafe-inline` pour les scripts), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Formulaire : validation serveur (`src/lib/contact.ts`), échappement HTML, champ piège anti-robot, délai minimal, limite de 5 envois par IP et par 10 minutes, contrôle d’origine, taille maximale, délai d’attente vers Resend, protection contre le double clic.
- Vidéos YouTube chargées seulement au clic, depuis `youtube-nocookie.com`.
- Mesure d’audience : Vercel Web Analytics, sans cookie (à activer dans l’onglet Analytics du projet Vercel).

## Points à valider par la structure

- Numéro de téléphone fixe officiel (plusieurs numéros différents dans les documents).
- Année de création : 2013 (OneBeat) ou 2014 (Studio Key I Am).
- Chiffres d’impact du Blueprint et du rapport RFF 2026.
- « 3x Best Lyricist » (Blueprint) et « Meilleur Album 2015 » (document du label).
- Numéro d’enregistrement de l’association (mentions légales) et durée de conservation des demandes (12 mois proposés).
- Lien du compte @lafabrikskm et des plateformes d’écoute, dates des actualités, portraits de l’équipe.
