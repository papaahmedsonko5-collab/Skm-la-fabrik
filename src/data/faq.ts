/**
 * Questions fréquentes. Chaque réponse reprend uniquement des informations
 * présentes dans les documents de la structure ou ailleurs sur le site.
 */
export interface FaqItem {
  readonly id: string;
  readonly q: string;
  /** Réponse en texte simple (utilisée aussi pour les données structurées). */
  readonly a: string;
  readonly link?: { readonly href: string; readonly label: string };
}

export interface FaqGroup {
  readonly title: string;
  readonly items: readonly FaqItem[];
}

export const faq: readonly FaqGroup[] = [
  {
    title: 'SKM La Fabrik',
    items: [
      {
        id: 'quoi',
        q: 'Qu’est-ce que SKM La Fabrik ?',
        a: 'Une plateforme créative basée à Rufisque qui allie production multimédia, formation et services audiovisuels, pour professionnaliser la jeunesse dans les métiers des arts et de la communication. Elle est portée par l’association Sunu Kaddu.',
        link: { href: '/a-propos', label: 'Notre histoire' },
      },
      {
        id: 'ou',
        q: 'Où se trouve SKM La Fabrik ?',
        a: 'Au 3ᵉ étage de la Cité Senelec (Keur Toubab bi), à Rufisque, au Sénégal.',
        link: { href: '/contact', label: 'Nous contacter' },
      },
      {
        id: 'sunu-kaddu',
        q: 'Que veut dire « Sunu Kaddu » ?',
        a: '« Notre Parole » en wolof. C’est le nom du label et de l’association fondés par PPS the Writah, rappeur natif de Rufisque.',
        link: { href: '/sunu-kaddu-music', label: 'Le label' },
      },
    ],
  },
  {
    title: 'Studio et production musicale',
    items: [
      {
        id: 'prix-titre',
        q: 'Combien coûte l’enregistrement d’un titre ?',
        a: 'La formule Studio Starter comprend l’enregistrement d’un titre avec mix et mastering standard pour 15 000 FCFA. Un titre produit de A à Z, avec beat, photos et clip, relève de la formule Studio Pro.',
        link: { href: '/sunu-kaddu-music#studio', label: 'Toutes les formules studio' },
      },
      {
        id: 'location',
        q: 'Peut-on louer le studio ?',
        a: 'Oui : 50 000 FCFA la session de 4 heures et 75 000 FCFA la journée de 8 heures.',
        link: { href: '/contact?objet=production&detail=Location%20du%20studio', label: 'Réserver le studio' },
      },
      {
        id: 'projets',
        q: 'Produisez-vous des EP et des albums ?',
        a: 'Oui : EP de 5 titres à 200 000 FCFA, mixtape de 10 titres à 400 000 FCFA et album de 15 titres à 600 000 FCFA, avec programmation, enregistrement, mixage, mastering et pochette.',
        link: { href: '/contact?objet=production', label: 'Parler de mon projet' },
      },
    ],
  },
  {
    title: 'Formations et prestations',
    items: [
      {
        id: 'formations',
        q: 'Quelles formations proposez-vous ?',
        a: 'Des formations aux métiers créatifs et techniques : audiovisuel, production sonore, montage vidéo, graphisme et communication digitale, ainsi que des ateliers pour des groupes.',
        link: { href: '/activites#formation', label: 'Le pôle formation' },
      },
      {
        id: 'entreprises',
        q: 'Travaillez-vous pour les entreprises et les institutions ?',
        a: 'Oui : voix off, sound design, reportages, mini-documentaires, photo, création graphique et couverture d’événements, pour les structures publiques, ONG, startups et entreprises.',
        link: { href: '/activites#offre', label: 'L’offre entreprises' },
      },
      {
        id: 'devis',
        q: 'Les tarifs affichés sont-ils définitifs ?',
        a: 'Les tarifs sont indiqués en francs CFA et peuvent évoluer. Chaque demande fait l’objet d’un devis précis.',
        link: { href: '/contact?objet=prestation', label: 'Demander un devis' },
      },
    ],
  },
  {
    title: 'Rio Fresco Fest et partenariats',
    items: [
      {
        id: 'rff-quand',
        q: 'Quand a lieu le Rio Fresco Fest ?',
        a: 'Chaque année en juin, à Rufisque. L’édition 2026 s’est tenue du 10 au 14 juin au Boulodrome ; les dates de l’édition 2027 seront annoncées.',
        link: { href: '/rio-fresco-fest', label: 'Le festival' },
      },
      {
        id: 'partenaire',
        q: 'Comment devenir partenaire ?',
        a: 'Deux formules existent, Partenaire événement et Partenaire fondateur, et une offre sur mesure peut être construite. La première étape est une rencontre de découverte de 30 minutes.',
        link: { href: '/impact#t-part', label: 'Les formules de partenariat' },
      },
    ],
  },
  {
    title: 'Nous joindre',
    items: [
      {
        id: 'joindre',
        q: 'Comment vous contacter le plus vite ?',
        a: 'Par WhatsApp au +221 70 484 40 40, par e-mail à sunukaddu@gmail.com ou avec le formulaire de contact.',
        link: { href: '/contact', label: 'Page contact' },
      },
    ],
  },
];
