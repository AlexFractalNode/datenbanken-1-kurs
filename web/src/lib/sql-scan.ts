/**
 * One-pass lexical scan of SQL text, shared by the transaction guard (pg-engine) and the Firebird hints
 * (dialect). Separate regular expressions for comments and strings go wrong as soon as one hides the
 * other (`SELECT '--'; COMMIT` lost the COMMIT), so this scanner walks the text once from left to right
 * and decides at every position which construct starts there, the way the PostgreSQL lexer does:
 *
 * - `-- …` up to the end of the line and `/* … *\/` (nested, like PostgreSQL) become one blank;
 * - `'…'` (with `''`), `E'…'` (also with backslash escapes) and `$tag$…$tag$` keep only their quotes (`''`),
 *   so keywords inside them do not count; a `$` inside an identifier (`RDB$RELATIONS`) or a parameter
 *   (`$1`) does not start a dollar quote;
 * - `"…"` identifiers stay as they are but their semicolons do not split statements;
 * - an unterminated literal or comment runs to the end of the text.
 *
 * `statements` is `text` split at the semicolons that are outside of all of these.
 */
export interface ScannedSql {
  text: string;
  statements: string[];
}

const IDENT_CHAR = /[A-Za-z0-9_$\u0080-￿]/;
const TAG = /^\$([A-Za-z_\u0080-￿][A-Za-z0-9_\u0080-￿]*)?\$/;

export function scanSql(sql: string): ScannedSql {
  let text = '';
  let current = '';
  const statements: string[] = [];
  const emit = (s: string) => {
    text += s;
    current += s;
  };
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i];
    const next = sql[i + 1];
    const prev = i > 0 ? sql[i - 1] : '';
    if (c === '-' && next === '-') {
      const end = sql.indexOf('\n', i);
      i = end === -1 ? n : end;
      emit(' ');
      continue;
    }
    if (c === '/' && next === '*') {
      let depth = 1;
      i += 2;
      while (i < n && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          depth += 1;
          i += 2;
        } else if (sql[i] === '*' && sql[i + 1] === '/') {
          depth -= 1;
          i += 2;
        } else {
          i += 1;
        }
      }
      emit(' ');
      continue;
    }
    if (c === "'") {
      // E'…' (escape string): the prefix letter is already emitted; backslashes escape the next character.
      const escapes = (prev === 'E' || prev === 'e') && (i < 2 || !IDENT_CHAR.test(sql[i - 2]));
      i += 1;
      while (i < n) {
        if (escapes && sql[i] === '\\') {
          i += 2;
        } else if (sql[i] === "'") {
          if (sql[i + 1] === "'") i += 2;
          else break;
        } else {
          i += 1;
        }
      }
      i = Math.min(n, i + 1);
      emit("''");
      continue;
    }
    if (c === '"') {
      let end = i + 1;
      while (end < n) {
        if (sql[end] === '"') {
          if (sql[end + 1] === '"') end += 2;
          else break;
        } else {
          end += 1;
        }
      }
      end = Math.min(n, end + 1);
      emit(sql.slice(i, end));
      i = end;
      continue;
    }
    if (c === '$' && !(prev && IDENT_CHAR.test(prev))) {
      const tag = TAG.exec(sql.slice(i));
      if (tag) {
        const close = sql.indexOf(tag[0], i + tag[0].length);
        i = close === -1 ? n : close + tag[0].length;
        emit("''");
        continue;
      }
    }
    if (c === ';') {
      statements.push(current);
      current = '';
      text += c;
      i += 1;
      continue;
    }
    emit(c);
    i += 1;
  }
  statements.push(current);
  return { text, statements };
}
