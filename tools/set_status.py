"""Set review stages and status on content (the only sanctioned way to do so).

Usage: set_status.py <topic-id|exam-id> [--add-review {fach,aufgaben,leak,en}]
                     [--promote] [--root .]

* ``<topic-id>`` is ``tNN`` (summary and all elements of the topic),
  ``<exam-id>`` is ``eNN`` or ``exam-NN`` (all tasks of the exam).
* ``--add-review fach|aufgaben|leak`` is applied to the DE files, ``en`` to the
  EN files only.
* ``--promote`` sets ``status: reviewed`` on every item of the scope (DE). It
  requires ``fach`` and ``leak`` (plus ``aufgaben`` if the scope contains tasks)
  on every item, otherwise nothing is written and the exit code is 1.

Files are edited textually (only the ``reviews`` and ``status`` lines), so
comments and formatting are preserved. Every edit is verified by re-parsing;
nothing is written unless only the intended fields changed.

Exit codes: 0 ok, 1 promotion refused, 2 usage error / scope not found / failure.
"""

from __future__ import annotations

import argparse
import copy
import re
import sys
from pathlib import Path

from content import (
    ELEMENT_FILES,
    EXAM_FILE_RE,
    TOPIC_DIR_RE,
    load_yaml_text,
    split_frontmatter,
)

STAGES = ("fach", "aufgaben", "leak", "en")  # canonical order
SCOPE_RE = re.compile(r"^(?:t(?:0[1-9]|1[0-3])|e0[1-9]|exam-0[1-9])$")
ITEM_RE = re.compile(r"^(?P<ind>\s*)- id:\s*(?P<id>\S+)\s*$")
SCALAR_ITEM_RE = re.compile(r"^\s*-\s+[A-Za-z0-9_-]+\s*(#.*)?$")


class EditError(Exception):
    pass


def _fmt_reviews(values: list[str]) -> str:
    return "[" + ", ".join(values) + "]"


def _set_key(lines: list[str], start: int, end: int, indent: str, key: str, value: str) -> None:
    """Replace ``key`` (flow/block/scalar) inside lines[start:end] at ``indent``; mutates ``lines``."""
    key_re = re.compile(rf"^{re.escape(indent)}{key}:(.*)$")
    for i in range(start, end):
        m = key_re.match(lines[i])
        if not m:
            continue
        j = i + 1
        if m.group(1).split("#")[0].strip() == "":
            # block-style list: consume following simple scalar items
            while j < end and SCALAR_ITEM_RE.match(lines[j]) and len(lines[j]) - len(lines[j].lstrip()) >= len(indent):
                j += 1
        lines[i:j] = [f"{indent}{key}: {value}"]
        return
    raise EditError(f"key '{key}' not found")


def _edit_block(text: str, ids_to_values: dict[str, dict[str, str]], top_level_frontmatter: bool = False) -> str:
    """Apply {item-id: {key: value}} edits to YAML text of a list of items (or frontmatter)."""
    lines = text.split("\n")
    if top_level_frontmatter:
        for key, value in next(iter(ids_to_values.values())).items():
            _set_key(lines, 0, len(lines), "", key, value)
        return "\n".join(lines)

    # locate items
    starts: list[tuple[int, str, str]] = []
    for i, ln in enumerate(lines):
        m = ITEM_RE.match(ln)
        if m:
            starts.append((i, m.group("ind"), m.group("id")))
    found = set()
    # process from the bottom so earlier line indexes stay valid
    for idx in range(len(starts) - 1, -1, -1):
        i, ind, iid = starts[idx]
        if iid not in ids_to_values:
            continue
        field_ind = " " * (len(ind) + 2)
        end = len(lines)
        for k in range(i + 1, len(lines)):
            ln = lines[k]
            if ln.strip() == "" or ln.lstrip().startswith("#"):
                continue
            cur = len(ln) - len(ln.lstrip())
            if cur < len(field_ind):
                end = k
                break
        for key, value in ids_to_values[iid].items():
            try:
                _set_key(lines, i + 1, end, field_ind, key, value)
            except EditError as e:
                raise EditError(f"item {iid}: {e}") from None
            # block-list replacement may shorten the item; recompute end
            end = min(end, len(lines))
        found.add(iid)
    missing = set(ids_to_values) - found
    if missing:
        raise EditError(f"items not found textually: {', '.join(sorted(missing))}")
    return "\n".join(lines)


