import { useEffect, useState } from 'preact/hooks';
import {
  THEME_EVENT,
  THEME_LABELS,
  THEME_OPTIONS,
  nextTheme,
  readTheme,
  setTheme,
  type ThemePreference,
} from '../lib/theme';

interface Props {
  /** `full`: radio group (settings page); `compact`: one cycling button (header). */
  variant?: 'full' | 'compact';
}

const ICONS: Record<ThemePreference, string> = {
  system: 'M12 3a9 9 0 1 0 0 18V3Z',
  light: 'M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10Zm0-5v3m0 14v3M4.2 4.2l2.1 2.1m11.4 11.4l2.1 2.1M2 12h3m14 0h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  dark: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
};

export default function ThemeSwitch({ variant = 'full' }: Props) {
  const [pref, setPref] = useState<ThemePreference>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPref(readTheme());
    setMounted(true);
    const onChange = (e: Event) => setPref((e as CustomEvent<ThemePreference>).detail);
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  const choose = (value: ThemePreference) => {
    setPref(value);
    setTheme(value);
  };

  const state = mounted ? 'ready' : 'loading';

  if (variant === 'compact') {
    const next = nextTheme(pref);
    return (
      <span class="theme-toggle" data-verify-unit="theme-toggle" data-verify-state={state} data-verify-count={THEME_OPTIONS.length}>
        <button
          type="button"
          class="icon-button"
          onClick={() => choose(next)}
          disabled={!mounted}
          aria-label={`Farbschema: ${THEME_LABELS[pref]}. Wechseln zu ${THEME_LABELS[next]}`}
          title={`Farbschema: ${THEME_LABELS[pref]}`}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d={ICONS[pref]} fill={pref === 'light' ? 'none' : 'currentColor'} stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
      </span>
    );
  }

  return (
    <fieldset class="segmented" data-verify-unit="theme-switch" data-verify-state={state} data-verify-count={THEME_OPTIONS.length}>
      <legend>Farbschema</legend>
      <div class="segmented__options">
        {THEME_OPTIONS.map((value) => (
          <label key={value} class="segmented__option">
            <input
              type="radio"
              name="theme"
              value={value}
              checked={pref === value}
              disabled={!mounted}
              onChange={() => choose(value)}
            />
            <span>{THEME_LABELS[value]}</span>
          </label>
        ))}
      </div>
      <p class="hint">„System“ folgt der Einstellung deines Geräts.</p>
    </fieldset>
  );
}
