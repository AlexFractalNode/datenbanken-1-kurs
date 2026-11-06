import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { RECOVERED_NOTICE, SAVE_FAILED_NOTICE, progress, recordActivity, storageNotice, type FsrsCard } from '../lib/progress';
import { withBase } from '../lib/nav';
import { GRADES, GRADE_LABEL, formatInterval, isDue, loadSrs, type Grade, type Srs } from '../lib/srs';
import { newCardAllowance, readIntroducedToday, readNewCardLimit, recordIntroduced } from '../lib/settings';
import { topicFromUrl, writeTopicToUrl, type TopicOption } from '../lib/topic-filter';

/** One card with Markdown already rendered (and sanitised) at build time by `renderMarkdown`. */
export interface FlashcardItem {
  id: string;
  topic: string;
  front: string;
  back: string;
  /** Optional diagram figure (inline SVG rendered at build time). */
  figure?: string;
}

export type { TopicOption };

interface Props {
  cards: FlashcardItem[];
  topics: TopicOption[];
  /** Topic filter; if omitted, the `?thema=` URL parameter is used. */
  initialTopic?: string;
  /** Injection point for tests. */
  loadScheduler?: () => Promise<Srs>;
}

type UnitState = 'loading' | 'empty' | 'ready' | 'error';

export const SCHEDULER_ERROR = 'Der Kartentrainer konnte nicht geladen werden. Bitte lade die Seite neu.';

const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Due cards of the filter: known cards (oldest due first) before new ones (content order). New cards
 * are capped by the daily limit; `held` is how many new cards the limit keeps back for later.
 */
function buildQueue(cards: FlashcardItem[], stored: Record<string, FsrsCard>, now: Date): { queue: string[]; held: number } {
  const due = cards.filter((c) => isDue(stored[c.id], now));
  const reviews = due.filter((c) => stored[c.id]).sort((a, b) => Date.parse(stored[a.id].dueAt) - Date.parse(stored[b.id].dueAt));
  const fresh = due.filter((c) => !stored[c.id]);
  const allowed = fresh.slice(0, newCardAllowance(readNewCardLimit(), readIntroducedToday(now).length));
  return { queue: [...reviews, ...allowed].map((c) => c.id), held: fresh.length - allowed.length };
}

