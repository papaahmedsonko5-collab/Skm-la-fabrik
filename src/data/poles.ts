import { photos, type Photo } from './photos';

export interface PoleItem {
  readonly k: string;
  readonly v: string;
}

export interface Pole {
  readonly id: string;
  readonly num: string;
  readonly title: string;
  readonly kicker: string;
  readonly short: string;
  readonly text: string;
  readonly photo: Photo;
  readonly items: readonly PoleItem[];
  readonly cta: { readonly label: string; readonly href: string };
  readonly cta2: { readonly label: string; readonly href: string };
}

export const poles: readonly Pole[] = [
  {
    id: 'formation',
    num: '01',
    title: 'Formation',
    kicker: 'Pôle formation',
    short: 'Apprentissage pratique aux métiers de l’audiovisuel, du son, du graphisme et de la communication digitale.',
    text: 'Acquisition de compétences en audiovisuel, production sonore, montage vidéo, graphisme et communication digitale. Un apprentissage par la pratique, au cœur d’un studio en activité.',
    photo: photos.formation,
    items: [
      { k: 'Apprentissage pratique', v: 'Programme pédagogique développé avec Senegal Talent Campus et Impact Senegal.' },
      { k: 'Ateliers créatifs', v: 'DJing, slam, audiovisuel et graffiti pour la jeunesse locale.' },
      { k: 'Accompagnement', v: 'Suivi des jeunes talents, de la première session au projet professionnel.' },
      { k: 'Coworking créatif', v: 'Espace collaboratif dédié aux jeunes créateurs et entrepreneurs culturels de Rufisque.' },
      { k: 'Compétences', v: 'Rédaction et gestion de projet, ateliers et formations sur mesure.' },
    ],
    cta: { label: 'Demander une formation', href: '/contact?objet=formation' },
    cta2: { label: 'Voir les formations', href: '/projets?categorie=Formations' },
  },
  {
    id: 'evenementiel',
    num: '02',
    title: 'Événementiel',
    kicker: 'Pôle événementiel',
    short: 'Conception, coordination et production technique d’événements pour institutions et entreprises.',
    text: 'Une décennie d’expérience à rassembler et engager le public en toute sécurité. De la conception à la captation, nous portons vos événements de bout en bout.',
    photo: photos.sceneDanse,
    items: [
      { k: 'Conception', v: 'Showcases, conférences et rencontres professionnelles.' },
      { k: 'Organisation', v: 'Coordination avec les autorités, les partenaires et les riverains.' },
      { k: 'Production technique', v: 'Scène, son, lumière et captations live.' },
      { k: 'Couverture', v: 'Couverture photo et vidéo d’événements officiels.' },
      { k: 'Institutions & entreprises', v: 'Prestations sur mesure pour structures publiques, ONG et sociétés.' },
    ],
    cta: { label: 'Demander un devis', href: '/contact?objet=prestation' },
    cta2: { label: 'Nos références', href: '/projets?categorie=%C3%89v%C3%A9nements' },
  },
  {
    id: 'festivals',
    num: '03',
    title: 'Festivals',
    kicker: 'Pôle festivals',
    short: 'Le Rio Fresco Fest et les scènes emblématiques : Loge des Poètes, Rufisque en Live, Sunu Show.',
    text: 'Des plateformes de diffusion majeures pour les artistes de Rufisque et du Sénégal, avec le Rio Fresco Fest comme projet phare.',
    photo: photos.rffFoule,
    items: [
      { k: 'Rio Fresco Fest', v: 'Festival annuel, village culturel éphémère. Éditions 2025 et 2026.' },
      { k: 'La Loge des Poètes', v: 'Rap et slam : Théâtre Sorano, CICES, Thiès.' },
      { k: 'Rufisque en Live', v: 'Centre culturel Maurice Gueye.' },
      { k: 'Xshow & Sargal', v: 'EFI et Jardin public.' },
      { k: 'Sunu Show', v: 'Tournée régionale.' },
    ],
    cta: { label: 'Découvrir le Rio Fresco Fest', href: '/rio-fresco-fest' },
    cta2: { label: 'Devenir partenaire', href: '/contact?objet=partenariat' },
  },
  {
    id: 'production',
    num: '04',
    title: 'Production musicale',
    kicker: 'Pôle production · Sunu Kaddu Music',
    short: 'Sunu Kaddu Music : studio 360, composition, enregistrement, mixage, mastering.',
    text: 'Un pôle audiovisuel performant et un studio 360 modernisé, opérationnel depuis 2014 : une unité de production complète.',
    photo: photos.studio,
    items: [
      { k: 'Studio de musique 360', v: 'Composition, enregistrement voix et instruments, mixage, mastering.' },
      { k: 'Habillage sonore', v: 'Sound design et voix off.' },
      { k: 'Studio photo et vidéo', v: 'Shooting, clip vidéo, publireportage.' },
      { k: 'Formats', v: 'Podcast, publicité, captations live.' },
    ],
    cta: { label: 'Explorer Sunu Kaddu Music', href: '/sunu-kaddu-music' },
    cta2: { label: 'Réserver le studio', href: '/contact?objet=production' },
  },
  {
    id: 'communaute',
    num: '05',
    title: 'Communauté',
    kicker: 'Pôle communautaire',
    short: 'Inclusion, éducation, réinsertion et environnement : la culture au service du territoire.',
    text: 'Le mouvement hip-hop est l’arbre qui cache une forêt d’initiatives de terrain : inclusion, éducation, réinsertion et environnement.',
    photo: photos.communaute,
    items: [
      { k: 'Inclusion', v: 'Handischool Day à l’école Le Petit Prince.' },
      { k: 'Éducation', v: 'Concours d’art scolaire, Biennale 2024 : 100 élèves de 4 lycées.' },
      { k: 'Réinsertion', v: 'Ateliers d’écriture et d’expression à Fort B.' },
      { k: 'Environnement', v: 'Set Setal sur la digue, avec la SONAGED.' },
    ],
    cta: { label: 'Voir notre impact', href: '/impact' },
    cta2: { label: 'Proposer une collaboration', href: '/contact?objet=partenariat' },
  },
];
