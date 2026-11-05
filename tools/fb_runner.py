#!/usr/bin/env python3
"""Batch SQL runner on Firebird 3 (firebird-driver), same protocol as pglite-runner.mjs.

stdin:  {"setup": ["<sql script>", ...], "jobs": [{"id", "sql", "kind", "check"}]}
stdout: {"results": {"<id>": {"cols": [...], "rows": [[...]], "error": null | "<msg>"}}}

Usage:
    fb_runner.py            read a batch from stdin, write results to stdout
    fb_runner.py --ping     create and drop a scratch database (exit 0 if reachable)

Every batch gets a fresh scratch database on the server, which is dropped
afterwards. Scripts are split into statements (isql style, including
SET TERM). In the setup every DDL statement is committed on its own.
Every job runs in its own transaction that is rolled back. kind "query"
returns the result of its last statement; kind "ddl"/"dml" returns the
result of `check` (empty without one).

Connection settings come from the environment: FB_HOST (localhost),
FB_PORT (3050), FB_USER (SYSDBA), FB_PASSWORD (masterkey, the throwaway
default of docker-compose.test.yml), FB_DATA_DIR (/var/lib/firebird/data,
a path on the server) and optionally FB_CLIENT_LIBRARY (path to libfbclient).

Values are emitted in the normalised form of resultcmp. Exit code 0 when the
batch was processed (errors are reported per job), 2 on invalid input or
when the server cannot be reached.
"""
from __future__ import annotations

import json
import os
import sys
import uuid
from typing import Any

import resultcmp

KINDS = {"query", "ddl", "dml"}
# Setup statements after which the runner commits, so later statements see the objects.
DDL_KEYWORDS = {"CREATE", "ALTER", "DROP", "RECREATE", "COMMENT", "DECLARE", "GRANT", "REVOKE", "SET"}


class InputError(Exception):
    pass


def _set_term(pending: str) -> str | None:
    words = pending.split()
    if len(words) == 3 and words[0].upper() == "SET" and words[1].upper() == "TERM":
        return words[2]
    return None


def split_sql(script: str) -> list[str]:
    """Split an isql-style script into statements.

    Honours '...' strings (with '' escapes), "..." identifiers, -- and /* */
    comments and `SET TERM <new> <old>` directives (for PSQL bodies). The
    terminator is not part of the returned statements; empty statements and
    SET TERM directives are dropped. Comments are removed.
    """
    statements: list[str] = []
    term = ";"
    buf: list[str] = []
    i, n = 0, len(script)
    while i < n:
        ch = script[i]
        if ch in ("'", '"'):
            j = i + 1
            while j < n:
                if script[j] == ch:
                    if j + 1 < n and script[j + 1] == ch:
                        j += 2
                        continue
                    break
                j += 1
            buf.append(script[i : j + 1])
            i = j + 1
            continue
        if script.startswith("--", i):
            j = script.find("\n", i)
            i = n if j == -1 else j
            continue
        if script.startswith("/*", i):
            j = script.find("*/", i + 2)
            i = n if j == -1 else j + 2
            buf.append(" ")
            continue
        if script.startswith(term, i):
            pending = "".join(buf).strip()
            buf.clear()
            i += len(term)
            new_term = _set_term(pending)
            if new_term is not None:
                term = new_term
            elif pending:
                statements.append(pending)
            continue
        buf.append(ch)
        i += 1
    rest = "".join(buf).strip()
    if rest and _set_term(rest) is None:
        statements.append(rest)
    return statements


def _first_word(stmt: str) -> str:
    parts = stmt.split(None, 1)
    return parts[0].upper() if parts else ""


def validate_batch(batch: Any) -> tuple[list[str], list[dict]]:
    if not isinstance(batch, dict):
        raise InputError("input must be a JSON object")
    setup = batch.get("setup", [])
    jobs = batch.get("jobs", [])
    if not isinstance(setup, list) or not all(isinstance(s, str) for s in setup):
        raise InputError('"setup" must be a list of SQL strings')
    if not isinstance(jobs, list):
        raise InputError('"jobs" must be a list')
    seen: set[str] = set()
    for job in jobs:
        if not isinstance(job, dict):
            raise InputError("every job must be an object")
        jid = job.get("id")
        if not isinstance(jid, str) or not jid:
            raise InputError('every job needs a string "id"')
        if jid in seen:
            raise InputError(f"duplicate job id {jid}")
        seen.add(jid)
        if not isinstance(job.get("sql"), str):
            raise InputError(f'job {jid}: "sql" must be a string')
        if job.get("kind") not in KINDS:
            raise InputError(f"job {jid}: unknown kind {job.get('kind')!r}")
        if job.get("check") is not None and not isinstance(job["check"], str):
            raise InputError(f'job {jid}: "check" must be a string or null')
    return setup, jobs


def _settings() -> dict[str, str]:
    return {
        "host": os.environ.get("FB_HOST", "localhost"),
        "port": os.environ.get("FB_PORT", "3050"),
        "user": os.environ.get("FB_USER", "SYSDBA"),
        "password": os.environ.get("FB_PASSWORD", "masterkey"),
        "data_dir": os.environ.get("FB_DATA_DIR", "/var/lib/firebird/data").rstrip("/"),
        "client": os.environ.get("FB_CLIENT_LIBRARY", ""),
    }


