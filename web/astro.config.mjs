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
  vite: {
    // PGlite loads its WebAssembly and data files relative to its own module (import.meta.url); the
    // dependency optimizer would move the module away from them in `astro dev`. In the build Vite
    // emits both files into _astro/ and addresses them under `base`.
    optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  },
});
