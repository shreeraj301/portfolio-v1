import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Set `site` to the production URL before deploying: canonical, OG and sitemap depend on it.
export default defineConfig({
  site: 'https://shreerajnarwade.vercel.app',
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (p) => !p.includes('/404') })],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});
