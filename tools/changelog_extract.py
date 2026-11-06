"""Extract the CHANGELOG section of a release tag.

    uv run tools/changelog_extract.py v1.0.0 [--changelog CHANGELOG.md] [--out FILE]

Exit 1 if the section for the tag is missing.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def extract(text: str, tag: str) -> str | None:
    """Body of the `## [<version>]` section, or None if absent."""
    version = tag.removeprefix("v")
    m = re.search(rf"^## \[{re.escape(version)}\][^\n]*\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    return m.group(1).strip() if m else None


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("tag")
    ap.add_argument("--changelog", default="CHANGELOG.md")
    ap.add_argument("--out")
    args = ap.parse_args(argv)
    try:
        text = Path(args.changelog).read_text(encoding="utf-8")
    except OSError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    body = extract(text, args.tag)
    if body is None:
        print(f"error: no CHANGELOG section for {args.tag}", file=sys.stderr)
        return 1
    if args.out:
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(body + "\n", encoding="utf-8")
    else:
        print(body)
    return 0


if __name__ == "__main__":
    sys.exit(main())
