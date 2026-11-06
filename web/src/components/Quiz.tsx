import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { RECOVERED_NOTICE, progress, recordActivity } from '../lib/progress';
import { STORAGE_UNAVAILABLE } from '../lib/storage';
import { topicFromUrl, writeTopicToUrl, type TopicOption } from '../lib/topic-filter';

/** One quiz question; all HTML was rendered and sanitised at build time (`renderMarkdown`/`renderInline`). */
export interface QuizQuestion {
  id: string;
  topic: string;
  type: 'single' | 'multi' | 'truefalse';
  question: string;
  options: { text: string; correct: boolean; explain: string }[];
}

interface Props {
  items: QuizQuestion[];
  topics: TopicOption[];
  /** Topic filter; if omitted, the `?thema=` URL parameter is used. */
  initialTopic?: string;
}

type UnitState = 'loading' | 'empty' | 'ready' | 'error';

/** True only if the selection equals the set of correct options (order does not matter). */
export function isExactlyCorrect(q: QuizQuestion, selection: number[]): boolean {
  const chosen = new Set(selection);
  return q.options.every((o, i) => o.correct === chosen.has(i)) && chosen.size > 0;
}

/** Content sanity check; a broken question must not silently count as wrong for everyone. */
function validate(items: QuizQuestion[]): string {
  for (const q of items) {
    const correct = q.options.filter((o) => o.correct).length;
    if (correct === 0 || (q.type !== 'multi' && correct !== 1)) {
      return `Quizfrage ${q.id} hat keine eindeutige richtige Antwort.`;
    }
  }
  return '';
}

