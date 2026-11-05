#!/usr/bin/env python3
"""Install git hooks that run the leak guard.

Usage: install_hooks.py --terms FILE

The terms path is written only into the hook files under the git hooks
directory, which git does not version.
"""
from __future__ import annotations

import argparse
import shlex
import subprocess
import sys
from pathlib import Path


def _hooks_dir() -> Path:
    r = subprocess.run(
        ["git", "rev-parse", "--git-path", "hooks"], capture_output=True, text=True
    )
    if r.returncode != 0:
        raise RuntimeError("not inside a git repository")
    return Path(r.stdout.strip()).resolve()


def hook_scripts(terms: Path) -> dict[str, str]:
    q = shlex.quote(terms.resolve().as_posix())
    return {
        "pre-commit": (
            "#!/bin/sh\n"
            f"exec uv run tools/leakguard.py --staged --terms {q}\n"
        ),
        "commit-msg": (
            "#!/bin/sh\n"
            f'exec uv run tools/leakguard.py --commit-msg "$1" --terms {q}\n'
        ),
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Install leak guard git hooks.")
    ap.add_argument("--terms", required=True, metavar="FILE")
    args = ap.parse_args(argv)

    terms = Path(args.terms)
    if not terms.is_file():
        print(f"install_hooks: terms file not found: {terms}", file=sys.stderr)
        return 2
    try:
        hooks = _hooks_dir()
    except RuntimeError as exc:
        print(f"install_hooks: {exc}", file=sys.stderr)
        return 2
    hooks.mkdir(parents=True, exist_ok=True)
    for name, body in hook_scripts(terms).items():
        path = hooks / name
        path.write_text(body, encoding="utf-8", newline="\n")
        path.chmod(path.stat().st_mode | 0o111)
        print(f"installed {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
