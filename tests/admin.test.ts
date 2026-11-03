import { describe, expect, it } from 'vitest';
import { lireLienYoutube, slugify } from '../src/lib/admin/data';

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
