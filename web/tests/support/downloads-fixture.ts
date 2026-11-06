import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Creates a tiny downloads directory like `dist/` (two PDFs, one Anki deck). The files are written on
 * demand because the repository ignores `*.pdf`; their content does not matter for the tests.
 */
export function makeDownloadsFixture(dir: string): string {
  mkdirSync(join(dir, 'pdf'), { recursive: true });
  mkdirSync(join(dir, 'anki'), { recursive: true });
  writeFileSync(join(dir, 'pdf', 'exam-01.pdf'), '%PDF-1.4\n% test fixture, not a real document\n');
  writeFileSync(join(dir, 'pdf', 'cheatsheet.pdf'), '%PDF-1.4\n% test fixture\n');
  writeFileSync(join(dir, 'anki', 'db1-de.apkg'), 'PK test fixture');
  return dir;
}
