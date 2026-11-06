"""tools/check.py: step plan, summary and exit code."""
import sys

import check


def names(steps):
    return [s.name for s in steps]


def test_step_order():
    steps = check.build_steps(check.parse_args([]))
    assert names(steps) == [
        "leakguard", "validate", "pytest", "sqltest", "web-build", "linkcheck",
        "web-test", "diagrams", "pdf", "anki-import", "anki",
    ]


def test_validate_no_min_unless_strict():
    def validate_cmd(argv):
        return next(s for s in check.build_steps(check.parse_args(argv)) if s.name == "validate").cmd

    assert "--no-min" in validate_cmd([])
    assert "--no-min" in validate_cmd(["--ci"])
    assert "--no-min" not in validate_cmd(["--ci", "--strict"])


def test_ci_mode_uses_local_fb_and_npm_ci():
    steps = {s.name: s for s in check.build_steps(check.parse_args(["--ci"]))}
    assert steps["sqltest"].cmd[-2:] == ["--fb-via", "local"]
    assert any(s.cmd == ["npm", "ci"] for s in check.build_steps(check.parse_args(["--ci"])))


def test_anki_after_diagrams_and_uses_them():
    steps = check.build_steps(check.parse_args([]))
    n = names(steps)
    assert n.index("diagrams") < n.index("anki")
    anki = steps[n.index("anki")].cmd
    assert "--diagrams" in anki and "dist/diagrams" in anki


def test_skip():
    steps = check.build_steps(check.parse_args(["--skip", "pdf", "--skip", "sqltest"]))
    assert "pdf" not in names(steps) and "sqltest" not in names(steps)


def test_run_reports_failure_and_continues(capsys):
    ok = check.Step("a", [sys.executable, "-c", "pass"])
    bad = check.Step("b", [sys.executable, "-c", "raise SystemExit(3)"])
    missing = check.Step("c", ["definitely-not-a-binary-xyz"])
    after = check.Step("d", [sys.executable, "-c", "pass"])
    rc = check.run_steps([ok, bad, missing, after])
    out = capsys.readouterr().out
    assert rc == 1
    assert "FAIL" in out and "b" in out and "c" in out
    assert out.count("PASS") == 2


def test_run_all_ok():
    assert check.run_steps([check.Step("a", [sys.executable, "-c", "pass"])]) == 0


def test_diagrams_before_pdf_and_anki():
    n = names(check.build_steps(check.parse_args([])))
    assert n.index("diagrams") < n.index("pdf") < n.index("anki")


def test_linkcheck_and_anki_import_steps():
    steps = {s.name: s for s in check.build_steps(check.parse_args([]))}
    assert "tools/linkcheck.py" in steps["linkcheck"].cmd
    assert steps["anki-import"].cmd[-1] == "tests/test_anki.py"
    assert steps["anki-import"].cmd[:3] == ["uv", "run", "pytest"]


def test_skip_web_install():
    n = names(check.build_steps(check.parse_args(["--ci", "--skip", "web-install"])))
    assert "web-install" not in n


def test_keyboard_interrupt_is_reported(monkeypatch, capsys):
    def boom(*a, **k):
        raise KeyboardInterrupt

    monkeypatch.setattr(check.subprocess, "run", boom)
    rc = check.run_steps([check.Step("a", [sys.executable, "-c", "pass"]), check.Step("b", [sys.executable, "-c", "pass"])])
    out = capsys.readouterr().out
    assert rc == 1 and "interrupted" in out and "summary" in out
