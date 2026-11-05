import json
import os
import shutil
from pathlib import Path

import pytest

import sqltest
from fb_runner import split_sql

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "sql"
CONTENT = FIXTURES / "content"
DB_DIR = FIXTURES / "db"


def fb_or_skip():
    """Skip Firebird tests when no server is reachable (CI sets SQLTEST_REQUIRE_FB=1)."""
    ok, reason = sqltest.fb_available()
    if not ok:
        if os.environ.get("SQLTEST_REQUIRE_FB") == "1":
            pytest.fail(f"Firebird required but not available: {reason}")
        pytest.skip(f"Firebird not available: {reason}")


def run(*args):
    return sqltest.main(["--content", str(CONTENT), "--db-dir", str(DB_DIR), *args])


# --- statement splitter -------------------------------------------------------


def test_split_sql_basic_and_comments():
    script = """
    -- comment; with semicolon
    CREATE TABLE a (x INTEGER); /* block; comment */
    INSERT INTO a VALUES (1);
    SELECT 'x;y', "odd;name" FROM a
    """
    assert split_sql(script) == [
        "CREATE TABLE a (x INTEGER)",
        "INSERT INTO a VALUES (1)",
        "SELECT 'x;y', \"odd;name\" FROM a",
    ]


def test_split_sql_escaped_quote():
    assert split_sql("SELECT 'it''s; fine' FROM r;  ;") == ["SELECT 'it''s; fine' FROM r"]


def test_split_sql_set_term():
    script = """SET TERM ^ ;
    CREATE TRIGGER t FOR a BEFORE INSERT AS BEGIN NEW.x = 1; END^
    SET TERM ; ^
    SELECT 1 FROM RDB$DATABASE;"""
    assert split_sql(script) == [
        "CREATE TRIGGER t FOR a BEFORE INSERT AS BEGIN NEW.x = 1; END",
        "SELECT 1 FROM RDB$DATABASE",
    ]


# --- task loading ---------------------------------------------------------------


def test_load_tasks_and_topic_filter():
    tasks = sqltest.load_tasks(CONTENT)
    assert [t.id for t in tasks] == ["t01-s001", "t01-s002", "t01-s003"]
    t2 = tasks[1]
    assert t2.engines == ["fb", "pg"]
    assert t2.sql_for("fb").startswith("SELECT FIRST 2")
    assert t2.sql_for("pg").endswith("LIMIT 2")
    assert tasks[0].ordered is True and t2.ordered is False
    assert sqltest.load_tasks(CONTENT, topic="t01") == tasks
    assert sqltest.load_tasks(CONTENT, topic="t02") == []


def test_invalid_task_is_reported(tmp_path):
    d = tmp_path / "t01-x"
    d.mkdir()
    (d / "sql-tasks.yml").write_text("- id: t01-s001\n  db: demo\n  kind: select\n  solution: SELECT 1\n", encoding="utf-8")
    with pytest.raises(sqltest.TaskError, match="kind"):
        sqltest.load_tasks(tmp_path)


def test_transaction_control_rejected(tmp_path):
    d = tmp_path / "t01-x"
    d.mkdir()
    (d / "sql-tasks.yml").write_text(
        "- id: t01-s001\n  db: demo\n  kind: dml\n  solution: DELETE FROM artikel; COMMIT\n", encoding="utf-8"
    )
    with pytest.raises(sqltest.TaskError, match="COMMIT"):
        sqltest.load_tasks(tmp_path)


# --- PGlite ----------------------------------------------------------------------


def test_fixture_green_on_pg(tmp_path, capsys):
    snaps = tmp_path / "snap"
    assert run("--engines", "pg", "--write-snapshots", str(snaps)) == 0
    data = json.loads((snaps / "t01.json").read_text(encoding="utf-8"))
    assert set(data) == {"t01-s001", "t01-s002", "t01-s003"}
    assert data["t01-s001"] == {
        "cols": ["kuerzel", "preis", "angelegt"],
        "rows": [
            ["BBB", 10, "2024-02-01"],
            ["CCC", 7.25, "2024-02-20"],
            ["DDD", 7.25, "2024-03-05"],
            ["AAA", 2.5, "2024-01-15"],
        ],
        "ordered": True,
    }
    assert sorted(data["t01-s002"]["rows"]) == [["Platzhalter Beta"], ["Platzhalter Gamma"]]
    # dml: check sees the uncommitted changes, identity continues after the seed
    assert sorted(data["t01-s003"]["rows"]) == [[1, "AAA", 5], [5, "EEE", 1]]
    assert data["t01-s003"]["ordered"] is False
    assert "3 passed" in capsys.readouterr().out


