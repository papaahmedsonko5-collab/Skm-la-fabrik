/**
 * Grilles tarifaires SKM La Fabrik (documents « Formules artistes & créatifs »
 * et « Formules entreprises & institutions »). Prix en francs CFA, à confirmer
 * avant publication définitive.
 */

export const tarifsSource =
  'Tarifs en francs CFA issus des grilles « Formules » 2026 de SKM La Fabrik, susceptibles d’évoluer : un devis précis est établi pour chaque demande.';

export interface PriceLine {
  readonly label: string;
  readonly price: string;
}

export interface Offre {
  readonly id: string;
  readonly name: string;
  readonly pitch: string;
  readonly lines: readonly PriceLine[];
  readonly highlight?: boolean;
}

export const offresEntreprises: readonly Offre[] = [
  {
    id: 'voix-pub',
    name: 'Voix & pub Starter',
    pitch: 'Des contenus audio et visuels pour les campagnes des structures locales.',
    lines: [
      { label: 'Enregistrement voix off professionnel', price: '50 000' },
      { label: 'Sound design & habillage sonore', price: '100 000' },
    ],
  },
  {
    id: 'pro',
    name: 'Formule Pro',
    pitch: 'Des contenus de communication modernes et percutants pour un programme ou une campagne.',
    lines: [
      { label: 'Reportage vidéo ou mini-documentaire (1 à 2 jours de tournage)', price: '500 000' },
      { label: 'Création graphique (affiches, bannières, motion)', price: '150 000' },
      { label: 'Interview ou témoignages de bénéficiaires', price: '300 000' },
    ],
  },
  {
    id: 'premium',
    name: 'Formule Premium',
    pitch: 'Accompagner les grands programmes dans la valorisation de leurs actions et de leurs bénéficiaires.',
    highlight: true,
    lines: [
      { label: 'Mini-documentaire institutionnel (3 à 5 jours de tournage)', price: '1 200 000' },
      { label: 'Photo reportage professionnel', price: '300 000' },
      { label: 'Charte graphique & kit visuel complet', price: '300 000' },
      { label: 'Couverture d’événements officiels (photo et vidéo)', price: '800 000' },
    ],
  },
];

export const offresArtistes: readonly Offre[] = [
  {
    id: 'starter',
    name: 'Studio Starter',
    pitch: 'Pour enregistrer un premier titre dans de bonnes conditions.',
    lines: [
      { label: 'Enregistrement 1 titre, mix & mastering standard', price: '15 000' },
      { label: 'Accompagnement vocal ou direction artistique', price: '10 000' },
      { label: 'Visuel de cover (1 design)', price: '10 000' },
    ],
  },
  {
    id: 'studio-pro',
    name: 'Studio Pro',
    pitch: 'Un titre produit de A à Z, avec son image.',
    lines: [
      { label: 'Programmation d’un beat', price: '25 000' },
      { label: 'Enregistrement, mix & mastering professionnel', price: '15 000' },
      { label: 'Shooting photo promotionnel (10 photos HD)', price: '50 000' },
      { label: 'Clip vidéo (1 jour de tournage, 1 lieu)', price: '150 000' },
    ],
  },
  {
    id: 'projets',
    name: 'EP · Mixtape · Album',
    pitch: 'Programmation, enregistrement, mixage et mastering, pochette offerte. Direction artistique et photos dès la mixtape, coaching inclus pour l’album.',
    highlight: true,
    lines: [
      { label: 'EP, 5 titres', price: '200 000' },
      { label: 'Mixtape, 10 titres (+ 5 photos)', price: '400 000' },
      { label: 'Album, 15 titres (+ 10 photos, coaching)', price: '600 000' },
    ],
  },
  {
    id: 'carte',
    name: 'À la carte',
    pitch: 'Mixage, mastering et location du studio.',
    lines: [
      { label: 'Mixage par chanson', price: '10 000 à 25 000' },
      { label: 'Mastering par piste', price: '10 000 à 25 000' },
      { label: 'Location studio, session de 4 h', price: '50 000' },
      { label: 'Location studio, journée de 8 h', price: '75 000' },
    ],
  },
];
