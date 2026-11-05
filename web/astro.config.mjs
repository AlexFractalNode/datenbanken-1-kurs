// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://alexfractalnode.github.io',
  base: '/datenbanken-1-kurs/',
  trailingSlash: 'ignore',
  output: 'static',
  integrations: [preact()],
  build: {
    format: 'directory',
  },
});
