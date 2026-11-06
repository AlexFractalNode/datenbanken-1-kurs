/**
 * Expected results of the SQL tasks: snapshots written by `tools/sqltest.py --write-snapshots
 * web/src/data/sql-expected`, one `<topic>.json` per topic with `{ "<task id>": { cols, rows, ordered } }`.
 *
 * Each topic file is its own lazy chunk, so the playground only downloads the topics that are used.
 * Without a snapshot (the file is not generated yet, or the task is new) the playground derives the
 * expected result by running the reference solution, see Playground.tsx.
 */
import type { ExpectedResult } from './sqlcheck';

type TopicSnapshot = Record<string, ExpectedResult>;

const files = import.meta.glob<TopicSnapshot>('../data/sql-expected/*.json', { import: 'default' });

/** Snapshot of one task, or null if there is none. */
export async function loadSnapshot(taskId: string): Promise<ExpectedResult | null> {
  const topic = /^(t\d{2})-/.exec(taskId)?.[1];
  if (!topic) return null;
  const key = Object.keys(files).find((k) => k.endsWith(`/${topic}.json`));
  if (!key) return null;
  try {
    const all = await files[key]();
    const entry = all[taskId];
    return entry && Array.isArray(entry.cols) && Array.isArray(entry.rows) ? { ...entry, ordered: entry.ordered === true } : null;
  } catch {
    return null;
  }
}
