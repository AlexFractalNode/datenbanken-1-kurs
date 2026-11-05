import { useEffect, useRef, useState } from 'preact/hooks';
import {
  STORAGE_UNAVAILABLE,
  exportProgress,
  importProgress,
  isStorageAvailable,
  listProgressKeys,
  resetProgress,
} from '../lib/storage';

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
  const [available, setAvailable] = useState(true);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);

  const refresh = () => setCount(listProgressKeys().length);

  useEffect(() => {
    setAvailable(isStorageAvailable());
    refresh();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const state: UnitState = !mounted ? 'loading' : !available ? 'error' : count === 0 ? 'empty' : 'ready';

  const onExport = () => {
    setError('');
    const data = exportProgress();
    const day = data.exportedAt.slice(0, 10);
    if (downloadJson(`db1-fortschritt-${day}.json`, JSON.stringify(data, null, 2))) {
      setMessage(`${Object.keys(data.data).length} Einträge exportiert.`);
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
    const result = importProgress(text);
    if (result.ok) {
      setMessage(`${result.count} Einträge importiert.`);
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
    const removed = resetProgress();
    setConfirming(false);
    setError('');
    setMessage(`Fortschritt zurückgesetzt (${removed} Einträge gelöscht).`);
    refresh();
    resetRef.current?.focus();
  };

  const onCancelReset = () => {
    setConfirming(false);
    resetRef.current?.focus();
  };

  const disabled = !mounted || !available;

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
      {mounted && available && (
        <p class="meta">
          Gespeicherte Bereiche: <strong>{count}</strong>
        </p>
      )}

      <div class="button-row">
        <button type="button" class="button" onClick={onExport} disabled={disabled}>
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
          <button ref={resetRef} type="button" class="button button--danger" onClick={() => setConfirming(true)} disabled={disabled}>
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
