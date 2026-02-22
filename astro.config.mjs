import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://mellattonninn.ru',
  base: '/',
  integrations: [sitemap()],
  vite: {
    build: {
      // hls.js выносится в отдельный чанк через динамический import()
      chunkSizeWarningLimit: 600,
    },
  },
});

