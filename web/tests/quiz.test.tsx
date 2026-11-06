// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { renderToString } from 'preact-render-to-string';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Quiz, { isExactlyCorrect, type QuizQuestion } from '../src/components/Quiz';
import { progress } from '../src/lib/progress';

const SINGLE: QuizQuestion = {
  id: 't04-q001',
  topic: 't04',
  type: 'single',
  question: '<p>Welches Symbol steht für einen Entitätstyp?</p>',
  options: [
    { text: 'Rechteck', correct: true, explain: '<p>Entitätstypen sind Rechtecke.</p>' },
    { text: 'Raute', correct: false, explain: '<p>Die Raute steht für Beziehungstypen.</p>' },
  ],
};
const MULTI: QuizQuestion = {
  id: 't06-q001',
  topic: 't06',
  type: 'multi',
  question: '<p>Welche Aussagen gelten für 2NF?</p>',
  options: [
    { text: 'Setzt 1NF voraus', correct: true, explain: '<p>Ja, die Formen bauen aufeinander auf.</p>' },
    { text: 'Keine partiellen Abhängigkeiten', correct: true, explain: '<p>Genau das fordert 2NF.</p>' },
    { text: 'Keine transitiven Abhängigkeiten', correct: false, explain: '<p>Das ist 3NF.</p>' },
  ],
};
const TOPICS = [
  { id: 't04', title: 'ER-Modellierung' },
  { id: 't06', title: 'Normalisierung' },
];

function unit(container: Element): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-verify-unit="quiz"]');
  if (!el) throw new Error('quiz unit not found');
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
  window.history.replaceState(null, '', '/datenbanken-1-kurs/quiz/');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  progress.reset();
});

