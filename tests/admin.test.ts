import { describe, expect, it } from 'vitest';
import { lireLienYoutube, slugify } from '../src/lib/admin/data';
import { cheminImport, photosAAjouter, photosEnAttente } from '@/lib/admin/photos-a-ajouter';

describe('lireLienYoutube', () => {
  it('reconnaît les liens de vidéo', () => {
    expect(lireLienYoutube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toEqual({ type: 'video', id: 'dQw4w9WgXcQ' });
    expect(lireLienYoutube('https://youtu.be/dQw4w9WgXcQ?si=abc')).toEqual({ type: 'video', id: 'dQw4w9WgXcQ' });
    expect(lireLienYoutube('https://m.youtube.com/shorts/dQw4w9WgXcQ')).toEqual({ type: 'video', id: 'dQw4w9WgXcQ' });
    expect(lireLienYoutube('https://www.youtube.com/live/dQw4w9WgXcQ')).toEqual({ type: 'video', id: 'dQw4w9WgXcQ' });
  });
  it('reconnaît les playlists', () => {
    expect(lireLienYoutube('https://www.youtube.com/playlist?list=PLkj6oueoO2k9cF5I8iaKtyo2pfF_pCf23')).toEqual({
      type: 'playlist',
      id: 'PLkj6oueoO2k9cF5I8iaKtyo2pfF_pCf23',
    });
  });
  it('préfère la vidéo quand le lien contient les deux', () => {
    expect(lireLienYoutube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLkj6oueoO2k9cF5I8iaKtyo2pfF_pCf23')?.type).toBe('video');
  });
  it('refuse les autres sites et les liens invalides', () => {
    expect(lireLienYoutube('https://vimeo.com/123')).toBeNull();
    expect(lireLienYoutube('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(lireLienYoutube('pas un lien')).toBeNull();
    expect(lireLienYoutube('https://www.youtube.com/watch?v=<script>')).toBeNull();
  });
});

describe('slugify', () => {
  it('produit un identifiant d’URL propre', () => {
    expect(slugify('Rio Fresco Fest 2026 : Héritages & Horizons')).toBe('rio-fresco-fest-2026-heritages-horizons');
  });
});

describe('photosEnAttente', () => {
  const avant = '2026-11-03T09:00:56Z';
  it('liste les photos manquantes des fiches non modifiées', () => {
    const r = photosEnAttente([
      { slug: 'handischool-day', cover_path: 'projets/x.jpg', gallery: [], updated_at: avant },
      { slug: 'concours-art-scolaire-2024', cover_path: null, gallery: [], updated_at: avant },
    ]);
    expect(r).toHaveLength(photosAAjouter.length);
  });
  it('ne remet rien sur une fiche modifiée depuis', () => {
    expect(photosEnAttente([{ slug: 'handischool-day', cover_path: null, gallery: [], updated_at: '2026-11-03T10:00:00Z' }])).toHaveLength(0);
  });
  it('ignore les photos déjà copiées et une couverture existante', () => {
    const r = photosEnAttente([
      {
        slug: 'concours-art-scolaire-2024',
        cover_path: 'projets/autre.jpg',
        gallery: [{ path: cheminImport('nio-far-exposition-2024.jpg'), alt: '' }],
        updated_at: avant,
      },
    ]);
    expect(r).toHaveLength(0);
  });
});
