#!/usr/bin/env node
// Batch SQL runner on PGlite (PostgreSQL in WebAssembly).
//
// stdin:  {"setup": ["<sql script>", ...], "jobs": [{"id", "sql", "kind", "check"}],
//          "job_timeout_ms": 30000}
// stdout: {"results": {"<id>": {"cols": [...], "rows": [[...]], "error": null | "<message>"}}}
//
// The setup scripts run once, in order, on a fresh in-memory database.
// Every job runs inside its own transaction that is always rolled back.
// Sequences (identity columns) are not transactional, so after every job all
// sequences are reset to their state right after the setup: every job sees
// the same database, independent of job order. kind "query" returns the
// result of the last statement in `sql`; kind "ddl"/"dml" executes `sql` and
// returns the result of `check` (or an empty result when there is none).
//
// Timeout: PGlite runs single-threaded in WebAssembly and ignores
// statement_timeout (it is still set with SET LOCAL). The database therefore
// lives in a worker thread; a job that exceeds job_timeout_ms is reported
// as "timeout: ...", the worker is terminated and a new one is built from
// the setup for the remaining jobs.
//
// Values: date/time types as PostgreSQL text (ISO), NUMERIC as JSON number,
// INT8 as number or, beyond 2^53, as decimal string, CHAR(n) without
// trailing blanks (VARCHAR/TEXT unchanged), BYTEA as lowercase hex.
// Exit code 0 when the batch was processed (errors are reported per job),
// 2 on invalid input.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { PGlite, types } from '@electric-sql/pglite';

const KINDS = new Set(['query', 'ddl', 'dml']);
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const raw = (value) => value;
const PARSERS = {
  [types.DATE]: raw,
  [types.TIME]: raw,
  [types.TIMETZ]: raw,
  [types.TIMESTAMP]: raw,
  [types.TIMESTAMPTZ]: raw,
  [types.INTERVAL]: raw,
  [types.NUMERIC]: (value) => Number(value),
  [types.INT8]: (value) => {
    const big = BigInt(value);
    return big <= MAX_SAFE && big >= -MAX_SAFE ? Number(big) : value;
  },
  [types.BPCHAR]: (value) => value.replace(/ +$/, ''),
  [types.BYTEA]: (value) => (value.startsWith('\\x') ? value.slice(2).toLowerCase() : value),
};
const OPTIONS = { rowMode: 'array', parsers: PARSERS };
const errorText = (err) => String(err?.message ?? err);

// --- worker: owns the database -------------------------------------------------

function lastResult(results) {
  for (let i = results.length - 1; i >= 0; i -= 1) {
    if (results[i].fields.length > 0) return results[i];
  }
  return { fields: [], rows: [] };
}

function toResult(res) {
  return { cols: res.fields.map((f) => f.name), rows: res.rows, error: null };
}

async function sequences(pg) {
  const res = await pg.query(
    'SELECT schemaname, sequencename, last_value, start_value FROM pg_sequences ORDER BY 1, 2',
    [],
    OPTIONS,
  );
  return new Map(res.rows.map(([schema, name, last, start]) => [`${schema}.${name}`, { schema, name, last, start }]));
}

async function restoreSequences(pg, baseline) {
  const current = await sequences(pg);
  for (const [key, base] of baseline) {
    const now = current.get(key);
    if (now === undefined || now.last === base.last) continue;
    // setval(seq, start, false): next value is start, like a fresh sequence
    await pg.query("SELECT setval(format('%I.%I', $1::text, $2::text)::regclass, $3, $4)", [
      base.schema,
      base.name,
      base.last ?? base.start,
      base.last !== null,
    ]);
  }
}

async function runJob(pg, job, timeoutMs) {
  await pg.exec('BEGIN');
  try {
    await pg.exec(`SET LOCAL statement_timeout = ${Math.max(1, Math.floor(timeoutMs))}`);
    if (job.kind === 'query') {
      return toResult(lastResult(await pg.exec(job.sql, OPTIONS)));
    }
    await pg.exec(job.sql, OPTIONS);
    if (job.check == null || job.check.trim() === '') return toResult(lastResult([]));
    return toResult(lastResult(await pg.exec(job.check, OPTIONS)));
  } catch (err) {
    return { cols: [], rows: [], error: errorText(err) };
  } finally {
    await pg.exec('ROLLBACK');
  }
}

