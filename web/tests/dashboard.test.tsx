// @vitest-environment happy-dom
import { cleanup, render, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '../src/components/Dashboard';
import { computeDashboard, currentStreak, type DashboardTopic } from '../src/lib/dashboard';
import { emptyProgress, progress, recordActivity, type FsrsCard, type ProgressV1 } from '../src/lib/progress';
import { NEW_CARDS_KEY, recordIntroduced } from '../src/lib/settings';

const NOW = new Date(2026, 10, 6, 12, 0, 0);

const topics: DashboardTopic[] = [
  {
    id: 't04',
    title: 'ER-Modellierung',
    cardIds: ['t04-c001', 't04-c002', 't04-c003', 't04-c004'],
    quizIds: ['t04-q001', 't04-q002'],
    tasks: [
      { id: 't04-p001', points: 6 },
      { id: 't04-p002', points: 4 },
    ],
  },
  { id: 't05', title: 'Relationales Modell', cardIds: ['t05-c001', 't05-c002'], quizIds: [], tasks: [] },
];

function card(state: number, dueOffsetDays: number): FsrsCard {
  return {
    dueAt: new Date(NOW.getTime() + dueOffsetDays * 86_400_000).toISOString(),
    lastReviewAt: NOW.toISOString(),
    stability: 3,
    stabilityFast: 3,
    difficulty: 5,
    state,
    scheduleStatus: state === 2 ? 'review' : 'learning',
    cardId: 'x',
    reps: 2,
    lapses: 0,
    scheduledDays: 1,
  };
}

function withProgress(change: (p: ProgressV1) => void): ProgressV1 {
  const p = emptyProgress();
  change(p);
  return p;
}

describe('computeDashboard', () => {
  it('shows learned cards, quiz rate and task points per topic', () => {
    const p = withProgress((p) => {
      p.cards['t04-c001'] = card(2, 5); // learned
      p.cards['t04-c002'] = card(2, 9); // learned
      p.cards['t04-c003'] = card(1, 1); // seen, still learning
      p.quiz['t04-q001'] = { correct: 3, seen: 4 };
      p.quiz['t04-q002'] = { correct: 1, seen: 4 };
      p.tasks['t04-p001'] = { score: 4, max: 6 };
      p.tasks['t99-p001'] = { score: 9, max: 9 }; // belongs to no listed topic
    });
    const d = computeDashboard(topics, p, NOW, { limit: 20, introducedToday: 0 });
    const t04 = d.topics[0];
    expect(t04.cards).toEqual({ total: 4, seen: 3, learned: 2, percent: 50 });
    expect(t04.quiz).toEqual({ seen: 8, correct: 4, percent: 50 });
    expect(t04.tasks).toEqual({ score: 4, max: 6, total: 10, percent: 67 });
    const t05 = d.topics[1];
    expect(t05.cards).toEqual({ total: 2, seen: 0, learned: 0, percent: 0 });
    expect(t05.quiz.percent).toBeNull();
    expect(t05.tasks.percent).toBeNull();
    expect(t05.tasks.total).toBe(0);
  });

  it('computes coverage as the share of seen cards in all cards', () => {
    const p = withProgress((p) => {
      p.cards['t04-c001'] = card(2, 5);
      p.cards['t05-c001'] = card(1, 0);
    });
    expect(computeDashboard(topics, p, NOW, { limit: 20, introducedToday: 0 }).coverage).toBe(33);
    expect(computeDashboard(topics, emptyProgress(), NOW, { limit: 20, introducedToday: 0 }).coverage).toBe(0);
    expect(computeDashboard([], emptyProgress(), NOW, { limit: 20, introducedToday: 0 }).coverage).toBe(0);
  });

  it('counts due reviews and caps new cards at the daily limit', () => {
    const p = withProgress((p) => {
      p.cards['t04-c001'] = card(2, -1); // due
      p.cards['t04-c002'] = card(2, 0); // due exactly now
      p.cards['t04-c003'] = card(2, 3); // not due
    });
    // 6 cards in total, 3 stored, 3 new (t04-c004, t05-c001, t05-c002)
    const unlimited = computeDashboard(topics, p, NOW, { limit: 20, introducedToday: 0 });
    expect(unlimited.due).toEqual({ reviews: 2, fresh: 3, total: 5 });
    const limited = computeDashboard(topics, p, NOW, { limit: 2, introducedToday: 0 });
    expect(limited.due).toEqual({ reviews: 2, fresh: 2, total: 4 });
    const used = computeDashboard(topics, p, NOW, { limit: 2, introducedToday: 2 });
    expect(used.due).toEqual({ reviews: 2, fresh: 0, total: 2 });
    expect(computeDashboard(topics, p, NOW, { limit: 0, introducedToday: 0 }).due.fresh).toBe(0);
  });

  it('reports per-topic due counts without exceeding the overall new-card allowance', () => {
    const d = computeDashboard(topics, emptyProgress(), NOW, { limit: 5, introducedToday: 0 });
    expect(d.due.fresh).toBe(5);
    expect(d.topics[0].due + d.topics[1].due).toBe(5);
    expect(d.topics[0].due).toBe(4);
    expect(d.topics[1].due).toBe(1);
  });

  it('knows whether there is any progress', () => {
    expect(computeDashboard(topics, emptyProgress(), NOW, { limit: 20, introducedToday: 0 }).hasProgress).toBe(false);
    const p = withProgress((p) => {
      p.quiz['t04-q001'] = { correct: 1, seen: 1 };
    });
    expect(computeDashboard(topics, p, NOW, { limit: 20, introducedToday: 0 }).hasProgress).toBe(true);
  });
});

describe('streak', () => {
  it('counts consecutive days and resets after a gap', () => {
    const p = emptyProgress();
    recordActivity(p, new Date(2026, 10, 3, 9));
    recordActivity(p, new Date(2026, 10, 4, 23));
    recordActivity(p, new Date(2026, 10, 5, 7));
    expect(p.streak.days).toBe(3);
    recordActivity(p, new Date(2026, 10, 5, 20)); // same day: unchanged
    expect(p.streak.days).toBe(3);
    recordActivity(p, new Date(2026, 10, 7, 8)); // a day was skipped
    expect(p.streak.days).toBe(1);
  });

  it('is shown while it is alive today or yesterday and 0 once it is broken', () => {
    expect(currentStreak({ last: '2026-11-06', days: 4 }, NOW)).toBe(4);
    expect(currentStreak({ last: '2026-11-05', days: 4 }, NOW)).toBe(4);
    expect(currentStreak({ last: '2026-11-04', days: 4 }, NOW)).toBe(0);
    expect(currentStreak({ last: '', days: 0 }, NOW)).toBe(0);
  });

  it('works across a month and year boundary', () => {
    const p = emptyProgress();
    recordActivity(p, new Date(2026, 11, 31, 22));
    recordActivity(p, new Date(2027, 0, 1, 8));
    expect(p.streak.days).toBe(2);
    expect(currentStreak(p.streak, new Date(2027, 0, 2, 8))).toBe(2);
  });
});

function unit(container: Element, name: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(`[data-verify-unit="${name}"]`);
  if (!el) throw new Error(`unit ${name} not found`);
  return el;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  progress.reset(); // drops the in-memory copy of earlier tests
});
afterEach(() => cleanup());

