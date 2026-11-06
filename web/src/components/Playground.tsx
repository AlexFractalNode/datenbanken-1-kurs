import { useEffect, useRef, useState } from 'preact/hooks';
import { hint as dialectHint } from '../lib/dialect';
import { openDatabase, type CheckRun, type Database, type RunResult } from '../lib/pg-engine';
import { equal, type ExpectedResult } from '../lib/sqlcheck';
import { loadSnapshot } from '../lib/snapshots';
import { topicFromUrl, writeTopicToUrl, type TopicOption } from '../lib/topic-filter';
import SqlEditor from './SqlEditor';

export interface PlaygroundTask {
  id: string;
  topic: string;
  db: 'musikschule' | 'firma';
  kind: 'query' | 'ddl' | 'dml';
  tags: string[];
  /** Sanitised HTML (rendered at build time). */
  promptHtml: string;
  /** Firebird solution (reference). */
  solution: string;
  /** PostgreSQL variant, only if the syntax differs. */
  solutionPg?: string;
  dialectNoteHtml?: string;
  hintsHtml: string[];
  ordered: boolean;
  check?: string;
  engines: ('fb' | 'pg')[];
  paperMode?: 'write' | 'predict';
}

export interface PlaygroundDb {
  name: 'musikschule' | 'firma';
  title: string;
  schema: string;
  seed: string;
  /** Chen diagram as inline SVG figure, rendered at build time. */
  diagramHtml: string;
}

interface Props {
  tasks: PlaygroundTask[];
  databases: PlaygroundDb[];
  topics: TopicOption[];
  /** false: plain textarea instead of CodeMirror (tests). */
  codeMirror?: boolean;
}

type EngineState = { status: 'loading' | 'ready' } | { status: 'error'; error: string };
type Verdict = { kind: 'correct' | 'wrong' | 'unchecked'; text: string };
type Phase =
  | { state: 'idle' }
  | { state: 'running' }
  | { state: 'error'; error: string; hint: string | null }
  | { state: 'done'; shown: RunResult; verdict: Verdict | null; caption: string; prediction: string | null };

const KIND_LABEL = { query: 'Abfrage', ddl: 'Tabellen anlegen/ändern (DDL)', dml: 'Daten ändern (DML)' } as const;
const MAX_ROWS = 200;
const RUN_HELP_ID = 'pg-run-help';
const KEY_HELP_ID = 'pg-key-help';

