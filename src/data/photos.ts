/**
 * Photographies authentiques extraites des documents de SKM La Fabrik et du
 * rapport du Rio Fresco Fest 2026. Crédits photo à confirmer (© The_Meuss
 * apparaît sur certains visuels du rapport).
 */
import type { ImageMetadata } from 'astro';
import ceremonie from '@/assets/photos/ceremonie-officielle.jpg';
import chanteuse from '@/assets/photos/chanteuse.jpg';
import communaute from '@/assets/photos/communaute.jpg';
import defile from '@/assets/photos/defile.jpg';
import formation from '@/assets/photos/formation-son.jpg';
import fortB from '@/assets/photos/fort-b.jpg';
import fresque from '@/assets/photos/fresque-adja-khar.jpg';
import handischool from '@/assets/photos/handischool-day.jpg';
import rffDanse from '@/assets/photos/rff-danse.jpg';
import rffDigue from '@/assets/photos/rff-digue-bancs.jpg';
import rffFoule from '@/assets/photos/rff-foule-nuit.jpg';
import scene1 from '@/assets/photos/scene-artiste-1.jpg';
import scene2 from '@/assets/photos/scene-artiste-2.jpg';
import scene3 from '@/assets/photos/scene-artiste-3.jpg';
import sceneDanse from '@/assets/photos/scene-danse.jpg';
import sceneNuit from '@/assets/photos/scene-nuit.jpg';
import setSetal from '@/assets/photos/set-setal.jpg';
import studio from '@/assets/photos/studio-key-i-am.jpg';
import echecs from '@/assets/photos/tournoi-echecs.jpg';
import p26Hero from '@/assets/photos/rff2026/parade-danseuses-hero.jpg';
import p26Parade from '@/assets/photos/rff2026/parade-danseuses.jpg';
import p26Caleche from '@/assets/photos/rff2026/parade-caleche.jpg';
import p26CalecheRouge from '@/assets/photos/rff2026/caleche-tenues-rouges.jpg';
import p26Digue from '@/assets/photos/rff2026/digue-fauteuils-pneus.jpg';
import p26Delegation from '@/assets/photos/rff2026/autorites-delegation.jpg';
import p26Discours from '@/assets/photos/rff2026/discours-officiel.jpg';
import p26AutoritesFresque from '@/assets/photos/rff2026/autorites-fresque.jpg';
import p26FresqueEchanges from '@/assets/photos/rff2026/fresque-echanges.jpg';
import p26Scene from '@/assets/photos/rff2026/scene-artiste.jpg';
import p26Loge1 from '@/assets/photos/rff2026/loge-poetes-1.jpg';
import p26Loge2 from '@/assets/photos/rff2026/loge-poetes-2.jpg';
import p26Preparation from '@/assets/photos/rff2026/preparation-site.jpg';
import p26InvitesDigue from '@/assets/photos/rff2026/invites-digue.jpg';
import p26Promenade from '@/assets/photos/rff2026/invites-promenade.jpg';
import p26Dj from '@/assets/photos/rff2026/scene-dj.jpg';
import p26RappeurNoir from '@/assets/photos/rff2026/scene-rappeur-noir.jpg';
import p26RappeurPortrait from '@/assets/photos/rff2026/scene-rappeur-portrait.jpg';
import p26ChanteuseOrange from '@/assets/photos/rff2026/scene-chanteuse-orange.jpg';
import p26Chapeau from '@/assets/photos/rff2026/scene-artiste-chapeau.jpg';
import p26Cuir from '@/assets/photos/rff2026/scene-artiste-cuir.jpg';
import p26Lunettes from '@/assets/photos/rff2026/scene-rappeur-lunettes.jpg';
import p26Jean from '@/assets/photos/rff2026/scene-rappeur-jean.jpg';
import p26Raye from '@/assets/photos/rff2026/scene-rappeur-raye.jpg';
import rff25Accueil from '@/assets/photos/rff2025-accueil-autorites.jpg';
import rff25Affiche from '@/assets/photos/rff2025-affiche-programme.jpg';
import rff25SetSetal from '@/assets/photos/rff2025-affiche-set-setal.jpg';
import rff25Autorites from '@/assets/photos/rff2025-autorites.jpg';
import rff25Quartier from '@/assets/photos/rff2025-quartier.jpg';
import rff25Remparts from '@/assets/photos/rff2025-remparts.jpg';
import rff25Scene from '@/assets/photos/rff2025-scene-coucher.jpg';
import rff25Site from '@/assets/photos/rff2025-site-village.jpg';
import rff25Tapis from '@/assets/photos/rff2025-tapis-rouge.jpg';
import rff25Moto from '@/assets/photos/rff2025-expo-moto.jpg';
import rff25Aerien from '@/assets/photos/rff2025-vue-aerienne.jpg';
import rff25Deudeuche from '@/assets/photos/rff2025-2cv.jpg';
import rff25Voitures from '@/assets/photos/rff2025-voitures.jpg';
import rff25ExpoHistoire from '@/assets/photos/rff2025-expo-histoire.jpg';
import rff25Djembe from '@/assets/photos/rff2025-djembe.jpg';
import rff25Percussions from '@/assets/photos/rff2025-percussions.jpg';
import rff25Artistes from '@/assets/photos/rff2025-artistes.jpg';
import rff25Loge1 from '@/assets/photos/rff2025-loge-1.jpg';
import rff25Loge2 from '@/assets/photos/rff2025-loge-2.jpg';
import rff25Loge3 from '@/assets/photos/rff2025-loge-3.jpg';
import rff25Loge4 from '@/assets/photos/rff2025-loge-4.jpg';
import rff25Loge5 from '@/assets/photos/rff2025-loge-5.jpg';
import rff25Loge6 from '@/assets/photos/rff2025-loge-6.jpg';
import rff25Loge7 from '@/assets/photos/rff2025-loge-7.jpg';
import rff25Loge8 from '@/assets/photos/rff2025-loge-8.jpg';
import lieuCouloirStudio from '@/assets/photos/lieu/couloir-studio.jpg';
import lieuCabine from '@/assets/photos/lieu/studio-cabine.jpg';
import lieuPoste from '@/assets/photos/lieu/poste-production.jpg';
import lieuInterface from '@/assets/photos/lieu/interface-audio.jpg';
import lieuClavier from '@/assets/photos/lieu/clavier.jpg';
import lieuOrgue from '@/assets/photos/lieu/orgue.jpg';
import lieuFormation from '@/assets/photos/lieu/salle-formation.jpg';
import lieuBureau from '@/assets/photos/lieu/bureau.jpg';
import lieuMur from '@/assets/photos/lieu/mur-citations.jpg';
import lieuAffiches from '@/assets/photos/lieu/mur-affiches.jpg';
import lieuKeyiam from '@/assets/photos/lieu/keyiam-studio.jpg';
import lieuMicro from '@/assets/photos/lieu/cabine-micro.jpg';
import lieuEnceinte from '@/assets/photos/lieu/enceinte.jpg';
import lieuPorte from '@/assets/photos/lieu/porte-creatif.jpg';
import lieuGraffiti from '@/assets/photos/lieu/couloir-graffiti.jpg';
import lieuCartes from '@/assets/photos/lieu/cartes-postales.jpg';
import lieuSunuTape from '@/assets/photos/lieu/affiche-sunu-tape.jpg';
import lieuTag from '@/assets/photos/lieu/tag-skm.jpg';
import lieuArtistes from '@/assets/photos/lieu/mur-artistes.jpg';
import lieuTrophees from '@/assets/photos/lieu/etagere-trophees.jpg';

