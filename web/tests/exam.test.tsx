// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { renderToString } from 'preact-render-to-string';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ExamRunner, { formatClock, type ExamData } from '../src/components/ExamRunner';
import { progress } from '../src/lib/progress';

const MIN = 60_000;
const START = new Date('2026-11-06T10:00:00.000Z');

const EXAM: ExamData = {
  id: 'e01',
  title: 'Probeklausur 1',
  minutes: 90,
  tasks: [
    {
      id: 'e01-p001',
      topic: 't04',
      typeLabel: 'ER-Modell erstellen',
      difficultyLabel: 'mittel',
      points: 5,
      minutes: 40,
      prompt: '<p>Modelliere eine Bibliothek.</p>',
      solution: '<p>Buch, Leser, leiht.</p>',
      rubric: [
        { criterion: 'Entitätstypen vollständig', points: 2 },
        { criterion: 'Beziehung mit Kardinalität', points: 3 },
      ],
    },
    {
      id: 'e01-p002',
      topic: 't06',
      typeLabel: 'Normalisieren',
      difficultyLabel: 'anspruchsvoll',
      points: 4,
      minutes: 50,
      prompt: '<p>Bringe die Relation in 3NF.</p>',
      solution: '<p>Zerlegung in drei Relationen.</p>',
      rubric: [{ criterion: 'Zerlegung verlustfrei', points: 4 }],
    },
  ],
};

/** Grade-scale vocabulary that must never appear (spec §13: percent only, no grading key). */
const GRADE_WORDS = /\bNoten?\b|Notenschlüssel|bestanden|durchgefallen|sehr gut|befriedigend|ausreichend|mangelhaft|ungenügend/i;

function unit(container: Element): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-verify-unit="exam-runner"]');
  if (!el) throw new Error('exam-runner unit not found');
  return el;
}

const timer = () => screen.getByRole('timer').textContent;
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

function start() {
  fireEvent.click(screen.getByRole('button', { name: 'Klausur starten' }));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  vi.setSystemTime(START);
  localStorage.clear();
  progress.reset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  progress.reset();
});

