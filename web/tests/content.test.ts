import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  contentRoot,
  extractPitfalls,
  stripLeadingHeading,
  stripTitleHeading,
  formatSourceNote,
  getDiagram,
  getExams,
  getGlossary,
  getOverview,
  getSources,
  getTopic,
  getTopics,
} from '../src/lib/content';

const OK = resolve('tests/fixtures/content_ok');
const EMPTY = resolve('tests/fixtures/content_empty');
// Shared fixture created by task A7 (repository-level tests/fixtures). It mirrors the repository
// layout: content lives in `content/`, `sources.yml` one level up (like the repository root).
const A7_OK = resolve('../tests/fixtures/content_ok/content');

describe('contentRoot', () => {
  const original = process.env.CONTENT_ROOT;
  afterEach(() => {
    if (original === undefined) delete process.env.CONTENT_ROOT;
    else process.env.CONTENT_ROOT = original;
  });

  it('defaults to ../content relative to the web directory', () => {
    delete process.env.CONTENT_ROOT;
    expect(contentRoot()).toBe(resolve('../content'));
  });

  it('honours the CONTENT_ROOT environment variable', () => {
    process.env.CONTENT_ROOT = 'tests/fixtures/content_ok';
    expect(contentRoot()).toBe(OK);
    expect(getTopics().map((t) => t.id)).toEqual(['t01', 't04']);
  });
});

describe('getTopics', () => {
  it('returns topics sorted by order', () => {
    const topics = getTopics(OK);
    expect(topics.map((t) => t.id)).toEqual(['t01', 't04']);
    expect(topics[1]).toMatchObject({ slug: 'er-modellierung', title: 'ER-Modellierung' });
  });

  it('reads the real course topics (13 topics)', () => {
    const topics = getTopics(resolve('../content'));
    expect(topics).toHaveLength(13);
    expect(topics[0].id).toBe('t01');
  });
});

