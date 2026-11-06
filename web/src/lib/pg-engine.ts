/**
 * Page side of the playground database. PostgreSQL (PGlite, `pg-core.ts`) runs in a Web Worker
 * (`pg.worker.ts`), so an endless statement cannot freeze the tab: every call has a timeout
 * (QUERY_TIMEOUT_MS). When it expires, the worker is terminated and a new one is built from schema +
 * seed, like `tools/pglite-runner.mjs` does with its worker threads; the call reports
 * QUERY_TIMEOUT_ERROR. A crashed worker is replaced the same way.
 *
 * Calls run one after the other; a queued call only starts its timeout once it is sent. Unit tests
 * (no `Worker` in Node/happy-dom) pass `spawn` with the same host running in-process.
 */
import type { CheckJob, CheckRun, Database, DbSource, RunResult } from './pg-core';
import type { HostRequest, HostResponse } from './pg-host';

export { TRANSACTION_BLOCKED, transactionControl } from './pg-core';
export type { CheckJob, CheckRun, Database, DbSource, RunResult } from './pg-core';

export const QUERY_TIMEOUT_MS = 10_000;

export const QUERY_TIMEOUT_ERROR =
  `Abgebrochen: Die Anweisung lief länger als ${QUERY_TIMEOUT_MS / 1000} Sekunden (zum Beispiel eine rekursive Abfrage ohne Abbruchbedingung). ` +
  'Die Datenbank wurde aus Schema und Beispieldaten neu aufgebaut; eigene Änderungen aus dem freien Üben sind dabei verloren gegangen.';

export const WORKER_CRASH_ERROR =
  'Die Datenbank im Hintergrund ist abgestürzt (zum Beispiel, weil der Speicher nicht reichte). ' +
  'Sie wurde aus Schema und Beispieldaten neu aufgebaut; eigene Änderungen aus dem freien Üben sind dabei verloren gegangen.';

export const NO_WORKER_ERROR =
  'Dieser Browser kann die Datenbank nicht im Hintergrund (Web Worker) starten. Nutze bitte einen aktuellen Browser.';

/** The part of the Web Worker API the client uses (tests pass a stand-in). */
export interface WorkerLike {
  postMessage(msg: HostRequest): void;
  terminate(): void;
  onmessage: ((event: { data: HostResponse }) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

export interface EngineOptions {
  /** Creates the worker; default: a module Web Worker running `pg.worker.ts`. */
  spawn?: () => WorkerLike | Promise<WorkerLike>;
  timeoutMs?: number;
}

type Request = HostRequest extends infer R ? (R extends { id: number } ? Omit<R, 'id'> : never) : never;
type Outcome = { ok: true; value: unknown } | { ok: false; error: string; fatal: boolean };

interface Conn {
  worker: WorkerLike;
  pending: Map<number, (out: Outcome) => void>;
  dead: boolean;
}

/**
 * A module Web Worker. There is deliberately no in-process fallback in the page bundle: it would freeze
 * the tab on an endless statement and ship PGlite a second time.
 */
function defaultSpawn(): WorkerLike {
  if (typeof Worker === 'undefined') throw new Error(NO_WORKER_ERROR);
  return new Worker(new URL('./pg.worker.ts', import.meta.url), { type: 'module', name: 'pglite' }) as unknown as WorkerLike;
}

const EMPTY: RunResult = { cols: [], rows: [], error: null };
const CLOSED = 'Die Datenbank ist geschlossen.';
const errorText = (err: unknown): string => String((err as { message?: unknown })?.message ?? err);

/** Builds the database (schema + seed) in a worker. Rejects with the PostgreSQL message if a script fails. */
export async function openDatabase(source: DbSource, options: EngineOptions = {}): Promise<Database> {
  const spawn = options.spawn ?? defaultSpawn;
  const timeoutMs = options.timeoutMs ?? QUERY_TIMEOUT_MS;
  let nextId = 0;
  let closed = false;

  function kill(conn: Conn, error: string): void {
    if (conn.dead) return;
    conn.dead = true;
    conn.worker.terminate();
    for (const settle of conn.pending.values()) settle({ ok: false, error, fatal: true });
    conn.pending.clear();
  }

  function send(conn: Conn, req: Request, timeout: number): Promise<Outcome> {
    return new Promise((resolve) => {
      if (conn.dead) return resolve({ ok: false, error: WORKER_CRASH_ERROR, fatal: true });
      const id = (nextId += 1);
      let timer: ReturnType<typeof setTimeout> | undefined;
      conn.pending.set(id, (out) => {
        if (timer !== undefined) clearTimeout(timer);
        resolve(out);
      });
      if (timeout > 0) {
        timer = setTimeout(() => {
          conn.pending.delete(id);
          resolve({ ok: false, error: QUERY_TIMEOUT_ERROR, fatal: true });
          kill(conn, QUERY_TIMEOUT_ERROR);
        }, timeout);
      }
      conn.worker.postMessage({ id, ...req } as HostRequest);
    });
  }

  async function connect(): Promise<Conn> {
    const worker = await spawn();
    const conn: Conn = { worker, pending: new Map(), dead: false };
    worker.onmessage = ({ data }) => {
      const settle = conn.pending.get(data.id);
      if (!settle) return;
      conn.pending.delete(data.id);
      settle(data.ok ? { ok: true, value: data.value } : { ok: false, error: data.error, fatal: false });
    };
    worker.onerror = () => kill(conn, WORKER_CRASH_ERROR);
    // Building the database has no timeout: the first start also downloads 15 MB.
    const opened = await send(conn, { op: 'open', source }, 0);
    if (!opened.ok) {
      kill(conn, opened.error);
      throw new Error(opened.error);
    }
    return conn;
  }

  let conn: Promise<Conn> = connect();
  await conn;

  let chain: Promise<unknown> = Promise.resolve();
  function call(req: Request): Promise<Outcome> {
    const job = chain.then(async (): Promise<Outcome> => {
      if (closed) return { ok: false, error: CLOSED, fatal: false };
      let c: Conn | null = await conn.catch(() => null);
      if (!c || c.dead) {
        // the rebuild after a timeout or crash failed (or the worker died while idle): try again now
        conn = connect();
        try {
          c = await conn;
        } catch (err) {
          return { ok: false, error: errorText(err), fatal: false };
        }
      }
      const out = await send(c, req, timeoutMs);
      if (!out.ok && out.fatal && !closed) {
        // rebuild right away, so the next statement does not wait for the whole start
        conn = connect();
        conn.catch(() => undefined);
      }
      return out;
    });
    chain = job.catch(() => undefined);
    return job;
  }

  return {
    async run(sql) {
      const out = await call({ op: 'run', sql });
      return out.ok ? (out.value as RunResult) : { ...EMPTY, error: out.error };
    },
    async check(job: CheckJob) {
      const out = await call({ op: 'check', job });
      return out.ok ? (out.value as CheckRun) : { user: { ...EMPTY, error: out.error }, after: null };
    },
    async close() {
      closed = true;
      const c = await conn.catch(() => null);
      if (!c || c.dead) return;
      // Idle: let PGlite shut down cleanly. Busy (e.g. an endless statement): terminate right away.
      if (c.pending.size === 0) await send(c, { op: 'close' }, 2_000);
      kill(c, CLOSED);
    },
  };
}
