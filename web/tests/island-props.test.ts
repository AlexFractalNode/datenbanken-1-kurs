import { describe, expect, it } from 'vitest';
import { flashcardProps, quizProps, taskCardData } from '../src/lib/island-props';
import { getTopic } from '../src/lib/content';

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

describe('quizProps', () => {
  it('renders questions, options and explanations', () => {
    const { items, topics } = quizProps(ROOT);
    expect(items.map((q) => q.id)).toEqual(['t04-q001', 't04-q002']);
    expect(topics.map((t) => t.id)).toEqual(['t04']);
    const q1 = items[0];
    expect(q1.type).toBe('single');
    expect(q1.question).toContain('<p>');
    expect(q1.options).toHaveLength(2);
    expect(q1.options[0]).toEqual({ text: 'Rechteck', correct: true, explain: expect.stringContaining('Rechtecke') });
  });

  it('is empty for content without questions', () => {
    expect(quizProps(EMPTY)).toEqual({ items: [], topics: [] });
  });
});

describe('taskCardData', () => {
  it('maps a task with labels and rendered Markdown', () => {
    const task = getTopic('t04', ROOT).tasks[0];
    const data = taskCardData(task);
    expect(data).toMatchObject({ id: 't04-p001', typeLabel: 'Definieren & Beispiel', difficultyLabel: 'leicht', points: 4, minutes: 5 });
    expect(data.prompt).toContain('<em>Entitätstyp</em>');
    expect(data.solution).toContain('<code>Kunde</code>');
    expect(data.rubric).toEqual([
      { criterion: 'Definition', points: 2 },
      { criterion: 'Beispiel', points: 2 },
    ]);
  });
});
