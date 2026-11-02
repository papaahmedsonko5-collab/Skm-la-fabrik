/**
 * Label Sunu Kaddu Music. Source : « Sunu Kaddu Music : l’épopée culturelle
 * de Rufisque » et « Sunu Kaddu Impact Blueprint ».
 */

export const label = {
  meaning: '« Notre Parole » en wolof',
  vision:
    'Sunu Kaddu Music est le fruit de la vision de PPS the Writah, rappeur natif de Rufisque et premier ambassadeur de la ville sur la scène hip-hop internationale. Sélectionné pour le programme OneBeat par Found Sound Nation et le Département d’État américain, il découvre aux États-Unis le pouvoir de la culture comme moteur d’éducation, de développement et de solidarité.',
  mission:
    'C’est avec cette volonté de partage que PPS fonde Sunu Kaddu, un espace conçu pour légitimer la créativité d’une jeunesse souvent ignorée par les structures formelles.',
} as const;

export const heritage: readonly { year: string; title: string; text: string }[] = [
  {
    year: '2013',
    title: 'OneBeat Sénégal',
    text: 'Une session de formation en ingénierie du son à Rufisque. Avec l’Ambassade des États-Unis et la Fondation Sococim, 15 jeunes locaux sont formés par des ingénieurs venus de New York.',
  },
  {
    year: '2014',
    title: 'Studio Key I Am',
    text: 'Né de la collaboration avec la Fondation Sococim, ce studio est le pilier de l’essor culturel de la vieille ville. Le savoir-faire s’y transmet, porté par Father Babs et Bazik, eux-mêmes issus de la formation de 2013.',
  },
  {
    year: '2015',
    title: 'Xaatim ak Kallama',
    text: 'L’album de PPS the Writah est couronné Meilleur Album aux Galsen Hip Hop Awards.',
  },
];

export interface Production {
  readonly title: string;
  readonly kind: string;
}

/** Récapitulatif des productions majeures tel qu’il figure dans le document du label. */
export const productions: readonly Production[] = [
  { title: 'Xaatim ak Kallama', kind: 'Album' },
  { title: 'Ninki Nanka', kind: 'Album' },
  { title: 'Bés Bu Bées', kind: 'Album' },
  { title: 'Sunu Tape Vol. 1', kind: 'Compilation, 23 titres' },
  { title: 'Xtape Vol. 2', kind: 'Mixtape' },
  { title: 'Made In Galsen Vol. 1 & 2', kind: 'EP' },
  { title: 'Black Saiyan', kind: 'EP' },
  { title: 'Juda (ID SN)', kind: 'Single' },
  { title: 'Nangul (FEE)', kind: 'Single' },
  { title: 'Xalé (Amdy Opti)', kind: 'Single' },
];

export const scenes: readonly { name: string; place: string }[] = [
  { name: 'La Loge des Poètes', place: 'Sorano, CICES, Thiès' },
  { name: 'Rufisque en Live', place: 'Centre culturel Maurice Guèye' },
  { name: 'Rio Fresco Fest', place: 'Rufisque' },
  { name: 'Xshow & Sargal', place: 'EFI et Jardin public' },
  { name: 'Sunu Show', place: 'Tournée régionale' },
];

export const sunuTapeArtists: readonly string[] = [
  'Cherifou',
  'Taiji Scin',
  'Big Dat X',
  'Salihu Jam',
  'Magg Daddy',
  'Tikey the Lighter',
  'You May',
  'Hood’art',
  'Bura',
  'Zoo Rio',
  'Youzy',
  'Med Metti',
  'Big Brain',
  'Amdy Opti',
  'Fire Flow',
  'Mouskalaf',
  'Tegal 16',
  'Banc bi Crew',
  'Mass Cool J',
];
