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
