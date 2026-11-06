/**
 * Build-time props for the SQL playground island.
 *
 * Tasks come from `getTopic().sqlTasks` (rendered Markdown, sanitised), the sample databases from
 * `<repo>/db/<name>/{schema.pg.sql,seed.sql,erd.dot}` (env DB_ROOT overrides, like CONTENT_ROOT for the content).
 * The Chen diagram of each database is rendered to inline SVG at build time.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { PlaygroundDb, PlaygroundTask } from '../components/Playground';
import { contentRoot, getDiagram, getTopic, getTopics } from './content';
import { diagramFigureHtml, renderDot } from './diagram';
import { renderInline, renderMarkdownWithDiagrams } from './markdown';
import type { TopicOption } from './topic-filter';

export const DATABASES: { name: PlaygroundDb['name']; title: string }[] = [
  { name: 'musikschule', title: 'Musikschule' },
  { name: 'firma', title: 'Firma' },
];

export function dbRoot(): string {
  const fromEnv = process.env.DB_ROOT;
  return resolve(fromEnv && fromEnv.trim() !== '' ? fromEnv : '../db');
}

export async function playgroundDatabases(root: string = dbRoot()): Promise<PlaygroundDb[]> {
  const out: PlaygroundDb[] = [];
  for (const { name, title } of DATABASES) {
    const dir = join(root, name);
    const schemaFile = join(dir, 'schema.pg.sql');
    const seedFile = join(dir, 'seed.sql');
    if (!existsSync(schemaFile) || !existsSync(seedFile)) continue;
    const erdFile = join(dir, 'erd.dot');
    out.push({
      name,
      title,
      schema: readFileSync(schemaFile, 'utf8'),
      seed: readFileSync(seedFile, 'utf8'),
      diagramHtml: existsSync(erdFile)
        ? diagramFigureHtml(await renderDot(readFileSync(erdFile, 'utf8')), `ER-Diagramm der Beispieldatenbank ${title} (Chen-Notation)`)
        : '',
    });
  }
  return out;
}

export async function playgroundProps(
  root: string = contentRoot(),
  dbDir: string = dbRoot(),
): Promise<{ tasks: PlaygroundTask[]; databases: PlaygroundDb[]; topics: TopicOption[] }> {
  const databases = await playgroundDatabases(dbDir);
  const tasks: PlaygroundTask[] = [];
  const topics: TopicOption[] = [];
  for (const topic of getTopics(root)) {
    const { sqlTasks } = getTopic(topic.id, root);
    if (sqlTasks.length === 0) continue;
    topics.push({ id: topic.id, title: topic.title });
    const loadDot = (name: string) => getDiagram(topic.id, name, root);
    for (const t of sqlTasks) {
      tasks.push({
        id: t.id,
        topic: topic.id,
        db: t.db,
        kind: t.kind,
        tags: t.tags ?? [],
        promptHtml: await renderMarkdownWithDiagrams(t.prompt, loadDot, 4),
        solution: t.solution.trimEnd(),
        ...(t.solution_pg ? { solutionPg: t.solution_pg.trimEnd() } : {}),
        ...(t.dialect_note ? { dialectNoteHtml: renderInline(t.dialect_note) } : {}),
        hintsHtml: (t.hints ?? []).map((h) => renderInline(h)),
        ordered: t.ordered ?? false,
        ...(t.check ? { check: t.check } : {}),
        engines: t.engines,
        ...(t.paper_mode ? { paperMode: t.paper_mode } : {}),
      });
    }
  }
  return { tasks, databases, topics };
}
