import { describe, expect, it } from 'vitest';
import { flashcardProps } from '../src/lib/island-props';

const ROOT = 'tests/fixtures/content_ok';
const EMPTY = 'tests/fixtures/content_empty';

describe('flashcardProps', () => {
  it('renders card Markdown at build time and lists topics with cards', async () => {
    const { cards, topics } = await flashcardProps(ROOT);
    expect(cards.map((c) => c.id)).toEqual(['t04-c001', 't04-c002', 't04-c003']);
    expect(topics).toEqual([{ id: 't04', title: expect.any(String) }]);
    const c2 = cards[1];
    expect(c2.topic).toBe('t04');
    expect(c2.back).toContain('<strong>Raute</strong>');
    // card with `diagram: beziehung` gets the SVG figure
    expect(c2.figure).toContain('<svg');
    expect(c2.figure).toContain('role="img"');
    expect(cards[0].figure).toBeUndefined();
  });

  it('escapes raw HTML in card text', async () => {
    const { cards } = await flashcardProps(ROOT);
    for (const c of cards) expect(c.front).not.toMatch(/<script/i);
  });

  it('is empty for content without cards', async () => {
    expect(await flashcardProps(EMPTY)).toEqual({ cards: [], topics: [] });
  });
});