class _Target:
    """One file with its parsed items; computes and applies edits."""

    def __init__(self, path: Path, kind: str):
        self.path = path
        self.kind = kind  # "summary" | "list" | "exam"
        self.text = path.read_text(encoding="utf-8")
        self.newline = "\r\n" if "\r\n" in self.text else "\n"
        self.text = self.text.replace("\r\n", "\n")
        self.items = self._parse(self.text)  # list of dicts (for summary: one)

    def _parse(self, text: str) -> list[dict]:
        if self.kind == "summary":
            parts = split_frontmatter(text)
            if parts is None:
                raise EditError(f"{self.path.name}: missing frontmatter")
            data = load_yaml_text(parts[0])
            return [data]
        data = load_yaml_text(text)
        if self.kind == "exam":
            data = data.get("tasks") if isinstance(data, dict) else None
        if not isinstance(data, list) or not all(isinstance(i, dict) and "id" in i for i in data):
            raise EditError(f"{self.path.name}: unexpected structure")
        return data

    def apply(self, new_items: list[dict]) -> str:
        """Return new file text for new_items (same shape as self.items)."""
        edits: dict[str, dict[str, str]] = {}
        for old, new in zip(self.items, new_items):
            e = {}
            if old.get("reviews") != new["reviews"]:
                e["reviews"] = _fmt_reviews(new["reviews"])
            if old.get("status") != new["status"]:
                e["status"] = new["status"]
            if e:
                edits[old.get("id", "")] = e
        if not edits:
            return self.text
        if self.kind == "summary":
            fm, body = split_frontmatter(self.text)  # type: ignore[misc]
            m = re.match(r"\A---\n", self.text)
            assert m
            fm_start = m.end()
            fm_new = _edit_block(fm, edits, top_level_frontmatter=True)
            out = self.text[:fm_start] + fm_new + self.text[fm_start + len(fm):]
        else:
            out = _edit_block(self.text, edits)
        # verify: only reviews/status changed, as intended
        check = self._parse(out)
        for got, want in zip(check, new_items):
            if got != want:
                raise EditError(f"{self.path.name}: verification failed for {got.get('id')}; refusing to write")
        return out

    def write(self, text: str) -> None:
        if text == self.text:
            return
        with open(self.path, "w", encoding="utf-8", newline="") as f:
            f.write(text.replace("\n", self.newline))


def _collect(root: Path, scope: str, lang: str) -> list[_Target]:
    base = root / "content" / lang
    targets: list[_Target] = []
    if scope.startswith("t"):
        tdir = None
        if (base / "topics").is_dir():
            for d in sorted((base / "topics").iterdir()):
                m = TOPIC_DIR_RE.match(d.name)
                if d.is_dir() and m and m.group(1) == scope:
                    tdir = d
        if tdir is None:
            return []
        if (tdir / "summary.md").is_file():
            targets.append(_Target(tdir / "summary.md", "summary"))
        for fname in ELEMENT_FILES:
            if (tdir / fname).is_file():
                targets.append(_Target(tdir / fname, "list"))
    else:
        num = scope[-2:]
        f = base / "exams" / f"exam-{num}.yml"
        if f.is_file() and EXAM_FILE_RE.match(f.name):
            targets.append(_Target(f, "exam"))
    return targets


def _normalize_scope(raw: str) -> str | None:
    if not SCOPE_RE.match(raw):
        return None
    return f"e{raw[-2:]}" if raw.startswith(("e", "exam")) else raw


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Set review stages / promote content status.")
    ap.add_argument("scope", help="topic id (t04) or exam id (e01 / exam-01)")
    ap.add_argument("--add-review", choices=STAGES, dest="stage")
    ap.add_argument("--promote", action="store_true")
    ap.add_argument("--root", default=".")
    args = ap.parse_args(argv)

    if not args.stage and not args.promote:
        print("nothing to do: give --add-review and/or --promote", file=sys.stderr)
        return 2
    scope = _normalize_scope(args.scope)
    if scope is None:
        print(f"invalid scope '{args.scope}'", file=sys.stderr)
        return 2
    root = Path(args.root)

    try:
        # stage 'en' touches EN files; everything else (and promotion) the DE files
        review_lang = "en" if args.stage == "en" else "de"
        plans: list[tuple[_Target, list[dict]]] = []
        review_targets = _collect(root, scope, review_lang)
        if args.stage:
            if not review_targets:
                print(f"scope {scope} not found for lang {review_lang}", file=sys.stderr)
                return 2
            for t in review_targets:
                new_items = copy.deepcopy(t.items)
                for it in new_items:
                    have = set(it.get("reviews") or []) | {args.stage}
                    it["reviews"] = [s for s in STAGES if s in have]
                plans.append((t, new_items))

        if args.promote:
            de_targets = review_targets if review_lang == "de" else _collect(root, scope, "de")
            if not de_targets:
                print(f"scope {scope} not found for lang de", file=sys.stderr)
                return 2
            by_path = {t.path: (t, items) for t, items in plans} if review_lang == "de" else {}
            promote_plans: list[tuple[_Target, list[dict]]] = []
            has_tasks = any(
                t.kind == "exam" or t.path.name in ("tasks.yml", "sql-tasks.yml")
                for t in de_targets
                if t.items
            )
            required = {"fach", "leak"} | ({"aufgaben"} if has_tasks else set())
            problems = []
            for t in de_targets:
                items = copy.deepcopy(by_path[t.path][1] if t.path in by_path else t.items)
                for it in items:
                    missing = required - set(it.get("reviews") or [])
                    if missing:
                        problems.append(f"{t.path.name}:{it.get('id')} lacks {', '.join(sorted(missing))}")
                    elif it.get("status") != "verified":
                        it["status"] = "reviewed"
                promote_plans.append((t, items))
            if problems:
                print("cannot promote:", file=sys.stderr)
                for p in problems:
                    print(f"  {p}", file=sys.stderr)
                return 1
            plans = promote_plans

        outputs = [(t, t.apply(items)) for t, items in plans]
    except EditError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2

    for t, text in outputs:
        t.write(text)
    print(f"{scope}: updated {sum(1 for t, text in outputs if text != t.text)} file(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
