/**
 * Engine-neutral comparison of SQL result sets for the playground auto-check.
 *
 * This is the JavaScript twin of `tools/resultcmp.py` (rules in db/DIALECT-NOTES.md, "Was der
 * Ergebnisvergleich angleicht"); the snapshots in `src/data/sql-expected/` were produced with the Python
 * side, so both must agree exactly (tests/resultcmp-parity.test.ts runs both on the same cases):
 *
 * - NULL stays null, booleans stay booleans and never equal numbers (`true` !== 1).
 * - Integers stay exact. Every other number is rounded to 12 significant digits, half-even, on its
 *   shortest decimal form (Python: `Decimal(repr(x))`; JS `String(x)` yields the same digits). An integral
 *   result is an integer: 2.50 = 2.5, 3.00 = 3, 0.1 + 0.2 = 0.3. No fixed number of decimals.
 * - Strings stay unchanged, because the runner already trimmed CHAR columns. `trim: true` is the
 *   fallback for untyped sources and strips trailing blanks (only U+0020, like `rstrip(" ")`) everywhere.
 * - Column names are ignored, only the column count counts.
 * - `ordered: true` compares row by row, otherwise as multiset (duplicates count).
 */

export type Cell = null | boolean | number | string;

export interface SqlResult {
  cols: string[];
  rows: Cell[][];
}

export interface ExpectedResult extends SqlResult {
  ordered: boolean;
}

export interface CheckOutcome {
  ok: boolean;
  reason?: string;
}

export const SIGNIFICANT_DIGITS = 12;

const NUMBER_FORM = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/;

/** Rounds to SIGNIFICANT_DIGITS significant digits, half-even, on the shortest decimal form. */
export function roundSignificant(x: number): number {
  if (x === 0) return 0; // also -0, like Python's int(Decimal)
  if (!Number.isFinite(x) || Number.isInteger(x)) return x; // integers stay exact
  const m = NUMBER_FORM.exec(String(x));
  if (!m) return x;
  const [, sign, intPart, fracPart = '', exp = '0'] = m;
  // value = 0.<digits> * 10^pointPos
  const all = intPart + fracPart;
  const lead = all.length - all.replace(/^0+/, '').length;
  const digits = all.slice(lead).replace(/0+$/, '');
  if (digits === '') return 0;
  let pointPos = intPart.length - lead + Number(exp);
  if (digits.length <= SIGNIFICANT_DIGITS) return x;
  let kept = digits.slice(0, SIGNIFICANT_DIGITS);
  const next = digits.charCodeAt(SIGNIFICANT_DIGITS) - 48;
  // digits has no trailing zeros, so anything after `next` means "more than a tie" when next === 5
  const tie = next === 5 && digits.length === SIGNIFICANT_DIGITS + 1;
  const up = next > 5 || (next === 5 && (!tie || (kept.charCodeAt(SIGNIFICANT_DIGITS - 1) - 48) % 2 === 1));
  if (up) {
    const inc = (BigInt(kept) + 1n).toString();
    if (inc.length > SIGNIFICANT_DIGITS) {
      pointPos += 1;
      kept = inc.slice(0, SIGNIFICANT_DIGITS);
    } else {
      kept = inc;
    }
  }
  return Number(`${sign}0.${kept}e${pointPos}`);
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function normalizeValue(value: unknown, trim = false): Cell {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return roundSignificant(value);
  if (typeof value === 'bigint') {
    const safe = BigInt(Number.MAX_SAFE_INTEGER);
    return value <= safe && value >= -safe ? Number(value) : value.toString();
  }
  if (typeof value === 'string') return trim ? value.replace(/ +$/, '') : value;
  if (value instanceof Date) {
    const frac = value.getUTCMilliseconds() === 0 ? '' : `.${pad(value.getUTCMilliseconds(), 3).replace(/0+$/, '')}`;
    return (
      `${pad(value.getUTCFullYear(), 4)}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} ` +
      `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}${frac}`
    );
  }
  if (value instanceof Uint8Array) return Array.from(value, (b) => b.toString(16).padStart(2, '0')).join('');
  return String(value);
}

/** Normalises every cell; throws if a row does not have `width` values. */
export function normalizeRows(rows: unknown[][], width: number, trim = false): Cell[][] {
  return rows.map((row, i) => {
    if (row.length !== width) throw new Error(`row ${i} has ${row.length} values, expected ${width}`);
    return row.map((v) => normalizeValue(v, trim));
  });
}

/** Multiset/equality key; unlike JSON.stringify it keeps NaN, Infinity and the type of every value apart. */
function rowKey(row: Cell[]): string {
  return JSON.stringify(
    row.map((v) => (v === null ? 'z' : typeof v === 'boolean' ? `b${v}` : typeof v === 'number' ? `n${v}` : `s${v}`)),
  );
}

export function equal(user: SqlResult, expected: ExpectedResult, options: { trim?: boolean } = {}): CheckOutcome {
  const trim = options.trim ?? false;
  if (user.cols.length !== expected.cols.length) {
    return { ok: false, reason: `Spaltenanzahl: erwartet ${expected.cols.length}, erhalten ${user.cols.length}.` };
  }
  let a: Cell[][];
  let b: Cell[][];
  try {
    a = normalizeRows(user.rows, user.cols.length, trim);
    b = normalizeRows(expected.rows, expected.cols.length, trim);
  } catch {
    return { ok: false, reason: 'Das Ergebnis ist nicht vergleichbar (uneinheitliche Zeilen).' };
  }
  if (a.length !== b.length) {
    return { ok: false, reason: `Zeilenanzahl: erwartet ${b.length}, erhalten ${a.length}.` };
  }
  const ka = a.map(rowKey);
  const kb = b.map(rowKey);
  if (expected.ordered) {
    const at = ka.findIndex((k, i) => k !== kb[i]);
    return at === -1 ? { ok: true } : { ok: false, reason: `Zeile ${at + 1} weicht ab (Reihenfolge oder Werte).` };
  }
  const counts = new Map<string, number>();
  for (const k of kb) counts.set(k, (counts.get(k) ?? 0) + 1);
  let extra = 0;
  for (const k of ka) {
    const n = counts.get(k) ?? 0;
    if (n === 0) extra += 1;
    else counts.set(k, n - 1);
  }
  if (extra === 0) return { ok: true };
  const word = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return {
    ok: false,
    reason:
      `Die Zeilen stimmen nicht überein: ${word(extra, 'erwartete Zeile fehlt', 'erwartete Zeilen fehlen')}, ` +
      `${word(extra, 'Zeile ist zu viel', 'Zeilen sind zu viel')}.`,
  };
}
