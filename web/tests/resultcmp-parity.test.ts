import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { equal, normalizeRows, type ExpectedResult } from '../src/lib/sqlcheck';

/**
 * Runs the very same cases through tools/resultcmp.py (Python) and src/lib/sqlcheck.ts (JavaScript).
 * The snapshots in src/data/sql-expected/ come from the Python side, the playground compares in the
 * browser, so any drift between the two would turn correct answers into "wrong".
 * Skipped if no Python interpreter is on the PATH (CI always has one).
 */
const TOOLS = resolve(process.cwd(), '..', 'tools');
const python = ['python3', 'python'].find((p) => spawnSync(p, ['--version']).status === 0);

type Row = (null | boolean | number | string)[];

// Single-column normalisation cases (value JSON as the runners deliver it).
const VALUES: unknown[] = [
  null, true, false, 0, 1, -1, 7, 2.5, 3.0, 2.5, 0.1 + 0.2, 2 / 3, 39.68, 39.6875, 1.0000001, 1e-9, 2e-9, -0.0,
  1.000000000005, 1.000000000015, 1.0000000000051, 123456789012.5, 123456789013.5, 9.999999999995, 99999999999.95,
  -0.30000000000000004, 1e21, 1.5e-7, 123456789.123456789, 0.000123456789012345, 4503599627370496.5,
  Number.MAX_SAFE_INTEGER, 100, 1e5, 1.2345678901234568e16, '', 'abc', 'abc  ', ' lead', 'ä ö', '2024-03-01', '16:30:00.5',
  '01ff', '9007199254740993',
  // Integral floats from 1e21 on: the runner's JSON writes them with an exponent, so Python reads a float and
  // rounds it to 12 significant digits like any other float (G5).
  1.2345678901234567e21, -9.876543210987654e25, 1e21 + 2 ** 20, 1.7976931348623157e308, 1e300,
  // NaN and ±Infinity: JSON (the runner, the snapshots) has no such numbers and writes null (G5).
  NaN, Infinity, -Infinity,
];

const PAIRS: [Row[], Row[], boolean][] = [
  [[[1], [2], [2]], [[2], [1], [2]], false],
  [[[1], [2], [2]], [[1], [1], [2]], false],
  [[[1], [2]], [[2], [1]], true],
  [[[true], [1]], [[1], [true]], false],
  [[[true], [1]], [[1], [1]], false],
  [[[null], [0]], [[0], [null]], false],
  [[[2.5, 'a  ']], [[2.50, 'a']], true],
  [[[1.0000001]], [[1]], true],
  [[[NaN], [Infinity]], [[null], [null]], true],
  [[[1.2345678901234567e21]], [[1.23456789012e21]], true],
];

describe.skipIf(!python || !existsSync(TOOLS))('sqlcheck.ts matches tools/resultcmp.py', () => {
  function py(payload: unknown): { norm: unknown[][][]; eq: boolean[] } {
    const code = [
      'import json, sys',
      `sys.path.insert(0, ${JSON.stringify(TOOLS)})`,
      'import resultcmp',
      'p = json.loads(sys.stdin.read())',
      'out = {"norm": [], "eq": []}',
      'for trim in (False, True):',
      '    out["norm"].append([list(r) for r in resultcmp.normalize([[v] for v in p["values"]], ["c"], trim=trim)])',
      'for a, b, ordered in p["pairs"]:',
      '    w = len(a[0])',
      '    ra = {"cols": ["c"] * w, "rows": a}',
      '    rb = {"cols": ["c"] * w, "rows": b}',
      '    out["eq"].append([resultcmp.equal(ra, rb, ordered, trim=t) for t in (False, True)])',
      'print(json.dumps(out))',
    ].join('\n');
    const run = spawnSync(python!, ['-I', '-X', 'utf8', '-c', code], { input: JSON.stringify(payload), encoding: 'utf8' });
    if (run.status !== 0) throw new Error(run.stderr);
    return JSON.parse(run.stdout);
  }

  const result = (() => {
    if (!python) return null;
    // Python's json.dumps writes 1e21 as 1e+21 and -0.0 as -0.0; both parse in JS and Python.
    return py({ values: VALUES, pairs: PAIRS });
  })();

  it('normalises every value identically (trim off and on)', () => {
    expect(result).not.toBeNull();
    [false, true].forEach((trim, t) => {
      const fromPy = result!.norm[t] as unknown as unknown[][];
      const fromJs = normalizeRows(
        VALUES.map((v) => [v]),
        1,
        trim,
      );
      VALUES.forEach((v, i) => {
        // JSON round trip of the Python side: ints and floats both become JS numbers
        expect([String(v), fromJs[i]]).toEqual([String(v), fromPy[i]]);
      });
    });
  });

  it('decides equal/unequal identically', () => {
    PAIRS.forEach(([a, b, ordered], i) => {
      const cols = a[0].map((_, c) => `c${c}`);
      const js = [false, true].map((trim) =>
        equal({ cols, rows: a }, { cols, rows: b, ordered } satisfies ExpectedResult, { trim }).ok,
      );
      expect([i, js]).toEqual([i, result!.eq[i]]);
    });
  });
});
