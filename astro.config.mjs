// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const site = process.env.SITE_URL ?? 'https://skm-la-fabrik.vercel.app';
const supabaseHost = (() => {
  try {
    return process.env.PUBLIC_SUPABASE_URL ? new URL(process.env.PUBLIC_SUPABASE_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();

export default defineConfig({
  site,
  output: 'static',
  adapter: vercel({ imageService: false, webAnalytics: { enabled: true }, maxDuration: 60 }),
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [sitemap({ i18n: { defaultLocale: 'fr', locales: { fr: 'fr-SN' } }, filter: (page) => !page.includes('/admin') })],
  image: { responsiveStyles: true, domains: supabaseHost ? [supabaseHost] : [] },
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      /** Projet Supabase de l'espace d'administration (clé publiable : sûre côté navigateur, protégée par RLS). */
      PUBLIC_SUPABASE_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      PUBLIC_SUPABASE_PUBLISHABLE_KEY: envField.string({ context: 'server', access: 'public', optional: true }),
      /** URL du « Deploy Hook » Vercel, déclenchée par le bouton Publier de l'admin. */
      DEPLOY_HOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Lien secret d'accès à la connexion admin : /admin?cle=<ADMIN_ENTREE>.
      ADMIN_ENTREE: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