export default function Flashcards({ cards, topics, initialTopic, loadScheduler = loadSrs }: Props) {
  const [srs, setSrs] = useState<Srs | null>(null);
  const [error, setError] = useState('');
  const [stored, setStored] = useState<Record<string, FsrsCard>>({});
  const [topic, setTopic] = useState('');
  const [queue, setQueue] = useState<string[]>([]);
  /** New cards that the daily limit keeps back. */
  const [held, setHeld] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [message, setMessage] = useState('');
  const revealRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef<'reveal' | 'back' | 'empty' | null>(null);

  const knownTopics = useMemo(() => new Set(topics.map((t) => t.id)), [topics]);
  const titleOf = useMemo(() => new Map(topics.map((t) => [t.id, t.title])), [topics]);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const inFilter = useMemo(() => cards.filter((c) => !topic || c.topic === topic), [cards, topic]);

  useEffect(() => {
    let active = true;
    const wanted = initialTopic ?? topicFromUrl();
    const start = knownTopics.has(wanted) ? wanted : '';
    const loaded = progress.loadDetailed();
    setNotice(storageNotice(loaded));
    setRecovered(loaded.recovered.length > 0);
    setStored(loaded.progress.cards);
    setTopic(start);
    const built = buildQueue(cards.filter((c) => !start || c.topic === start), loaded.progress.cards, new Date());
    setQueue(built.queue);
    setHeld(built.held);
    loadScheduler().then(
      (s) => active && setSrs(s),
      () => active && setError(SCHEDULER_ERROR),
    );
    return () => {
      active = false;
    };
    // Mount only: the props are static build output.
  }, []);

  useEffect(() => {
    if (focusNext.current === 'reveal') revealRef.current?.focus();
    if (focusNext.current === 'back') backRef.current?.focus();
    if (focusNext.current === 'empty') emptyRef.current?.focus();
    focusNext.current = null;
  });

  const state: UnitState = error ? 'error' : !srs ? 'loading' : queue.length === 0 ? 'empty' : 'ready';
  const currentId = state === 'ready' ? queue[0] : undefined;
  const current = currentId ? byId.get(currentId) : undefined;

  const previews = useMemo(() => {
    if (!srs || !current || !revealed) return null;
    const now = new Date();
    const due = srs.preview(current.id, stored[current.id], now);
    return Object.fromEntries(GRADES.map((g) => [g, formatInterval(due[g].getTime() - now.getTime())])) as Record<Grade, string>;
  }, [srs, current, revealed, stored]);

  const onTopic = (event: Event) => {
    const value = (event.currentTarget as HTMLSelectElement).value;
    const next = knownTopics.has(value) ? value : '';
    setTopic(next);
    setRevealed(false);
    setMessage('');
    const built = buildQueue(cards.filter((c) => !next || c.topic === next), stored, new Date());
    setQueue(built.queue);
    setHeld(built.held);
    writeTopicToUrl(next);
  };

  const onReveal = () => {
    setRevealed(true);
    focusNext.current = 'back';
  };

  const onRate = (grade: Grade) => {
    if (!srs || !current) return;
    const now = new Date();
    const next = srs.review(current.id, stored[current.id], grade, now);
    // A card without stored state is new: it counts against today's limit from its first rating on.
    if (!stored[current.id]) recordIntroduced(current.id, now);
    const saved = progress.update((p) => {
      p.cards[current.id] = next;
      recordActivity(p, now);
    });
    setStored(saved.progress.cards);
    // The general notice already says that nothing is stored; otherwise warn about this failed write.
    setSaveFailed(!saved.persisted && notice === null);
    const rest = queue.slice(1);
    const nextQueue = grade === 'again' ? [...rest, current.id] : rest;
    setQueue(nextQueue);
    setRevealed(false);
    const interval = formatInterval(Date.parse(next.dueAt) - now.getTime());
    setMessage(
      grade === 'again'
        ? 'Die Karte kommt in dieser Runde noch einmal.'
        : saved.persisted
          ? `Gespeichert – nächste Wiederholung in ${interval}.`
          : `Bewertet, aber nicht gespeichert – nächste Wiederholung in ${interval}, nur in diesem Tab.`,
    );
    focusNext.current = nextQueue.length === 0 ? 'empty' : 'reveal';
  };

  const nextDue = useMemo(() => {
    const times = inFilter.map((c) => stored[c.id]).filter(Boolean).map((s) => Date.parse(s.dueAt));
    return times.length ? new Date(Math.min(...times)) : null;
  }, [inFilter, stored]);

  const withCards = topics.filter((t) => cards.some((c) => c.topic === t.id));

  return (
    <section
      class="trainer"
      aria-label="Kartentrainer"
      data-verify-unit="flashcards"
      data-verify-state={state}
      data-verify-count={state === 'loading' || state === 'error' ? 0 : queue.length}
      data-topic={topic}
      {...(state === 'error' ? { 'data-verify-error': error } : {})}
    >
      <div class="trainer__bar">
        <div class="field">
          <label for="fc-topic">Thema</label>
          <select id="fc-topic" value={topic} onChange={onTopic} disabled={state === 'loading'}>
            <option value="">Alle Themen ({cards.length})</option>
            {withCards.map((t) => (
              <option value={t.id}>
                {t.id} · {t.title} ({cards.filter((c) => c.topic === t.id).length})
              </option>
            ))}
          </select>
        </div>
        <p class="trainer__count">
          {state === 'loading' ? 'Lade Karten …' : state === 'error' ? '' : `${queue.length} fällig`}
        </p>
      </div>

      {notice && <p class="notice notice--warn">{notice}</p>}
      {recovered && <p class="notice notice--warn">{RECOVERED_NOTICE}</p>}
      {saveFailed && (
        <p role="alert" class="notice notice--warn">
          {SAVE_FAILED_NOTICE}
        </p>
      )}
      {error && (
        <p role="alert" class="notice notice--error">
          {error}
        </p>
      )}

      {state === 'ready' && current && (
        <article class="flashcard" aria-labelledby="fc-front-label">
          <header class="flashcard__head">
            <span class="key">{current.id}</span>
            <span class="flashcard__topic">{titleOf.get(current.topic) ?? current.topic}</span>
          </header>
          <h2 id="fc-front-label" class="flashcard__label">
            Frage
          </h2>
          <div class="prose flashcard__face" dangerouslySetInnerHTML={{ __html: current.front }} />
          {!revealed ? (
            <div class="button-row">
              <button ref={revealRef} type="button" class="button" onClick={onReveal}>
                Antwort zeigen
              </button>
            </div>
          ) : (
            <>
              <div class="flashcard__back" role="group" ref={backRef} tabIndex={-1} aria-labelledby="fc-back-label">
                <h2 id="fc-back-label" class="flashcard__label">
                  Antwort
                </h2>
                <div class="prose flashcard__face" dangerouslySetInnerHTML={{ __html: current.back }} />
                {current.figure && <div dangerouslySetInnerHTML={{ __html: current.figure }} />}
              </div>
              <div class="rating" role="group" aria-labelledby="fc-rate-label">
                <p id="fc-rate-label" class="rating__label">
                  Wie gut wusstest du es?
                </p>
                <div class="rating__buttons">
                  {GRADES.map((g) => (
                    <button type="button" class={`button rating__button rating__button--${g}`} onClick={() => onRate(g)}>
                      {GRADE_LABEL[g]}
                      {previews && <span class="rating__hint"> {previews[g]}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </article>
      )}

      {state === 'empty' && (
        <div class="empty-state">
          {inFilter.length === 0 ? (
            <>
              <h2 ref={emptyRef} tabIndex={-1}>
                Keine Karten vorhanden
              </h2>
              <p>Zu dieser Auswahl gibt es noch keine Karteikarten.</p>
            </>
          ) : (
            <>
              <h2 ref={emptyRef} tabIndex={-1}>
                Keine Karten fällig
              </h2>
              <p>Alle fälligen Karten dieser Auswahl sind wiederholt.</p>
              {held > 0 && (
                <p>
                  Das Tageslimit für neue Karten ist erreicht, {held === 1 ? 'eine neue Karte wartet' : `${held} neue Karten warten`} bis
                  morgen. Das Limit änderst du in den <a href={withBase('einstellungen/')}>Einstellungen</a>.
                </p>
              )}
              {nextDue && <p class="meta">Nächste Karte fällig: {dateFormat.format(nextDue)}</p>}
            </>
          )}
        </div>
      )}

      {state === 'ready' && held > 0 && (
        <p class="meta">
          Tageslimit: {held === 1 ? 'eine weitere neue Karte folgt' : `${held} weitere neue Karten folgen`} an einem anderen Tag.
        </p>
      )}

      <p role="status" class="status-line">
        {message}
      </p>
    </section>
  );
}
