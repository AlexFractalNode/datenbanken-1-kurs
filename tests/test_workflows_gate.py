"""Deploy gate (no Playwright smoke) and the stable dist/pdf + dist/anki artifact layout."""
import re
from pathlib import Path

import yaml

WF = Path(__file__).resolve().parent.parent / ".github" / "workflows"
ROOT = WF.parent.parent


def load(name):
    data = yaml.safe_load((WF / name).read_text(encoding="utf-8"))
    data["on"] = data.pop(True, data.get("on"))  # YAML 1.1 parses `on` as True
    return data


def uses(job, action):
    return [s for s in job.get("steps", []) if s.get("uses", "").startswith(action + "@")]


def test_ci_has_run_smoke_input_default_true():
    inp = load("ci.yml")["on"]["workflow_call"]["inputs"]["run_smoke"]
    assert inp["type"] == "boolean"
    assert inp["default"] is True


def test_smoke_skipped_only_for_explicit_false():
    ci = load("ci.yml")
    assert "push" in ci["on"] and "pull_request" in ci["on"]
    # Outside workflow_call inputs.run_smoke is null, and null == false in expressions: compare the JSON text.
    assert ci["jobs"]["smoke"]["if"] == "${{ toJSON(inputs.run_smoke) != 'false' }}"


def test_deploy_calls_ci_without_smoke():
    checks = load("deploy.yml")["jobs"]["checks"]
    assert checks["uses"] == "./.github/workflows/ci.yml"
    assert checks["with"] == {"run_smoke": False}
    d = load("deploy.yml")
    for name in ("build", "release"):
        needs = d["jobs"][name]["needs"]
        needs = [needs] if isinstance(needs, str) else needs
        assert "smoke" not in needs


def test_check_ci_produces_default_dist_folders():
    check = (ROOT / "tools" / "check.py").read_text(encoding="utf-8")
    assert 'Step("pdf", [*py, "tools/pdf.py"' in check
    assert 'Step("anki", [*py, "tools/anki_export.py"' in check
    assert 'default="dist/pdf"' in (ROOT / "tools" / "pdf.py").read_text(encoding="utf-8")
    assert 'default="dist/anki"' in (ROOT / "tools" / "anki_export.py").read_text(encoding="utf-8")


def test_ci_uploads_two_artifacts_one_path_each():
    ups = uses(load("ci.yml")["jobs"]["checks"], "actions/upload-artifact")
    assert [(s["with"]["name"], s["with"]["path"], s["if"]) for s in ups] == [
        ("pdf", "dist/pdf", "always()"),
        ("anki", "dist/anki", "always()"),
    ]


def test_deploy_downloads_into_fixed_folders_and_checks():
    steps = load("deploy.yml")["jobs"]["build"]["steps"]
    downs = uses({"steps": steps}, "actions/download-artifact")
    assert [(s["with"]["name"], s["with"]["path"], s.get("continue-on-error")) for s in downs] == [
        ("pdf", "dist/pdf", True),
        ("anki", "dist/anki", True),
    ]
    idx = [i for i, s in enumerate(steps) if "dist/pdf/*.pdf" in s.get("run", "")]
    assert len(idx) == 1
    check = steps[idx[0]]
    assert steps.index(downs[1]) < idx[0] < [i for i, s in enumerate(steps) if s.get("name") == "Build site"][0]
    run = check["run"]
    assert "dist/anki/*.apkg" in run
    assert "::warning::" in run and "::error::" in run and "exit 1" in run
    assert "refs/tags/" in run
    # the error branch (tag) must exit 1, the warning branch (main) must not
    err = run.index("::error::")
    warn = run.index("::warning::")
    assert "exit 1" in run[err:warn]
    assert "exit 1" not in run[warn:]
    assert not re.search(r"secrets\.", run)
