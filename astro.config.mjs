// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const site = process.env.SITE_URL ?? 'https://www.skmlafabrik.com';

const supabaseHost = (() => {
  try {
    return process.env.PUBLIC_SUPABASE_URL
      ? new URL(process.env.PUBLIC_SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel({
    imageService: false,
    webAnalytics: { enabled: true },
    maxDuration: 60,
  }),
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: { fr: 'fr-SN' },
      },
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  image: {
    responsiveStyles: true,
    domains: supabaseHost ? [supabaseHost] : [],
  },
  env: {
    schema: {
      RESEND_API_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      CONTACT_TO_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      CONTACT_FROM_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      /** Clé publique Supabase, protégée par les règles RLS. */
      PUBLIC_SUPABASE_URL: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
      }),
      PUBLIC_SUPABASE_PUBLISHABLE_KEY: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
      }),
      /** URL secrète du Deploy Hook Vercel. */
      DEPLOY_HOOK_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      /** Lien secret d'accès à la connexion admin. */
      ADMIN_ENTREE: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      /** Authentification des appels Cron Vercel. */
      CRON_SECRET: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      /** Clé secrète Supabase réservée au serveur. */
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
