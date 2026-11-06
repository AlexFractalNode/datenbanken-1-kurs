"""Run all repository checks locally (mirrors .github/workflows/ci.yml).

    uv run tools/check.py [--ci] [--strict] [--skip NAME]... [--engines fb,pg]

Steps: leakguard, validate, pytest, sqltest, web-build, linkcheck, web-test, diagrams, pdf,
anki-import, anki (web-install only with --ci).
Every step runs even if an earlier one fails; exit code 1 if any step failed.
--ci      CI flavour: `npm ci`, Firebird client library from the host (--fb-via local).
--strict  validate with the total minimum counts (default: --no-min until release).
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STEP_NAMES = [
    "leakguard", "validate", "pytest", "sqltest", "web-install", "web-build", "linkcheck",
    "web-test", "diagrams", "pdf", "anki-import", "anki",
]


@dataclass
class Step:
    name: str
    cmd: list[str]
    cwd: Path = field(default_factory=lambda: ROOT)


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--ci", action="store_true", help="CI flavour (npm ci, --fb-via local)")
    ap.add_argument("--strict", action="store_true", help="validate with total minimum counts")
    ap.add_argument("--skip", action="append", default=[], choices=STEP_NAMES, metavar="NAME")
    ap.add_argument("--engines", default="fb,pg", help="engines for sqltest (default: fb,pg)")
    return ap.parse_args(argv)


def build_steps(args: argparse.Namespace) -> list[Step]:
    py = ["uv", "run"]
    web = ROOT / "web"
    validate = [*py, "tools/validate.py"] + ([] if args.strict else ["--no-min"])
    sqltest = [*py, "tools/sqltest.py", "--engines", args.engines]
    if args.ci:
        sqltest += ["--fb-via", "local"]
    steps = [
        Step("leakguard", [*py, "tools/leakguard.py", "--tree"]),
        Step("validate", validate),
        Step("pytest", [*py, "pytest", "-q"]),
        Step("sqltest", sqltest),
    ]
    if args.ci:
        steps.append(Step("web-install", ["npm", "ci"], web))
    steps += [
        Step("web-build", ["npm", "run", "build"], web),
        Step("linkcheck", [*py, "tools/linkcheck.py", "web/dist", "--base", "/datenbanken-1-kurs/"]),
        Step("web-test", ["npm", "test"], web),
        Step("diagrams", ["node", "tools/render_diagrams.mjs", "--out", "dist/diagrams"]),
        Step("pdf", [*py, "tools/pdf.py", "--diagrams", "dist/diagrams"]),
        Step("anki-import", [*py, "pytest", "-q", "tests/test_anki.py"]),
        Step("anki", [*py, "tools/anki_export.py", "--per-topic", "--diagrams", "dist/diagrams"]),
    ]
    return [s for s in steps if s.name not in args.skip]


def run_steps(steps: list[Step]) -> int:
    results: list[tuple[str, bool, float, str]] = []
    for s in steps:
        print(f"\n=== {s.name}: {' '.join(s.cmd)}", flush=True)
        start = time.monotonic()
        exe = shutil.which(s.cmd[0])
        if exe is None:
            ok, note = False, f"command not found: {s.cmd[0]}"
            print(note, file=sys.stderr)
        else:
            try:
                rc = subprocess.run([exe, *s.cmd[1:]], cwd=s.cwd).returncode
            except KeyboardInterrupt:
                print("interrupted", file=sys.stderr)
                results.append((s.name, False, time.monotonic() - start, "interrupted"))
                break
            except OSError as exc:
                rc, note = 1, str(exc)
                print(note, file=sys.stderr)
            else:
                note = f"exit {rc}"
            ok = rc == 0
        results.append((s.name, ok, time.monotonic() - start, "" if ok else note))
    print("\n=== summary")
    for name, ok, secs, note in results:
        print(f"{'PASS' if ok else 'FAIL'}  {name:<12} {secs:6.1f}s  {note}".rstrip())
    failed = [n for n, ok, _, _ in results if not ok]
    print(f"{len(results) - len(failed)}/{len(results)} steps passed" + (f"; failed: {', '.join(failed)}" if failed else ""))
    return 1 if failed else 0


def main(argv: list[str] | None = None) -> int:
    return run_steps(build_steps(parse_args(argv)))


if __name__ == "__main__":
    sys.exit(main())
