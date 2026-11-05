import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * WCAG AA guard for the colour tokens: every colour token is defined once as
 * `light-dark(<light>, <dark>)`; this test checks the contrast of all text/background
 * pairs (4.5:1) and of UI boundaries such as the focus ring and control borders (3:1).
 */
const css = readFileSync('src/styles/tokens.css', 'utf8');

function tokens(): Record<string, { light: string; dark: string }> {
  const out: Record<string, { light: string; dark: string }> = {};
  const re = /--([a-z0-9-]+):\s*light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)/gi;
  for (const m of css.matchAll(re)) out[m[1]] = { light: m[2].toLowerCase(), dark: m[3].toLowerCase() };
  return out;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT_PAIRS: [string, string][] = [
  ['c-text', 'c-bg'],
  ['c-text', 'c-surface'],
  ['c-text', 'c-surface-2'],
  ['c-text-muted', 'c-bg'],
  ['c-text-muted', 'c-surface'],
  ['c-text-muted', 'c-surface-2'],
  ['c-accent', 'c-bg'],
  ['c-accent', 'c-surface'],
  ['c-accent', 'c-accent-soft'],
  ['c-text', 'c-accent-soft'],
  ['c-on-accent', 'c-accent'],
  ['c-key', 'c-bg'],
  ['c-key', 'c-surface'],
  ['c-key', 'c-key-soft'],
  ['c-danger', 'c-surface'],
  ['c-danger', 'c-danger-soft'],
  ['c-on-danger', 'c-danger'],
  ['c-warn-text', 'c-warn-soft'],
  ['c-ok-text', 'c-ok-soft'],
  ['c-nav-text', 'c-nav-bg'],
  ['c-nav-active-text', 'c-nav-active-bg'],
];

const UI_PAIRS: [string, string][] = [
  ['c-focus', 'c-bg'],
  ['c-focus', 'c-surface'],
  ['c-focus', 'c-nav-bg'],
  ['c-control-border', 'c-bg'],
  ['c-control-border', 'c-surface'],
];

describe('colour tokens', () => {
  const t = tokens();

  it('defines every token used in the checks', () => {
    const names = new Set([...TEXT_PAIRS, ...UI_PAIRS].flat());
    for (const name of names) expect(t[name], `missing token --${name}`).toBeDefined();
  });

  for (const scheme of ['light', 'dark'] as const) {
    it.each(TEXT_PAIRS)(`${scheme}: --%s on --%s meets 4.5:1`, (fg, bg) => {
      expect(contrast(t[fg][scheme], t[bg][scheme])).toBeGreaterThanOrEqual(4.5);
    });
    it.each(UI_PAIRS)(`${scheme}: --%s against --%s meets 3:1`, (fg, bg) => {
      expect(contrast(t[fg][scheme], t[bg][scheme])).toBeGreaterThanOrEqual(3);
    });
  }

  it('supports both the system preference and a manual override', () => {
    expect(css).toMatch(/color-scheme:\s*light dark/);
    expect(css).toMatch(/\[data-theme=['"]?light['"]?\]/);
    expect(css).toMatch(/\[data-theme=['"]?dark['"]?\]/);
  });
});