describe('getTopic', () => {
  it('loads all element files of a topic', () => {
    const bundle = getTopic('t04', OK);
    expect(bundle.topic.id).toBe('t04');
    expect(bundle.cards).toHaveLength(3);
    expect(bundle.quiz).toHaveLength(2);
    expect(bundle.tasks).toHaveLength(2);
    expect(bundle.sqlTasks).toHaveLength(1);
    expect(bundle.cards.map((c) => c.id)).toEqual(['t04-c001', 't04-c002', 't04-c003']);
  });

  it('parses the summary frontmatter and body', () => {
    const { summary } = getTopic('t04', OK);
    expect(summary).not.toBeNull();
    expect(summary!.status).toBe('draft');
    expect(summary!.lang).toBe('de');
    expect(summary!.body).toContain('Ein **ER-Modell**');
  });

  it('extracts the "Typische Fehler" section from a summary body', () => {
    const { body, pitfalls } = extractPitfalls('## A\n\nText\n\n## Typische Fehler\n\n- X verwechselt\n\n## B\n\nMehr');
    expect(pitfalls).toBe('- X verwechselt');
    expect(body).toBe('## A\n\nText\n\n## B\n\nMehr');
  });

  it('removes the pitfalls section from the summary and prefers pitfalls.md', () => {
    const { summary, pitfalls } = getTopic('t04', OK);
    expect(summary!.body).not.toContain('Typische Fehler');
    expect(pitfalls).toContain('Kardinalität vertauscht');
  });

  it('drops the own "Typische Fehler" heading of pitfalls.md (the page provides it)', () => {
    const { pitfalls } = getTopic('t04', OK);
    expect(pitfalls).not.toMatch(/^#/);
    expect(stripLeadingHeading('# Typische Fehler: X\n\n1. a')).toBe('1. a');
    expect(stripLeadingHeading('1. a\n\n## Unterpunkt')).toBe('1. a\n\n## Unterpunkt');
  });

  it('drops a leading summary heading that repeats the title (the page h1 shows it)', () => {
    expect(stripTitleHeading('# ER-Modellierung\n\n## Lernziele\n\nText', 'ER-Modellierung')).toBe('## Lernziele\n\nText');
    expect(stripTitleHeading('## Worum es geht\n\nText', 'ER-Modellierung')).toBe('## Worum es geht\n\nText');
    expect(getTopic('t04', OK).summary!.body.startsWith('## Worum es geht')).toBe(true);
  });

  it('resolves summary sources against sources.yml', () => {
    const { summary } = getTopic('t04', OK);
    expect(summary!.resolvedSources).toEqual([
      expect.objectContaining({ ref: 'Abschnitt Grundbegriffe', source: expect.objectContaining({ id: 'wp-erm', license: 'CC BY-SA 4.0' }) }),
      expect.objectContaining({ ref: 'Kapitel 5.1', source: expect.objectContaining({ id: 'pg-docs' }) }),
    ]);
  });

  it('lets elements inherit the summary sources unless they declare their own', () => {
    const { cards } = getTopic('t04', OK);
    expect(cards[0].resolvedSources.map((s) => s.source.id)).toEqual(['wp-erm', 'pg-docs']);
    expect(cards[2].resolvedSources.map((s) => `${s.source.id}:${s.ref}`)).toEqual(['pg-docs:Kapitel 5.4']);
  });

  it('applies the engines default [fb, pg] to SQL tasks', () => {
    const { sqlTasks } = getTopic('t04', OK);
    expect(sqlTasks[0].engines).toEqual(['fb', 'pg']);
    expect(sqlTasks[0].solution_pg).toContain('LIMIT 3');
  });

  it('returns an empty bundle for a topic without content', () => {
    const bundle = getTopic('t01', OK);
    expect(bundle.summary).toBeNull();
    expect(bundle.cards).toEqual([]);
    expect(bundle.quiz).toEqual([]);
    expect(bundle.tasks).toEqual([]);
    expect(bundle.sqlTasks).toEqual([]);
    expect(bundle.pitfalls).toBeNull();
    expect(bundle.diagrams).toEqual([]);
  });

  it('throws for an unknown topic id', () => {
    expect(() => getTopic('t99', OK)).toThrow(/t99/);
  });

  it('lists the diagram files of a topic', () => {
    const { diagrams } = getTopic('t04', OK);
    expect(diagrams.map((d) => d.name)).toEqual(['beziehung.dot', 'entitaet.dot']);
    expect(getDiagram('t04', 'beziehung.dot', OK)).toContain('graph beziehung');
  });

  it('resolves the card diagram field (name without extension)', () => {
    const { cards } = getTopic('t04', OK);
    expect(cards[1].diagram).toBe('beziehung');
    expect(getDiagram('t04', cards[1].diagram!, OK)).toContain('graph beziehung');
  });

  it('rejects diagram names that escape the topic folder', () => {
    expect(() => getDiagram('t04', '../summary.md', OK)).toThrow(/invalid/i);
  });
});

describe('getSources', () => {
  it('returns sources keyed by id', () => {
    const sources = getSources(OK);
    expect(Object.keys(sources).sort()).toEqual(['fr-book', 'pg-docs', 'wp-erm']);
    expect(sources['pg-docs'].license).toBe('PostgreSQL License');
    expect(typeof sources['pg-docs'].accessed).toBe('string');
  });

  it('formats the visible source note', () => {
    const sources = getSources(OK);
    expect(formatSourceNote({ id: 'pg-docs', ref: 'Kapitel 5.1', source: sources['pg-docs'] })).toBe(
      'Basiert auf: PostgreSQL Documentation (PostgreSQL License), Kapitel 5.1',
    );
  });
});

describe('getExams', () => {
  it('loads exams with derived ids', () => {
    const exams = getExams(OK);
    expect(exams).toHaveLength(1);
    expect(exams[0]).toMatchObject({ id: 'e01', slug: 'exam-01', title: 'Probeklausur 1', minutes: 90 });
    expect(exams[0].tasks[0]).toMatchObject({ id: 'e01-p001', topic: 't04', points: 90 });
  });
});

describe('getGlossary', () => {
  it('returns entries sorted by German term', () => {
    const glossary = getGlossary(OK);
    expect(glossary.map((g) => g.id)).toEqual(['g-entitaetstyp', 'g-join', 'g-kardinalitaet']);
    expect(glossary[1].keep_english).toBe(true);
  });
});

describe('getOverview', () => {
  it('summarises counts per topic', () => {
    const overview = getOverview(OK);
    expect(overview.map((o) => o.topic.id)).toEqual(['t01', 't04']);
    expect(overview[0]).toMatchObject({ hasSummary: false, status: null, counts: { cards: 0, quiz: 0, tasks: 0, sqlTasks: 0 } });
    expect(overview[1]).toMatchObject({ hasSummary: true, status: 'draft', counts: { cards: 3, quiz: 2, tasks: 2, sqlTasks: 1 }, taskMinutes: 15 });
  });
});

describe('empty content (only topics.yml)', () => {
  it('works without any topic folders, exams, glossary or sources', () => {
    expect(getTopics(EMPTY)).toHaveLength(2);
    expect(getTopic('t01', EMPTY).summary).toBeNull();
    expect(getExams(EMPTY)).toEqual([]);
    expect(getGlossary(EMPTY)).toEqual([]);
    expect(getSources(EMPTY)).toEqual({});
  });
});

describe.skipIf(!existsSync(A7_OK))('shared A7 fixture (tests/fixtures/content_ok)', () => {
  it('loads t04 with the documented element counts', () => {
    const bundle = getTopic('t04', A7_OK);
    expect(bundle.cards).toHaveLength(3);
    expect(bundle.quiz).toHaveLength(2);
    expect(bundle.tasks).toHaveLength(2);
    expect(bundle.sqlTasks).toHaveLength(1);
  });

  it('resolves every referenced source', () => {
    const bundle = getTopic('t04', A7_OK);
    const all = [bundle.summary, ...bundle.cards, ...bundle.quiz, ...bundle.tasks, ...bundle.sqlTasks];
    for (const item of all) {
      if (!item) continue;
      for (const s of item.resolvedSources) expect(s.source.title).toBeTruthy();
    }
  });

  it('finds sources.yml one level above the content root', () => {
    expect(getSources(A7_OK)['placeholder-docs']).toBeDefined();
  });

  it('loads exams, glossary and sources', () => {
    expect(getExams(A7_OK).length).toBeGreaterThanOrEqual(1);
    expect(getGlossary(A7_OK).length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(getSources(A7_OK)).length).toBeGreaterThanOrEqual(1);
  });
});
