/**
 * UI settings that are not learning progress (`db1:settings:*`): they are neither exported nor
 * imported with the progress. Every access is guarded. Like `progress.ts`, a value that could not be
 * written is kept in memory and wins over storage until a later write succeeds; without storage the
 * app therefore still honours a changed limit and counts today's new cards, as long as the page is open.
 *
 * - `newCardsPerDay`: how many unseen cards the trainer and the dashboard offer per day.
 * - `newToday`: the cards that were new at their first review today (`{day, ids}`), so the daily
 *   limit survives a reload. It is removed when the progress is reset.
 */
import { readItem, removeItem, writeItem } from './storage';

export const NEW_CARDS_KEY = 'db1:settings:newCardsPerDay';
export const NEW_TODAY_KEY = 'db1:settings:newToday';
export const DEFAULT_NEW_CARDS_PER_DAY = 20;
export const MAX_NEW_CARDS_PER_DAY = 500;

/** Strict parse of user input: a whole number from 0 to MAX_NEW_CARDS_PER_DAY, otherwise null. */
export function parseNewCardLimit(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d{1,4}$/.test(text)) return null;
  const n = Number(text);
  return n <= MAX_NEW_CARDS_PER_DAY ? n : null;
}

/** Values whose write failed (null: storage holds the current value). */
let limitInMemory: number | null = null;
let todayInMemory: { day: string; ids: string[] } | null = null;

/** Forgets the in-memory copies (tests; a fresh page starts without them anyway). */
export function clearSettingsMemory(): void {
  limitInMemory = null;
  todayInMemory = null;
}

export function readNewCardLimit(): number {
  if (limitInMemory !== null) return limitInMemory;
  const raw = readItem(NEW_CARDS_KEY);
  return (raw === null ? null : parseNewCardLimit(raw)) ?? DEFAULT_NEW_CARDS_PER_DAY;
}

/** `ok: false` for an invalid value (nothing changes) or a failed write (the value then lives in memory). */
export function writeNewCardLimit(value: number): { ok: boolean; value: number } {
  if (!Number.isInteger(value) || value < 0 || value > MAX_NEW_CARDS_PER_DAY) return { ok: false, value: readNewCardLimit() };
  const ok = writeItem(NEW_CARDS_KEY, String(value));
  limitInMemory = ok ? null : value;
  return { ok, value };
}

/** Local calendar day as YYYY-MM-DD (same convention as the streak). */
export function localDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readToday(now: Date): string[] {
  if (todayInMemory !== null) return todayInMemory.day === localDay(now) ? [...todayInMemory.ids] : [];
  const raw = readItem(NEW_TODAY_KEY);
  if (raw === null) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null) return [];
    const { day, ids } = v as { day?: unknown; ids?: unknown };
    if (day !== localDay(now) || !Array.isArray(ids)) return [];
    return ids.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function readIntroducedToday(now: Date = new Date()): string[] {
  return readToday(now);
}

/** Remembers that `id` was new today. Returns false if it could not be stored (it is then kept in memory). */
export function recordIntroduced(id: string, now: Date = new Date()): boolean {
  const ids = readToday(now);
  if (!ids.includes(id)) ids.push(id);
  const record = { day: localDay(now), ids };
  const ok = writeItem(NEW_TODAY_KEY, JSON.stringify(record));
  todayInMemory = ok ? null : record;
  return ok;
}

export function clearIntroducedToday(): void {
  todayInMemory = null;
  removeItem(NEW_TODAY_KEY);
}

/** How many more new cards may be offered today. */
export function newCardAllowance(limit: number, introducedToday: number): number {
  return Math.max(0, limit - introducedToday);
}
