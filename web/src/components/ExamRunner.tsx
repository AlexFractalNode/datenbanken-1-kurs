import { useEffect, useRef, useState } from 'preact/hooks';
import { RECOVERED_NOTICE, SAVE_FAILED_NOTICE, progress, recordActivity, storageNotice, type ExamAttempt } from '../lib/progress';
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
/** Notes are written at most once per pause in typing of this length. */
export const NOTES_DEBOUNCE_MS = 300;

/** mm:ss, rounded up to full seconds, never negative (minutes may exceed 59: "90:00"). */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

const endOf = (a: ExamAttempt) => Date.parse(a.startedAt) + a.minutes * MINUTE;
/** Remaining time, never more than the exam length (a `startedAt` in the future, e.g. a wrong clock). */
const remainingOf = (a: ExamAttempt, now: number) => Math.min(endOf(a) - now, a.minutes * MINUTE);

/** Points of the ticked criteria; duplicate and out-of-range indices count nothing. */
function ticked(task: { rubric: { points: number }[] }, indices: number[] | undefined): number {
  return [...new Set(indices ?? [])].reduce((n, i) => n + (i >= 0 && i < task.rubric.length ? task.rubric[i].points : 0), 0);
}

export default function ExamRunner({ exam }: Props) {
  const [mounted, setMounted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [announcement, setAnnouncement] = useState('');
  const lastAnnounced = useRef<number | null>(null);
  const focusTarget = useRef<'tasks' | 'grading' | 'result' | 'start' | 'confirm' | 'trigger' | null>(null);
  const tasksRef = useRef<HTMLHeadingElement>(null);
  const gradingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  /** Button that opened the current confirmation; it gets the focus back when the user dismisses it. */
  const triggerRef = useRef<HTMLElement | null>(null);
  /** Storage notice of the load (a ref, so saves during mount already see it). */
  const noticeRef = useRef<string | null>(null);
  /** Notes typed but not yet written (debounced). */
  const pendingNotes = useRef<ExamAttempt | null>(null);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Writes (or removes, for null) the attempt of this exam via read-modify-write; true if persisted. */
  const save = (next: ExamAttempt | null, activity = false): boolean =>
    progress.update((p) => {
      if (next) p.exams[exam.id] = next;
      else delete p.exams[exam.id];
      if (activity) recordActivity(p);
    }).persisted;

  /** Warns about a failed write, unless the storage notice already says that nothing is stored. */
  const reportSave = (persisted: boolean) => setSaveFailed(!persisted && noticeRef.current === null);

  const cancelPendingNotes = () => {
    if (notesTimer.current !== null) clearTimeout(notesTimer.current);
    notesTimer.current = null;
    pendingNotes.current = null;
  };

  /** Writes pending notes now; returns null if there were none. */
  const flushNotes = (): boolean | null => {
    const pending = pendingNotes.current;
    cancelPendingNotes();
    return pending ? save(pending) : null;
  };
  const flushRef = useRef(flushNotes);
  flushRef.current = flushNotes;

  /** Saves the attempt and shows it. `next` always contains the latest notes, so pending ones are dropped. */
  const persist = (next: ExamAttempt | null, activity = false) => {
    cancelPendingNotes();
    reportSave(save(next, activity));
    setAttempt(next);
  };

  useEffect(() => {
    // Leaving the page (or the island unmounting) must not lose debounced notes.
    const onHide = () => flushRef.current();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushRef.current();
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      flushRef.current();
    };
  }, []);

  useEffect(() => {
    const loaded = progress.loadDetailed();
    noticeRef.current = storageNotice(loaded);
    setNotice(noticeRef.current);
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

  const remaining = attempt ? remainingOf(attempt, now) : exam.minutes * MINUTE;

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
    if (target === 'trigger' && triggerRef.current?.isConnected) triggerRef.current.focus();
  });

  const phase: Phase = !attempt ? 'intro' : attempt.status;
  const state: UnitState = !mounted ? 'loading' : exam.tasks.length === 0 ? 'empty' : 'ready';
  const max = exam.tasks.reduce((n, t) => n + t.rubric.reduce((m, r) => m + r.points, 0), 0);
  const taskScore = (t: ExamTaskData) => ticked(t, attempt?.checked[t.id]);
  const available = notice === null;
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
    const next = { ...attempt, answers: { ...attempt.answers, [taskId]: value } };
    setAttempt(next);
    pendingNotes.current = next;
    if (notesTimer.current !== null) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      const persisted = flushRef.current();
      if (persisted !== null) reportSave(persisted);
    }, NOTES_DEBOUNCE_MS);
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

  const askConfirm = (kind: Confirm, event: Event) => {
    triggerRef.current = event.currentTarget as HTMLElement;
    setConfirm(kind);
    focusTarget.current = 'confirm';
  };

  const dismissConfirm = () => {
    setConfirm(null);
    focusTarget.current = 'trigger';
  };

  const cancelControls =
    confirm === 'cancel' ? (
      <div class="confirm" role="group" aria-labelledby="exam-cancel-text">
        <p id="exam-cancel-text">Diesen Versuch verwerfen? Notizen und Selbstbewertung gehen verloren.</p>
        <button ref={confirmRef} type="button" class="button button--danger" onClick={onDiscard}>
          Ja, Versuch verwerfen
        </button>
        <button type="button" class="button button--ghost" onClick={dismissConfirm}>
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
      {mounted && notice && <p class="notice notice--warn">{notice}</p>}
      {recovered && <p class="notice notice--warn">{RECOVERED_NOTICE}</p>}
      {saveFailed && (
        <p role="alert" class="notice notice--warn">
          {SAVE_FAILED_NOTICE}
        </p>
      )}
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
            {available ? (
              <li>Die Zeit läuft weiter, auch wenn du die Seite schließt oder neu lädst.</li>
            ) : (
              <li>Ohne Speicher gilt der Versuch nur, solange dieser Tab offen bleibt. Neuladen beendet ihn.</li>
            )}
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
            <button type="button" class="button" onClick={(e) => askConfirm('submit', e)}>
              Abgeben
            </button>
            <button type="button" class="button button--ghost" onClick={(e) => askConfirm('cancel', e)}>
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
          <button type="button" class="button button--ghost" onClick={dismissConfirm}>
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
            <button type="button" class="button button--ghost" onClick={(e) => askConfirm('cancel', e)}>
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
