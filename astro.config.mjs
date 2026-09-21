// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://thebudgethomefixes.com',
  redirects: {
    '/blog/painting-vs-replacing-kitchen-cabinets': '/blog/cost-to-paint-kitchen-cabinets',
  },
  integrations: [mdx(), sitemap()]
});