/** `code` in backticks becomes <code> (hint texts); everything else stays text. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) => (i % 2 === 1 ? <code key={i}>{part}</code> : part))}
    </>
  );
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function cellText(v: unknown) {
  if (v === null) return <i class="pg-null">NULL</i>;
  return String(v);
}

function ResultTable({ result }: { result: RunResult }) {
  const shown = result.rows.slice(0, MAX_ROWS);
  return (
    <>
      <div class="pg-scroll" role="region" aria-label="Ergebnistabelle" tabIndex={0}>
        <table class="pg-table">
          <thead>
            <tr>
              {result.cols.map((c, i) => (
                <th scope="col" key={i}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, r) => (
              <tr key={r}>
                {row.map((v, c) => (
                  <td key={c}>{cellText(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.rows.length > MAX_ROWS && (
        <p class="meta">
          Angezeigt werden die ersten {MAX_ROWS} von {result.rows.length} Zeilen.
        </p>
      )}
    </>
  );
}

export default function Playground({ tasks, databases, topics, codeMirror = true }: Props) {
  const [taskId, setTaskId] = useState('');
  const [topic, setTopic] = useState('');
  const [dbName, setDbName] = useState<PlaygroundDb['name']>(databases[0]?.name ?? 'musikschule');
  const [sql, setSql] = useState('');
  const [syncKey, setSyncKey] = useState(0);
  const [paper, setPaper] = useState(false);
  const [prediction, setPrediction] = useState('');
  const [committed, setCommitted] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [engine, setEngine] = useState<EngineState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>({ state: 'idle' });

  const dbs = useRef(new Map<string, Promise<Database>>());
  const expected = useRef(new Map<string, ExpectedResult | null>());
  const drafts = useRef(new Map<string, string>());
  const runId = useRef(0);

  const task = tasks.find((t) => t.id === taskId);
  const effDb = task ? task.db : dbName;
  const fbOnly = !!task && !task.engines.includes('pg');
  const paperOn = paper || fbOnly;
  const visibleTasks = topic ? tasks.filter((t) => t.topic === topic) : tasks;
  const dbInfo = databases.find((d) => d.name === effDb);

  // --- databases ---------------------------------------------------------------------------

  function ensure(kind: 'work' | 'check', name: string): Promise<Database> {
    const key = `${kind}:${name}`;
    let p = dbs.current.get(key);
    if (!p) {
      const source = databases.find((d) => d.name === name);
      if (!source) return Promise.reject(new Error(`Die Beispieldatenbank ${name} fehlt.`));
      p = openDatabase(source);
      const created = p;
      created.catch(() => {
        if (dbs.current.get(key) === created) dbs.current.delete(key);
      });
      dbs.current.set(key, p);
    }
    return p;
  }

  async function drop(key: string): Promise<void> {
    const p = dbs.current.get(key);
    dbs.current.delete(key);
    if (p) (await p.catch(() => null))?.close();
  }

  // The instance this view needs next: tasks run on a check database (always the seed state), free practice on the work database.
  const needs = task ? 'check' : 'work';
  useEffect(() => {
    let alive = true;
    setEngine({ status: 'loading' });
    for (const d of databases) if (d.name !== effDb) void drop(`check:${d.name}`); // keep memory low
    ensure(needs, effDb).then(
      () => alive && setEngine({ status: 'ready' }),
      (err) => alive && setEngine({ status: 'error', error: String(err?.message ?? err) }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needs, effDb, attempt]);

  useEffect(
    () => () => {
      for (const key of [...dbs.current.keys()]) void drop(key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Deep links: ?task=t10-s001 and ?thema=t10
  useEffect(() => {
    let wanted = '';
    try {
      wanted = new URLSearchParams(window.location.search).get('task') ?? '';
    } catch {
      /* no URL, no deep link */
    }
    const t = topicFromUrl();
    if (t && tasks.some((x) => x.topic === t)) setTopic(t);
    const found = tasks.find((x) => x.id === wanted);
    if (found) {
      setTopic(found.topic);
      pick(found.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- actions -----------------------------------------------------------------------------

  function pick(id: string) {
    drafts.current.set(taskId, sql);
    const next = tasks.find((t) => t.id === id);
    runId.current += 1;
    setTaskId(id);
    if (next) setDbName(next.db);
    setSql(drafts.current.get(id) ?? '');
    setSyncKey((n) => n + 1);
    setPrediction('');
    setCommitted(false);
    setHintsShown(0);
    setSolutionOpen(false);
    setPhase({ state: 'idle' });
  }

  function changeTopic(id: string) {
    setTopic(id);
    writeTopicToUrl(id);
    if (task && id && task.topic !== id) pick('');
  }

  function togglePaper(on: boolean) {
    setPaper(on);
    if (!on) setCommitted(false);
  }

  async function reset() {
    runId.current += 1;
    setEngine({ status: 'loading' });
    setPhase({ state: 'idle' });
    await Promise.all(databases.map((d) => drop(`work:${d.name}`)));
    setAttempt((n) => n + 1);
  }

  async function expectedFor(t: PlaygroundTask, checker: Database): Promise<ExpectedResult | null> {
    if (expected.current.has(t.id)) return expected.current.get(t.id) ?? null;
    let exp = await loadSnapshot(t.id);
    if (!exp) {
      // no snapshot: derive the expected result from the reference solution on the same seed state
      const ref = await checker.check({ sql: t.solutionPg ?? t.solution, kind: t.kind, check: t.check });
      const res = t.kind === 'query' ? ref.user : ref.after;
      if (!ref.user.error && res && !res.error && res.cols.length > 0) exp = { cols: res.cols, rows: res.rows, ordered: t.ordered };
    }
    expected.current.set(t.id, exp);
    return exp;
  }

  async function judge(t: PlaygroundTask, checker: Database, out: CheckRun): Promise<Verdict> {
    const actual = t.kind === 'query' ? out.user : out.after;
    if (!actual || actual.error) {
      return { kind: 'unchecked', text: 'Diese Aufgabe hat keine Prüfabfrage. Vergleiche dein Ergebnis mit der Musterlösung.' };
    }
    const exp = await expectedFor(t, checker);
    if (!exp) return { kind: 'unchecked', text: 'Für diese Aufgabe gibt es keinen Vergleichswert. Vergleiche dein Ergebnis mit der Musterlösung.' };
    const outcome = equal(actual, exp);
    return outcome.ok
      ? { kind: 'correct', text: 'Richtig: Dein Ergebnis stimmt mit dem erwarteten überein.' }
      : { kind: 'wrong', text: `Noch nicht richtig: ${outcome.reason ?? 'Das Ergebnis weicht ab.'}` };
  }

  async function run() {
    if (blocked || phase.state === 'running') return;
    const id = (runId.current += 1);
    const ranSql = sql;
    const predicted = paperOn && committed ? prediction : null;
    setPhase({ state: 'running' });
    const fail = (error: string) => {
      if (id === runId.current) setPhase({ state: 'error', error, hint: dialectHint(error, ranSql) });
    };
    try {
      if (!task) {
        const r = await (await ensure('work', effDb)).run(ranSql);
        if (id !== runId.current) return;
        if (r.error) return fail(r.error);
        setPhase({ state: 'done', shown: r, verdict: null, caption: 'Ergebnis', prediction: predicted });
        return;
      }
      const checker = await ensure('check', effDb);
      const out = await checker.check({ sql: ranSql, kind: task.kind, check: task.check });
      if (id !== runId.current) return;
      if (out.user.error) return fail(out.user.error);
      const verdict = await judge(task, checker, out);
      if (id !== runId.current) return;
      const afterShown = task.kind !== 'query' && out.after && !out.after.error;
      setPhase({
        state: 'done',
        shown: afterShown ? out.after! : out.user,
        verdict,
        caption: afterShown ? 'Ergebnis der Prüfabfrage nach deiner Anweisung' : 'Ergebnis',
        prediction: predicted,
      });
    } catch (err) {
      fail(String((err as { message?: unknown })?.message ?? err));
    }
  }

  // --- derived state -----------------------------------------------------------------------

  const running = phase.state === 'running';
  let blocked: string | null = null;
  if (fbOnly) {
    blocked = 'Diese Aufgabe gibt es nur für Firebird. Bearbeite sie auf Papier oder in einer lokalen Firebird-Installation; hier lässt sie sich nicht ausführen.';
  } else if (engine.status === 'loading') {
    blocked = 'Die Datenbank wird geladen …';
  } else if (engine.status === 'error') {
    blocked = 'Die Datenbank konnte nicht geladen werden.';
  } else if (sql.trim() === '') {
    blocked = 'Gib zuerst eine SQL-Anweisung ein.';
  } else if (paperOn && !committed) {
    blocked = prediction.trim() === '' ? 'Ohne Rechner: Schreibe zuerst deine Vorhersage und halte sie fest.' : 'Ohne Rechner: Halte deine Vorhersage fest, dann kannst du ausführen.';
  }

  const failure = engine.status === 'error' ? engine.error : phase.state === 'error' ? phase.error : null;
  const rootState = failure !== null ? 'error' : engine.status === 'loading' || running ? 'loading' : tasks.length === 0 ? 'empty' : 'ready';

  const resultState = phase.state === 'idle' ? 'empty' : phase.state === 'running' ? 'loading' : phase.state === 'error' ? 'error' : 'ready';
  const resultCount = phase.state === 'done' ? phase.shown.rows.length : 0;
  const verdictKind = phase.state === 'done' ? (phase.verdict?.kind ?? 'none') : 'none';

  const nextHint = task && hintsShown < task.hintsHtml.length ? hintsShown + 1 : 0;

  return (
    <div
      class="playground"
      data-verify-unit="playground"
      data-verify-state={rootState}
      data-verify-count={tasks.length}
      {...(failure !== null ? { 'data-verify-error': failure } : {})}
    >
      <div class="pg-col">
      <section class="pg-panel card" aria-labelledby="pg-task-heading">
        <h2 id="pg-task-heading">Übung</h2>
        <div class="pg-controls">
          {topics.length > 1 && (
            <div class="field">
              <label for="pg-topic">Thema</label>
              <select id="pg-topic" value={topic} onChange={(e) => changeTopic((e.currentTarget as HTMLSelectElement).value)}>
                <option value="">Alle Themen</option>
                {topics.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.id} {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div class="field">
            <label for="pg-task">Aufgabe</label>
            <select id="pg-task" value={taskId} onChange={(e) => pick((e.currentTarget as HTMLSelectElement).value)}>
              <option value="">Freies Üben (ohne Aufgabe)</option>
              {visibleTasks.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.id}
                  {t.tags.length > 0 ? ` · ${t.tags.join(', ')}` : ''}
                  {t.engines.includes('pg') ? '' : ' – nur Firebird (Papier/lokal)'}
                </option>
              ))}
            </select>
          </div>
          {!task && databases.length > 1 && (
            <fieldset class="segmented">
              <legend>Beispieldatenbank</legend>
              <div class="segmented__options">
                {databases.map((d) => (
                  <label class="segmented__option" key={d.name}>
                    <input type="radio" name="pg-db" value={d.name} checked={dbName === d.name} onChange={() => setDbName(d.name)} />
                    <span>{d.title}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        {task ? (
          <div class="pg-task" data-verify-unit="sql-task" data-verify-state="ready" data-verify-count={task.hintsHtml.length} data-verify-engines={task.engines.join(',')}>
            <p class="pg-task__facts">
              <span class="key">{task.id}</span> <span class="badge">{dbInfo?.title ?? task.db}</span> <span class="badge">{KIND_LABEL[task.kind]}</span>{' '}
              <span class="badge">{task.kind === 'query' ? (task.ordered ? 'Reihenfolge der Zeilen zählt' : 'Reihenfolge der Zeilen egal') : 'Prüfung über eine Abfrage'}</span>
            </p>
            <div class="prose" dangerouslySetInnerHTML={{ __html: task.promptHtml }} />
            {fbOnly && (
              <div class="notice notice--warn" role="note" aria-label="Nur Firebird">
                <strong>Nur Firebird.</strong> Diese Aufgabe nutzt Firebird-Eigenheiten und läuft nicht in PostgreSQL. Schreibe die Lösung auf Papier (oder lokal in Firebird) und vergleiche sie dann mit der Musterlösung. Eine automatische Prüfung gibt es hier nicht.
              </div>
            )}
            {!fbOnly && task.paperMode && !paper && (
              <p class="meta">
                Diese Aufgabe ist auch für Papier gedacht ({task.paperMode === 'predict' ? 'Ergebnis vorhersagen' : 'Anweisung zuerst aufschreiben'}). Schalte „Ohne Rechner“ ein, um erst zu denken und dann zu prüfen.
              </p>
            )}
            {!fbOnly && <p class="meta">Aufgaben laufen immer auf dem frischen Ausgangszustand der Datenbank; deine Änderungen bleiben nicht erhalten.</p>}
            <div class="pg-help">
              {nextHint > 0 && (
                <button type="button" class="button button--ghost" onClick={() => setHintsShown(nextHint)}>
                  Hinweis anzeigen ({nextHint} von {task.hintsHtml.length})
                </button>
              )}
              <button type="button" class="button button--ghost" aria-expanded={solutionOpen} aria-controls="pg-solution" onClick={() => setSolutionOpen((o) => !o)}>
                {solutionOpen ? 'Musterlösung verbergen' : 'Musterlösung anzeigen'}
              </button>
            </div>
            {hintsShown > 0 && (
              <ol class="pg-hints" aria-label="Hinweise">
                {task.hintsHtml.slice(0, hintsShown).map((h, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: h }} />
                ))}
              </ol>
            )}
            <div id="pg-solution" role="group" aria-label="Musterlösung" hidden={!solutionOpen}>
              {solutionOpen && (
                <>
                  <h3 class="pg-sub">Firebird-Lösung</h3>
                  <pre class="pg-code" tabIndex={0}>
                    <code>{task.solution}</code>
                  </pre>
                  {task.solutionPg && (
                    <>
                      <h3 class="pg-sub">PostgreSQL-Variante (läuft im Playground)</h3>
                      <pre class="pg-code" tabIndex={0}>
                        <code>{task.solutionPg}</code>
                      </pre>
                    </>
                  )}
                  {!task.solutionPg && !fbOnly && <p class="meta">Die Lösung läuft unverändert auch in PostgreSQL.</p>}
                  {task.dialectNoteHtml && <p class="meta" dangerouslySetInnerHTML={{ __html: task.dialectNoteHtml }} />}
                </>
              )}
            </div>
          </div>
        ) : (
          <p class="meta">
            Freies Üben: Probiere SQL auf der Beispieldatenbank aus. Änderungen bleiben erhalten, bis du die Datenbank zurücksetzt. Oder wähle oben eine Aufgabe mit automatischer Prüfung.
          </p>
        )}
      </section>

      <section class="pg-panel card" aria-labelledby="pg-edit-heading">
        <h2 id="pg-edit-heading">Deine Lösung</h2>
        <div class="field">
          <label id="pg-sql-label" for="pg-sql">
            SQL-Anweisung
          </label>
          <SqlEditor
            id="pg-sql"
            labelId="pg-sql-label"
            value={sql}
            syncKey={syncKey}
            onInput={setSql}
            onRun={() => void run()}
            describedBy={`${KEY_HELP_ID} ${RUN_HELP_ID}`}
            codeMirror={codeMirror}
            placeholder="SELECT ..."
          />
          <p class="meta" id={KEY_HELP_ID}>
            Tastatur: Strg + Enter (Mac: Cmd + Enter) führt aus. Mit Tab verlässt du das Feld.
          </p>
        </div>

        <div class="field pg-mode">
          <label class="pg-check">
            <input type="checkbox" checked={paperOn} disabled={fbOnly} onChange={(e) => togglePaper((e.currentTarget as HTMLInputElement).checked)} />
            <span>Ohne Rechner (erst vorhersagen, dann ausführen)</span>
          </label>
        </div>

        {paperOn && !fbOnly && (
          <div class="field pg-predict">
            <label for="pg-prediction">Deine Vorhersage: Was liefert deine Anweisung?</label>
            <textarea id="pg-prediction" rows={3} value={prediction} readOnly={committed} onInput={(e) => setPrediction((e.currentTarget as HTMLTextAreaElement).value)} />
            {committed ? (
              <div>
                <button type="button" class="button button--ghost" onClick={() => setCommitted(false)}>
                  Vorhersage ändern
                </button>
              </div>
            ) : (
              <div>
                <button type="button" class="button button--ghost" disabled={sql.trim() === '' || prediction.trim() === ''} onClick={() => setCommitted(true)}>
                  Vorhersage festhalten
                </button>
              </div>
            )}
          </div>
        )}

        <div class="button-row">
          <button type="button" class="button" disabled={blocked !== null || running} aria-describedby={RUN_HELP_ID} onClick={() => void run()}>
            Ausführen
          </button>
          <button type="button" class="button button--ghost" onClick={() => void reset()}>
            Datenbank zurücksetzen
          </button>
        </div>
        <p class="meta" id={RUN_HELP_ID}>
          {blocked ?? 'Bereit.'} Das Zurücksetzen betrifft das freie Üben; Aufgaben starten ohnehin immer vom Ausgangszustand.
        </p>
        {engine.status === 'error' && (
          <div class="notice notice--error" role="alert">
            <p>{engine.error}</p>
            <button type="button" class="button button--ghost" onClick={() => setAttempt((n) => n + 1)}>
              Erneut laden
            </button>
          </div>
        )}
      </section>

      </div>
      <div class="pg-col">
      <section
        class="pg-panel card pg-result"
        aria-labelledby="pg-result-heading"
        data-verify-unit="sql-result"
        data-verify-state={resultState}
        data-verify-count={resultCount}
        data-verify-verdict={verdictKind}
        {...(phase.state === 'error' ? { 'data-verify-error': phase.error } : {})}
      >
        <h2 id="pg-result-heading">Ergebnis</h2>
        <div role="status" class={`pg-verdict pg-verdict--${verdictKind}`}>
          {phase.state === 'done' && phase.verdict ? phase.verdict.text : ''}
        </div>
        {phase.state === 'idle' && <p class="meta">Noch nichts ausgeführt. Das Ergebnis erscheint hier.</p>}
        {phase.state === 'running' && <p class="meta">Läuft …</p>}
        {phase.state === 'error' && (
          <>
            <div class="notice notice--error" role="alert">
              <strong>Fehler:</strong> <code class="pg-error">{phase.error}</code>
            </div>
            {phase.hint && (
              <div class="notice notice--info" role="note" aria-label="Hinweis zu Firebird-Syntax">
                <strong>Firebird-Syntax?</strong> <Inline text={phase.hint} />
              </div>
            )}
          </>
        )}
        {phase.state === 'done' && (
          <>
            {phase.prediction && (
              <div class="pg-prediction">
                <h3 class="pg-sub">Deine Vorhersage</h3>
                <p>{phase.prediction}</p>
              </div>
            )}
            {phase.shown.cols.length > 0 ? (
              <>
                <h3 class="pg-sub">{phase.caption}</h3>
                <p class="meta">
                  {plural(phase.shown.rows.length, 'Zeile', 'Zeilen')}, {plural(phase.shown.cols.length, 'Spalte', 'Spalten')}
                </p>
                <ResultTable result={phase.shown} />
              </>
            ) : (
              <p>
                Ausgeführt.
                {phase.shown.affected !== undefined && ` ${plural(phase.shown.affected, 'Zeile', 'Zeilen')} betroffen.`} Die Anweisung liefert keine Ergebnistabelle.
              </p>
            )}
          </>
        )}
      </section>

      {dbInfo && (
        <section class="pg-panel card pg-schema" aria-labelledby="pg-schema-heading" data-verify-unit="sql-schema" data-verify-state="ready" data-verify-count={1}>
          <h2 id="pg-schema-heading">Schema: {dbInfo.title}</h2>
          {dbInfo.diagramHtml && <div dangerouslySetInnerHTML={{ __html: dbInfo.diagramHtml }} />}
          <details>
            <summary>Tabellen als SQL anzeigen</summary>
            <pre class="pg-code" tabIndex={0}>
              <code>{dbInfo.schema}</code>
            </pre>
          </details>
        </section>
      )}
      </div>
    </div>
  );
}
