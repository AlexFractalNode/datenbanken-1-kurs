import { describe, expect, it } from 'vitest';
import { hint } from '../src/lib/dialect';

const SYNTAX = 'syntax error at or near "3"';

describe('dialect.hint', () => {
  it('explains FIRST n with LIMIT and FETCH FIRST', () => {
    const text = hint(SYNTAX, 'SELECT FIRST 3 * FROM kurs');
    expect(text).toContain('LIMIT 3');
    expect(text).toContain('FETCH FIRST 3 ROWS ONLY');
  });

  it('explains SKIP and ROWS m TO n with OFFSET', () => {
    expect(hint('syntax error at or near "SKIP"', 'SELECT FIRST 2 SKIP 4 titel FROM kurs')).toContain('OFFSET 4');
    expect(hint(SYNTAX, 'SELECT titel FROM kurs ORDER BY titel ROWS 3 TO 5;')).toMatch(/LIMIT 3 OFFSET 2/);
  });

  it('points GEN_ID and NEXT VALUE FOR to identity columns and sequences', () => {
    const gen = hint('function gen_id(unknown, integer) does not exist', 'SELECT GEN_ID(gen_kurs, 1) FROM rdb$database');
    expect(gen).toMatch(/Identity/);
    expect(gen).toMatch(/nextval/);
    expect(hint(SYNTAX, "SELECT NEXT VALUE FOR gen_kurs")).toContain("nextval('gen_kurs')");
  });

  it('knows further Firebird constructs', () => {
    expect(hint('relation "rdb$database" does not exist', 'SELECT 1 FROM RDB$DATABASE')).toMatch(/ohne FROM|kein FROM/i);
    expect(hint('relation "rdb$relations" does not exist', 'SELECT * FROM rdb$relations')).toMatch(/information_schema/);
    expect(hint('function list(text) does not exist', 'SELECT LIST(titel, \', \') FROM kurs')).toContain('STRING_AGG');
    expect(hint(SYNTAX, "SELECT * FROM kurs WHERE titel CONTAINING 'sql'")).toMatch(/ILIKE|LIKE/);
    expect(hint('function dateadd(unknown, integer, date) does not exist', 'SELECT DATEADD(DAY, 1, CURRENT_DATE)')).toMatch(/INTERVAL/);
    expect(hint('function iif(boolean, integer, integer) does not exist', 'SELECT IIF(1 = 1, 1, 2)')).toContain('CASE');
    expect(hint(SYNTAX, 'SET TERM ^ ;')).toMatch(/SET TERM/);
    expect(hint(SYNTAX, 'CREATE TABLE t (a BLOB SUB_TYPE TEXT)')).toContain('TEXT');
    expect(hint(SYNTAX, 'ALTER TABLE t ALTER COLUMN a TO b')).toContain('RENAME COLUMN');
  });

  it('returns null for ordinary errors', () => {
    expect(hint('relation "kurse" does not exist', 'SELECT * FROM kurse')).toBeNull();
    expect(hint('column "x" does not exist', 'SELECT x FROM kurs')).toBeNull();
    expect(hint('syntax error at end of input', 'SELECT * FROM')).toBeNull();
  });

  it('returns null without an error, and ignores keywords in strings and comments', () => {
    expect(hint('', 'SELECT FIRST 3 * FROM kurs')).toBeNull();
    expect(hint(SYNTAX, "SELECT 'FIRST 3' AS x FROM")).toBeNull();
    expect(hint(SYNTAX, '-- SELECT FIRST 3\nSELECT FROM')).toBeNull();
  });
});
