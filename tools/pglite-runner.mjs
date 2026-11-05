#!/usr/bin/env node
// Batch SQL runner on PGlite (PostgreSQL in WebAssembly).
//
// stdin:  {"setup": ["<sql script>", ...], "jobs": [{"id", "sql", "kind", "check"}]}
// stdout: {"results": {"<id>": {"cols": [...], "rows": [[...]], "error": null | "<message>"}}}
//
// The setup scripts run once, in order, on a fresh in-memory database.
// Every job runs inside its own transaction that is always rolled back, so
// jobs never see each other's changes. kind "query" returns the result of
// the last statement in `sql`; kind "ddl"/"dml" executes `sql` and returns
// the result of `check` (or an empty result when there is no check).
//
// Values: date/time types are returned as PostgreSQL text (ISO), NUMERIC as
// JSON number, everything else as parsed by PGlite. Exit code 0 when the
// batch was processed (errors are reported per job), 2 on invalid input.
import { PGlite, types } from '@electric-sql/pglite';

const KINDS = new Set(['query', 'ddl', 'dml']);
const raw = (value) => value;
const PARSERS = {
  [types.DATE]: raw,
  [types.TIME]: raw,
  [types.TIMETZ]: raw,
  [types.TIMESTAMP]: raw,
  [types.TIMESTAMPTZ]: raw,
  [types.INTERVAL]: raw,
  [types.NUMERIC]: (value) => Number(value),
};
const OPTIONS = { rowMode: 'array', parsers: PARSERS };

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
  if (!Array.isArray(setup) || setup.some((s) => typeof s !== 'string')) {
    fail('"setup" must be a list of SQL strings');
  }
  if (!Array.isArray(jobs)) fail('"jobs" must be a list');
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
  return { setup, jobs };
}

function lastResult(results) {
  for (let i = results.length - 1; i >= 0; i -= 1) {
    if (results[i].fields.length > 0) return results[i];
  }
  return { fields: [], rows: [] };
}

function toResult(res) {
  return { cols: res.fields.map((f) => f.name), rows: res.rows, error: null };
}

async function runJob(pg, job) {
  await pg.exec('BEGIN');
  try {
    if (job.kind === 'query') {
      return toResult(lastResult(await pg.exec(job.sql, OPTIONS)));
    }
    await pg.exec(job.sql, OPTIONS);
    if (job.check == null || job.check.trim() === '') return toResult(lastResult([]));
    return toResult(lastResult(await pg.exec(job.check, OPTIONS)));
  } catch (err) {
    return { cols: [], rows: [], error: String(err?.message ?? err) };
  } finally {
    await pg.exec('ROLLBACK');
  }
}

async function main() {
  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch (err) {
    fail(`invalid JSON on stdin: ${err.message}`);
  }
  const { setup, jobs } = validate(input);
  const pg = await PGlite.create();
  const results = {};
  let setupError = null;
  for (const [i, script] of setup.entries()) {
    try {
      await pg.exec(script);
    } catch (err) {
      setupError = `setup script ${i + 1} failed: ${String(err?.message ?? err)}`;
      break;
    }
  }
  for (const job of jobs) {
    results[job.id] = setupError
      ? { cols: [], rows: [], error: setupError }
      : await runJob(pg, job);
  }
  await pg.close();
  const out = { results };
  if (setupError) out.setup_error = setupError;
  process.stdout.write(JSON.stringify(out));
}

main().catch((err) => fail(String(err?.stack ?? err)));
