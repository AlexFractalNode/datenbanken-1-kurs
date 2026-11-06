// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AREAS,
  PROGRESS_KEYS,
  VERSION_KEY,
  emptyProgress,
  progress,
  recordActivity,
  type ProgressV1,
} from '../src/lib/progress';
import { PROGRESS_FORMAT, PROGRESS_PREFIX, THEME_KEY } from '../src/lib/storage';

function throwingStorage(): Storage {
  const fail = () => {
    throw new Error('SecurityError: storage disabled');
  };
  return {
    getItem: fail,
    setItem: fail,
    removeItem: fail,
    clear: fail,
    key: fail,
    get length(): number {
      throw new Error('denied');
    },
  } as unknown as Storage;
}

/** A complete FSRS-7 card as stored by ts-fsrs 6 (dates serialised). */
const sampleCard = {
  dueAt: '2026-11-06T10:00:00.000Z',
  lastReviewAt: '2026-11-05T10:00:00.000Z',
  stability: 3.9,
  stabilityFast: 3.1,
  difficulty: 3.5,
  state: 2,
  scheduleStatus: 'review',
  cardId: 't04-c001',
  reps: 1,
  lapses: 0,
  scheduledDays: 1,
  learningStep: 0,
};

/** Storage that can be read but rejects every write (full quota, shared github.io origin). */
function quotaStorage(initial: Record<string, string>): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: () => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  } as unknown as Storage;
}

/** Storage entries of `p` in the db1:progress:<area> layout. */
function entries(p: ProgressV1): Record<string, string> {
  const out: Record<string, string> = { [VERSION_KEY]: '1' };
  for (const area of AREAS) out[PROGRESS_KEYS[area]] = JSON.stringify(p[area]);
  return out;
}

function sample(): ProgressV1 {
  return {
    version: 1,
    cards: { 't04-c001': { ...sampleCard } },
    quiz: { 't04-q001': { correct: 1, seen: 2 } },
    tasks: { 't04-p001': { score: 3, max: 5 } },
    exams: {
      e01: {
        status: 'done',
        startedAt: '2026-11-05T08:00:00.000Z',
        minutes: 90,
        answers: { 'e01-p001': 'Notizen' },
        checked: { 'e01-p001': [0] },
        endedAt: '2026-11-05T09:30:00.000Z',
        score: 90,
        max: 90,
      },
    },
    streak: { last: '2026-11-05', days: 3 },
  };
}

beforeEach(() => {
  localStorage.clear();
  progress.reset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  progress.reset();
});

