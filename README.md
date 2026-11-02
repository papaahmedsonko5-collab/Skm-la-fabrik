# SKM La Fabrik · site officiel

Site du Creative Hub SKM La Fabrik (Rufisque, Sénégal), de son label Sunu Kaddu Music et du Rio Fresco Fest.

- Production : https://skm-la-fabrik.vercel.app
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

## Modifier le contenu

- **Ajouter un projet** : créer `src/content/projets/mon-projet.md` en copiant une fiche existante. Le schéma (`src/content.config.ts`) refuse une catégorie inconnue ou un résumé trop long.
- **Ajouter une actualité** : créer `src/content/actualites/mon-actu.md`. Renseigner `date` dès qu’elle est connue ; `draft: true` masque la fiche.
- **Coordonnées** : `src/data/site.ts`. Les numéros de téléphone et WhatsApp restent à `null` tant qu’ils ne sont pas confirmés. Passer `emailConfirmed` à `true` active le lien `mailto:`.
- **Chiffres d’impact** : `blueprintStats` et `rff2026Stats` dans `src/data/site.ts`. Ils sont affichés avec leur source et la mention « Données en cours de validation » tant que `validated` vaut `false`.

## Variables d’environnement (Vercel › Settings › Environment Variables)

| Variable | Rôle |
| --- | --- |
| `SITE_URL` | URL publique (canonique, sitemap). Par défaut `https://skm-la-fabrik.vercel.app`. |
| `RESEND_API_KEY` | Clé secrète Resend pour envoyer les demandes du formulaire. |
| `CONTACT_TO_EMAIL` | Adresse qui reçoit les demandes. |
| `CONTACT_FROM_EMAIL` | Expéditeur, sur un domaine vérifié dans Resend. |

Sans `RESEND_API_KEY` et `CONTACT_TO_EMAIL`, le formulaire répond proprement qu’il est indisponible et invite à écrire par e-mail. Aucune clé ne doit être commitée : `.env` est ignoré par Git.

## Sécurité

- En-têtes : CSP stricte (scripts autorisés par empreinte SHA-256, aucun `unsafe-inline` pour les scripts), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Formulaire : validation serveur (`src/lib/contact.ts`), échappement HTML, champ piège anti-robot, délai minimal, limite de 5 envois par IP et par 10 minutes, contrôle d’origine, taille maximale, délai d’attente vers Resend, protection contre le double clic.
- Vidéos YouTube chargées seulement au clic, depuis `youtube-nocookie.com`.
- Mesure d’audience : Vercel Web Analytics, sans cookie (à activer dans l’onglet Analytics du projet Vercel).

## Points à valider par la structure

- Numéro de téléphone et WhatsApp officiels (cinq numéros différents dans les documents).
- Année de création : 2013 (OneBeat) ou 2014 (Studio Key I Am).
- Chiffres d’impact du Blueprint et du rapport RFF 2026.
- « 3x Best Lyricist » (Blueprint) et « Meilleur Album 2015 » (document du label).
- Numéro d’enregistrement de l’association (mentions légales) et durée de conservation des demandes (12 mois proposés).
- Liens officiels des réseaux sociaux et des plateformes d’écoute, dates des actualités, portraits de l’équipe.
