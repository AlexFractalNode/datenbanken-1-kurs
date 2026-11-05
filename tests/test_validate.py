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


EN_SUMMARY = (
    "---\nid: t04\nlang: en\ntitle: Placeholder topic 4\norder: 4\nstatus: draft\n"
    "reviews: []\nsources:\n  - id: placeholder-docs\n    ref: chapter 1\n{extra}---\n\nText.\n"
)


def _add_en(root, topic_pending=True, exam=True, exam_pending=True):
    en = root / "content/en/topics/t04-er-modellierung"
    en.mkdir(parents=True, exist_ok=True)
    extra = "translation: pending\n" if topic_pending else ""
    (en / "summary.md").write_text(EN_SUMMARY.format(extra=extra), encoding="utf-8")
    if exam:
        ex = root / "content/en/exams"
        ex.mkdir(parents=True, exist_ok=True)
        pend = "translation: pending\n" if exam_pending else ""
        (ex / "exam-01.yml").write_text(
            f"title: Placeholder exam\nminutes: 90\n{pend}tasks: []\n", encoding="utf-8"
        )


def test_no_en_dir_is_ok(root):
    assert not (root / "content/en").exists()
    assert _errs(root) == []


def test_en_parity_requires_pending_marker(root):
    _add_en(root, topic_pending=False)
    assert _has(_errs(root), "translation: pending")
    _add_en(root, topic_pending=True)
    assert _errs(root) == []


def test_en_dir_requires_counterparts(root):
    (root / "content/en").mkdir()
    errs = _errs(root)
    assert _has(errs, "topic t04") and _has(errs, "no EN counterpart")
    assert _has(errs, "exam e01")
    _add_en(root, exam=False)
    errs = _errs(root)
    assert _has(errs, "exam e01") and not _has(errs, "topic t04")
    _add_en(root)
    assert _errs(root) == []


def test_en_exam_incomplete_requires_pending(root):
    _add_en(root, exam_pending=False)
    assert _has(_errs(root), "EN exam is incomplete")


def test_en_exam_tasks_not_a_list_is_error_not_crash(root):
    _add_en(root)
    (root / "content/en/exams/exam-01.yml").write_text(
        "title: x\nminutes: 90\ntranslation: pending\ntasks: nope\n", encoding="utf-8"
    )
    assert _has(_errs(root), "tasks")


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


# --- schema hardness -------------------------------------------------------


def _mutate(root, rel, fn):
    data = _load(root, rel)
    fn(data)
    _dump(root, rel, data)


def test_missing_status_message(root):
    _mutate(root, f"{TOPIC}/cards.yml", lambda d: d[0].pop("status"))
    assert _has(_errs(root), "'status' is a required property")


def test_missing_id(root):
    _mutate(root, f"{TOPIC}/cards.yml", lambda d: d[0].pop("id"))
    assert _has(_errs(root), "'id' is a required property")


def test_empty_rubric(root):
    _mutate(root, f"{TOPIC}/tasks.yml", lambda d: d[0].update(rubric=[]))
    assert _has(_errs(root), "rubric")


def test_points_zero(root):
    _mutate(root, f"{TOPIC}/tasks.yml", lambda d: d[0].update(points=0))
    assert _has(_errs(root), "points")


def test_cards_as_mapping(root):
    (root / TOPIC / "cards.yml").write_text("id: t04-c001\n", encoding="utf-8")
    assert _has(_errs(root), "is not of type 'array'")


def test_quiz_one_option(root):
    _mutate(root, f"{TOPIC}/quiz.yml", lambda d: d[0].update(options=d[0]["options"][:1]))
    assert _has(_errs(root), "options")


def test_single_with_two_correct(root):
    def f(d):
        d[0]["options"][1]["correct"] = True

    _mutate(root, f"{TOPIC}/quiz.yml", f)
    assert _has(_errs(root), "exactly 1 correct")


def test_unknown_sql_ref(root):
    _mutate(root, f"{TOPIC}/tasks.yml", lambda d: d[1].update(sql_ref="t04-s099"))
    assert _has(_errs(root), "sql_ref t04-s099 does not exist")