describe('progress store', () => {
  it('uses the db1:progress:<area> convention of storage.ts', () => {
    expect(VERSION_KEY).toBe(`${PROGRESS_PREFIX}version`);
    expect(AREAS).toEqual(['cards', 'quiz', 'tasks', 'exams', 'streak']);
    expect(PROGRESS_KEYS.cards).toBe('db1:progress:cards');
  });

  it('returns an empty v1 store when nothing is saved', () => {
    expect(progress.load()).toEqual(emptyProgress());
    expect(emptyProgress()).toEqual({ version: 1, cards: {}, quiz: {}, tasks: {}, exams: {}, streak: { last: '', days: 0 } });
  });

  it('saves and loads every area', () => {
    expect(progress.save(sample())).toBe(true);
    expect(localStorage.getItem(VERSION_KEY)).toBe('1');
    expect(JSON.parse(localStorage.getItem('db1:progress:quiz')!)).toEqual({ 't04-q001': { correct: 1, seen: 2 } });
    expect(progress.load()).toEqual(sample());
  });

  it('test_storage_unavailable_returns_empty (localStorage throws)', () => {
    vi.stubGlobal('localStorage', throwingStorage());
    const result = progress.loadDetailed();
    expect(result.available).toBe(false);
    expect(result.progress).toEqual(emptyProgress());
    expect(() => progress.save(sample())).not.toThrow();
  });

  it('keeps progress in memory for this tab when storage is unavailable', () => {
    vi.stubGlobal('localStorage', throwingStorage());
    expect(progress.save(sample())).toBe(false);
    expect(progress.load()).toEqual(sample());
    const updated = progress.update((p) => {
      p.quiz['t04-q002'] = { correct: 0, seen: 1 };
    });
    expect(updated.persisted).toBe(false);
    expect(updated.progress.quiz['t04-q002']).toEqual({ correct: 0, seen: 1 });
    expect(progress.load().quiz['t04-q002']).toEqual({ correct: 0, seen: 1 });
  });

  it('test_corrupt_json_resets_with_flag', () => {
    progress.save(sample());
    localStorage.setItem('db1:progress:quiz', '{not json');
    const result = progress.loadDetailed();
    expect(result.recovered).toEqual(['quiz']);
    expect(result.progress.quiz).toEqual({});
    // other areas are untouched
    expect(result.progress.cards).toEqual(sample().cards);
    // the broken area was reset in storage, so the flag is reported once
    expect(localStorage.getItem('db1:progress:quiz')).toBe('{}');
    expect(progress.loadDetailed().recovered).toEqual([]);
  });

  it('drops invalid entries of an area and flags it', () => {
    localStorage.setItem(VERSION_KEY, '1');
    localStorage.setItem(
      'db1:progress:tasks',
      JSON.stringify({ 't04-p001': { score: 2, max: 4 }, bad: { score: 'x', max: 4 }, worse: null }),
    );
    localStorage.setItem('db1:progress:cards', JSON.stringify({ 't04-c001': { ...sampleCard, dueAt: 'kein Datum' } }));
    const result = progress.loadDetailed();
    expect(result.progress.tasks).toEqual({ 't04-p001': { score: 2, max: 4 } });
    expect(result.progress.cards).toEqual({});
    expect(result.recovered.sort()).toEqual(['cards', 'tasks']);
  });

  it('leaves data with an unknown version marker untouched and works in memory', () => {
    for (const [key, value] of Object.entries(entries(sample()))) localStorage.setItem(key, value);
    localStorage.setItem(VERSION_KEY, '2');
    const before = { ...localStorage };
    expect(before[PROGRESS_KEYS.cards]).toBe(JSON.stringify(sample().cards));
    const result = progress.loadDetailed();
    expect(result.progress).toEqual(emptyProgress());
    expect(result.unknownVersion).toBe(true);
    expect(result.writable).toBe(false);
    expect(result.recovered).toEqual([]);
    // nothing is written: neither on load nor on later saves
    const saved = progress.update((p) => {
      p.tasks.x = { score: 1, max: 1 };
    });
    expect(saved.persisted).toBe(false);
    expect({ ...localStorage }).toEqual(before);
    expect(progress.load().tasks.x).toEqual({ score: 1, max: 1 });
    expect(progress.loadDetailed().unknownVersion).toBe(true);
  });

  it('reads stored progress when the quota is full and reports it as not writable', () => {
    vi.stubGlobal('localStorage', quotaStorage(entries(sample())));
    const result = progress.loadDetailed();
    expect(result.progress).toEqual(sample());
    expect(result.writable).toBe(false);
    expect(result.available).toBe(false);
  });

  it('keeps working in memory on the data read when writes fail', () => {
    vi.stubGlobal('localStorage', quotaStorage(entries(sample())));
    const result = progress.update((p) => {
      p.tasks['t04-p002'] = { score: 1, max: 2 };
    });
    expect(result.persisted).toBe(false);
    const loaded = progress.load();
    expect(loaded.tasks).toEqual({ ...sample().tasks, 't04-p002': { score: 1, max: 2 } });
    expect(loaded.cards).toEqual(sample().cards);
  });

  it('update() reports a successful save', () => {
    const result = progress.update((p) => {
      p.tasks.a = { score: 1, max: 2 };
    });
    expect(result).toEqual({ progress: expect.objectContaining({ tasks: { a: { score: 1, max: 2 } } }), persisted: true });
  });

  it('drops cards that lack FSRS-7 fields ts-fsrs needs', () => {
    localStorage.setItem(VERSION_KEY, '1');
    const { stabilityFast: _s, ...noFast } = sampleCard;
    const { scheduleStatus: _st, ...noStatus } = sampleCard;
    const { cardId: _c, ...noId } = sampleCard;
    const { scheduledDays: _d, ...noDays } = sampleCard;
    localStorage.setItem(
      'db1:progress:cards',
      JSON.stringify({
        ok: sampleCard,
        noFast,
        noStatus,
        noId,
        noDays,
        badState: { ...sampleCard, state: 7 },
        badStatus: { ...sampleCard, scheduleStatus: 'bogus' },
        badStep: { ...sampleCard, learningStep: 1.5 },
        badReps: { ...sampleCard, reps: 1.5 },
      }),
    );
    const result = progress.loadDetailed();
    expect(Object.keys(result.progress.cards)).toEqual(['ok']);
    expect(result.recovered).toEqual(['cards']);
  });

  it('accepts a card without the optional learningStep', () => {
    const { learningStep: _l, ...card } = sampleCard;
    localStorage.setItem(VERSION_KEY, '1');
    localStorage.setItem('db1:progress:cards', JSON.stringify({ a: card }));
    expect(progress.loadDetailed().recovered).toEqual([]);
  });

  it('deduplicates ticked rubric indices of an exam attempt', () => {
    const p = sample();
    p.exams.e01.checked = { 'e01-p001': [1, 0, 1, 0] };
    localStorage.setItem(VERSION_KEY, '1');
    localStorage.setItem('db1:progress:exams', JSON.stringify(p.exams));
    expect(progress.load().exams.e01.checked['e01-p001']).toEqual([0, 1]);
  });

  it('filters prototype keys such as __proto__ out of an area', () => {
    localStorage.setItem(VERSION_KEY, '1');
    localStorage.setItem('db1:progress:tasks', '{"__proto__":{"score":1,"max":1},"constructor":{"score":1,"max":1},"a":{"score":1,"max":2}}');
    const result = progress.loadDetailed();
    expect(Object.getPrototypeOf(result.progress.tasks)).toBe(Object.prototype);
    expect(Object.keys(result.progress.tasks)).toEqual(['a']);
    expect(Object.hasOwn(result.progress.tasks, '__proto__')).toBe(false);
    expect(result.recovered).toEqual(['tasks']);
    expect(progress.migrate(JSON.parse('{"tasks":{"__proto__":{"score":1,"max":1}}}')).tasks).toEqual({});
  });

  it('exports a repaired, re-importable state even if the repair cannot be written', () => {
    const broken = { ...entries(sample()), 'db1:progress:quiz': '{kaputt' };
    vi.stubGlobal('localStorage', quotaStorage(broken));
    const json = progress.export();
    vi.unstubAllGlobals();
    progress.reset();
    expect(progress.import(json)).toEqual({ ok: true, count: AREAS.length });
    expect(progress.load()).toEqual({ ...sample(), quiz: {} });
  });

  it('test_version_migration_from_v0 (only cards, no version marker)', () => {
    localStorage.setItem('db1:progress:cards', JSON.stringify({ 't04-c001': sampleCard }));
    const result = progress.loadDetailed();
    expect(result.migratedFrom).toBe(0);
    expect(result.recovered).toEqual([]);
    expect(result.progress).toEqual({ ...emptyProgress(), cards: { 't04-c001': sampleCard } });
    // migration is persisted
    expect(localStorage.getItem(VERSION_KEY)).toBe('1');
    expect(localStorage.getItem('db1:progress:streak')).not.toBeNull();
    expect(progress.loadDetailed().migratedFrom).toBeNull();
  });

  it('migrates a v0 export object ({cards} without version)', () => {
    expect(progress.migrate({ cards: { 't04-c001': sampleCard } })).toEqual({ ...emptyProgress(), cards: { 't04-c001': sampleCard } });
    expect(progress.migrate({ version: 0, cards: { 't04-c001': sampleCard } }).cards).toEqual({ 't04-c001': sampleCard });
    expect(progress.migrate(sample())).toEqual(sample());
    expect(progress.migrate(null)).toEqual(emptyProgress());
  });

  it('update() reads fresh state, so two components never overwrite each other', () => {
    progress.update((p) => {
      p.tasks.a = { score: 1, max: 2 };
    });
    progress.update((p) => {
      p.tasks.b = { score: 2, max: 2 };
    });
    expect(Object.keys(progress.load().tasks).sort()).toEqual(['a', 'b']);
  });

  it('test_export_import_roundtrip', () => {
    progress.save(sample());
    localStorage.setItem(THEME_KEY, 'dark');
    const json = progress.export();
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe(PROGRESS_FORMAT);
    expect(parsed.version).toBe(1);
    expect(Object.keys(parsed.data)).toContain('db1:progress:cards');
    expect(Object.keys(parsed.data)).not.toContain(THEME_KEY);

    progress.reset();
    expect(progress.load()).toEqual(emptyProgress());
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');

    // the version marker is not counted as an entry
    expect(progress.import(json)).toEqual({ ok: true, count: AREAS.length });
    expect(progress.load()).toEqual(sample());
  });

  it('rejects an import with a broken area and keeps the current progress', () => {
    progress.save(sample());
    const bad = JSON.stringify({
      format: PROGRESS_FORMAT,
      version: 1,
      exportedAt: '2026-11-05T00:00:00.000Z',
      data: { 'db1:progress:version': '1', 'db1:progress:quiz': '{kaputt' },
    });
    const result = progress.import(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/quiz/);
    expect(progress.load()).toEqual(sample());
  });

  it('rejects malformed import files', () => {
    expect(progress.import('nope').ok).toBe(false);
    expect(progress.import(JSON.stringify({ format: 'other', version: 1, data: {} })).ok).toBe(false);
  });

  it('exports the in-memory state when storage is unavailable', () => {
    vi.stubGlobal('localStorage', throwingStorage());
    progress.save(sample());
    const parsed = JSON.parse(progress.export());
    expect(JSON.parse(parsed.data['db1:progress:tasks'])).toEqual(sample().tasks);
  });
});

describe('streak', () => {
  it('starts, continues on the next day and restarts after a gap', () => {
    const p = emptyProgress();
    recordActivity(p, new Date(2026, 10, 5, 9));
    expect(p.streak).toEqual({ last: '2026-11-05', days: 1 });
    recordActivity(p, new Date(2026, 10, 5, 22));
    expect(p.streak).toEqual({ last: '2026-11-05', days: 1 });
    recordActivity(p, new Date(2026, 10, 6, 7));
    expect(p.streak).toEqual({ last: '2026-11-06', days: 2 });
    recordActivity(p, new Date(2026, 10, 9, 7));
    expect(p.streak).toEqual({ last: '2026-11-09', days: 1 });
  });

  it('handles month boundaries', () => {
    const p = emptyProgress();
    p.streak = { last: '2026-10-31', days: 4 };
    recordActivity(p, new Date(2026, 10, 1, 12));
    expect(p.streak).toEqual({ last: '2026-11-01', days: 5 });
  });
});
