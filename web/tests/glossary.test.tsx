// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Glossary from '../src/components/Glossary';
import type { GlossaryEntry } from '../src/lib/content';
import { buildGlossaryItems, filterGlossary, letterOf, parseDefinition, searchKey } from '../src/lib/glossary';

const hrefTopic = (id: string) => `/datenbanken-1-kurs/themen/${id}/`;

function entry(id: string, de: string, en: string, def: string, keep = false): GlossaryEntry {
  return { id, de, en, keep_english: keep, def_de: def, def_en: `EN ${def}` };
}

const ENTRIES: GlossaryEntry[] = [
  entry('g-rolle', 'Rolle (ER)', 'role', 'Funktion eines Entitätstyps. Nicht die Rolle der Rechteverwaltung (siehe g-rolle-rechte). (t04)'),
  entry('g-rolle-rechte', 'Rolle (Rechte)', 'role', 'Bündel von Rechten, siehe auch g-gibt-es-nicht und <b>fett</b>. (t13)'),
  entry('g-join', 'Join', 'join', 'Verknüpfung zweier Relationen. (t08, t10)', true),
  entry('g-aepfel', 'Ärger-Index', 'index', 'Sortiert unter A. (t12)'),
  entry('g-schluessel', 'Schlüssel', 'key', 'Eindeutig, siehe g-join.'),
];
const TOPIC_IDS = new Set(['t04', 't08', 't10', 't12', 't13']);

describe('parseDefinition', () => {
  it('splits the trailing topic reference off', () => {
    expect(parseDefinition('Text. (t04)', TOPIC_IDS)).toEqual({ text: 'Text.', topics: ['t04'] });
    expect(parseDefinition('Text. (t08, t10)', TOPIC_IDS)).toEqual({ text: 'Text.', topics: ['t08', 't10'] });
  });

  it('keeps unknown topics in the text and leaves definitions without reference alone', () => {
    expect(parseDefinition('Text. (t99)', TOPIC_IDS)).toEqual({ text: 'Text. (t99)', topics: [] });
    expect(parseDefinition('Text ohne Verweis.', TOPIC_IDS)).toEqual({ text: 'Text ohne Verweis.', topics: [] });
  });
});

describe('buildGlossaryItems', () => {
  const items = buildGlossaryItems(ENTRIES, TOPIC_IDS, hrefTopic);
  const byId = (id: string) => items.find((i) => i.id === id)!;

  it('turns "siehe g-…" into anchor links for known ids only', () => {
    const html = byId('g-rolle').defHtml;
    expect(html).toContain('siehe <a href="#g-rolle-rechte">Rolle (Rechte)</a>');
    expect(byId('g-schluessel').defHtml).toContain('<a href="#g-join">Join</a>');
    expect(byId('g-rolle-rechte').defHtml).toContain('g-gibt-es-nicht');
    expect(byId('g-rolle-rechte').defHtml).not.toContain('href="#g-gibt-es-nicht"');
  });

  it('escapes HTML in definitions', () => {
    const html = byId('g-rolle-rechte').defHtml;
    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;fett&lt;/b&gt;');
  });

  it('links topics and exposes the letter and search text', () => {
    expect(byId('g-join').topics).toEqual([
      { id: 't08', href: '/datenbanken-1-kurs/themen/t08/' },
      { id: 't10', href: '/datenbanken-1-kurs/themen/t10/' },
    ]);
    expect(byId('g-join').keepEnglish).toBe(true);
    expect(byId('g-aepfel').letter).toBe('A');
    expect(byId('g-rolle').letter).toBe('R');
  });

  it('sorts by German term', () => {
    expect(items.map((i) => i.id)).toEqual(['g-aepfel', 'g-join', 'g-rolle', 'g-rolle-rechte', 'g-schluessel']);
  });
});

describe('letterOf and searchKey', () => {
  it('groups umlauts with their base letter and others under #', () => {
    expect(letterOf('Ärger')).toBe('A');
    expect(letterOf('über')).toBe('U');
    expect(letterOf('3NF')).toBe('#');
    expect(letterOf('1:n-Beziehung')).toBe('#');
  });

  it('ignores case and diacritics for searching', () => {
    expect(searchKey('Entitätstyp')).toBe(searchKey('ENTITATSTYP'));
    expect(searchKey('Straße')).toContain('strasse');
  });
});

