/**
 * Données institutionnelles de SKM La Fabrik.
 *
 * Sources : « SKM La Fabrik – Creative Hub », « Sunu Kaddu – Impact Blueprint »,
 * « Rapport Rio Fresco Fest 2026 », brochure SKM La Fabrik, « Sunu Kaddu Music :
 * l'épopée culturelle de Rufisque », grilles tarifaires 2026.
 *
 * Toute donnée marquée `validated: false` doit être confirmée par la structure
 * avant publication définitive. Elle est affichée avec sa source sur le site.
 */

export interface NavItem {
  readonly label: string;
  readonly href: string;
}

export interface Stat {
  readonly value: string;
  readonly label: string;
  readonly detail?: string;
}

export interface SourcedStats {
  readonly source: string;
  readonly validated: boolean;
  readonly items: readonly Stat[];
}

export const site = {
  name: 'SKM La Fabrik',
  legalName: 'SKM La Fabrik · Association Sunu Kaddu',
  tagline: 'Le Hub Créatif de Rufisque',
  description:
    'SKM La Fabrik est une plateforme créative basée à Rufisque, au Sénégal, qui allie production multimédia, formation et services audiovisuels pour professionnaliser la jeunesse dans les métiers des arts et de la communication.',
  manifesto: 'Nul n’entre ici s’il n’est créatif',
  motto: 'Chaque pas raconte une histoire',
  foundingYear: 2014,
  locale: 'fr_SN',
  address: {
    street: '3ᵉ étage, Cité Senelec (Keur Toubab bi)',
    city: 'Rufisque',
    country: 'Sénégal',
    countryCode: 'SN',
  },
  /**
   * Coordonnées. Le WhatsApp a été confirmé par la structure le 2 novembre 2026.
   * Les numéros de téléphone fixe divergent selon les documents : `phone`
   * reste à `null` tant que le numéro officiel n'est pas confirmé.
   */
  contact: {
    email: 'sunukaddu@gmail.com',
    emailConfirmed: false,
    phone: null as string | null,
    whatsapp: { display: '+221 70 484 40 40', international: '221704844040' } as { display: string; international: string } | null,
    /** Contact du Rio Fresco Fest, figurant sur les affiches et confirmé par la structure le 2 novembre 2026. */
    rffPhone: { display: '+221 70 974 07 41', international: '221709740741' },
  },
  /** Comptes officiels communiqués par la structure le 2 novembre 2026. */
  social: [
    { network: 'Facebook', label: 'Sunu Kaddu', handle: 'sunukaddu', href: 'https://www.facebook.com/sunukaddu' as string | null },
    { network: 'Instagram', label: 'Sunu Kaddu Music', handle: '@sunu_kaddu_music', href: 'https://www.instagram.com/sunu_kaddu_music' as string | null },
    { network: 'Facebook', label: 'PPS the Writah', handle: 'PPSthewritahOfficiel', href: 'https://www.facebook.com/PPSthewritahOfficiel' as string | null },
    { network: 'Instagram', label: 'PPS the Writah', handle: '@pps_the_writah', href: 'https://www.instagram.com/pps_the_writah/' as string | null },
    { network: 'X (Twitter)', label: 'PPS the Writah', handle: '@PPSthewritah', href: 'https://twitter.com/PPSthewritah' as string | null },
    { network: 'Facebook', label: 'Rio Fresco Fest', handle: 'riofrescofestrff', href: 'https://www.facebook.com/riofrescofestrff' as string | null },
    { network: 'Réseaux', label: 'SKM La Fabrik', handle: '@lafabrikskm', href: null as string | null },
  ],
} as const;

export const mainNav: readonly NavItem[] = [
  { label: 'À propos', href: '/a-propos' },
  { label: 'Activités', href: '/activites' },
  { label: 'Projets', href: '/projets' },
  { label: 'Rio Fresco Fest', href: '/rio-fresco-fest' },
  { label: 'Sunu Kaddu Music', href: '/sunu-kaddu-music' },
  { label: 'Impact', href: '/impact' },
  { label: 'Actualités', href: '/actualites' },
];

export const blueprintStats: SourcedStats = {
  source: 'Sunu Kaddu Impact Blueprint, CSR & ESG Partnership 2025-2026',
  validated: false,
  items: [
    { value: '+10', label: 'années', detail: 'd’ancrage local à Rufisque' },
    { value: '+200', label: 'jeunes', detail: 'formés et accompagnés aux métiers créatifs et techniques' },
    { value: '+50', label: 'collaborations', detail: 'artistiques, dont 3 albums produits' },
    { value: '4', label: 'pays de scène', detail: 'États-Unis, France, Allemagne, Maroc' },
    { value: '100', label: 'élèves', detail: 'de 4 lycées mobilisés pour le concours d’art 2024' },
  ],
};

export const rff2026Stats: SourcedStats = {
  source: 'Rapport d’impact officiel Rio Fresco Fest 2026',
  validated: false,
  items: [
    { value: '5 000+', label: 'visiteurs', detail: 'uniques sur le site du festival' },
    { value: '100 000+', label: 'interactions', detail: 'numériques sur Facebook, Instagram et TikTok' },
    { value: '65+', label: 'artistes', detail: 'et professionnels programmés' },
    { value: '5', label: 'jours', detail: 'de festivités et d’ateliers' },
  ],
};

export interface PartnerGroup {
  readonly title: string;
  readonly names: readonly string[];
}

/** Partenaires cités dans les documents. Logos officiels à fournir. */
export const partners: readonly string[] = [
  'Ambassade des États-Unis',
  'Fondation Sococim',
  'Ville de Rufisque',
  'Préfecture de Rufisque',
  'SONAGED',
  'Greenpeace Africa',
  'DGPU',
  'Senegal Talent Campus',
  'Impact Senegal',
  'Visit Rufisque',
];

export const rffPartners: readonly PartnerGroup[] = [
  { title: 'Institutions publiques', names: ['Préfecture de Rufisque', 'Ville de Rufisque', 'Autorités religieuses'] },
  { title: 'Sponsors privés', names: ['DGPU', 'Fondation Sococim'] },
  { title: 'Société civile & ONG', names: ['Greenpeace Africa', 'SONAGED SA', 'Visit Rufisque', 'Diwane G Management'] },
  { title: 'Opérationnel & médias', names: ['GPS Consulting', 'Zodiac7', 'Genius Team', 'L’Imprimeur', 'Casamancaise'] },
];

export interface TeamMember {
  readonly name: string;
  readonly fullName?: string;
  readonly role: string;
  readonly scope: string;
  readonly bio: string;
}

export const team: readonly TeamMember[] = [
  {
    name: 'Fatou B. Sagna',
    role: 'Directrice gestionnaire',
    scope: 'Administration & stratégie',
    bio: 'Garante d’une gouvernance financière et opérationnelle rigoureuse.',
  },
  {
    name: 'PPS the Writah',
    fullName: 'Paul Pissety Sagna',
    role: 'Fondateur · Directeur artistique',
    scope: 'Formateur & coordinateur',
    bio: 'Rappeur natif de Rufisque, alumni du programme OneBeat du Département d’État américain, à l’origine de Sunu Kaddu en 2014.',
  },
  {
    name: 'Ababacar Ndiaye',
    role: 'Sound designer',
    scope: 'Responsable technique & formateur son',
    bio: 'En charge des infrastructures techniques du studio.',
  },
  {
    name: 'Olivier Bandagny',
    role: 'Gestionnaire de projets',
    scope: 'Formateur',
    bio: 'Pilote les programmes éducatifs et le transfert de compétences.',
  },
];
