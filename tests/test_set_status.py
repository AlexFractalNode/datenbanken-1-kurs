import shutil
from pathlib import Path

import pytest
import set_status
import validate
import yaml

FIXTURE = Path(__file__).parent / "fixtures" / "content_ok"
TOPIC = "content/de/topics/t04-er-modellierung"


@pytest.fixture
def root(tmp_path):
    dst = tmp_path / "root"
    shutil.copytree(FIXTURE, dst)
    return dst


def _run(root, *args):
    return set_status.main([*args, "--root", str(root)])


def _y(root, rel):
    return yaml.safe_load((root / rel).read_text(encoding="utf-8"))


def test_add_review_sets_all_elements(root):
    assert _run(root, "t04", "--add-review", "aufgaben") == 0
    for f in ("cards", "quiz", "tasks", "sql-tasks"):
        for item in _y(root, f"{TOPIC}/{f}.yml"):
            assert "aufgaben" in item["reviews"], (f, item["id"])
    text = (root / TOPIC / "summary.md").read_text(encoding="utf-8")
    assert "reviews: [fach, aufgaben]" in text
    assert validate.run(root, min_totals=False) == []


def test_add_review_is_idempotent_and_keeps_other_content(root):
    before = (root / TOPIC / "cards.yml").read_text(encoding="utf-8")
    assert _run(root, "t04", "--add-review", "fach") == 0
    assert _run(root, "t04", "--add-review", "fach") == 0
    cards = _y(root, f"{TOPIC}/cards.yml")
    assert [c["reviews"] for c in cards] == [["fach", "leak"], ["fach"], ["fach"]]
    after = (root / TOPIC / "cards.yml").read_text(encoding="utf-8")
    assert "front: Platzhalter-Frage 3" in after and "diagram:" in after
    assert before.count("\n") == after.count("\n")


def test_block_style_reviews(root):
    rel = f"{TOPIC}/cards.yml"
    p = root / rel
    p.write_text(
        p.read_text(encoding="utf-8").replace(
            "reviews: [fach, leak]", "reviews:\n    - fach\n    - leak"
        ),
        encoding="utf-8",
    )
    assert _run(root, "t04", "--add-review", "aufgaben") == 0
    assert _y(root, rel)[0]["reviews"] == ["fach", "aufgaben", "leak"]


def test_promote_requires_reviews(root):
    assert _run(root, "t04", "--promote") == 1
    assert _y(root, f"{TOPIC}/cards.yml")[1]["status"] == "draft"
    assert _run(root, "t04", "--add-review", "fach", "--promote") == 1
    assert _y(root, f"{TOPIC}/cards.yml")[1]["reviews"] == []  # failure writes nothing
    assert _run(root, "t04", "--add-review", "fach") == 0
    assert _run(root, "t04", "--add-review", "leak") == 0
    assert _run(root, "t04", "--promote") == 1  # aufgaben missing
    assert _y(root, f"{TOPIC}/cards.yml")[1]["status"] == "draft"
    assert _run(root, "t04", "--add-review", "aufgaben", "--promote") == 0
    for f in ("cards", "quiz", "tasks", "sql-tasks"):
        assert all(i["status"] == "reviewed" for i in _y(root, f"{TOPIC}/{f}.yml"))
    assert "status: reviewed" in (root / TOPIC / "summary.md").read_text(encoding="utf-8")
    assert validate.run(root, min_totals=False) == []


def test_exam_scope(root):
    rel = "content/de/exams/exam-01.yml"
    assert _run(root, "e01", "--add-review", "fach") == 0
    assert all(t["reviews"] == ["fach"] for t in _y(root, rel)["tasks"])
    assert _run(root, "exam-01", "--add-review", "leak") == 0
    assert _run(root, "e01", "--promote") == 1  # aufgaben missing
    assert _run(root, "e01", "--add-review", "aufgaben", "--promote") == 0
    assert all(t["status"] == "reviewed" for t in _y(root, rel)["tasks"])
    assert validate.run(root, min_totals=False) == []


def test_unknown_scope_and_stage(root):
    assert _run(root, "t09", "--add-review", "fach") == 2
    with pytest.raises(SystemExit):
        _run(root, "t04", "--add-review", "bogus")
    assert _run(root, "t04") == 2