def test_dml_is_rolled_back_between_jobs():
    batch = {
        "setup": sqltest.setup_scripts(DB_DIR, "demo", "pg"),
        "jobs": [
            {"id": "a", "kind": "dml", "sql": "DELETE FROM artikel", "check": "SELECT COUNT(*) FROM artikel"},
            {"id": "b", "kind": "query", "sql": "SELECT COUNT(*) FROM artikel"},
            {"id": "c", "kind": "ddl", "sql": "ALTER TABLE artikel ADD lager INTEGER", "check": "SELECT lager FROM artikel WHERE artikel_id = 1"},
            {"id": "d", "kind": "query", "sql": "SELECT column_name FROM information_schema.columns WHERE column_name = 'lager'"},
        ],
    }
    res = sqltest.run_engine("pg", batch)["results"]
    assert res["a"]["rows"] == [[0]]
    assert res["b"]["rows"] == [[4]]
    assert res["c"] == {"cols": ["lager"], "rows": [[None]], "error": None}
    assert res["d"]["rows"] == []


def test_sql_error_exits_1(tmp_path, capsys):
    content = tmp_path / "content"
    shutil.copytree(CONTENT, content)
    yml = content / "t01-demo" / "sql-tasks.yml"
    yml.write_text(yml.read_text(encoding="utf-8").replace("FROM artikel\n    ORDER BY", "FROM artikle\n    ORDER BY"), encoding="utf-8")
    snaps = tmp_path / "snap"
    rc = sqltest.main(["--engines", "pg", "--content", str(content), "--db-dir", str(DB_DIR), "--write-snapshots", str(snaps)])
    assert rc == 1
    out = capsys.readouterr().out
    assert "FAIL t01-s001" in out and "artikle" in out
    assert not snaps.exists()  # no snapshots from a failing run


def test_setup_error_exits_1(tmp_path):
    db = tmp_path / "db"
    shutil.copytree(DB_DIR, db)
    (db / "demo" / "seed.sql").write_text("INSERT INTO nope VALUES (1);", encoding="utf-8")
    assert sqltest.main(["--engines", "pg", "--content", str(CONTENT), "--db-dir", str(db)]) == 1


def test_no_tasks_is_ok(tmp_path, capsys):
    assert sqltest.main(["--engines", "pg", "--content", str(tmp_path), "--db-dir", str(DB_DIR)]) == 0
    assert "no SQL tasks" in capsys.readouterr().out


# --- Firebird --------------------------------------------------------------------


@pytest.mark.firebird
def test_fixture_green_on_fb_and_pg(tmp_path, capsys):
    fb_or_skip()
    assert run("--engines", "fb,pg", "--write-snapshots", str(tmp_path)) == 0
    assert "3 passed" in capsys.readouterr().out
    # snapshots come from the PostgreSQL side (lower-case column names)
    data = json.loads((tmp_path / "t01.json").read_text(encoding="utf-8"))
    assert data["t01-s001"]["cols"] == ["kuerzel", "preis", "angelegt"]


@pytest.mark.firebird
def test_engine_mismatch_exits_1(tmp_path, capsys):
    fb_or_skip()
    content = tmp_path / "content"
    shutil.copytree(CONTENT, content)
    yml = content / "t01-demo" / "sql-tasks.yml"
    yml.write_text(yml.read_text(encoding="utf-8").replace("LIMIT 2", "LIMIT 3"), encoding="utf-8")
    rc = sqltest.main(["--engines", "fb,pg", "--content", str(content), "--db-dir", str(DB_DIR), "--topic", "t01"])
    assert rc == 1
    assert "FAIL t01-s002" in capsys.readouterr().out


@pytest.mark.firebird
def test_fb_ddl_runs_isolated():
    fb_or_skip()
    batch = {
        "setup": sqltest.setup_scripts(DB_DIR, "demo", "fb"),
        "jobs": [
            {"id": "c", "kind": "ddl", "sql": "ALTER TABLE artikel ADD lager INTEGER DEFAULT 3 NOT NULL", "check": "SELECT lager FROM artikel WHERE artikel_id = 1"},
            {"id": "d", "kind": "query", "sql": "SELECT COUNT(*) FROM RDB$RELATION_FIELDS WHERE RDB$FIELD_NAME = 'LAGER'"},
            {"id": "e", "kind": "query", "sql": "SELECT kuerzel FROM artikel WHERE artikel_id = 1"},
        ],
    }
    res = sqltest.run_engine("fb", batch)["results"]
    assert res["c"] == {"cols": ["LAGER"], "rows": [[3]], "error": None}
    assert res["d"]["rows"] == [[0]]
    assert res["e"]["rows"] == [["AAA"]]  # CHAR(6) padding already trimmed
