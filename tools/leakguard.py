#!/usr/bin/env python3
"""Leak guard: blocks forbidden files and blocked terms before they reach the repo.

Usage:
    leakguard.py (--staged | --range A..B | --history | --tree)
                 [--terms FILE] [--commit-msg FILE]

Exit code 1 if anything is found, 0 otherwise, 2 on usage or git errors.
Blocked terms are never printed; findings only name path, rule and line.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from dataclasses import dataclass
from pathlib import PurePosixPath

MAX_BYTES = 1024 * 1024
FORBIDDEN_EXT = {".pdf", ".pptx", ".zip"}
# .svg is allowed anywhere; .png only below web/public/.
OTHER_IMAGE_EXT = {".jpg", ".jpeg", ".gif", ".bmp", ".tif", ".tiff", ".webp", ".heic", ".ico"}
FORBIDDEN_DIRS = {".claude"}


@dataclass(frozen=True)
class Finding:
    path: str
    rule: str
    detail: str


def scan_paths(paths: list[str], sizes: dict[str, int]) -> list[Finding]:
    findings: list[Finding] = []
    for raw in paths:
        path = raw.replace("\\", "/")
        p = PurePosixPath(path)
        ext = p.suffix.lower()
        if any(part in FORBIDDEN_DIRS for part in p.parts):
            findings.append(Finding(raw, "forbidden-path", "path inside a forbidden directory"))
        if ext in FORBIDDEN_EXT:
            findings.append(Finding(raw, "forbidden-extension", f"{ext} files are not allowed"))
        elif ext == ".png" and not path.startswith("web/public/"):
            findings.append(Finding(raw, "forbidden-image", ".png only allowed under web/public/"))
        elif ext in OTHER_IMAGE_EXT:
            findings.append(Finding(raw, "forbidden-image", f"{ext} images are not allowed"))
        size = sizes.get(raw)
        if size is not None and size > MAX_BYTES:
            findings.append(Finding(raw, "file-too-large", f"{size} bytes exceeds {MAX_BYTES}"))
    return findings


def scan_text(name: str, text: str, terms: list[str]) -> list[Finding]:
    """Case-insensitive substring match; reports line numbers, not the terms."""
    needles = [t.strip().lower() for t in terms if t.strip()]
    if not needles:
        return []
    findings: list[Finding] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        low = line.lower()
        if any(n in low for n in needles):
            findings.append(Finding(name, "blocked-term", f"line {lineno} contains a blocked term"))
    return findings


def load_terms(path: str | None) -> list[str]:
    if not path:
        return []
    terms: list[str] = []
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            s = line.strip()
            if s and not s.startswith("#"):
                terms.append(s.lower())
    return terms


# --- git plumbing -----------------------------------------------------------

class GitError(RuntimeError):
    pass


def _git(args: list[str], *, text: bool = False) -> bytes | str:
    r = subprocess.run(["git", *args], capture_output=True)
    if r.returncode != 0:
        raise GitError(f"git {' '.join(args)} failed: {r.stderr.decode(errors='replace').strip()}")
    return r.stdout.decode("utf-8", errors="replace") if text else r.stdout


def _parse_raw_z(out: bytes) -> list[tuple[str, str]]:
    """Parse `git diff --raw -z` output into (new_blob_sha, path)."""
    parts = out.decode("utf-8", errors="replace").split("\0")
    entries: list[tuple[str, str]] = []
    i = 0
    while i < len(parts):
        meta = parts[i]
        if not meta.startswith(":"):
            i += 1
            continue
        fields = meta[1:].split()
        if len(fields) < 5 or i + 1 >= len(parts):
            raise GitError("unexpected git raw output")
        entries.append((fields[3], parts[i + 1]))
        i += 2
    return entries


def _check_blobs(entries: list[tuple[str, str]], terms: list[str], seen: set[tuple[str, str]]) -> list[Finding]:
    findings: list[Finding] = []
    sizes: dict[str, int] = {}
    todo = []
    for sha, path in entries:
        if (sha, path) in seen or set(sha) == {"0"}:
            continue
        seen.add((sha, path))
        todo.append((sha, path))
        sizes[path] = int(_git(["cat-file", "-s", sha], text=True).strip())
    findings += scan_paths([p for _, p in todo], sizes)
    for sha, path in todo:
        findings += scan_text(path, path, terms)  # file names themselves
        if sizes[path] > MAX_BYTES or not terms:
            continue
        data = _git(["cat-file", "blob", sha])
        if b"\0" in data[:8192]:
            continue
        findings += scan_text(path, data.decode("utf-8", errors="replace"), terms)
    return findings


def _scan_staged(terms: list[str]) -> list[Finding]:
    out = _git(["diff", "--cached", "--raw", "-z", "--no-renames", "--diff-filter=ACMR"])
    return _check_blobs(_parse_raw_z(out), terms, set())


def _scan_range(rng: str, terms: list[str]) -> list[Finding]:
    if ".." not in rng:
        raise GitError("--range expects A..B")
    a, _, b = rng.partition("..")
    out = _git(["diff", "--raw", "-z", "--no-renames", "--diff-filter=ACMR", a, b])
    findings = _check_blobs(_parse_raw_z(out), terms, set())
    for sha in _git(["rev-list", rng], text=True).split():
        findings += _scan_commit_message(sha, terms)
    return findings


def _scan_commit_message(sha: str, terms: list[str]) -> list[Finding]:
    msg = _git(["log", "-1", "--format=%B", sha], text=True)
    return scan_text(f"commit {sha[:10]} message", msg, terms)


def _scan_history(terms: list[str]) -> list[Finding]:
    findings: list[Finding] = []
    seen: set[tuple[str, str]] = set()
    commits = _git(["rev-list", "--all"], text=True).split()
    for sha in commits:
        findings += _scan_commit_message(sha, terms)
        out = _git(["diff-tree", "-r", "-m", "--root", "--raw", "-z", "--no-renames",
                    "--no-commit-id", "--diff-filter=ACMR", sha])
        findings += _check_blobs(_parse_raw_z(out), terms, seen)
    return findings


def _scan_tree(terms: list[str]) -> list[Finding]:
    names = [n for n in _git(["ls-files", "-z"], text=True).split("\0") if n]
    findings: list[Finding] = []
    sizes: dict[str, int] = {}
    existing: list[str] = []
    for n in names:
        try:
            with open(n, "rb") as fh:
                data = fh.read()
        except OSError:
            continue  # deleted in working tree
        existing.append(n)
        sizes[n] = len(data)
        findings += scan_text(n, n, terms)
        if len(data) <= MAX_BYTES and b"\0" not in data[:8192]:
            findings += scan_text(n, data.decode("utf-8", errors="replace"), terms)
    return scan_paths(existing, sizes) + findings


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Block forbidden files and terms.")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--staged", action="store_true")
    mode.add_argument("--range", metavar="A..B")
    mode.add_argument("--history", action="store_true")
    mode.add_argument("--tree", action="store_true")
    ap.add_argument("--terms", metavar="FILE")
    ap.add_argument("--commit-msg", metavar="FILE")
    args = ap.parse_args(argv)

    if not (args.staged or args.range or args.history or args.tree or args.commit_msg):
        ap.error("one of --staged, --range, --history, --tree, --commit-msg is required")

    try:
        terms = load_terms(args.terms)
        findings: list[Finding] = []
        if args.commit_msg:
            with open(args.commit_msg, encoding="utf-8", errors="replace") as fh:
                findings += scan_text("commit message", fh.read(), terms)
        if args.staged:
            findings += _scan_staged(terms)
        elif args.range:
            findings += _scan_range(args.range, terms)
        elif args.history:
            findings += _scan_history(terms)
        elif args.tree:
            findings += _scan_tree(terms)
    except (GitError, OSError) as exc:
        print(f"leakguard: error: {exc}", file=sys.stderr)
        return 2

    for f in findings:
        print(f"leakguard: {f.path}: [{f.rule}] {f.detail}")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
