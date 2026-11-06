import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openDatabase, transactionControl, TRANSACTION_BLOCKED, type Database } from '../src/lib/pg-engine';
import { equal } from '../src/lib/sqlcheck';

const dbDir = resolve(process.cwd(), '..', 'db', 'firma');
const source = {
  schema: readFileSync(resolve(dbDir, 'schema.pg.sql'), 'utf8'),
  seed: readFileSync(resolve(dbDir, 'seed.sql'), 'utf8'),
};

describe('transactionControl', () => {
  it('flags statements that would leave the surrounding transaction', () => {
    for (const sql of ['COMMIT', 'commit;', 'ROLLBACK', 'BEGIN', 'end', 'ABORT', 'START TRANSACTION', 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE', 'PREPARE TRANSACTION \'x\'', 'SELECT 1; COMMIT']) {
      expect(transactionControl(sql), sql).toBe(true);
    }
  });

  it('allows ordinary statements, savepoints and keywords in text', () => {
    for (const sql of ['SELECT 1', 'SAVEPOINT a; ROLLBACK TO SAVEPOINT a', "SELECT 'commit; begin' AS x", '-- commit\nSELECT 1', 'SELECT ende FROM t']) {
      expect(transactionControl(sql), sql).toBe(false);
    }
  });
});

describe('PGlite database', () => {
  let db: Database;
  beforeAll(async () => {
    db = await openDatabase(source);
  }, 60_000);
  afterAll(async () => {
    await db.close();
  });

  it('runs queries with column names, plain values and trimmed CHAR', async () => {
    const r = await db.run("SELECT bezeichnung, abteilung_id, DATE '2024-03-01' AS d, 2.50::numeric AS n, 'ab '::char(5) AS c, TRUE AS b FROM abteilung ORDER BY abteilung_id LIMIT 1");
    expect(r.error).toBeNull();
    expect(r.cols).toEqual(['bezeichnung', 'abteilung_id', 'd', 'n', 'c', 'b']);
    expect(r.rows).toEqual([['Geschäftsführung', 1, '2024-03-01', 2.5, 'ab', true]]);
  });

  it('returns the last result set of several statements and reports affected rows of DML', async () => {
    const q = await db.run('SELECT 1 AS a; SELECT 2 AS b, 3 AS c');
    expect(q.cols).toEqual(['b', 'c']);
    const dml = await db.run("UPDATE abteilung SET standort = standort WHERE abteilung_id = 1");
    expect(dml).toMatchObject({ error: null, cols: [], affected: 1 });
  });

  it('reports PostgreSQL errors as text', async () => {
    const r = await db.run('SELECT FIRST 3 * FROM abteilung');
    expect(r.error).toMatch(/syntax error/i);
    expect(r.rows).toEqual([]);
  });

  it('blocks transaction control', async () => {
    expect((await db.run('COMMIT')).error).toBe(TRANSACTION_BLOCKED);
    expect((await db.check({ sql: 'ROLLBACK', kind: 'query' })).user.error).toBe(TRANSACTION_BLOCKED);
  });

  it('check() always starts from the seed state: DML is rolled back and identities are reset', async () => {
    const job = {
      sql: "INSERT INTO abteilung (bezeichnung, standort) VALUES ('Neu', 'Ost')",
      kind: 'dml' as const,
      check: "SELECT abteilung_id, bezeichnung FROM abteilung WHERE bezeichnung = 'Neu'",
    };
    const first = await db.check(job);
    const second = await db.check(job);
    expect(first.user).toMatchObject({ error: null, affected: 1 });
    expect(first.after?.rows).toEqual([[7, 'Neu']]); // seed maximum + 1, not drifting
    expect(second.after?.rows).toEqual(first.after?.rows);
    expect((await db.run("SELECT count(*) FROM abteilung WHERE bezeichnung = 'Neu'")).rows).toEqual([[0]]);
  });

  it('check() rolls back DDL', async () => {
    await db.run('CREATE TABLE notiz (id int)');
    const r = await db.check({ sql: 'CREATE TABLE tmp (id int)', kind: 'ddl', check: 'SELECT count(*) FROM tmp' });
    expect(r.after?.rows).toEqual([[0]]);
    // check() runs in the same instance as run(): the user table is visible, the task table is gone again
    expect((await db.run('SELECT to_regclass(\'tmp\') IS NULL AS gone')).rows).toEqual([[true]]);
    await db.run('DROP TABLE notiz');
  });

  it('check() survives errors in the user statement', async () => {
    const bad = await db.check({ sql: 'SELEKT 1', kind: 'query' });
    expect(bad.user.error).toMatch(/syntax error/i);
    expect(bad.after).toBeNull();
    const good = await db.check({ sql: 'SELECT count(*) AS n FROM abteilung', kind: 'query' });
    expect(good.user.rows).toEqual([[6]]);
    expect(good.after).toBeNull();
    expect(equal(good.user, { cols: ['n'], rows: [[6]], ordered: false }).ok).toBe(true);
  });
});
