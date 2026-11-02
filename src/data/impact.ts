/**
 * Impact communautaire. Source : « Sunu Kaddu Impact Blueprint, CSR & ESG
 * Partnership 2025-2026 » (traduit de l’anglais).
 */

export const constat = {
  title: 'Le potentiel inexploité de Rufisque',
  text: 'Troisième ville historique du Sénégal, Rufisque déborde d’une jeunesse ambitieuse. Elle fait pourtant face à un manque criant d’infrastructures culturelles et de parcours structurés vers les métiers créatifs.',
} as const;

export const convictions: readonly string[] = [
  'Le mouvement hip-hop est l’arbre qui cache une forêt d’initiatives de terrain.',
  'Les jeunes ont la capacité d’analyser leurs propres réalités et de conduire les changements socio-économiques dont leurs communautés ont besoin. Notre mission est de leur offrir le cadre légal et structuré de cette vitalité.',
];

export const ecosysteme: readonly { name: string; role: string; text: string }[] = [
  { name: 'SKM La Fabrik', role: 'Infrastructure', text: 'Espace de création 360°, studio d’enregistrement et coworking.' },
  { name: 'Le label', role: 'Production', text: 'Création musicale, mixage, mastering et promotion des talents locaux.' },
  { name: 'Les scènes', role: 'Événements', text: 'Grandes diffusions en direct avec le Rio Fresco Fest et la Loge des Poètes.' },
  { name: 'L’action sociale', role: 'Impact', text: 'Éducation, inclusion (Handischool, Fort B) et reconquête environnementale (Set Setal).' },
];

export const cycle: readonly string[] = ['Former les talents', 'Produire l’art', 'Montrer sur scène', 'Réinvestir dans la communauté'];

export interface Action {
  readonly id: string;
  readonly title: string;
  readonly axis: string;
  readonly text: string;
  readonly href: string;
}

export const actions: readonly Action[] = [
  {
    id: 'set-setal',
    title: 'Set Setal',
    axis: 'Environnement',
    text: 'Des centaines de jeunes mobilisés pour de grands nettoyages de la digue de Rufisque, en partenariat direct avec la SONAGED.',
    href: '/projets/set-setal',
  },
  {
    id: 'handischool',
    title: 'Handischool Day',
    axis: 'Inclusion',
    text: 'Un studio mobile installé à l’école Le Petit Prince pour des ateliers avec des enfants atteints de trisomie 21, et le don de 8 ordinateurs portables pour la salle informatique.',
    href: '/projets/handischool-day',
  },
  {
    id: 'fort-b',
    title: 'Fort B',
    axis: 'Réinsertion',
    text: 'Des ateliers intensifs d’écriture et d’expression pour des mineurs incarcérés, afin d’ouvrir des chemins de retour vers la société.',
    href: '/projets/fort-b',
  },
  {
    id: 'concours',
    title: 'Concours d’art scolaire',
    axis: 'Éducation',
    text: 'Avec l’Ambassade des États-Unis, 100 élèves de 4 lycées mobilisés ; les 20 meilleures œuvres sur l’amitié Sénégal–États-Unis exposées à l’ambassade.',
    href: '/projets/concours-art-scolaire-2024',
  },
];

export const odd: readonly { num: number; name: string; text: string }[] = [
  { num: 4, name: 'Éducation de qualité', text: 'Formations techniques continues (DJing, slam, audiovisuel, graffiti) pour la jeunesse locale.' },
  { num: 8, name: 'Travail décent', text: 'Professionnalisation via SKM La Fabrik et création de revenus locaux directs.' },
  { num: 10, name: 'Inégalités réduites', text: 'Initiatives d’inclusion directe (Handischool) et de réinsertion sociale (Fort B).' },
  { num: 11, name: 'Villes durables', text: 'Reconquête citoyenne et assainissement des espaces publics (Set Setal sur la digue).' },
  { num: 17, name: 'Partenariats', text: 'Alliances diplomatiques et institutionnelles éprouvées (Ambassade des États-Unis, Biennale de Dakar, SONAGED).' },
];

export const pourquoi: readonly { title: string; text: string }[] = [
  { title: 'Un ancrage local authentique', text: 'Nous parlons la langue de la jeunesse, depuis le terrain, depuis 2013.' },
  { title: 'Rigueur et infrastructure', text: 'Un siège physique permanent, SKM La Fabrik, et une équipe de gestion structurée.' },
  { title: 'Une capacité de mobilisation', text: 'Une décennie d’expérience à rassembler et faire participer des milliers de personnes en sécurité.' },
  { title: 'Un impact social mesurable', text: 'Un alignement rigoureux et documenté sur les objectifs d’inclusion, d’éducation et d’environnement.' },
];

export const tiers = {
  columns: ['Partenaire événement', 'Partenaire fondateur'] as const,
  rows: [
    { feature: 'Visibilité du logo', values: ['Supports de l’événement', 'Visibilité premium toute l’année'] },
    { feature: 'Réseaux sociaux', values: ['3 publications par événement', 'Intégration continue toute l’année'] },
    { feature: 'Accès VIP', values: ['2 invitations par événement', 'Table VIP + 10 invités'] },
    { feature: 'Dénomination', values: ['Non incluse', 'Droit exclusif de nommer une salle ou le studio de SKM La Fabrik'] },
    { feature: 'Rapports d’impact ESG', values: ['Rapport semestriel standard', 'Rapport trimestriel personnalisé'] },
    { feature: 'Ateliers collaborateurs', values: ['1 par an', '3 ateliers RSE personnalisés avec vos équipes'] },
  ],
  note: 'Des offres sur mesure peuvent être construites avec vous selon vos objectifs.',
} as const;
