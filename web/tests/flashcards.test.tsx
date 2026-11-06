// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Flashcards, { type FlashcardItem } from '../src/components/Flashcards';
import { progress } from '../src/lib/progress';
import { NEW_CARDS_KEY, NEW_TODAY_KEY, readIntroducedToday, recordIntroduced } from '../src/lib/settings';
import { formatInterval, isDue } from '../src/lib/srs';

const CARDS: FlashcardItem[] = [
  { id: 't04-c001', topic: 't04', front: '<p>Was ist ein Entitätstyp?</p>', back: '<p>Eine Menge gleichartiger Objekte.</p>' },
  { id: 't04-c002', topic: 't04', front: '<p>Was ist eine Raute?</p>', back: '<p>Ein Beziehungstyp.</p>' },
  { id: 't06-c001', topic: 't06', front: '<p>Was ist 1NF?</p>', back: '<p>Atomare Werte.</p>' },
];
const TOPICS = [
  { id: 't04', title: 'ER-Modellierung' },
  { id: 't06', title: 'Normalisierung' },
];

/** Complete FSRS-7 card fields as stored by ts-fsrs 6. */
const FULL_CARD = {
  stability: 3,
  stabilityFast: 3,
  difficulty: 3,
  state: 2,
  scheduleStatus: 'review',
  reps: 1,
  lapses: 0,
  scheduledDays: 3,
  learningStep: 0,
};

/** Readable storage that rejects every write (full quota). */
function quotaStorage(initial: Record<string, string> = {}): Storage {
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

function unit(container: Element): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-verify-unit="flashcards"]');
  if (!el) throw new Error('flashcards unit not found');
  return el;
}

async function ready(container: Element): Promise<HTMLElement> {
  const el = unit(container);
  await waitFor(() => expect(el.dataset.verifyState).not.toBe('loading'));
  return el;
}

beforeEach(() => {
  localStorage.clear();
  progress.reset();
  window.history.replaceState(null, '', '/datenbanken-1-kurs/karten/');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  progress.reset();
});

