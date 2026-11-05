import shutil
import subprocess
import sys

from leakguard import scan_text
from test_leakguard import SCRIPT, TERM, git, make_repo, run

HOOKS = SCRIPT.parent / "install_hooks.py"
DOT = "." + "claude"


def out(r):
    return r.stdout + r.stderr


def terms_file(tmp_path, content=TERM + "\n"):
    t = tmp_path / "terms.txt"
    t.write_text(content, encoding="utf-8")
    return str(t)


def commit_all(repo, msg="c"):
    git(repo, "add", "-A")
    git(repo, "commit", "-m", msg)


def test_extensionless_binary_blocked(tmp_path):
    repo = make_repo(tmp_path)
    (repo / "tools").mkdir()
    (repo / "tools" / "blob").write_bytes(b"\x00\x01\x02binary")
    (repo / "tools" / "text").write_text("plain\n", encoding="utf-8")
    git(repo, "add", "-A")
    r = run(["--staged"], repo)
    assert r.returncode == 1
    assert "tools/blob" in r.stdout and "tools/text" not in r.stdout


def test_force_added_outside_allowlist_found(tmp_path):
    repo = make_repo(tmp_path)
    (repo / "notes").mkdir()
    (repo / "notes" / "x.md").write_text("hi\n", encoding="utf-8")
    git(repo, "add", "-f", "notes/x.md")
    r = run(["--staged"], repo)
    assert r.returncode == 1
    assert "outside-allowlist" in r.stdout


def test_force_added_dot_claude_lower(tmp_path):
    repo = make_repo(tmp_path)
    (repo / DOT).mkdir()
    (repo / DOT / "x").write_text("hi\n", encoding="utf-8")
    git(repo, "add", "-f", f"{DOT}/x")
    r = run(["--staged"], repo)
    assert r.returncode == 1 and "forbidden-path" in r.stdout


def test_force_added_dot_claude_upper(tmp_path):
    repo = make_repo(tmp_path)
    up = DOT.upper()
    (repo / up).mkdir()
    (repo / up / "x").write_text("hi\n", encoding="utf-8")
    git(repo, "add", "-f", f"{up}/x")
    r = run(["--staged"], repo)
    assert r.returncode == 1 and "forbidden-path" in r.stdout


def test_term_in_filename_is_withheld(tmp_path):
    repo = make_repo(tmp_path)
    (repo / f"{TERM}.md").write_text("x\n", encoding="utf-8")
    git(repo, "add", "-f", f"{TERM}.md")
    r = run(["--staged", "--terms", terms_file(tmp_path)], repo)
    assert r.returncode == 1
    assert TERM not in out(r).lower()
    assert "<path withheld: " in r.stdout


def test_normalization():
    assert len(scan_text("a", "Geheim\n  wort   zwei", ["geheim wort zwei"])) == 1
    assert len(scan_text("a", "ge​heim‍wort﻿", ["geheimwort"])) == 1
    assert len(scan_text("a", "Ｇeheimwort", ["geheimwort"])) == 1  # fullwidth G


def test_binary_with_nul_and_term(tmp_path):
    repo = make_repo(tmp_path)
    (repo / "a.md").write_bytes(b"\x00\x01" + TERM.upper().encode() + b"\x02")
    git(repo, "add", "a.md")
    assert run(["--staged", "--terms", terms_file(tmp_path)], repo).returncode == 1


def test_utf16_files_with_term(tmp_path):
    repo = make_repo(tmp_path)
    terms = terms_file(tmp_path)
    (repo / "a.md").write_bytes(("x " + TERM + "\n").encode("utf-16"))
    git(repo, "add", "a.md")
    assert run(["--staged", "--terms", terms], repo).returncode == 1
    git(repo, "reset", "-q")
    (repo / "b.md").write_bytes(("x " + TERM).encode("utf-16-le"))  # no BOM
    git(repo, "add", "b.md")
    assert run(["--staged", "--terms", terms], repo).returncode == 1


