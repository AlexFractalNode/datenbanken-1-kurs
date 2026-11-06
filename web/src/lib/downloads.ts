/**
 * Downloads: the PDFs of `tools/pdf.py` (`dist/pdf`) and the Anki decks of `tools/anki_export.py`
 * (`dist/anki`), as the CI builds them. The expected file names follow from the content; whether a
 * file is really there is checked at build time against the downloads directory (env `DOWNLOADS_DIR`,
 * default `../dist` relative to `web/`). Files that exist are published under `downloads/<file>`,
 * missing ones are shown with a note instead of a broken link.
 */
import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { LANG, contentRoot, getExams, getTopic, getTopics } from './content';

export type DownloadGroup = 'anki' | 'anki-topic' | 'exam' | 'material' | 'sheets';

export interface DownloadItem {
  file: string;
  group: DownloadGroup;
  title: string;
  text: string;
  /** Topic id for per-topic files. */
  topic?: string;
  /** The file exists in the downloads directory of this build. */
  available: boolean;
}

const FILE_PATTERN = new RegExp(
  `^(?:db1-${LANG}(?:-t\\d{2})?\\.apkg|exam-\\d{2}(?:-loesung)?\\.pdf|cheatsheet\\.pdf|spickzettel-vorlage\\.pdf|(?:aufgaben|loesung)-t\\d{2}\\.pdf)$`,
);

/** True for the file names the build tools generate (no path separators, no traversal). */
export function isDownloadFile(name: string): boolean {
  return FILE_PATTERN.test(name);
}

export function downloadsDir(): string {
  const fromEnv = process.env.DOWNLOADS_DIR;
  return resolve(fromEnv && fromEnv.trim() !== '' ? fromEnv : '../dist');
}

/** Absolute path of a generated file below the downloads directory, or null if it is not there. */
export function resolveDownloadFile(name: string, dir: string = downloadsDir()): string | null {
  if (!isDownloadFile(name)) return null;
  const path = join(dir, name.endsWith('.apkg') ? 'anki' : 'pdf', name);
  return isNonEmptyFile(path) ? path : null;
}

function isNonEmptyFile(path: string): boolean {
  try {
    return existsSync(path) && statSync(path).isFile() && statSync(path).size > 0;
  } catch {
    return false;
  }
}

export function listDownloads(root: string = contentRoot(), dir: string = downloadsDir()): DownloadItem[] {
  const items: Omit<DownloadItem, 'available'>[] = [];
  const topics = getTopics(root).map((t) => ({ topic: t, bundle: getTopic(t.id, root) }));

  items.push({
    file: `db1-${LANG}.apkg`,
    group: 'anki',
    title: 'Anki-Kartenstapel (alle Themen)',
    text: 'Alle Lernkarten als Anki-Deck, ein Unterdeck pro Thema. Lässt sich mit dem Fortschritt in Anki weiterlernen.',
  });
  for (const { topic, bundle } of topics) {
    if (bundle.cards.length === 0) continue;
    items.push({
      file: `db1-${LANG}-${topic.id}.apkg`,
      group: 'anki-topic',
      topic: topic.id,
      title: `${topic.id} ${topic.title}`,
      text: `${bundle.cards.length} Karten dieses Themas.`,
    });
  }
  for (const exam of getExams(root)) {
    const n = exam.id.slice(1);
    items.push(
      { file: `exam-${n}.pdf`, group: 'exam', title: exam.title, text: `Zum Ausdrucken, ${exam.minutes} Minuten Bearbeitungszeit.` },
      { file: `exam-${n}-loesung.pdf`, group: 'exam', title: `${exam.title} – Lösung`, text: 'Musterlösung mit Bewertungsraster zur Selbstkontrolle.' },
    );
  }
  items.push(
    {
      file: 'cheatsheet.pdf',
      group: 'material',
      title: 'Cheatsheet',
      text: 'Die wichtigsten Begriffe, Notationen und SQL-Bausteine kompakt zum Ausdrucken.',
    },
    {
      file: 'spickzettel-vorlage.pdf',
      group: 'material',
      title: 'Spickzettel-Vorlage',
      text: 'Raster für den handschriftlichen Zettel; die Inhaltsliste steht auf der Seite Spickzettel.',
    },
  );
  for (const { topic, bundle } of topics) {
    if (bundle.tasks.length === 0) continue;
    items.push(
      {
        file: `aufgaben-${topic.id}.pdf`,
        group: 'sheets',
        topic: topic.id,
        title: `${topic.id} ${topic.title} – Aufgaben`,
        text: `${bundle.tasks.length} Aufgaben zum Ausdrucken.`,
      },
      {
        file: `loesung-${topic.id}.pdf`,
        group: 'sheets',
        topic: topic.id,
        title: `${topic.id} ${topic.title} – Lösungen`,
        text: 'Lösungen mit Bewertungsraster.',
      },
    );
  }
  return items.map((item) => ({ ...item, available: resolveDownloadFile(item.file, dir) !== null }));
}
