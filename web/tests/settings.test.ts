// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { progress } from '../src/lib/progress';
import {
  DEFAULT_NEW_CARDS_PER_DAY,
  MAX_NEW_CARDS_PER_DAY,
  NEW_CARDS_KEY,
  NEW_TODAY_KEY,
  newCardAllowance,
  parseNewCardLimit,
  readIntroducedToday,
  readNewCardLimit,
  recordIntroduced,
  writeNewCardLimit,
} from '../src/lib/settings';

beforeEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('new card limit', () => {
  it('defaults to 20 without a stored value', () => {
    expect(DEFAULT_NEW_CARDS_PER_DAY).toBe(20);
    expect(readNewCardLimit()).toBe(20);
  });

  it('stores and reads a valid value, 0 included', () => {
    expect(writeNewCardLimit(35)).toEqual({ ok: true, value: 35 });
    expect(readNewCardLimit()).toBe(35);
    expect(writeNewCardLimit(0).ok).toBe(true);
    expect(readNewCardLimit()).toBe(0);
  });

  it('falls back to the default for broken stored values', () => {
    for (const raw of ['abc', '-3', '2.5', '', String(MAX_NEW_CARDS_PER_DAY + 1), 'null']) {
      localStorage.setItem(NEW_CARDS_KEY, raw);
      expect(readNewCardLimit()).toBe(20);
    }
  });

  it('parses user input strictly', () => {
    expect(parseNewCardLimit('12')).toBe(12);
    expect(parseNewCardLimit(' 7 ')).toBe(7);
    expect(parseNewCardLimit('')).toBeNull();
    expect(parseNewCardLimit('-1')).toBeNull();
    expect(parseNewCardLimit('1.5')).toBeNull();
    expect(parseNewCardLimit('1e2')).toBeNull();
    expect(parseNewCardLimit(String(MAX_NEW_CARDS_PER_DAY + 1))).toBeNull();
  });

  it('rejects invalid values on write and reports a failed write', () => {
    expect(writeNewCardLimit(-1).ok).toBe(false);
    expect(writeNewCardLimit(1.5).ok).toBe(false);
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    });
    expect(writeNewCardLimit(10).ok).toBe(false);
    expect(readNewCardLimit()).toBe(20);
  });

  it('works without any storage', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(readNewCardLimit()).toBe(20);
    expect(writeNewCardLimit(5).ok).toBe(false);
    expect(readIntroducedToday(new Date(2026, 10, 6))).toEqual([]);
  });
});

describe('new cards introduced today', () => {
  const day1 = new Date(2026, 10, 6, 9);
  const day2 = new Date(2026, 10, 7, 9);

  it('counts each card once per local day', () => {
    recordIntroduced('t04-c001', day1);
    recordIntroduced('t04-c001', day1);
    recordIntroduced('t04-c002', day1);
    expect(readIntroducedToday(day1)).toEqual(['t04-c001', 't04-c002']);
  });

  it('starts empty on the next day', () => {
    recordIntroduced('t04-c001', day1);
    expect(readIntroducedToday(day2)).toEqual([]);
    recordIntroduced('t04-c009', day2);
    expect(readIntroducedToday(day2)).toEqual(['t04-c009']);
  });

  it('ignores a corrupt record', () => {
    localStorage.setItem(NEW_TODAY_KEY, '{"day":5,"ids":"x"}');
    expect(readIntroducedToday(day1)).toEqual([]);
    expect(recordIntroduced('t04-c001', day1)).toBe(true);
    expect(readIntroducedToday(day1)).toEqual(['t04-c001']);
  });

  it('is cleared when the progress is reset', () => {
    recordIntroduced('t04-c001', day1);
    progress.reset();
    expect(localStorage.getItem(NEW_TODAY_KEY)).toBeNull();
  });

  it('is not part of the progress export', () => {
    recordIntroduced('t04-c001', day1);
    expect(progress.export()).not.toContain('t04-c001');
  });
});

describe('newCardAllowance', () => {
  it('is the limit minus the cards introduced today, never negative', () => {
    expect(newCardAllowance(20, 0)).toBe(20);
    expect(newCardAllowance(20, 5)).toBe(15);
    expect(newCardAllowance(20, 25)).toBe(0);
    expect(newCardAllowance(0, 0)).toBe(0);
  });
});
