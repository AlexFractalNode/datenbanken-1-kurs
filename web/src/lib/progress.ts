/**
 * Versioned learning progress (cards, quiz, tasks, exams, streak) on top of `storage.ts`.
 *
 * Layout (key convention of storage.ts, one key per area, so the generic export/import/reset of
 * the settings page keeps working):
 *   db1:progress:version  "1"
 *   db1:progress:cards    Record<cardId, FsrsCard>
 *   db1:progress:quiz     Record<quizId, {correct, seen}>
 *   db1:progress:tasks    Record<taskId, {score, max}>
 *   db1:progress:exams    Record<examId, ExamAttempt>
 *   db1:progress:streak   {last: 'YYYY-MM-DD' | '', days}
 *
 * Version 0 had no version marker and only the `cards` area; it is migrated on load.
 * Broken areas (invalid JSON or shape) are reset individually and reported via `recovered`.
 * Without usable storage everything keeps working on an in-memory copy for the current tab.
 */
import {
  PROGRESS_FORMAT,
  PROGRESS_PREFIX,
  PROGRESS_VERSION,
  exportProgress as exportStorage,
  importProgress as importStorage,
  isStorageAvailable,
  readItem,
  resetProgress as resetStorage,
  writeItem,
  type ImportResult,
} from './storage';

export const AREAS = ['cards', 'quiz', 'tasks', 'exams', 'streak'] as const;
export type Area = (typeof AREAS)[number];

export const VERSION_KEY = `${PROGRESS_PREFIX}version`;
export const PROGRESS_KEYS: Record<Area, string> = {
  cards: `${PROGRESS_PREFIX}cards`,
  quiz: `${PROGRESS_PREFIX}quiz`,
  tasks: `${PROGRESS_PREFIX}tasks`,
  exams: `${PROGRESS_PREFIX}exams`,
  streak: `${PROGRESS_PREFIX}streak`,
};

/** Serialised ts-fsrs card: dates as ISO strings, the remaining scheduler fields as stored by ts-fsrs. */
export interface FsrsCard {
  dueAt: string;
  lastReviewAt: string | null;
  stability: number;
  difficulty: number;
  state: number;
  reps: number;
  lapses: number;
  [field: string]: unknown;
}

export interface QuizStat {
  correct: number;
  seen: number;
}

export interface TaskScore {
  score: number;
  max: number;
}

export type ExamStatus = 'running' | 'grading' | 'done';

export interface ExamAttempt {
  status: ExamStatus;
  /** ISO timestamp of the start; the remaining time is always derived from it. */
  startedAt: string;
  minutes: number;
  /** Optional notes per task id. */
  answers: Record<string, string>;
  /** Indices of the ticked rubric criteria per task id. */
  checked: Record<string, number[]>;
  /** When writing ended (time up or handed in early). */
  endedAt?: string;
  score?: number;
  max?: number;
}

export interface Streak {
  /** Local calendar day of the last activity (YYYY-MM-DD) or '' if none. */
  last: string;
  days: number;
}

export interface ProgressV1 {
  version: 1;
  cards: Record<string, FsrsCard>;
  quiz: Record<string, QuizStat>;
  tasks: Record<string, TaskScore>;
  exams: Record<string, ExamAttempt>;
  streak: Streak;
}

export interface LoadResult {
  progress: ProgressV1;
  /** False if localStorage is missing or throws; progress then lives in memory for this tab only. */
  available: boolean;
  /** Areas that were broken and have been reset. */
  recovered: Area[];
  /** 0 if the stored data was migrated from version 0 during this load, otherwise null. */
  migratedFrom: 0 | null;
}

export const RECOVERED_NOTICE = 'Ein Teil des gespeicherten Fortschritts war beschädigt und wurde zurückgesetzt.';

export function emptyProgress(): ProgressV1 {
  return { version: 1, cards: {}, quiz: {}, tasks: {}, exams: {}, streak: { last: '', days: 0 } };
}

// ---------------------------------------------------------------------------
// Validation (every area is parsed defensively; invalid entries are dropped)
// ---------------------------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isIsoDate = (v: unknown): v is string => typeof v === 'string' && v !== '' && !Number.isNaN(Date.parse(v));

function validCard(v: unknown): v is FsrsCard {
  return (
    isObject(v) &&
    isIsoDate(v.dueAt) &&
    (v.lastReviewAt === null || v.lastReviewAt === undefined || isIsoDate(v.lastReviewAt)) &&
    isNum(v.stability) &&
    isNum(v.difficulty) &&
    isCount(v.state) &&
    isCount(v.reps) &&
    isCount(v.lapses)
  );
}

