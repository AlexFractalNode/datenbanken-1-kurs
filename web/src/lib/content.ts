/**
 * Read-only access to the course content (YAML/Markdown) for the Astro build.
 *
 * The Python validator (`tools/validate.py`, JSON Schema) is the only real gate and runs before
 * the build. The zod types below are deliberately slim: they document the shape from spec §8,
 * give us TypeScript types and fail the build loudly if something unexpected slips through.
 *
 * Layout below the content root (default `../content`, override with env `CONTENT_ROOT`):
 *   topics.yml
 *   glossary.yml                      (or de/glossary.yml)
 *   sources.yml                       (or ../sources.yml, i.e. repository root)
 *   de/topics/tNN-<slug>/summary.md   (+ cards.yml, quiz.yml, tasks.yml, sql-tasks.yml,
 *                                        optional pitfalls.md, diagrams/*.dot)
 *   de/exams/exam-NN.yml
 *
 * Missing files are not an error: a topic without content yields an empty bundle.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

export const LANG = 'de';

// ---------------------------------------------------------------------------
// Schemas (spec §8)
// ---------------------------------------------------------------------------

const status = z.enum(['draft', 'reviewed', 'verified']);
const review = z.enum(['fach', 'aufgaben', 'leak', 'en']);

const sourceRefSchema = z.object({ id: z.string(), ref: z.string() });

/** YAML may turn unquoted dates into Date objects depending on the schema; normalise to ISO date. */
const dateString = z.union([z.string(), z.date()]).transform((v) => (typeof v === 'string' ? v : v.toISOString().slice(0, 10)));

const topicSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  order: z.number(),
  title: z.string(),
  subtopics: z.array(z.string()).default([]),
});

