"""Load the course content tree into plain Python structures.

Layout below ``root``::

    sources.yml
    content/topics.yml
    content/glossary.yml
    content/<lang>/topics/<tNN-slug>/{summary.md,cards.yml,quiz.yml,tasks.yml,sql-tasks.yml}
    content/<lang>/exams/exam-NN.yml

``load_all`` never raises on malformed content; problems are collected in
``Content.errors`` so that the validator can report them all at once.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

TOPIC_DIR_RE = re.compile(r"^(t(?:0[1-9]|1[0-3]))-([a-z0-9-]+)$")
EXAM_FILE_RE = re.compile(r"^exam-(0[1-9])\.yml$")
FRONTMATTER_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)(.*)\Z", re.DOTALL)

# element file name -> Content attribute
ELEMENT_FILES = {
    "cards.yml": "cards",
    "quiz.yml": "quiz",
    "tasks.yml": "tasks",
    "sql-tasks.yml": "sql_tasks",
}


class _Loader(yaml.SafeLoader):
    """SafeLoader that keeps ISO dates as plain strings."""


_Loader.yaml_implicit_resolvers = {
    k: [(tag, rx) for tag, rx in v if tag != "tag:yaml.org,2002:timestamp"]
    for k, v in yaml.SafeLoader.yaml_implicit_resolvers.items()
}


def _construct_mapping_no_dupes(loader, node, deep=False):
    seen = set()
    for key_node, _ in node.value:
        if key_node.tag == "tag:yaml.org,2002:merge":
            continue
        try:
            key = loader.construct_object(key_node, deep=True)
            hash(key)
        except Exception:  # noqa: BLE001 - let the default constructor report it
            continue
        if key in seen:
            raise yaml.constructor.ConstructorError(
                None, None, f"duplicate key {key!r}", key_node.start_mark
            )
        seen.add(key)
    return yaml.SafeLoader.construct_mapping(loader, node, deep)


_Loader.construct_mapping = _construct_mapping_no_dupes  # type: ignore[method-assign]


def first_line(e: BaseException) -> str:
    lines = str(e).splitlines()
    return lines[0] if lines else type(e).__name__


def load_yaml_text(text: str) -> Any:
    return yaml.load(text, Loader=_Loader)  # noqa: S506 - safe subclass


def load_yaml(path: Path) -> Any:
    return load_yaml_text(path.read_text(encoding="utf-8"))


def split_frontmatter(text: str) -> tuple[str, str] | None:
    """Return (frontmatter_text, body) or None if there is no frontmatter."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None
    return m.group(1), m.group(2)


@dataclass
class Summary:
    meta: Any
    body: str
    path: Path


@dataclass
class Content:
    root: Path
    lang: str
    topics: list = field(default_factory=list)
    summaries: dict[str, Summary] = field(default_factory=dict)
    cards: dict[str, list] = field(default_factory=dict)
    quiz: dict[str, list] = field(default_factory=dict)
    tasks: dict[str, list] = field(default_factory=dict)
    sql_tasks: dict[str, list] = field(default_factory=dict)
    pitfalls: dict[str, tuple[Any, str]] = field(default_factory=dict)  # tid -> (meta|None, body)
    exams: dict[str, Any] = field(default_factory=dict)  # "e01" -> exam mapping
    glossary: list = field(default_factory=list)
    sources: list = field(default_factory=list)
    # topic id -> directory, exam id -> file (for reporting and tooling)
    topic_dirs: dict[str, Path] = field(default_factory=dict)
    exam_files: dict[str, Path] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)


def _rel(root: Path, path: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def _read_yaml(c: Content, path: Path, default: Any) -> Any:
    if not path.is_file():
        return default
    try:
        data = load_yaml(path)
    except (yaml.YAMLError, UnicodeDecodeError, OSError) as e:
        c.errors.append(f"{_rel(c.root, path)}: cannot read YAML: {first_line(e)}")
        return default
    return default if data is None else data


def load_all(root: Path, lang: str = "de") -> Content:
    root = Path(root)
    c = Content(root=root, lang=lang)
    content_dir = root / "content"
    c.topics = _read_yaml(c, content_dir / "topics.yml", [])
    c.glossary = _read_yaml(c, content_dir / "glossary.yml", [])
    c.sources = _read_yaml(c, root / "sources.yml", [])

    topics_dir = content_dir / lang / "topics"
    if topics_dir.is_dir():
        try:
            subdirs = sorted(p for p in topics_dir.iterdir() if p.is_dir())
        except OSError as e:
            c.errors.append(f"{_rel(root, topics_dir)}: cannot list directory: {first_line(e)}")
            subdirs = []
        for d in subdirs:
            m = TOPIC_DIR_RE.match(d.name)
            if not m:
                c.errors.append(f"{_rel(root, d)}: directory name must match tNN-slug")
                continue
            tid = m.group(1)
            c.topic_dirs[tid] = d
            _load_summary(c, tid, d / "summary.md")
            _load_pitfalls(c, tid, d / "pitfalls.md")
            for fname, attr in ELEMENT_FILES.items():
                getattr(c, attr)[tid] = _read_yaml(c, d / fname, [])

    exams_dir = content_dir / lang / "exams"
    if exams_dir.is_dir():
        try:
            exam_paths = sorted(p for p in exams_dir.iterdir() if p.is_file())
        except OSError as e:
            c.errors.append(f"{_rel(root, exams_dir)}: cannot list directory: {first_line(e)}")
            exam_paths = []
        for f in exam_paths:
            m = EXAM_FILE_RE.match(f.name)
            if not m:
                c.errors.append(f"{_rel(root, f)}: exam file name must match exam-NN.yml")
                continue
            eid = f"e{m.group(1)}"
            c.exam_files[eid] = f
            c.exams[eid] = _read_yaml(c, f, {})
    return c


def _load_summary(c: Content, tid: str, path: Path) -> None:
    if not path.is_file():
        return
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError) as e:
        c.errors.append(f"{_rel(c.root, path)}: cannot read file: {first_line(e)}")
        return
    parts = split_frontmatter(text)
    if parts is None:
        c.errors.append(f"{_rel(c.root, path)}: missing YAML frontmatter")
        return
    fm, body = parts
    try:
        meta = load_yaml_text(fm)
    except yaml.YAMLError as e:
        c.errors.append(f"{_rel(c.root, path)}: cannot parse frontmatter: {first_line(e)}")
        return
    c.summaries[tid] = Summary(meta=meta, body=body, path=path)


def _load_pitfalls(c: Content, tid: str, path: Path) -> None:
    """pitfalls.md is plain Markdown with optional frontmatter -> (meta | None, body)."""
    if not path.is_file():
        return
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError) as e:
        c.errors.append(f"{_rel(c.root, path)}: cannot read file: {first_line(e)}")
        return
    parts = split_frontmatter(text)
    if parts is None:
        c.pitfalls[tid] = (None, text)
        return
    try:
        meta = load_yaml_text(parts[0])
    except yaml.YAMLError as e:
        c.errors.append(f"{_rel(c.root, path)}: cannot parse frontmatter: {first_line(e)}")
        return
    c.pitfalls[tid] = (meta, parts[1])
