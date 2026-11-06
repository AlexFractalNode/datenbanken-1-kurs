import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { progress, recordActivity, type TaskScore } from '../lib/progress';
import { isStorageAvailable } from '../lib/storage';

/** A paper task; prompt, solution and criteria are HTML rendered and sanitised at build time. */
export interface TaskCardData {
  id: string;
  typeLabel: string;
  difficultyLabel: string;
  points: number;
  minutes: number;
  prompt: string;
  solution: string;
  rubric: { criterion: string; points: number }[];
}

interface Props {
  task: TaskCardData;
  /** Level of the (visually hidden) task heading; the solution heading is one below. */
  headingLevel?: 2 | 3;
  /** Slotted static content, e.g. the source note. */
  children?: ComponentChildren;
}

type UnitState = 'loading' | 'empty' | 'ready' | 'error';

export default function TaskCard({ task, headingLevel = 2, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [ticks, setTicks] = useState<boolean[]>(() => task.rubric.map(() => false));
  const [saved, setSaved] = useState<TaskScore | null>(null);
  const [message, setMessage] = useState('');
  const solutionRef = useRef<HTMLDivElement>(null);
  const focusSolution = useRef(false);

  useEffect(() => {
    setSaved(progress.load().tasks[task.id] ?? null);
    setMounted(true);
  }, [task.id]);

  useEffect(() => {
    if (focusSolution.current) solutionRef.current?.focus();
    focusSolution.current = false;
  });

  const state: UnitState = !mounted ? 'loading' : task.rubric.length === 0 ? 'empty' : 'ready';
  const max = task.rubric.reduce((n, r) => n + r.points, 0);
  const score = task.rubric.reduce((n, r, i) => n + (ticks[i] ? r.points : 0), 0);
  const H = `h${headingLevel}` as 'h2' | 'h3';
  const Sub = `h${headingLevel + 1}` as 'h3' | 'h4';
  const solutionId = `${task.id}-solution`;

  const onToggle = () => {
    setOpen((o) => !o);
    focusSolution.current = !open;
  };

  const onSave = () => {
    const now = new Date();
    const next = progress.update((p) => {
      p.tasks[task.id] = { score, max };
      recordActivity(p, now);
    });
    const persisted = isStorageAvailable();
    setSaved(next.tasks[task.id]);
    setMessage(
      persisted
        ? `Gespeichert: ${score} von ${max} Punkten.`
        : `Bewertung ${score} von ${max} Punkten gilt nur in diesem Tab (Speicher nicht verfügbar).`,
    );
  };

  return (
    <article
      class="card task-card"
      id={task.id}
      aria-labelledby={`${task.id}-title`}
      data-verify-unit="task-card"
      data-verify-state={state}
      data-verify-count={state === 'ready' ? task.rubric.length : 0}
      data-task={task.id}
    >
      <div class="task__head">
        <span class="key">{task.id}</span>
        <H id={`${task.id}-title`} class="visually-hidden">
          Aufgabe {task.id}: {task.typeLabel}
        </H>
        <ul class="task__facts">
          <li>{task.typeLabel}</li>
          <li>{task.difficultyLabel}</li>
          <li>{task.points} Punkte</li>
          <li>ca. {task.minutes} Min.</li>
        </ul>
      </div>
      <div class="prose" dangerouslySetInnerHTML={{ __html: task.prompt }} />
      {saved && (
        <p class="meta">
          Zuletzt: {saved.score} von {saved.max} Punkten
        </p>
      )}

      <div class="button-row">
        <button
          type="button"
          class="button button--ghost"
          aria-expanded={open ? 'true' : 'false'}
          {...(open ? { 'aria-controls': solutionId } : {})}
          onClick={onToggle}
          disabled={!mounted}
        >
          Lösung und Bewertungsraster aufdecken
        </button>
      </div>

      {open && (
        <div id={solutionId} class="task-card__solution" ref={solutionRef} tabIndex={-1} aria-labelledby={`${task.id}-solution-title`}>
          <Sub id={`${task.id}-solution-title`} class="task-card__label">
            Lösung
          </Sub>
          <div class="prose" dangerouslySetInnerHTML={{ __html: task.solution }} />
          {task.rubric.length > 0 && (
            <>
              <fieldset class="rubric-check">
                <legend>Selbstbewertung nach Raster</legend>
                {task.rubric.map((r, i) => (
                  <label class="rubric-check__item" key={i}>
                    <input
                      type="checkbox"
                      checked={ticks[i]}
                      onChange={() => setTicks((t) => t.map((v, j) => (j === i ? !v : v)))}
                    />
                    <span class="rubric-check__criterion" dangerouslySetInnerHTML={{ __html: r.criterion }} />
                    <span class="rubric-check__points">({r.points} P.)</span>
                  </label>
                ))}
                <p class="rubric-check__sum">
                  Summe: <output aria-live="polite">{`${score} von ${max} Punkten`}</output>
                </p>
              </fieldset>
              <div class="button-row">
                <button type="button" class="button" onClick={onSave}>
                  Bewertung speichern
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <p role="status" class="status-line">
        {message}
      </p>
      {children}
    </article>
  );
}