const sourceSchema = z.looseObject({
  id: z.string(),
  title: z.string(),
  author: z.string().optional(),
  url: z.string().regex(/^https?:\/\/[^\s/?#]+\.[^\s]*$/i, 'url must be an absolute http(s) URL'),
  license: z.string(),
  accessed: dateString,
  kind: z.enum(['docs', 'oer', 'wiki', 'further-reading']),
});

const summaryFrontmatterSchema = z.looseObject({
  id: z.string(),
  lang: z.string(),
  title: z.string(),
  order: z.number(),
  status,
  reviews: z.array(review).default([]),
  sources: z.array(sourceRefSchema).default([]),
  translation: z.literal('pending').optional(),
});

const elementBase = {
  id: z.string(),
  status,
  reviews: z.array(review).default([]),
  sources: z.array(sourceRefSchema).optional(),
  tags: z.array(z.string()).optional(),
};

const cardSchema = z.looseObject({
  ...elementBase,
  front: z.string(),
  back: z.string(),
  diagram: z.string().optional(),
});

const quizSchema = z.looseObject({
  ...elementBase,
  type: z.enum(['single', 'multi', 'truefalse']),
  question: z.string(),
  options: z.array(z.object({ text: z.string(), correct: z.boolean(), explain: z.string() })),
});

const taskType = z.enum([
  'define-example',
  'erm-model',
  'erm-read',
  'erm-to-sql',
  'normalize',
  'relalg',
  'sql-write',
  'sql-predict',
  '3vl',
  'explain',
]);

const taskFields = {
  ...elementBase,
  type: taskType,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  points: z.number(),
  minutes: z.number(),
  prompt: z.string(),
  solution: z.string(),
  rubric: z.array(z.object({ criterion: z.string(), points: z.number() })),
  space: z.string().regex(/^(lines:\d+|box:\d+|none)$/),
  sql_ref: z.string().optional(),
};

const taskSchema = z.looseObject(taskFields);

const sqlTaskSchema = z.looseObject({
  ...elementBase,
  db: z.enum(['musikschule', 'firma']),
  kind: z.enum(['query', 'ddl', 'dml']),
  prompt: z.string(),
  solution: z.string(),
  engines: z.array(z.enum(['fb', 'pg'])).default(['fb', 'pg']),
  solution_pg: z.string().optional(),
  dialect_note: z.string().optional(),
  ordered: z.boolean().optional(),
  check: z.string().optional(),
  hints: z.array(z.string()).optional(),
  paper_mode: z.enum(['write', 'predict']).optional(),
});

const examTaskSchema = z.looseObject({ ...taskFields, topic: z.string() });

const examSchema = z.looseObject({
  title: z.string(),
  minutes: z.number(),
  tasks: z.array(examTaskSchema),
});

const glossarySchema = z.looseObject({
  id: z.string(),
  de: z.string(),
  en: z.string(),
  keep_english: z.boolean(),
  def_de: z.string(),
  def_en: z.string(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Status = z.infer<typeof status>;
export type Review = z.infer<typeof review>;
export type SourceRef = z.infer<typeof sourceRefSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type GlossaryEntry = z.infer<typeof glossarySchema>;

export interface ResolvedSource extends SourceRef {
  source: Source;
}

interface WithSources {
  /** Own sources if declared, otherwise the sources of the topic summary. */
  resolvedSources: ResolvedSource[];
}

export type Summary = z.infer<typeof summaryFrontmatterSchema> &
  WithSources & {
    /** Markdown body without the "Typische Fehler" section. */
    body: string;
  };
export type Card = z.infer<typeof cardSchema> & WithSources;
export type QuizItem = z.infer<typeof quizSchema> & WithSources;
export type Task = z.infer<typeof taskSchema> & WithSources;
export type SqlTask = z.infer<typeof sqlTaskSchema> & WithSources;
export type ExamTask = z.infer<typeof examTaskSchema> & WithSources;

export interface Exam {
  /** `e01` for `exam-01.yml`; prefix of the task ids. */
  id: string;
  /** File name without extension, e.g. `exam-01`. */
  slug: string;
  title: string;
  minutes: number;
  tasks: ExamTask[];
}

export interface DiagramFile {
  name: string;
  path: string;
}

export interface TopicBundle {
  topic: Topic;
  summary: Summary | null;
  cards: Card[];
  quiz: QuizItem[];
  tasks: Task[];
  sqlTasks: SqlTask[];
  /** Markdown of the typical mistakes (pitfalls.md or the "Typische Fehler" section), or null. */
  pitfalls: string | null;
  diagrams: DiagramFile[];
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

/** Absolute content root: env `CONTENT_ROOT` (relative paths resolve against the cwd) or `../content`. */
export function contentRoot(): string {
  const fromEnv = process.env.CONTENT_ROOT;
  return resolve(fromEnv && fromEnv.trim() !== '' ? fromEnv : '../content');
}

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

function isDir(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

function readYaml(path: string): unknown {
  try {
    return parseYaml(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`Cannot parse YAML ${path}: ${(err as Error).message}`);
  }
}

/** Element files are top-level lists; an object wrapping exactly one list is accepted, too. */
function asList(data: unknown, path: string): unknown[] {
  if (data === null || data === undefined) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    const lists = Object.values(data as Record<string, unknown>).filter(Array.isArray);
    if (lists.length === 1) return lists[0] as unknown[];
  }
  throw new Error(`Expected a list in ${path}`);
}

function parseWith<T extends z.ZodType>(schema: T, data: unknown, where: string): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content in ${where}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

function readList<T extends z.ZodType>(schema: T, path: string): z.output<T>[] {
  if (!isFile(path)) return [];
  return asList(readYaml(path), path).map((item, i) => parseWith(schema, item, `${path} [${i}]`));
}

function splitFrontmatter(text: string, path: string): { data: unknown; body: string } {
  const match = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n([\s\S]*))?$/.exec(text);
  if (!match) throw new Error(`Missing YAML frontmatter in ${path}`);
  let data: unknown;
  try {
    data = parseYaml(match[1]);
  } catch (err) {
    throw new Error(`Cannot parse frontmatter of ${path}: ${(err as Error).message}`);
  }
  return { data, body: match[2] ?? '' };
}

const PITFALLS_HEADING = /^##[ \t]+Typische Fehler[ \t]*$/im;

/** Splits the "## Typische Fehler" section off a Markdown body. */
export function extractPitfalls(body: string): { body: string; pitfalls: string | null } {
  const heading = PITFALLS_HEADING.exec(body);
  if (!heading) return { body: body.trim(), pitfalls: null };
  const start = heading.index;
  const afterHeading = start + heading[0].length;
  const rest = body.slice(afterHeading);
  const next = /^##[ \t]+\S/m.exec(rest);
  const sectionEnd = next ? afterHeading + next.index : body.length;
  const pitfalls = body.slice(afterHeading, sectionEnd).trim();
  const remaining = (body.slice(0, start) + body.slice(sectionEnd)).trim();
  return { body: remaining, pitfalls: pitfalls === '' ? null : pitfalls };
}

/**
 * Removes a leading level-1/2 heading (e.g. "# Typische Fehler: ER-Modellierung" in pitfalls.md);
 * the page renders its own section heading.
 */
export function stripLeadingHeading(md: string): string {
  return md.replace(/^﻿?\s*#{1,2}[ \t]+[^\n]*(\r?\n|$)/, '').trim();
}

/** Removes a leading heading that only repeats `title` (the page renders the title as h1). */
export function stripTitleHeading(md: string, title: string): string {
  const match = /^﻿?\s*#{1,2}[ \t]+([^\n]*?)[ \t#]*(\r?\n|$)/.exec(md);
  if (!match || match[1].trim().toLocaleLowerCase('de') !== title.trim().toLocaleLowerCase('de')) return md;
  return md.slice(match[0].length).trim();
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

function loadSources(root: string): Record<string, Source> {
  const candidates = [join(root, 'sources.yml'), join(root, '..', 'sources.yml')];
  const path = candidates.find(isFile);
  if (!path) return {};
  const out: Record<string, Source> = {};
  for (const source of readList(sourceSchema, path)) out[source.id] = source;
  return out;
}

function resolveRefs(refs: SourceRef[], sources: Record<string, Source>, where: string): ResolvedSource[] {
  return refs.map((ref) => {
    const source = sources[ref.id];
    if (!source) throw new Error(`Unknown source id "${ref.id}" in ${where}`);
    return { ...ref, source };
  });
}

/** Visible source note as required by spec §8: "Basiert auf: <Titel> (<Lizenz>), <ref>". */
export function formatSourceNote(resolved: ResolvedSource): string {
  const ref = resolved.ref.trim();
  return `Basiert auf: ${resolved.source.title} (${resolved.source.license})${ref ? `, ${ref}` : ''}`;
}

/** Sources of kind `further-reading`, shown only in the "Weiterführende Literatur" list. */
export function getFurtherReading(root: string = contentRoot()): Source[] {
  return Object.values(getSources(root))
    .filter((s) => s.kind === 'further-reading')
    .sort((a, b) => a.title.localeCompare(b.title, 'de'));
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

function loadTopics(root: string): Topic[] {
  const path = join(root, 'topics.yml');
  if (!isFile(path)) throw new Error(`topics.yml not found in content root ${root}`);
  return readList(topicSchema, path).sort((a, b) => a.order - b.order);
}

function topicDir(topic: Topic, root: string): string | null {
  const base = join(root, LANG, 'topics');
  if (!isDir(base)) return null;
  const preferred = join(base, `${topic.id}-${topic.slug}`);
  if (isDir(preferred)) return preferred;
  const match = readdirSync(base)
    .filter((name) => name === topic.id || name.startsWith(`${topic.id}-`))
    .map((name) => join(base, name))
    .find(isDir);
  return match ?? null;
}

const DIAGRAM_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.dot$/;

function listDiagrams(dir: string | null): DiagramFile[] {
  if (!dir) return [];
  const diagramDir = join(dir, 'diagrams');
  if (!isDir(diagramDir)) return [];
  return readdirSync(diagramDir)
    .filter((name) => DIAGRAM_NAME.test(name) && !name.includes('..'))
    .sort()
    .map((name) => ({ name, path: join(diagramDir, name) }));
}

function findTopic(id: string, root: string): Topic {
  const topic = getTopics(root).find((t) => t.id === id);
  if (!topic) throw new Error(`Unknown topic id "${id}"`);
  return topic;
}

function loadTopic(id: string, root: string): TopicBundle {
  const topic = findTopic(id, root);
  const dir = topicDir(topic, root);
  const empty: TopicBundle = { topic, summary: null, cards: [], quiz: [], tasks: [], sqlTasks: [], pitfalls: null, diagrams: [] };
  if (!dir) return empty;

  const sources = getSources(root);
  let summary: Summary | null = null;
  let pitfalls: string | null = null;

  const summaryPath = join(dir, 'summary.md');
  if (isFile(summaryPath)) {
    const { data, body } = splitFrontmatter(readFileSync(summaryPath, 'utf8'), summaryPath);
    const fm = parseWith(summaryFrontmatterSchema, data, summaryPath);
    const split = extractPitfalls(stripTitleHeading(body.trim(), fm.title));
    pitfalls = split.pitfalls;
    summary = { ...fm, body: split.body, resolvedSources: resolveRefs(fm.sources, sources, summaryPath) };
  }

  const pitfallsPath = join(dir, 'pitfalls.md');
  if (isFile(pitfallsPath)) {
    const text = stripLeadingHeading(readFileSync(pitfallsPath, 'utf8'));
    pitfalls = text === '' ? pitfalls : text;
  }

  const inherited = summary?.resolvedSources ?? [];
  const withSources = <T extends { id: string; sources?: SourceRef[] }>(items: T[], file: string): (T & WithSources)[] =>
    items.map((item) => ({
      ...item,
      resolvedSources: item.sources ? resolveRefs(item.sources, sources, `${file} (${item.id})`) : inherited,
    }));

  const file = (name: string) => join(dir, name);
  return {
    topic,
    summary,
    cards: withSources(readList(cardSchema, file('cards.yml')), file('cards.yml')),
    quiz: withSources(readList(quizSchema, file('quiz.yml')), file('quiz.yml')),
    tasks: withSources(readList(taskSchema, file('tasks.yml')), file('tasks.yml')),
    sqlTasks: withSources(readList(sqlTaskSchema, file('sql-tasks.yml')), file('sql-tasks.yml')),
    pitfalls,
    diagrams: listDiagrams(dir),
  };
}

/**
 * Returns the DOT source of `diagrams/<name>.dot` of a topic. `name` may be given with or without
 * the `.dot` extension (cards reference diagrams without it).
 */
export function getDiagram(topicId: string, name: string, root: string = contentRoot()): string {
  name = name.endsWith('.dot') ? name : `${name}.dot`;
  if (!DIAGRAM_NAME.test(name) || name.includes('..')) throw new Error(`Invalid diagram name "${name}"`);
  const dir = topicDir(findTopic(topicId, root), root);
  const path = dir ? join(dir, 'diagrams', name) : null;
  if (!path || !isFile(path)) throw new Error(`Diagram "${name}" not found for topic ${topicId}`);
  return readFileSync(path, 'utf8');
}

export interface TopicOverview {
  topic: Topic;
  status: Status | null;
  hasSummary: boolean;
  counts: { cards: number; quiz: number; tasks: number; sqlTasks: number };
  /** Sum of the `minutes` of all paper tasks. */
  taskMinutes: number;
}

/** Per-topic counts for dashboard, topic list and study plan. */
export function getOverview(root: string = contentRoot()): TopicOverview[] {
  return getTopics(root).map((topic) => {
    const b = getTopic(topic.id, root);
    return {
      topic,
      status: b.summary?.status ?? null,
      hasSummary: b.summary !== null,
      counts: { cards: b.cards.length, quiz: b.quiz.length, tasks: b.tasks.length, sqlTasks: b.sqlTasks.length },
      taskMinutes: b.tasks.reduce((sum, t) => sum + t.minutes, 0),
    };
  });
}

// ---------------------------------------------------------------------------
// Exams and glossary
// ---------------------------------------------------------------------------

const EXAM_FILE = /^exam-(\d{2})\.yml$/;

function loadExams(root: string): Exam[] {
  const dir = join(root, LANG, 'exams');
  if (!isDir(dir)) return [];
  const sources = getSources(root);
  return readdirSync(dir)
    .filter((name) => EXAM_FILE.test(name))
    .sort()
    .map((name) => {
      const path = join(dir, name);
      const exam = parseWith(examSchema, readYaml(path), path);
      const nn = EXAM_FILE.exec(name)![1];
      return {
        id: `e${nn}`,
        slug: name.replace(/\.yml$/, ''),
        title: exam.title,
        minutes: exam.minutes,
        tasks: exam.tasks.map((task) => ({
          ...task,
          resolvedSources: task.sources ? resolveRefs(task.sources, sources, `${path} (${task.id})`) : [],
        })),
      };
    });
}

function loadGlossary(root: string): GlossaryEntry[] {
  const path = [join(root, 'glossary.yml'), join(root, LANG, 'glossary.yml')].find(isFile);
  if (!path) return [];
  return readList(glossarySchema, path).sort((a, b) => a.de.localeCompare(b.de, 'de'));
}

// ---------------------------------------------------------------------------
// Public, cached accessors
// ---------------------------------------------------------------------------

/**
 * Parsed content is cached per content root and key: a build renders many pages from the same files.
 * `astro dev` (NODE_ENV=development) bypasses the cache so content edits show up on reload.
 */
const cache = new Map<string, Map<string, unknown>>();

function cached<T>(root: string, key: string, load: () => T): T {
  if (process.env.NODE_ENV === 'development') return load();
  const absRoot = resolve(root);
  let perRoot = cache.get(absRoot);
  if (!perRoot) {
    perRoot = new Map();
    cache.set(absRoot, perRoot);
  }
  if (!perRoot.has(key)) perRoot.set(key, load());
  return perRoot.get(key) as T;
}

/** Drops all cached content (tests, long-running processes). */
export function clearContentCache(): void {
  cache.clear();
}

export function getSources(root: string = contentRoot()): Record<string, Source> {
  return cached(root, 'sources', () => loadSources(root));
}

export function getTopics(root: string = contentRoot()): Topic[] {
  return cached(root, 'topics', () => loadTopics(root));
}

export function getTopic(id: string, root: string = contentRoot()): TopicBundle {
  return cached(root, `topic:${id}`, () => loadTopic(id, root));
}

export function getExams(root: string = contentRoot()): Exam[] {
  return cached(root, 'exams', () => loadExams(root));
}

export function getGlossary(root: string = contentRoot()): GlossaryEntry[] {
  return cached(root, 'glossary', () => loadGlossary(root));
}
