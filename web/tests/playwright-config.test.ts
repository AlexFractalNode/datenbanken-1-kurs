import { afterEach, describe, expect, it, vi } from 'vitest';

const before = process.env.CI;
afterEach(() => {
  if (before === undefined) delete process.env.CI;
  else process.env.CI = before;
  vi.resetModules();
});

/** The config reads `process.env.CI` when it is loaded, so every case loads it afresh. */
async function load(ci: boolean) {
  if (ci) process.env.CI = '1';
  else delete process.env.CI;
  vi.resetModules();
  return (await import('../playwright.config')).default;
}

describe('playwright.config', () => {
  it('retries twice in CI (cold starts under load), never locally', async () => {
    expect((await load(true)).retries).toBe(2);
    expect((await load(false)).retries).toBe(0);
  });
});
