/**
 * Build-time conversion of content into props for the Preact islands.
 *
 * All Markdown is rendered here with `renderMarkdown`/`renderInline` (raw HTML escaped, URLs
 * filtered), so the islands only ever receive sanitised HTML and never parse Markdown themselves.
 * Diagram references (`![Alt](diagrams/x.dot)`) are rendered to inline SVG figures exactly as on the
 * topic pages, so no <img> ever points at a .dot file.
 */
import type { ExamData } from '../components/ExamRunner';
import type { FlashcardItem } from '../components/Flashcards';
import type { QuizQuestion } from '../components/Quiz';
import type { TaskCardData } from '../components/TaskCard';
import { contentRoot, getDiagram, getExams, getTopic, getTopics, type ExamTask, type Task } from './content';
import type { DashboardTopic } from './dashboard';
import { diagramFigureHtml, renderDot } from './diagram';
import { DIFFICULTY_LABEL, TASK_TYPE_LABEL } from './labels';
import { renderInlineWithDiagrams, renderMarkdownWithDiagrams } from './markdown';
import type { TopicOption } from './topic-filter';

/** Graph-level `label="…"` of a DOT source, used as accessible name of the figure. */
function graphLabel(dot: string): string | undefined {
  return /^\s*label\s*=\s*"([^"]+)"/m.exec(dot)?.[1];
}

/** Loader for `diagrams/<name>.dot` of one topic (same rewrite as on the topic pages: inline SVG at build time). */
const dotLoader = (topicId: string, root: string) => (name: string) => getDiagram(topicId, name, root);

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
        front: await renderMarkdownWithDiagrams(card.front, dotLoader(topic.id, root), 3),
        back: await renderMarkdownWithDiagrams(card.back, dotLoader(topic.id, root), 3),
        ...(figure ? { figure } : {}),
      });
    }
  }
  return { cards, topics };
}

export async function quizProps(root: string = contentRoot()): Promise<{ items: QuizQuestion[]; topics: TopicOption[] }> {
  const items: QuizQuestion[] = [];
  const topics: TopicOption[] = [];
  for (const topic of getTopics(root)) {
    const { quiz } = getTopic(topic.id, root);
    if (quiz.length === 0) continue;
    topics.push({ id: topic.id, title: topic.title });
    const loadDot = dotLoader(topic.id, root);
    for (const q of quiz) {
      const options = [];
      for (const o of q.options) {
        options.push({
          text: await renderInlineWithDiagrams(o.text, loadDot),
          correct: o.correct,
          explain: await renderMarkdownWithDiagrams(o.explain, loadDot, 4),
        });
      }
      items.push({ id: q.id, topic: topic.id, type: q.type, question: await renderMarkdownWithDiagrams(q.question, loadDot, 3), options });
    }
  }
  return { items, topics };
}

/**
 * Paper task (or exam task) for TaskCard/ExamRunner; `headingLevel` is the level of headings inside Markdown.
 * Diagram references (`![Alt](diagrams/x.dot)`) are resolved in the diagrams folder of `topicId`.
 */
export async function taskCardData(task: Task | ExamTask, topicId: string, root: string = contentRoot(), headingLevel = 4): Promise<TaskCardData> {
  const loadDot = dotLoader(topicId, root);
  const rubric = [];
  for (const r of task.rubric) rubric.push({ criterion: await renderInlineWithDiagrams(r.criterion, loadDot), points: r.points });
  return {
    id: task.id,
    typeLabel: TASK_TYPE_LABEL[task.type],
    difficultyLabel: DIFFICULTY_LABEL[task.difficulty],
    points: task.points,
    minutes: task.minutes,
    prompt: await renderMarkdownWithDiagrams(task.prompt, loadDot, headingLevel),
    solution: await renderMarkdownWithDiagrams(task.solution, loadDot, headingLevel),
    rubric,
  };
}

export async function examProps(root: string = contentRoot()): Promise<ExamData[]> {
  const exams: ExamData[] = [];
  for (const exam of getExams(root)) {
    const tasks = [];
    for (const task of exam.tasks) tasks.push({ ...(await taskCardData(task, task.topic, root)), topic: task.topic });
    exams.push({ id: exam.id, title: exam.title, minutes: exam.minutes, tasks });
  }
  return exams;
}

/** Ids per topic for the dashboard; topics without content stay in the list with empty arrays. */
export function dashboardTopics(root: string = contentRoot()): DashboardTopic[] {
  return getTopics(root).map((topic) => {
    const bundle = getTopic(topic.id, root);
    return {
      id: topic.id,
      title: topic.title,
      cardIds: bundle.cards.map((c) => c.id),
      quizIds: bundle.quiz.map((q) => q.id),
      tasks: bundle.tasks.map((t) => ({ id: t.id, points: t.points })),
    };
  });
}
