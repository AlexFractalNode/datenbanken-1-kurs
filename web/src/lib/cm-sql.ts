/**
 * CodeMirror 6 setup for the playground (loaded lazily by SqlEditor).
 *
 * Colours only come from the CSS tokens (see styles/tokens.css), so the editor follows light, dark and the
 * manual theme switch without any JavaScript. Tab is not bound: keyboard users can leave the field.
 */
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { PostgreSQL, sql } from '@codemirror/lang-sql';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, placeholder as placeholderExt } from '@codemirror/view';
import { tags } from '@lezer/highlight';

export interface SqlViewOptions {
  doc: string;
  labelId: string;
  describedBy?: string;
  placeholder?: string;
  readOnly: boolean;
  onChange: (value: string) => void;
  onRun: () => void;
}

const theme = EditorView.theme({
  '&': {
    color: 'var(--c-text)',
    backgroundColor: 'var(--c-surface)',
    border: '1px solid var(--c-control-border)',
    borderRadius: 'var(--radius)',
    fontSize: 'var(--fs-sm)',
    maxHeight: '28rem',
  },
  '&.cm-focused': { outline: '3px solid var(--c-focus)', outlineOffset: '2px' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.55', minHeight: '9rem', overflow: 'auto' },
  '.cm-content': { caretColor: 'var(--c-text)', padding: '0.5rem 0' },
  '.cm-cursor': { borderLeftColor: 'var(--c-text)' },
  '.cm-gutters': {
    backgroundColor: 'var(--c-surface-2)',
    color: 'var(--c-text-muted)',
    border: 'none',
    borderRight: '1px solid var(--c-line)',
  },
  '.cm-placeholder': { color: 'var(--c-text-muted)' },
});

const highlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword, tags.standard(tags.name)], color: 'var(--c-accent)', fontWeight: '650' },
  { tag: [tags.string, tags.number, tags.bool, tags.null], color: 'var(--c-key)' },
  { tag: [tags.lineComment, tags.blockComment], color: 'var(--c-text-muted)', fontStyle: 'italic' },
]);

const readOnlyCompartment = new Compartment();

export function createSqlView(parent: HTMLElement, o: SqlViewOptions): EditorView {
  const attrs: Record<string, string> = { 'aria-labelledby': o.labelId, spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' };
  if (o.describedBy) attrs['aria-describedby'] = o.describedBy;
  return new EditorView({
    parent,
    state: EditorState.create({
      doc: o.doc,
      extensions: [
        lineNumbers(),
        history(),
        sql({ dialect: PostgreSQL }),
        syntaxHighlighting(highlight),
        theme,
        EditorView.contentAttributes.of(attrs),
        o.placeholder ? placeholderExt(o.placeholder) : [],
        readOnlyCompartment.of([EditorState.readOnly.of(o.readOnly), EditorView.editable.of(!o.readOnly)]),
        keymap.of([
          { key: 'Mod-Enter', run: () => (o.onRun(), true) },
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) o.onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
}

export function setReadOnly(view: EditorView, readOnly: boolean): void {
  view.dispatch({
    effects: readOnlyCompartment.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
  });
}
