import { describe, expect, it } from 'vitest';
import { postProcessSvg, renderDot } from '../src/lib/diagram';

describe('renderDot', () => {
  it('renders DOT source to an inline SVG without XML prolog', async () => {
    const svg = await renderDot('graph g { a [shape=box]; b [shape=diamond]; a -- b; }');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).not.toContain('<?xml');
    expect(svg).not.toContain('<!DOCTYPE');
    expect(svg).toContain('<polygon');
  });

  it('replaces hard-coded black with currentColor so dark mode works', async () => {
    const svg = await renderDot('graph g { a -- b; }');
    expect(svg).not.toMatch(/"black"/);
    expect(svg).toContain('currentColor');
  });

  it('keeps the intrinsic width but drops the fixed height (scales without distortion)', async () => {
    const svg = await renderDot('graph g { a -- b; }');
    const tag = svg.slice(0, svg.indexOf('>'));
    expect(tag).toMatch(/\swidth="\d+pt"/);
    expect(tag).not.toMatch(/\sheight=/);
    expect(tag).toMatch(/viewBox=/);
  });

  it('drops links with an unsafe scheme from the SVG and keeps safe ones (G8)', async () => {
    const svg = await renderDot(
      'digraph g { a [URL="javascript:alert(1)"]; b [href="vbscript:msgbox(1)"]; c [URL="&#106;avascript:alert(2)"]; ' +
        'd [URL="https://example.org/x"]; e [href="#g-join"]; a -> b [URL="data:text/html,<script>alert(3)</script>"]; }',
    );
    expect(svg).not.toMatch(/javascript:|vbscript:|data:text/i);
    expect(svg).not.toContain('&#106;avascript');
    expect(svg).toContain('xlink:href="https://example.org/x"');
    expect(svg).toContain('xlink:href="#g-join"');
  });

  it('removes scripts and event handler attributes from SVG markup (G8)', () => {
    const out = postProcessSvg(
      '<svg width="10pt" height="10pt"><script>alert(1)</script><g onclick="alert(2)" onmouseover=\'x()\'><a href="javascript:void(0)"><text>t</text></a></g></svg>',
    );
    expect(out).not.toMatch(/<script|onclick|onmouseover|javascript:/i);
    expect(out).toContain('<text>t</text>');
  });

  it('throws a readable error for invalid DOT', async () => {
    await expect(renderDot('graph { a -- ')).rejects.toThrow(/DOT/);
  });
});
