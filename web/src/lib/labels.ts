/** German UI labels for content enums. */
import type { Status, Task } from './content';

export const STATUS_LABEL: Record<Status, string> = {
  draft: 'Entwurf',
  reviewed: 'geprüft',
  verified: 'verifiziert',
};

export const STATUS_CLASS: Record<Status, string> = {
  draft: 'badge badge--warn',
  reviewed: 'badge badge--ok',
  verified: 'badge badge--ok',
};

export const TASK_TYPE_LABEL: Record<Task['type'], string> = {
  'define-example': 'Definieren & Beispiel',
  'erm-model': 'ER-Modell erstellen',
  'erm-read': 'ER-Modell lesen',
  'erm-to-sql': 'ERM → SQL',
  normalize: 'Normalisieren',
  relalg: 'Relationale Algebra',
  'sql-write': 'SQL schreiben',
  'sql-predict': 'SQL-Ergebnis vorhersagen',
  '3vl': 'Dreiwertige Logik',
  explain: 'Erklären',
};

export const DIFFICULTY_LABEL: Record<1 | 2 | 3, string> = { 1: 'leicht', 2: 'mittel', 3: 'anspruchsvoll' };

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
