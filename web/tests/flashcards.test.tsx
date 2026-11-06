// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Flashcards, { type FlashcardItem } from '../src/components/Flashcards';
import { progress } from '../src/lib/progress';
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
        p.cards[c.id] = { dueAt: future, lastReviewAt: new Date().toISOString(), stability: 3, difficulty: 3, state: 2, reps: 1, lapses: 0 };
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
