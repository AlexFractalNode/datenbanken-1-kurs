import { describe, expect, it } from 'vitest';
import { dashboardTopics, examProps, flashcardProps, quizProps, taskCardData } from '../src/lib/island-props';
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
  it('renders questions, options and explanations', async () => {
    const { items, topics } = await quizProps(ROOT);
    expect(items.map((q) => q.id)).toEqual(['t04-q001', 't04-q002']);
    expect(topics.map((t) => t.id)).toEqual(['t04']);
    const q1 = items[0];
    expect(q1.type).toBe('single');
    expect(q1.question).toContain('<p>');
    expect(q1.options).toHaveLength(2);
    expect(q1.options[0]).toEqual({ text: 'Rechteck', correct: true, explain: expect.stringContaining('Rechtecke') });
  });

  it('is empty for content without questions', async () => {
    expect(await quizProps(EMPTY)).toEqual({ items: [], topics: [] });
  });
});

describe('taskCardData', () => {
  it('maps a task with labels and rendered Markdown', async () => {
    const task = getTopic('t04', ROOT).tasks[0];
    const data = await taskCardData(task, 't04', ROOT);
    expect(data).toMatchObject({ id: 't04-p001', typeLabel: 'Definieren & Beispiel', difficultyLabel: 'leicht', points: 4, minutes: 5 });
    expect(data.prompt).toContain('<em>Entitätstyp</em>');
    expect(data.solution).toContain('<code>Kunde</code>');
    expect(data.rubric).toEqual([
      { criterion: 'Definition', points: 2 },
      { criterion: 'Beispiel', points: 2 },
    ]);
  });
});

describe('examProps', () => {
  it('maps exams with rendered tasks', async () => {
    const exams = await examProps(ROOT);
    expect(exams).toHaveLength(1);
    const [e01] = exams;
    expect(e01).toMatchObject({ id: 'e01', title: 'Probeklausur 1', minutes: 90 });
    expect(e01.tasks).toHaveLength(1);
    expect(e01.tasks[0]).toMatchObject({ id: 'e01-p001', topic: 't04', points: 90 });
    expect(e01.tasks[0].solution).toContain('<code>Buch</code>');
  });

  it('is empty without exams', async () => {
    expect(await examProps(EMPTY)).toEqual([]);
  });
});

/** A diagram reference must become an inline SVG figure, never a broken <img src="diagrams/*.dot">. */
function expectRenderedDiagram(html: string, label: string) {
  expect(html).not.toMatch(/<img[^>]+diagrams\//);
  expect(html).not.toContain('.dot"');
  expect(html).toContain('data-verify-unit="diagram"');
  expect(html).toContain('<svg');
  expect(html).toContain(`aria-label="${label}"`);
}

describe('diagrams in tasks, exams and quiz (same rewrite as on the topic pages)', () => {
  it('renders diagrams in a task solution', async () => {
    const task = getTopic('t04', ROOT).tasks[1];
    expect(task.solution).toContain('diagrams/beziehung.dot');
    const data = await taskCardData(task, 't04', ROOT);
    expectRenderedDiagram(data.solution, 'Lösungsdiagramm: Kunde gibt Bestellung auf');
  });

  it('renders diagrams in an exam task prompt (diagram of the task topic)', async () => {
    const [e01] = await examProps(ROOT);
    expectRenderedDiagram(e01.tasks[0].prompt, 'Entwurf: Entitätstyp mit Attribut');
  });

  it('renders diagrams in a quiz explanation', async () => {
    const { items } = await quizProps(ROOT);
    expectRenderedDiagram(items[0].options[0].explain, 'Entitätstyp Kunde als Rechteck');
  });

  it('fails the build for a reference to a missing diagram', async () => {
    const task = { ...getTopic('t04', ROOT).tasks[0], prompt: '![Fehlt](diagrams/gibt-es-nicht.dot)' };
    await expect(taskCardData(task, 't04', ROOT)).rejects.toThrow();
  });
});

describe('dashboardTopics', () => {
  it('lists card, quiz and task ids per topic', () => {
    const t04 = dashboardTopics(ROOT).find((t) => t.id === 't04')!;
    expect(t04.cardIds).toEqual(['t04-c001', 't04-c002', 't04-c003']);
    expect(t04.quizIds).toEqual(['t04-q001', 't04-q002']);
    expect(t04.tasks.map((t) => t.id)).toContain('t04-p001');
    expect(t04.tasks.every((t) => t.points > 0)).toBe(true);
  });

  it('keeps topics without content, so the dashboard lists every topic', () => {
    const t01 = dashboardTopics(ROOT).find((t) => t.id === 't01')!;
    expect(t01).toEqual({ id: 't01', title: expect.any(String), cardIds: [], quizIds: [], tasks: [] });
  });
});
