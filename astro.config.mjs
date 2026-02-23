// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: "https://luminx.nl",
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/coming-soon'),
    }),
  ],
  redirects: {
    "/site": "/",
    "/diensten/webapp-development": "/diensten/online-marketing",
  },
  image: {
    domains: ['images.pexels.com'],
  },
  vite: {
    build: {
      cssCodeSplit: false,
    },
  },
});
