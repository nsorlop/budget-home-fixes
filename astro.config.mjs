// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: update once the real domain is registered
  site: 'https://budgethomefixes.com',
  integrations: [mdx(), sitemap()]
});