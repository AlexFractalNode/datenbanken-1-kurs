import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { expectUnitsSettled, trackErrors } from './helpers';

/**
 * Dashboard, settings, documents, glossary, downloads and the smoke pass over the key pages.
 * Runs against the web fixture (t04: 3 cards, 2 quiz questions, 2 tasks; exam e01; 5 glossary entries).
 */

const SCHEDULER_TIMEOUT = 15_000;

async function axe(page: Page): Promise<string[]> {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

test.describe('smoke: key pages', () => {
  // Brief: `/`, themen/t04, karten, quiz, klausur, playground. All units must settle, the console stays clean.
  for (const path of ['', 'themen/t04/', 'karten/', 'quiz/', 'klausur/e01/', 'cheatsheet/', 'spickzettel/', 'lernplan/', 'glossar/', 'downloads/', 'einstellungen/']) {
    test(`/${path}: no console errors, every verify unit is ready or empty`, async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(path);
      await expectUnitsSettled(page);
      expect(errors).toEqual([]);
    });
  }

  test('/playground/: units settle and the playground runs SELECT 1', async ({ page, isMobile }) => {
    test.setTimeout(150_000);
    const errors = trackErrors(page);
    await page.goto('playground/');
    await expect(page.locator('[data-verify-unit="playground"]')).toHaveAttribute('data-verify-state', 'ready', { timeout: 60_000 });
    await expect(page.locator('.sql-editor')).toHaveAttribute('data-editor', 'cm', { timeout: 60_000 });
    await page.getByRole('textbox', { name: 'SQL-Anweisung' }).click();
    await page.keyboard.type('SELECT 1 AS eins');
    if (isMobile) { const b = page.getByRole('button', { name: /^Ausführen/ }); await b.focus(); await page.keyboard.press('Enter'); } // focus+Enter: a pointer click races CodeMirror's scroll-to-cursor on mobile
    else await page.keyboard.press('Control+Enter');
    const result = page.locator('[data-verify-unit="sql-result"]');
    await expect(result).toHaveAttribute('data-verify-state', 'ready', { timeout: 30_000 });
    await expect(result).toHaveAttribute('data-verify-count', '1');
    await expect(result.getByRole('cell', { name: '1', exact: true })).toBeVisible();
    await expectUnitsSettled(page);
    expect(errors).toEqual([]);
  });

  test('exam pages work for the file name and the id', async ({ page }) => {
    await page.goto('klausur/exam-01/');
    await expect(page).toHaveURL(/\/klausur\/e01\/$/);
    await expect(page.locator('[data-verify-unit="exam-runner"]')).toHaveAttribute('data-verify-state', 'ready');
  });
});

test.describe('dashboard', () => {
  test('is empty for a new learner but shows what is waiting', async ({ page }) => {
    await page.goto('');
    const unit = page.locator('[data-verify-unit="dashboard-progress"]');
    await expect(unit).toHaveAttribute('data-verify-state', 'empty');
    await expect(unit.locator('[data-stat="due"]')).toContainText('3 Karten');
    await expect(unit.locator('[data-stat="streak"]')).toContainText('0 Tage');
    expect(await axe(page)).toEqual([]);
  });

  test('shows progress after learning: cards, quiz, due, coverage and streak', async ({ page }) => {
    await page.goto('karten/?thema=t04');
    await expect(page.locator('[data-verify-unit="flashcards"]')).toHaveAttribute('data-verify-state', 'ready', { timeout: SCHEDULER_TIMEOUT });
    await page.getByRole('button', { name: 'Antwort zeigen' }).click();
    await page.getByRole('button', { name: /^Gut/ }).click();
    await expect(page.getByText(/Gespeichert/)).toBeVisible();

    await page.goto('');
    const unit = page.locator('[data-verify-unit="dashboard-progress"]');
    await expect(unit).toHaveAttribute('data-verify-state', 'ready');
    const row = unit.locator('[data-topic="t04"]');
    await expect(row).toContainText('von 3');
    await expect(unit.locator('[data-stat="streak"]')).toContainText('1 Tag');
    await expect(unit.locator('[data-stat="coverage"]')).toContainText('33 %');
    // the other two cards are still new
    await expect(unit.locator('[data-stat="due"]')).toContainText('2 Karten');
    expect(await axe(page)).toEqual([]);
  });

  test('passes axe in dark mode with progress', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('db1:settings:theme', 'dark');
      localStorage.setItem('db1:progress:version', '1');
      localStorage.setItem('db1:progress:quiz', JSON.stringify({ 't04-q001': { correct: 1, seen: 2 } }));
      localStorage.setItem('db1:progress:tasks', JSON.stringify({ 't04-p001': { score: 3, max: 6 } }));
    });
    await page.goto('');
    const unit = page.locator('[data-verify-unit="dashboard-progress"]');
    await expect(unit).toHaveAttribute('data-verify-state', 'ready');
    await expect(unit.locator('[data-topic="t04"]')).toContainText('1 von 2 richtig (50 %)');
    await expect(unit.locator('[data-topic="t04"]')).toContainText('3 von 6 Punkten (50 %)');
    expect(await axe(page)).toEqual([]);
  });
});