def test_duplicate_topic_id(root):
    _mutate(root, "content/topics.yml", lambda d: d.append(dict(d[1], order=9)))
    assert _has(_errs(root), "duplicate topic id t04")


def test_broken_yaml_does_not_raise(root):
    import content

    (root / TOPIC / "cards.yml").write_text("a: [\n", encoding="utf-8")
    c = content.load_all(root)
    assert any("cards.yml" in e for e in c.errors)
    assert _has(_errs(root), "cards.yml")


def test_empty_error_message_yaml_error_does_not_raise(root):
    import content

    (root / TOPIC / "summary.md").write_bytes(b"\xff\xfe---\n")
    c = content.load_all(root)
    assert c.errors


def test_duplicate_yaml_key(root):
    p = root / TOPIC / "cards.yml"
    p.write_text(
        p.read_text(encoding="utf-8").replace("  back: Platzhalter-Antwort 1\n", "  back: a\n  back: b\n", 1),
        encoding="utf-8",
    )
    assert _has(_errs(root), "duplicate key")


def test_summary_requires_sources(root):
    p = root / TOPIC / "summary.md"
    t = p.read_text(encoding="utf-8").replace(
        "sources:\n  - id: placeholder-docs\n    ref: Kapitel 1\n", "sources: []\n"
    )
    p.write_text(t, encoding="utf-8")
    assert _has(_errs(root), "sources")


def test_accessed_must_be_real_date(root):
    _mutate(root, "sources.yml", lambda d: d[0].update(accessed="2026-02-30"))
    assert _has(_errs(root), "accessed")


# --- status / reviews consistency -----------------------------------------


def test_reviewed_requires_reviews(root):
    def f(d):
        d[1]["status"] = "reviewed"
        d[1]["reviews"] = ["fach", "leak"]  # topic has tasks -> aufgaben needed

    _mutate(root, f"{TOPIC}/cards.yml", f)
    errs = _errs(root)
    assert _has(errs, "t04-c002") and _has(errs, "aufgaben")
    _mutate(root, f"{TOPIC}/cards.yml", lambda d: d[1].update(reviews=["fach", "aufgaben", "leak"]))
    assert _errs(root) == []


def test_reviewed_summary_requires_reviews(root):
    p = root / TOPIC / "summary.md"
    p.write_text(p.read_text(encoding="utf-8").replace("status: draft", "status: verified"), encoding="utf-8")
    errs = _errs(root)
    assert _has(errs, "summary.md") and _has(errs, "leak")


def test_reviewed_exam_task_requires_aufgaben(root):
    def f(d):
        d["tasks"][0]["status"] = "reviewed"
        d["tasks"][0]["reviews"] = ["fach", "leak"]

    _mutate(root, "content/de/exams/exam-01.yml", f)
    assert _has(_errs(root), "e01-p001") and _has(_errs(root), "aufgaben")


def test_topic_without_tasks_needs_only_fach_leak(root):
    (root / TOPIC / "tasks.yml").unlink()
    (root / TOPIC / "sql-tasks.yml").unlink()

    def f(d):
        d[1]["status"] = "reviewed"
        d[1]["reviews"] = ["fach", "leak"]

    _mutate(root, f"{TOPIC}/cards.yml", f)
    assert _errs(root) == []


# --- structure -------------------------------------------------------------


def test_unknown_file_in_topic_dir(root):
    (root / TOPIC / "notes.txt").write_text("x", encoding="utf-8")
    assert _has(_errs(root), "notes.txt")


def test_diagrams_allowed(root):
    d = root / TOPIC / "diagrams"
    d.mkdir()
    (d / "a.dot").write_text("digraph{}", encoding="utf-8")
    (d / "a.svg").write_text("<svg/>", encoding="utf-8")
    assert _errs(root) == []
    (d / "a.exe").write_text("x", encoding="utf-8")
    assert _has(_errs(root), "a.exe")


