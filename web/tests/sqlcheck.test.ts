import { describe, expect, it } from 'vitest';
import { equal, normalizeRows, normalizeValue, type SqlResult } from '../src/lib/sqlcheck';

/**
 * Mirrors tests/test_resultcmp.py (the seven cases of task A9 plus the later hardening). Values are the
 * ones the PGlite runner delivers: NUMERIC/DOUBLE as JS numbers, dates as text, CHAR already trimmed.
 */
const res = (cols: string[], rows: unknown[][]): SqlResult => ({ cols, rows: rows as SqlResult['rows'] });
const same = (a: SqlResult, b: SqlResult, ordered: boolean, trim = false) => equal(a, { ...b, ordered }, { trim }).ok;

describe('sqlcheck.equal (same rules as tools/resultcmp.py)', () => {
  it('1 char padding is trimmed when asked to (untyped sources)', () => {
    expect(normalizeRows([['abc   ']], 1, true)).toEqual([['abc']]);
    expect(same(res(['c'], [['abc   ']]), res(['c'], [['abc']]), true, true)).toBe(true);
    // without trim (typed sources, the default) VARCHAR blanks are significant
    expect(same(res(['v'], [['ab ']]), res(['v'], [['ab']]), true)).toBe(false);
    expect(normalizeRows([['ab  ']], 1)).toEqual([['ab  ']]);
  });

  it('2 numbers are compared by value, not by scale; real differences stay visible', () => {
    expect(same(res(['x'], [[2.5]]), res(['x'], [[2.5]]), true)).toBe(true);
    expect(same(res(['x'], [[3.0]]), res(['x'], [[3]]), true)).toBe(true);
    expect(same(res(['x'], [[0.1 + 0.2]]), res(['x'], [[0.3]]), true)).toBe(true);
    expect(same(res(['x'], [[2.51]]), res(['x'], [[2.5]]), true)).toBe(false);
    // no fixed decimal rounding
    expect(same(res(['x'], [[39.68]]), res(['x'], [[39.6875]]), true)).toBe(false);
    expect(same(res(['x'], [[1.0000001]]), res(['x'], [[1]]), true)).toBe(false);
    expect(same(res(['x'], [[1e-9]]), res(['x'], [[2e-9]]), true)).toBe(false);
    expect(normalizeRows([[0.1 + 0.2]], 1)).toEqual([[0.3]]);
    expect(normalizeRows([[2 / 3]], 1)).toEqual([[0.666666666667]]);
  });

  it('3 NULL equals NULL and nothing else', () => {
    expect(normalizeRows([[null, 1]], 2)).toEqual([[null, 1]]);
    expect(same(res(['a'], [[null]]), res(['a'], [[null]]), true)).toBe(true);
    expect(same(res(['a'], [[null]]), res(['a'], [['']]), true)).toBe(false);
    expect(same(res(['a'], [[null]]), res(['a'], [[0]]), true)).toBe(false);
  });

  it('4 dates and times are ISO text and stay unchanged', () => {
    const row = ['2024-03-01', '2024-03-01 16:30:00', '2024-03-01 16:30:00.5', '09:05:00'];
    expect(normalizeRows([row], 4)).toEqual([row]);
    expect(same(res(['a', 'b', 'c', 'd'], [row]), res(['a', 'b', 'c', 'd'], [row]), true)).toBe(true);
    // Date objects (not delivered by the runner, but robust): UTC ISO text, fractions without trailing zeros
    expect(normalizeValue(new Date(Date.UTC(2024, 2, 1, 16, 30, 0, 500)))).toBe('2024-03-01 16:30:00.5');
  });

  it('5 unordered results are compared as multiset, duplicates count', () => {
    const a = res(['x'], [[1], [2], [2]]);
    expect(same(a, res(['x'], [[2], [1], [2]]), false)).toBe(true);
    expect(same(a, res(['x'], [[1], [1], [2]]), false)).toBe(false);
    expect(same(a, res(['x'], [[1], [2]]), false)).toBe(false);
  });

  it('6 ordered results depend on the row order', () => {
    const a = res(['x'], [[1], [2]]);
    expect(same(a, res(['x'], [[1], [2]]), true)).toBe(true);
    expect(same(a, res(['x'], [[2], [1]]), true)).toBe(false);
  });

  it('7 the column count must match, names are ignored', () => {
    expect(same(res(['a', 'b'], [[1, 2]]), res(['a'], [[1]]), false)).toBe(false);
    expect(same(res(['a', 'b'], []), res(['a'], []), true)).toBe(false);
    expect(same(res(['NAME'], [['x']]), res(['name'], [['x']]), true)).toBe(true);
  });

  it('booleans are not numbers (also inside multisets)', () => {
    expect(same(res(['a'], [[true]]), res(['a'], [[1]]), true)).toBe(false);
    expect(same(res(['a'], [[false]]), res(['a'], [[0]]), false)).toBe(false);
    expect(same(res(['a'], [[true], [1]]), res(['a'], [[1], [1]]), false)).toBe(false);
    expect(same(res(['a'], [[true], [1]]), res(['a'], [[1], [true]]), false)).toBe(true);
  });

  it('rounds to 12 significant digits with half-even on the shortest decimal form', () => {
    expect(normalizeValue(1.000000000005)).toBe(1); // tie: the even digit stays
    expect(normalizeValue(1.000000000015)).toBe(1.00000000002); // tie: round up to even
    expect(normalizeValue(1.0000000000051)).toBe(1.00000000001);
    expect(normalizeValue(123456789012.5)).toBe(123456789012);
    expect(normalizeValue(123456789013.5)).toBe(123456789014);
    expect(normalizeValue(9.999999999995)).toBe(10); // tie, odd digit: carry into a new digit
    expect(normalizeValue(-0.30000000000000004)).toBe(-0.3);
    expect(normalizeValue(1e21)).toBe(1e21);
    expect(normalizeValue(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    expect(normalizeValue(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
  });

  it('normalises other runtime types like resultcmp (bytes -> hex, bigint, objects)', () => {
    expect(normalizeValue(new Uint8Array([1, 255]))).toBe('01ff');
    expect(normalizeValue(5n)).toBe(5);
    expect(normalizeValue(2n ** 60n)).toBe('1152921504606846976');
    expect(normalizeValue({ a: 1 })).toBe('[object Object]');
  });

  it('is idempotent', () => {
    const rows = [[2.5, 'a  ', '2024-01-02', true, null, 7, 0.1 + 0.2]];
    const once = normalizeRows(rows, 7, true);
    expect(normalizeRows(once, 7, true)).toEqual(once);
  });

  it('reports a reason in German for each kind of difference', () => {
    const exp = (rows: unknown[][], ordered = true) => ({ ...res(['x'], rows), ordered });
    expect(equal(res(['a', 'b'], [[1, 2]]), exp([[1]]))).toEqual({
      ok: false,
      reason: 'Spaltenanzahl: erwartet 1, erhalten 2.',
    });
    expect(equal(res(['x'], [[1]]), exp([[1], [2]])).reason).toBe('Zeilenanzahl: erwartet 2, erhalten 1.');
    expect(equal(res(['x'], [[1], [3]]), exp([[1], [2]])).reason).toBe('Zeile 2 weicht ab (Reihenfolge oder Werte).');
    expect(equal(res(['x'], [[1], [3]]), exp([[1], [2]], false)).reason).toBe(
      'Die Zeilen stimmen nicht überein: 1 erwartete Zeile fehlt, 1 Zeile ist zu viel.',
    );
    expect(equal(res(['x'], [[1]]), exp([[1]]))).toEqual({ ok: true });
  });
});
