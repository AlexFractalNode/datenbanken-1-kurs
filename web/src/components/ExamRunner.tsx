import { useEffect, useRef, useState } from 'preact/hooks';
import { RECOVERED_NOTICE, progress, recordActivity, type ExamAttempt } from '../lib/progress';
import { STORAGE_UNAVAILABLE } from '../lib/storage';
import type { TaskCardData } from './TaskCard';

export interface ExamTaskData extends TaskCardData {
  topic: string;
}

/** Exam with all HTML rendered and sanitised at build time. */
export interface ExamData {
  id: string;
  title: string;
  minutes: number;
  tasks: ExamTaskData[];
}

interface Props {
  exam: ExamData;
}

type UnitState = 'loading' | 'empty' | 'ready' | 'error';
type Phase = 'intro' | 'running' | 'grading' | 'done';
type Confirm = 'submit' | 'cancel' | null;

const MINUTE = 60_000;
/** Remaining minutes at which screen readers get a polite announcement. */
const ANNOUNCE_AT = [30, 10, 5, 1];

/** mm:ss, rounded up to full seconds, never negative (minutes may exceed 59: "90:00"). */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

const endOf = (a: ExamAttempt) => Date.parse(a.startedAt) + a.minutes * MINUTE;

export default function ExamRunner({ exam }: Props) {
  const [mounted, setMounted] = useState(false);
  const [available, setAvailable] = useState(true);
  const [recovered, setRecovered] = useState(false);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [announcement, setAnnouncement] = useState('');
  const lastAnnounced = useRef<number | null>(null);
  const focusTarget = useRef<'tasks' | 'grading' | 'result' | 'start' | 'confirm' | null>(null);
  const tasksRef = useRef<HTMLHeadingElement>(null);
  const gradingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  /** Saves (or removes, for null) the attempt of this exam via read-modify-write. */
  const persist = (next: ExamAttempt | null, activity = false) => {
    progress.update((p) => {
      if (next) p.exams[exam.id] = next;
      else delete p.exams[exam.id];
      if (activity) recordActivity(p);
    });
    setAttempt(next);
  };

  useEffect(() => {
    const loaded = progress.loadDetailed();
    setAvailable(loaded.available);
    setRecovered(loaded.recovered.length > 0);
    let stored = loaded.progress.exams[exam.id] ?? null;
    const current = Date.now();
    if (stored && stored.status === 'running' && current >= endOf(stored)) {
      // Time ran out while the page was closed.
      stored = { ...stored, status: 'grading', endedAt: new Date(endOf(stored)).toISOString() };
      persist(stored);
    }
    setAttempt(stored);
    setNow(current);
    setMounted(true);
  }, [exam.id]);

  const running = attempt?.status === 'running';

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const remaining = attempt ? endOf(attempt) - now : exam.minutes * MINUTE;

  useEffect(() => {
    if (!attempt || attempt.status !== 'running') return;
    if (remaining <= 0) {
      persist({ ...attempt, status: 'grading', endedAt: new Date(endOf(attempt)).toISOString() });
      setConfirm(null);
      setAnnouncement('Die Zeit ist abgelaufen. Eingaben sind gesperrt.');
      focusTarget.current = 'grading';
      return;
    }
    const left = Math.ceil(remaining / MINUTE);
    if (ANNOUNCE_AT.includes(left) && lastAnnounced.current !== left && left < attempt.minutes) {
      lastAnnounced.current = left;
      setAnnouncement(left === 1 ? 'Noch 1 Minute.' : `Noch ${left} Minuten.`);
    }
  }, [now, attempt]);

  useEffect(() => {
    const target = focusTarget.current;
    focusTarget.current = null;
    if (target === 'tasks') tasksRef.current?.focus();
    if (target === 'grading') gradingRef.current?.focus();
    if (target === 'result') resultRef.current?.focus();
    if (target === 'start') startRef.current?.focus();
    if (target === 'confirm') confirmRef.current?.focus();
  });

  const phase: Phase = !attempt ? 'intro' : attempt.status;
  const state: UnitState = !mounted ? 'loading' : exam.tasks.length === 0 ? 'empty' : 'ready';
  const max = exam.tasks.reduce((n, t) => n + t.rubric.reduce((m, r) => m + r.points, 0), 0);
  const taskScore = (t: ExamTaskData) => (attempt?.checked[t.id] ?? []).reduce((n, i) => n + (t.rubric[i]?.points ?? 0), 0);
  const score = exam.tasks.reduce((n, t) => n + taskScore(t), 0);
  const percent = max > 0 ? Math.round((score / max) * 100) : 0;
  const timeUp = attempt?.endedAt !== undefined && Date.parse(attempt.endedAt) >= endOf(attempt);

  const onStart = () => {
    const startedAt = Date.now();
    lastAnnounced.current = null;
    setNow(startedAt);
    setAnnouncement('');
    persist({ status: 'running', startedAt: new Date(startedAt).toISOString(), minutes: exam.minutes, answers: {}, checked: {} }, true);
    focusTarget.current = 'tasks';
  };

  const onNotes = (taskId: string, value: string) => {
    if (!attempt || attempt.status !== 'running') return;
    persist({ ...attempt, answers: { ...attempt.answers, [taskId]: value } });
  };

  const onSubmit = () => {
    if (!attempt) return;
    setConfirm(null);
    persist({ ...attempt, status: 'grading', endedAt: new Date(Math.min(Date.now(), endOf(attempt))).toISOString() });
    focusTarget.current = 'grading';
  };

  const onTick = (taskId: string, index: number) => {
    if (!attempt || attempt.status !== 'grading') return;
    const current = attempt.checked[taskId] ?? [];
    const next = current.includes(index) ? current.filter((i) => i !== index) : [...current, index].sort((a, b) => a - b);
    persist({ ...attempt, checked: { ...attempt.checked, [taskId]: next } });
  };

  const onFinish = () => {
    if (!attempt) return;
    persist({ ...attempt, status: 'done', score, max }, true);
    focusTarget.current = 'result';
  };

  const onDiscard = () => {
    setConfirm(null);
    setAnnouncement('');
    persist(null);
    focusTarget.current = 'start';
  };

  const askConfirm = (kind: Confirm) => {
    setConfirm(kind);
    focusTarget.current = 'confirm';
  };

  const cancelControls =
    confirm === 'cancel' ? (
      <div class="confirm" role="group" aria-labelledby="exam-cancel-text">
        <p id="exam-cancel-text">Diesen Versuch verwerfen? Notizen und Selbstbewertung gehen verloren.</p>
        <button ref={confirmRef} type="button" class="button button--danger" onClick={onDiscard}>
          Ja, Versuch verwerfen
        </button>
        <button type="button" class="button button--ghost" onClick={() => setConfirm(null)}>
          Zurück
        </button>
      </div>
    ) : null;

  return (
    <section
      class="exam"
      aria-label={`Klausur-Simulation ${exam.title}`}
      data-verify-unit="exam-runner"
      data-verify-state={state}
      data-verify-count={state === 'ready' ? exam.tasks.length : 0}
      data-exam-phase={phase}
    >
      {!mounted && <p class="meta">Lade Klausur …</p>}
      {mounted && !available && <p class="notice notice--warn">{STORAGE_UNAVAILABLE}</p>}
      {recovered && <p class="notice notice--warn">{RECOVERED_NOTICE}</p>}
      <p class="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      {state === 'empty' && (
        <div class="empty-state">
          <h2>Keine Aufgaben</h2>
          <p>Diese Probeklausur enthält noch keine Aufgaben.</p>
        </div>
      )}

      {state === 'ready' && phase === 'intro' && (
        <div class="panel exam-intro">
          <h2>So läuft die Simulation</h2>
          <ul>
            <li>
              Du hast <strong>{exam.minutes} Minuten</strong> für {exam.tasks.length} Aufgaben mit zusammen {max} Punkten.
            </li>
            <li>Die Zeit läuft weiter, auch wenn du die Seite schließt oder neu lädst.</li>
            <li>Schreibe auf Papier, ohne Hilfsmittel. Die Notizfelder sind optional.</li>
            <li>Nach Ablauf oder Abgabe bewertest du dich selbst nach dem Raster. Das Ergebnis siehst du in Prozent.</li>
          </ul>
          <div class="button-row">
            <button ref={startRef} type="button" class="button" onClick={onStart}>
              Klausur starten
            </button>
          </div>
        </div>
      )}

      {state === 'ready' && attempt && phase === 'running' && (
        <div class={`exam-bar${remaining < 10 * MINUTE ? ' exam-bar--low' : ''}`}>
          <p class="exam-bar__clock">
            <span id="exam-timer-label" class="exam-bar__label">
              Restzeit
            </span>{' '}
            <span role="timer" aria-labelledby="exam-timer-label" class="exam-bar__time">
              {formatClock(remaining)}
            </span>
          </p>
          <div class="exam-bar__actions">
            <button type="button" class="button" onClick={() => askConfirm('submit')}>
              Abgeben
            </button>
            <button type="button" class="button button--ghost" onClick={() => askConfirm('cancel')}>
              Versuch abbrechen
            </button>
          </div>
        </div>
      )}

      {state === 'ready' && phase === 'running' && confirm === 'submit' && (
        <div class="confirm" role="group" aria-labelledby="exam-submit-text">
          <p id="exam-submit-text">Jetzt abgeben? Danach sind die Notizfelder gesperrt.</p>
          <button ref={confirmRef} type="button" class="button" onClick={onSubmit}>
            Ja, jetzt abgeben
          </button>
          <button type="button" class="button button--ghost" onClick={() => setConfirm(null)}>
            Weiter schreiben
          </button>
        </div>
      )}
      {state === 'ready' && phase === 'running' && cancelControls}

      {state === 'ready' && attempt && phase === 'grading' && (
        <div class="exam-grading-head">
          <h2 ref={gradingRef} tabIndex={-1}>
            Selbstbewertung
          </h2>
          <p class="notice notice--info">
            {timeUp ? 'Die Zeit ist abgelaufen. Eingaben sind gesperrt.' : 'Abgegeben. Eingaben sind gesperrt.'} Vergleiche
            deine Lösung mit der Musterlösung und hake ab, was du erfüllt hast.
          </p>
        </div>
      )}

      {state === 'ready' && attempt && (phase === 'running' || phase === 'grading') && (
        <div class="exam-tasks">
          {phase === 'running' && (
            <h2 ref={tasksRef} tabIndex={-1}>
              Aufgaben
            </h2>
          )}
          {exam.tasks.map((t, n) => (
            <article class="card exam-task" aria-labelledby={`${t.id}-title`}>
              <div class="task__head">
                <span class="key">{t.id}</span>
                <h3 id={`${t.id}-title`} class="exam-task__title">
                  Aufgabe {n + 1}
                </h3>
                <ul class="task__facts">
                  <li>{t.typeLabel}</li>
                  <li>{t.points} Punkte</li>
                  <li>ca. {t.minutes} Min.</li>
                </ul>
              </div>
              <div class="prose" dangerouslySetInnerHTML={{ __html: t.prompt }} />
              <div class="field">
                <label for={`${t.id}-notes`}>Notizen zu Aufgabe {t.id} (optional)</label>
                <textarea
                  id={`${t.id}-notes`}
                  value={attempt.answers[t.id] ?? ''}
                  disabled={phase !== 'running'}
                  onInput={(e) => onNotes(t.id, (e.currentTarget as HTMLTextAreaElement).value)}
                />
              </div>
              {phase === 'grading' && (
                <div class="task-card__solution">
                  <h4 class="task-card__label">Musterlösung</h4>
                  <div class="prose" dangerouslySetInnerHTML={{ __html: t.solution }} />
                  <fieldset class="rubric-check">
                    <legend>Raster für {t.id}</legend>
                    {t.rubric.map((r, i) => (
                      <label class="rubric-check__item" key={i}>
                        <input type="checkbox" checked={(attempt.checked[t.id] ?? []).includes(i)} onChange={() => onTick(t.id, i)} />
                        <span class="rubric-check__criterion" dangerouslySetInnerHTML={{ __html: r.criterion }} />
                        <span class="rubric-check__points">({r.points} P.)</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {state === 'ready' && attempt && phase === 'grading' && (
        <div class="panel exam-total">
          <p class="exam-total__line">
            Summe: <output data-exam-total>{`${score} von ${max} Punkten (${percent} %)`}</output>
          </p>
          <div class="button-row">
            <button type="button" class="button" onClick={onFinish}>
              Auswertung abschließen
            </button>
            <button type="button" class="button button--ghost" onClick={() => askConfirm('cancel')}>
              Versuch abbrechen
            </button>
          </div>
          {cancelControls}
        </div>
      )}

      {state === 'ready' && attempt && phase === 'done' && (
        <div class="panel exam-result">
          <h2 ref={resultRef} tabIndex={-1}>
            Ergebnis: {attempt.max ? Math.round(((attempt.score ?? 0) / attempt.max) * 100) : 0} %
          </h2>
          <p>
            {attempt.score ?? 0} von {attempt.max ?? max} Punkten nach deiner Selbstbewertung.
          </p>
          <div class="table-scroll" role="region" aria-label="Punkte je Aufgabe" tabIndex={0}>
            <table>
              <caption class="visually-hidden">Punkte je Aufgabe</caption>
              <thead>
                <tr>
                  <th scope="col">Aufgabe</th>
                  <th scope="col">Punkte</th>
                </tr>
              </thead>
              <tbody>
                {exam.tasks.map((t) => (
                  <tr>
                    <td>
                      <span class="key">{t.id}</span> {t.typeLabel}
                    </td>
                    <td>
                      {taskScore(t)} / {t.rubric.reduce((m, r) => m + r.points, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div class="button-row">
            <button type="button" class="button" onClick={onDiscard}>
              Neuer Versuch
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
