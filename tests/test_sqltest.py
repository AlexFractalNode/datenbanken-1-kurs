import json
import os
import shutil
import subprocess
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
        "- id: t01-s001\n  db: demo\n  kind: dml\n  solution: DELETE FROM artikel; COMMIT\n  check: SELECT 1\n", encoding="utf-8"
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


# --- review round 1 -------------------------------------------------------------


def _write_tasks(root, topic_dir, body):
    d = root / topic_dir
    d.mkdir(parents=True, exist_ok=True)
    (d / "sql-tasks.yml").write_text(body, encoding="utf-8")


def test_split_sql_dollar_quoting_and_rdb_identifiers():
    script = (
        "CREATE FUNCTION f() RETURNS int AS $body$ SELECT 1; $body$ LANGUAGE sql;"
        " SELECT $$a;b$$; SELECT 1 FROM RDB$DATABASE;"
    )
    assert split_sql(script) == [
        "CREATE FUNCTION f() RETURNS int AS $body$ SELECT 1; $body$ LANGUAGE sql",
        "SELECT $$a;b$$",
        "SELECT 1 FROM RDB$DATABASE",
    ]
    assert split_sql("SELECT GEN_ID(RDB$1, 0) FROM RDB$DATABASE; SELECT 2") == [
        "SELECT GEN_ID(RDB$1, 0) FROM RDB$DATABASE",
        "SELECT 2",
    ]


@pytest.mark.parametrize("stmt", ["ABORT", "PREPARE TRANSACTION 'x'", "COMMIT PREPARED 'x'", "ROLLBACK", "END"])
def test_more_transaction_control_rejected(tmp_path, stmt):
    _write_tasks(tmp_path, "t01-x", f'- id: t01-s001\n  db: demo\n  kind: dml\n  solution: "DELETE FROM artikel; {stmt}"\n  check: SELECT 1\n')
    with pytest.raises(sqltest.TaskError, match="transaction control"):
        sqltest.load_tasks(tmp_path)


def test_savepoint_is_allowed(tmp_path):
    _write_tasks(tmp_path, "t01-x", "- id: t01-s001\n  db: demo\n  kind: dml\n  solution: SAVEPOINT a; DELETE FROM artikel; ROLLBACK TO SAVEPOINT a\n  check: SELECT 1\n")
    assert len(sqltest.load_tasks(tmp_path)) == 1


@pytest.mark.parametrize("kind", ["dml", "ddl"])
def test_check_required_for_dml_and_ddl(tmp_path, kind):
    _write_tasks(tmp_path, "t01-x", f"- id: t01-s001\n  db: demo\n  kind: {kind}\n  solution: DELETE FROM artikel\n")
    with pytest.raises(sqltest.TaskError, match="check"):
        sqltest.load_tasks(tmp_path)


def _insert(code):
    return (
        "INSERT INTO artikel (kuerzel, bezeichnung, preis, angelegt)"
        f" VALUES ('{code}', 'Platzhalter', 1.00, DATE '2024-05-01')"
    )


def _id_of(code):
    return f"SELECT artikel_id FROM artikel WHERE kuerzel = '{code}'"


INSERT_JOBS = [
    {"id": "x", "kind": "dml", "sql": _insert("XXX"), "check": _id_of("XXX")},
    {"id": "y", "kind": "dml", "sql": _insert("YYY"), "check": _id_of("YYY")},
    {"id": "z", "kind": "ddl", "sql": "ALTER TABLE artikel ADD lager INTEGER; " + _insert("ZZZ"), "check": _id_of("ZZZ")},
    {"id": "q", "kind": "query", "sql": "SELECT COUNT(*) FROM artikel"},
]


def _identity_independent(engine):
    setup = sqltest.setup_scripts(DB_DIR, "demo", engine)
    for jobs in (INSERT_JOBS, INSERT_JOBS[::-1]):
        res = sqltest.run_engine(engine, {"setup": setup, "jobs": jobs})["results"]
        rows = {k: v["rows"] for k, v in res.items()}
        assert rows == {"x": [[5]], "y": [[5]], "z": [[5]], "q": [[4]]}, (engine, res)


def test_identity_does_not_drift_between_jobs_pg():
    _identity_independent("pg")


@pytest.mark.firebird
def test_identity_does_not_drift_between_jobs_fb():
    fb_or_skip()
    _identity_independent("fb")


T02_TASK = """- id: t02-s001
  db: demo
  kind: dml
  solution: INSERT INTO artikel (kuerzel, bezeichnung, preis, angelegt) VALUES ('FFF', 'Platzhalter Zeta', 3.00, DATE '2024-06-01')
  check: SELECT artikel_id, kuerzel FROM artikel WHERE kuerzel = 'FFF'
"""


