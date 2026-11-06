// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { renderToString } from 'preact-render-to-string';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TaskCard, { type TaskCardData } from '../src/components/TaskCard';
import { progress } from '../src/lib/progress';

const TASK: TaskCardData = {
  id: 't04-p001',
  typeLabel: 'ER-Modell erstellen',
  difficultyLabel: 'mittel',
  points: 6,
  minutes: 10,
  prompt: '<p>Modelliere Kunde und Bestellung.</p>',
  solution: '<p>Kunde 1:n Bestellung.</p>',
  rubric: [
    { criterion: 'Entitätstypen korrekt', points: 2 },
    { criterion: 'Beziehung mit Kardinalität', points: 3 },
    { criterion: 'Schlüssel markiert', points: 1 },
  ],
};

function unit(container: Element): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-verify-unit="task-card"]');
  if (!el) throw new Error('task-card unit not found');
  return el;
}

beforeEach(() => {
  localStorage.clear();
  progress.reset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  progress.reset();
});

describe('TaskCard', () => {
  it('fulfils the verify contract: loading (server HTML) → ready, count = rubric criteria', async () => {
    expect(renderToString(<TaskCard task={TASK} />)).toContain('data-verify-state="loading"');
    const { container } = render(<TaskCard task={TASK} />);
    const el = unit(container);
    await waitFor(() => expect(el.dataset.verifyState).toBe('ready'));
    expect(el.dataset.verifyCount).toBe('3');
    expect(el.dataset.task).toBe('t04-p001');
    expect(screen.getByText('Modelliere Kunde und Bestellung.')).toBeTruthy();
  });

  it('shows the solution only after the click', async () => {
    const { container } = render(<TaskCard task={TASK} />);
    await waitFor(() => expect(unit(container).dataset.verifyState).toBe('ready'));
    expect(screen.queryByText('Kunde 1:n Bestellung.')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Lösung und Bewertungsraster aufdecken' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Kunde 1:n Bestellung.')).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('ticks sum up the rubric points and are saved in progress.tasks', async () => {
    const { container } = render(<TaskCard task={TASK} />);
    await waitFor(() => expect(unit(container).dataset.verifyState).toBe('ready'));
    fireEvent.click(screen.getByRole('button', { name: 'Lösung und Bewertungsraster aufdecken' }));
    const total = () => container.querySelector('output')!.textContent;
    expect(total()).toBe('0 von 6 Punkten');
    fireEvent.click(screen.getByRole('checkbox', { name: /Entitätstypen korrekt/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Beziehung mit Kardinalität/ }));
    expect(total()).toBe('5 von 6 Punkten');
    fireEvent.click(screen.getByRole('checkbox', { name: /Entitätstypen korrekt/ }));
    expect(total()).toBe('3 von 6 Punkten');
    fireEvent.click(screen.getByRole('button', { name: 'Bewertung speichern' }));
    expect(progress.load().tasks['t04-p001']).toEqual({ score: 3, max: 6 });
    expect(container.querySelector('.status-line')!.textContent).toMatch(/3 von 6/);
    expect(progress.load().streak.days).toBe(1);
  });

  it('shows the last saved score', async () => {
    progress.update((p) => {
      p.tasks['t04-p001'] = { score: 4, max: 6 };
    });
    const { container } = render(<TaskCard task={TASK} />);
    await waitFor(() => expect(unit(container).dataset.verifyState).toBe('ready'));
    expect(container.textContent).toMatch(/Zuletzt: 4 von 6 Punkten/);
  });

  it('is empty when the task has no rubric', async () => {
    const { container } = render(<TaskCard task={{ ...TASK, rubric: [] }} />);
    const el = unit(container);
    await waitFor(() => expect(el.dataset.verifyState).toBe('empty'));
    expect(el.dataset.verifyCount).toBe('0');
    // the solution is still available
    fireEvent.click(screen.getByRole('button', { name: /aufdecken/ }));
    expect(screen.getByText('Kunde 1:n Bestellung.')).toBeTruthy();
  });

  it('works without storage and says so after saving', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { container } = render(<TaskCard task={TASK} />);
    await waitFor(() => expect(unit(container).dataset.verifyState).toBe('ready'));
    fireEvent.click(screen.getByRole('button', { name: 'Lösung und Bewertungsraster aufdecken' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Schlüssel markiert/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Bewertung speichern' }));
    expect(container.querySelector('.status-line')!.textContent).toMatch(/nur in diesem Tab/);
  });

  it('renders slotted children (source note)', async () => {
    render(
      <TaskCard task={TASK}>
        <p>Basiert auf: Testquelle</p>
      </TaskCard>,
    );
    expect(screen.getByText('Basiert auf: Testquelle')).toBeTruthy();
  });
});