describe('Quiz', () => {
  it('fulfils the verify contract: loading (server HTML) → ready with the question count', async () => {
    // The island's server-rendered HTML (before hydration) reports loading.
    expect(renderToString(<Quiz items={[SINGLE, MULTI]} topics={TOPICS} />)).toContain('data-verify-state="loading"');
    const { container } = render(<Quiz items={[SINGLE, MULTI]} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyState).toBe('ready');
    expect(el.dataset.verifyCount).toBe('2');
    expect(el.dataset.verifyError).toBeUndefined();
  });

  it('single: a wrong option shows the explanation and stores seen+1', async () => {
    const { container } = render(<Quiz items={[SINGLE]} topics={TOPICS} />);
    await ready(container);
    const check = screen.getByRole('button', { name: 'Antwort prüfen' }) as HTMLButtonElement;
    expect(check.disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Raute' }));
    expect(check.disabled).toBe(false);
    fireEvent.click(check);
    expect(screen.getByRole('heading', { name: 'Leider falsch' })).toBeTruthy();
    expect(screen.getByText('Die Raute steht für Beziehungstypen.')).toBeTruthy();
    expect(progress.load().quiz['t04-q001']).toEqual({ correct: 0, seen: 1 });
    // inputs are locked after checking
    expect((screen.getByRole('radio', { name: 'Raute' }) as HTMLInputElement).disabled).toBe(true);
    expect(progress.load().streak.days).toBe(1);
  });

  it('single: the right option counts as correct', async () => {
    progress.update((p) => {
      p.quiz['t04-q001'] = { correct: 0, seen: 1 };
    });
    const { container } = render(<Quiz items={[SINGLE]} topics={TOPICS} />);
    await ready(container);
    fireEvent.click(screen.getByRole('radio', { name: 'Rechteck' }));
    fireEvent.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
    expect(screen.getByRole('heading', { name: 'Richtig' })).toBeTruthy();
    expect(progress.load().quiz['t04-q001']).toEqual({ correct: 1, seen: 2 });
  });

  it('multi: only the exactly correct selection counts', async () => {
    const { container } = render(<Quiz items={[MULTI, MULTI, MULTI].map((q, i) => ({ ...q, id: `t06-q00${i + 1}` }))} topics={TOPICS} />);
    await ready(container);
    expect(screen.getByText(/Mehrere Antworten/)).toBeTruthy();

    // 1) subset of the correct options → wrong
    fireEvent.click(screen.getByRole('checkbox', { name: 'Setzt 1NF voraus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
    expect(screen.getByRole('heading', { name: 'Leider falsch' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Nächste Frage' }));

    // 2) all correct plus a wrong one → wrong
    for (const name of ['Setzt 1NF voraus', 'Keine partiellen Abhängigkeiten', 'Keine transitiven Abhängigkeiten']) {
      fireEvent.click(screen.getByRole('checkbox', { name }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
    expect(screen.getByRole('heading', { name: 'Leider falsch' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Nächste Frage' }));

    // 3) exactly the correct ones → right
    fireEvent.click(screen.getByRole('checkbox', { name: 'Setzt 1NF voraus' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Keine partiellen Abhängigkeiten' }));
    fireEvent.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
    expect(screen.getByRole('heading', { name: 'Richtig' })).toBeTruthy();

    const quiz = progress.load().quiz;
    expect(quiz['t06-q001']).toEqual({ correct: 0, seen: 1 });
    expect(quiz['t06-q002']).toEqual({ correct: 0, seen: 1 });
    expect(quiz['t06-q003']).toEqual({ correct: 1, seen: 1 });
  });

  it('isExactlyCorrect compares the selection with the correct set', () => {
    expect(isExactlyCorrect(MULTI, [0, 1])).toBe(true);
    expect(isExactlyCorrect(MULTI, [1, 0])).toBe(true);
    expect(isExactlyCorrect(MULTI, [0])).toBe(false);
    expect(isExactlyCorrect(MULTI, [0, 1, 2])).toBe(false);
    expect(isExactlyCorrect(MULTI, [])).toBe(false);
  });

  it('shows a summary in percent after the last question and can restart', async () => {
    const { container } = render(<Quiz items={[SINGLE]} topics={TOPICS} />);
    await ready(container);
    fireEvent.click(screen.getByRole('radio', { name: 'Rechteck' }));
    fireEvent.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Auswertung' }));
    expect(screen.getByRole('heading', { name: 'Runde beendet' })).toBeTruthy();
    expect(container.textContent).toMatch(/1 von 1 richtig \(100 %\)/);
    fireEvent.click(screen.getByRole('button', { name: 'Neue Runde' }));
    expect(screen.getByRole('radio', { name: 'Rechteck' })).toBeTruthy();
  });

  it('filters by ?thema= and via the select', async () => {
    window.history.replaceState(null, '', '/datenbanken-1-kurs/quiz/?thema=t06');
    const { container } = render(<Quiz items={[SINGLE, MULTI]} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyCount).toBe('1');
    expect(el.dataset.topic).toBe('t06');
    fireEvent.change(screen.getByRole('combobox', { name: 'Thema' }), { target: { value: '' } });
    await waitFor(() => expect(el.dataset.verifyCount).toBe('2'));
  });

  it('is empty without questions', async () => {
    const { container } = render(<Quiz items={[]} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyState).toBe('empty');
    expect(el.dataset.verifyCount).toBe('0');
  });

  it('works without storage', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { container } = render(<Quiz items={[SINGLE]} topics={TOPICS} />);
    const el = await ready(container);
    expect(el.dataset.verifyState).toBe('ready');
    expect(container.textContent).toMatch(/nur in diesem Tab/);
    fireEvent.click(screen.getByRole('radio', { name: 'Raute' }));
    fireEvent.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
    expect(screen.getByRole('heading', { name: 'Leider falsch' })).toBeTruthy();
  });

  it('warns when an answer cannot be saved after loading', async () => {
    const { container } = render(<Quiz items={[SINGLE]} topics={TOPICS} />);
    await ready(container);
    expect(screen.queryByRole('alert')).toBeNull();
    // another tab (newer app) writes an unknown version marker: this tab must not overwrite it
    localStorage.setItem('db1:progress:version', '2');
    fireEvent.click(screen.getByRole('radio', { name: 'Rechteck' }));
    fireEvent.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
    expect(screen.getByRole('alert').textContent).toMatch(/Speichern fehlgeschlagen/);
    expect(localStorage.getItem('db1:progress:quiz')).toBeNull();
  });

  it('names an unknown stored version instead of overwriting it', async () => {
    localStorage.setItem('db1:progress:version', '2');
    const { container } = render(<Quiz items={[SINGLE]} topics={TOPICS} />);
    await ready(container);
    expect(container.textContent).toMatch(/unbekannten Version/);
  });

  it('reports error for a question without correct option', async () => {
    const broken = { ...SINGLE, options: SINGLE.options.map((o) => ({ ...o, correct: false })) };
    const { container } = render(<Quiz items={[broken]} topics={TOPICS} />);
    const el = unit(container);
    await waitFor(() => expect(el.dataset.verifyState).toBe('error'));
    expect(el.dataset.verifyError).toMatch(/t04-q001/);
  });
});
