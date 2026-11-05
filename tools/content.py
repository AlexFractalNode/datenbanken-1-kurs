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
    except (yaml.YAMLError, UnicodeDecodeError) as e:
        c.errors.append(f"{_rel(c.root, path)}: cannot parse YAML: {str(e).splitlines()[0] if str(e) else e}")
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
        for d in sorted(p for p in topics_dir.iterdir() if p.is_dir()):
            m = TOPIC_DIR_RE.match(d.name)
            if not m:
                c.errors.append(f"{_rel(root, d)}: directory name must match tNN-slug")
                continue
            tid = m.group(1)
            c.topic_dirs[tid] = d
            _load_summary(c, tid, d / "summary.md")
            for fname, attr in ELEMENT_FILES.items():
                getattr(c, attr)[tid] = _read_yaml(c, d / fname, [])

    exams_dir = content_dir / lang / "exams"
    if exams_dir.is_dir():
        for f in sorted(p for p in exams_dir.iterdir() if p.is_file()):
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
    except UnicodeDecodeError:
        c.errors.append(f"{_rel(c.root, path)}: not valid UTF-8")
        return
    parts = split_frontmatter(text)
    if parts is None:
        c.errors.append(f"{_rel(c.root, path)}: missing YAML frontmatter")
        return
    fm, body = parts
    try:
        meta = load_yaml_text(fm)
    except yaml.YAMLError as e:
        c.errors.append(f"{_rel(c.root, path)}: cannot parse frontmatter: {str(e).splitlines()[0]}")
        return
    c.summaries[tid] = Summary(meta=meta, body=body, path=path)
