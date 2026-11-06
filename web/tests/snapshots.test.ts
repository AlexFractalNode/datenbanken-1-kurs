import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSnapshot } from '../src/lib/snapshots';

/** Where `tools/sqltest.py --write-snapshots` has to write (CI step "Generate SQL snapshots"). */
const DIR = resolve('src/data/sql-expected');
const generated = existsSync(DIR) ? readdirSync(DIR).filter((f) => /^t\d{2}\.json$/.test(f)) : [];

describe('sql-expected snapshots', () => {
  it('gives null for tasks without a snapshot or with a malformed id', async () => {
    expect(await loadSnapshot('t99-s001')).toBeNull();
    expect(await loadSnapshot('nonsense')).toBeNull();
  });

  // Runs locally after `uv run tools/sqltest.py --engines pg --write-snapshots web/src/data/sql-expected`
  // and in CI after the same step; without generated files there is nothing to check.
  it.skipIf(generated.length === 0)('has the shape the playground expects ({cols, rows, ordered} per task id)', async () => {
    for (const file of generated) {
      const topic = file.replace('.json', '');
      const data = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as Record<string, { cols: unknown; rows: unknown; ordered: unknown }>;
      for (const [id, snap] of Object.entries(data)) {
        expect(id.startsWith(`${topic}-s`)).toBe(true);
        expect(Array.isArray(snap.cols) && snap.cols.every((c) => typeof c === 'string')).toBe(true);
        expect(Array.isArray(snap.rows) && snap.rows.every((r) => Array.isArray(r) && r.length === (snap.cols as unknown[]).length)).toBe(true);
        expect(typeof snap.ordered).toBe('boolean');
      }
      const first = Object.keys(data)[0];
      if (first) expect(await loadSnapshot(first)).toMatchObject({ cols: data[first].cols, rows: data[first].rows });
    }
  });
});
