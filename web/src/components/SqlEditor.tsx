import type { EditorView } from '@codemirror/view';
import { useEffect, useRef, useState } from 'preact/hooks';

interface Props {
  id: string;
  /** Id of the visible label element. */
  labelId: string;
  value: string;
  /**
   * Bump to push `value` into CodeMirror (task switch, reset). While the user types, `value` merely echoes
   * the editor and must not be written back: with a render lag that would revert characters in a loop.
   */
  syncKey: number;
  onInput: (value: string) => void;
  /** Ctrl/Cmd + Enter. */
  onRun?: () => void;
  readOnly?: boolean;
  /** Describes keyboard help etc.; set on the text field. */
  describedBy?: string;
  /** false: plain textarea only (tests, or when CodeMirror cannot load). */
  codeMirror?: boolean;
  placeholder?: string;
}

type Mode = 'plain' | 'loading' | 'cm';

/**
 * SQL input. A real `<textarea>` is always there first (works without JavaScript modules, on slow
 * connections and for assistive technology); CodeMirror 6 with SQL highlighting replaces it as soon as
 * it is loaded. Tab is not captured, so keyboard users can always leave the field.
 */
export default function SqlEditor({ id, labelId, value, syncKey, onInput, onRun, readOnly = false, describedBy, codeMirror = true, placeholder }: Props) {
  const [mode, setMode] = useState<Mode>(codeMirror ? 'loading' : 'plain');
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latest = useRef({ onInput, onRun, value });
  latest.current = { onInput, onRun, value };

  useEffect(() => {
    if (!codeMirror) return;
    let cancelled = false;
    (async () => {
      try {
        const { createSqlView } = await import('../lib/cm-sql');
        if (cancelled || !host.current) return;
        view.current = createSqlView(host.current, {
          doc: latest.current.value,
          labelId,
          describedBy,
          placeholder,
          readOnly,
          onChange: (v) => latest.current.onInput(v),
          onRun: () => latest.current.onRun?.(),
        });
        setMode('cm');
      } catch {
        if (!cancelled) setMode('plain');
      }
    })();
    return () => {
      cancelled = true;
      view.current?.destroy();
      view.current = null;
    };
    // The editor is created once; value/readOnly are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeMirror]);

  // Programmatic changes (task switch, reset) flow into CodeMirror only when `syncKey` changes.
  useEffect(() => {
    const v = view.current;
    const next = latest.current.value;
    if (v && v.state.doc.toString() !== next) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: next } });
  }, [syncKey, mode]);

  useEffect(() => {
    void import('../lib/cm-sql').then(({ setReadOnly }) => view.current && setReadOnly(view.current, readOnly)).catch(() => undefined);
  }, [readOnly, mode]);

  return (
    <div class="sql-editor" data-editor={mode}>
      {mode !== 'cm' && (
        <textarea
          id={id}
          class="sql-editor__plain"
          rows={8}
          spellcheck={false}
          autocapitalize="off"
          autocomplete="off"
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-describedby={describedBy}
          onInput={(e) => onInput((e.currentTarget as HTMLTextAreaElement).value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              onRun?.();
            }
          }}
        />
      )}
      <div ref={host} class="sql-editor__cm" hidden={mode !== 'cm'} />
    </div>
  );
}
