/**
 * Build-time conversion of content into props for the Preact islands.
 *
 * All Markdown is rendered here with `renderMarkdown`/`renderInline` (raw HTML escaped, URLs
 * filtered), so the islands only ever receive sanitised HTML and never parse Markdown themselves.
 */
import type { FlashcardItem, TopicOption } from '../components/Flashcards';
import { contentRoot, getDiagram, getTopic, getTopics } from './content';
import { diagramFigureHtml, renderDot } from './diagram';
import { renderMarkdown } from './markdown';

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
