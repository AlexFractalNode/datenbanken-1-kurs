import { describe, expect, it } from 'vitest';
import { stripSql } from '../src/lib/dialect';
import { transactionControl } from '../src/lib/pg-engine';
import { scanSql } from '../src/lib/sql-scan';

describe('scanSql: one pass over strings, dollar quotes, identifiers and comments', () => {
  it('masks string contents and drops comments', () => {
    expect(scanSql("SELECT 'a;b' -- c;d\nFROM t /* x; */").text).toBe("SELECT ''  \nFROM t  ");
  });

  it('splits on semicolons outside of literals only', () => {
    expect(scanSql("SELECT 'x;y'; SELECT \"a;b\"; SELECT $$;$$").statements.map((s) => s.trim())).toEqual([
      "SELECT ''",
      'SELECT "a;b"',
      "SELECT ''",
    ]);
  });

  it('a comment marker inside a string does not hide what follows', () => {
    expect(scanSql("SELECT '--'; COMMIT").statements.map((s) => s.trim())).toEqual(["SELECT ''", 'COMMIT']);
    expect(scanSql("SELECT '/*'; COMMIT; SELECT '*/'").statements.map((s) => s.trim())).toEqual(["SELECT ''", 'COMMIT', "SELECT ''"]);
  });

  it('a quote inside a comment does not open a string', () => {
    expect(scanSql("-- it's\nCOMMIT").statements.map((s) => s.trim())).toEqual(['COMMIT']);
    expect(scanSql("/* it's */ COMMIT").statements.map((s) => s.trim())).toEqual(['COMMIT']);
  });

  it('handles tagged dollar quotes, nested comments and E-strings with backslash escapes', () => {
    expect(scanSql('SELECT $f$ $$; COMMIT $f$; ABORT').statements.map((s) => s.trim())).toEqual(["SELECT ''", 'ABORT']);
    expect(scanSql('/* a /* b */ COMMIT; */ SELECT 1').statements.map((s) => s.trim())).toEqual(['SELECT 1']);
    expect(scanSql("SELECT E'\\'; COMMIT; '").statements.map((s) => s.trim())).toEqual(["SELECT E''"]);
    expect(scanSql("SELECT 'it''s; COMMIT'").statements.map((s) => s.trim())).toEqual(["SELECT ''"]);
  });

  it('does not take $ inside identifiers or $1 parameters for a dollar quote', () => {
    expect(scanSql('SELECT RDB$RELATION_NAME FROM RDB$RELATIONS; COMMIT').statements.map((s) => s.trim())).toEqual([
      'SELECT RDB$RELATION_NAME FROM RDB$RELATIONS',
      'COMMIT',
    ]);
    expect(scanSql('SELECT $1; COMMIT').statements.map((s) => s.trim())).toEqual(['SELECT $1', 'COMMIT']);
  });

  it('treats an unterminated literal or comment as running to the end', () => {
    expect(scanSql("SELECT 'abc; COMMIT").statements.map((s) => s.trim())).toEqual(["SELECT ''"]);
    expect(scanSql('SELECT 1 /* ; COMMIT').statements.map((s) => s.trim())).toEqual(['SELECT 1']);
  });
});

describe('transactionControl uses the scanner', () => {
  it('finds COMMIT behind a string that contains a comment marker', () => {
    expect(transactionControl("SELECT '--'; COMMIT")).toBe(true);
    expect(transactionControl("SELECT '/*'; COMMIT; SELECT '*/'")).toBe(true);
    expect(transactionControl("SELECT $$ ' $$; COMMIT; SELECT ' x'")).toBe(true);
    expect(transactionControl("-- it's\nCOMMIT")).toBe(true);
  });

  it('still ignores transaction keywords inside literals and comments', () => {
    expect(transactionControl('SELECT $f$ $$; COMMIT $f$')).toBe(false);
    expect(transactionControl('/* a /* b */ COMMIT; */ SELECT 1')).toBe(false);
    expect(transactionControl('SELECT 1 AS "x; commit"')).toBe(false);
  });
});

describe('dialect.stripSql uses the same scanner', () => {
  it('keeps keywords after a string with a comment marker', () => {
    expect(stripSql("SELECT '--' AS x, FIRST 3")).toContain('FIRST 3');
  });
});