describe('Flashcards', () => {
  it('goes from loading to ready and counts the due cards', async () => {
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    expect(unit(container).dataset.verifyState).toBe('loading');
    const el = await ready(container);
    expect(el.dataset.verifyState).toBe('ready');
    expect(el.dataset.verifyCount).toBe('3');
    expect(screen.getByText('Was ist ein Entitätstyp?')).toBeTruthy();
    // the answer stays hidden until requested
    expect(screen.queryByText('Eine Menge gleichartiger Objekte.')).toBeNull();
  });

  it('rating "Gut" moves the due date into the future and removes the card from the queue', async () => {
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    expect(screen.getByText('Eine Menge gleichartiger Objekte.')).toBeTruthy();
    const before = Date.now();
    fireEvent.click(screen.getByRole('button', { name: /^Gut/ }));
    await waitFor(() => expect(el.dataset.verifyCount).toBe('2'));
    const stored = progress.load().cards['t04-c001'];
    expect(stored).toBeDefined();
    expect(Date.parse(stored.dueAt)).toBeGreaterThan(before);
    expect(stored.reps).toBe(1);
    expect(isDue(stored, new Date())).toBe(false);
    expect(screen.getByText('Was ist eine Raute?')).toBeTruthy();
    expect(progress.load().streak.days).toBe(1);
  });

  it('"Nochmal" keeps the card in this session (moved to the end)', async () => {
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: /^Nochmal/ }));
    await waitFor(() => expect(screen.getByText('Was ist eine Raute?')).toBeTruthy());
    expect(el.dataset.verifyCount).toBe('3');
  });

  it('shows interval previews on the rating buttons', async () => {
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    await ready(container);
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    const group = screen.getByRole('group', { name: 'Wie gut wusstest du es?' });
    expect(group.querySelectorAll('button')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /^Nochmal/ }).textContent).toMatch(/Min\./);
  });

  it('filters by topic from ?thema= and via the select', async () => {
    window.history.replaceState(null, '', '/datenbanken-1-kurs/karten/?thema=t06');
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyCount).toBe('1');
    expect(el.dataset.topic).toBe('t06');
    expect(screen.getByText('Was ist 1NF?')).toBeTruthy();
    const select = screen.getByRole('combobox', { name: 'Thema' }) as HTMLSelectElement;
    expect(select.value).toBe('t06');
    fireEvent.change(select, { target: { value: 't04' } });
    await waitFor(() => expect(el.dataset.verifyCount).toBe('2'));
    expect(window.location.search).toBe('?thema=t04');
    fireEvent.change(select, { target: { value: '' } });
    await waitFor(() => expect(el.dataset.verifyCount).toBe('3'));
    expect(window.location.search).toBe('');
  });

  it('ignores an unknown ?thema= value', async () => {
    window.history.replaceState(null, '', '/datenbanken-1-kurs/karten/?thema=t99');
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyCount).toBe('3');
    expect(el.dataset.topic).toBe('');
  });

  it('is empty when no card is due and names the next due date', async () => {
    const future = new Date(Date.now() + 3 * 86_400_000).toISOString();
    progress.update((p) => {
      for (const c of CARDS) {
        p.cards[c.id] = { ...FULL_CARD, cardId: c.id, dueAt: future, lastReviewAt: new Date().toISOString() };
      }
    });
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyState).toBe('empty');
    expect(el.dataset.verifyCount).toBe('0');
    expect(screen.getByRole('heading', { name: 'Keine Karten fällig' })).toBeTruthy();
    expect(container.textContent).toMatch(/Nächste Karte fällig/);
  });

  it('is empty without any cards', async () => {
    const { container } = render(<Flashcards cards={[]} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyState).toBe('empty');
    expect(el.dataset.verifyCount).toBe('0');
  });

  it('works without storage and says so', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyState).toBe('ready');
    expect(container.textContent).toMatch(/nur in diesem Tab/);
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: /^Gut/ }));
    await waitFor(() => expect(el.dataset.verifyCount).toBe('2'));
  });

  it('warns instead of confirming when the rating cannot be saved (full quota)', async () => {
    const future = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const stored = { 't06-c001': { ...FULL_CARD, cardId: 't06-c001', dueAt: future, lastReviewAt: new Date().toISOString() } };
    vi.stubGlobal('localStorage', quotaStorage({ 'db1:progress:version': '1', 'db1:progress:cards': JSON.stringify(stored) }));
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    // the stored (readable) progress is used: t06-c001 is not due
    expect(el.dataset.verifyCount).toBe('2');
    expect(container.textContent).toMatch(/nur in diesem Tab/);
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: /^Gut/ }));
    await waitFor(() => expect(el.dataset.verifyCount).toBe('1'));
    expect(screen.getByRole('status').textContent).not.toMatch(/Gespeichert/);
    expect(screen.getByRole('status').textContent).toMatch(/nicht gespeichert/);
  });

  it('shows a save warning if storage stops accepting writes after loading', async () => {
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(container.textContent).not.toMatch(/nur in diesem Tab/);
    const full = quotaStorage({ ...localStorage });
    vi.stubGlobal('localStorage', full);
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: /^Gut/ }));
    await waitFor(() => expect(el.dataset.verifyCount).toBe('2'));
    expect(screen.getByRole('alert').textContent).toMatch(/Speichern fehlgeschlagen/);
    expect(screen.getByRole('status').textContent).not.toMatch(/Gespeichert/);
  });

  it('labels the answer area as a group', async () => {
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    await ready(container);
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    const back = container.querySelector('.flashcard__back')!;
    expect(back.getAttribute('role')).toBe('group');
    expect(screen.getByRole('group', { name: 'Antwort' })).toBe(back);
  });

  it('moves the focus to the empty-state heading after the last due card', async () => {
    window.history.replaceState(null, '', '/datenbanken-1-kurs/karten/?thema=t06');
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: /^Gut/ }));
    await waitFor(() => expect(el.dataset.verifyState).toBe('empty'));
    const heading = screen.getByRole('heading', { name: 'Keine Karten fällig' });
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(heading);
  });

  it('reports error when the scheduler cannot be loaded', async () => {
    const { container } = render(
      <Flashcards cards={CARDS} topics={TOPICS} loadScheduler={() => Promise.reject(new Error('chunk failed'))} />,
    );
    const el = unit(container);
    await waitFor(() => expect(el.dataset.verifyState).toBe('error'));
    expect(el.dataset.verifyError).toMatch(/Kartentrainer/);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});

describe('srs helpers', () => {
  it('treats unknown cards as due', () => {
    expect(isDue(undefined, new Date())).toBe(true);
  });

  it('formats intervals in German', () => {
    expect(formatInterval(60_000)).toBe('1 Min.');
    expect(formatInterval(5.5 * 60_000)).toBe('6 Min.');
    expect(formatInterval(3 * 3_600_000)).toBe('3 Std.');
    expect(formatInterval(86_400_000)).toBe('1 Tag');
    expect(formatInterval(4.8 * 86_400_000)).toBe('5 Tage');
    expect(formatInterval(60 * 86_400_000)).toBe('2 Mon.');
    expect(formatInterval(400 * 86_400_000)).toBe('1,1 J.');
  });
});

