import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getDoc } from '../src/lib/content';
import { renderMarkdown } from '../src/lib/markdown';

const OK = resolve('tests/fixtures/content_ok');
const EMPTY = resolve('tests/fixtures/content_empty');
const REAL = resolve('../content');

function tempRoot(file: string, text: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'db1-doc-'));
  mkdirSync(join(dir, 'de'));
  writeFileSync(join(dir, 'de', file), text);
  return dir;
}

describe('getDoc (cheatsheet, spickzettel, lernplan)', () => {
  it('loads a document with frontmatter, heading and a body without the h1', () => {
    const doc = getDoc('cheatsheet', OK)!;
    expect(doc.slug).toBe('cheatsheet');
    expect(doc.title).toBe('Cheatsheet Testkurs (A4)');
    expect(doc.lang).toBe('de');
    expect(doc.status).toBe('draft');
    expect(doc.heading).toBe('Cheatsheet Testkurs');
    expect(doc.body.startsWith('Kurzüberblick')).toBe(true);
    expect(doc.body).toContain('## 1. Grundbegriffe');
  });

  it('is null for a missing file', () => {
    expect(getDoc('lernplan', OK)).toBeNull();
    expect(getDoc('cheatsheet', EMPTY)).toBeNull();
  });

  it('uses the frontmatter title if the body has no h1', () => {
    const dir = tempRoot('lernplan.md', '---\ntitle: Lernplan X\nlang: de\nstatus: draft\n---\n\nText ohne Titel.\n');
    expect(getDoc('lernplan', dir)).toMatchObject({ heading: 'Lernplan X', body: 'Text ohne Titel.' });
  });

  it('fails loudly on broken or missing frontmatter', () => {
    expect(() => getDoc('lernplan', tempRoot('lernplan.md', '---\nlang: de\n---\n\nText\n'))).toThrow(/lernplan\.md/);
    expect(() => getDoc('lernplan', tempRoot('lernplan.md', 'Kein Frontmatter\n'))).toThrow(/frontmatter/i);
  });

  it('loads the real documents (shape only, independent of their size)', () => {
    for (const slug of ['cheatsheet', 'spickzettel', 'lernplan'] as const) {
      const doc = getDoc(slug, REAL);
      if (doc) {
        expect(doc.heading.length).toBeGreaterThan(0);
        expect(doc.body.length).toBeGreaterThan(100);
        expect(doc.body).not.toMatch(/^\s*# /);
      }
    }
  });
});

describe('rendering of documents', () => {
  it('escapes raw HTML and drops unsafe links', () => {
    const html = renderMarkdown(getDoc('spickzettel', OK)!.body);
    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('böser Link');
    expect(html).toContain('href="https://example.org/"');
  });

  it('wraps tables in a focusable scroll region', () => {
    const html = renderMarkdown(getDoc('cheatsheet', OK)!.body);
    expect(html).toContain('class="table-scroll" role="region" tabindex="0"');
  });
});
