/**
 * Defensive wrapper around `localStorage`.
 *
 * Every access is wrapped in try/catch: storage may be missing (SSR), disabled (privacy mode),
 * full (quota) or throw on access. The app must keep working without it, so all helpers return
 * neutral values instead of throwing.
 *
 * Key convention:
 *   - `db1:progress:<area>`  learning progress (exported, imported and reset as a whole)
 *   - `db1:settings:<name>`  UI settings (not part of the progress export)
 */

export const PROGRESS_PREFIX = 'db1:progress:';
export const THEME_KEY = 'db1:settings:theme';
export const PROGRESS_FORMAT = 'db1-progress';
export const PROGRESS_VERSION = 1;

export interface ProgressExport {
  format: typeof PROGRESS_FORMAT;
  version: typeof PROGRESS_VERSION;
  exportedAt: string;
  data: Record<string, string>;
}

export type ImportResult = { ok: true; count: number } | { ok: false; error: string };

export const STORAGE_UNAVAILABLE = 'Speicher nicht verfügbar – Fortschritt wird nur in diesem Tab gehalten.';

function storage(): Storage | null {
  try {
    const s = globalThis.localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

/**
 * True if localStorage exists and can be read. A full quota (several projects share the
 * `*.github.io` origin) still allows reading, so reading is checked separately from writing.
 */
export function isStorageReadable(): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.getItem('db1:probe');
    return true;
  } catch {
    return false;
  }
}

/** True if localStorage exists and accepts a write. */
export function isStorageAvailable(): boolean {
  const s = storage();
  if (!s) return false;
  try {
    const probe = 'db1:probe';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readItem(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeItem(key: string, value: string): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function listProgressKeys(): string[] {
  const s = storage();
  if (!s) return [];
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (key !== null && key.startsWith(PROGRESS_PREFIX)) keys.push(key);
    }
    return keys.sort();
  } catch {
    return [];
  }
}

export function exportProgress(now: Date = new Date()): ProgressExport {
  const data: Record<string, string> = {};
  for (const key of listProgressKeys()) {
    const value = readItem(key);
    if (value !== null) data[key] = value;
  }
  return { format: PROGRESS_FORMAT, version: PROGRESS_VERSION, exportedAt: now.toISOString(), data };
}

/** Validates an export file and replaces the stored progress. Existing progress is kept on any error. */
export function importProgress(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Die Datei enthält kein JSON.' };
  }
  if (typeof parsed !== 'object' || parsed === null) return { ok: false, error: 'Unbekanntes Format.' };
  const obj = parsed as Record<string, unknown>;
  if (obj.format !== PROGRESS_FORMAT) return { ok: false, error: 'Unbekanntes Format – keine Fortschrittsdatei dieses Kurses.' };
  if (obj.version !== PROGRESS_VERSION) return { ok: false, error: `Nicht unterstützte Version ${String(obj.version)}.` };
  if (typeof obj.data !== 'object' || obj.data === null || Array.isArray(obj.data)) {
    return { ok: false, error: 'Unbekanntes Format – Datenteil fehlt.' };
  }
  const entries = Object.entries(obj.data as Record<string, unknown>);
  for (const [key, value] of entries) {
    if (!key.startsWith(PROGRESS_PREFIX)) return { ok: false, error: `Unerwarteter Schlüssel „${key}“.` };
    if (typeof value !== 'string') return { ok: false, error: `Ungültiger Wert für „${key}“.` };
  }
  if (!isStorageAvailable()) return { ok: false, error: STORAGE_UNAVAILABLE };

  const backup = exportProgress().data;
  resetProgress();
  for (const [key, value] of entries) {
    if (!writeItem(key, value as string)) {
      // Roll back to the previous state so a failed import never loses progress.
      resetProgress();
      for (const [k, v] of Object.entries(backup)) writeItem(k, v);
      return { ok: false, error: 'Speichern fehlgeschlagen (Speicher voll?). Alter Stand wiederhergestellt.' };
    }
  }
  return { ok: true, count: entries.length };
}

/** Removes all progress keys; returns how many were removed. Settings are kept. */
export function resetProgress(): number {
  let removed = 0;
  for (const key of listProgressKeys()) if (removeItem(key)) removed++;
  return removed;
}
