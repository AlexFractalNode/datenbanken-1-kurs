import { describe, expect, it } from 'vitest';

describe('playwright.config', () => {
  it('retries twice in CI (flaky cold starts under load), never locally', async () => {
    const before = process.env.CI;
    process.env.CI = '1';
    try {
      const config = (await import('../playwright.config?ci')).default;
      expect(config.retries).toBe(2);
    } finally {
      if (before === undefined) delete process.env.CI;
      else process.env.CI = before;
    }
    delete process.env.CI;
    const local = (await import('../playwright.config?local')).default;
    expect(local.retries).toBe(0);
    if (before !== undefined) process.env.CI = before;
  });
});
