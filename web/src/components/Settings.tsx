import { useEffect, useState } from 'preact/hooks';
import { DEFAULT_NEW_CARDS_PER_DAY, MAX_NEW_CARDS_PER_DAY, parseNewCardLimit, readNewCardLimit, writeNewCardLimit } from '../lib/settings';
import ProgressTransfer from './ProgressTransfer';
import ThemeSwitch from './ThemeSwitch';

type UnitState = 'loading' | 'ready';

const LIMIT_ERROR = `Bitte eine ganze Zahl zwischen 0 und ${MAX_NEW_CARDS_PER_DAY} eingeben.`;

/**
 * Settings page: colour scheme, daily limit of new cards, and export/import/reset of the progress.
 * The limit is a setting (`db1:settings:*`), so a reset of the progress keeps it.
 */
export default function Settings() {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState('20');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setValue(String(readNewCardLimit()));
    setMounted(true);
  }, []);

  const state: UnitState = mounted ? 'ready' : 'loading';

  const onSubmit = (event: Event) => {
    event.preventDefault();
    setMessage('');
    const parsed = parseNewCardLimit(value);
    if (parsed === null) {
      setError(LIMIT_ERROR);
      return;
    }
    const result = writeNewCardLimit(parsed);
    if (result.ok) {
      setError('');
      setMessage(parsed === 0 ? 'Limit gespeichert: Es werden keine neuen Karten angeboten.' : `Limit gespeichert: ${parsed} neue Karten pro Tag.`);
    } else {
      setError(
        `Das Limit wurde nicht gespeichert (Speicher nicht verfügbar). ${parsed} neue Karten pro Tag gelten nur, solange diese Seite geöffnet ist; ` +
          `andere Seiten wie der Kartentrainer verwenden weiter das zuletzt gespeicherte Limit (sonst den Standard von ${DEFAULT_NEW_CARDS_PER_DAY}).`,
      );
    }
  };

  return (
    <div data-verify-unit="settings" data-verify-state={state} data-verify-count={2}>
      <section class="panel" aria-labelledby="look-heading">
        <h2 id="look-heading">Darstellung</h2>
        <ThemeSwitch variant="full" />
      </section>

      <section class="panel" aria-labelledby="learn-heading">
        <h2 id="learn-heading">Lernen</h2>
        <form onSubmit={onSubmit} noValidate>
          <div class="field">
            <label for="new-cards-limit">Neue Karten pro Tag</label>
            <input
              id="new-cards-limit"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={value}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'new-cards-hint new-cards-error' : 'new-cards-hint'}
              disabled={!mounted}
              onInput={(e) => setValue((e.currentTarget as HTMLInputElement).value)}
            />
            <p class="hint" id="new-cards-hint">
              So viele noch nie gesehene Karten bietet der Kartentrainer pro Tag an (Standard: 20; 0 = keine neuen Karten). Fällige
              Wiederholungen zählen nicht dazu.
            </p>
          </div>
          {error && (
            <p role="alert" class="notice notice--error" id="new-cards-error">
              {error}
            </p>
          )}
          <div class="button-row">
            <button type="submit" class="button" disabled={!mounted}>
              Limit übernehmen
            </button>
          </div>
          <p role="status" class="status-line">
            {message}
          </p>
        </form>
      </section>

      <ProgressTransfer />
    </div>
  );
}
