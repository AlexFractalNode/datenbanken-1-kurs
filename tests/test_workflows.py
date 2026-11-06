"""Workflow files parse and contain the required structure; changelog extraction."""
from pathlib import Path

import yaml

import changelog_extract

WF = Path(__file__).resolve().parent.parent / ".github" / "workflows"


def load(name):
    data = yaml.safe_load((WF / name).read_text(encoding="utf-8"))
    data["on"] = data.pop(True, data.get("on"))  # YAML 1.1 parses `on` as True
    return data


def test_ci_jobs():
    ci = load("ci.yml")
    assert {"checks", "smoke"} <= set(ci["jobs"])
    checks = ci["jobs"]["checks"]
    assert checks["services"]["firebird"]["image"] == "firebirdsql/firebird:3.0.14"
    assert checks["env"]["SQLTEST_REQUIRE_FB"] == "1"
    text = (WF / "ci.yml").read_text(encoding="utf-8")
    assert "UV_NATIVE_TLS" not in text
    assert "libfbclient2" in text
    assert ci["jobs"]["smoke"]["if"] is False


def test_deploy_triggers_and_steps():
    d = load("deploy.yml")
    assert d["on"]["push"]["branches"] == ["main"]
    assert d["on"]["push"]["tags"] == ["v*"]
    uses = [s.get("uses", "") for j in d["jobs"].values() for s in j.get("steps", [])]
    assert any(u.startswith("actions/upload-pages-artifact") for u in uses)
    assert any(u.startswith("softprops/action-gh-release") for u in uses)
    assert d["jobs"]["deploy"]["steps"][0]["uses"].startswith("actions/deploy-pages")
    assert "refs/tags/v" in d["jobs"]["release"]["if"]


def test_changelog_section():
    text = "# Changelog\n\n## [Unreleased]\n\n- x\n\n## [1.0.0] - 2026-01-01\n\n- a\n- b\n\n## [0.9.0]\n\n- old\n"
    assert changelog_extract.extract(text, "v1.0.0") == "- a\n- b"
    assert changelog_extract.extract(text, "v2.0.0") is None


def test_changelog_missing_section_exit_1(tmp_path, capsys):
    cl = tmp_path / "CHANGELOG.md"
    cl.write_text("# Changelog\n\n## [1.0.0]\n\n- a\n", encoding="utf-8")
    assert changelog_extract.main(["v2.0.0", "--changelog", str(cl)]) == 1
    assert changelog_extract.main(["v1.0.0", "--changelog", str(cl), "--out", str(tmp_path / "n.md")]) == 0
    assert (tmp_path / "n.md").read_text(encoding="utf-8") == "- a\n"


def _steps(wf, job):
    return wf["jobs"][job].get("steps", [])


def test_actions_pinned_to_sha():
    import re

    for name in ("ci.yml", "deploy.yml"):
        text = (WF / name).read_text(encoding="utf-8")
        for line in text.splitlines():
            m = re.search(r"uses:\s*(\S+)", line)
            if not m or m.group(1).startswith("./"):
                continue
            assert re.fullmatch(r"[\w./-]+@[0-9a-f]{40}", m.group(1)), f"{name}: {line.strip()}"
            assert re.search(r"#\s*v\d", line), f"{name}: missing version comment: {line.strip()}"


def test_dependabot_github_actions():
    d = yaml.safe_load((WF.parent / "dependabot.yml").read_text(encoding="utf-8"))
    assert d["version"] == 2
    assert any(u["package-ecosystem"] == "github-actions" for u in d["updates"])


def test_ci_leakguard_range_and_history_fallback():
    text = (WF / "ci.yml").read_text(encoding="utf-8")
    assert "github.base_ref" in text and "github.event.before" in text
    assert "--range" in text and "--history" in text
    assert "0000000000000000000000000000000000000000" in text


def test_ci_is_reusable_with_unique_concurrency():
    ci = load("ci.yml")
    assert "workflow_call" in ci["on"]
    assert "github.workflow" in ci["concurrency"]["group"]


def test_deploy_gated_by_checks_and_main_only():
    d = load("deploy.yml")
    assert d["jobs"]["checks"]["uses"] == "./.github/workflows/ci.yml"
    assert d["jobs"]["build"]["needs"] == "checks"
    assert d["jobs"]["deploy"]["if"] == "github.ref == 'refs/heads/main'"
    runs = " ".join(s.get("run", "") for s in _steps(d, "release"))
    assert "tools/validate.py" in runs


def test_typst_cache_independent_of_uv_lock_and_in_release():
    ci_text = (WF / "ci.yml").read_text(encoding="utf-8")
    d_text = (WF / "deploy.yml").read_text(encoding="utf-8")
    for t in (ci_text, d_text):
        assert "typst-${{ runner.os }}" in t
        assert "hashFiles('tools/typst/**', 'tools/pdf.py')" in t


def test_smoke_caches_playwright():
    assert "ms-playwright" in (WF / "ci.yml").read_text(encoding="utf-8")


def test_workflow_validate_commands_parse_with_real_parser():
    import shlex

    import validate

    found = 0
    for name in ("ci.yml", "deploy.yml"):
        wf = load(name)
        for job in wf["jobs"].values():
            for step in job.get("steps", []):
                for line in step.get("run", "").splitlines():
                    if "tools/validate.py" not in line:
                        continue
                    args = shlex.split(line)
                    args = args[args.index("tools/validate.py") + 1 :]
                    validate.build_parser().parse_args(args)  # SystemExit(2) on unknown flags
                    found += 1
    assert found >= 1
    # the release gate must run the full mode (no --no-min)
    release = " ".join(s.get("run", "") for s in load("deploy.yml")["jobs"]["release"]["steps"])
    assert "--no-min" not in release
