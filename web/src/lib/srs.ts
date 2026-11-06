/**
 * Spaced repetition with ts-fsrs (FSRS scheduler) on top of the serialised cards in `progress.ts`.
 * The scheduler is created asynchronously by ts-fsrs, so it is loaded once and cached.
 */
import { DefaultScheduler, Rating, type Grade as FsrsGrade } from 'ts-fsrs';
import type { FsrsCard } from './progress';

export type Grade = 'again' | 'hard' | 'good' | 'easy';
export const GRADES: Grade[] = ['again', 'hard', 'good', 'easy'];
export const GRADE_LABEL: Record<Grade, string> = { again: 'Nochmal', hard: 'Schwer', good: 'Gut', easy: 'Einfach' };

const RATING: Record<Grade, FsrsGrade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export interface Srs {
  /** Applies a rating; an unknown card starts as a new card. Returns the card to store. */
  review(id: string, stored: FsrsCard | undefined, grade: Grade, now: Date): FsrsCard;
  /** Due date for each possible rating (for the interval hints on the buttons). */
  preview(id: string, stored: FsrsCard | undefined, now: Date): Record<Grade, Date>;
}

/** The part of the ts-fsrs scheduler API used here (keeps the heavily generic library types local). */
type SchedulerCard = Record<string, unknown> & { dueAt: Date; lastReviewAt: Date | null };
export interface SchedulerLike {
  newCard(options: { now: Date; cardId: string }): SchedulerCard;
  review(options: { card: SchedulerCard; grade: FsrsGrade; now: Date }): { card: SchedulerCard };
  preview(options: { card: SchedulerCard; now: Date }): Iterable<{ grade: number; card: SchedulerCard }>;
}

function toSchedulerCard(scheduler: SchedulerLike, id: string, stored: FsrsCard | undefined, now: Date): SchedulerCard {
  if (!stored) return scheduler.newCard({ now, cardId: id });
  return {
    ...stored,
    dueAt: new Date(stored.dueAt),
    lastReviewAt: stored.lastReviewAt ? new Date(stored.lastReviewAt) : null,
  };
}

function toStored(card: SchedulerCard): FsrsCard {
  const { dueAt, lastReviewAt, ...rest } = card;
  return {
    ...rest,
    dueAt: dueAt.toISOString(),
    lastReviewAt: lastReviewAt ? lastReviewAt.toISOString() : null,
  } as FsrsCard;
}

export function createSrs(scheduler: SchedulerLike): Srs {
  return {
    review(id, stored, grade, now) {
      const card = toSchedulerCard(scheduler, id, stored, now);
      return toStored(scheduler.review({ card, grade: RATING[grade], now }).card);
    },
    preview(id, stored, now) {
      const card = toSchedulerCard(scheduler, id, stored, now);
      const out = {} as Record<Grade, Date>;
      for (const item of scheduler.preview({ card, now })) {
        const grade = GRADES.find((g) => RATING[g] === item.grade);
        if (grade) out[grade] = item.card.dueAt;
      }
      return out;
    },
  };
}

let cached: Promise<Srs> | null = null;

/** Loads the FSRS-7 default scheduler of ts-fsrs once. A failed load is not cached, so a retry can succeed. */
export function loadSrs(): Promise<Srs> {
  if (!cached) {
    cached = DefaultScheduler({ version: 'FSRS-7' }).then((s) => createSrs(s as unknown as SchedulerLike));
    cached.catch(() => {
      cached = null;
    });
  }
  return cached;
}

/** Cards without stored state are new and therefore due. */
export function isDue(stored: FsrsCard | undefined, now: Date): boolean {
  return !stored || Date.parse(stored.dueAt) <= now.getTime();
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Short German interval label, e.g. "10 Min.", "3 Std.", "5 Tage", "2 Mon.", "1,1 J.". */
export function formatInterval(ms: number): string {
  const value = Math.max(0, ms);
  if (value < HOUR) return `${Math.max(1, Math.round(value / MIN))} Min.`;
  if (value < DAY) return `${Math.round(value / HOUR)} Std.`;
  if (value < 30 * DAY) {
    const days = Math.round(value / DAY);
    return days === 1 ? '1 Tag' : `${days} Tage`;
  }
  if (value < 365 * DAY) return `${Math.round(value / (30 * DAY))} Mon.`;
  return `${(value / (365 * DAY)).toFixed(1).replace('.', ',')} J.`;
}
