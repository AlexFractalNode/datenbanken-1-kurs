// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProgressTransfer from '../src/components/ProgressTransfer';
import ThemeSwitch from '../src/components/ThemeSwitch';
import { PROGRESS_PREFIX, THEME_KEY } from '../src/lib/storage';

function unit(container: Element, name: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(`[data-verify-unit="${name}"]`);
  if (!el) throw new Error(`unit ${name} not found`);
  return el;
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ThemeSwitch', () => {
  it('offers three options and is ready after mount', async () => {
    const { container } = render(<ThemeSwitch />);
    const el = unit(container, 'theme-switch');
    await waitFor(() => expect(el.dataset.verifyState).toBe('ready'));
    expect(el.dataset.verifyCount).toBe('3');
    expect(screen.getByRole('radio', { name: 'System' })).toHaveProperty('checked', true);
  });

  it('applies and stores the chosen theme', async () => {
    render(<ThemeSwitch />);
    fireEvent.click(screen.getByRole('radio', { name: 'Dunkel' }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    fireEvent.click(screen.getByRole('radio', { name: 'System' }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBeUndefined());
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
  });

  it('restores a stored preference', async () => {
    localStorage.setItem(THEME_KEY, 'light');
    render(<ThemeSwitch />);
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Hell' })).toHaveProperty('checked', true));
  });

  it('still switches the theme without storage', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { container } = render(<ThemeSwitch />);
    fireEvent.click(screen.getByRole('radio', { name: 'Hell' }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
    expect(unit(container, 'theme-switch').dataset.verifyState).toBe('ready');
  });

  it('compact variant cycles system → light → dark', async () => {
    const { container } = render(<ThemeSwitch variant="compact" />);
    const button = screen.getByRole('button');
    await waitFor(() => expect(unit(container, 'theme-toggle').dataset.verifyState).toBe('ready'));
    expect(button.getAttribute('aria-label')).toContain('System');
    fireEvent.click(button);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'));
    fireEvent.click(button);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
  });
});

describe('ProgressTransfer', () => {
  it('is empty without stored progress', async () => {
    const { container } = render(<ProgressTransfer />);
    const el = unit(container, 'progress-transfer');
    await waitFor(() => expect(el.dataset.verifyState).toBe('empty'));
    expect(el.dataset.verifyCount).toBe('0');
  });

  it('counts stored progress entries', async () => {
    localStorage.setItem(`${PROGRESS_PREFIX}cards`, '{}');
    localStorage.setItem(`${PROGRESS_PREFIX}quiz`, '{}');
    const { container } = render(<ProgressTransfer />);
    const el = unit(container, 'progress-transfer');
    await waitFor(() => expect(el.dataset.verifyState).toBe('ready'));
    expect(el.dataset.verifyCount).toBe('2');
  });

  it('reports an error state when storage is unavailable', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { container } = render(<ProgressTransfer />);
    const el = unit(container, 'progress-transfer');
    await waitFor(() => expect(el.dataset.verifyState).toBe('error'));
    expect(el.dataset.verifyError).toContain('Speicher');
  });

  it('resets after an explicit confirmation', async () => {
    localStorage.setItem(`${PROGRESS_PREFIX}cards`, '{}');
    const { container } = render(<ProgressTransfer />);
    fireEvent.click(await screen.findByRole('button', { name: 'Fortschritt zurücksetzen' }));
    expect(localStorage.getItem(`${PROGRESS_PREFIX}cards`)).toBe('{}');
    fireEvent.click(screen.getByRole('button', { name: 'Ja, alles löschen' }));
    await waitFor(() => expect(unit(container, 'progress-transfer').dataset.verifyState).toBe('empty'));
    expect(localStorage.getItem(`${PROGRESS_PREFIX}cards`)).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('zurückgesetzt');
  });

  it('imports a progress file', async () => {
    const { container } = render(<ProgressTransfer />);
    const input = await screen.findByLabelText('Fortschritt importieren (JSON-Datei)');
    const payload = JSON.stringify({ format: 'db1-progress', version: 1, exportedAt: '', data: { [`${PROGRESS_PREFIX}x`]: '1' } });
    const file = new File([payload], 'fortschritt.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(unit(container, 'progress-transfer').dataset.verifyCount).toBe('1'));
    expect(screen.getByRole('status').textContent).toContain('importiert');
  });

  it('shows an import error for a broken file and stays usable', async () => {
    const { container } = render(<ProgressTransfer />);
    const input = await screen.findByLabelText('Fortschritt importieren (JSON-Datei)');
    const file = new File(['{kaputt'], 'x.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('kein JSON'));
    expect(unit(container, 'progress-transfer').dataset.verifyState).toBe('empty');
  });
});
