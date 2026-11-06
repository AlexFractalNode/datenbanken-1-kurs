/**
 * PostgreSQL in WebAssembly (PGlite): the database itself. In the browser this module runs inside the
 * playground's Web Worker (`pg.worker.ts`), so a statement that never ends blocks the worker and not the
 * page; `pg-engine.ts` is the page side with the timeout.
 *
 * PGlite is loaded lazily (dynamic import): the 15 MB of WebAssembly and data only travel when the
 * playground page is opened. Vite ships the files next to the bundle and resolves them against `base`.
 * The value conventions are those of `tools/pglite-runner.mjs`, which produced the snapshots:
 * dates and times as PostgreSQL text, NUMERIC as number, INT8 as number (decimal string beyond 2^53),
 * CHAR(n) without padding, BYTEA as lowercase hex.
 *
 * Auto-checks must run on the freshly seeded state (db/DIALECT-NOTES.md, "Für den Playground"). `pg.clone()`
 * does not guarantee that: sequences of a clone jump ahead (observed: 2 became 34). So `check` runs the user
 * statement in a transaction that is always rolled back and then sets all sequences back to their seed
 * values, exactly like the runner does. Should a statement still get past the transaction guard and end
 * that transaction (or leave one open), the check is void and the database is rebuilt from schema + seed.
 *
 * All calls of one database run strictly one after the other (a promise chain): two checks interleaving
 * their BEGIN … ROLLBACK would see each other's rows.
 */
import type { PGlite } from '@electric-sql/pglite';
import type { Cell } from './sqlcheck';
import { scanSql } from './sql-scan';

export interface DbSource {
  schema: string;
  seed: string;
}

export interface RunResult {
  cols: string[];
  rows: Cell[][];
  error: string | null;
  /** Rows affected by the last statement, if it returned no result set. */
  affected?: number;
}

export interface CheckJob {
  sql: string;
  kind: 'query' | 'ddl' | 'dml';
  /** Query whose result is compared for ddl/dml tasks. */
  check?: string;
}

/** `user`: result of the user's statement; `after`: result of the task's check query run right after it (ddl/dml). */
export interface CheckRun {
  user: RunResult;
  after: RunResult | null;
}

export interface Database {
  /** Runs one or several statements for good (the free-practice database of the user). */
  run(sql: string): Promise<RunResult>;
  /**
   * Runs a task job on the seed state and rolls everything back afterwards. Use a database that is only
   * used for checks: `run` on the same instance would change the state the checks start from.
   */
  check(job: CheckJob): Promise<CheckRun>;
  close(): Promise<void>;
}

export const TRANSACTION_BLOCKED =
  'Transaktionsbefehle (BEGIN, COMMIT, ROLLBACK, START TRANSACTION ...) sind im Playground gesperrt: Jede Ausführung läuft für sich. ' +
  'ROLLBACK TO SAVEPOINT ist erlaubt.';

export const REBUILT_AFTER_TRANSACTION_END =
  'Die Anweisung hat die Prüf-Transaktion beendet, deshalb ist das Ergebnis nicht verwertbar. ' +
  'Die Prüf-Datenbank wurde aus Schema und Beispieldaten neu aufgebaut.';

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Same list as tools/sqltest.py: statements that would leave or break the surrounding transaction.
 * Strings, dollar quotes, identifiers and comments are recognised in one pass (`scanSql`).
 */
export function transactionControl(sql: string): boolean {
  return scanSql(sql).statements.some((stmt) => {
    const s = stmt.trim().toLowerCase().replace(/\s+/g, ' ');
    if (/^(begin|end|abort|commit|start transaction|prepare transaction)\b/.test(s)) return true;
    if (/^set (session characteristics as )?transaction\b/.test(s)) return true;
    return /^rollback\b/.test(s) && !/^rollback( work| transaction)? to\b/.test(s);
  });
}

