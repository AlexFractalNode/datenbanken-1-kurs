import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import DocPage from '../src/components/DocPage.astro';
import { clearContentCache } from '../src/lib/content';

const OK = resolve('tests/fixtures/content_ok');
let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});
afterEach(() => {
  delete process.env.CONTENT_ROOT;
  clearContentCache();
});

async function render(slug: 'cheatsheet' | 'spickzettel' | 'lernplan'): Promise<string> {
  process.env.CONTENT_ROOT = OK;
  clearContentCache();
  return container.renderToString(DocPage, { props: { slug, unit: slug, fallbackTitle: 'Fallback', lead: 'Lead' } });
}

describe('DocPage', () => {
  it('renders the document as ready with its heading and the section count', async () => {
    const html = await render('cheatsheet');
    expect(html).toContain('<h1>Cheatsheet Testkurs</h1>');
    expect(html).toContain('data-verify-unit="cheatsheet"');
    expect(html).toContain('data-verify-state="ready"');
    expect(html).toContain('data-verify-count="2"');
    expect(html).toContain('<h2>1. Grundbegriffe</h2>');
  });

  it('is XSS safe', async () => {
    const html = await render('spickzettel');
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders referenced diagrams like the topic pages, sanitised (G8)', async () => {
    const html = await render('cheatsheet');
    expect(html).toContain('<figure class="diagram" data-verify-unit="diagram"');
    expect(html).toContain('aria-label="Chen-Notation: Entitätstyp und Beziehungstyp"');
    expect(html).toMatch(/<svg[\s>]/);
    expect(html).not.toContain('diagrams/notation.dot');
    expect(html).not.toContain('javascript:');
    // the figure is not counted as a section
    expect(html).toContain('data-verify-count="2"');
  });

  it('shows an empty state for a missing document', async () => {
    const html = await render('lernplan');
    expect(html).toContain('<h1>Fallback</h1>');
    expect(html).toContain('data-verify-state="empty"');
    expect(html).toContain('noch nicht veröffentlicht');
  });
});
