/**
 * Textes du site modifiables depuis l'admin (page « Textes des pages »).
 * La valeur par défaut est le texte actuel : tant que l'admin ne change rien,
 * le site reste identique. Dans les titres, [mots] = mots en or, et un retour
 * à la ligne = saut de ligne.
 */
export interface ContenuDef {
  key: string;
  page: string;
  label: string;
  value: string;
  multiline?: boolean;
  /** Titre avec la syntaxe [or] et sauts de ligne. */
  title?: boolean;
}

const NB = ' ';

export const contenus: readonly ContenuDef[] = [
  // Accueil
  { key: 'accueil.hero.surtitre', page: 'Accueil', label: 'Ligne au-dessus du titre', value: 'Creative Hub · Rufisque, Sénégal · Depuis 2014' },
  { key: 'accueil.hero.titre', page: 'Accueil', label: 'Grand titre', value: 'Nous fabriquons les idées, révélons les talents et faisons [vibrer les territoires.]', title: true },
  {
    key: 'accueil.hero.chapeau',
    page: 'Accueil',
    label: 'Texte sous le titre',
    value: `Formation, production, événementiel, festivals et action communautaire${NB}: cinq pôles, une seule fabrique, au service de la jeunesse de Rufisque.`,
    multiline: true,
  },
  // À propos
  { key: 'apropos.hero.titre', page: 'À propos', label: 'Grand titre', value: 'Nul n’entre ici\ns’il n’est [créatif.]', title: true },
  {
    key: 'apropos.hero.chapeau',
    page: 'À propos',
    label: 'Texte sous le titre',
    value: 'Depuis sa création en 2014 par l’artiste PPS the Writah, Sunu Kaddu s’est imposé comme un acteur majeur des cultures urbaines à Rufisque et au Sénégal.',
    multiline: true,
  },
  // Activités
  { key: 'activites.hero.titre', page: 'Activités', label: 'Grand titre', value: 'Cinq pôles,\nune même [exigence.]', title: true },
  {
    key: 'activites.hero.chapeau',
    page: 'Activités',
    label: 'Texte sous le titre',
    value: `Former les talents, produire des contenus de haute qualité, faire vivre la scène et réinvestir dans la communauté${NB}: chaque pôle nourrit les autres.`,
    multiline: true,
  },
  // Projets
  { key: 'projets.intro.titre', page: 'Projets', label: 'Grand titre', value: 'Nos [projets]', title: true },
  {
    key: 'projets.intro.chapeau',
    page: 'Projets',
    label: 'Texte sous le titre',
    value: 'Une sélection des projets portés par Sunu Kaddu et SKM La Fabrik depuis 2013, à Rufisque et au-delà.',
    multiline: true,
  },
  // Impact
  { key: 'impact.hero.titre', page: 'Impact', label: 'Grand titre', value: 'L’écho de [Rufisque]', title: true },
  {
    key: 'impact.hero.chapeau',
    page: 'Impact',
    label: 'Texte sous le titre',
    value: 'D’une initiative de terrain à un moteur de transformation culturelle et économique.',
    multiline: true,
  },
  // Actualités
  { key: 'actualites.intro.titre', page: 'Actualités', label: 'Grand titre', value: 'Le journal\nde la [Fabrik]', title: true },
  {
    key: 'actualites.intro.chapeau',
    page: 'Actualités',
    label: 'Texte sous le titre',
    value: 'Reportages, annonces et moments forts, à Rufisque et sur nos scènes.',
    multiline: true,
  },
  // Coordonnées (pied de page, contact, mentions légales)
  { key: 'coordonnees.email', page: 'Coordonnées', label: 'E-mail de contact', value: 'sunukaddu@gmail.com' },
  { key: 'coordonnees.whatsapp', page: 'Coordonnées', label: 'Numéro WhatsApp', value: '+221 70 484 40 40' },
  { key: 'coordonnees.adresse', page: 'Coordonnées', label: 'Adresse', value: '3ᵉ étage, Cité Senelec (Keur Toubab bi)' },
  { key: 'coordonnees.ville', page: 'Coordonnées', label: 'Ville', value: 'Rufisque' },
];

export const contenuPages = [...new Set(contenus.map((c) => c.page))];