def _driver(settings: dict[str, str]):
    from firebird import driver  # imported lazily: split_sql works without it

    if settings["client"]:
        driver.driver_config.fb_client_library.value = settings["client"]
    db = driver.driver_config.db_defaults
    db.db_charset.value = "UTF8"
    db.charset.value = "UTF8"
    db.forced_writes.value = False
    db.page_size.value = 8192
    return driver


def create_scratch_db(settings: dict[str, str]):
    driver = _driver(settings)
    dsn = f"{settings['host']}/{settings['port']}:{settings['data_dir']}/sqltest_{uuid.uuid4().hex}.fdb"
    return driver.create_database(dsn, user=settings["user"], password=settings["password"])


def _value(value: Any) -> Any:
    if hasattr(value, "read"):  # BlobReader for large blobs
        value = value.read()
    return resultcmp.normalize_value(value)


def _commit(con) -> None:
    # commit()/rollback() fail in firebird-driver when no transaction is active
    if con.main_transaction.is_active():
        con.commit()


def _rollback(con) -> None:
    if con.main_transaction.is_active():
        con.rollback()


def _cleanup(con) -> None:
    """Best effort on a scratch database that is dropped anyway."""
    try:
        _rollback(con)
    except Exception:
        pass
    try:
        con.drop_database()
    except Exception:
        pass


def _run_statements(con, statements: list[str]) -> dict:
    """Execute statements on the connection's main transaction; return the last result set."""
    result: dict = {"cols": [], "rows": [], "error": None}
    cur = con.cursor()
    try:
        for stmt in statements:
            cur.execute(stmt)
            if cur.description:
                cols = [d[0] for d in cur.description]
                rows = [[_value(v) for v in row] for row in cur.fetchall()]
                result = {"cols": cols, "rows": rows, "error": None}
    finally:
        cur.close()
    return result


def _execute_committing_ddl(con, statements: list[str]) -> None:
    cur = con.cursor()
    try:
        for stmt in statements:
            cur.execute(stmt)
            if _first_word(stmt) in DDL_KEYWORDS:
                _commit(con)
    finally:
        cur.close()


def run_setup(con, scripts: list[str]) -> None:
    for script in scripts:
        _execute_committing_ddl(con, split_sql(script))
    _commit(con)


def _error(exc: Exception) -> dict:
    return {"cols": [], "rows": [], "error": " ".join(str(exc).split())}


def run_ddl_isolated(settings: dict[str, str], setup: list[str], job: dict) -> dict:
    """Run a ddl job on its own scratch database.

    Firebird 3 rolls DDL back correctly, but objects created or altered in a
    transaction are unusable (Table/Column unknown) until commit. So DDL
    statements are committed and the whole copy is dropped afterwards.
    """
    try:
        con = create_scratch_db(settings)
    except Exception as exc:
        return _error(exc)
    try:
        run_setup(con, setup)
        _execute_committing_ddl(con, split_sql(job["sql"]))
        check = job.get("check")
        if not check or not check.strip():
            return {"cols": [], "rows": [], "error": None}
        return _run_statements(con, split_sql(check))
    except Exception as exc:
        return _error(exc)
    finally:
        _cleanup(con)


def run_job(con, job: dict) -> dict:
    try:
        if job["kind"] == "query":
            return _run_statements(con, split_sql(job["sql"]))
        _run_statements(con, split_sql(job["sql"]))
        check = job.get("check")
        if not check or not check.strip():
            return {"cols": [], "rows": [], "error": None}
        return _run_statements(con, split_sql(check))
    except Exception as exc:  # driver errors carry the Firebird message
        return _error(exc)
    finally:
        # A failing rollback leaves the shared database in an unknown state:
        # let it propagate and abort the batch instead of hiding it.
        _rollback(con)


def run_batch(batch: Any, settings: dict[str, str] | None = None) -> dict:
    setup, jobs = validate_batch(batch)
    settings = settings or _settings()
    con = create_scratch_db(settings)
    try:
        results: dict[str, dict] = {}
        setup_error = None
        try:
            run_setup(con, setup)
        except Exception as exc:
            setup_error = "setup failed: " + " ".join(str(exc).split())
        for job in jobs:
            if setup_error:
                results[job["id"]] = {"cols": [], "rows": [], "error": setup_error}
            else:
                results[job["id"]] = (
                    run_ddl_isolated(settings, setup, job) if job["kind"] == "ddl" else run_job(con, job)
                )
        out: dict = {"results": results}
        if setup_error:
            out["setup_error"] = setup_error
        return out
    finally:
        _cleanup(con)


def ping(settings: dict[str, str] | None = None) -> None:
    con = create_scratch_db(settings or _settings())
    con.drop_database()


def main(argv: list[str]) -> int:
    if argv == ["--ping"]:
        try:
            ping()
        except Exception as exc:
            print(f"fb_runner: server not reachable: {exc}", file=sys.stderr)
            return 2
        return 0
    if argv:
        print(__doc__, file=sys.stderr)
        return 2
    try:
        batch = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        print(f"fb_runner: invalid JSON on stdin: {exc}", file=sys.stderr)
        return 2
    try:
        out = run_batch(batch)
    except InputError as exc:
        print(f"fb_runner: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:
        print(f"fb_runner: cannot run batch: {exc}", file=sys.stderr)
        return 2
    sys.stdout.buffer.write(json.dumps(out, ensure_ascii=False).encode("utf-8"))
    sys.stdout.flush()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
