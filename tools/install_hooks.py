#!/usr/bin/env python3
"""Install git hooks that run the leak guard.

Usage: install_hooks.py --terms FILE

The terms path is written only into the hook files under the git hooks
directory, which git does not version.
"""
from __future__ import annotations

import argparse
import os
import shlex
import subprocess
import sys
from pathlib import Path


def _hooks_dir() -> Path:
    top = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True
    )
    if top.returncode != 0:
        raise RuntimeError("not inside a git repository")
    root = Path(top.stdout.strip())
    cfg = subprocess.run(
        ["git", "config", "--get", "core.hooksPath"], capture_output=True, text=True, cwd=root
    )
    custom = cfg.stdout.strip()
    if cfg.returncode == 0 and custom:
        p = Path(custom).expanduser()
        return (p if p.is_absolute() else root / p).resolve()
    r = subprocess.run(
        ["git", "rev-parse", "--git-path", "hooks"], capture_output=True, text=True, cwd=root
    )
    if r.returncode != 0:
        raise RuntimeError("cannot determine hooks directory")
    p = Path(r.stdout.strip())
    return (p if p.is_absolute() else root / p).resolve()


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
        if path.exists():
            if path.read_text(encoding="utf-8", errors="replace") == body:
                print(f"unchanged {path}")
                continue
            backup = path.with_name(name + ".bak")
            print(f"install_hooks: warning: {path} exists; moving it to {backup}", file=sys.stderr)
            os.replace(path, backup)
        path.write_text(body, encoding="utf-8", newline="\n")
        path.chmod(path.stat().st_mode | 0o111)
        print(f"installed {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
