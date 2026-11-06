"""Build printable PDFs (exams, solutions, cheatsheet, templates, worksheets) with Typst.

Usage: pdf.py [--out dist/pdf] [--root .] [--lang de] [--diagrams dist/diagrams]

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
from dataclasses import dataclass
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


def _compile(
    template: str, data: dict[str, Any], target: Path, assets: dict[str, bytes] | None = None
) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        for f in TEMPLATE_DIR.glob("*.typ"):
            shutil.copy(f, work / f.name)
        for rel, blob in (assets or {}).items():
            (work / rel).parent.mkdir(parents=True, exist_ok=True)
            (work / rel).write_bytes(blob)
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


@dataclass
class ImageRef:
    start: int
    end: int
    alt: str
    dest: str


def _scan_images(md: str) -> tuple[str, list[ImageRef]]:
    """Find ``![alt](dest "title")`` references; parentheses inside dest must balance."""
    refs: list[ImageRef] = []
    i = 0
    while (i := md.find("![", i)) != -1:
        j = md.find("]", i + 2)
        if j == -1 or md[j + 1 : j + 2] != "(":
            i += 2
            continue
        k, depth = j + 2, 1
        while k < len(md) and depth:
            depth += {"(": 1, ")": -1}.get(md[k], 0)
            k += 1
        if depth:
            i += 2
            continue
        inner = md[j + 2 : k - 1].strip()
        dest = inner.split(None, 1)[0] if inner else ""
        refs.append(ImageRef(i, k, md[i + 2 : j], dest))
        i = k
    return md, refs


def _rewrite_images(md: str, tid: str, diagrams: Path | None, assets: dict[str, bytes]) -> str:
    """Local diagram images -> rendered SVG shipped into the work dir; remote ones -> text."""
    _, refs = _scan_images(md)
    for ref in reversed(refs):
        alt = ref.alt.strip()
        if re.match(r"^[a-z][a-z0-9+.-]*://", ref.dest, re.I):
            repl = f"{alt} ({ref.dest})" if alt else ref.dest
        else:
            name = Path(ref.dest).stem
            if Path(ref.dest).suffix.lower() not in (".dot", ".svg"):
                raise PdfError(f"unsupported image {ref.dest!r} (only diagrams/*.dot are supported)")
            svg = (diagrams or Path("dist/diagrams")) / tid / f"{name}.svg"
            if not svg.is_file():
                raise PdfError(
                    f"{ref.dest}: rendered diagram {svg} not found "
                    "(run `node tools/render_diagrams.mjs` first)"
                )
            rel = f"img/{tid}-{name}.svg"
            assets[rel] = svg.read_bytes()
            repl = f"![{alt.replace(']', '')}]({rel})"
        md = md[: ref.start] + repl + md[ref.end :]
    return md


def _task_tid(t: dict) -> str:
    m = re.match(r"^(t\d{2})-", t["id"])
    return m.group(1) if m else t.get("topic", "")


def _task_data(t: dict, diagrams: Path | None = None, assets: dict[str, bytes] | None = None) -> dict:
    space = t.get("space", "")
    if space == "none":
        space = ""
    if space:
        parse_space(space)  # validate early
    assets = assets if assets is not None else {}
    tid = _task_tid(t)
    return {
        "id": t["id"],
        "topic": t.get("topic", ""),
        "points": t["points"],
        "prompt": _rewrite_images(t["prompt"], tid, diagrams, assets),
        "solution": _rewrite_images(t.get("solution", ""), tid, diagrams, assets),
        "rubric": [{"criterion": r["criterion"], "points": r["points"]} for r in t.get("rubric", [])],
        "space": space,
    }


def _exam_data(c: Content, eid: str, diagrams: Path | None = None, assets: dict | None = None) -> dict:
    exam = c.exams[eid]
    tasks = [_task_data(t, diagrams, assets) for t in exam.get("tasks", [])]
    return {
        "title": exam["title"],
        "minutes": exam.get("minutes", 90),
        "tasks": tasks,
        "total": sum(t["points"] for t in tasks),
    }


def build_exam(c: Content, eid: str, out: Path, diagrams: Path | None = None) -> list[Path]:
    n = eid[1:]
    assets: dict[str, bytes] = {}
    data = _exam_data(c, eid, diagrams, assets)
    a, b = out / f"exam-{n}.pdf", out / f"exam-{n}-loesung.pdf"
    _compile("exam.typ", data, a, assets)
    _compile("solution.typ", data, b, assets)
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


def build_topic_sheets(c: Content, tid: str, out: Path, diagrams: Path | None = None) -> list[Path]:
    assets: dict[str, bytes] = {}
    tasks = [_task_data(t, diagrams, assets) for t in c.tasks.get(tid, [])]
    if not tasks:
        return []
    title = next((t["title"] for t in c.topics if t["id"] == tid), tid)
    a, b = out / f"aufgaben-{tid}.pdf", out / f"loesung-{tid}.pdf"
    _compile("sheet.typ", {"title": f"{tid} {title} – Aufgaben", "tasks": tasks, "solutions": False}, a, assets)
    _compile("sheet.typ", {"title": f"{tid} {title} – Lösungen", "tasks": tasks, "solutions": True}, b, assets)
    return [a, b]


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default="dist/pdf")
    ap.add_argument("--root", default=".")
    ap.add_argument("--lang", default="de")
    ap.add_argument("--diagrams", default="dist/diagrams", help="rendered SVGs: <dir>/<tNN>/<name>.svg")
    args = ap.parse_args(argv)
    out = Path(args.out)
    diagrams = Path(args.diagrams)
    c = load_all(Path(args.root), args.lang)
    if c.errors:
        for e in c.errors:
            print(f"error: {e}", file=sys.stderr)
        return 1
    try:
        for eid in sorted(c.exams):
            build_exam(c, eid, out, diagrams)
        build_cheatsheet(c, out)
        build_spickzettel(out)
        for tid in sorted(c.tasks):
            build_topic_sheets(c, tid, out, diagrams)
    except (PdfError, typst.TypstError, RuntimeError, ValueError, KeyError, OSError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
