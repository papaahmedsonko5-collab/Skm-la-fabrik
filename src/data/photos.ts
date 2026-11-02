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
} as const satisfies Record<string, Photo>;
