/**
 * The local calendar day, the one unit of time of the learning features: the streak, the daily limit
 * of new cards and the due cards of the dashboard all change at local midnight.
 */

/** Local calendar day as YYYY-MM-DD. */
export function localDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The local day before `d` (calendar arithmetic, so it also works across DST changes). */
export function previousLocalDay(d: Date): string {
  return localDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
}

/** Milliseconds from `now` to the next local midnight. */
export function msUntilLocalMidnight(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
}

/** Calls `callback` at every local midnight (re-armed each time, so DST shifts do not add up). Returns a stop function. */
export function onLocalMidnight(callback: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  const arm = () => {
    // a few ms after midnight, so `new Date()` in the callback is safely on the new day
    timer = setTimeout(() => {
      if (stopped) return;
      callback();
      arm();
    }, msUntilLocalMidnight(new Date()) + 50);
  };
  arm();
  return () => {
    stopped = true;
    if (timer !== undefined) clearTimeout(timer);
  };
}