export const errorText = (err: unknown): string => String((err as { message?: unknown })?.message ?? err);

interface Pg {
  PGlite: typeof import('@electric-sql/pglite').PGlite;
  types: typeof import('@electric-sql/pglite').types;
}

let pgPromise: Promise<Pg> | undefined;

/** Loads the PGlite module once; a failed load can be retried. */
export function loadPglite(): Promise<Pg> {
  pgPromise ??= import('@electric-sql/pglite').then(({ PGlite, types }) => ({ PGlite, types }));
  pgPromise.catch(() => {
    pgPromise = undefined;
  });
  return pgPromise;
}

function options(types: Pg['types']) {
  const raw = (value: string) => value;
  return {
    rowMode: 'array' as const,
    parsers: {
      [types.DATE]: raw,
      [types.TIME]: raw,
      [types.TIMETZ]: raw,
      [types.TIMESTAMP]: raw,
      [types.TIMESTAMPTZ]: raw,
      [types.INTERVAL]: raw,
      [types.NUMERIC]: (value: string) => Number(value),
      [types.INT8]: (value: string) => {
        const big = BigInt(value);
        return big <= MAX_SAFE && big >= -MAX_SAFE ? Number(big) : value;
      },
      [types.BPCHAR]: (value: string) => value.replace(/ +$/, ''),
      [types.BYTEA]: (value: string) => (value.startsWith('\\x') ? value.slice(2).toLowerCase() : value),
    },
  };
}

type Options = ReturnType<typeof options>;
type ExecResult = { fields: { name: string }[]; rows: unknown[][]; affectedRows?: number };
const EMPTY: RunResult = { cols: [], rows: [], error: null };

/** The result of the last statement that returns columns; otherwise the affected rows of the last one. */
function lastResult(results: ExecResult[]): RunResult {
  for (let i = results.length - 1; i >= 0; i -= 1) {
    if (results[i].fields.length > 0) {
      return { cols: results[i].fields.map((f) => f.name), rows: results[i].rows as Cell[][], error: null };
    }
  }
  const last = results[results.length - 1];
  return last?.affectedRows !== undefined ? { ...EMPTY, affected: last.affectedRows } : { ...EMPTY };
}

interface Sequence {
  schema: string;
  name: string;
  last: number | null;
  start: number;
}

async function sequences(pg: PGlite, opts: Options): Promise<Map<string, Sequence>> {
  const res = await pg.query<unknown[]>(
    'SELECT schemaname, sequencename, last_value, start_value FROM pg_sequences ORDER BY 1, 2',
    [],
    opts,
  );
  return new Map(
    (res.rows as [string, string, number | null, number][]).map(([schema, name, last, start]) => [
      `${schema}.${name}`,
      { schema, name, last, start },
    ]),
  );
}

async function restoreSequences(pg: PGlite, baseline: Map<string, Sequence>, opts: Options): Promise<void> {
  const current = await sequences(pg, opts);
  for (const [key, base] of baseline) {
    const now = current.get(key);
    if (now === undefined || now.last === base.last) continue;
    // setval(seq, start, false): the next value is `start`, like a fresh sequence
    await pg.query("SELECT setval(format('%I.%I', $1::text, $2::text)::regclass, $3, $4)", [
      base.schema,
      base.name,
      base.last ?? base.start,
      base.last !== null,
    ]);
  }
}

interface Instance {
  pg: PGlite;
  baseline: Map<string, Sequence>;
}

async function build(source: DbSource, PGliteClass: Pg['PGlite'], opts: Options): Promise<Instance> {
  const pg = await PGliteClass.create();
  try {
    await pg.exec(source.schema);
    await pg.exec(source.seed);
  } catch (err) {
    await pg.close().catch(() => undefined);
    throw new Error(`Beispieldatenbank konnte nicht aufgebaut werden: ${errorText(err)}`);
  }
  return { pg, baseline: await sequences(pg, opts) };
}

