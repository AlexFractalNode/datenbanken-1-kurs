import { expect, type Page } from '@playwright/test';

/** Collects console errors, page errors and failed requests so a test can assert a clean page. */
export function trackErrors(page: Page): string[] {
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

interface UnitInfo {
  unit: string;
  state: string | null;
  count: string | null;
}

async function units(page: Page): Promise<UnitInfo[]> {
  return page.$$eval('[data-verify-unit]', (els) =>
    els.map((el) => ({
      unit: el.getAttribute('data-verify-unit') ?? '',
      state: el.getAttribute('data-verify-state'),
      count: el.getAttribute('data-verify-count'),
    })),
  );
}

/**
 * Waits until every `[data-verify-unit]` of the page has left `loading` and asserts the contract:
 * at least one unit, state `ready` or `empty` (never `error`), and a numeric count.
 */
export async function expectUnitsSettled(page: Page, timeout = 15_000): Promise<UnitInfo[]> {
  await expect
    .poll(async () => (await units(page)).filter((u) => u.state !== 'ready' && u.state !== 'empty' && u.state !== 'error').length, { timeout })
    .toBe(0);
  const all = await units(page);
  expect(all.length).toBeGreaterThan(0);
  for (const u of all) {
    expect(['ready', 'empty'], `${u.unit} is ${u.state}`).toContain(u.state);
    expect(u.count, `${u.unit} has no count`).toMatch(/^\d+$/);
  }
  return all;
}
