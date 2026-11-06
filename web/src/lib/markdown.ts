/**
 * Markdown → HTML at build time (summaries, card backs, task prompts and solutions).
 *
 * Defence in depth: the content is reviewed, but the output is still sanitised –
 * raw HTML (block and inline) is escaped and shown as text, and link/image targets are limited to
 * http:, https:, mailto:, relative paths and anchors. Unsafe links keep only their text, unsafe
 * images only their alt text.
 *
 * Diagrams: an image whose target is `diagrams/<name>.dot` (e.g. `![Alt](diagrams/er.dot)`) is
 * rendered to an inline SVG figure by `renderMarkdownWithDiagrams`; the alt text becomes the
 * accessible name and the caption.
 */
import { Marked, Renderer, type MarkedExtension, type Token, type Tokens } from 'marked';
import { diagramFigureHtml, escapeAttr, renderDot } from './diagram';
import { isSafeUrl } from './url';

export { isSafeUrl };

const DIAGRAM_HREF = /^diagrams\/([A-Za-z0-9][A-Za-z0-9._-]*\.dot)$/;

function minHeadingDepth(tokens: Token[]): number {
  let min = 7;
  for (const token of tokens) if (token.type === 'heading') min = Math.min(min, (token as Tokens.Heading).depth);
  return min;
}

function isDiagramImage(token: Token): token is Tokens.Image {
  return token.type === 'image' && DIAGRAM_HREF.test((token as Tokens.Image).href);
}

function createMarked(svgs: Map<string, string>): Marked {
  const extension: MarkedExtension = {
    renderer: {
      // Code blocks may scroll horizontally on small screens; tabindex makes them keyboard-scrollable (WCAG 2.1.1).
      code({ text, lang }: Tokens.Code) {
        const language = (lang ?? '').match(/^\S*/)?.[0] ?? '';
        const cls = language ? ` class="language-${escapeAttr(language)}"` : '';
        return `<pre tabindex="0"><code${cls}>${escapeAttr(text)}\n</code></pre>\n`;
      },
      // Wide tables scroll inside their own region instead of widening the page (phones).
      // The region is focusable so keyboard users can scroll it (WCAG 2.1.1).
      table(token: Tokens.Table) {
        const inner = Renderer.prototype.table.call(this, token);
        return `<div class="table-scroll" role="region" tabindex="0" aria-label="Tabelle">\n${inner}</div>\n`;
      },
      // A paragraph that only holds a diagram becomes a figure (no <figure> inside <p>).
      paragraph(token: Tokens.Paragraph) {
        const content = token.tokens.filter((t) => !(t.type === 'text' && t.raw.trim() === ''));
        if (content.length === 1 && isDiagramImage(content[0])) {
          const img = content[0];
          const name = DIAGRAM_HREF.exec(img.href)![1];
          const svg = svgs.get(name);
          if (svg !== undefined) return diagramFigureHtml(svg, img.text, img.text) + '\n';
        }
        return false;
      },
      image(token: Tokens.Image) {
        const match = DIAGRAM_HREF.exec(token.href);
        const svg = match ? svgs.get(match[1]) : undefined;
        if (svg !== undefined) {
          return `<span class="diagram__canvas" role="img" aria-label="${escapeAttr(token.text)}">${svg}</span>`;
        }
        if (!isSafeUrl(token.href)) return escapeAttr(token.text);
        return false;
      },
      link(token: Tokens.Link) {
        if (isSafeUrl(token.href)) return false;
        return this.parser.parseInline(token.tokens);
      },
      // Raw HTML is never passed through; it is shown as text.
      html(token: Tokens.HTML | Tokens.Tag) {
        const escaped = escapeAttr(token.text);
        return 'block' in token && token.block ? `<p>${escaped.trim()}</p>\n` : escaped;
      },
    },
  };
  return new Marked({ gfm: true, breaks: false }, extension);
}

function render(md: string, topLevel: number, svgs: Map<string, string>): string {
  const marked = createMarked(svgs);
  const tokens = marked.lexer(md);
  const min = minHeadingDepth(tokens);
  if (min <= 6) {
    const shift = topLevel - min;
    marked.walkTokens(tokens, (token) => {
      if (token.type === 'heading') {
        const heading = token as Tokens.Heading;
        heading.depth = Math.min(6, Math.max(1, heading.depth + shift));
      }
    });
  }
  return marked.parser(tokens);
}

/**
 * Renders block Markdown. Headings are shifted so that the highest level becomes `topLevel`
 * (default h2): pages own the single h1.
 */
export function renderMarkdown(md: string, topLevel = 2): string {
  return render(md, topLevel, new Map());
}

/** File names of all `diagrams/<name>.dot` image references, in order of appearance. */
export function findDiagramRefs(md: string): string[] {
  const names: string[] = [];
  const marked = new Marked({ gfm: true });
  marked.walkTokens(marked.lexer(md), (token) => {
    if (isDiagramImage(token)) {
      const name = DIAGRAM_HREF.exec(token.href)![1];
      if (!names.includes(name)) names.push(name);
    }
  });
  return names;
}

/**
 * Like renderMarkdown, but renders referenced `diagrams/*.dot` files to inline SVG.
 * `loadDot(name)` returns the DOT source; errors (missing file, invalid DOT) fail the build.
 */
export async function renderMarkdownWithDiagrams(md: string, loadDot: (name: string) => string, topLevel = 2): Promise<string> {
  const svgs = new Map<string, string>();
  for (const name of findDiagramRefs(md)) svgs.set(name, await renderDot(loadDot(name)));
  return render(md, topLevel, svgs);
}

/** Renders inline Markdown (no wrapping <p>), e.g. for card fronts or quiz options. */
export function renderInline(md: string): string {
  return createMarked(new Map()).parseInline(md, { async: false }) as string;
}

/** Like renderInline, but referenced `diagrams/*.dot` files become inline SVG (`role="img"`). */
export async function renderInlineWithDiagrams(md: string, loadDot: (name: string) => string): Promise<string> {
  const svgs = new Map<string, string>();
  for (const name of findDiagramRefs(md)) svgs.set(name, await renderDot(loadDot(name)));
  return createMarked(svgs).parseInline(md, { async: false }) as string;
}
