import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { localDay, msUntilLocalMidnight, onLocalMidnight } from '../src/lib/day';

afterEach(() => {
  vi.useRealTimers();
});

describe('local calendar day (G4)', () => {
  it('formats the local day as YYYY-MM-DD', () => {
    expect(localDay(new Date(2026, 0, 5, 0, 0, 1))).toBe('2026-01-05');
    expect(localDay(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31');
  });

  it('is defined in one place only', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(dir, e.name));
        else if (/\.(ts|tsx|astro)$/.test(e.name)) files.push(join(dir, e.name));
      }
    };
    walk(resolve('src'));
    const defining = files.filter((f) => /function localDay\b|const localDay\s*=/.test(readFileSync(f, 'utf8')));
    expect(defining.map((f) => f.replace(/\\/g, '/').replace(/^.*\/src\//, 'src/'))).toEqual(['src/lib/day.ts']);
  });

  it('knows how long it is until the next local midnight', () => {
    expect(msUntilLocalMidnight(new Date(2026, 10, 6, 23, 59, 50))).toBe(10_000);
    expect(msUntilLocalMidnight(new Date(2026, 10, 6, 0, 0, 0))).toBe(24 * 3_600_000);
  });

  it('calls back at every local midnight until stopped', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 6, 23, 59, 0));
    const seen: string[] = [];
    const stop = onLocalMidnight(() => seen.push(localDay(new Date())));
    vi.advanceTimersByTime(59_000);
    expect(seen).toEqual([]);
    vi.advanceTimersByTime(2_000);
    expect(seen).toEqual(['2026-11-07']);
    vi.advanceTimersByTime(24 * 3_600_000);
    expect(seen).toEqual(['2026-11-07', '2026-11-08']);
    stop();
    vi.advanceTimersByTime(48 * 3_600_000);
    expect(seen).toHaveLength(2);
  });
});
