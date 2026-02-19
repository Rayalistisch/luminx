// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: "https://luminx.nl",
  redirects: {
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
