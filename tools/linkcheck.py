"""Check internal href/src references in a built site against existing files.

    uv run tools/linkcheck.py [web/dist] [--base /datenbanken-1-kurs/]

Absolute paths must start with the base path; relative ones are resolved against
the referring page. External URLs, mailto:, tel:, data: and pure fragments are skipped.
"""
from __future__ import annotations

import argparse
import posixpath
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

DEFAULT_BASE = "/datenbanken-1-kurs/"
SKIP_SCHEMES = ("mailto:", "tel:", "data:", "javascript:")
PARENT = ".."


class _Refs(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[str] = []

    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k in ("href", "src") and v:
                self.refs.append(v.strip())


def _exists(root: Path, rel: str) -> bool:
    rel = rel.strip("/")
    cands = [root / rel] if rel else []
    cands += [root / rel / "index.html", root / f"{rel}.html"]
    return any(c.is_file() for c in cands)


def check(root: Path, base: str = DEFAULT_BASE) -> list[str]:
    errors: list[str] = []
    for page in sorted(root.rglob("*.html")):
        parser = _Refs()
        parser.feed(page.read_text(encoding="utf-8", errors="replace"))
        page_rel = page.relative_to(root).as_posix()
        for ref in parser.refs:
            if ref.startswith("#") or ref.lower().startswith(SKIP_SCHEMES):
                continue
            if re.match(r"^([a-z][a-z0-9+.-]*:)?//", ref, re.I):
                continue
            path = unquote(urlsplit(ref).path)
            if not path:
                continue
            if path.startswith("/"):
                if not path.startswith(base):
                    errors.append(f"{page_rel}: {ref}: outside base {base}")
                    continue
                target = path[len(base) :]
            else:
                target = posixpath.normpath(posixpath.join(posixpath.dirname(page_rel), path))
                if target == PARENT or target.startswith(PARENT + "/"):
                    errors.append(f"{page_rel}: {ref}: escapes site root")
                    continue
            if target == ".":
                target = ""
            if not _exists(root, target):
                errors.append(f"{page_rel}: {ref}: target not found")
    return errors


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("root", nargs="?", default="web/dist")
    ap.add_argument("--base", default=DEFAULT_BASE)
    args = ap.parse_args(argv)
    root = Path(args.root)
    if not root.is_dir():
        print(f"error: {root} is not a directory (run the web build first)", file=sys.stderr)
        return 1
    errors = check(root, args.base)
    for e in errors:
        print(e, file=sys.stderr)
    print(f"linkcheck: {len(errors)} broken reference(s) in {root}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