export interface Photo {
  readonly src: ImageMetadata;
  readonly alt: string;
}

const p = (src: ImageMetadata, alt: string): Photo => ({ src, alt });

export const photos = {
  ceremonie: p(ceremonie, 'Cérémonie officielle du Rio Fresco Fest 2026 en présence des autorités'),
  chanteuse: p(chanteuse, 'Chanteuse sur la scène du Rio Fresco Fest'),
  communaute: p(communaute, 'Habitantes et habitants de Rufisque réunis avec l’équipe Sunu Kaddu'),
  defile: p(defile, 'Défilé de mode mettant en lumière l’artisanat sénégalais'),
  formation: p(formation, 'Jeunes en formation technique au son autour d’une console'),
  fortB: p(fortB, 'Atelier technique réunissant des jeunes autour d’un ordinateur'),
  fresque: p(fresque, 'Fresque murale en hommage à Adja Khar Mbaye Madiaga'),
  handischool: p(handischool, 'Enfants et équipe Sunu Kaddu assis en cercle pendant le Handischool Day'),
  rffDanse: p(rffDanse, 'Danseuses en tenues traditionnelles au Rio Fresco Fest'),
  rffDigue: p(rffDigue, 'Bancs en pneus recyclés face à l’océan, sur la digue de Rufisque'),
  rffFoule: p(rffFoule, 'Foule de nuit devant la scène du Rio Fresco Fest'),
  scene1: p(scene1, 'Rappeur sur la scène de la Loge des Poètes'),
  scene2: p(scene2, 'Artiste en concert sous les lumières'),
  scene3: p(scene3, 'Artiste au micro pendant un concert'),
  sceneDanse: p(sceneDanse, 'Spectacle de danse sur la grande scène du festival'),
  sceneNuit: p(sceneNuit, 'Artiste face au public de nuit, effets de flammes'),
  setSetal: p(setSetal, 'Jeunes mobilisés pour le nettoyage de la digue de Rufisque'),
  studio: p(studio, 'Entrée du Studio Key I Am, au sein de SKM La Fabrik'),
  echecs: p(echecs, 'Tournoi d’échecs intergénérationnel au Boulodrome'),
  p26Hero: p(p26Hero, 'Danseuses en tenues traditionnelles pendant la parade du Rio Fresco Fest 2026'),
  p26Parade: p(p26Parade, 'Danseuses en boubous colorés sous les tissus tendus de la parade du Rio Fresco Fest 2026'),
  p26Caleche: p(p26Caleche, 'Deux femmes en tenues et coiffes traditionnelles sur une calèche, pendant la parade des Rufisquois'),
  p26CalecheRouge: p(p26CalecheRouge, 'Deux femmes en grands boubous rouges sur une calèche peinte, pendant la parade'),
  p26Digue: p(p26Digue, 'Invités assis sur des fauteuils en pneus recyclés face à l’océan, sur la digue de Rufisque'),
  p26Delegation: p(p26Delegation, 'Délégation officielle et invitées réunies pendant le Rio Fresco Fest 2026'),
  p26Discours: p(p26Discours, 'Prise de parole devant la fresque, en présence des autorités'),
  p26AutoritesFresque: p(p26AutoritesFresque, 'Invités et autorités devant une fresque du festival'),
  p26FresqueEchanges: p(p26FresqueEchanges, 'Échanges devant la fresque « Une légende ne meurt jamais »'),
  p26Scene: p(p26Scene, 'Artiste au micro devant l’écran de la grande scène du festival'),
  p26Loge1: p(p26Loge1, 'Rappeur sur la scène de la Loge des Poètes'),
  p26Loge2: p(p26Loge2, 'Rappeur au micro pendant la Loge des Poètes'),
  p26Preparation: p(p26Preparation, 'Installation des tissus colorés devant la scène du festival'),
  p26InvitesDigue: p(p26InvitesDigue, 'Invités en tenues traditionnelles sur la digue, face à la mer'),
  p26Promenade: p(p26Promenade, 'Invités en grands boubous blancs dans la rue décorée du festival'),
  p26Dj: p(p26Dj, 'DJ au micro, main levée, aux platines du festival'),
  p26RappeurNoir: p(p26RappeurNoir, 'Rappeur en tee-shirt noir devant l’écran de scène'),
  p26RappeurPortrait: p(p26RappeurPortrait, 'Rappeur souriant au micro, en gros plan'),
  p26ChanteuseOrange: p(p26ChanteuseOrange, 'Chanteuse en robe orange sur la scène du festival'),
  p26Chapeau: p(p26Chapeau, 'Artiste au chapeau en pleine performance'),
  p26Cuir: p(p26Cuir, 'Artiste en veste de cuir et béret, au micro'),
  p26Lunettes: p(p26Lunettes, 'Rappeur en veste à paillettes sous les projecteurs'),
  p26Jean: p(p26Jean, 'Rappeur en veste en jean devant les décors peints de la scène'),
  p26Raye: p(p26Raye, 'Rappeur en tee-shirt rayé devant un écran orange'),
  rff25Accueil: p(rff25Accueil, 'L’équipe Sunu Kaddu accueille les autorités au Rio Fresco Fest 2025'),
  rff25Affiche: p(rff25Affiche, 'Affiche officielle du programme du Rio Fresco Fest 2025, les 14 et 15 juin à Rufisque'),
  rff25SetSetal: p(rff25SetSetal, 'Affiche du Set Setal du 11 juin 2025 sur la digue de Rufisque, avec la SONAGED'),
  rff25Autorites: p(rff25Autorites, 'Visite des autorités sur le site du Rio Fresco Fest 2025'),
  rff25Quartier: p(rff25Quartier, 'Habitations et fresques du quartier qui accueille le village du festival'),
  rff25Remparts: p(rff25Remparts, 'Murs historiques de Rufisque le long du site du festival'),
  rff25Scene: p(rff25Scene, 'Installation de la grande scène du Rio Fresco Fest 2025 au coucher du soleil'),
  rff25Tapis: p(rff25Tapis, 'Vue aérienne du tapis rouge et des voitures anciennes dans la rue du festival'),
  rff25Moto: p(rff25Moto, 'Moto exposée devant les photographies anciennes de Rufisque'),
  rff25Aerien: p(rff25Aerien, 'Vue aérienne du village du festival entre la digue, l’océan et l’église de Rufisque'),
  rff25Deudeuche: p(rff25Deudeuche, '2CV de collection exposée face à l’océan, à côté des tentes du village'),
  rff25Voitures: p(rff25Voitures, 'Voitures de collection garées devant les murs anciens du quartier'),
  rff25ExpoHistoire: p(rff25ExpoHistoire, 'Exposition « Rufisque, ville d’histoire » : photographies anciennes et machine à coudre d’époque'),
  rff25Djembe: p(rff25Djembe, 'Enfants jouant du djembé dans la rue du festival'),
  rff25Percussions: p(rff25Percussions, 'Ensemble de percussionnistes sur la grande scène du Rio Fresco Fest 2025'),
  rff25Artistes: p(rff25Artistes, 'Artistes en coulisses du Rio Fresco Fest 2025'),
  rff25Loge1: p(rff25Loge1, 'Artiste sur la scène de la Loge des Poètes, Rio Fresco Fest 2025'),
  rff25Loge2: p(rff25Loge2, 'Artiste sur la scène de la Loge des Poètes, Rio Fresco Fest 2025'),
  rff25Loge3: p(rff25Loge3, 'Artiste sur la scène de la Loge des Poètes, Rio Fresco Fest 2025'),
  rff25Loge4: p(rff25Loge4, 'Artiste sur la scène de la Loge des Poètes, Rio Fresco Fest 2025'),
  rff25Loge5: p(rff25Loge5, 'Artiste sur la scène de la Loge des Poètes, Rio Fresco Fest 2025'),
  rff25Loge6: p(rff25Loge6, 'Artiste sur la scène de la Loge des Poètes, Rio Fresco Fest 2025'),
  rff25Loge7: p(rff25Loge7, 'Artiste sur la scène de la Loge des Poètes, Rio Fresco Fest 2025'),
  rff25Loge8: p(rff25Loge8, 'Artiste sur la scène de la Loge des Poètes, Rio Fresco Fest 2025'),
  rff25Site: p(rff25Site, 'Le site du village culturel avant son aménagement, au pied des murs anciens'),
} as const satisfies Record<string, Photo>;