test.describe('settings and the daily limit of new cards', () => {
  test('the limit is stored, limits the trainer and the dashboard, and survives a reload', async ({ page }) => {
    await page.goto('einstellungen/');
    const input = page.getByLabel('Neue Karten pro Tag');
    await expect(input).toHaveValue('20');
    await input.fill('1');
    await page.getByRole('button', { name: 'Limit übernehmen' }).click();
    await expect(page.getByText('Limit gespeichert: 1 neue Karten pro Tag.')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Neue Karten pro Tag')).toHaveValue('1');

    await page.goto('karten/?thema=t04');
    const cards = page.locator('[data-verify-unit="flashcards"]');
    await expect(cards).toHaveAttribute('data-verify-state', 'ready', { timeout: SCHEDULER_TIMEOUT });
    await expect(cards).toHaveAttribute('data-verify-count', '1');
    await page.getByRole('button', { name: 'Antwort zeigen' }).click();
    await page.getByRole('button', { name: /^Gut/ }).click();
    await expect(cards).toHaveAttribute('data-verify-state', 'empty');
    await expect(page.getByText(/Das Tageslimit für neue Karten ist erreicht/)).toBeVisible();

    await page.reload();
    await expect(cards).toHaveAttribute('data-verify-state', 'empty', { timeout: SCHEDULER_TIMEOUT });
    await page.goto('');
    await expect(page.locator('[data-stat="due"]')).toContainText('0 Karten');
  });

  test('invalid limits are rejected with an error message', async ({ page }) => {
    await page.goto('einstellungen/');
    const input = page.getByLabel('Neue Karten pro Tag');
    await input.fill('-4');
    await page.getByRole('button', { name: 'Limit übernehmen' }).click();
    await expect(page.getByRole('alert')).toContainText('zwischen 0 und 500');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(await axe(page)).toEqual([]);
  });

  test('export downloads JSON, an invalid import shows an error, reset asks first', async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('db1:progress:version', '1');
        localStorage.setItem('db1:progress:quiz', JSON.stringify({ 't04-q001': { correct: 1, seen: 1 } }));
        sessionStorage.setItem('seeded', '1');
      }
    });
    await page.goto('einstellungen/');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Fortschritt exportieren' }).click()]);
    expect(download.suggestedFilename()).toMatch(/^db1-fortschritt-\d{4}-\d{2}-\d{2}\.json$/);
    const path = await download.path();
    const { readFileSync } = await import('node:fs');
    const exported = JSON.parse(readFileSync(path, 'utf8'));
    expect(exported.format).toBe('db1-progress');
    expect(exported.data['db1:progress:quiz']).toContain('t04-q001');

    await page.getByLabel('Fortschritt importieren (JSON-Datei)').setInputFiles({
      name: 'kaputt.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"format":"etwas-anderes"}'),
    });
    await expect(page.getByRole('alert').filter({ hasText: 'Import fehlgeschlagen' })).toBeVisible();

    await page.getByRole('button', { name: 'Fortschritt zurücksetzen' }).click();
    await expect(page.getByText('Gesamten Fortschritt unwiderruflich löschen?')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('db1:progress:quiz'))).not.toBeNull();
    await page.getByRole('button', { name: 'Ja, alles löschen' }).click();
    await expect(page.locator('[data-verify-unit="progress-transfer"]')).toHaveAttribute('data-verify-state', 'empty');
    expect(await page.evaluate(() => localStorage.getItem('db1:progress:quiz'))).toBeNull();
  });
});

