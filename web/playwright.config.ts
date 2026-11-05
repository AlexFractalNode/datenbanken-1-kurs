import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests against the built site served by `astro preview` (with the base path).
 * Content root: env CONTENT_ROOT, defaulting to the web test fixture so that content-dependent
 * states (`ready`) are exercised even while the real course content is still being written.
 */
const PORT = 4329;
const contentRoot = process.env.CONTENT_ROOT ?? 'tests/fixtures/content_ok';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/datenbanken-1-kurs/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}/datenbanken-1-kurs/`,
    // Always build fresh: a reused server could serve a dist built from another content root.
    reuseExistingServer: false,
    timeout: 180_000,
    env: { CONTENT_ROOT: contentRoot },
  },
});
