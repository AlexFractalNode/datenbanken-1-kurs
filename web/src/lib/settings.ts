/**
 * UI settings that are not learning progress (`db1:settings:*`): they are neither exported nor
 * imported with the progress. Every access is guarded; without storage the defaults apply.
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

export function readNewCardLimit(): number {
  const raw = readItem(NEW_CARDS_KEY);
  return (raw === null ? null : parseNewCardLimit(raw)) ?? DEFAULT_NEW_CARDS_PER_DAY;
}

export function writeNewCardLimit(value: number): { ok: boolean; value: number } {
  if (!Number.isInteger(value) || value < 0 || value > MAX_NEW_CARDS_PER_DAY) return { ok: false, value: readNewCardLimit() };
  return { ok: writeItem(NEW_CARDS_KEY, String(value)), value };
}

/** Local calendar day as YYYY-MM-DD (same convention as the streak). */
export function localDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readToday(now: Date): string[] {
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

/** Remembers that `id` was new today. Returns false if it could not be stored. */
export function recordIntroduced(id: string, now: Date = new Date()): boolean {
  const ids = readToday(now);
  if (!ids.includes(id)) ids.push(id);
  return writeItem(NEW_TODAY_KEY, JSON.stringify({ day: localDay(now), ids }));
}

export function clearIntroducedToday(): void {
  removeItem(NEW_TODAY_KEY);
}

/** How many more new cards may be offered today. */
export function newCardAllowance(limit: number, introducedToday: number): number {
  return Math.max(0, limit - introducedToday);
}
