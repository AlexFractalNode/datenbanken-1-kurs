import { useEffect, useRef, useState } from 'preact/hooks';
import { VERSION_KEY, progress } from '../lib/progress';
import { STORAGE_UNAVAILABLE, isStorageAvailable, isStorageReadable, listProgressKeys } from '../lib/storage';

/** Stored progress areas; the version marker is bookkeeping, not an area. */
const countAreas = (keys: string[]) => keys.filter((key) => key !== VERSION_KEY).length;

type UnitState = 'loading' | 'empty' | 'ready' | 'error';

function downloadJson(filename: string, content: string): boolean {
  try {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch {
    return false;
  }
}

export default function ProgressTransfer() {
  const [mounted, setMounted] = useState(false);
  /** Storage accepts writes (import needs that). */
  const [available, setAvailable] = useState(true);
  /** Storage can be read (export and reset still work with a full quota). */
  const [readable, setReadable] = useState(true);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  /** Set when the confirmation closes, so the focus returns to the reset button (not on page load). */
  const returnFocus = useRef(false);

  const refresh = () => setCount(countAreas(listProgressKeys()));

  useEffect(() => {
    setAvailable(isStorageAvailable());
    setReadable(isStorageReadable());
    refresh();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
    else if (returnFocus.current) resetRef.current?.focus();
    returnFocus.current = false;
  }, [confirming]);

  const state: UnitState = !mounted ? 'loading' : !available ? 'error' : count === 0 ? 'empty' : 'ready';

  const onExport = () => {
    setError('');
    const now = new Date();
    // progress.export migrates and repairs first, so the file can always be imported again.
    const json = progress.export(now);
    let entries = 0;
    try {
      entries = countAreas(Object.keys((JSON.parse(json) as { data: Record<string, string> }).data));
    } catch {
      // progress.export always returns valid JSON; the count is only informative.
    }
    if (downloadJson(`db1-fortschritt-${now.toISOString().slice(0, 10)}.json`, json)) {
      setMessage(`${entries} Bereiche exportiert.`);
    } else {
      setError('Export fehlgeschlagen: Der Browser erlaubt keinen Download.');
    }
  };

  const onImport = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setMessage('');
    setError('');
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError('Die Datei konnte nicht gelesen werden.');
      return;
    }
    // progress.import validates the known areas before storage.ts replaces the stored state.
    const result = progress.import(text);
    if (result.ok) {
      setMessage(`${result.count} Bereiche importiert.`);
    } else {
      setError(`Import fehlgeschlagen: ${result.error}`);
    }
    refresh();
    try {
      input.value = '';
    } catch {
      // Some environments do not allow resetting file inputs; harmless.
    }
  };

  const onConfirmReset = () => {
    const removed = progress.reset();
    returnFocus.current = true;
    setConfirming(false);
    setError('');
    setMessage(`Fortschritt zurückgesetzt (${removed} Bereiche gelöscht).`);
    refresh();
  };

  const onCancelReset = () => {
    returnFocus.current = true;
    setConfirming(false);
  };

  const disabled = !mounted || !available;
  // Export also covers the in-memory state; reset only needs storage that can be accessed.
  const exportDisabled = !mounted;
  const resetDisabled = !mounted || !readable;

  return (
    <section
      class="panel progress-transfer"
      aria-labelledby="progress-transfer-title"
      data-verify-unit="progress-transfer"
      data-verify-state={state}
      data-verify-count={count}
      {...(state === 'error' ? { 'data-verify-error': STORAGE_UNAVAILABLE } : {})}
    >
      <h2 id="progress-transfer-title">Fortschritt</h2>
      <p>
        Dein Lernstand liegt nur in diesem Browser. Sichere ihn als Datei, um ihn auf ein anderes Gerät zu übertragen.
      </p>
      {mounted && !available && <p class="notice notice--warn">{STORAGE_UNAVAILABLE}</p>}
      {mounted && readable && (
        <p class="meta">
          Gespeicherte Bereiche: <strong>{count}</strong>
        </p>
      )}

      <div class="button-row">
        <button type="button" class="button" onClick={onExport} disabled={exportDisabled}>
          Fortschritt exportieren
        </button>
      </div>

      <div class="field">
        <label for="progress-import">Fortschritt importieren (JSON-Datei)</label>
        <input id="progress-import" type="file" accept="application/json,.json" onChange={onImport} disabled={disabled} />
        <p class="hint">Der Import ersetzt den aktuellen Stand.</p>
      </div>

      <div class="button-row">
        {!confirming ? (
          <button ref={resetRef} type="button" class="button button--danger" onClick={() => setConfirming(true)} disabled={resetDisabled}>
            Fortschritt zurücksetzen
          </button>
        ) : (
          <div class="confirm" role="group" aria-labelledby="confirm-reset-text">
            <p id="confirm-reset-text">Gesamten Fortschritt unwiderruflich löschen?</p>
            <button ref={confirmRef} type="button" class="button button--danger" onClick={onConfirmReset}>
              Ja, alles löschen
            </button>
            <button type="button" class="button button--ghost" onClick={onCancelReset}>
              Abbrechen
            </button>
          </div>
        )}
      </div>

      <p role="status" class="status-line">
        {message}
      </p>
      {error && (
        <p role="alert" class="notice notice--error">
          {error}
        </p>
      )}
    </section>
  );
}
