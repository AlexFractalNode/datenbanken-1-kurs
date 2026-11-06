import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Learning modes against the web fixture (t04: 3 cards, 2 quiz questions, 2 tasks; exam e01). */

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
    await expect(unit).toHaveAttribute('data-verify-state', 'ready');
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
    await expect(page.locator('[data-verify-unit="flashcards"]')).toHaveAttribute('data-verify-state', 'ready');
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
    await expect(unit).toHaveAttribute('data-verify-state', 'ready');
    await expect(unit).toContainText('nur in diesem Tab');
    await page.getByRole('button', { name: 'Antwort zeigen' }).click();
    await page.getByRole('button', { name: /^Einfach/ }).click();
    await expect(unit).toHaveAttribute('data-verify-count', '2');
    expect(errors).toEqual([]);
    await context.close();
  });
});
