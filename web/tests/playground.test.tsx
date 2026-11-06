// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToString } from 'preact-render-to-string';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import Playground, { type PlaygroundDb, type PlaygroundTask } from '../src/components/Playground';
import { inProcessWorker } from './support/in-process-worker';

const ENGINE = { spawn: inProcessWorker };

// No generated snapshots in the tests: the expected result comes from the reference solution, except where a test sets one.
const snapshots = vi.hoisted(() => ({ map: new Map<string, unknown>() }));
vi.mock('../src/lib/snapshots', () => ({ loadSnapshot: async (id: string) => snapshots.map.get(id) ?? null }));

const dbDir = resolve(process.cwd(), '..', 'db');
const read = (name: string, file: string) => readFileSync(resolve(dbDir, name, file), 'utf8');
const DATABASES: PlaygroundDb[] = ['musikschule', 'firma'].map((name) => ({
  name: name as PlaygroundDb['name'],
  title: name === 'firma' ? 'Firma' : 'Musikschule',
  schema: read(name, 'schema.pg.sql'),
  seed: read(name, 'seed.sql'),
  diagramHtml: `<figure class="diagram"><div role="img" aria-label="ER-Diagramm ${name}"><svg></svg></div></figure>`,
}));

const base = {
  topic: 't04',
  tags: [],
  hintsHtml: [],
  ordered: false,
  engines: ['fb', 'pg'] as ('fb' | 'pg')[],
};
const TASKS: PlaygroundTask[] = [
  {
    ...base,
    id: 't04-s001',
    db: 'firma',
    kind: 'query',
    promptHtml: '<p>Gib die ersten drei Abteilungen alphabetisch aus.</p>',
    solution: 'SELECT FIRST 3 bezeichnung FROM abteilung ORDER BY bezeichnung;',
    solutionPg: 'SELECT bezeichnung FROM abteilung ORDER BY bezeichnung LIMIT 3;',
    dialectNoteHtml: 'FIRST ist Firebird, LIMIT PostgreSQL.',
    ordered: true,
    hintsHtml: ['Sortiere nach der Bezeichnung.', 'Begrenze die Zeilenzahl.'],
    paperMode: 'write',
  },
  {
    ...base,
    id: 't04-s002',
    db: 'firma',
    kind: 'dml',
    promptHtml: '<p>Lege die Abteilung Recht am Standort Nordstadt an.</p>',
    solution: "INSERT INTO abteilung (bezeichnung, standort) VALUES ('Recht', 'Nordstadt');",
    check: "SELECT abteilung_id, bezeichnung FROM abteilung WHERE bezeichnung = 'Recht'",
  },
  {
    ...base,
    id: 't04-s003',
    db: 'firma',
    kind: 'ddl',
    engines: ['fb'],
    promptHtml: '<p>Schreibe einen Trigger, der ...</p>',
    solution: 'CREATE TRIGGER trg ACTIVE BEFORE INSERT ON abteilung AS BEGIN END',
    check: 'SELECT 1',
    paperMode: 'write',
  },
];

const unit = (container: Element, name = 'playground') => {
  const el = container.querySelector<HTMLElement>(`[data-verify-unit="${name}"]`);
  if (!el) throw new Error(`${name} unit not found`);
  return el;
};
// Every mount builds a real PGlite instance (WebAssembly), which takes a few seconds on a loaded machine.
vi.setConfig({ testTimeout: 90_000 });
const w = (el: Element) => within(el as HTMLElement);
const READY = { timeout: 45_000 };
const sqlField = () => screen.getByRole('textbox', { name: /SQL-Anweisung/ }) as HTMLTextAreaElement;
const type = (field: HTMLElement, value: string) => fireEvent.input(field, { target: { value } });
const runButton = () => screen.getByRole('button', { name: /^Ausführen/ }) as HTMLButtonElement;

async function mount(props: Partial<Parameters<typeof Playground>[0]> = {}) {
  const view = render(<Playground tasks={TASKS} databases={DATABASES} topics={[{ id: 't04', title: 'ER-Modellierung' }]} codeMirror={false} engine={ENGINE} {...props} />);
  await waitFor(() => expect(unit(view.container).dataset.verifyState).toBe('ready'), READY);
  return view;
}

beforeAll(() => {
  // the url parameters (?task=, ?thema=) must not leak between tests
  window.history.replaceState(null, '', '/');
});
afterEach(() => {
  cleanup();
  snapshots.map.clear();
  window.history.replaceState(null, '', '/');
});

