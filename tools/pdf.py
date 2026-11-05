"""Build printable PDFs (exams, solutions, cheatsheet, templates, worksheets) with Typst.

Usage: pdf.py [--out dist/pdf] [--root .] [--lang de]

Each document is compiled in a temporary work directory that holds copies of
``tools/typst/*.typ`` plus a ``data.json`` with the content to render.
Markdown is rendered inside Typst by the ``cmarker`` package. For CI, cache the
package directory pointed to by ``TYPST_PACKAGE_CACHE_PATH``.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Any

import typst
from content import Content, load_all

TEMPLATE_DIR = Path(__file__).parent / "typst"
SPACE_RE = re.compile(r"^(lines|box):(\d+)$")
SPACE_LIMITS = {"lines": (1, 40), "box": (10, 250)}  # lines: count, box: mm
GLOSSARY_CHAR_BUDGET = 2200  # keeps the cheatsheet at two pages
GLOSSARY_TRUNCATED_NOTE = "… weitere Begriffe: vollständig im Web-Glossar"


class PdfError(Exception):
    """Compilation problem (Typst error or warning) with a readable message."""


def parse_space(spec: str) -> tuple[str, int]:
    """``lines:N`` (N ruled lines of 8 mm) or ``box:H`` (box of H mm)."""
    m = SPACE_RE.match(spec or "")
    if not m:
        raise ValueError(f"invalid space spec {spec!r}")
    kind, n = m.group(1), int(m.group(2))
    lo, hi = SPACE_LIMITS[kind]
    if not lo <= n <= hi:
        raise ValueError(f"space {spec!r}: {kind} must be between {lo} and {hi}")
    return kind, n


def _compile(template: str, data: dict[str, Any], target: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        for f in TEMPLATE_DIR.glob("*.typ"):
            shutil.copy(f, work / f.name)
        (work / "data.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            pdf_bytes, warnings = typst.compile_with_warnings(
                str(work / template), root=str(work)
            )
        except (typst.TypstError, RuntimeError) as e:
            raise PdfError(f"{template}: {e}") from e
        if warnings:
            msgs = "; ".join(str(getattr(w, "message", w)) for w in warnings)
            raise PdfError(f"{template}: typst warning: {msgs}")
        target.write_bytes(pdf_bytes)


def _task_data(t: dict) -> dict:
    space = t.get("space", "")
    if space == "none":
        space = ""
    if space:
        parse_space(space)  # validate early
    return {
        "id": t["id"],
        "topic": t.get("topic", ""),
        "points": t["points"],
        "prompt": t["prompt"],
        "solution": t.get("solution", ""),
        "rubric": [{"criterion": r["criterion"], "points": r["points"]} for r in t.get("rubric", [])],
        "space": space,
    }


def _exam_data(c: Content, eid: str) -> dict:
    exam = c.exams[eid]
    tasks = [_task_data(t) for t in exam.get("tasks", [])]
    return {
        "title": exam["title"],
        "minutes": exam.get("minutes", 90),
        "tasks": tasks,
        "total": sum(t["points"] for t in tasks),
    }


def build_exam(c: Content, eid: str, out: Path) -> list[Path]:
    n = eid[1:]
    data = _exam_data(c, eid)
    a, b = out / f"exam-{n}.pdf", out / f"exam-{n}-loesung.pdf"
    _compile("exam.typ", data, a)
    _compile("solution.typ", data, b)
    return [a, b]


def build_cheatsheet(c: Content, out: Path) -> Path:
    topics = [
        {"id": t["id"], "title": t["title"], "subtopics": list(t.get("subtopics", []))}
        for t in c.topics
    ]
    glossary, used = [], 0
    for g in c.glossary:
        term, definition = g.get("de", g["id"]), g.get("def_de", "")
        used += len(term) + len(definition) + 2
        if used > GLOSSARY_CHAR_BUDGET:
            glossary.append({"term": GLOSSARY_TRUNCATED_NOTE, "definition": ""})
            break
        glossary.append({"term": term, "definition": definition})
    target = out / "cheatsheet.pdf"
    _compile("cheatsheet.typ", {"topics": topics, "glossary": glossary}, target)
    return target


def build_spickzettel(out: Path) -> Path:
    target = out / "spickzettel-vorlage.pdf"
    _compile("spickzettel.typ", {}, target)
    return target


def build_topic_sheets(c: Content, tid: str, out: Path) -> list[Path]:
    tasks = [_task_data(t) for t in c.tasks.get(tid, [])]
    if not tasks:
        return []
    title = next((t["title"] for t in c.topics if t["id"] == tid), tid)
    a, b = out / f"aufgaben-{tid}.pdf", out / f"loesung-{tid}.pdf"
    _compile("sheet.typ", {"title": f"{tid} {title} – Aufgaben", "tasks": tasks, "solutions": False}, a)
    _compile("sheet.typ", {"title": f"{tid} {title} – Lösungen", "tasks": tasks, "solutions": True}, b)
    return [a, b]


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default="dist/pdf")
    ap.add_argument("--root", default=".")
    ap.add_argument("--lang", default="de")
    args = ap.parse_args(argv)
    out = Path(args.out)
    c = load_all(Path(args.root), args.lang)
    if c.errors:
        for e in c.errors:
            print(f"error: {e}", file=sys.stderr)
        return 1
    try:
        for eid in sorted(c.exams):
            build_exam(c, eid, out)
        build_cheatsheet(c, out)
        build_spickzettel(out)
        for tid in sorted(c.tasks):
            build_topic_sheets(c, tid, out)
    except (PdfError, typst.TypstError, RuntimeError, ValueError, KeyError, OSError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
