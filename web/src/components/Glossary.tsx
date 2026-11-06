import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { filterGlossary, type GlossaryItem } from '../lib/glossary';

interface Props {
  items: GlossaryItem[];
  /** Topics for the filter (only those that occur in the glossary are offered). */
  topics: { id: string; title: string }[];
}

type UnitState = 'loading' | 'empty' | 'ready';

const letterId = (letter: string) => `buchstabe-${letter === '#' ? 'sonstige' : letter.toLowerCase()}`;

/**
 * Searchable glossary. The full list is rendered on the server, so it also works without JavaScript
 * (only the filter needs it). Every entry keeps its anchor `#g-…`; following a link to an entry that
 * the current filter hides resets the filter.
 */
export default function Glossary({ items, topics }: Props) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [mounted, setMounted] = useState(false);
  const pendingId = useRef<string | null>(null);

  const visible = useMemo(() => filterGlossary(items, query, topic), [items, query, topic]);
  const groups = useMemo(() => {
    const map = new Map<string, GlossaryItem[]>();
    for (const item of visible) map.set(item.letter, [...(map.get(item.letter) ?? []), item]);
    return [...map.entries()].sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b, 'de')));
  }, [visible]);
  const topicsInUse = useMemo(() => topics.filter((t) => items.some((i) => i.topics.some((x) => x.id === t.id))), [items, topics]);
  const filtered = query.trim() !== '' || topic !== '';

  useEffect(() => {
    setMounted(true);
    const onHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || document.getElementById(id) || !items.some((i) => i.id === id)) return;
      // The target exists but the filter hides it: show everything, then jump there after the render.
      pendingId.current = id;
      setQuery('');
      setTopic('');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // Mount only: the items are static build output.
  }, []);

  useEffect(() => {
    const id = pendingId.current;
    if (!id) return;
    pendingId.current = null;
    document.getElementById(id)?.scrollIntoView();
  });

  const state: UnitState = !mounted && items.length === 0 ? 'empty' : visible.length === 0 ? 'empty' : mounted ? 'ready' : 'loading';
  const reset = () => {
    setQuery('');
    setTopic('');
  };

  return (
    <div data-verify-unit="glossary" data-verify-state={state} data-verify-count={visible.length}>
      {items.length === 0 ? (
        <section class="empty-state" aria-labelledby="no-glossary">
          <h2 id="no-glossary">Das Glossar wird gerade aufgebaut</h2>
          <p>Hier erscheinen bald die wichtigsten Begriffe aller Themen.</p>
        </section>
      ) : (
        <>
          <form class="glossary-filter" role="search" aria-label="Glossar durchsuchen" onSubmit={(e) => e.preventDefault()}>
            <div class="field">
              <label for="gl-query">Begriff suchen</label>
              <input
                id="gl-query"
                type="search"
                autoComplete="off"
                value={query}
                disabled={!mounted}
                onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
              />
            </div>
            <div class="field">
              <label for="gl-topic">Thema</label>
              <select id="gl-topic" value={topic} disabled={!mounted} onChange={(e) => setTopic((e.currentTarget as HTMLSelectElement).value)}>
                <option value="">Alle Themen</option>
                {topicsInUse.map((t) => (
                  <option value={t.id}>
                    {t.id} · {t.title}
                  </option>
                ))}
              </select>
            </div>
            {filtered && (
              <button type="button" class="button button--ghost" onClick={reset}>
                Filter zurücksetzen
              </button>
            )}
          </form>
          <p class="meta" role="status">
            {mounted ? `${visible.length} von ${items.length} Einträgen` : `${items.length} Einträge`}
          </p>

          {visible.length === 0 ? (
            <section class="empty-state" aria-labelledby="no-hits">
              <h2 id="no-hits">Keine Einträge gefunden</h2>
              <p>Prüfe die Schreibweise oder suche nach einem Teil des Begriffs. Die englische Bezeichnung wird ebenfalls durchsucht.</p>
            </section>
          ) : (
            <>
              <nav aria-label="Buchstaben">
                <ul class="letter-nav">
                  {groups.map(([letter]) => (
                    <li>
                      <a href={`#${letterId(letter)}`}>{letter}</a>
                    </li>
                  ))}
                </ul>
              </nav>
              {groups.map(([letter, list]) => (
                <section class="glossary-group" aria-labelledby={letterId(letter)}>
                  <h2 id={letterId(letter)}>{letter}</h2>
                  <dl class="glossary">
                    {list.map((g) => (
                      <>
                        <dt id={g.id}>
                          {g.de}
                          {g.en.toLocaleLowerCase('de') !== g.de.toLocaleLowerCase('de') && (
                            <span class="en" lang="en">
                              {g.en}
                            </span>
                          )}
                          {g.keepEnglish && <span class="badge">Fachbegriff bleibt englisch</span>}
                        </dt>
                        <dd>
                          <span dangerouslySetInnerHTML={{ __html: g.defHtml }} />
                          {g.topics.length > 0 && (
                            <span class="glossary__topics">
                              {' '}
                              Mehr dazu:{' '}
                              {g.topics.map((t, i) => (
                                <>
                                  {i > 0 && ', '}
                                  <a href={t.href}>{t.id}</a>
                                </>
                              ))}
                            </span>
                          )}
                        </dd>
                      </>
                    ))}
                  </dl>
                </section>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
