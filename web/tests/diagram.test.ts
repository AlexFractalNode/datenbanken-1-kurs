import { describe, expect, it } from 'vitest';
import { renderDot } from '../src/lib/diagram';

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

  it('throws a readable error for invalid DOT', async () => {
    await expect(renderDot('graph { a -- ')).rejects.toThrow(/DOT/);
  });
});
