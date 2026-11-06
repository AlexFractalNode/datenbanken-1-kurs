/**
 * Glossary page logic: definitions with cross-references (`siehe g-…`), the trailing topic marker
 * (`(t04)` / `(t08, t10)`), letter groups and the search/filter. Pure functions, used at build time
 * to prepare the island props and in the browser to filter.
 */
import type { GlossaryEntry } from './content';

export interface GlossaryTopicLink {
  id: string;
  href: string;
}

/** One entry as the island renders it. `defHtml` is escaped and contains only anchor links. */
export interface GlossaryItem {
  id: string;
  de: string;
  en: string;
  keepEnglish: boolean;
  letter: string;
  defHtml: string;
  topics: GlossaryTopicLink[];
  /** Normalised text to search in (term, English term, both definitions, id). */
  search: string;
}

/** Group letter: umlauts sort with their base letter (Ä → A); everything else lands under `#`. */
export function letterOf(term: string): string {
  const first = term.trim().charAt(0).toLocaleUpperCase('de');
  const base = first.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return /^[A-Z]$/.test(base) ? base : '#';
}

/** Lower case, without diacritics, ß as ss: the form used to compare search terms. */
export function searchKey(text: string): string {
  return text
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const TOPIC_SUFFIX = /\s*\((t(?:0[1-9]|1[0-3])(?:\s*,\s*t(?:0[1-9]|1[0-3]))*)\)\s*$/;

/** Splits the trailing topic marker `(t04)` / `(t08, t10)` off; unknown topics stay in the text. */
export function parseDefinition(def: string, topicIds: ReadonlySet<string>): { text: string; topics: string[] } {
  const match = TOPIC_SUFFIX.exec(def);
  if (!match) return { text: def.trim(), topics: [] };
  const ids = match[1].split(/\s*,\s*/);
  if (!ids.every((id) => topicIds.has(id))) return { text: def.trim(), topics: [] };
  return { text: def.slice(0, match.index).trim(), topics: ids };
}

/** HTML escaping (kept local so the browser bundle of the island does not pull in the diagram renderer). */
function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const GLOSSARY_REF = /\bg-[a-z0-9]+(?:-[a-z0-9]+)*/g;

/** Escapes the text and turns every known `g-…` id into an anchor link with the term as label. */
function linkRefs(text: string, terms: ReadonlyMap<string, string>): string {
  let out = '';
  let last = 0;
  for (const match of text.matchAll(GLOSSARY_REF)) {
    const label = terms.get(match[0]);
    if (label === undefined) continue;
    out += escapeAttr(text.slice(last, match.index)) + `<a href="#${match[0]}">${escapeAttr(label)}</a>`;
    last = match.index + match[0].length;
  }
  return out + escapeAttr(text.slice(last));
}

export function buildGlossaryItems(
  entries: readonly GlossaryEntry[],
  topicIds: ReadonlySet<string>,
  hrefTopic: (id: string) => string,
): GlossaryItem[] {
  const terms = new Map(entries.map((e) => [e.id, e.de]));
  return [...entries]
    .sort((a, b) => a.de.localeCompare(b.de, 'de'))
    .map((e) => {
      const def = parseDefinition(e.def_de, topicIds);
      const defEn = parseDefinition(e.def_en, topicIds);
      return {
        id: e.id,
        de: e.de,
        en: e.en,
        keepEnglish: e.keep_english,
        letter: letterOf(e.de),
        defHtml: linkRefs(def.text, terms),
        topics: def.topics.map((id) => ({ id, href: hrefTopic(id) })),
        search: searchKey([e.de, e.en, def.text, defEn.text, e.id].join(' ')),
      };
    });
}

/** Entries that contain every word of the query (any order) and, if set, belong to the topic. */
export function filterGlossary(items: readonly GlossaryItem[], query: string, topic: string): GlossaryItem[] {
  const words = searchKey(query).split(/\s+/).filter(Boolean);
  return items.filter((i) => (!topic || i.topics.some((t) => t.id === topic)) && words.every((w) => i.search.includes(w)));
}
