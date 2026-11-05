#!/usr/bin/env python3
"""Leak guard: blocks forbidden files and blocked terms before they reach the repo.

Usage:
    leakguard.py (--staged | --range A..B | --history | --tree)
                 [--terms FILE] [--commit-msg FILE]

Exit code 1 if anything is found, 0 otherwise, 2 on usage or git errors.
Blocked terms are never printed; paths containing a blocked term are withheld.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import re
import subprocess
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import PurePosixPath

MAX_BYTES = 1024 * 1024
# Blocked formats. .svg is allowed anywhere; .png only below web/public/.
IMAGE_EXT = {
    ".avif", ".psd", ".eps", ".svgz", ".jxl", ".heif", ".heic", ".tga", ".gif",
    ".bmp", ".tif", ".tiff", ".webp", ".ico", ".jpg", ".jpeg",
}
FORBIDDEN_EXT = {
    ".docx", ".doc", ".xlsx", ".xls", ".odt", ".ods", ".odp", ".ppt", ".pptx",
    ".pdf", ".7z", ".rar", ".gz", ".tar", ".zip", ".exe", ".apkg",
}
FORBIDDEN_DIRS = {".claude"}
NULL_SHA_RE = re.compile(r"^0+$")
_ZERO_WIDTH = dict.fromkeys(map(ord, "​‌‍﻿"), None)
_ROOT: str | None = None


class GitError(RuntimeError):
    pass


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
        if any(part.lower() in FORBIDDEN_DIRS for part in p.parts):
            findings.append(Finding(raw, "forbidden-path", "path inside a forbidden directory"))
        if ext in FORBIDDEN_EXT:
            findings.append(Finding(raw, "forbidden-extension", f"{ext} files are not allowed"))
        elif ext in IMAGE_EXT:
            findings.append(Finding(raw, "forbidden-image", f"{ext} images are not allowed"))
        elif ext == ".png" and not path.startswith("web/public/"):
            findings.append(Finding(raw, "forbidden-image", ".png only allowed under web/public/"))
        size = sizes.get(raw)
        if size is not None and size > MAX_BYTES:
            findings.append(Finding(raw, "file-too-large", f"{size} bytes exceeds {MAX_BYTES}"))
    return findings


def scan_allowlist(paths: list[str], allowed: set[str]) -> list[Finding]:
    """The top-level entry of every path must be in the .gitignore allowlist."""
    out = []
    for raw in paths:
        top = raw.replace("\\", "/").split("/", 1)[0]
        if top not in allowed:
            out.append(Finding(raw, "outside-allowlist", "top-level entry is not in the allowlist"))
    return out


def load_allowlist(root: str) -> set[str]:
    path = os.path.join(root, ".gitignore")
    try:
        with open(path, encoding="utf-8") as fh:
            lines = fh.read().splitlines()
    except OSError as exc:
        raise GitError(f"cannot read allowlist {path}: {exc}") from exc
    allowed = set()
    for line in lines:
        s = line.strip()
        if s.startswith("!/"):
            allowed.add(s[2:].rstrip("/"))
    return allowed


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s).translate(_ZERO_WIDTH).replace(" ", " ")
    return re.sub(r"\s+", " ", s.casefold()).strip()


def _norm_terms(terms: list[str]) -> list[str]:
    return [t for t in (norm(t) for t in terms) if t]


def scan_text(name: str, text: str, terms: list[str]) -> list[Finding]:
    """Normalized, case-insensitive match; reports neither term nor position."""
    needles = _norm_terms(terms)
    if not needles:
        return []
    hay = norm(text)
    if any(n in hay for n in needles):
        return [Finding(name, "blocked-term", "contains a blocked term")]
    return []


def is_binary(data: bytes) -> bool:
    return b"\0" in data[:8192]


def scan_bytes(name: str, data: bytes, terms: list[str]) -> list[Finding]:
    """Decode utf-8, then utf-16 (BOM), then cp1252; binaries get a byte search."""
    needles = _norm_terms(terms)
    if not needles:
        return []
    bom = data.startswith((b"\xff\xfe", b"\xfe\xff"))
    if bom:
        text = data.decode("utf-16", errors="replace")
    else:
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            text = data.decode("cp1252", errors="replace")
    hit = scan_text(name, text, terms)
    if hit:
        return hit
    if bom or is_binary(data):
        low = data.lower()
        for n in needles:
            for enc in ("utf-8", "utf-16-le", "utf-16-be", "cp1252"):
                try:
                    pat = n.encode(enc)
                except UnicodeEncodeError:
                    continue
                if pat in low:
                    return [Finding(name, "blocked-term", "contains a blocked term")]
    return []


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


def display_path(path: str, terms: list[str]) -> str:
    if scan_text(path, path, terms):
        digest = hashlib.sha256(path.encode("utf-8", "replace")).hexdigest()[:12]
        return f"<path withheld: {digest}>"
    return path


# --- git plumbing -----------------------------------------------------------

def _git(args: list[str], *, text: bool = False) -> bytes | str:
    r = subprocess.run(["git", *args], capture_output=True, cwd=_ROOT)
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


def _check_blobs(entries, terms, allowed, seen) -> list[Finding]:
    findings: list[Finding] = []
    for sha, path in entries:
        if (sha, path) in seen or NULL_SHA_RE.match(sha):
            continue
        seen.add((sha, path))
        size = int(_git(["cat-file", "-s", sha], text=True).strip())
        findings += scan_paths([path], {path: size})
        findings += scan_allowlist([path], allowed)
        findings += scan_text(path, path, terms)
        if size > MAX_BYTES:
            continue
        data = _git(["cat-file", "blob", sha])
        if not PurePosixPath(path).suffix and is_binary(data):
            findings.append(Finding(path, "binary-no-extension", "binary content without extension"))
        findings += scan_bytes(path, data, terms)
    return findings


def _scan_commit_message(sha: str, terms: list[str]) -> list[Finding]:
    msg = _git(["log", "-1", "--format=%B", sha], text=True)
    return scan_text(f"commit {sha[:10]} message", msg, terms)


def _scan_commits(commits: list[str], terms, allowed) -> list[Finding]:
    findings: list[Finding] = []
    seen: set[tuple[str, str]] = set()
    for sha in commits:
        findings += _scan_commit_message(sha, terms)
        out = _git(["diff-tree", "-r", "-m", "--root", "--raw", "-z", "--no-renames",
                    "--no-commit-id", "--diff-filter=ACMRT", sha])
        findings += _check_blobs(_parse_raw_z(out), terms, allowed, seen)
    return findings


def _scan_staged(terms, allowed) -> list[Finding]:
    out = _git(["diff", "--cached", "--raw", "-z", "--no-renames", "--diff-filter=ACMRT"])
    return _check_blobs(_parse_raw_z(out), terms, allowed, set())


def _scan_range(rng: str, terms, allowed) -> list[Finding]:
    if "..." in rng or ".." not in rng:
        raise GitError("--range expects A..B")
    a, _, b = rng.partition("..")
    if not b or NULL_SHA_RE.match(b):
        b = "HEAD"
    spec = b if (not a or NULL_SHA_RE.match(a)) else f"{a}..{b}"
    commits = _git(["rev-list", "--reverse", spec], text=True).split()
    return _scan_commits(commits, terms, allowed)


def _scan_history(terms, allowed) -> list[Finding]:
    commits = _git(["rev-list", "--all"], text=True).split()
    return _scan_commits(commits, terms, allowed)


def _scan_tree(terms, allowed) -> list[Finding]:
    raw = _git(["ls-files", "-z", "--full-name"])
    names = [os.fsdecode(n) for n in raw.split(b"\0") if n]
    findings: list[Finding] = []
    for n in names:
        findings += scan_allowlist([n], allowed)
        findings += scan_text(n, n, terms)
        full = os.path.join(_ROOT or ".", n)
        try:
            with open(full, "rb") as fh:
                data = fh.read()
        except FileNotFoundError:
            continue  # tracked but deleted in the working tree
        except OSError as exc:
            findings.append(Finding(n, "unreadable", f"cannot read file: {type(exc).__name__}"))
            continue
        findings += scan_paths([n], {n: len(data)})
        if len(data) > MAX_BYTES:
            continue
        if not PurePosixPath(n).suffix and is_binary(data):
            findings.append(Finding(n, "binary-no-extension", "binary content without extension"))
        findings += scan_bytes(n, data, terms)
    return findings


def main(argv: list[str] | None = None) -> int:
    global _ROOT
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

    terms: list[str] = []
    try:
        terms = load_terms(args.terms)
        findings: list[Finding] = []
        if args.commit_msg:
            with open(args.commit_msg, encoding="utf-8", errors="replace") as fh:
                body = "\n".join(l for l in fh.read().splitlines() if not l.startswith("#"))
            findings += scan_text("commit message", body, terms)
        if args.staged or args.range or args.history or args.tree:
            _ROOT = _git(["rev-parse", "--show-toplevel"], text=True).strip()
            allowed = load_allowlist(_ROOT)
            if args.staged:
                findings += _scan_staged(terms, allowed)
            elif args.range:
                findings += _scan_range(args.range, terms, allowed)
            elif args.history:
                findings += _scan_history(terms, allowed)
            else:
                findings += _scan_tree(terms, allowed)
    except (GitError, OSError) as exc:
        print(f"leakguard: error: {exc}", file=sys.stderr)
        return 2

    for f in findings:
        print(f"leakguard: {display_path(f.path, terms)}: [{f.rule}] {f.detail}")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
