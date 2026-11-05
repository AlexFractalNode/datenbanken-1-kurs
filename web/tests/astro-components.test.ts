import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import Diagram from '../src/components/Diagram.astro';
import SourceNote from '../src/components/SourceNote.astro';
import { formatSourceNote, getTopic } from '../src/lib/content';
import { renderMarkdown } from '../src/lib/markdown';

const OK = resolve('tests/fixtures/content_ok');

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('SourceNote', () => {
  it('renders the visible note "Basiert auf: <Titel> (<Lizenz>), <ref>" for each source', async () => {
    const sources = getTopic('t04', OK).summary!.resolvedSources;
    const html = await container.renderToString(SourceNote, { props: { sources } });
    for (const s of sources) expect(text(html)).toContain(formatSourceNote(s));
    expect(html).toContain('href="https://de.wikipedia.org/wiki/Entity-Relationship-Modell"');
  });

  it('renders nothing without sources', async () => {
    const html = await container.renderToString(SourceNote, { props: { sources: [] } });
    expect(text(html)).toBe('');
  });
});

describe('Diagram', () => {
  it('renders a topic .dot file to inline SVG at build time', async () => {
    const html = await container.renderToString(Diagram, { props: { topic: 't04', name: 'beziehung', root: OK } });
    expect(html).toContain('<svg');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Kunde gibt Bestellung auf"');
    // The graph label is already drawn inside the SVG; no duplicate caption.
    expect(html).not.toContain('<figcaption');
  });

  it('accepts inline DOT and an explicit caption', async () => {
    const html = await container.renderToString(Diagram, { props: { dot: 'graph { a -- b }', caption: 'Zwei Knoten' } });
    expect(html).toContain('aria-label="Zwei Knoten"');
    expect(html).toMatch(/<figcaption[^>]*>Zwei Knoten<\/figcaption>/);
  });
});

describe('renderMarkdown', () => {
  it('renders GFM and shifts headings so the page keeps a single h1', () => {
    const html = renderMarkdown('# Titel\n\n## Teil\n\n**fett** und `code`');
    expect(html).toContain('<h2');
    expect(html).toContain('<h3');
    expect(html).not.toContain('<h1');
    expect(html).toContain('<strong>fett</strong>');
    expect(html).toContain('<code>code</code>');
  });

  it('makes code blocks keyboard-focusable (they may scroll horizontally)', () => {
    const html = renderMarkdown('```sql\nSELECT 1;\n```');
    expect(html).toMatch(/<pre tabindex="0"><code class="language-sql">SELECT 1;/);
  });

  it('keeps h2 as the top level when the content starts at h2', () => {
    const html = renderMarkdown('## Worum es geht\n\n### Detail');
    expect(html).toMatch(/<h2[^>]*>Worum es geht<\/h2>/);
    expect(html).toMatch(/<h3[^>]*>Detail<\/h3>/);
  });
});
