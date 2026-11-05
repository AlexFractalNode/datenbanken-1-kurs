import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _ignored(path: str) -> bool:
    r = subprocess.run(
        ["git", "-c", "core.excludesFile=", "check-ignore", "-q", "--no-index", path],
        cwd=ROOT,
        capture_output=True,
    )
    assert r.returncode in (0, 1), r.stderr
    return r.returncode == 0


def test_allowlist():
    must_be_ignored = [
        "secret.pdf",
        "notes/x.md",
        ".claude/x.json",
        "content/de/x.pdf",
        ".briefs/task.md",
        "node_modules/x/index.js",
        "dist/book.pdf",
        "slides.pptx",
        "a.zip",
        "notes.gitattributes",
    ]
    must_be_tracked = [
        "content/de/topics/t01-x/summary.md",
        "content/topics.yml",
        "tools/x.py",
        "web/src/x.ts",
        "tests/test_x.py",
        "docker-compose.test.yml",
        "README.md",
        "LICENSE",
        "LICENSE-CONTENT",
        "pyproject.toml",
        "package.json",
        ".gitignore",
        ".gitattributes",
        ".python-version",
    ]
    for p in must_be_ignored:
        assert _ignored(p), f"{p} should be ignored"
    for p in must_be_tracked:
        assert not _ignored(p), f"{p} should not be ignored"


def test_gitattributes_content():
    lines = (ROOT / ".gitattributes").read_text(encoding="utf-8").splitlines()
    assert "* text=auto eol=lf" in lines
    assert "*.png binary" in lines
    assert "*.svg text" in lines
