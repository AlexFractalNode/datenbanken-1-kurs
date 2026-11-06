import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * SQL playground in a real browser: PGlite (WebAssembly) must load from the base path, CodeMirror takes
 * over the editor, the auto-check runs. Fixture tasks: t04-s001 (firma, FIRST/LIMIT) and t04-s002 (nur Firebird).
 */

/** PGlite starts a PostgreSQL in WebAssembly; allow for slow machines. */
const ENGINE_TIMEOUT = 60_000;

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('response', (res) => {
    if (res.status() >= 400) errors.push(`${res.status()} ${res.url()}`);
  });
  return errors;
}

async function axe(page: Page): Promise<string[]> {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

const root = (page: Page) => page.locator('[data-verify-unit="playground"]');
const result = (page: Page) => page.locator('[data-verify-unit="sql-result"]');

/** Ctrl+Enter runs the statement. CodeMirror handles Enter on Android specially, so mobile emulation uses the button. */
async function execute(page: Page, isMobile: boolean) {
  if (isMobile) { const b = page.getByRole('button', { name: /^Ausführen/ }); await b.focus(); await page.keyboard.press('Enter'); } // focus+Enter: a pointer click races CodeMirror's scroll-to-cursor on mobile
  else await page.keyboard.press('Control+Enter');
}

async function open(page: Page, query = '') {
  await page.goto(`playground/${query}`);
  await expect(root(page)).toHaveAttribute('data-verify-state', 'ready', { timeout: ENGINE_TIMEOUT });
  // CodeMirror replaces the textarea as soon as its chunk is loaded
  await expect(page.locator('.sql-editor')).toHaveAttribute('data-editor', 'cm', { timeout: ENGINE_TIMEOUT });
}

test.describe('sql playground', () => {
  test.beforeEach(() => {
    test.setTimeout(150_000);
  });

  test('loads PGlite from the base path, runs SQL with the keyboard and reports errors', async ({ page, isMobile }) => {
    const errors = trackErrors(page);
    const assets: string[] = [];
    page.on('response', (res) => {
      if (/\.(wasm|data)$/.test(res.url())) assets.push(`${res.status()} ${new URL(res.url()).pathname}`);
    });
    const workers: string[] = [];
    page.on('worker', (w) => workers.push(new URL(w.url()).pathname));
    await open(page);
    expect(assets.length).toBeGreaterThanOrEqual(2);
    for (const a of assets) expect(a).toMatch(/^200 \/datenbanken-1-kurs\/_astro\//);
    // PGlite runs in a module worker that is served from the base path as well
    expect(workers.length).toBeGreaterThanOrEqual(1);
    for (const w of workers) expect(w).toMatch(/^\/datenbanken-1-kurs\/_astro\/pg\.worker[^/]*\.js$/);

    const editor = page.getByRole('textbox', { name: 'SQL-Anweisung' });
    const run = page.getByRole('button', { name: /^Ausführen/ });
    await expect(run).toBeDisabled();
    await editor.click();
    await page.keyboard.type('SELECT titel, niveau FROM kurs ORDER BY kurs_id');
    await expect(run).toBeEnabled();
    await execute(page, isMobile);
    await expect(result(page)).toHaveAttribute('data-verify-state', 'ready');
    await expect(result(page)).toHaveAttribute('data-verify-count', '13');
    await expect(result(page).getByRole('table')).toBeVisible();
    await expect(result(page).getByRole('cell', { name: 'Klavier für Einsteiger' })).toBeVisible();
    expect(await axe(page)).toEqual([]);

    // a Firebird construct fails and brings the PostgreSQL hint
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('SELECT FIRST 3 * FROM kurs');
    await run.focus(); await page.keyboard.press('Enter');
    // the statement failed, not the playground: only the result unit reports the error
    await expect(result(page)).toHaveAttribute('data-verify-state', 'error');
    await expect(result(page)).toHaveAttribute('data-verify-error', /syntax error/i);
    await expect(root(page)).toHaveAttribute('data-verify-state', 'ready');
    await expect(page.getByRole('note', { name: /Firebird/ })).toContainText('LIMIT 3');
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('an endless query: the page stays responsive, the note is visible, after 10 s it is aborted and the database rebuilt', async ({ page, isMobile }) => {
    const errors = trackErrors(page);
    await open(page);
    const editor = page.getByRole('textbox', { name: 'SQL-Anweisung' });
    const run = page.getByRole('button', { name: /^Ausführen/ });
    await editor.click();
    await page.keyboard.type('CREATE TABLE notiz (id int); INSERT INTO notiz VALUES (1); SELECT count(*) AS n FROM notiz');
    await execute(page, isMobile);
    await expect(result(page)).toHaveAttribute('data-verify-count', '1');

    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r) SELECT n FROM r WHERE n < 0');
    const started = Date.now();
    await run.focus(); await page.keyboard.press('Enter');
    // the running note is painted while the worker is busy
    const note = page.locator('.pg-running').getByText('Abfrage läuft');
    await expect(note).toBeVisible({ timeout: 3_000 });
    await expect(result(page)).toHaveAttribute('data-verify-state', 'loading');
    // the main thread is free: a script round trip answers at once
    const t0 = Date.now();
    expect(await page.evaluate(() => 1 + 1)).toBe(2);
    expect(Date.now() - t0).toBeLessThan(2_000);
    await page.getByRole('checkbox', { name: /Ohne Rechner/ }).focus();
    await expect(page.getByRole('checkbox', { name: /Ohne Rechner/ })).toBeFocused();

    await expect(result(page)).toHaveAttribute('data-verify-state', 'error', { timeout: 30_000 });
    expect(Date.now() - started).toBeGreaterThanOrEqual(9_500);
    await expect(result(page)).toHaveAttribute('data-verify-error', /10 Sekunden/);
    await expect(result(page).getByRole('alert')).toContainText('neu aufgebaut');
    await expect(note).toBeHidden();
    await expect(root(page)).toHaveAttribute('data-verify-state', 'ready');

    // rebuilt from schema + seed: the free-practice table is gone, the seed data is there
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type("SELECT to_regclass('notiz') IS NULL AS weg, count(*) AS n FROM kurs");
    await execute(page, isMobile);
    await expect(result(page)).toHaveAttribute('data-verify-state', 'ready', { timeout: ENGINE_TIMEOUT });
    await expect(result(page).getByRole('cell')).toHaveText(['true', '13']);
    expect(errors).toEqual([]);
  });

  test('an endless query in a task is aborted as well; the next check is judged normally', async ({ page, isMobile }) => {
    await open(page, '?task=t04-s001');
    const editor = page.getByRole('textbox', { name: 'SQL-Anweisung' });
    await editor.click();
    await page.keyboard.type('WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r) SELECT n FROM r WHERE n < 0');
    await execute(page, isMobile);
    await expect(result(page)).toHaveAttribute('data-verify-state', 'error', { timeout: 30_000 });
    await expect(result(page)).toHaveAttribute('data-verify-error', /10 Sekunden/);
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('SELECT bezeichnung FROM abteilung ORDER BY bezeichnung LIMIT 3');
    await execute(page, isMobile);
    await expect(result(page)).toHaveAttribute('data-verify-verdict', 'correct', { timeout: ENGINE_TIMEOUT });
  });

  test('the editor does not trap the keyboard: Tab leaves the field', async ({ page }) => {
    await open(page);
    const editor = page.getByRole('textbox', { name: 'SQL-Anweisung' });
    await editor.focus();
    await page.keyboard.press('Tab');
    await expect(editor).not.toBeFocused();
  });

  test('auto-check: a task is judged against the reference; the database resets', async ({ page, isMobile }) => {
    await open(page, '?task=t04-s001');
    await expect(page.getByLabel('Aufgabe')).toHaveValue('t04-s001');
    await expect(root(page)).toHaveAttribute('data-verify-state', 'ready', { timeout: ENGINE_TIMEOUT });
    const editor = page.getByRole('textbox', { name: 'SQL-Anweisung' });
    await editor.click();
    await page.keyboard.type('SELECT bezeichnung FROM abteilung ORDER BY bezeichnung DESC LIMIT 3');
    { const b = page.getByRole('button', { name: /^Ausführen/ }); await b.focus(); await page.keyboard.press('Enter'); } // focus+Enter: a pointer click races CodeMirror's scroll-to-cursor on mobile
    await expect(result(page)).toHaveAttribute('data-verify-verdict', 'wrong');
    await expect(page.getByRole('status')).toContainText('Noch nicht richtig');

    await editor.click(); // the run button had the focus
    await page.keyboard.press('Control+A');
    await page.keyboard.type('SELECT bezeichnung FROM abteilung ORDER BY bezeichnung LIMIT 3');
    await execute(page, isMobile);
    await expect(result(page)).toHaveAttribute('data-verify-verdict', 'correct');
    await expect(page.getByRole('status')).toContainText('Richtig');
    expect(await axe(page)).toEqual([]);

    await page.getByRole('button', { name: 'Musterlösung anzeigen' }).click();
    await expect(page.getByRole('heading', { name: 'Firebird-Lösung' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^PostgreSQL-Variante/ })).toBeVisible();
    await page.getByRole('button', { name: 'Datenbank zurücksetzen' }).click();
    await expect(root(page)).toHaveAttribute('data-verify-state', 'ready', { timeout: ENGINE_TIMEOUT });
    await expect(result(page)).toHaveAttribute('data-verify-state', 'empty');
  });

  test('"Ohne Rechner" locks the run button until the prediction is recorded', async ({ page }) => {
    await open(page);
    const run = page.getByRole('button', { name: /^Ausführen/ });
    await page.getByRole('checkbox', { name: /Ohne Rechner/ }).check();
    await page.getByRole('textbox', { name: 'SQL-Anweisung' }).click();
    await page.keyboard.type('SELECT 1 AS eins');
    await expect(run).toBeDisabled();
    await page.getByRole('textbox', { name: /Vorhersage/ }).fill('Eine Zeile mit 1');
    await page.getByRole('button', { name: 'Vorhersage festhalten' }).click();
    await expect(run).toBeEnabled();
    await run.focus(); await page.keyboard.press('Enter');
    await expect(result(page)).toHaveAttribute('data-verify-state', 'ready');
    await expect(result(page)).toContainText('Eine Zeile mit 1');
  });

  test('Firebird-only tasks are marked and cannot be run', async ({ page }) => {
    await open(page, '?task=t04-s002');
    await expect(page.getByRole('note', { name: 'Nur Firebird' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Ausführen/ })).toBeDisabled();
    await page.getByRole('button', { name: 'Musterlösung anzeigen' }).click();
    await expect(page.getByText('rdb$relations')).toBeVisible();
    await expect(result(page)).toHaveAttribute('data-verify-state', 'empty');
    expect(await axe(page)).toEqual([]);
  });

  test('dark mode: editor and result pass axe, no horizontal overflow', async ({ page, isMobile }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await open(page, '?task=t04-s001');
    await page.getByRole('textbox', { name: 'SQL-Anweisung' }).click();
    await page.keyboard.type('SELECT * FROM mitarbeiter');
    await execute(page, isMobile);
    await expect(result(page)).toHaveAttribute('data-verify-state', 'ready');
    expect(await axe(page)).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
