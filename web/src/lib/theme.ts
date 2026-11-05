/**
 * Colour scheme preference: `system` follows `prefers-color-scheme`, `light`/`dark` override it
 * via `data-theme` on <html>. The early inline script in Base.astro mirrors `readTheme` + `applyTheme`
 * to avoid a flash of the wrong theme; keep both in sync.
 */
import { THEME_KEY, readItem, removeItem, writeItem } from './storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export const THEME_OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark'];
export const THEME_LABELS: Record<ThemePreference, string> = { system: 'System', light: 'Hell', dark: 'Dunkel' };
export const THEME_EVENT = 'db1:themechange';

export function readTheme(): ThemePreference {
  const stored = readItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function applyTheme(pref: ThemePreference, root: HTMLElement = document.documentElement): void {
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;
}

/** Applies, persists (best effort) and broadcasts the preference to other switches on the page. */
export function setTheme(pref: ThemePreference): void {
  applyTheme(pref);
  if (pref === 'system') removeItem(THEME_KEY);
  else writeItem(THEME_KEY, pref);
  try {
    window.dispatchEvent(new CustomEvent<ThemePreference>(THEME_EVENT, { detail: pref }));
  } catch {
    // Older environments without CustomEvent: switches simply do not sync.
  }
}

export function nextTheme(pref: ThemePreference): ThemePreference {
  return THEME_OPTIONS[(THEME_OPTIONS.indexOf(pref) + 1) % THEME_OPTIONS.length];
}