def test_topic_without_folder_error_in_full_mode_warning_otherwise(root, capsys):
    errs = _errs(root, min_totals=True)
    assert _has(errs, "t01") and _has(errs, "no folder")
    assert not _has(_errs(root, min_totals=False), "t01")
    assert validate.main(["--root", str(root), "--no-min"]) == 0
    assert "warning" in capsys.readouterr().err


def _sql_err(root, solution, **kw):
    def f(d):
        d[0]["solution"] = solution
        d[0].pop("solution_pg", None)
        d[0].update(kw)

    _mutate(root, f"{TOPIC}/sql-tasks.yml", f)
    return _errs(root)


@pytest.mark.parametrize(
    "sol",
    [
        "SELECT * FROM t ROWS 3",
        "EXECUTE BLOCK AS BEGIN END",
        "SET TERM ^ ;",
        "SELECT FIRST :n * FROM t",
    ],
)
def test_more_firebird_syntax_detected(root, sol):
    assert _has(_sql_err(root, sol), "solution_pg")


def test_standard_fetch_first_not_flagged(root):
    assert _sql_err(root, "SELECT * FROM t FETCH FIRST 3 ROWS ONLY") == []


def test_solution_pg_without_pg_engine(root):
    errs = _sql_err(root, "SELECT 1 FROM t", engines=["fb"], solution_pg="SELECT 1 FROM t")
    assert _has(errs, "solution_pg")


# --- pitfalls.md -----------------------------------------------------------


def test_pitfalls_plain_markdown_ok(root):
    import content

    (root / TOPIC / "pitfalls.md").write_text("- Platzhalter-Fehler\n", encoding="utf-8")
    assert _errs(root) == []
    meta, body = content.load_all(root).pitfalls["t04"]
    assert meta is None and "Platzhalter-Fehler" in body


def test_pitfalls_frontmatter_ok_and_loaded(root):
    import content

    (root / TOPIC / "pitfalls.md").write_text(
        "---\nid: t04-pitfalls\nlang: de\nstatus: draft\nreviews: []\n---\n\n- x\n", encoding="utf-8"
    )
    assert _errs(root) == []
    meta, body = content.load_all(root).pitfalls["t04"]
    assert meta["id"] == "t04-pitfalls" and body.strip() == "- x"


def test_pitfalls_frontmatter_id_mismatch(root):
    (root / TOPIC / "pitfalls.md").write_text("---\nid: t05-pitfalls\n---\n\n- x\n", encoding="utf-8")
    assert _has(_errs(root), "pitfalls")


def test_pitfalls_reviewed_requires_reviews(root):
    (root / TOPIC / "pitfalls.md").write_text(
        "---\nid: t04-pitfalls\nstatus: reviewed\nreviews: [fach]\n---\n\n- x\n", encoding="utf-8"
    )
    assert _has(_errs(root), "pitfalls.md") and _has(_errs(root), "leak")


# --- round 2 ---------------------------------------------------------------


def test_de_exam_translation_pending_is_error_and_budget_still_checked(root):
    def f(d):
        d["translation"] = "pending"
        d["tasks"][1]["minutes"] = 70

    _mutate(root, "content/de/exams/exam-01.yml", f)
    errs = _errs(root)
    assert _has(errs, "translation is only allowed in EN")
    assert _has(errs, "minutes")


def test_rows_window_frame_not_flagged(root):
    assert _sql_err(root, "SELECT SUM(x) OVER (ORDER BY y ROWS 2 PRECEDING) FROM t") == []
    assert _sql_err(root, "SELECT SUM(x) OVER (ORDER BY y ROWS 1 FOLLOWING) FROM t") == []
    assert _sql_err(root, "SELECT SUM(x) OVER (ORDER BY y ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) FROM t") == []
    assert _has(_sql_err(root, "SELECT * FROM t ROWS 2 TO 5"), "solution_pg")


@pytest.mark.parametrize("name", [".gitkeep", "Thumbs.db", ".DS_Store"])
def test_ignorable_files_in_topic_dir(root, name):
    (root / TOPIC / name).write_text("", encoding="utf-8")
    assert _errs(root) == []
