/** Contenus de la page À propos, repris des documents institutionnels. */

export interface TimelineStep {
  readonly year: string;
  readonly title: string;
  readonly text: string;
}

export const timeline: readonly TimelineStep[] = [
  {
    year: '2013',
    title: 'Les fondations : OneBeat Sénégal',
    text: 'Session historique de formation en ingénierie du son à Rufisque. Avec l’Ambassade des États-Unis et la Fondation Sococim, 15 jeunes de la ville sont formés par des ingénieurs de New York.',
  },
  {
    year: '2014',
    title: 'L’origine : Sunu Kaddu et le Studio Key I Am',
    text: 'Création de Sunu Kaddu par l’artiste PPS the Writah. Le studio hi-tech Key I Am naît de la collaboration avec la Fondation Sococim, dans la vieille ville.',
  },
  {
    year: '2015',
    title: 'L’explosion',
    text: 'Sortie de la compilation Sunu Tape, qui réunit 23 jeunes artistes, et de l’album Xaatim ak Kallama, Meilleur Album aux Galsen Hip Hop Awards.',
  },
  {
    year: '2016 – 2023',
    title: 'La scène',
    text: 'Déploiement de Rufisque en Live et de la Loge des Poètes, jusqu’au Théâtre national Daniel Sorano et au CICES.',
  },
  {
    year: '2024',
    title: 'L’évolution : naissance de SKM La Fabrik',
    text: 'L’évolution du marché culturel vers le numérique impose une transition : la structure devient un véritable pôle de production audiovisuelle. Partenariat avec l’Ambassade des États-Unis à la Biennale de Dakar, 100 élèves mobilisés.',
  },
  {
    year: '2025',
    title: 'La consécration : Rio Fresco Fest',
    text: 'Première édition du festival sur la digue de Rufisque, les 14 et 15 juin 2025.',
  },
  {
    year: '2026',
    title: 'Héritages & Horizons',
    text: 'Rio Fresco Fest 2026 : cinq jours, quatre piliers, du 10 au 14 juin au Boulodrome de Rufisque.',
  },
];

export interface Value {
  readonly title: string;
  readonly text: string;
}

export const values: readonly Value[] = [
  { title: 'Créativité', text: 'Nul n’entre ici s’il n’est créatif : la création est notre point de départ et notre standard.' },
  { title: 'Transmission', text: 'Le savoir-faire se transmet : les jeunes formés en 2013 font aujourd’hui vivre le studio.' },
  { title: 'Professionnalisme', text: 'La culture urbaine rencontre l’exigence professionnelle, avec une équipe et une infrastructure permanentes.' },
  { title: 'Innovation', text: 'Un studio 360, la transition numérique et de nouveaux formats pour raconter Rufisque.' },
  { title: 'Engagement', text: 'Enracinés dans notre ville : inclusion, éducation, environnement et réinvestissement communautaire.' },
];

export interface CycleStep {
  readonly title: string;
  readonly tag: string;
  readonly text: string;
}

export const cycle: readonly CycleStep[] = [
  { title: 'L’entrée', tag: 'Social', text: 'Formation de la jeunesse de Rufisque aux métiers du multimédia.' },
  { title: 'La pratique', tag: 'Production', text: 'Utilisation des infrastructures de La Fabrik pour créer des contenus de haute qualité.' },
  { title: 'La sortie', tag: 'Commercial', text: 'Prestations de services vendues aux entreprises et aux artistes locaux.' },
  {
    title: 'La boucle',
    tag: 'Réinvestissement',
    text: 'Autonomie financière par la vente de services, réinvestie pour financer les prochaines cohortes de formation.',
  },
];
