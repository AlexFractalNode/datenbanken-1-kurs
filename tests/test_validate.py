import shutil
from pathlib import Path

import pytest
import validate
import yaml

FIXTURE = Path(__file__).parent / "fixtures" / "content_ok"
TOPIC = "content/de/topics/t04-er-modellierung"


@pytest.fixture
def root(tmp_path):
    dst = tmp_path / "root"
    shutil.copytree(FIXTURE, dst)
    return dst


def _load(root, rel):
    return yaml.safe_load((root / rel).read_text(encoding="utf-8"))


def _dump(root, rel, data):
    (root / rel).write_text(
        yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8"
    )


def _errs(root, min_totals=False):
    return validate.run(root, min_totals=min_totals)


def _has(errs, needle):
    return any(needle in e for e in errs)


def test_ok_fixture_valid():
    assert validate.run(FIXTURE, min_totals=False) == []


def test_duplicate_id(root):
    rel = f"{TOPIC}/cards.yml"
    cards = _load(root, rel)
    cards[1]["id"] = "t04-c001"
    _dump(root, rel, cards)
    assert _has(_errs(root), "duplicate id t04-c001")


def test_id_prefix_mismatch(root):
    rel = f"{TOPIC}/cards.yml"
    cards = _load(root, rel)
    cards[0]["id"] = "t05-c001"
    _dump(root, rel, cards)
    assert _has(_errs(root), "t05-c001")
    assert _has(_errs(root), "prefix")


def test_rubric_sum_mismatch(root):
    rel = f"{TOPIC}/tasks.yml"
    tasks = _load(root, rel)
    tasks[0]["rubric"][0]["points"] = 3
    _dump(root, rel, tasks)
    assert _has(_errs(root), "rubric")


def test_unknown_source_id(root):
    rel = f"{TOPIC}/cards.yml"
    cards = _load(root, rel)
    cards[0]["sources"] = [{"id": "does-not-exist", "ref": "x"}]
    _dump(root, rel, cards)
    assert _has(_errs(root), "unknown source id does-not-exist")


def test_further_reading_not_allowed_as_source(root):
    srcs = _load(root, "sources.yml")
    srcs[1]["kind"] = "further-reading"
    _dump(root, "sources.yml", srcs)
    # t04-c003 cites placeholder-oer, now further-reading
    assert _has(_errs(root), "further-reading")


def test_missing_status(root):
    rel = f"{TOPIC}/cards.yml"
    cards = _load(root, rel)
    del cards[0]["status"]
    _dump(root, rel, cards)
    assert _has(_errs(root), "status")


def test_sql_pg_solution_required_when_first_skip(root):
    rel = f"{TOPIC}/sql-tasks.yml"
    sql = _load(root, rel)
    del sql[0]["solution_pg"]
    _dump(root, rel, sql)
    assert _has(_errs(root), "solution_pg")
    sql[0]["engines"] = ["fb"]
    _dump(root, rel, sql)
    assert _errs(root) == []


def test_exam_points_and_minutes(root):
    rel = "content/de/exams/exam-01.yml"
    exam = _load(root, rel)
    exam["tasks"][1]["minutes"] = 55  # 40 + 55 > 90
    _dump(root, rel, exam)
    errs = _errs(root)
    assert _has(errs, "minutes")
    exam["tasks"][1]["minutes"] = 45
    exam["tasks"][1]["points"] = 30
    exam["tasks"][1]["rubric"][0]["points"] = 30
    _dump(root, rel, exam)
    assert _has(_errs(root), "points")


def test_en_parity_requires_pending_marker(root):
    en = root / "content/en/topics/t04-er-modellierung"
    en.mkdir(parents=True)
    summary = (
        "---\nid: t04\nlang: en\ntitle: Placeholder topic 4\norder: 4\nstatus: draft\n"
        "reviews: []\nsources:\n  - id: placeholder-docs\n    ref: chapter 1\n{extra}---\n\nText.\n"
    )
    (en / "summary.md").write_text(summary.format(extra=""), encoding="utf-8")
    assert _has(_errs(root), "translation: pending")
    (en / "summary.md").write_text(
        summary.format(extra="translation: pending\n"), encoding="utf-8"
    )
    assert _errs(root) == []


def test_min_totals(root):
    assert _errs(root, min_totals=False) == []
    errs = _errs(root, min_totals=True)
    assert _has(errs, "cards")
    assert _has(errs, "quiz")
    assert _has(errs, "exams")


def test_missing_sources_file(root):
    (root / "sources.yml").unlink()
    assert _has(_errs(root), "sources.yml")


def test_cli_exit_codes(root):
    assert validate.main(["--root", str(root), "--no-min"]) == 0
    (root / "sources.yml").unlink()
    assert validate.main(["--root", str(root), "--no-min"]) == 1