describe('Playground: contract and basics', () => {
  it('reports loading in the server HTML, then ready with the number of tasks', async () => {
    expect(renderToString(<Playground tasks={TASKS} databases={DATABASES} topics={[]} />)).toContain('data-verify-state="loading"');
    const { container } = await mount();
    const root = unit(container);
    expect(root.dataset.verifyCount).toBe(String(TASKS.length));
    expect(unit(container, 'sql-result').dataset.verifyState).toBe('empty');
    expect(unit(container, 'sql-result').dataset.verifyCount).toBe('0');
  });

  it('is empty (but usable) without tasks', async () => {
    const view = render(<Playground tasks={[]} databases={DATABASES} topics={[]} codeMirror={false} engine={ENGINE} />);
    await waitFor(() => expect(unit(view.container).dataset.verifyState).toBe('empty'), READY);
    expect(unit(view.container).dataset.verifyCount).toBe('0');
    type(sqlField(), 'SELECT 1 AS x');
    expect(runButton().disabled).toBe(false);
  });

  it('reports an error if the database cannot be built', async () => {
    const broken = [{ ...DATABASES[0], schema: 'CREATE TABLE kaputt (' }, DATABASES[1]];
    const view = render(<Playground tasks={[]} databases={broken} topics={[]} codeMirror={false} engine={ENGINE} />);
    await waitFor(() => expect(unit(view.container).dataset.verifyState).toBe('error'), READY);
    expect(unit(view.container).dataset.verifyError).toMatch(/Beispieldatenbank konnte nicht aufgebaut werden/);
    expect(screen.getByRole('alert').textContent).toMatch(/nicht aufgebaut/);
  });

  it('disables "Ausführen" for empty input and enables it with text', async () => {
    await mount();
    expect(runButton().disabled).toBe(true);
    type(sqlField(), '   ');
    expect(runButton().disabled).toBe(true);
    type(sqlField(), 'SELECT 1');
    expect(runButton().disabled).toBe(false);
  });

  it('shows the result table, NULL and the row count', async () => {
    const { container } = await mount();
    type(sqlField(), "SELECT 1 AS zahl, NULL AS leer, 'a' AS text, TRUE AS wahr, 'NULL' AS wort UNION ALL SELECT 2, NULL, 'b', FALSE, 'x' ORDER BY 1");
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyState).toBe('ready'), READY);
    const result = unit(container, 'sql-result');
    expect(result.dataset.verifyCount).toBe('2');
    const table = w(result).getByRole('table');
    expect(within(table).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['zahl', 'leer', 'text', 'wahr', 'wort']);
    const cells = within(table).getAllByRole('cell');
    expect(cells.slice(0, 5).map((c) => c.textContent)).toEqual(['1', 'NULL (kein Wert)', 'a', 'true', 'NULL']);
    // SQL NULL differs from the text 'NULL' not only by style: marked element plus hidden wording, and a legend
    expect(cells[1].querySelector('.pg-null')).toBeTruthy();
    expect(cells[4].querySelector('.pg-null')).toBeNull();
    expect(result.textContent).toMatch(/NULL im Rahmen.*kein Wert/);
    expect(result.textContent).toContain('2 Zeilen');
  });

  it('shows a syntax error in the result unit only; the playground itself stays ready', async () => {
    const { container } = await mount();
    type(sqlField(), 'SELEKT 1');
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyState).toBe('error'), READY);
    expect(unit(container, 'sql-result').dataset.verifyError).toMatch(/syntax error/i);
    expect(unit(container).dataset.verifyState).toBe('ready');
    expect(unit(container).dataset.verifyError).toBeUndefined();
    expect(screen.getByRole('alert').textContent).toMatch(/syntax error/i);
    // fixing the statement clears the error
    type(sqlField(), 'SELECT 1');
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyState).toBe('ready'), READY);
    expect(unit(container, 'sql-result').dataset.verifyError).toBeUndefined();
  });

  it('adds the PostgreSQL equivalent for Firebird syntax', async () => {
    const { container } = await mount();
    type(sqlField(), 'SELECT FIRST 3 * FROM abteilung');
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyState).toBe('error'), READY);
    const hint = w(container).getByRole('note', { name: /Firebird/ });
    expect(hint.textContent).toContain('LIMIT 3');
    expect(hint.textContent).toContain('FETCH FIRST 3 ROWS ONLY');
  });

  it('shows no dialect hint for ordinary errors', async () => {
    const { container } = await mount();
    type(sqlField(), 'SELECT * FROM gibtesnicht');
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyState).toBe('error'), READY);
    expect(w(container).queryByRole('note', { name: /Firebird/ })).toBeNull();
  });

  it('says how long free-practice changes last: until the page is left or the database is reset', async () => {
    await mount();
    const text = screen.getByText(/Freies Üben:/).textContent ?? '';
    expect(text).toMatch(/bis du die Seite verlässt oder neu lädst/);
    expect(text).toMatch(/zurücksetzt/);
  });

  it('resets the practice database to the seed state', async () => {
    const { container } = await mount();
    const resultState = () => unit(container, 'sql-result').dataset.verifyState;
    type(sqlField(), 'CREATE TABLE notiz (id int); INSERT INTO notiz VALUES (1); SELECT count(*) AS n FROM notiz');
    fireEvent.click(runButton());
    await waitFor(() => expect(resultState()).toBe('ready'), READY);
    type(sqlField(), 'SELECT count(*) AS n FROM notiz');
    fireEvent.click(runButton());
    await waitFor(() => expect(w(unit(container, 'sql-result')).getAllByRole('cell')[0].textContent).toBe('1'), READY);
    fireEvent.click(screen.getByRole('button', { name: /Datenbank zurücksetzen/ }));
    await waitFor(() => expect(unit(container).dataset.verifyState).toBe('ready'), READY);
    expect(resultState()).toBe('empty');
    fireEvent.click(runButton());
    await waitFor(() => expect(resultState()).toBe('error'), READY);
    expect(unit(container, 'sql-result').dataset.verifyError).toMatch(/notiz/);
  });
});