describe('ExamRunner', () => {
  it('fulfils the verify contract: loading (server HTML) → ready, count = tasks', () => {
    expect(renderToString(<ExamRunner exam={EXAM} />)).toContain('data-verify-state="loading"');
    const { container } = render(<ExamRunner exam={EXAM} />);
    const el = unit(container);
    expect(el.dataset.verifyState).toBe('ready');
    expect(el.dataset.verifyCount).toBe('2');
    expect(el.dataset.examPhase).toBe('intro');
    expect(container.textContent).toMatch(/90 Minuten/);
    // tasks stay hidden until the start
    expect(screen.queryByText('Modelliere eine Bibliothek.')).toBeNull();
  });

  it('is empty for an exam without tasks', () => {
    const { container } = render(<ExamRunner exam={{ ...EXAM, tasks: [] }} />);
    expect(unit(container).dataset.verifyState).toBe('empty');
    expect(unit(container).dataset.verifyCount).toBe('0');
    expect(screen.queryByRole('button', { name: 'Klausur starten' })).toBeNull();
  });

  it('start stores startedAt and shows the full time', () => {
    const { container } = render(<ExamRunner exam={EXAM} />);
    start();
    const attempt = progress.load().exams.e01;
    expect(attempt.startedAt).toBe(START.toISOString());
    expect(attempt.status).toBe('running');
    expect(attempt.minutes).toBe(90);
    expect(unit(container).dataset.examPhase).toBe('running');
    expect(timer()).toBe('90:00');
    expect(screen.getByText('Modelliere eine Bibliothek.')).toBeTruthy();
  });

  it('remaining time after a simulated reload = 90 min − (now − startedAt)', () => {
    const first = render(<ExamRunner exam={EXAM} />);
    start();
    advance(25 * MIN);
    expect(timer()).toBe('65:00');
    first.unmount();

    // page closed for five minutes, then reloaded
    vi.setSystemTime(new Date(START.getTime() + 30 * MIN + 15_000));
    const { container } = render(<ExamRunner exam={EXAM} />);
    expect(unit(container).dataset.examPhase).toBe('running');
    expect(timer()).toBe('59:45');
    expect(formatClock(90 * MIN - (Date.now() - START.getTime()))).toBe('59:45');
  });

  it('stores notes while writing', () => {
    render(<ExamRunner exam={EXAM} />);
    start();
    fireEvent.input(screen.getByRole('textbox', { name: /Notizen zu Aufgabe e01-p001/ }), { target: { value: 'Buch, Leser' } });
    expect(progress.load().exams.e01.answers['e01-p001']).toBe('Buch, Leser');
  });

  it('expiry locks the inputs and switches to self-assessment', () => {
    const { container } = render(<ExamRunner exam={EXAM} />);
    start();
    const notes = screen.getByRole('textbox', { name: /Notizen zu Aufgabe e01-p001/ }) as HTMLTextAreaElement;
    expect(notes.disabled).toBe(false);
    advance(90 * MIN);
    expect(unit(container).dataset.examPhase).toBe('grading');
    expect((screen.getByRole('textbox', { name: /Notizen zu Aufgabe e01-p001/ }) as HTMLTextAreaElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Abgeben' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Selbstbewertung' })).toBeTruthy();
    expect(container.textContent).toMatch(/Die Zeit ist abgelaufen/);
    expect(screen.getByText('Buch, Leser, leiht.')).toBeTruthy();
    const attempt = progress.load().exams.e01;
    expect(attempt.status).toBe('grading');
    expect(attempt.endedAt).toBe(new Date(START.getTime() + 90 * MIN).toISOString());
  });

  it('an attempt that expired while the page was closed opens in self-assessment', () => {
    progress.update((p) => {
      p.exams.e01 = { status: 'running', startedAt: new Date(START.getTime() - 120 * MIN).toISOString(), minutes: 90, answers: {}, checked: {} };
    });
    const { container } = render(<ExamRunner exam={EXAM} />);
    expect(unit(container).dataset.examPhase).toBe('grading');
    expect(progress.load().exams.e01.status).toBe('grading');
  });

  it('handing in early also switches to self-assessment', () => {
    const { container } = render(<ExamRunner exam={EXAM} />);
    start();
    fireEvent.click(screen.getByRole('button', { name: 'Abgeben' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ja, jetzt abgeben' }));
    expect(unit(container).dataset.examPhase).toBe('grading');
    expect(container.textContent).not.toMatch(/Die Zeit ist abgelaufen/);
  });

  it('self-assessment by rubric yields a percentage', () => {
    const { container } = render(<ExamRunner exam={EXAM} />);
    start();
    advance(90 * MIN);
    const total = () => container.querySelector('[data-exam-total]')!.textContent;
    expect(total()).toBe('0 von 9 Punkten (0 %)');
    fireEvent.click(screen.getByRole('checkbox', { name: /Entitätstypen vollständig/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Zerlegung verlustfrei/ }));
    expect(total()).toBe('6 von 9 Punkten (67 %)');
    // ticks survive a reload
    expect(progress.load().exams.e01.checked).toEqual({ 'e01-p001': [0], 'e01-p002': [0] });
    fireEvent.click(screen.getByRole('button', { name: 'Auswertung abschließen' }));
    expect(unit(container).dataset.examPhase).toBe('done');
    expect(screen.getByRole('heading', { name: 'Ergebnis: 67 %' })).toBeTruthy();
    const attempt = progress.load().exams.e01;
    expect(attempt).toMatchObject({ status: 'done', score: 6, max: 9 });
    expect(progress.load().streak.days).toBe(1);
  });

  it('shows no grading key in any phase', () => {
    const { container } = render(<ExamRunner exam={EXAM} />);
    const texts = [container.textContent];
    start();
    texts.push(container.textContent);
    advance(90 * MIN);
    fireEvent.click(screen.getByRole('checkbox', { name: /Beziehung mit Kardinalität/ }));
    texts.push(container.textContent);
    fireEvent.click(screen.getByRole('button', { name: 'Auswertung abschließen' }));
    texts.push(container.textContent);
    for (const text of texts) expect(text).not.toMatch(GRADE_WORDS);
    expect(container.innerHTML).not.toMatch(/Notenschlüssel|grade-?key/i);
  });

  it('cancelling resets the attempt', () => {
    const { container } = render(<ExamRunner exam={EXAM} />);
    start();
    advance(10 * MIN);
    fireEvent.click(screen.getByRole('button', { name: 'Versuch abbrechen' }));
    // two-step confirmation in the DOM, no window.confirm
    expect(progress.load().exams.e01).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Ja, Versuch verwerfen' }));
    expect(progress.load().exams.e01).toBeUndefined();
    expect(unit(container).dataset.examPhase).toBe('intro');
    expect(screen.getByRole('button', { name: 'Klausur starten' })).toBeTruthy();
    expect(screen.queryByRole('timer')).toBeNull();
  });

  it('a new attempt after the result starts over', () => {
    const { container } = render(<ExamRunner exam={EXAM} />);
    start();
    advance(90 * MIN);
    fireEvent.click(screen.getByRole('button', { name: 'Auswertung abschließen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Neuer Versuch' }));
    expect(unit(container).dataset.examPhase).toBe('intro');
    expect(progress.load().exams.e01).toBeUndefined();
  });

  it('works without storage (attempt kept in memory for this tab)', () => {
    vi.stubGlobal('localStorage', undefined);
    const { container } = render(<ExamRunner exam={EXAM} />);
    expect(container.textContent).toMatch(/nur in diesem Tab/);
    start();
    advance(5 * MIN);
    expect(timer()).toBe('85:00');
  });

  it('formats the clock as mm:ss and never below zero', () => {
    expect(formatClock(90 * MIN)).toBe('90:00');
    expect(formatClock(61_000)).toBe('01:01');
    expect(formatClock(500)).toBe('00:01');
    expect(formatClock(-5)).toBe('00:00');
  });
});