def test_cp1252_file_with_term(tmp_path):
    repo = make_repo(tmp_path)
    terms = terms_file(tmp_path, "geheïmwort\n")
    (repo / "a.md").write_bytes("café GEHEÏMWORT".encode("cp1252"))
    git(repo, "add", "a.md")
    assert run(["--staged", "--terms", terms], repo).returncode == 1


def test_rename_detected(tmp_path):
    repo = make_repo(tmp_path)
    (repo / "ok.md").write_text(f"{TERM}\n", encoding="utf-8")
    commit_all(repo, "base")
    git(repo, "mv", "ok.md", "a.md")
    r = run(["--staged", "--terms", terms_file(tmp_path)], repo)
    assert r.returncode == 1 and "a.md" in r.stdout


def test_path_with_space_and_umlaut(tmp_path):
    repo = make_repo(tmp_path)
    (repo / "web").mkdir()
    (repo / "web" / "größe seite.pdf").write_bytes(b"%PDF")
    git(repo, "add", "-f", "-A")
    r = run(["--staged"], repo)
    assert r.returncode == 1
    assert "forbidden-extension" in r.stdout


def test_range_finds_leak_added_then_removed(tmp_path):
    repo = make_repo(tmp_path)
    terms = terms_file(tmp_path)
    (repo / "a.md").write_text("ok\n", encoding="utf-8")
    commit_all(repo, "base")
    (repo / "a.md").write_text(f"{TERM}\n", encoding="utf-8")
    commit_all(repo, "leak")
    (repo / "a.md").write_text("ok\n", encoding="utf-8")
    commit_all(repo, "fix")
    assert run(["--range", "HEAD~2..HEAD", "--terms", terms], repo).returncode == 1
    assert run(["--range", "HEAD~1..HEAD", "--terms", terms], repo).returncode == 0
    null = "0" * 40
    assert run(["--range", f"{null}..HEAD", "--terms", terms], repo).returncode == 1


def test_unreadable_file_fails_closed(tmp_path):
    repo = make_repo(tmp_path)
    f = repo / "b.md"
    f.write_text("x\n", encoding="utf-8")
    commit_all(repo, "base")
    f.unlink()
    f.mkdir()  # tracked file replaced by a directory: open() fails with an OSError
    r = run(["--tree"], repo)
    assert r.returncode == 1 and "unreadable" in r.stdout


def test_comment_lines_in_commit_msg_ignored(tmp_path):
    msg = tmp_path / "m"
    msg.write_text(f"feat: x\n# {TERM}\n", encoding="utf-8")
    assert run(["--commit-msg", str(msg), "--terms", terms_file(tmp_path)], tmp_path).returncode == 0


def test_missing_terms_file_exit_2(tmp_path):
    msg = tmp_path / "m"
    msg.write_text("x\n", encoding="utf-8")
    r = run(["--commit-msg", str(msg), "--terms", str(tmp_path / "nope.txt")], tmp_path)
    assert r.returncode == 2


def test_hooks_end_to_end(tmp_path):
    repo = make_repo(tmp_path)
    (repo / "tools").mkdir()
    shutil.copy(SCRIPT, repo / "tools" / "leakguard.py")
    r = subprocess.run([sys.executable, str(HOOKS), "--terms", terms_file(tmp_path)],
                       cwd=repo, capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    ident = ["-c", "user.name=T", "-c", "user.email=t@example.invalid"]

    def commit(msg):
        return subprocess.run(["git", *ident, "commit", "-m", msg], cwd=repo,
                              capture_output=True, text=True)

    (repo / "a.md").write_text(f"{TERM}\n", encoding="utf-8")
    subprocess.run(["git", "add", ".gitignore", "a.md"], cwd=repo, check=True)
    assert commit("add file").returncode != 0
    (repo / "a.md").write_text("clean\n", encoding="utf-8")
    subprocess.run(["git", "add", "a.md"], cwd=repo, check=True)
    assert commit(f"mentions {TERM}").returncode != 0
    assert commit("clean message").returncode == 0