const validQuiz = (v: unknown): v is QuizStat => isObject(v) && isCount(v.correct) && isCount(v.seen) && v.correct <= v.seen;
const validTask = (v: unknown): v is TaskScore => isObject(v) && isCount(v.score) && isCount(v.max) && v.score <= v.max;

function validExam(v: unknown): v is ExamAttempt {
  if (!isObject(v)) return false;
  if (v.status !== 'running' && v.status !== 'grading' && v.status !== 'done') return false;
  if (!isIsoDate(v.startedAt) || !isCount(v.minutes) || v.minutes === 0) return false;
  if (!isObject(v.answers) || !Object.values(v.answers).every((a) => typeof a === 'string')) return false;
  if (!isObject(v.checked) || !Object.values(v.checked).every((c) => Array.isArray(c) && c.every((i) => Number.isInteger(i) && i >= 0))) {
    return false;
  }
  if (v.endedAt !== undefined && !isIsoDate(v.endedAt)) return false;
  if (v.score !== undefined && !isCount(v.score)) return false;
  if (v.max !== undefined && !isCount(v.max)) return false;
  return true;
}

const validStreak = (v: unknown): v is Streak =>
  isObject(v) && typeof v.last === 'string' && (v.last === '' || /^\d{4}-\d{2}-\d{2}$/.test(v.last)) && isCount(v.days);

const ENTRY_VALIDATORS: Record<Exclude<Area, 'streak'>, (v: unknown) => boolean> = {
  cards: validCard,
  quiz: validQuiz,
  tasks: validTask,
  exams: validExam,
};

/** Returns the sanitised area value and whether anything had to be dropped. */
function sanitizeArea<A extends Area>(area: A, value: unknown): { value: ProgressV1[A]; ok: boolean } {
  if (area === 'streak') {
    return validStreak(value)
      ? { value: { last: value.last, days: value.days } as ProgressV1[A], ok: true }
      : { value: emptyProgress().streak as ProgressV1[A], ok: false };
  }
  if (!isObject(value)) return { value: {} as ProgressV1[A], ok: false };
  const valid = ENTRY_VALIDATORS[area as Exclude<Area, 'streak'>];
  const out: Record<string, unknown> = {};
  let ok = true;
  for (const [id, entry] of Object.entries(value)) {
    if (valid(entry)) out[id] = entry;
    else ok = false;
  }
  return { value: out as ProgressV1[A], ok };
}

function parseArea<A extends Area>(area: A, raw: string | null): { value: ProgressV1[A]; ok: boolean } {
  if (raw === null) return { value: emptyProgress()[area], ok: true };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { value: emptyProgress()[area], ok: false };
  }
  return sanitizeArea(area, parsed);
}

/**
 * Brings any known progress object to version 1. Version 0 (no `version`, only `cards`) gets the
 * missing areas; unknown or invalid input yields an empty store.
 */