describe('Playground: tasks and auto-check', () => {
  // A task runs on its own check database, which has to be built first (the root unit is "loading" meanwhile).
  async function selectTask(id: string) {
    fireEvent.change(screen.getByLabelText('Aufgabe'), { target: { value: id } });
    await waitFor(() => expect(document.querySelector<HTMLElement>('[data-verify-unit="playground"]')?.dataset.verifyState).toBe('ready'), READY);
  }

  it('lists tasks and marks Firebird-only tasks', async () => {
    await mount();
    const options = within(screen.getByLabelText('Aufgabe')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual([
      'Freies Üben (ohne Aufgabe)',
      't04-s001',
      't04-s002',
      't04-s003 – nur Firebird (Papier/lokal)',
    ]);
  });

  it('shows prompt, both solutions (Firebird first, then PostgreSQL), note and step-wise hints', async () => {
    await mount();
    await selectTask('t04-s001');
    expect(screen.getByText('Gib die ersten drei Abteilungen alphabetisch aus.')).toBeTruthy();
    expect(screen.queryByText(/SELECT FIRST 3 bezeichnung/)).toBeNull();
    fireEvent.click(screen.getByText('Musterlösung anzeigen'));
    expect(screen.getByText(/SELECT FIRST 3 bezeichnung/)).toBeTruthy();
    expect(screen.getByText(/ORDER BY bezeichnung LIMIT 3/)).toBeTruthy();
    expect(screen.getByText('FIRST ist Firebird, LIMIT PostgreSQL.')).toBeTruthy();
    // hints one by one
    expect(screen.queryByText('Sortiere nach der Bezeichnung.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Hinweis anzeigen \(1 von 2\)/ }));
    expect(screen.getByText('Sortiere nach der Bezeichnung.')).toBeTruthy();
    expect(screen.queryByText('Begrenze die Zeilenzahl.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Hinweis anzeigen \(2 von 2\)/ }));
    expect(screen.getByText('Begrenze die Zeilenzahl.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Hinweis anzeigen/ })).toBeNull();
  });

  it('accepts a correct answer (expected result derived from the reference solution)', async () => {
    const { container } = await mount();
    await selectTask('t04-s001');
    type(sqlField(), 'SELECT bezeichnung FROM abteilung ORDER BY bezeichnung LIMIT 3');
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyState).toBe('ready'), READY);
    expect(w(container).getByRole('status').textContent).toMatch(/Richtig/);
    expect(unit(container, 'sql-result').dataset.verifyVerdict).toBe('correct');
  });

  it('rejects a wrong answer with a reason, order matters for ordered tasks', async () => {
    const { container } = await mount();
    await selectTask('t04-s001');
    type(sqlField(), 'SELECT bezeichnung FROM abteilung ORDER BY bezeichnung DESC LIMIT 3');
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyState).toBe('ready'), READY);
    expect(w(container).getByRole('status').textContent).toMatch(/Noch nicht richtig/);
    expect(w(container).getByRole('status').textContent).toMatch(/Zeile 1 weicht ab/);
    expect(unit(container, 'sql-result').dataset.verifyVerdict).toBe('wrong');
  });

  it('prefers the generated snapshot', async () => {
    snapshots.map.set('t04-s001', { cols: ['x'], rows: [[42]], ordered: true });
    const { container } = await mount();
    await selectTask('t04-s001');
    type(sqlField(), 'SELECT 42 AS irgendwas');
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyVerdict).toBe('correct'), READY);
  });

  it('checks DML tasks against the check query on the seed state, every time the same', async () => {
    const { container } = await mount();
    await selectTask('t04-s002');
    type(sqlField(), "INSERT INTO abteilung (bezeichnung, standort) VALUES ('Recht', 'Nordstadt')");
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyVerdict).toBe('correct'), READY);
    expect(w(unit(container, 'sql-result')).getAllByRole('cell').map((c) => c.textContent)).toEqual(['7', 'Recht']);
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyVerdict).toBe('correct'), READY);
    // an INSERT with an explicit id gives another row, which the check query exposes
    type(sqlField(), "INSERT INTO abteilung (abteilung_id, bezeichnung, standort) VALUES (99, 'Recht', 'Nordstadt')");
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyVerdict).toBe('wrong'), READY);
  });

  it('marks Firebird-only tasks as paper/local and cannot run them', async () => {
    const { container } = await mount();
    await selectTask('t04-s003');
    expect(w(container).getByRole('note', { name: 'Nur Firebird' }).textContent).toMatch(/Papier|lokal/);
    expect(unit(container, 'sql-task').dataset.verifyEngines).toBe('fb');
    type(sqlField(), 'CREATE TRIGGER x');
    expect(runButton().disabled).toBe(true);
    expect((screen.getByRole('checkbox', { name: /Ohne Rechner/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: /Ohne Rechner/ }) as HTMLInputElement).disabled).toBe(true);
    // the model solution is still available, no check happens
    fireEvent.click(screen.getByText('Musterlösung anzeigen'));
    expect(screen.getByText(/CREATE TRIGGER trg/)).toBeTruthy();
    expect(screen.queryByText(/PostgreSQL-Variante/)).toBeNull();
    expect(unit(container, 'sql-result').dataset.verifyState).toBe('empty');
  });

  it('preselects task and topic from the URL', async () => {
    window.history.replaceState(null, '', '/playground/?task=t04-s002');
    await mount();
    await waitFor(() => expect((screen.getByLabelText('Aufgabe') as HTMLSelectElement).value).toBe('t04-s002'));
    expect(screen.getByText('Lege die Abteilung Recht am Standort Nordstadt an.')).toBeTruthy();
  });
});

