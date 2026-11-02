/**
 * Contenus du Rio Fresco Fest. Source : « Rio Fresco Fest 2026, Rapport
 * d’impact officiel & bilan de redevabilité » et « Sunu Kaddu Impact Blueprint ».
 */

export interface Pilier {
  readonly num: string;
  readonly name: string;
  readonly days: string;
  readonly theme: string;
  readonly title: string;
  readonly lead: string;
  readonly actions: readonly { readonly k: string; readonly v: string }[];
  readonly audience: string;
}

export const rff = {
  name: 'Rio Fresco Fest',
  organizer: 'Sunu Kaddu Music',
  edition2026: {
    title: 'Héritages & Horizons',
    subtitle: 'Bâtir ensemble l’avenir de Rufisque',
    dates: '10 au 14 juin 2026',
    startDate: '2026-06-10',
    endDate: '2026-06-14',
    place: 'Boulodrome, derrière l’église Sainte-Agnès, Rufisque',
    implantation:
      'L’installation du village éphémère au Boulodrome, derrière l’église Sainte-Agnès, a été un choix délibéré pour créer un dialogue singulier entre la jeunesse, les institutions et les forces vives du territoire.',
  },
  quote: {
    text: 'Chaque année, le Rio Fresco Fest prouve que la culture est le meilleur catalyseur de développement pour un territoire. Rufisque le mérite, et nous continuerons à le porter avec exigence et fierté.',
    author: 'Paul P. Sagna, dit PPS the Writah',
    role: 'Président de l’association Sunu Kaddu',
  },
  /** Playlist officielle citée (lien cliquable) dans le rapport d’impact 2026. */
  playlistId: 'PLkj6oueoO2k9cF5I8iaKtyo2pfF_pCf23',
  playlist: 'https://www.youtube.com/playlist?list=PLkj6oueoO2k9cF5I8iaKtyo2pfF_pCf23',
  budget: '10 250 000 FCFA',
} as const;

export const piliers: readonly Pilier[] = [
  {
    num: '01',
    name: 'Fondation',
    days: 'Mer. 10 – jeu. 11 juin',
    theme: 'Terre & climat',
    title: 'Urgence écologique & Action Verte',
    lead: 'Passer de la parole aux actes pour la justice climatique côtière.',
    actions: [
      { k: 'Réhabilitation', v: 'Une digue entièrement nettoyée et aménagée par les bénévoles locaux et la SONAGED.' },
      { k: 'Économie circulaire', v: 'Ateliers Green Lab sur le recyclage et construction de bancs publics en pneus de récupération, avec Diwane G Management.' },
      { k: 'Sensibilisation', v: 'Fresque murale participative sur l’érosion côtière, avec Greenpeace Africa.' },
    ],
    audience: 'Mouvements citoyens & bénévoles',
  },
  {
    num: '02',
    name: 'Célébration',
    days: 'Ven. 12 juin',
    theme: 'Patrimoine & transmission',
    title: 'Héritage, mémoire & validation institutionnelle',
    lead: 'Une cérémonie officielle, un hommage et une transmission entre générations.',
    actions: [
      { k: 'Présence protocolaire', v: 'Cérémonie officielle avec M. le Préfet (Magatte Diouck), M. le Maire et les autorités religieuses.' },
      { k: 'Devoir de mémoire', v: 'Trophée honorifique posthume remis à la famille de la diva rufisquoise Adja Khar Mbaye Madiaga.' },
      { k: 'Transmission', v: 'Concert anniversaire du parrain Baaba Maal, partageant la scène avec la nouvelle génération. SABAR.' },
    ],
    audience: 'Autorités, familles, grand public',
  },
  {
    num: '03',
    name: 'Vibration',
    days: 'Sam. 13 juin',
    theme: 'Jeunesse & cultures urbaines',
    title: 'Vibrations urbaines & puissance créative',
    lead: 'Fédérer toutes les expressions artistiques contemporaines autour d’une identité rufisquoise forte.',
    actions: [
      { k: 'La Loge des Poètes', v: 'Plateau réunissant DJ Djilass, Samba Peuzzi, Leuz Diwane G, PPS the Writah et Oothentik Zeus.' },
      { k: 'Arts visuels & mode', v: 'Défilé mettant en lumière l’artisanat sénégalais, sessions de graffiti en direct et cyphers slam.' },
    ],
    audience: 'Jeunesse, créateurs locaux',
  },
  {
    num: '04',
    name: 'Réflexion',
    days: 'Dim. 14 juin',
    theme: 'Esprit & citoyenneté',
    title: 'Cohésion sociale & réflexion citoyenne',
    lead: 'Des compétitions de l’esprit, un débat d’experts et une veillée pour clôturer dans la paix.',
    actions: [
      { k: 'Tournois intergénérationnels', v: 'Échecs, Scrabble et pétanque, réunissant toutes les tranches d’âge au Boulodrome.' },
      { k: 'Conférence & veillée', v: 'Débat d’experts (Teranga Lab, Greenpeace) sur l’érosion côtière et la surpêche, suivi de contes traditionnels.' },
      { k: 'Voisinage harmonieux', v: 'Démarche de consultation garantissant un climat de respect avec les riverains et la paroisse Sainte-Agnès.' },
    ],
    audience: 'Intergénérationnel, experts, riverains',
  },
];