describe('Flashcards: daily limit for new cards', () => {
  it('offers at most the configured number of new cards', async () => {
    localStorage.setItem(NEW_CARDS_KEY, '2');
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyCount).toBe('2');
    expect(screen.getByText('2 fällig')).toBeTruthy();
  });

  it('a limit of 0 stops new cards and says why', async () => {
    localStorage.setItem(NEW_CARDS_KEY, '0');
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyState).toBe('empty');
    expect(screen.getByRole('heading', { name: 'Keine Karten fällig' })).toBeTruthy();
    expect(container.textContent).toContain('Tageslimit');
  });

  it('counts a rated new card against the limit of today, also after a reload', async () => {
    localStorage.setItem(NEW_CARDS_KEY, '2');
    const first = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    await ready(first.container);
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: /^Gut/ }));
    expect(readIntroducedToday()).toEqual(['t04-c001']);
    first.unmount();
    const second = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(second.container);
    // c001 is scheduled for later, one new card is still allowed today (limit 2, 1 used)
    expect(el.dataset.verifyCount).toBe('1');
  });

  it('does not limit reviews of known cards', async () => {
    localStorage.setItem(NEW_CARDS_KEY, '0');
    const past = new Date(Date.now() - 86_400_000).toISOString();
    progress.update((p) => {
      for (const id of ['t04-c001', 't04-c002', 't06-c001']) {
        p.cards[id] = { ...FULL_CARD, dueAt: past, lastReviewAt: past, cardId: id };
      }
    });
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    expect((await ready(container)).dataset.verifyCount).toBe('3');
  });

  it('keeps a card rated "Nochmal" in the round although it used the limit', async () => {
    localStorage.setItem(NEW_CARDS_KEY, '1');
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyCount).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: /^Nochmal/ }));
    expect(el.dataset.verifyState).toBe('ready');
    expect(el.dataset.verifyCount).toBe('1');
    expect(readIntroducedToday()).toEqual(['t04-c001']);
  });

  it('without writable storage the daily count lives in memory, so switching the topic keeps the limit (G3)', async () => {
    vi.stubGlobal('localStorage', quotaStorage({ [NEW_CARDS_KEY]: '1' }));
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyCount).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: /^Gut/ }));
    expect(el.dataset.verifyState).toBe('empty');
    fireEvent.change(screen.getByLabelText('Thema'), { target: { value: 't06' } });
    expect(el.dataset.verifyState).toBe('empty');
    expect(container.textContent).toContain('Tageslimit');
  });

  it('re-evaluates the queue at local midnight: the limit of the new day applies (G4)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(new Date(2026, 10, 6, 23, 59, 50));
    localStorage.setItem(NEW_CARDS_KEY, '1');
    recordIntroduced('t99-c001');
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyState).toBe('empty');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(el.dataset.verifyState).toBe('ready');
    expect(el.dataset.verifyCount).toBe('1');
  });

  it('re-evaluates the queue when the tab becomes visible again (another tab reviewed the cards, G4)', async () => {
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyCount).toBe('3');
    const later = new Date(Date.now() + 5 * 86_400_000).toISOString();
    progress.update((p) => {
      for (const id of ['t04-c001', 't04-c002']) p.cards[id] = { ...FULL_CARD, dueAt: later, lastReviewAt: new Date().toISOString(), cardId: id };
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(el.dataset.verifyCount).toBe('1');
    expect(screen.getByText('Was ist 1NF?')).toBeTruthy();
  });

  it('keeps the current card and a card rated "Nochmal" when the queue is re-evaluated', async () => {
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    const el = await ready(container);
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: /^Nochmal/ }));
    // now: t04-c002 first, t04-c001 again at the end; the answer of c002 is open
    fireEvent.click(screen.getByRole('button', { name: 'Antwort zeigen' }));
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(el.dataset.verifyCount).toBe('3');
    expect(screen.getByText('Was ist eine Raute?')).toBeTruthy();
    expect(screen.getByText('Ein Beziehungstyp.')).toBeTruthy();
  });

  it('ignores a corrupt daily record', async () => {
    localStorage.setItem(NEW_TODAY_KEY, 'not json');
    const { container } = render(<Flashcards cards={CARDS} topics={TOPICS} />);
    expect((await ready(container)).dataset.verifyCount).toBe('3');
  });
});