describe('Playground: "Ohne Rechner" mode', () => {
  it('locks "Ausführen" until text is there and the prediction has been recorded', async () => {
    const { container } = await mount();
    const toggle = screen.getByRole('checkbox', { name: /Ohne Rechner/ }) as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    fireEvent.click(toggle);
    expect(runButton().disabled).toBe(true);
    // SQL alone is not enough
    type(sqlField(), 'SELECT 1 AS x');
    expect(runButton().disabled).toBe(true);
    const record = screen.getByRole('button', { name: 'Vorhersage festhalten' }) as HTMLButtonElement;
    expect(record.disabled).toBe(true);
    type(screen.getByRole('textbox', { name: /Vorhersage/ }), 'Eine Zeile mit der Zahl 1.');
    expect(record.disabled).toBe(false);
    expect(runButton().disabled).toBe(true);
    fireEvent.click(record);
    expect(runButton().disabled).toBe(false);
    expect((screen.getByRole('textbox', { name: /Vorhersage/ }) as HTMLTextAreaElement).readOnly).toBe(true);
    fireEvent.click(runButton());
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyState).toBe('ready'), READY);
    // prediction and result stand side by side
    expect(w(unit(container, 'sql-result')).getByText('Eine Zeile mit der Zahl 1.')).toBeTruthy();
    // changing the prediction locks the run button again
    fireEvent.click(screen.getByRole('button', { name: 'Vorhersage ändern' }));
    expect(runButton().disabled).toBe(true);
  });

  it('turning the mode off unlocks the button again', async () => {
    await mount();
    type(sqlField(), 'SELECT 1');
    const toggle = screen.getByRole('checkbox', { name: /Ohne Rechner/ });
    fireEvent.click(toggle);
    expect(runButton().disabled).toBe(true);
    fireEvent.click(toggle);
    expect(runButton().disabled).toBe(false);
  });
  it('says that the query is running and how to cancel it, and removes the note afterwards', async () => {
    const { container } = await mount();
    type(sqlField(), 'SELECT pg_sleep(1.2), 1 AS x');
    fireEvent.click(runButton());
    const note = await screen.findByText(/Abfrage läuft/);
    expect(note.closest('[aria-live="polite"]')).toBeTruthy();
    // the database runs in a worker: the page stays usable, a statement is aborted after 10 s
    expect(note.closest('[aria-live="polite"]')!.textContent).toMatch(/nach 10 Sekunden/i);
    expect(note.closest('[aria-live="polite"]')!.textContent).not.toMatch(/blockiert/);
    expect(unit(container, 'sql-result').dataset.verifyState).toBe('loading');
    expect(runButton().disabled).toBe(true);
    await waitFor(() => expect(unit(container, 'sql-result').dataset.verifyState).toBe('ready'), READY);
    expect(screen.queryByText(/Abfrage läuft/)).toBeNull();
    expect(runButton().disabled).toBe(false);
  });
});