describe('filterGlossary', () => {
  const items = buildGlossaryItems(ENTRIES, TOPIC_IDS, hrefTopic);

  it('matches German term, English term, definition and id; all words must match', () => {
    const ids = (q: string, topic = '') => filterGlossary(items, q, topic).map((i) => i.id);
    expect(ids('')).toHaveLength(5);
    expect(ids('join')).toEqual(['g-join', 'g-schluessel']); // term + "siehe g-join" is in the definition
    expect(ids('aerger')).toEqual([]); // ae is not ä
    expect(ids('ärger')).toEqual(['g-aepfel']);
    expect(ids('ROLLE rechte')).toEqual(['g-rolle', 'g-rolle-rechte']);
    expect(ids('verknüpfung relationen')).toEqual(['g-join']);
    expect(ids('zzz')).toEqual([]);
  });

  it('filters by topic', () => {
    expect(filterGlossary(items, '', 't10').map((i) => i.id)).toEqual(['g-join']);
    expect(filterGlossary(items, 'rolle', 't04').map((i) => i.id)).toEqual(['g-rolle']);
  });
});

function unit(container: Element): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-verify-unit="glossary"]');
  if (!el) throw new Error('glossary unit not found');
  return el;
}

beforeEach(() => window.history.replaceState(null, '', '/datenbanken-1-kurs/glossar/'));
afterEach(() => cleanup());

describe('Glossary island', () => {
  const items = buildGlossaryItems(ENTRIES, TOPIC_IDS, hrefTopic);
  const topics = [
    { id: 't04', title: 'ER' },
    { id: 't10', title: 'DQL' },
  ];

  it('lists all entries with anchors and is ready', async () => {
    const { container } = render(<Glossary items={items} topics={topics} />);
    await waitFor(() => expect(unit(container).dataset.verifyState).toBe('ready'));
    expect(unit(container).dataset.verifyCount).toBe('5');
    for (const item of items) expect(container.querySelector(`dt#${item.id}`)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Rolle (Rechte)' }).getAttribute('href')).toBe('#g-rolle-rechte');
    expect(container.querySelector('nav[aria-label="Buchstaben"]')).toBeTruthy();
  });

  it('filters while typing and announces the number of hits', async () => {
    const { container } = render(<Glossary items={items} topics={topics} />);
    fireEvent.input(screen.getByLabelText('Begriff suchen'), { target: { value: 'rolle' } });
    await waitFor(() => expect(unit(container).dataset.verifyCount).toBe('2'));
    expect(screen.getByRole('status').textContent).toContain('2 von 5');
    expect(container.querySelector('dt#g-join')).toBeNull();
  });

  it('shows an empty state without hits and recovers when the filter is reset', async () => {
    const { container } = render(<Glossary items={items} topics={topics} />);
    fireEvent.input(screen.getByLabelText('Begriff suchen'), { target: { value: 'nichts davon' } });
    await waitFor(() => expect(unit(container).dataset.verifyState).toBe('empty'));
    expect(screen.getByText(/Keine Einträge gefunden/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Filter zurücksetzen' }));
    await waitFor(() => expect(unit(container).dataset.verifyState).toBe('ready'));
    expect(unit(container).dataset.verifyCount).toBe('5');
  });

  it('filters by topic', async () => {
    const { container } = render(<Glossary items={items} topics={topics} />);
    fireEvent.change(screen.getByLabelText('Thema'), { target: { value: 't10' } });
    await waitFor(() => expect(unit(container).dataset.verifyCount).toBe('1'));
  });

  it('opens an entry that the filter hides when its link is followed', async () => {
    const { container } = render(<Glossary items={items} topics={topics} />);
    fireEvent.input(screen.getByLabelText('Begriff suchen'), { target: { value: 'schlüssel' } });
    await waitFor(() => expect(unit(container).dataset.verifyCount).toBe('1'));
    window.location.hash = '#g-join';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await waitFor(() => expect(container.querySelector('dt#g-join')).toBeTruthy());
    expect((screen.getByLabelText('Begriff suchen') as HTMLInputElement).value).toBe('');
  });

  it('is empty without entries', async () => {
    const { container } = render(<Glossary items={[]} topics={[]} />);
    await waitFor(() => expect(unit(container).dataset.verifyState).toBe('empty'));
    expect(unit(container).dataset.verifyCount).toBe('0');
  });
});