export default function Quiz({ items, topics, initialTopic }: Props) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [available, setAvailable] = useState(true);
  const [recovered, setRecovered] = useState(false);
  const [topic, setTopic] = useState('');
  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef<'feedback' | 'question' | 'summary' | null>(null);

  const knownTopics = useMemo(() => new Set(topics.map((t) => t.id)), [topics]);
  const titleOf = useMemo(() => new Map(topics.map((t) => [t.id, t.title])), [topics]);
  const round = useMemo(() => items.filter((q) => !topic || q.topic === topic), [items, topic]);

  useEffect(() => {
    const wanted = initialTopic ?? topicFromUrl();
    setTopic(knownTopics.has(wanted) ? wanted : '');
    const loaded = progress.loadDetailed();
    setAvailable(loaded.available);
    setRecovered(loaded.recovered.length > 0);
    setError(validate(items));
    setMounted(true);
    // Mount only: the props are static build output.
  }, []);

  useEffect(() => {
    if (focusNext.current === 'feedback') feedbackRef.current?.focus();
    if (focusNext.current === 'question') questionRef.current?.focus();
    if (focusNext.current === 'summary') summaryRef.current?.focus();
    focusNext.current = null;
  });

  const state: UnitState = !mounted ? 'loading' : error ? 'error' : round.length === 0 ? 'empty' : 'ready';
  const q = state === 'ready' && !finished ? round[index] : undefined;
  const isLast = index >= round.length - 1;

  const restart = () => {
    setIndex(0);
    setSelection([]);
    setChecked(false);
    setResults({});
    setFinished(false);
  };

  const onTopic = (event: Event) => {
    const value = (event.currentTarget as HTMLSelectElement).value;
    const next = knownTopics.has(value) ? value : '';
    setTopic(next);
    restart();
    writeTopicToUrl(next);
  };

  const toggle = (i: number) => {
    if (!q || checked) return;
    if (q.type === 'multi') setSelection((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
    else setSelection([i]);
  };

  const onCheck = () => {
    if (!q || selection.length === 0) return;
    const ok = isExactlyCorrect(q, selection);
    progress.update((p) => {
      const stat = p.quiz[q.id] ?? { correct: 0, seen: 0 };
      p.quiz[q.id] = { correct: stat.correct + (ok ? 1 : 0), seen: stat.seen + 1 };
      recordActivity(p);
    });
    setResults((r) => ({ ...r, [q.id]: ok }));
    setChecked(true);
    focusNext.current = 'feedback';
  };

  const onNext = () => {
    if (isLast) {
      setFinished(true);
      focusNext.current = 'summary';
      return;
    }
    setIndex((i) => i + 1);
    setSelection([]);
    setChecked(false);
    focusNext.current = 'question';
  };

  const right = Object.values(results).filter(Boolean).length;
  const answered = Object.keys(results).length;
  const withQuestions = topics.filter((t) => items.some((i) => i.topic === t.id));
  const ok = q && checked ? results[q.id] : undefined;

  return (
    <section
      class="trainer"
      aria-label="Quiz"
      data-verify-unit="quiz"
      data-verify-state={state}
      data-verify-count={state === 'ready' || state === 'empty' ? round.length : 0}
      data-topic={topic}
      {...(state === 'error' ? { 'data-verify-error': error } : {})}
    >
      <div class="trainer__bar">
        <div class="field">
          <label for="quiz-topic">Thema</label>
          <select id="quiz-topic" value={topic} onChange={onTopic} disabled={!mounted}>
            <option value="">Alle Themen ({items.length})</option>
            {withQuestions.map((t) => (
              <option value={t.id}>
                {t.id} · {t.title} ({items.filter((i) => i.topic === t.id).length})
              </option>
            ))}
          </select>
        </div>
        <p class="trainer__count">
          {state === 'ready' ? (finished ? `${round.length} von ${round.length}` : `Frage ${index + 1} von ${round.length}`) : !mounted ? 'Lade Fragen …' : ''}
        </p>
      </div>

      {!available && <p class="notice notice--warn">{STORAGE_UNAVAILABLE}</p>}
      {recovered && <p class="notice notice--warn">{RECOVERED_NOTICE}</p>}
      {error && (
        <p role="alert" class="notice notice--error">
          {error}
        </p>
      )}

      {q && (
        <article class="quiz-card" aria-labelledby="quiz-question">
          <header class="flashcard__head">
            <span class="key">{q.id}</span>
            <span class="flashcard__topic">{titleOf.get(q.topic) ?? q.topic}</span>
          </header>
          <div
            id="quiz-question"
            ref={questionRef}
            tabIndex={-1}
            class="prose quiz-card__question"
            dangerouslySetInnerHTML={{ __html: q.question }}
          />
          <fieldset class="quiz-options" aria-labelledby="quiz-question" {...(q.type === 'multi' ? { 'aria-describedby': 'quiz-multi-hint' } : {})}>
            {q.type === 'multi' && (
              <p id="quiz-multi-hint" class="hint">
                Mehrere Antworten können richtig sein. Wähle alle richtigen aus.
              </p>
            )}
            {q.options.map((o, i) => {
              const chosen = selection.includes(i);
              const mark = !checked ? '' : o.correct ? ' quiz-option--correct' : chosen ? ' quiz-option--wrong' : '';
              return (
                <div class={`quiz-option${mark}`} key={`${q.id}-${i}`}>
                  <label class="quiz-option__label">
                    <input
                      type={q.type === 'multi' ? 'checkbox' : 'radio'}
                      name={`quiz-${q.id}`}
                      checked={chosen}
                      disabled={checked}
                      onChange={() => toggle(i)}
                    />
                    <span dangerouslySetInnerHTML={{ __html: o.text }} />
                  </label>
                  {checked && (
                    <div class="quiz-option__explain">
                      <p class="quiz-option__verdict">
                        {o.correct ? 'Richtige Antwort' : 'Falsche Antwort'}
                        {chosen ? ' – deine Wahl' : ''}
                      </p>
                      <div class="prose" dangerouslySetInnerHTML={{ __html: o.explain }} />
                    </div>
                  )}
                </div>
              );
            })}
          </fieldset>

          {!checked ? (
            <div class="button-row">
              <button type="button" class="button" onClick={onCheck} disabled={selection.length === 0}>
                Antwort prüfen
              </button>
            </div>
          ) : (
            <>
              <div class={`quiz-feedback ${ok ? 'quiz-feedback--ok' : 'quiz-feedback--wrong'}`} ref={feedbackRef} tabIndex={-1}>
                <h2>{ok ? 'Richtig' : 'Leider falsch'}</h2>
                <p>{ok ? 'Gut gemacht.' : 'Die richtigen Antworten sind markiert; die Erklärungen stehen bei jeder Antwort.'}</p>
              </div>
              <div class="button-row">
                <button type="button" class="button" onClick={onNext}>
                  {isLast ? 'Auswertung' : 'Nächste Frage'}
                </button>
              </div>
            </>
          )}
        </article>
      )}

      {state === 'ready' && finished && (
        <div class="panel quiz-summary">
          <h2 ref={summaryRef} tabIndex={-1}>
            Runde beendet
          </h2>
          <p class="quiz-summary__score">
            {right} von {answered} richtig ({answered ? Math.round((right / answered) * 100) : 0} %)
          </p>
          <div class="button-row">
            <button type="button" class="button" onClick={() => { restart(); focusNext.current = 'question'; }}>
              Neue Runde
            </button>
          </div>
        </div>
      )}

      {state === 'empty' && (
        <div class="empty-state">
          <h2>Keine Fragen vorhanden</h2>
          <p>Zu dieser Auswahl gibt es noch keine Quizfragen.</p>
        </div>
      )}
    </section>
  );
}