/** Les espaces de SKM La Fabrik (3ᵉ étage, Cité Senelec), photos de l'équipe. */
const lieuStudio = {
  cabine: p(lieuCabine, 'Le Studio Key I Am sous lumière bleue : écrans au logo SKM La Fabrik, enceintes de monitoring et poste de mixage'),
  poste: p(lieuPoste, 'Poste de production : écran au logo SKM La Fabrik, enceintes KRK, MPC, interface audio et clavier maître'),
  micro: p(lieuMicro, 'Cabine d’enregistrement : micro avec filtre anti-pop entre des panneaux acoustiques'),
};
/** Trois vues du Studio Key I Am, pour la page Sunu Kaddu Music. */
export const studioPhotos = [lieuStudio.cabine, lieuStudio.poste, lieuStudio.micro];

export const lieu = [
  { ...p(lieuCouloirStudio, 'Couloir de SKM La Fabrik, entrée du Studio Key I Am et affiche « Chaque pas raconte une histoire »'), large: true },
  { ...lieuStudio.cabine, large: true },
  lieuStudio.poste,
  lieuStudio.micro,
  { ...p(lieuMur, 'Mur de citations peint à la main dans la salle de co-working : Chinua Achebe, KRS One, Cheikh Anta Diop, mots en wolof'), large: true },
  p(lieuFormation, 'Salle de co-working et de formation, chaises alignées sous le mur de citations'),
  p(lieuPorte, 'Affiche « Nul n’entre ici s’il n’est créatif » sur une porte en bois'),
  p(lieuKeyiam, 'Inscription « Keyiam Studio » peinte en bleu au-dessus de la porte du studio'),
  p(lieuClavier, 'Clavier maître du studio sous lumière bleue'),
  p(lieuOrgue, 'Orgue électronique ancien devant un panneau acoustique'),
  p(lieuEnceinte, 'Enceinte de monitoring surmontée d’un car rapide miniature'),
  p(lieuInterface, 'Interface audio du studio devant l’écran au logo SKM La Fabrik'),
  p(lieuGraffiti, 'Couloir aux murs graffés menant à l’accueil et à l’inscription SKM La Fabrik'),
  p(lieuAffiches, 'Cadres photo de Sunu Kaddu Music et affiche « Heritage: Africa » dans le couloir'),
  { ...p(lieuArtistes, 'Mur d’affiches d’artistes sénégalais dans le bureau : Ismael Lô, Khar Mbaye Madiaga, Bamba-J-Fall, Mar Seck'), large: true },
  p(lieuTag, 'Inscription « SKM La Fabrik » tracée en bleu sur un mur blanc'),
  p(lieuBureau, 'Bureau de l’équipe sous les affiches d’artistes et le visuel « Arts & Community »'),
  p(lieuTrophees, 'Étagère du bureau : trophées, attestations encadrées et livres'),
  p(lieuSunuTape, 'Affiche Sunu Tape et visuel « Arts & Community » accrochés au mur'),
  p(lieuCartes, 'Cartes postales anciennes encadrées au mur de la Fabrik'),
];
