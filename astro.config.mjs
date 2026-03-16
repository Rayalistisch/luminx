// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: "https://luminx.nl",
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/coming-soon'),
      lastmod: new Date(),
    }),
    react(),
  ],
  redirects: {
    "/site": "/",
    "/diensten/webapp-development": "/diensten/online-marketing",
  },
  image: {
    domains: ['images.pexels.com'],
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: false,
    },
  },
});