def _snapshot_with_and_without_topic(tmp_path, engines):
    content = tmp_path / "content"
    shutil.copytree(CONTENT, content)
    _write_tasks(content, "t02-demo", T02_TASK)
    full, single = tmp_path / "full", tmp_path / "single"
    base = ["--engines", engines, "--content", str(content), "--db-dir", str(DB_DIR)]
    assert sqltest.main([*base, "--write-snapshots", str(full)]) == 0
    assert sqltest.main([*base, "--topic", "t02", "--write-snapshots", str(single)]) == 0
    text = (full / "t02.json").read_text(encoding="utf-8")
    assert text == (single / "t02.json").read_text(encoding="utf-8")
    assert json.loads(text)["t02-s001"]["rows"] == [[5, "FFF"]]


def test_snapshot_independent_of_topic_filter_pg(tmp_path):
    _snapshot_with_and_without_topic(tmp_path, "pg")


@pytest.mark.firebird
def test_snapshot_independent_of_topic_filter_fb(tmp_path):
    fb_or_skip()
    _snapshot_with_and_without_topic(tmp_path, "fb,pg")


SLOW = {
    "pg": "WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r WHERE n < 100000000) SELECT COUNT(*) FROM r",
    "fb": "SELECT COUNT(*) FROM RDB$FIELDS a, RDB$FIELDS b, RDB$FIELDS c, RDB$FIELDS d",
}


def _timeout(engine):
    batch = {
        "setup": sqltest.setup_scripts(DB_DIR, "demo", engine),
        "job_timeout_ms": 1500,
        "jobs": [
            {"id": "fast1", "kind": "query", "sql": "SELECT COUNT(*) FROM artikel"},
            {"id": "slow", "kind": "query", "sql": SLOW[engine]},
            {"id": "fast2", "kind": "dml", "sql": "DELETE FROM artikel WHERE artikel_id = 1", "check": "SELECT COUNT(*) FROM artikel"},
            {"id": "fast3", "kind": "dml", "sql": _insert("TTT"), "check": _id_of("TTT")},
        ],
    }
    res = sqltest.run_engine(engine, batch, timeout=120)["results"]
    assert res["fast1"]["rows"] == [[4]]
    assert "timeout" in res["slow"]["error"]
    assert res["fast2"]["error"] is None and res["fast2"]["rows"] == [[3]]
    assert res["fast3"]["rows"] == [[5]]


def test_job_timeout_pg():
    _timeout("pg")


@pytest.mark.firebird
def test_job_timeout_fb():
    fb_or_skip()
    _timeout("fb")


def test_slow_task_reported_by_name(tmp_path, capsys):
    _write_tasks(
        tmp_path,
        "t01-x",
        "- id: t01-s001\n  db: demo\n  kind: query\n  engines: [pg]\n"
        f'  solution: "{SLOW["pg"]}"\n'
        "- id: t01-s002\n  db: demo\n  kind: query\n  engines: [pg]\n  solution: SELECT COUNT(*) FROM artikel\n",
    )
    rc = sqltest.main(["--engines", "pg", "--content", str(tmp_path), "--db-dir", str(DB_DIR), "--job-timeout", "1.5"])
    out = capsys.readouterr().out
    assert rc == 1
    assert "FAIL t01-s001: pg: timeout" in out and "PASS t01-s002" in out


def _typed_values(engine):
    setup = ["CREATE TABLE tv (c CHAR(5), v VARCHAR(5)); INSERT INTO tv VALUES ('ab', 'cd  ');"]
    jobs = [{"id": "t", "kind": "query", "sql": "SELECT c, v FROM tv"}]
    return sqltest.run_engine(engine, {"setup": setup, "jobs": jobs})["results"]["t"]["rows"]


def test_char_trimmed_varchar_kept_pg():
    assert _typed_values("pg") == [["ab", "cd  "]]


@pytest.mark.firebird
def test_char_trimmed_varchar_kept_fb():
    fb_or_skip()
    assert _typed_values("fb") == [["ab", "cd  "]]


def test_pg_bigint_and_bytea_serialised():
    jobs = [{"id": "t", "kind": "query", "sql": "SELECT 9007199254740993::int8, 5::int8, '\\x01ff'::bytea"}]
    res = sqltest.run_engine("pg", {"setup": [], "jobs": jobs})["results"]["t"]
    assert res["error"] is None
    assert res["rows"] == [["9007199254740993", 5, "01ff"]]


def test_compose_container_removed_on_timeout(monkeypatch):
    calls = []

    def fake_run(cmd, **kwargs):
        calls.append(cmd)
        if len(calls) == 1:
            raise subprocess.TimeoutExpired(cmd, kwargs.get("timeout"))
        return subprocess.CompletedProcess(cmd, 0, b"", b"")

    monkeypatch.setattr(sqltest.subprocess, "run", fake_run)
    monkeypatch.setattr(sqltest.shutil, "which", lambda name: name)
    monkeypatch.setenv("SQLTEST_COMPOSE", "docker compose")
    with pytest.raises(sqltest.EngineError, match="timed out"):
        sqltest.run_engine("fb", {"setup": [], "jobs": []}, via="compose", timeout=1)
    name = calls[0][calls[0].index("--name") + 1]
    assert name.startswith("sqltest-fbrunner-")
    assert calls[1] == ["docker", "rm", "-f", name]
