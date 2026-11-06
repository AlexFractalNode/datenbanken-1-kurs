import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openCore, REBUILT_AFTER_TRANSACTION_END, type Database } from '../src/lib/pg-core';

const dbDir = resolve(process.cwd(), '..', 'db', 'firma');
const source = {
  schema: readFileSync(resolve(dbDir, 'schema.pg.sql'), 'utf8'),
  seed: readFileSync(resolve(dbDir, 'seed.sql'), 'utf8'),
};

/**
 * The transaction guard (`transactionControl`) is the first line; the core additionally checks after every
 * check() that its own transaction was still open and is closed afterwards. To reach that second line the
 * guard is switched off here.
 */
describe('pg-core: check() notices a transaction the statement ended (G1)', () => {
  let db: Database;
  beforeAll(async () => {
    db = await openCore(source, { blocked: () => false });
  }, 60_000);
  afterAll(async () => {
    await db.close();
  });

  const count = "SELECT count(*) FROM abteilung WHERE bezeichnung = 'Leck'";

  it('reports the run as invalid and rebuilds the database from schema and seed', async () => {
    const r = await db.check({ sql: "INSERT INTO abteilung (bezeichnung, standort) VALUES ('Leck', 'Ost'); COMMIT", kind: 'dml', check: count });
    expect(r.user.error).toBe(REBUILT_AFTER_TRANSACTION_END);
    expect(r.after).toBeNull();
    // the committed row is gone: the next check starts from the seed state again
    const next = await db.check({ sql: count, kind: 'query' });
    expect(next.user).toMatchObject({ error: null, rows: [[0]] });
  });

  it('also rebuilds if the statement opens a new transaction behind its COMMIT', async () => {
    const r = await db.check({ sql: "INSERT INTO abteilung (bezeichnung, standort) VALUES ('Leck', 'Ost'); COMMIT; BEGIN", kind: 'dml', check: count });
    expect(r.user.error).toBe(REBUILT_AFTER_TRANSACTION_END);
    expect((await db.check({ sql: count, kind: 'query' })).user.rows).toEqual([[0]]);
    expect((await db.check({ sql: 'SELECT count(*) FROM abteilung', kind: 'query' })).user.rows).toEqual([[6]]);
  });

  it('leaves ordinary checks alone', async () => {
    const r = await db.check({ sql: "INSERT INTO abteilung (bezeichnung, standort) VALUES ('Neu', 'Ost')", kind: 'dml', check: "SELECT abteilung_id FROM abteilung WHERE bezeichnung = 'Neu'" });
    expect(r.user.error).toBeNull();
    expect(r.after?.rows).toEqual([[7]]);
  });
});