describe('Dashboard island', () => {
  it('starts as loading and is empty without progress', async () => {
    const { container, getByText } = render(<Dashboard topics={topics} />);
    await waitFor(() => expect(unit(container, 'dashboard-progress').dataset.verifyState).toBe('empty'));
    expect(unit(container, 'dashboard-progress').dataset.verifyCount).toBe('0');
    expect(getByText(/Noch kein Lernfortschritt/)).toBeTruthy();
    // a fresh learner still sees what is waiting: new cards up to the default limit
    expect(container.textContent).toContain('6 Karten');
  });

  it('shows progress per topic, due cards, coverage and streak', async () => {
    progress.update((p) => {
      p.cards['t04-c001'] = card(2, -1);
      p.cards['t04-c002'] = card(2, 4);
      p.quiz['t04-q001'] = { correct: 1, seen: 2 };
      p.tasks['t04-p001'] = { score: 3, max: 6 };
      recordActivity(p, new Date());
    });
    const { container } = render(<Dashboard topics={topics} />);
    await waitFor(() => expect(unit(container, 'dashboard-progress').dataset.verifyState).toBe('ready'));
    expect(unit(container, 'dashboard-progress').dataset.verifyCount).toBe('2');
    const row = container.querySelector('[data-topic="t04"]')!;
    expect(row.textContent).toContain('2 von 4');
    expect(row.textContent).toContain('50 %');
    expect(row.textContent).toContain('3 von 6');
    expect(container.querySelector('[data-stat="streak"]')!.textContent).toContain('1');
    expect(container.querySelector('[data-stat="coverage"]')!.textContent).toContain('33 %');
    // 1 review + 4 new cards (6 total - 2 seen)
    expect(container.querySelector('[data-stat="due"]')!.textContent).toContain('5');
  });

  it('honours the daily new-card limit and the cards introduced today', async () => {
    localStorage.setItem(NEW_CARDS_KEY, '3');
    recordIntroduced('t04-c001');
    progress.update((p) => {
      p.cards['t04-c001'] = card(1, 1);
    });
    const { container } = render(<Dashboard topics={topics} />);
    await waitFor(() => expect(unit(container, 'dashboard-progress').dataset.verifyState).toBe('ready'));
    // limit 3, 1 introduced today: 2 more new cards, nothing else due
    expect(container.querySelector('[data-stat="due"]')!.textContent).toContain('2');
    expect(container.textContent).toContain('Tageslimit');
  });

  it('works without storage and says so', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { container } = render(<Dashboard topics={topics} />);
    await waitFor(() => expect(unit(container, 'dashboard-progress').dataset.verifyState).toBe('empty'));
    expect(container.textContent).toContain('Speicher nicht verfügbar');
  });

  it('is empty with no topics at all', async () => {
    const { container } = render(<Dashboard topics={[]} />);
    await waitFor(() => expect(unit(container, 'dashboard-progress').dataset.verifyState).toBe('empty'));
  });
});
