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
