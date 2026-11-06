/**
 * Build-time rendering of Graphviz DOT sources (Chen diagrams) to inline SVG.
 * Runs only in Node during `astro build`; nothing of this ships to the browser.
 */
import { instance, type Viz } from '@viz-js/viz';
import { isSafeUrl } from './url';

let vizPromise: Promise<Viz> | undefined;

function getViz(): Promise<Viz> {
  vizPromise ??= instance();
  return vizPromise;
}

/**
 * Renders DOT to an SVG string suitable for inlining into HTML.
 * - strips the XML prolog, DOCTYPE and comments
 * - replaces hard-coded black with `currentColor`, so the diagram follows the text colour (dark mode)
 * - removes the fixed height so the SVG keeps its aspect ratio when CSS caps the width (viewBox stays)
 * - sanitises like the Markdown pipeline: links (Graphviz `URL`/`href` become `xlink:href`) with an
 *   unsafe scheme such as `javascript:` lose their target, `<script>` and `on…` handlers are removed
 *
 * @throws Error with the Graphviz messages if the DOT source is invalid.
 */
export async function renderDot(dot: string): Promise<string> {
  const viz = await getViz();
  const result = viz.render(dot, { format: 'svg', engine: 'dot' });
  if (result.status !== 'success') {
    const details = result.errors.map((e) => e.message.trim()).join('; ');
    throw new Error(`Invalid DOT source: ${details || 'unknown Graphviz error'}`);
  }
  return postProcessSvg(result.output);
}

export function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Shared figure markup for diagrams (Diagram.astro and diagrams embedded in Markdown). */
export function diagramFigureHtml(svg: string, label: string, caption?: string): string {
  const cap = caption ? `<figcaption class="diagram__caption">${escapeAttr(caption)}</figcaption>` : '';
  return (
    `<figure class="diagram" data-verify-unit="diagram" data-verify-state="ready" data-verify-count="1">` +
    `<div class="diagram__canvas" role="img" aria-label="${escapeAttr(label)}">${svg}</div>${cap}</figure>`
  );
}

/** Link attributes of SVG markup: `href`, `xlink:href` (Graphviz), quoted either way. */
const LINK_ATTR = /\s(?:xlink:)?href\s*=\s*("([^"]*)"|'([^']*)')/gi;

export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(LINK_ATTR, (attr: string, _q: string, dq: string | undefined, sq: string | undefined) =>
      // XML-escaped value: `&amp;#106;` is checked as `&#106;` (stricter, never looser)
      isSafeUrl((dq ?? sq ?? '').replace(/&amp;/g, '&')) ? attr : '',
    );
}

export function postProcessSvg(svg: string): string {
  const start = svg.indexOf('<svg');
  if (start === -1) throw new Error('Graphviz output contains no <svg> element');
  return sanitizeSvg(svg.slice(start).replace(/<!--[\s\S]*?-->/g, ''))
    .replace(/"black"/g, '"currentColor"')
    .replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1')
    .trim();
}
