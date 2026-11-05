// Manual visual check helper (not part of the test suite):
//   npx astro preview --port 4329 &  node tests/e2e/screens.mjs
// Writes screenshots to test-results/screens/ (git-ignored). Stop the preview server afterwards
// (on Windows a backgrounded preview keeps port 4329 busy and the Playwright smoke run then refuses to start).
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:4329/datenbanken-1-kurs/';
const shots = [
  ['dashboard', ''],
  ['topic', 'themen/t04/'],
  ['tasks', 'aufgaben/'],
  ['settings', 'einstellungen/'],
  ['glossary', 'glossar/'],
];

const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  for (const [w, h, tag] of [
    [1366, 900, 'desktop'],
    [390, 844, 'mobile'],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
    for (const [name, path] of shots) {
      await page.goto(BASE + path);
      await page.waitForTimeout(200);
      await page.screenshot({ path: `test-results/screens/${tag}-${scheme}-${name}.png`, fullPage: tag === 'desktop' });
    }
    await page.close();
  }
}
await browser.close();
