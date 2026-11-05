"""Validate the course content (schemas plus cross-file rules).

Usage: validate.py [--root .] [--no-min]

``--root`` is the directory holding ``content/`` and ``sources.yml``.
Exit code 1 if any problem is found.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from functools import lru_cache
from pathlib import Path
from typing import Any

from content import ELEMENT_FILES, Content, load_all
from jsonschema import Draft202012Validator

SCHEMA_DIR = Path(__file__).resolve().parent.parent / "schema"

# CI minimum totals (German content)
MIN_TOTALS = {"cards": 280, "quiz": 140, "tasks": 56, "sql_tasks": 38, "exams": 2}
EXAM_POINTS = 90
EXAM_POINTS_TOLERANCE = 2
EXAM_MINUTES = 90

ELEMENT_ID_LETTER = {"cards": "c", "quiz": "q", "tasks": "p", "sql_tasks": "s"}
ELEMENT_SCHEMA = {
    "cards": "cards",
    "quiz": "quiz",
    "tasks": "tasks",
    "sql_tasks": "sql-tasks",
}
# Firebird-only constructs that need an explicit PostgreSQL solution
FB_ONLY_SQL = re.compile(r"\b(?:first|skip)\s+(?:\d+|\?|\()|\bgen_id\s*\(", re.IGNORECASE)
SQL_STRING_LITERAL = re.compile(r"'(?:[^']|'')*'")


@lru_cache(maxsize=None)
def _validator(name: str) -> Draft202012Validator:
    schema = json.loads((SCHEMA_DIR / f"{name}.schema.json").read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


def _schema_errors(name: str, data: Any, label: str) -> list[str]:
    errs = []
    for e in sorted(_validator(name).iter_errors(data), key=lambda e: list(map(str, e.absolute_path))):
        loc = "/".join(str(p) for p in e.absolute_path) or "(root)"
        errs.append(f"{label}: {loc}: {e.message}")
    return errs


def _rel(root: Path, path: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def _is_close(a: float, b: float) -> bool:
    return abs(a - b) < 1e-9


class _Ctx:
    def __init__(self, root: Path, topic_ids: dict[str, str], sources: dict[str, dict]):
        self.root = root
        self.topic_ids = topic_ids  # id -> slug
        self.sources = sources  # id -> source
        self.errs: list[str] = []

    def err(self, label: str, msg: str) -> None:
        self.errs.append(f"{label}: {msg}")


def _check_sources(ctx: _Ctx, label: str, refs: Any) -> None:
    for s in refs or []:
        sid = s["id"]
        src = ctx.sources.get(sid)
        if src is None:
            ctx.err(label, f"unknown source id {sid}")
        elif src.get("kind") == "further-reading":
            ctx.err(label, f"source {sid} is further-reading and cannot be cited as a source")


def _check_task(ctx: _Ctx, label: str, t: dict) -> None:
    total = sum(r["points"] for r in t["rubric"])
    if not _is_close(total, t["points"]):
        ctx.err(label, f"rubric points sum {total:g} != points {t['points']:g}")


def _check_quiz(ctx: _Ctx, label: str, q: dict) -> None:
    n_correct = sum(1 for o in q["options"] if o["correct"])
    if q["type"] == "single" and n_correct != 1:
        ctx.err(label, f"single-choice question needs exactly 1 correct option, has {n_correct}")
    elif q["type"] == "multi" and n_correct < 1:
        ctx.err(label, "multi-choice question needs at least 1 correct option")
    elif q["type"] == "truefalse":
        if len(q["options"]) != 2 or n_correct != 1:
            ctx.err(label, "truefalse question needs exactly 2 options with exactly 1 correct")


def _check_sql(ctx: _Ctx, label: str, s: dict) -> None:
    engines = s.get("engines", ["fb", "pg"])
    if "pg" in engines and "solution_pg" not in s:
        if FB_ONLY_SQL.search(SQL_STRING_LITERAL.sub("''", s["solution"])):
            ctx.err(label, "solution uses Firebird-only syntax (FIRST/SKIP/GEN_ID) but solution_pg is missing")


def _check_lang(ctx: _Ctx, c: Content, check_topic_dirs: bool = True) -> dict[str, set[str]]:
    """Validate one language tree. Returns all SQL task ids (for sql_ref checks)."""
    root, lang = ctx.root, c.lang
    seen: dict[str, str] = {}

    def register(label: str, id_: str) -> None:
        if id_ in seen:
            ctx.err(label, f"duplicate id {id_} (also in {seen[id_]})")
        else:
            seen[id_] = label

    sql_ids: set[str] = set()
    sql_refs: list[tuple[str, str]] = []

    for tid, d in c.topic_dirs.items():
        dlabel = _rel(root, d)
        slug = ctx.topic_ids.get(tid)
        if slug is None:
            ctx.err(dlabel, f"topic {tid} is not listed in content/topics.yml")
        elif d.name != f"{tid}-{slug}":
            ctx.err(dlabel, f"directory name must be {tid}-{slug}")

        # summary
        spath = d / "summary.md"
        slabel = _rel(root, spath)
        sm = c.summaries.get(tid)
        if sm is None:
            if not spath.is_file():
                ctx.err(slabel, "summary.md is missing")
        else:
            errs = _schema_errors("topic-summary", sm.meta, slabel)
            ctx.errs.extend(errs)
            if not errs:
                if sm.meta["id"] != tid:
                    ctx.err(slabel, f"frontmatter id {sm.meta['id']} does not match directory {tid}")
                if sm.meta["lang"] != lang:
                    ctx.err(slabel, f"frontmatter lang {sm.meta['lang']} does not match {lang}")
                if lang != "en" and "translation" in sm.meta:
                    ctx.err(slabel, "translation is only allowed in EN summaries")
                _check_sources(ctx, slabel, sm.meta["sources"])

        # element files
        for fname, attr in ELEMENT_FILES.items():
            items = getattr(c, attr).get(tid, [])
            flabel = _rel(root, d / fname)
            errs = _schema_errors(ELEMENT_SCHEMA[attr], items, flabel)
            ctx.errs.extend(errs)
            if errs:
                continue
            letter = ELEMENT_ID_LETTER[attr]
            for it in items:
                ilabel = f"{flabel}:{it['id']}"
                register(ilabel, it["id"])
                if not it["id"].startswith(f"{tid}-{letter}"):
                    ctx.err(ilabel, f"id prefix does not match topic {tid} (expected {tid}-{letter}NNN)")
                _check_sources(ctx, ilabel, it.get("sources"))
                if attr == "tasks":
                    _check_task(ctx, ilabel, it)
                    if "sql_ref" in it:
                        sql_refs.append((ilabel, it["sql_ref"]))
                elif attr == "quiz":
                    _check_quiz(ctx, ilabel, it)
                elif attr == "sql_tasks":
                    sql_ids.add(it["id"])
                    _check_sql(ctx, ilabel, it)

    # exams
    for eid, exam in c.exams.items():
        elabel = _rel(root, c.exam_files[eid])
        errs = _schema_errors("exam", exam, elabel)
        ctx.errs.extend(errs)
        if errs:
            continue
        for t in exam["tasks"]:
            ilabel = f"{elabel}:{t['id']}"
            register(ilabel, t["id"])
            if not t["id"].startswith(f"{eid}-p"):
                ctx.err(ilabel, f"id prefix does not match exam {eid}")
            if t["topic"] not in ctx.topic_ids:
                ctx.err(ilabel, f"topic {t['topic']} is not listed in content/topics.yml")
            _check_sources(ctx, ilabel, t.get("sources"))
            _check_task(ctx, ilabel, t)
            if "sql_ref" in t:
                sql_refs.append((ilabel, t["sql_ref"]))
        points = sum(t["points"] for t in exam["tasks"])
        minutes = sum(t["minutes"] for t in exam["tasks"])
        if abs(points - EXAM_POINTS) > EXAM_POINTS_TOLERANCE:
            ctx.err(elabel, f"task points sum {points:g}, expected about {EXAM_POINTS}")
        if minutes > EXAM_MINUTES:
            ctx.err(elabel, f"task minutes sum {minutes:g} exceeds {EXAM_MINUTES}")

    for ilabel, ref in sql_refs:
        if ref not in sql_ids:
            ctx.err(ilabel, f"sql_ref {ref} does not exist")
    return {"sql": sql_ids}


def _check_parity(ctx: _Ctx, de: Content, en: Content) -> None:
    root = ctx.root
    for tid, d in en.topic_dirs.items():
        if tid not in de.topic_dirs:
            ctx.err(_rel(root, d), f"EN topic {tid} has no DE counterpart")
            continue
        missing: list[str] = []
        extra: list[str] = []
        for attr in ELEMENT_FILES.values():
            de_ids = {i["id"] for i in getattr(de, attr).get(tid, []) if isinstance(i, dict) and "id" in i}
            en_ids = {i["id"] for i in getattr(en, attr).get(tid, []) if isinstance(i, dict) and "id" in i}
            missing += sorted(de_ids - en_ids)
            extra += sorted(en_ids - de_ids)
        label = _rel(root, d)
        if extra:
            ctx.err(label, f"EN has ids without DE counterpart: {', '.join(extra)}")
        sm = en.summaries.get(tid)
        pending = isinstance(sm.meta, dict) and sm.meta.get("translation") == "pending" if sm else False
        if missing and not pending:
            ctx.err(label, f"EN is incomplete (missing {len(missing)} ids, e.g. {missing[0]}); set 'translation: pending' in EN summary")
    for eid, exam in en.exams.items():
        label = _rel(root, en.exam_files[eid])
        if eid not in de.exams:
            ctx.err(label, f"EN exam {eid} has no DE counterpart")
            continue
        if not isinstance(exam, dict) or not isinstance(de.exams[eid], dict):
            continue
        en_ids = {t.get("id") for t in exam.get("tasks", []) if isinstance(t, dict)}
        de_ids = {t.get("id") for t in de.exams[eid].get("tasks", []) if isinstance(t, dict)}
        if en_ids - de_ids:
            ctx.err(label, "EN exam has task ids without DE counterpart")
        if de_ids - en_ids and exam.get("translation") != "pending":
            ctx.err(label, "EN exam is incomplete; set 'translation: pending'")


def run(root: Path, min_totals: bool) -> list[str]:
    root = Path(root)
    errs: list[str] = []
    if not (root / "content").is_dir():
        return [f"{root.as_posix()}: content/ directory not found"]

    de = load_all(root, "de")
    errs.extend(de.errors)

    topics_label = "content/topics.yml"
    if not (root / topics_label).is_file():
        errs.append(f"{topics_label}: file not found")
    else:
        errs.extend(_schema_errors("topics", de.topics, topics_label))
    sources_label = "sources.yml"
    sources_ok = (root / sources_label).is_file()
    if not sources_ok:
        errs.append(f"{sources_label}: file not found")
    else:
        e = _schema_errors("sources", de.sources, sources_label)
        errs.extend(e)
        sources_ok = not e
    glossary_errs = _schema_errors("glossary", de.glossary, "content/glossary.yml")
    errs.extend(glossary_errs)

    topic_ids: dict[str, str] = {}
    if not any(m.startswith(topics_label) for m in errs) and isinstance(de.topics, list):
        orders: set[int] = set()
        for t in de.topics:
            if t["id"] in topic_ids:
                errs.append(f"{topics_label}: duplicate topic id {t['id']}")
            if t["order"] in orders:
                errs.append(f"{topics_label}: duplicate order {t['order']}")
            topic_ids[t["id"]] = t["slug"]
            orders.add(t["order"])

    sources: dict[str, dict] = {}
    if sources_ok:
        for s in de.sources:
            if s["id"] in sources:
                errs.append(f"{sources_label}: duplicate source id {s['id']}")
            sources[s["id"]] = s

    if not glossary_errs:
        gseen: set[str] = set()
        for g in de.glossary:
            if g["id"] in gseen:
                errs.append(f"content/glossary.yml: duplicate id {g['id']}")
            gseen.add(g["id"])

    ctx = _Ctx(root, topic_ids, sources)
    _check_lang(ctx, de)

    en = None
    if (root / "content" / "en").is_dir():
        en = load_all(root, "en")
        errs.extend(en.errors)
        _check_lang(ctx, en)
        _check_parity(ctx, de, en)
    errs.extend(ctx.errs)

    if min_totals:
        totals = {
            "cards": sum(len(v) for v in de.cards.values() if isinstance(v, list)),
            "quiz": sum(len(v) for v in de.quiz.values() if isinstance(v, list)),
            "tasks": sum(len(v) for v in de.tasks.values() if isinstance(v, list)),
            "sql_tasks": sum(len(v) for v in de.sql_tasks.values() if isinstance(v, list)),
            "exams": len(de.exams),
        }
        for key, minimum in MIN_TOTALS.items():
            if totals[key] < minimum:
                errs.append(f"totals: {key.replace('_', '-')} {totals[key]} < required {minimum}")
    return errs


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Validate course content.")
    ap.add_argument("--root", default=".", help="directory with content/ and sources.yml")
    ap.add_argument("--no-min", action="store_true", help="skip total minimum counts")
    args = ap.parse_args(argv)
    errs = run(Path(args.root), min_totals=not args.no_min)
    if errs:
        for e in errs:
            print(e, file=sys.stderr)
        print(f"{len(errs)} problem(s) found", file=sys.stderr)
        return 1
    print("content OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
