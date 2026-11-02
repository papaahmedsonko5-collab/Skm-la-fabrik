// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const site = process.env.SITE_URL ?? 'https://skm-la-fabrik.vercel.app';

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel({ imageService: false, webAnalytics: { enabled: false } }),
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [sitemap({ i18n: { defaultLocale: 'fr', locales: { fr: 'fr-SN' } } })],
  image: { responsiveStyles: true },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
