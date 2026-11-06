/**
 * Message side of the playground database: owns one `pg-core` database and answers requests one at a
 * time. It runs inside the Web Worker (`pg.worker.ts`); environments without workers (unit tests, SSR)
 * run it in-process, see `pg-engine.ts`. Requests and replies are plain, structured-cloneable data.
 */
import { errorText, openCore, type CheckJob, type Database, type DbSource } from './pg-core';

export type HostRequest =
  | { id: number; op: 'open'; source: DbSource }
  | { id: number; op: 'run'; sql: string }
  | { id: number; op: 'check'; job: CheckJob }
  | { id: number; op: 'close' };

export type HostResponse = { id: number; ok: true; value: unknown } | { id: number; ok: false; error: string };

/** Returns the request handler; `post` sends a reply back to the page. */
export function createHost(post: (msg: HostResponse) => void): (msg: HostRequest) => void {
  let db: Promise<Database> | null = null;

  async function answer(msg: HostRequest): Promise<unknown> {
    if (msg.op === 'open') {
      const opened = openCore(msg.source);
      db = opened;
      await opened;
      return null;
    }
    if (!db) throw new Error('Die Datenbank ist noch nicht geöffnet.');
    const database = await db;
    if (msg.op === 'run') return database.run(msg.sql);
    if (msg.op === 'check') return database.check(msg.job);
    await database.close();
    db = null;
    return null;
  }

  return (msg) => {
    answer(msg).then(
      (value) => post({ id: msg.id, ok: true, value }),
      (err) => post({ id: msg.id, ok: false, error: errorText(err) }),
    );
  };
}
