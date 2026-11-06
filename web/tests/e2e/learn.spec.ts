import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Learning modes against the web fixture (t04: 3 cards, 2 quiz questions, 2 tasks; exam e01). */

/** The card trainer loads the FSRS scheduler asynchronously; allow for slow CI machines. */
const SCHEDULER_TIMEOUT = 15_000;

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

test.describe('flashcards', () => {
  test('keyboard: reveal, rate "Gut", count drops and survives a reload', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('karten/?thema=t04');
    const unit = page.locator('[data-verify-unit="flashcards"]');
    await expect(unit).toHaveAttribute('data-verify-state', 'ready', { timeout: SCHEDULER_TIMEOUT });
    await expect(unit).toHaveAttribute('data-verify-count', '3');
    await expect(unit).toHaveAttribute('data-topic', 't04');
    await expect(page.getByRole('combobox', { name: 'Thema' })).toHaveValue('t04');

    await page.getByRole('button', { name: 'Antwort zeigen' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('group', { name: 'Wie gut wusstest du es?' })).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await page.getByRole('button', { name: /^Gut/ }).focus();
    await page.keyboard.press('Enter');
    await expect(unit).toHaveAttribute('data-verify-count', '2');
    // focus returns to the next card's reveal button
    await expect(page.getByRole('button', { name: 'Antwort zeigen' })).toBeFocused();
    await expect(page.getByRole('status')).toContainText('nächste Wiederholung');

    await page.reload();
    await expect(unit).toHaveAttribute('data-verify-count', '2');
    expect(errors).toEqual([]);
  });

  test('passes axe in dark mode with the answer revealed', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('karten/');
    await expect(page.locator('[data-verify-unit="flashcards"]')).toHaveAttribute('data-verify-state', 'ready', { timeout: SCHEDULER_TIMEOUT });
    await page.getByRole('button', { name: 'Antwort zeigen' }).click();
    expect(await axe(page)).toEqual([]);
    await context.close();
  });

  test('works without localStorage', async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('SecurityError: storage disabled');
        },
      });
    });
    const page = await context.newPage();
    const errors = trackErrors(page);
    await page.goto('karten/');
    const unit = page.locator('[data-verify-unit="flashcards"]');
    await expect(unit).toHaveAttribute('data-verify-state', 'ready', { timeout: SCHEDULER_TIMEOUT });
    await expect(unit).toContainText('nur in diesem Tab');
    await page.getByRole('button', { name: 'Antwort zeigen' }).click();
    await page.getByRole('button', { name: /^Einfach/ }).click();
    await expect(unit).toHaveAttribute('data-verify-count', '2');
    expect(errors).toEqual([]);
    await context.close();
  });
});

test.describe('quiz', () => {
  test('keyboard: choose, check, feedback gets focus and progress is stored', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('quiz/?thema=t04');
    const unit = page.locator('[data-verify-unit="quiz"]');
    await expect(unit).toHaveAttribute('data-verify-state', 'ready');
    await expect(unit).toHaveAttribute('data-verify-count', '2');

    await page.getByRole('radio', { name: 'Raute' }).focus();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Antwort prüfen' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Leider falsch' })).toBeVisible();
    await expect(page.locator('.quiz-feedback')).toBeFocused();
    await expect(page.getByText('Die Raute steht für Beziehungstypen.')).toBeVisible();
    expect(await axe(page)).toEqual([]);

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('db1:progress:quiz') ?? '{}'));
    expect(stored['t04-q001']).toEqual({ correct: 0, seen: 1 });

    await page.getByRole('button', { name: 'Nächste Frage' }).click();
    await page.getByRole('radio', { name: 'wahr' }).check();
    await page.getByRole('button', { name: 'Antwort prüfen' }).click();
    await expect(page.getByRole('heading', { name: 'Richtig' })).toBeVisible();
    await page.getByRole('button', { name: 'Auswertung' }).click();
    await expect(page.getByRole('heading', { name: 'Runde beendet' })).toBeFocused();
    await expect(unit).toContainText('1 von 2 richtig (50 %)');
    expect(errors).toEqual([]);
  });
});

test.describe('self-graded tasks', () => {
  test('topic page links to the task page; reveal, tick, save, reload', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('themen/t04/');
    await page.getByRole('link', { name: /Papier-Aufgaben/ }).click();
    await expect(page).toHaveURL(/aufgaben\/t04\/$/);

    const card = page.locator('[data-verify-unit="task-card"][data-task="t04-p002"]');
    await expect(card).toHaveAttribute('data-verify-state', 'ready');
    await expect(card).toHaveAttribute('data-verify-count', '3');
    await expect(card.getByRole('checkbox')).toHaveCount(0);
    const toggle = card.getByRole('button', { name: 'Lösung und Bewertungsraster aufdecken' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await card.getByRole('checkbox', { name: /Entitätstypen/ }).check();
    await card.getByRole('checkbox', { name: /Kardinalität/ }).check();
    await expect(card.locator('output')).toHaveText('4 von 6 Punkten');
    expect(await axe(page)).toEqual([]);
    await card.getByRole('button', { name: 'Bewertung speichern' }).click();
    await expect(card.locator('.status-line')).toContainText('Gespeichert: 4 von 6 Punkten');

    await page.reload();
    await expect(card).toContainText('Zuletzt: 4 von 6 Punkten');
    // the slotted source note is rendered inside the card
    await expect(page.locator('[data-task="t04-p001"]').getByRole('complementary', { name: 'Quellen' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
