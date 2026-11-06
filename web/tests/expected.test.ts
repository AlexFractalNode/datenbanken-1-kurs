import { describe, expect, it, vi } from 'vitest';
import { createExpectedCache, type ExpectedTask } from '../src/lib/expected';
import type { CheckRun } from '../src/lib/pg-engine';

const task: ExpectedTask = { id: 't04-s001', kind: 'query', solution: 'SELECT FIRST 1 1', solutionPg: 'SELECT 1 AS a', ordered: true };
const table = (rows: unknown[][]): CheckRun => ({ user: { cols: ['a'], rows: rows as never, error: null }, after: null });
const failed = (error: string): CheckRun => ({ user: { cols: [], rows: [], error }, after: null });

describe('expected results of the auto-check (G6)', () => {
  it('prefers the snapshot and caches it', async () => {
    const load = vi.fn(async () => ({ cols: ['x'], rows: [[42]], ordered: true }));
    const checker = { check: vi.fn(async () => table([[1]])) };
    const cache = createExpectedCache(load);
    expect(await cache.get(task, checker)).toEqual({ cols: ['x'], rows: [[42]], ordered: true });
    await cache.get(task, checker);
    expect(load).toHaveBeenCalledTimes(1);
    expect(checker.check).not.toHaveBeenCalled();
  });

  it('derives the value from the PostgreSQL variant of the solution and caches a success', async () => {
    const checker = { check: vi.fn(async () => table([[1]])) };
    const cache = createExpectedCache(async () => null);
    expect(await cache.get(task, checker)).toEqual({ cols: ['a'], rows: [[1]], ordered: true });
    await cache.get(task, checker);
    expect(checker.check).toHaveBeenCalledTimes(1);
    expect(checker.check).toHaveBeenCalledWith({ sql: 'SELECT 1 AS a', kind: 'query', check: undefined });
  });

  it('does not keep a failed derivation (e.g. aborted after the timeout): the next attempt tries again', async () => {
    let fail = true;
    const checker = { check: vi.fn(async () => (fail ? failed('Abgebrochen: …') : table([[1]]))) };
    const cache = createExpectedCache(async () => null);
    expect(await cache.get(task, checker)).toBeNull();
    fail = false;
    expect(await cache.get(task, checker)).toEqual({ cols: ['a'], rows: [[1]], ordered: true });
    expect(checker.check).toHaveBeenCalledTimes(2);
  });

  it('does not keep a snapshot load that threw', async () => {
    let calls = 0;
    const cache = createExpectedCache(async () => {
      calls += 1;
      if (calls === 1) throw new Error('chunk failed');
      return { cols: ['x'], rows: [[1]], ordered: false };
    });
    const checker = { check: vi.fn(async () => failed('nope')) };
    expect(await cache.get(task, checker)).toBeNull();
    expect(await cache.get(task, checker)).toEqual({ cols: ['x'], rows: [[1]], ordered: false });
  });

  it('keeps a definite "no comparison value" (the reference returns no table)', async () => {
    const checker = { check: vi.fn(async (): Promise<CheckRun> => ({ user: { cols: [], rows: [], error: null, affected: 1 }, after: null })) };
    const cache = createExpectedCache(async () => null);
    expect(await cache.get({ ...task, kind: 'dml', check: '' }, checker)).toBeNull();
    expect(await cache.get({ ...task, kind: 'dml', check: '' }, checker)).toBeNull();
    expect(checker.check).toHaveBeenCalledTimes(1);
  });
});
