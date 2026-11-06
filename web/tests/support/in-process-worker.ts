import type { WorkerLike } from '../../src/lib/pg-engine';
import { createHost } from '../../src/lib/pg-host';

/**
 * The playground host without a Web Worker (Node and happy-dom have none): same messages, same PGlite,
 * but in-process, so there is no protection against endless statements. Only for tests; the browser
 * bundle always uses `pg.worker.ts`.
 */
export function inProcessWorker(): WorkerLike {
  let dead = false;
  const worker: WorkerLike = {
    onmessage: null,
    onerror: null,
    postMessage: (msg) => {
      if (!dead) host(msg);
    },
    terminate: () => {
      dead = true;
    },
  };
  const host = createHost((msg) => {
    if (!dead) queueMicrotask(() => worker.onmessage?.({ data: msg }));
  });
  return worker;
}
