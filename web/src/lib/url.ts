/**
 * URL safety check shared by the Markdown pipeline (links, images) and the diagram SVGs (Graphviz
 * `URL`/`href` attributes): only http:, https:, mailto:, relative paths and anchors pass.
 */

const SAFE_SCHEMES = new Set(['http', 'https', 'mailto']);

/** Decodes numeric/named HTML entities that could hide a scheme (e.g. `&#106;avascript:`). */
function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;|&newline;/gi, '');
}

/** True for http(s)/mailto URLs, relative paths and anchors; false for javascript:, data:, vbscript: … */
export function isSafeUrl(url: string): boolean {
  let normalized = decodeEntities(url);
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // keep the entity-decoded value; malformed escapes cannot form a scheme
  }
  // Browsers ignore control characters and whitespace inside the scheme.
  normalized = normalized.replace(/[\u0000- \u007f-\u009f]/g, '');
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(normalized);
  return scheme ? SAFE_SCHEMES.has(scheme[1].toLowerCase()) : true;
}
