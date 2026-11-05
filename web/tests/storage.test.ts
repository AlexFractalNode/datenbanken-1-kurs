// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PROGRESS_PREFIX,
  THEME_KEY,
  exportProgress,
  importProgress,
  isStorageAvailable,
  listProgressKeys,
  readItem,
  removeItem,
  resetProgress,
  writeItem,
} from '../src/lib/storage';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('safe storage helpers', () => {
  it('reads, writes and removes items', () => {
    expect(writeItem('db1:x', '1')).toBe(true);
    expect(readItem('db1:x')).toBe('1');
    expect(removeItem('db1:x')).toBe(true);
    expect(readItem('db1:x')).toBeNull();
  });

  it('never throws when localStorage is missing', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(isStorageAvailable()).toBe(false);
    expect(readItem('a')).toBeNull();
    expect(writeItem('a', 'b')).toBe(false);
    expect(removeItem('a')).toBe(false);
    expect(listProgressKeys()).toEqual([]);
    expect(resetProgress()).toBe(0);
  });

  it('never throws when localStorage throws (quota, privacy mode)', () => {
    const throwing = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('denied');
      },
      key: () => null,
      get length(): number {
        throw new Error('denied');
      },
      clear: () => undefined,
    };
    vi.stubGlobal('localStorage', throwing);
    expect(isStorageAvailable()).toBe(false);
    expect(readItem('a')).toBeNull();
    expect(writeItem('a', 'b')).toBe(false);
    expect(listProgressKeys()).toEqual([]);
  });
});

describe('progress export/import/reset', () => {
  it('exports only progress keys, versioned', () => {
    localStorage.setItem(`${PROGRESS_PREFIX}cards`, '{"a":1}');
    localStorage.setItem(THEME_KEY, 'dark');
    localStorage.setItem('other-app', 'x');
    const out = exportProgress(new Date('2026-11-05T10:00:00Z'));
    expect(out).toEqual({
      format: 'db1-progress',
      version: 1,
      exportedAt: '2026-11-05T10:00:00.000Z',
      data: { [`${PROGRESS_PREFIX}cards`]: '{"a":1}' },
    });
  });

  it('imports a valid export and replaces existing progress', () => {
    localStorage.setItem(`${PROGRESS_PREFIX}old`, '1');
    const payload = JSON.stringify({
      format: 'db1-progress',
      version: 1,
      exportedAt: '2026-11-05T10:00:00.000Z',
      data: { [`${PROGRESS_PREFIX}quiz`]: '[1,2]' },
    });
    expect(importProgress(payload)).toEqual({ ok: true, count: 1 });
    expect(localStorage.getItem(`${PROGRESS_PREFIX}quiz`)).toBe('[1,2]');
    expect(localStorage.getItem(`${PROGRESS_PREFIX}old`)).toBeNull();
  });

  it.each([
    ['not json', 'kein JSON'],
    ['{"format":"other","version":1,"data":{}}', 'Format'],
    ['{"format":"db1-progress","version":99,"data":{}}', 'Version'],
    ['{"format":"db1-progress","version":1,"data":{"foreign":"x"}}', 'Schlüssel'],
    ['{"format":"db1-progress","version":1,"data":{"db1:progress:a":5}}', 'Wert'],
  ])('rejects invalid import %s', (payload, message) => {
    localStorage.setItem(`${PROGRESS_PREFIX}keep`, '1');
    const result = importProgress(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
    expect(localStorage.getItem(`${PROGRESS_PREFIX}keep`)).toBe('1');
  });

  it('reports an error on import when storage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    const result = importProgress('{"format":"db1-progress","version":1,"data":{}}');
    expect(result).toEqual({ ok: false, error: expect.stringContaining('Speicher') });
  });

  it('resets only progress keys', () => {
    localStorage.setItem(`${PROGRESS_PREFIX}a`, '1');
    localStorage.setItem(`${PROGRESS_PREFIX}b`, '2');
    localStorage.setItem(THEME_KEY, 'dark');
    expect(resetProgress()).toBe(2);
    expect(listProgressKeys()).toEqual([]);
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });
});
