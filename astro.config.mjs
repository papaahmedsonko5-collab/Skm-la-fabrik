// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const site = process.env.SITE_URL ?? 'https://skm-la-fabrik.vercel.app';

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel({ imageService: false, webAnalytics: { enabled: true } }),
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [sitemap({ i18n: { defaultLocale: 'fr', locales: { fr: 'fr-SN' } } })],
  image: { responsiveStyles: true },
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
