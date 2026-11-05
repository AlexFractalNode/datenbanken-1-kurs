import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "tools" / "install_hooks.py"


def _repo(tmp_path):
    repo = tmp_path / "repo"
    repo.mkdir()
    subprocess.run(["git", "init", "-b", "main"], cwd=repo, check=True, capture_output=True)
    return repo


def test_installs_both_hooks(tmp_path):
    repo = _repo(tmp_path)
    terms = tmp_path / "my terms.txt"
    terms.write_text("x\n", encoding="utf-8")
    r = subprocess.run(
        [sys.executable, str(SCRIPT), "--terms", str(terms)],
        cwd=repo, capture_output=True, text=True,
    )
    assert r.returncode == 0, r.stderr
    pre = (repo / ".git" / "hooks" / "pre-commit").read_text(encoding="utf-8")
    msg = (repo / ".git" / "hooks" / "commit-msg").read_text(encoding="utf-8")
    assert pre.startswith("#!/bin/sh")
    assert "uv run tools/leakguard.py --staged" in pre
    assert "uv run tools/leakguard.py --commit-msg" in msg
    assert "my terms.txt" in pre and "my terms.txt" in msg
    assert '"$1"' in msg


def test_existing_hook_warns_and_is_backed_up(tmp_path):
    repo = _repo(tmp_path)
    terms = tmp_path / "t.txt"
    terms.write_text("x\n", encoding="utf-8")
    hook = repo / ".git" / "hooks" / "pre-commit"
    hook.write_text("#!/bin/sh\necho mine\n", encoding="utf-8")
    r = subprocess.run([sys.executable, str(SCRIPT), "--terms", str(terms)],
                       cwd=repo, capture_output=True, text=True)
    assert r.returncode == 0
    assert "warning" in r.stderr.lower()
    assert "mine" in (repo / ".git" / "hooks" / "pre-commit.bak").read_text(encoding="utf-8")
    assert "leakguard" in hook.read_text(encoding="utf-8")


def test_existing_bak_is_not_overwritten(tmp_path):
    repo = _repo(tmp_path)
    terms = tmp_path / "t.txt"
    terms.write_text("x\n", encoding="utf-8")
    hooks = repo / ".git" / "hooks"
    (hooks / "pre-commit").write_text("#!/bin/sh\necho second\n", encoding="utf-8")
    (hooks / "pre-commit.bak").write_text("#!/bin/sh\necho first\n", encoding="utf-8")
    r = subprocess.run([sys.executable, str(SCRIPT), "--terms", str(terms)],
                       cwd=repo, capture_output=True, text=True)
    assert r.returncode == 0
    assert "first" in (hooks / "pre-commit.bak").read_text(encoding="utf-8")
    baks = [p for p in hooks.glob("pre-commit.bak*") if p.name != "pre-commit.bak"]
    assert len(baks) == 1 and "second" in baks[0].read_text(encoding="utf-8")


def test_respects_core_hooks_path(tmp_path):
    repo = _repo(tmp_path)
    terms = tmp_path / "t.txt"
    terms.write_text("x\n", encoding="utf-8")
    subprocess.run(["git", "config", "core.hooksPath", "myhooks"], cwd=repo, check=True)
    r = subprocess.run([sys.executable, str(SCRIPT), "--terms", str(terms)],
                       cwd=repo, capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert (repo / "myhooks" / "pre-commit").is_file()
    assert not (repo / ".git" / "hooks" / "pre-commit").exists()


def test_missing_terms_file_fails(tmp_path):
    repo = _repo(tmp_path)
    r = subprocess.run(
        [sys.executable, str(SCRIPT), "--terms", str(tmp_path / "nope.txt")],
        cwd=repo, capture_output=True, text=True,
    )
    assert r.returncode == 2
    assert not (repo / ".git" / "hooks" / "pre-commit").exists()


def test_not_a_repo_fails(tmp_path):
    terms = tmp_path / "t.txt"
    terms.write_text("x\n", encoding="utf-8")
    r = subprocess.run(
        [sys.executable, str(SCRIPT), "--terms", str(terms)],
        cwd=tmp_path, capture_output=True, text=True,
    )
    assert r.returncode == 2