async function workerMain() {
  const pg = await PGlite.create();
  let setupError = null;
  for (const [i, script] of workerData.setup.entries()) {
    try {
      await pg.exec(script);
    } catch (err) {
      setupError = `setup script ${i + 1} failed: ${errorText(err)}`;
      break;
    }
  }
  const baseline = setupError ? new Map() : await sequences(pg);
  parentPort.on('message', async ({ job, timeoutMs }) => {
    let result;
    try {
      result = await runJob(pg, job, timeoutMs);
      await restoreSequences(pg, baseline);
    } catch (err) {
      result = { cols: [], rows: [], error: `runner: ${errorText(err)}` };
    }
    parentPort.postMessage({ type: 'result', result });
  });
  parentPort.postMessage({ type: 'ready', setupError });
}

// --- main: input, timeouts, output ---------------------------------------------

function fail(message) {
  process.stderr.write(`pglite-runner: ${message}\n`);
  process.exit(2);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function validate(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    fail('input must be a JSON object');
  }
  const setup = input.setup ?? [];
  const jobs = input.jobs ?? [];
  const timeoutMs = input.job_timeout_ms ?? DEFAULT_TIMEOUT_MS;
  if (!Array.isArray(setup) || setup.some((s) => typeof s !== 'string')) {
    fail('"setup" must be a list of SQL strings');
  }
  if (!Array.isArray(jobs)) fail('"jobs" must be a list');
  if (typeof timeoutMs !== 'number' || !(timeoutMs > 0)) fail('"job_timeout_ms" must be a positive number');
  const seen = new Set();
  for (const job of jobs) {
    if (job === null || typeof job !== 'object') fail('every job must be an object');
    if (typeof job.id !== 'string' || job.id === '') fail('every job needs a string "id"');
    if (seen.has(job.id)) fail(`duplicate job id ${job.id}`);
    seen.add(job.id);
    if (typeof job.sql !== 'string') fail(`job ${job.id}: "sql" must be a string`);
    if (!KINDS.has(job.kind)) fail(`job ${job.id}: unknown kind ${JSON.stringify(job.kind)}`);
    if (job.check != null && typeof job.check !== 'string') {
      fail(`job ${job.id}: "check" must be a string or null`);
    }
  }
  return { setup, jobs, timeoutMs };
}

class DbWorker {
  constructor(setup) {
    this.pending = null;
    this.worker = new Worker(new URL(import.meta.url), { workerData: { setup } });
    this.worker.on('message', (msg) => this.settle(msg));
    this.worker.on('error', (err) => this.settle({ type: 'crash', error: errorText(err) }));
    this.worker.on('exit', (code) => this.settle({ type: 'crash', error: `worker exited with ${code}` }));
  }

  settle(msg) {
    const pending = this.pending;
    this.pending = null;
    if (pending) pending(msg);
  }

  next(timeoutMs) {
    return new Promise((resolve) => {
      const timer = timeoutMs ? setTimeout(() => this.settle({ type: 'timeout' }), timeoutMs) : null;
      this.pending = (msg) => {
        if (timer) clearTimeout(timer);
        resolve(msg);
      };
    });
  }

  async ready() {
    const msg = await this.next(0);
    if (msg.type === 'crash') return `setup failed: ${msg.error}`;
    return msg.setupError;
  }

  run(job, timeoutMs) {
    const reply = this.next(timeoutMs);
    this.worker.postMessage({ job, timeoutMs });
    return reply;
  }

  async stop() {
    this.pending = null;
    this.worker.removeAllListeners('exit');
    await this.worker.terminate();
  }
}

async function main() {
  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch (err) {
    fail(`invalid JSON on stdin: ${err.message}`);
  }
  const { setup, jobs, timeoutMs } = validate(input);
  const results = {};
  let db = new DbWorker(setup);
  let setupError = await db.ready();
  for (const job of jobs) {
    if (setupError) {
      results[job.id] = { cols: [], rows: [], error: setupError };
      continue;
    }
    const msg = await db.run(job, timeoutMs);
    if (msg.type === 'result') {
      results[job.id] = msg.result;
      continue;
    }
    const reason = msg.type === 'timeout' ? `timeout: job exceeded ${timeoutMs} ms` : `runner crashed: ${msg.error}`;
    results[job.id] = { cols: [], rows: [], error: reason };
    await db.stop();
    db = new DbWorker(setup);
    setupError = await db.ready();
  }
  await db.stop();
  const out = { results };
  if (setupError) out.setup_error = setupError;
  const json = JSON.stringify(out, (_, v) => (typeof v === 'bigint' ? String(v) : v));
  process.stdout.write(json);
}

if (isMainThread) {
  main().catch((err) => fail(String(err?.stack ?? err)));
} else {
  workerMain().catch((err) => {
    parentPort.postMessage({ type: 'ready', setupError: `runner: ${errorText(err)}` });
  });
}
