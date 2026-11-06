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

test.describe('exam simulation', () => {
  const GRADE_WORDS = /\bNoten?\b|Notenschlüssel|bestanden|durchgefallen|sehr gut|befriedigend|ausreichend|mangelhaft|ungenügend/i;

  test('start, reload keeps the clock, expiry locks and self-assessment gives percent', async ({ page }) => {
    const errors = trackErrors(page);
    await page.clock.install({ time: new Date('2026-11-06T10:00:00Z') });
    await page.goto('klausur/');
    await page.getByRole('link', { name: 'Probeklausur 1' }).click();
    const unit = page.locator('[data-verify-unit="exam-runner"]');
    await expect(unit).toHaveAttribute('data-verify-state', 'ready');
    await expect(unit).toHaveAttribute('data-exam-phase', 'intro');

    await page.getByRole('button', { name: 'Klausur starten' }).click();
    await expect(page.getByRole('timer')).toHaveText('90:00');
    await expect(page.getByRole('heading', { name: 'Aufgaben' })).toBeFocused();
    await page.getByRole('textbox', { name: /Notizen zu Aufgabe e01-p001/ }).fill('Buch, Leser');
    expect(await axe(page)).toEqual([]);

    await page.clock.fastForward(20 * 60_000);
    // the fake clock keeps running in real time, so allow a few seconds of drift
    await expect(page.getByRole('timer')).toHaveText(/^(70:00|69:[45]\d)$/);
    await page.reload();
    await expect(page.getByRole('timer')).toHaveText(/^(70:00|69:[0-5]\d)$/);
    await expect(page.getByRole('textbox', { name: /Notizen zu Aufgabe e01-p001/ })).toHaveValue('Buch, Leser');

    await page.clock.fastForward(70 * 60_000);
    await expect(unit).toHaveAttribute('data-exam-phase', 'grading');
    await expect(page.getByRole('textbox', { name: /Notizen zu Aufgabe e01-p001/ })).toBeDisabled();
    await expect(page.getByRole('heading', { name: 'Selbstbewertung' })).toBeVisible();
    await page.getByRole('checkbox', { name: /Modell vollständig/ }).check();
    await expect(page.locator('[data-exam-total]')).toHaveText('90 von 90 Punkten (100 %)');
    expect(await axe(page)).toEqual([]);
    await page.getByRole('button', { name: 'Auswertung abschließen' }).click();
    await expect(page.getByRole('heading', { name: 'Ergebnis: 100 %' })).toBeFocused();
    expect(await page.locator('main').innerText()).not.toMatch(GRADE_WORDS);
    expect(errors).toEqual([]);
  });

  test('cancelling resets the attempt (keyboard)', async ({ page }) => {
    await page.goto('klausur/e01/');
    await page.getByRole('button', { name: 'Klausur starten' }).click();
    await page.getByRole('button', { name: 'Versuch abbrechen' }).click();
    await expect(page.getByRole('button', { name: 'Ja, Versuch verwerfen' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-verify-unit="exam-runner"]')).toHaveAttribute('data-exam-phase', 'intro');
    await expect(page.getByRole('button', { name: 'Klausur starten' })).toBeFocused();
    const exams = await page.evaluate(() => JSON.parse(localStorage.getItem('db1:progress:exams') ?? '{}'));
    expect(exams).toEqual({});
  });
});

test.describe('diagrams in tasks, exam and quiz', () => {
  /** No <img> may point at a DOT source; diagrams are inline SVG figures (as on the topic pages). */
  async function expectNoDotImages(page: Page) {
    await expect(page.locator('img[src*=".dot"]')).toHaveCount(0);
  }

  test('static task list and task page render the solution diagram as SVG', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('aufgaben/');
    await expectNoDotImages(page);
    const task = page.locator('#t04-p002');
    await task.getByText('Lösung und Bewertungsraster anzeigen').click();
    await expect(task.getByRole('img', { name: 'Lösungsdiagramm: Kunde gibt Bestellung auf' }).locator('svg')).toBeVisible();

    await page.goto('aufgaben/t04/');
    await expectNoDotImages(page);
    const card = page.locator('[data-verify-unit="task-card"][data-task="t04-p002"]');
    await expect(card).toHaveAttribute('data-verify-state', 'ready');
    await card.getByRole('button', { name: 'Lösung und Bewertungsraster aufdecken' }).click();
    await expect(card.getByRole('img', { name: 'Lösungsdiagramm: Kunde gibt Bestellung auf' }).locator('svg')).toBeVisible();
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('exam prompt and quiz explanation render diagrams as SVG', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('klausur/e01/');
    await page.getByRole('button', { name: 'Klausur starten' }).click();
    await expect(page.getByRole('img', { name: 'Entwurf: Entitätstyp mit Attribut' }).locator('svg')).toBeVisible();
    await expectNoDotImages(page);

    await page.goto('quiz/?thema=t04');
    await expect(page.locator('[data-verify-unit="quiz"]')).toHaveAttribute('data-verify-state', 'ready');
    await page.getByRole('radio', { name: 'Rechteck' }).check();
    await page.getByRole('button', { name: 'Antwort prüfen' }).click();
    await expect(page.getByRole('img', { name: 'Entitätstyp Kunde als Rechteck' }).locator('svg')).toBeVisible();
    await expectNoDotImages(page);
    expect(errors).toEqual([]);
  });
});

test.describe('focus management of confirmations', () => {
  test('exam: dismissing a confirmation returns the focus to its trigger', async ({ page }) => {
    await page.goto('klausur/e01/');
    await page.getByRole('button', { name: 'Klausur starten' }).click();
    const submit = page.getByRole('button', { name: 'Abgeben' });
    await submit.click();
    await expect(page.getByRole('button', { name: 'Ja, jetzt abgeben' })).toBeFocused();
    await page.getByRole('button', { name: 'Weiter schreiben' }).click();
    await expect(submit).toBeFocused();
  });

  test('settings: cancelling the reset returns the focus to the reset button', async ({ page }) => {
    await page.goto('einstellungen/');
    await expect(page.locator('[data-verify-unit="progress-transfer"]')).not.toHaveAttribute('data-verify-state', 'loading');
    await page.getByRole('button', { name: 'Fortschritt zurücksetzen' }).click();
    await page.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(page.getByRole('button', { name: 'Fortschritt zurücksetzen' })).toBeFocused();
  });
});
