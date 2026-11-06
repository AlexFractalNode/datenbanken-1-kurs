import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NO_WORKER_ERROR, openDatabase, QUERY_TIMEOUT_MS, QUERY_TIMEOUT_ERROR, WORKER_CRASH_ERROR, type WorkerLike } from '../src/lib/pg-engine';
import { createHost, type HostRequest, type HostResponse } from '../src/lib/pg-host';

const dbDir = resolve(process.cwd(), '..', 'db', 'firma');
const source = {
  schema: readFileSync(resolve(dbDir, 'schema.pg.sql'), 'utf8'),
  seed: readFileSync(resolve(dbDir, 'seed.sql'), 'utf8'),
};

/**
 * Stand-in for the Web Worker: runs the real host (PGlite) in-process, but never answers a statement that
 * contains `pg_hang` (like an endless recursive CTE that blocks the worker) and can be made to crash.
 */
class FakeWorker implements WorkerLike {
  onmessage: ((event: { data: HostResponse }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  terminated = false;
  readonly host = createHost((msg) => {
    if (!this.terminated) queueMicrotask(() => this.onmessage?.({ data: msg }));
  });
  postMessage(msg: HostRequest): void {
    if (this.terminated) return;
    const sql = msg.op === 'run' ? msg.sql : msg.op === 'check' ? msg.job.sql : '';
    if (/pg_hang/.test(sql)) return;
    if (/pg_crash/.test(sql)) {
      queueMicrotask(() => this.onerror?.({ message: 'RuntimeError: memory access out of bounds' }));
      return;
    }
    this.host(msg);
  }
  terminate(): void {
    this.terminated = true;
  }
}

function workers() {
  const made: FakeWorker[] = [];
  return {
    made,
    spawn: () => {
      const w = new FakeWorker();
      made.push(w);
      return w;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('playground engine in a worker with a timeout', () => {
  it('waits 10 s by default', () => {
    expect(QUERY_TIMEOUT_MS).toBe(10_000);
  });

  it('aborts a statement that runs too long, terminates the worker and rebuilds the database from schema and seed', async () => {
    const { made, spawn } = workers();
    const db = await openDatabase(source, { spawn, timeoutMs: 300 });
    expect(made).toHaveLength(1);
    expect((await db.run('CREATE TABLE notiz (id int)')).error).toBeNull();

    const hung = await db.run('WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r) SELECT pg_hang() FROM r');
    expect(hung.error).toBe(QUERY_TIMEOUT_ERROR);
    expect(hung.error).toMatch(/10 Sekunden|abgebrochen/);
    expect(made[0].terminated).toBe(true);
    expect(made).toHaveLength(2);

    // the new worker holds the seed state again: the table of the free practice is gone
    const after = await db.run("SELECT to_regclass('notiz') IS NULL AS gone, count(*) AS n FROM abteilung");
    expect(after).toMatchObject({ error: null, rows: [[true, 6]] });
    await db.close();
    expect(made[1].terminated).toBe(true);
  }, 60_000);

  it('aborts a check the same way; the next check runs on the fresh seed state', async () => {
    const { made, spawn } = workers();
    const db = await openDatabase(source, { spawn, timeoutMs: 300 });
    const hung = await db.check({ sql: 'SELECT pg_hang()', kind: 'query' });
    expect(hung.user.error).toBe(QUERY_TIMEOUT_ERROR);
    expect(hung.after).toBeNull();
    expect(made).toHaveLength(2);
    const job = {
      sql: "INSERT INTO abteilung (bezeichnung, standort) VALUES ('Neu', 'Ost')",
      kind: 'dml' as const,
      check: "SELECT abteilung_id, bezeichnung FROM abteilung WHERE bezeichnung = 'Neu'",
    };
    expect((await db.check(job)).after?.rows).toEqual([[7, 'Neu']]);
    await db.close();
  }, 60_000);

  it('queued statements wait for the one before and do not time out meanwhile', async () => {
    const { spawn } = workers();
    const db = await openDatabase(source, { spawn, timeoutMs: 300 });
    const [hung, next] = await Promise.all([db.run('SELECT pg_hang()'), db.run('SELECT 1 AS x')]);
    expect(hung.error).toBe(QUERY_TIMEOUT_ERROR);
    expect(next).toMatchObject({ error: null, rows: [[1]] });
    await db.close();
  }, 60_000);

  it('close() terminates a busy worker at once (reset during an endless statement)', async () => {
    const { made, spawn } = workers();
    const db = await openDatabase(source, { spawn, timeoutMs: 60_000 });
    const hung = db.run('SELECT pg_hang()');
    await new Promise((r) => setTimeout(r, 20));
    const started = Date.now();
    await db.close();
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(made[0].terminated).toBe(true);
    expect((await hung).error).toMatch(/geschlossen/);
    expect(made).toHaveLength(1);
  }, 60_000);

  it('reports a crashed worker and rebuilds as well', async () => {
    const { made, spawn } = workers();
    const db = await openDatabase(source, { spawn, timeoutMs: 5_000 });
    const crashed = await db.run('SELECT pg_crash()');
    expect(crashed.error).toBe(WORKER_CRASH_ERROR);
    expect(made[0].terminated).toBe(true);
    expect((await db.run('SELECT 2 AS y')).rows).toEqual([[2]]);
    await db.close();
  }, 60_000);

  it('rejects if the database cannot be built in the worker', async () => {
    const { spawn, made } = workers();
    await expect(openDatabase({ schema: 'CREATE TABLE kaputt (', seed: '' }, { spawn })).rejects.toThrow(/Beispieldatenbank konnte nicht aufgebaut werden/);
    expect(made[0].terminated).toBe(true);
  }, 60_000);

  it('without Web Workers it refuses to start instead of running PGlite on the page', async () => {
    vi.stubGlobal('Worker', undefined);
    await expect(openDatabase(source)).rejects.toThrow(NO_WORKER_ERROR);
  });

  it('starts a module Web Worker when the browser has one', async () => {
    const created: { url: string; options: unknown }[] = [];
    class BrowserWorker extends FakeWorker {
      constructor(url: URL | string, options?: unknown) {
        super();
        created.push({ url: String(url), options });
      }
    }
    vi.stubGlobal('Worker', BrowserWorker);
    const db = await openDatabase(source, { timeoutMs: 5_000 });
    expect(created).toHaveLength(1);
    expect(created[0].url).toMatch(/pg\.worker\.ts$/);
    expect(created[0].options).toEqual({ type: 'module', name: 'pglite' });
    expect((await db.run('SELECT 3 AS z')).rows).toEqual([[3]]);
    await db.close();
  }, 60_000);
});