export function migrate(data: unknown): ProgressV1 {
  const result = emptyProgress();
  if (!isObject(data)) return result;
  if (data.version !== undefined && data.version !== 0 && data.version !== 1) return result;
  for (const area of AREAS) {
    if (data[area] !== undefined) (result as unknown as Record<Area, unknown>)[area] = sanitizeArea(area, data[area]).value;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Load / save
// ---------------------------------------------------------------------------

/** In-memory copy used when storage is unavailable (and as last saved state). */
let memory: ProgressV1 | null = null;

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function writeAll(p: ProgressV1): boolean {
  let ok = writeItem(VERSION_KEY, String(PROGRESS_VERSION));
  for (const area of AREAS) ok = writeItem(PROGRESS_KEYS[area], JSON.stringify(p[area])) && ok;
  return ok;
}

export function loadDetailed(): LoadResult {
  if (!isStorageAvailable()) {
    return { progress: clone(memory ?? emptyProgress()), available: false, recovered: [], migratedFrom: null };
  }
  const version = readItem(VERSION_KEY);
  const raw = Object.fromEntries(AREAS.map((a) => [a, readItem(PROGRESS_KEYS[a])])) as Record<Area, string | null>;

  if (version === null) {
    if (AREAS.every((a) => raw[a] === null)) {
      return { progress: emptyProgress(), available: true, recovered: [], migratedFrom: null };
    }
    // Version 0: no marker, only `cards`.
    const progress = emptyProgress();
    const recovered: Area[] = [];
    for (const area of AREAS) {
      const parsed = parseArea(area, raw[area]);
      (progress as unknown as Record<Area, unknown>)[area] = parsed.value;
      if (!parsed.ok) recovered.push(area);
    }
    writeAll(progress);
    return { progress, available: true, recovered, migratedFrom: 0 };
  }

  if (version !== String(PROGRESS_VERSION)) {
    // Unknown marker (corrupt or from a newer app): start over, but say so.
    const progress = emptyProgress();
    writeAll(progress);
    return { progress, available: true, recovered: [...AREAS], migratedFrom: null };
  }

  const progress = emptyProgress();
  const recovered: Area[] = [];
  for (const area of AREAS) {
    const parsed = parseArea(area, raw[area]);
    (progress as unknown as Record<Area, unknown>)[area] = parsed.value;
    if (!parsed.ok) {
      recovered.push(area);
      writeItem(PROGRESS_KEYS[area], JSON.stringify(parsed.value));
    }
  }
  return { progress, available: true, recovered, migratedFrom: null };
}

export function loadProgress(): ProgressV1 {
  return loadDetailed().progress;
}

/** Saves the whole store. Returns false if it could not be persisted (it is still kept in memory). */
export function saveProgress(p: ProgressV1): boolean {
  memory = clone(p);
  if (!isStorageAvailable()) return false;
  return writeAll(p);
}

/**
 * Read-modify-write: loads the current state, applies `change` and saves. Components always use this,
 * so several islands on one page never overwrite each other's areas.
 */
export function updateProgress(change: (p: ProgressV1) => void | ProgressV1): ProgressV1 {
  const current = loadProgress();
  const next = change(current) ?? current;
  saveProgress(next);
  return next;
}

/** Removes all progress (storage and memory); settings stay. */
export function resetAll(): number {
  memory = null;
  return resetStorage();
}

// ---------------------------------------------------------------------------
// Export / import
// ---------------------------------------------------------------------------

function toEntries(p: ProgressV1): Record<string, string> {
  const data: Record<string, string> = { [VERSION_KEY]: String(PROGRESS_VERSION) };
  for (const area of AREAS) data[PROGRESS_KEYS[area]] = JSON.stringify(p[area]);
  return data;
}

/** JSON export in the `db1-progress` v1 format of storage.ts. */
export function exportJson(now: Date = new Date()): string {
  if (!isStorageAvailable()) {
    const p = memory ?? emptyProgress();
    return JSON.stringify({ format: PROGRESS_FORMAT, version: PROGRESS_VERSION, exportedAt: now.toISOString(), data: toEntries(p) }, null, 2);
  }
  loadDetailed(); // migrate or repair before exporting
  return JSON.stringify(exportStorage(now), null, 2);
}

/** Validates the known areas, then replaces the stored progress (storage.ts rolls back on write errors). */
export function importJson(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Die Datei enthält kein JSON.' };
  }
  if (isObject(parsed) && isObject(parsed.data)) {
    const data = parsed.data;
    const version = data[VERSION_KEY];
    if (version !== undefined && version !== String(PROGRESS_VERSION)) {
      return { ok: false, error: `Nicht unterstützte Fortschritts-Version ${String(version)}.` };
    }
    for (const area of AREAS) {
      const value = data[PROGRESS_KEYS[area]];
      if (value === undefined) continue;
      if (typeof value !== 'string' || !parseArea(area, value).ok) {
        return { ok: false, error: `Bereich „${area}“ ist beschädigt.` };
      }
    }
  }
  const result = importStorage(json);
  if (result.ok) {
    memory = null;
    loadDetailed(); // migrates an imported version-0 state right away
  }
  return result;
}

// ---------------------------------------------------------------------------
// Activity streak
// ---------------------------------------------------------------------------

function localDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Counts consecutive local calendar days with learning activity. Mutates and returns `p`. */
export function recordActivity(p: ProgressV1, now: Date = new Date()): ProgressV1 {
  const today = localDay(now);
  if (p.streak.last === today) return p;
  const yesterday = localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  p.streak = { last: today, days: p.streak.last === yesterday ? p.streak.days + 1 : 1 };
  return p;
}

/** Facade with the names from the task brief (`import`/`export` are fine as property names). */
export const progress = {
  load: loadProgress,
  loadDetailed,
  save: saveProgress,
  update: updateProgress,
  reset: resetAll,
  migrate,
  export: exportJson,
  import: importJson,
};
