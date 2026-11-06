import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
import { makeDownloadsFixture } from './tests/support/downloads-fixture';

/**
 * Smoke tests against the built site served by `astro preview` (with the base path).
 * Content root: env CONTENT_ROOT, defaulting to the web test fixture so that content-dependent
 * states (`ready`) are exercised even while the real course content is still being written.
 */
const PORT = 4329;
const contentRoot = process.env.CONTENT_ROOT ?? 'tests/fixtures/content_ok';
/**
 * `E2E_REAL=1` runs only `*.real.spec.ts` (against the real course content, set CONTENT_ROOT to it);
 * otherwise those specs are skipped and everything runs against the fixture.
 */
const real = !!process.env.E2E_REAL;
/** Generated PDFs/Anki decks the downloads page picks up (fixture: two PDFs and one deck, created on demand). */
const downloadsDir = process.env.DOWNLOADS_DIR ?? (real ? undefined : makeDownloadsFixture(resolve('node_modules', '.cache', 'db1-fixture-downloads')));

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: real ? /.*\.real\.spec\.ts/ : /.*\.spec\.ts/,
  testIgnore: real ? undefined : /.*\.real\.spec\.ts/,
  fullyParallel: true,
  // Under CI load (build + preview + two browsers) navigation timeouts made the run flaky: cap the workers.
  workers: process.env.CI ? 2 : undefined,
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
    env: { CONTENT_ROOT: contentRoot, ...(downloadsDir ? { DOWNLOADS_DIR: downloadsDir } : {}) },
  },
});
