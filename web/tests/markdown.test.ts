import { describe, expect, it } from 'vitest';
import { findDiagramRefs, renderMarkdownWithDiagrams } from '../src/lib/markdown';

const DOT = 'graph g { a [shape=box]; b [shape=diamond]; a -- b; }';

describe('tables', () => {
  it('wraps tables in a focusable, labelled scroll region (wide tables on phones)', async () => {
    const html = await renderMarkdownWithDiagrams('| A | B |\n|---|---|\n| 1 | 2 |', () => DOT);
    expect(html).toMatch(/^<div class="table-scroll" role="region" tabindex="0" aria-label="Tabelle">\s*<table>/);
    expect(html).toContain('<td>1</td>');
    expect(html.trim().endsWith('</table>\n</div>') || html.trim().endsWith('</table></div>')).toBe(true);
  });
});

describe('diagram references in Markdown', () => {
  it('finds ![alt](diagrams/<name>.dot) references', () => {
    const md = 'Text\n\n![Modell A](diagrams/a.dot)\n\nmehr ![B](diagrams/b-2.dot) und ![Foto](bild.png)';
    expect(findDiagramRefs(md)).toEqual(['a.dot', 'b-2.dot']);
  });

  it('replaces a standalone diagram image with an inline SVG figure', async () => {
    const loaded: string[] = [];
    const html = await renderMarkdownWithDiagrams('Vorher\n\n![Ein & Modell](diagrams/a.dot)\n\nNachher', (name) => {
      loaded.push(name);
      return DOT;
    });
    expect(loaded).toEqual(['a.dot']);
    expect(html).not.toContain('<img');
    expect(html).not.toMatch(/<p>\s*<figure/);
    expect(html).toMatch(/<figure class="diagram"[^>]*data-verify-unit="diagram"/);
    expect(html).toContain('role="img" aria-label="Ein &amp; Modell"');
    expect(html).toContain('<svg');
    expect(html).toMatch(/<figcaption class="diagram__caption">Ein &amp; Modell<\/figcaption>/);
    expect(html).toContain('<p>Vorher</p>');
  });

  it('leaves ordinary images alone', async () => {
    const html = await renderMarkdownWithDiagrams('![Foto](bild.png)', () => DOT);
    expect(html).toContain('<img src="bild.png" alt="Foto"');
  });

  it('fails loudly for a missing diagram', async () => {
    await expect(
      renderMarkdownWithDiagrams('![X](diagrams/fehlt.dot)', () => {
        throw new Error('Diagram "fehlt.dot" not found');
      }),
    ).rejects.toThrow(/fehlt\.dot/);
  });
});
