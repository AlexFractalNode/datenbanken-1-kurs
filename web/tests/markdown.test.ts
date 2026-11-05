import { describe, expect, it } from 'vitest';
import { findDiagramRefs, renderInline, renderMarkdown, renderMarkdownWithDiagrams } from '../src/lib/markdown';

const DOT = 'graph g { a [shape=box]; b [shape=diamond]; a -- b; }';

/** True if the HTML contains anything a browser would execute or treat as markup injection. */
function executable(html: string): string[] {
  const hits: string[] = [];
  if (/<script/i.test(html)) hits.push('script tag');
  if (/<img[^>]*\son\w+\s*=/i.test(html) || /<[a-z][^>]*\son\w+\s*=/i.test(html)) hits.push('event handler');
  if (/(href|src)\s*=\s*"\s*(javascript|vbscript|data):/i.test(html)) hits.push('dangerous url');
  if (/<(iframe|object|embed|style|svg)\b/i.test(html)) hits.push('embedded element');
  return hits;
}

describe('sanitizing', () => {
  it.each([
    ['inline img with onerror', 'Text <img src=x onerror=alert(1)> mehr'],
    ['block img with onerror', '<img src=x onerror=alert(1)>'],
    ['script block', '<script>alert(1)</script>'],
    ['inline script', 'a <script>alert(1)</script> b'],
    ['iframe', '<iframe src="https://example.org"></iframe>'],
    ['javascript link', '[x](javascript:alert(1))'],
    ['mixed-case javascript link', '[x](JaVaScRiPt:alert(1))'],
    ['javascript with whitespace/entity', '[x](  java\tscript:alert(1))'],
    ['vbscript link', '[x](vbscript:msgbox(1))'],
    ['data link', '[x](data:text/html;base64,PHNjcmlwdD4=)'],
    ['javascript image', '![x](javascript:alert(1))'],
    ['data image', '![x](data:image/svg+xml;base64,PHN2Zz4=)'],
    ['autolink-like html anchor', '<a href="javascript:alert(1)">x</a>'],
    ['reference link', '[x][r]\n\n[r]: javascript:alert(1)'],
    ['entity-encoded scheme', '[x](&#106;avascript:alert(1))'],
    ['hex-entity colon', '[x](javascript&#x3A;alert(1))'],
    ['autolink', '<javascript:alert(1)>'],
  ])('neutralises %s', (_name, md) => {
    for (const html of [renderMarkdown(md), renderInline(md)]) expect(executable(html)).toEqual([]);
  });

  it('escapes raw HTML so it is shown as text', () => {
    const html = renderMarkdown('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(renderInline('a <b>fett</b>')).toContain('&lt;b&gt;fett&lt;/b&gt;');
  });

  it('keeps safe link and image targets', () => {
    const html = renderMarkdown(
      '[a](https://example.org/x?y=1) [b](http://example.org) [c](mailto:a@example.org) [d](../themen/t04/) [e](#anker) [f](glossar/)\n\n![Foto](bild.png)',
    );
    for (const href of ['https://example.org/x?y=1', 'http://example.org', 'mailto:a@example.org', '../themen/t04/', '#anker', 'glossar/']) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('<img src="bild.png" alt="Foto"');
  });

  it('drops the link target but keeps the text for unsafe links', () => {
    const html = renderMarkdown('[Klick](javascript:alert(1))');
    expect(html).toContain('Klick');
    expect(html).not.toContain('<a');
  });

  it('still embeds allowed diagrams', async () => {
    const html = await renderMarkdownWithDiagrams('![Modell](diagrams/a.dot)\n\n<script>x</script>', () => DOT);
    expect(html).toContain('role="img" aria-label="Modell"');
    expect(html).toContain('<svg');
    expect(html).not.toContain('<script');
  });
});

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
