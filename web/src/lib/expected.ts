/**
 * Expected result of an SQL task for the auto-check. The generated snapshot wins; without one the
 * value is derived by running the reference solution (PostgreSQL variant if any) on the check
 * database, i.e. on the same seed state as the user's statement.
 *
 * Only definite answers are cached: a snapshot, a derived table, or a reference run that ran fine but
 * returned no table. A failed attempt (snapshot chunk not loaded, reference aborted by the timeout or
 * failing) is not kept, so the next check tries again instead of staying without a comparison value.
 */
import type { CheckJob, CheckRun } from './pg-core';
import type { ExpectedResult } from './sqlcheck';

export interface ExpectedTask {
  id: string;
  kind: CheckJob['kind'];
  solution: string;
  solutionPg?: string;
  check?: string;
  ordered: boolean;
}

export interface Checker {
  check(job: CheckJob): Promise<CheckRun>;
}

export function createExpectedCache(loadSnapshot: (taskId: string) => Promise<ExpectedResult | null>) {
  const cache = new Map<string, ExpectedResult | null>();

  async function derive(t: ExpectedTask, checker: Checker): Promise<{ value: ExpectedResult | null; definite: boolean }> {
    let snapshot: ExpectedResult | null;
    try {
      snapshot = await loadSnapshot(t.id);
    } catch {
      return { value: null, definite: false };
    }
    if (snapshot) return { value: snapshot, definite: true };
    const ref = await checker.check({ sql: t.solutionPg ?? t.solution, kind: t.kind, check: t.check });
    const res = t.kind === 'query' ? ref.user : ref.after;
    if (ref.user.error || res?.error) return { value: null, definite: false };
    if (res && res.cols.length > 0) return { value: { cols: res.cols, rows: res.rows, ordered: t.ordered }, definite: true };
    return { value: null, definite: true };
  }

  return {
    async get(t: ExpectedTask, checker: Checker): Promise<ExpectedResult | null> {
      if (cache.has(t.id)) return cache.get(t.id) ?? null;
      const { value, definite } = await derive(t, checker);
      if (definite) cache.set(t.id, value);
      return value;
    },
  };
}
