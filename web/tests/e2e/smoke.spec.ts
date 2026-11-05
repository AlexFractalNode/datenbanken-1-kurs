import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Collects console errors and failed requests so every test can assert a clean page. */
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

const PAGES: { path: string; unit: string; state: string }[] = [
  { path: '', unit: 'dashboard', state: 'ready' },
  { path: 'themen/', unit: 'topic-list', state: 'ready' },
  { path: 'themen/t04/', unit: 'topic-page', state: 'ready' },
  { path: 'themen/t01/', unit: 'topic-page', state: 'empty' },
  { path: 'karten/', unit: 'flashcards', state: 'empty' },
  { path: 'quiz/', unit: 'quiz', state: 'empty' },
  { path: 'aufgaben/', unit: 'task-list', state: 'ready' },
  { path: 'klausur/', unit: 'exam', state: 'empty' },
  { path: 'playground/', unit: 'playground', state: 'empty' },
  { path: 'glossar/', unit: 'glossary', state: 'ready' },
  { path: 'downloads/', unit: 'downloads', state: 'ready' },
  { path: 'lernplan/', unit: 'study-plan', state: 'ready' },
  { path: 'einstellungen/', unit: 'progress-transfer', state: 'empty' },
];

for (const { path, unit, state } of PAGES) {
  test(`/${path} renders ${unit}=${state} without errors and passes axe (WCAG AA)`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(path);
    await expect(page.locator(`[data-verify-unit="${unit}"]`).first()).toHaveAttribute('data-verify-state', state);
    await expect(page.locator('h1')).toHaveCount(1);
    // Page-level units must be unique so tests can address them unambiguously.
    await expect(page.locator('[data-verify-unit="theme-toggle"]')).toHaveCount(1);
    await expect(page.locator('[data-verify-unit="theme-toggle"]')).toBeVisible();
    await expect(page.locator(`[data-verify-unit="${unit}"]`)).toHaveCount(1);
    // Mobile first: nothing may push the page wider than the viewport (wide tables scroll in place).
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.locator('footer')).toContainText(
      'Inoffizieller, von Studierenden erstellter Lernkurs – ohne Gewähr. Inhalte CC BY-SA 4.0, Code MIT.',
    );
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('navigation has eleven base-prefixed entries and marks the current page', async ({ page, isMobile }) => {
  await page.goto('themen/t04/');
  if (isMobile) await page.getByRole('button', { name: 'Menü' }).click();
  const links = page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link');
  await expect(links).toHaveCount(11);
  for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
    expect(href).toMatch(/^\/datenbanken-1-kurs\//);
  }
  await expect(page.locator('[aria-current="page"]')).toHaveText(/Themen/);
});

test('mobile menu opens and closes with the keyboard', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu toggle only exists on small screens');
  await page.goto('');
  const toggle = page.getByRole('button', { name: 'Menü' });
  const nav = page.locator('#site-nav');
  await expect(nav).toBeHidden();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('skip link is the first focusable element and moves focus to main', async ({ page }) => {
  await page.goto('');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Zum Inhalt springen' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('theme choice applies, persists across pages and passes axe in dark mode', async ({ page }) => {
  await page.goto('einstellungen/');
  const unit = page.locator('[data-verify-unit="theme-switch"]');
  await expect(unit).toHaveAttribute('data-verify-state', 'ready');
  await page.getByRole('radio', { name: 'Dunkel' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('themen/t04/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('system dark preference is honoured without a stored choice', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('glossar/');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(17, 22, 27)');
  await context.close();
});

test('topic page shows summary, pitfalls, source box and the rendered diagram', async ({ page }) => {
  await page.goto('themen/t04/');
  await expect(page.getByRole('heading', { name: 'Typische Fehler', exact: true })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Quellen' })).toContainText(
    'Basiert auf: Entity-Relationship-Modell (CC BY-SA 4.0), Abschnitt Grundbegriffe',
  );
  // embedded in the summary via ![…](diagrams/beziehung.dot)
  await expect(page.getByRole('region', { name: 'Zusammenfassung' }).getByRole('img', { name: 'Kunde gibt Bestellung auf' }).locator('svg')).toBeVisible();
  // not referenced in the summary → listed under "Diagramme"
  await expect(page.locator('[data-verify-unit="diagram"]')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Diagramme' })).toBeVisible();
});

test('paper task reveals solution and rubric', async ({ page }) => {
  await page.goto('aufgaben/');
  const task = page.locator('#t04-p001');
  await expect(task.getByRole('table')).toBeHidden();
  await task.getByText('Lösung und Bewertungsraster anzeigen').click();
  await expect(task.getByRole('table')).toBeVisible();
  await expect(task.getByRole('table')).toContainText('Summe');
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
  await page.goto('einstellungen/');
  const unit = page.locator('[data-verify-unit="progress-transfer"]');
  await expect(unit).toHaveAttribute('data-verify-state', 'error');
  await expect(unit).toHaveAttribute('data-verify-error', /Speicher/);
  await page.getByRole('radio', { name: 'Dunkel' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
  await context.close();
});
