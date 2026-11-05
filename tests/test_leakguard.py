import subprocess
import sys
from pathlib import Path

import leakguard
from leakguard import Finding, scan_paths, scan_text

SCRIPT = Path(__file__).resolve().parent.parent / "tools" / "leakguard.py"
TERM = "geheimwort42"


def rules(findings):
    return {f.rule for f in findings}


def test_blocks_pdf_anywhere():
    f = scan_paths(["a/b/c/Skript.PDF", "x.pdf"], {})
    assert [x.path for x in f] == ["a/b/c/Skript.PDF", "x.pdf"]
    assert rules(f) == {"forbidden-extension"}
    assert isinstance(f[0], Finding)


def test_blocks_dot_claude():
    f = scan_paths([".claude/x.json", "tools/.claude/y.md"], {})
    assert len(f) == 2
    assert rules(f) == {"forbidden-path"}


def test_blocks_file_over_1mb():
    sizes = {"big.txt": 1024 * 1024 + 1, "ok.txt": 1024 * 1024}
    f = scan_paths(["big.txt", "ok.txt"], sizes)
    assert [x.path for x in f] == ["big.txt"]
    assert f[0].rule == "file-too-large"


def test_allows_svg_in_diagrams():
    assert scan_paths(["content/de/diagrams/er.svg"], {}) == []
    assert scan_paths(["web/public/logo.png"], {}) == []
    assert rules(scan_paths(["content/de/er.png"], {})) == {"forbidden-image"}
    assert rules(scan_paths(["content/de/er.jpg"], {})) == {"forbidden-image"}


def test_terms_case_insensitive():
    f = scan_text("a.md", f"line one\nSome {TERM.upper()} here\n", [TERM])
    assert len(f) == 1
    assert f[0].path == "a.md"
    assert f[0].rule == "blocked-term"
    assert TERM not in f[0].detail.lower()
    assert scan_text("a.md", "clean", [TERM]) == []
    assert scan_text("a.md", "anything", []) == []


def run(args, cwd):
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        cwd=cwd,
        capture_output=True,
        text=True,
    )


def git(cwd, *args):
    subprocess.run(
        ["git", "-c", "user.name=T", "-c", "user.email=t@example.invalid", *args],
        cwd=cwd,
        check=True,
        capture_output=True,
    )


def test_commit_msg_scanned(tmp_path):
    terms = tmp_path / "terms.txt"
    terms.write_text(f"# comment\n\n{TERM}\n", encoding="utf-8")
    bad = tmp_path / "msg1"
    bad.write_text(f"feat: add {TERM.capitalize()}\n", encoding="utf-8")
    good = tmp_path / "msg2"
    good.write_text("feat: add thing\n", encoding="utf-8")
    assert run(["--commit-msg", str(bad), "--terms", str(terms)], tmp_path).returncode == 1
    assert run(["--commit-msg", str(good), "--terms", str(terms)], tmp_path).returncode == 0


def make_repo(tmp_path):
    repo = tmp_path / "repo"
    repo.mkdir()
    git(repo, "init", "-b", "main")
    return repo


def test_history_mode_scans_all_commits(tmp_path):
    repo = make_repo(tmp_path)
    terms = tmp_path / "terms.txt"
    terms.write_text(TERM + "\n", encoding="utf-8")
    (repo / "a.md").write_text(f"hello {TERM}\n", encoding="utf-8")
    git(repo, "add", "a.md")
    git(repo, "commit", "-m", "first")
    (repo / "a.md").write_text("hello\n", encoding="utf-8")
    git(repo, "add", "a.md")
    git(repo, "commit", "-m", "second")
    # Tree is clean, history is not.
    assert run(["--tree", "--terms", str(terms)], repo).returncode == 0
    r = run(["--history", "--terms", str(terms)], repo)
    assert r.returncode == 1
    assert "a.md" in r.stdout + r.stderr
    assert TERM not in r.stdout + r.stderr


def test_staged_and_range(tmp_path):
    repo = make_repo(tmp_path)
    terms = tmp_path / "terms.txt"
    terms.write_text(TERM + "\n", encoding="utf-8")
    (repo / "a.md").write_text("ok\n", encoding="utf-8")
    git(repo, "add", "a.md")
    git(repo, "commit", "-m", "first")
    (repo / "b.md").write_text(f"x {TERM}\n", encoding="utf-8")
    git(repo, "add", "b.md")
    assert run(["--staged", "--terms", str(terms)], repo).returncode == 1
    git(repo, "commit", "-m", "second")
    assert run(["--range", "HEAD~1..HEAD", "--terms", str(terms)], repo).returncode == 1
    assert run(["--staged", "--terms", str(terms)], repo).returncode == 0


def test_staged_blocks_pdf_without_terms(tmp_path):
    repo = make_repo(tmp_path)
    (repo / "s.pdf").write_bytes(b"%PDF-1.4\n")
    git(repo, "add", "-f", "s.pdf")
    assert run(["--staged"], repo).returncode == 1


def test_load_terms_skips_comments(tmp_path):
    p = tmp_path / "t.txt"
    p.write_text("# c\n\n  Foo  \n", encoding="utf-8")
    assert leakguard.load_terms(str(p)) == ["foo"]
