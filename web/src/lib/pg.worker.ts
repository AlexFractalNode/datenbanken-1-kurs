/**
 * Web Worker of the SQL playground: PGlite runs here, away from the page. A statement that never ends
 * (e.g. a recursive CTE without a stop condition) blocks only this worker; the page keeps responding and
 * `pg-engine.ts` terminates the worker after the timeout and builds a new one.
 */
import { createHost, type HostRequest, type HostResponse } from './pg-host';

// Typed by hand: the project's TypeScript lib is DOM, not WebWorker.
const scope = self as unknown as {
  postMessage(msg: HostResponse): void;
  onmessage: ((event: { data: HostRequest }) => void) | null;
};

const host = createHost((msg) => scope.postMessage(msg));
scope.onmessage = (event) => host(event.data);
