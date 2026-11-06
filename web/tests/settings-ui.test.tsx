// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Settings from '../src/components/Settings';
import { progress } from '../src/lib/progress';
import { clearSettingsMemory, NEW_CARDS_KEY, readNewCardLimit } from '../src/lib/settings';
import { PROGRESS_PREFIX } from '../src/lib/storage';

function unit(container: Element, name: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(`[data-verify-unit="${name}"]`);
  if (!el) throw new Error(`unit ${name} not found`);
  return el;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  progress.reset();
  clearSettingsMemory();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Settings', () => {
  it('is ready after mount and bundles theme, learning and progress', async () => {
    const { container } = render(<Settings />);
    await waitFor(() => expect(unit(container, 'settings').dataset.verifyState).toBe('ready'));
    expect(unit(container, 'settings').dataset.verifyCount).toBe('2');
    expect(unit(container, 'theme-switch')).toBeTruthy();
    expect(unit(container, 'progress-transfer')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Lernen' })).toBeTruthy();
  });

  it('shows the default daily limit of new cards and stores a changed one', async () => {
    const { container } = render(<Settings />);
    const input = (await screen.findByLabelText('Neue Karten pro Tag')) as HTMLInputElement;
    expect(input.value).toBe('20');
    fireEvent.input(input, { target: { value: '35' } });
    fireEvent.click(screen.getByRole('button', { name: 'Limit übernehmen' }));
    expect(localStorage.getItem(NEW_CARDS_KEY)).toBe('35');
    await waitFor(() => expect(within(unit(container, 'settings')).getByText(/Limit gespeichert/)).toBeTruthy());
  });

  it('rejects invalid limits with an error and keeps the stored value', async () => {
    localStorage.setItem(NEW_CARDS_KEY, '12');
    render(<Settings />);
    const input = (await screen.findByLabelText('Neue Karten pro Tag')) as HTMLInputElement;
    expect(input.value).toBe('12');
    for (const bad of ['-3', 'abc', '1.5', '', '501']) {
      fireEvent.input(input, { target: { value: bad } });
      fireEvent.click(screen.getByRole('button', { name: 'Limit übernehmen' }));
      await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
      expect(screen.getByRole('alert').textContent).toContain('0 und 500');
      expect(localStorage.getItem(NEW_CARDS_KEY)).toBe('12');
    }
  });

  it('allows a limit of 0 (no new cards)', async () => {
    render(<Settings />);
    const input = (await screen.findByLabelText('Neue Karten pro Tag')) as HTMLInputElement;
    fireEvent.input(input, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Limit übernehmen' }));
    expect(localStorage.getItem(NEW_CARDS_KEY)).toBe('0');
  });

  it('warns if the limit cannot be stored', async () => {
    render(<Settings />);
    const input = (await screen.findByLabelText('Neue Karten pro Tag')) as HTMLInputElement;
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
      removeItem: () => undefined,
    });
    fireEvent.input(input, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Limit übernehmen' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('nicht gespeichert'));
    // G3: the value is kept in memory, and the message says honestly how far that reaches
    expect(readNewCardLimit()).toBe(5);
    const text = screen.getByRole('alert').textContent ?? '';
    expect(text).toMatch(/solange diese Seite geöffnet ist/);
    expect(text).toMatch(/andere Seiten/i);
    expect(text).not.toMatch(/bis du die Seite verlässt/);
  });

  it('works without storage', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { container } = render(<Settings />);
    await waitFor(() => expect(unit(container, 'settings').dataset.verifyState).toBe('ready'));
    expect(((await screen.findByLabelText('Neue Karten pro Tag')) as HTMLInputElement).value).toBe('20');
  });

  it('export downloads the progress as JSON', async () => {
    localStorage.setItem(`${PROGRESS_PREFIX}cards`, '{}');
    let blob: Blob | undefined;
    const createObjectURL = vi.fn((b: Blob) => {
      blob = b;
      return 'blob:test';
    });
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<Settings />);
    fireEvent.click(await screen.findByRole('button', { name: 'Fortschritt exportieren' }));
    expect(click).toHaveBeenCalledOnce();
    expect(blob?.type).toBe('application/json');
    const parsed = JSON.parse(await blob!.text());
    expect(parsed.format).toBe('db1-progress');
    expect(parsed.data[`${PROGRESS_PREFIX}cards`]).toBe('{}');
  });

  it('import of an invalid file shows an error and keeps the progress', async () => {
    localStorage.setItem(`${PROGRESS_PREFIX}cards`, '{}');
    render(<Settings />);
    const input = await screen.findByLabelText('Fortschritt importieren (JSON-Datei)');
    fireEvent.change(input, { target: { files: [new File(['{"format":"anderes"}'], 'x.json', { type: 'application/json' })] } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Import fehlgeschlagen'));
    expect(localStorage.getItem(`${PROGRESS_PREFIX}cards`)).toBe('{}');
  });

  it('reset asks first and deletes only after the confirmation', async () => {
    localStorage.setItem(`${PROGRESS_PREFIX}cards`, '{}');
    render(<Settings />);
    fireEvent.click(await screen.findByRole('button', { name: 'Fortschritt zurücksetzen' }));
    expect(screen.getByText('Gesamten Fortschritt unwiderruflich löschen?')).toBeTruthy();
    expect(localStorage.getItem(`${PROGRESS_PREFIX}cards`)).toBe('{}');
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(localStorage.getItem(`${PROGRESS_PREFIX}cards`)).toBe('{}');
    fireEvent.click(screen.getByRole('button', { name: 'Fortschritt zurücksetzen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ja, alles löschen' }));
    await waitFor(() => expect(localStorage.getItem(`${PROGRESS_PREFIX}cards`)).toBeNull());
  });

  it('keeps the daily limit when the progress is reset (it is a setting, not progress)', async () => {
    localStorage.setItem(NEW_CARDS_KEY, '7');
    localStorage.setItem(`${PROGRESS_PREFIX}cards`, '{}');
    render(<Settings />);
    fireEvent.click(await screen.findByRole('button', { name: 'Fortschritt zurücksetzen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ja, alles löschen' }));
    await waitFor(() => expect(localStorage.getItem(`${PROGRESS_PREFIX}cards`)).toBeNull());
    expect(localStorage.getItem(NEW_CARDS_KEY)).toBe('7');
  });
});
