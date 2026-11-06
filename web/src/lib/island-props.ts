/**
 * Build-time conversion of content into props for the Preact islands.
 *
 * All Markdown is rendered here with `renderMarkdown`/`renderInline` (raw HTML escaped, URLs
 * filtered), so the islands only ever receive sanitised HTML and never parse Markdown themselves.
 */
import type { ExamData } from '../components/ExamRunner';
import type { FlashcardItem } from '../components/Flashcards';
import type { QuizQuestion } from '../components/Quiz';
import type { TaskCardData } from '../components/TaskCard';
import { contentRoot, getDiagram, getExams, getTopic, getTopics, type ExamTask, type Task } from './content';
import { diagramFigureHtml, renderDot } from './diagram';
import { DIFFICULTY_LABEL, TASK_TYPE_LABEL } from './labels';
import { renderInline, renderMarkdown } from './markdown';
import type { TopicOption } from './topic-filter';

/** Graph-level `label="…"` of a DOT source, used as accessible name of the figure. */
function graphLabel(dot: string): string | undefined {
  return /^\s*label\s*=\s*"([^"]+)"/m.exec(dot)?.[1];
}

export async function flashcardProps(root: string = contentRoot()): Promise<{ cards: FlashcardItem[]; topics: TopicOption[] }> {
  const cards: FlashcardItem[] = [];
  const topics: TopicOption[] = [];
  for (const topic of getTopics(root)) {
    const bundle = getTopic(topic.id, root);
    if (bundle.cards.length === 0) continue;
    topics.push({ id: topic.id, title: topic.title });
    for (const card of bundle.cards) {
      let figure: string | undefined;
      if (card.diagram) {
        const dot = getDiagram(topic.id, card.diagram, root);
        figure = diagramFigureHtml(await renderDot(dot), graphLabel(dot) ?? `Diagramm zur Karte ${card.id}`);
      }
      cards.push({
        id: card.id,
        topic: topic.id,
        front: renderMarkdown(card.front, 3),
        back: renderMarkdown(card.back, 3),
        ...(figure ? { figure } : {}),
      });
    }
  }
  return { cards, topics };
}

export function quizProps(root: string = contentRoot()): { items: QuizQuestion[]; topics: TopicOption[] } {
  const items: QuizQuestion[] = [];
  const topics: TopicOption[] = [];
  for (const topic of getTopics(root)) {
    const { quiz } = getTopic(topic.id, root);
    if (quiz.length === 0) continue;
    topics.push({ id: topic.id, title: topic.title });
    for (const q of quiz) {
      items.push({
        id: q.id,
        topic: topic.id,
        type: q.type,
        question: renderMarkdown(q.question, 3),
        options: q.options.map((o) => ({ text: renderInline(o.text), correct: o.correct, explain: renderMarkdown(o.explain, 4) })),
      });
    }
  }
  return { items, topics };
}

/** Paper task (or exam task) for TaskCard/ExamRunner; `headingLevel` is the level of headings inside Markdown. */
export function taskCardData(task: Task | ExamTask, headingLevel = 4): TaskCardData {
  return {
    id: task.id,
    typeLabel: TASK_TYPE_LABEL[task.type],
    difficultyLabel: DIFFICULTY_LABEL[task.difficulty],
    points: task.points,
    minutes: task.minutes,
    prompt: renderMarkdown(task.prompt, headingLevel),
    solution: renderMarkdown(task.solution, headingLevel),
    rubric: task.rubric.map((r) => ({ criterion: renderInline(r.criterion), points: r.points })),
  };
}

export function examProps(root: string = contentRoot()): ExamData[] {
  return getExams(root).map((exam) => ({
    id: exam.id,
    title: exam.title,
    minutes: exam.minutes,
    tasks: exam.tasks.map((task) => ({ ...taskCardData(task), topic: task.topic })),
  }));
}