/** Name of the transaction-local setting that marks the check transaction. */
const GUARD = 'db1.check_guard';

/** True while the check transaction opened by `check` is still the current one. */
async function stillOurs(pg: PGlite): Promise<boolean> {
  const res = await pg.query<unknown[]>(`SELECT current_setting('${GUARD}', true)`, [], { rowMode: 'array' });
  return res.rows[0]?.[0] === 'on';
}

export interface CoreOptions {
  /** The transaction guard; tests replace it to reach the second line of defence. */
  blocked?: (sql: string) => boolean;
}

/** Builds an in-memory database from schema + seed. Throws with the PostgreSQL message if a script fails. */
export async function openCore(source: DbSource, coreOptions: CoreOptions = {}): Promise<Database> {
  const { PGlite: PGliteClass, types } = await loadPglite();
  const blocked = coreOptions.blocked ?? transactionControl;
  const opts = options(types);
  let db = await build(source, PGliteClass, opts);
  let broken: string | null = null;

  let chain: Promise<unknown> = Promise.resolve();
  function serial<T>(fn: () => Promise<T>): Promise<T> {
    const next = chain.then(fn, fn);
    chain = next.catch(() => undefined);
    return next;
  }

  /** Replaces the instance by a fresh one from schema + seed (after a statement escaped the check transaction). */
  async function rebuild(): Promise<void> {
    await db.pg.close().catch(() => undefined);
    try {
      db = await build(source, PGliteClass, opts);
      broken = null;
    } catch (err) {
      broken = `Die Prüf-Datenbank ist nicht mehr nutzbar (${errorText(err)}). Bitte lade die Seite neu.`;
    }
  }

  async function check(job: CheckJob): Promise<CheckRun> {
    const fail = (error: string): CheckRun => ({ user: { ...EMPTY, error }, after: null });
    if (broken) return fail(broken);
    if (blocked(job.sql)) return fail(TRANSACTION_BLOCKED);
    const { pg } = db;
    let out: CheckRun;
    let escaped = false;
    try {
      await pg.exec('BEGIN');
      // A transaction-local marker: it is gone in any other transaction (COMMIT/ROLLBACK, then BEGIN).
      await pg.query(`SELECT set_config('${GUARD}', 'on', true)`);
      try {
        const user = lastResult((await pg.exec(job.sql, opts)) as unknown as ExecResult[]);
        escaped = !pg.isInTransaction() || !(await stillOurs(pg));
        const hasCheck = !escaped && job.kind !== 'query' && job.check !== undefined && job.check.trim() !== '';
        out = {
          user,
          after: hasCheck ? lastResult((await pg.exec(job.check!, opts)) as unknown as ExecResult[]) : null,
        };
      } catch (err) {
        out = fail(errorText(err));
      } finally {
        if (pg.isInTransaction()) await pg.exec('ROLLBACK');
        else escaped = true;
      }
      // a statement that opened its own transaction behind a COMMIT leaves one open after our ROLLBACK
      if (pg.isInTransaction()) escaped = true;
      if (!escaped) await restoreSequences(pg, db.baseline, opts);
    } catch (err) {
      await rebuild();
      return fail(`Prüf-Datenbank: ${errorText(err)}`);
    }
    if (escaped) {
      await rebuild();
      return broken ? fail(broken) : fail(REBUILT_AFTER_TRANSACTION_END);
    }
    return out;
  }

  return {
    run(sql) {
      return serial(async () => {
        if (blocked(sql)) return { ...EMPTY, error: TRANSACTION_BLOCKED };
        try {
          return lastResult((await db.pg.exec(sql, opts)) as unknown as ExecResult[]);
        } catch (err) {
          return { ...EMPTY, error: errorText(err) };
        }
      });
    },

    check(job) {
      return serial(() => check(job));
    },

    close() {
      return serial(async () => {
        await db.pg.close().catch(() => undefined);
      });
    },
  };
}
