import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import kopiCode from './src/theme/kopi-code.json' with { type: 'json' };

// On GitHub Pages the site lives under /<repo>/. Locally it lives at /.
// CI sets SITE_BASE=/kopi-academy and SITE_URL=https://<user>.github.io
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base,
  trailingSlash: 'always',
  integrations: [react(), mdx()],
  markdown: {
    shikiConfig: { theme: kopiCode, wrap: false },
  },
  devToolbar: { enabled: false },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