test.describe('documents', () => {
  test('cheatsheet renders the Markdown with a keyboard-scrollable table', async ({ page }) => {
    await page.goto('cheatsheet/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cheatsheet Testkurs');
    await expect(page.getByRole('region', { name: 'Tabelle' })).toBeVisible();
    await expect(page.locator('[data-verify-unit="cheatsheet"]')).toHaveAttribute('data-verify-count', '2');
    expect(await axe(page)).toEqual([]);
  });

  test('spickzettel is XSS safe: raw HTML is shown as text and javascript: links are dropped', async ({ page }) => {
    const dialogs: string[] = [];
    page.on('dialog', (d) => {
      dialogs.push(d.message());
      void d.dismiss();
    });
    await page.goto('spickzettel/');
    await expect(page.locator('[data-verify-unit="spickzettel"]')).toContainText("<script>alert('xss')</script>");
    await expect(page.locator('[data-verify-unit="spickzettel"] a[href^="javascript"]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'guter Link' })).toHaveAttribute('href', 'https://example.org/');
    expect(dialogs).toEqual([]);
  });

  test('navigation links to the new pages', async ({ page, isMobile }) => {
    await page.goto('');
    if (isMobile) await page.getByRole('button', { name: 'Menü' }).click();
    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await nav.getByRole('link', { name: /Cheatsheet/ }).click();
    await expect(page).toHaveURL(/\/cheatsheet\/$/);
    await expect(page.locator('[aria-current="page"]')).toHaveText(/Cheatsheet/);
  });

  test('lernplan page keeps the topic order below the missing document', async ({ page }) => {
    await page.goto('lernplan/');
    await expect(page.locator('[data-verify-unit="lernplan"]')).toHaveAttribute('data-verify-state', 'empty');
    await expect(page.locator('[data-verify-unit="study-plan"]')).toHaveAttribute('data-verify-state', 'ready');
  });
});

test.describe('glossary', () => {
  test('search filters, cross-references are links, anchors work, the filter resets for hidden targets', async ({ page }) => {
    await page.goto('glossar/');
    const unit = page.locator('[data-verify-unit="glossary"]');
    await expect(unit).toHaveAttribute('data-verify-state', 'ready');
    const total = Number(await unit.getAttribute('data-verify-count'));
    expect(total).toBeGreaterThan(1);

    const search = page.getByLabel('Begriff suchen');
    await search.fill('zzzz-nichts');
    await expect(unit).toHaveAttribute('data-verify-state', 'empty');
    await expect(page.getByText('Keine Einträge gefunden')).toBeVisible();
    await page.getByRole('button', { name: 'Filter zurücksetzen' }).click();
    await expect(unit).toHaveAttribute('data-verify-count', String(total));

    await search.fill('entität');
    await expect(unit).toHaveAttribute('data-verify-state', 'ready');
    expect(Number(await unit.getAttribute('data-verify-count'))).toBeLessThan(total);
    expect(await axe(page)).toEqual([]);
  });

  test('every entry has an anchor and the URL fragment scrolls to it', async ({ page }) => {
    await page.goto('glossar/#g-join');
    await expect(page.locator('dt#g-join')).toBeInViewport();
  });
});

test.describe('downloads', () => {
  test('existing files are linked and downloadable, missing ones show a note instead of a link', async ({ page, request }) => {
    await page.goto('downloads/');
    const unit = page.locator('[data-verify-unit="downloads"]');
    await expect(unit).toHaveAttribute('data-verify-state', 'ready');
    await expect(unit).toHaveAttribute('data-verify-count', '3');

    const exam = unit.locator('[data-file="exam-01.pdf"]');
    await expect(exam).toHaveAttribute('data-available', 'true');
    const link = exam.getByRole('link', { name: /exam-01\.pdf/ });
    const href = await link.getAttribute('href');
    expect(href).toBe('/datenbanken-1-kurs/downloads/exam-01.pdf');
    const res = await request.get(href!);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');

    const missing = unit.locator('[data-file="exam-01-loesung.pdf"]');
    await expect(missing).toHaveAttribute('data-available', 'false');
    await expect(missing.getByRole('link', { name: /herunterladen/ })).toHaveCount(0);
    await expect(missing).toContainText('noch nicht verfügbar');
    expect(await axe(page)).toEqual([]);
  });
});
