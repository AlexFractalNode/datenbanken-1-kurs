import { expect, test } from '@playwright/test';
import { expectUnitsSettled, trackErrors } from './helpers';

/**
 * Smoke test against the real course content (`E2E_REAL=1 CONTENT_ROOT=<repo>/content`, see playwright.config.ts).
 * Checks only what must hold for any course size: pages build, units settle, no console errors.
 */

const PAGES = [
  '',
  'themen/',
  'themen/t04/',
  'karten/',
  'quiz/',
  'aufgaben/',
  'klausur/',
  'klausur/e01/',
  'klausur/e02/',
  'glossar/',
  'cheatsheet/',
  'spickzettel/',
  'lernplan/',
  'downloads/',
  'einstellungen/',
];

for (const path of PAGES) {
  test(`/${path}: no console errors, every verify unit is ready or empty`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(path);
    await expectUnitsSettled(page, 30_000);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test('the exam file names redirect to the exam pages', async ({ page }) => {
  for (const [slug, id] of [
    ['exam-01', 'e01'],
    ['exam-02', 'e02'],
  ]) {
    await page.goto(`klausur/${slug}/`);
    await expect(page).toHaveURL(new RegExp(`/klausur/${id}/$`));
    await expect(page.locator('[data-verify-unit="exam-runner"]')).toHaveAttribute('data-verify-state', 'ready');
  }
});

test('both exams open with their tasks', async ({ page }) => {
  for (const id of ['e01', 'e02']) {
    await page.goto(`klausur/${id}/`);
    const runner = page.locator('[data-verify-unit="exam-runner"]');
    await expect(runner).toHaveAttribute('data-verify-state', 'ready');
    expect(Number(await runner.getAttribute('data-verify-count'))).toBeGreaterThan(0);
  }
});

test('glossary lists all entries with anchors and linked cross-references', async ({ page }) => {
  await page.goto('glossar/');
  const unit = page.locator('[data-verify-unit="glossary"]');
  await expect(unit).toHaveAttribute('data-verify-state', 'ready');
  expect(Number(await unit.getAttribute('data-verify-count'))).toBeGreaterThanOrEqual(198);
  expect(await page.locator('dt[id^="g-"]').count()).toBeGreaterThanOrEqual(198);
  // every in-page link must point to an existing anchor
  const hrefs = await page.locator('dd a[href^="#g-"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')!.slice(1)));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const id of new Set(hrefs)) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
});

test('documents have content', async ({ page }) => {
  for (const [path, unit] of [
    ['cheatsheet/', 'cheatsheet'],
    ['spickzettel/', 'spickzettel'],
    ['lernplan/', 'lernplan'],
  ]) {
    await page.goto(path);
    await expect(page.locator(`[data-verify-unit="${unit}"]`)).toHaveAttribute('data-verify-state', 'ready');
  }
});

test('playground: a task is checked against the generated snapshot (needs web/src/data/sql-expected)', async ({ page, isMobile }) => {
  test.setTimeout(150_000);
  const { existsSync, readFileSync, readdirSync } = await import('node:fs');
  const { join, resolve } = await import('node:path');
  const { parse } = await import('yaml');
  test.skip(!existsSync(resolve('src/data/sql-expected/t10.json')), 'snapshots not generated (tools/sqltest.py --write-snapshots)');
  const root = resolve(process.env.CONTENT_ROOT ?? '');
  const topicsDir = join(root, 'de', 'topics');
  const dir = readdirSync(topicsDir).find((d) => d.startsWith('t10-'))!;
  const tasks = parse(readFileSync(join(topicsDir, dir, 'sql-tasks.yml'), 'utf8')) as { id: string; kind: string; solution: string; solution_pg?: string }[];
  const task = tasks.find((t) => t.id === 't10-s001')!;
  expect(task.kind).toBe('query');

  const chunks: string[] = [];
  page.on('response', (res) => {
    if (/\/_astro\/t10\.[^/]*\.js$/.test(res.url())) chunks.push(`${res.status()} ${res.url()}`);
  });
  await page.goto('playground/?task=t10-s001');
  await expect(page.locator('[data-verify-unit="playground"]')).toHaveAttribute('data-verify-state', 'ready', { timeout: 60_000 });
  await expect(page.locator('.sql-editor')).toHaveAttribute('data-editor', 'cm', { timeout: 60_000 });
  const editor = page.getByRole('textbox', { name: 'SQL-Anweisung' });
  await editor.click();
  await page.keyboard.insertText(task.solution_pg ?? task.solution);
  if (isMobile) await page.getByRole('button', { name: /^Ausführen/ }).click();
  else await page.keyboard.press('Control+Enter');
  const result = page.locator('[data-verify-unit="sql-result"]');
  await expect(result).toHaveAttribute('data-verify-verdict', 'correct', { timeout: 30_000 });
  expect(chunks.length).toBeGreaterThan(0);
  expect(chunks.every((c) => c.startsWith('200 '))).toBe(true);
});
