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
    assert [c["reviews"] for c in cards] == [["fach", "aufgaben", "leak"], ["fach"], ["fach"]]
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


def _add_en(root):
    en = root / "content/en/topics/t04-er-modellierung"
    en.mkdir(parents=True)
    (en / "summary.md").write_text(
        "---\nid: t04\nlang: en\ntitle: x\norder: 4\nstatus: draft\nreviews: []\n"
        "sources:\n  - id: placeholder-docs\n    ref: r\ntranslation: pending\n---\n\nText\n",
        encoding="utf-8",
    )
    (en / "cards.yml").write_text(
        "- id: t04-c001\n  status: draft\n  reviews: []\n  front: f\n  back: b\n", encoding="utf-8"
    )
    return en


def test_add_review_en_touches_only_en(root):
    en = _add_en(root)
    assert _run(root, "t04", "--add-review", "en") == 0
    assert _y(root, "content/en/topics/t04-er-modellierung/cards.yml")[0]["reviews"] == ["en"]
    assert "reviews: [en]" in (en / "summary.md").read_text(encoding="utf-8")
    assert all("en" not in c["reviews"] for c in _y(root, f"{TOPIC}/cards.yml"))


def test_add_review_en_with_promote_keeps_en_review(root):
    _add_en(root)
    for stage in ("fach", "leak", "aufgaben"):
        assert _run(root, "t04", "--add-review", stage) == 0
    assert _run(root, "t04", "--add-review", "en", "--promote") == 0
    assert _y(root, "content/en/topics/t04-er-modellierung/cards.yml")[0]["reviews"] == ["en"]
    assert all(c["status"] == "reviewed" for c in _y(root, f"{TOPIC}/cards.yml"))
    assert all("en" not in c["reviews"] for c in _y(root, f"{TOPIC}/cards.yml"))


def test_add_review_en_without_en_files(root):
    assert _run(root, "t04", "--add-review", "en") == 2


def test_topic_without_tasks_needs_only_fach_leak(root):
    (root / TOPIC / "tasks.yml").unlink()
    (root / TOPIC / "sql-tasks.yml").unlink()
    assert _run(root, "t04", "--add-review", "fach") == 0
    assert _run(root, "t04", "--add-review", "leak") == 0
    assert _run(root, "t04", "--promote") == 0
    assert all(c["status"] == "reviewed" for c in _y(root, f"{TOPIC}/cards.yml"))
    assert validate.run(root, min_totals=False) == []


def test_inline_comments_preserved(root):
    p = root / TOPIC / "cards.yml"
    p.write_text(
        p.read_text(encoding="utf-8")
        .replace("reviews: [fach, aufgaben, leak]", "reviews: [fach, leak]  # keep me", 1)
        .replace("status: reviewed", "status: reviewed  # and me", 1),
        encoding="utf-8",
    )
    for s in ("fach", "leak", "aufgaben"):
        assert _run(root, "t04", "--add-review", s) == 0
    text = p.read_text(encoding="utf-8")
    assert "reviews: [fach, aufgaben, leak]  # keep me" in text
    assert "status: reviewed  # and me" in text