/**
 * Première édition. Programme repris de l'affiche officielle « Programme RFF 2025 »
 * et de l'affiche Set Setal transmises par la structure le 2 novembre 2026.
 */
export const edition2025 = {
  dates: '14 et 15 juin 2025',
  place: 'Digue de Rufisque',
  concept:
    'Un village culturel éphémère érigé directement sur la digue de Rufisque, pour combler le manque d’événements culturels majeurs dans la ville historique.',
  formats: ['Expo', 'Jeux', 'Street food', 'Conférence', 'Concerts'],
  programme: [
    { k: 'Musique', v: 'La Loge des Poètes (rap et slam) et musiques actuelles et alternatives.' },
    { k: 'Patrimoine', v: 'Expositions « Rufisque, ville d’histoire ».' },
    { k: 'Communauté', v: 'Conférence sur la place des jeunes dans le développement communautaire, street food, pétanque et échecs.' },
  ],
  jours: [
    {
      date: '11 juin',
      title: 'Set Setal',
      text: 'Nettoyage citoyen de la digue de Rufisque, derrière l’église Sainte-Agnès, en partenariat avec la SONAGED.',
      artists: [],
    },
    {
      date: 'Samedi 14 juin',
      title: 'La Loge des Poètes',
      text: 'Le plateau rap et slam de Sunu Kaddu.',
      artists: [
        'PPS the Writah', 'Elzo Jamdong', 'Oothentik Zeus', 'Big DatX', 'Taijiscin', 'Dookapi', 'FoSirMeuz', 'Oliblez', 'BND',
        'Mbaye La', 'Getma', 'MD Finger', 'DJ Nina', 'Samba Peuzzi', 'Gunmor', 'Nitdoff', 'Akbess', 'Karballah', 'FEE', 'Bura',
        'Buurmag', 'Big Brain', 'Kalamou SB', 'Benny the Writah', 'Biibah Style', 'Big Point',
      ],
    },
    {
      date: 'Dimanche 15 juin',
      title: 'Musiques actuelles et alternatives',
      text: 'La scène MAA.',
      artists: ['Ali Beta', 'Ibaaku', 'Satou Bamby', 'El Maestro', 'Annas', 'Dozart', 'Yankhoba', 'Zito', 'Chantal Barry', 'Yussu', 'Eljah', 'Alvine'],
    },
  ],
  conference: {
    title: 'Rôle et place des jeunes dans le développement communautaire',
    speaker: 'Malal Almamy Talla (Fou Malade)',
  },
  exposition: 'Rufisque, ville d’histoire',
  partners: [
    'DGPU', 'Senelec', 'Fondation Sococim', 'Groupe Kirène', 'Faye Builder BTP', 'Kheude Business Group', 'Association Impact Sénégal',
    'Sénégal Talents Campus', 'MBS Agence de publicité', 'Visit Rufisque', 'SONAGED',
  ],
} as const;

export const horizon2027: readonly { num: string; title: string; points: readonly string[] }[] = [
  {
    num: '01',
    title: 'Ancrage & pérennisation',
    points: [
      'Négocier avec la Mairie une convention d’occupation pérenne du Boulodrome et de la digue.',
      'Lancement immédiat des démarches de sponsoring.',
    ],
  },
  {
    num: '02',
    title: 'Formation continue',
    points: ['Structurer les ateliers du Green Lab en programmes de formation annuels au sein du hub SKM La Fabrik.'],
  },
  {
    num: '03',
    title: 'Expansion & international',
    points: [
      'Déployer des scènes pop-up dans les quartiers.',
      'Engager des bailleurs internationaux (Institut français, OIF, Fondation Prince Claus).',
    ],
  },
];

export const rayonnement: readonly { title: string; text: string }[] = [
  { title: '100 000+ interactions', text: 'générées sur Facebook, Instagram et TikTok.' },
  { title: 'Une playlist officielle YouTube', text: 'documentant l’intégralité des cinq jours.' },
  { title: 'Une banque média haute définition', text: 'au service des partenaires et de la promotion territoriale de Rufisque.' },
];
