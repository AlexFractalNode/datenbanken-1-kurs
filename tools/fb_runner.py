#!/usr/bin/env python3
"""Batch SQL runner on Firebird 3 (firebird-driver), same protocol as pglite-runner.mjs.

stdin:  {"setup": ["<sql script>", ...], "jobs": [{"id", "sql", "kind", "check"}],
         "job_timeout_ms": 30000}
stdout: {"results": {"<id>": {"cols": [...], "rows": [[...]], "error": null | "<msg>"}}}

Usage:
    fb_runner.py            read a batch from stdin, write results to stdout
    fb_runner.py --ping     create and drop a scratch database (exit 0 if reachable)

Every batch gets a fresh scratch database on the server, which is dropped
afterwards. Scripts are split into statements (isql style, including
SET TERM). In the setup every DDL statement is committed on its own.

Every query/dml job runs in its own transaction that is rolled back.
Generators of identity columns are not transactional, so after every job
they are reset to their values right after the setup (ALTER TABLE ...
RESTART WITH): every job sees the same database, independent of job order.
Every ddl job runs on its own copy (fresh scratch database + setup), because
Firebird 3 cannot use objects created in a still open transaction. kind
"query" returns the result of its last statement; kind "ddl"/"dml" returns
the result of `check` (empty without one).

A job that runs longer than job_timeout_ms is cancelled with
fb_cancel_operation and reported as "timeout: ..."; the batch continues.
CHAR(n) values lose their trailing blanks, VARCHAR and text BLOB values are
returned unchanged.

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
import re
import sys
import threading
import uuid
from typing import Any

import resultcmp

KINDS = {"query", "ddl", "dml"}
DEFAULT_TIMEOUT_MS = 30000
# Setup statements after which the runner commits, so later statements see the objects.
DDL_KEYWORDS = {"CREATE", "ALTER", "DROP", "RECREATE", "COMMENT", "DECLARE", "GRANT", "REVOKE", "SET"}
_DOLLAR_TAG = re.compile(r"\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$")
_IDENT_CHARS = frozenset("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_$")


class InputError(Exception):
    pass


def _set_term(pending: str) -> str | None:
    words = pending.split()
    if len(words) == 3 and words[0].upper() == "SET" and words[1].upper() == "TERM":
        return words[2]
    return None


def split_sql(script: str) -> list[str]:
    """Split an isql-style script into statements.

    Honours '...' strings (with '' escapes), "..." identifiers, PostgreSQL
    dollar quoting ($$...$$, $tag$...$tag$; not inside identifiers such as
    RDB$DATABASE), -- and /* */ comments and `SET TERM <new> <old>`
    directives (for PSQL bodies). The terminator is not part of the returned
    statements; empty statements and SET TERM directives are dropped.
    Comments are removed.
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
        if ch == "$" and (i == 0 or script[i - 1] not in _IDENT_CHARS):
            m = _DOLLAR_TAG.match(script, i)
            if m:
                end = script.find(m.group(0), m.end())
                stop = n if end == -1 else end + len(m.group(0))
                buf.append(script[i:stop])
                i = stop
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


def validate_batch(batch: Any) -> tuple[list[str], list[dict], int]:
    if not isinstance(batch, dict):
        raise InputError("input must be a JSON object")
    setup = batch.get("setup", [])
    jobs = batch.get("jobs", [])
    timeout_ms = batch.get("job_timeout_ms", DEFAULT_TIMEOUT_MS)
    if not isinstance(setup, list) or not all(isinstance(s, str) for s in setup):
        raise InputError('"setup" must be a list of SQL strings')
    if not isinstance(jobs, list):
        raise InputError('"jobs" must be a list')
    if isinstance(timeout_ms, bool) or not isinstance(timeout_ms, (int, float)) or timeout_ms <= 0:
        raise InputError('"job_timeout_ms" must be a positive number')
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
    return setup, jobs, int(timeout_ms)


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


_WARNED: set[str] = set()


def _warn_once(api: str, exc: Exception) -> None:
    """Report a missing firebird-driver private API on stderr (once per API)."""
    if api in _WARNED:
        return
    _WARNED.add(api)
    print(
        f"fb_runner: WARNING: firebird-driver private API {api} unavailable ({exc!r}); "
        "the pinned version (2.1.2) may have changed",
        file=sys.stderr,
    )


def _char_columns(cur) -> list[bool] | None:
    """Which result columns are CHAR(n); None if the driver does not tell."""
    try:
        from firebird.driver.types import SQLDataType

        # firebird-driver has no public API for the SQL type of a result column
        return [m.datatype == SQLDataType.TEXT for m in cur._stmt._out_desc]
    except Exception as exc:
        _warn_once("_stmt._out_desc", exc)
        return None


def _value(value: Any, is_char: bool | None) -> Any:
    if hasattr(value, "read"):  # BlobReader for large blobs
        value = value.read()
    if is_char is None:  # column type unknown: trim every string (resultcmp fallback)
        return resultcmp.normalize_value(value)
    if is_char and isinstance(value, str):
        value = value.rstrip(" ")
    return resultcmp.normalize_value(value, trim=False)


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


def _error(exc: Exception) -> dict:
    return {"cols": [], "rows": [], "error": " ".join(str(exc).split())}


class Deadline:
    """Cancel the running statement of `con` once timeout_ms have passed."""

    def __init__(self, con, timeout_ms: int) -> None:
        self.con = con
        self.timeout_ms = timeout_ms
        self.fired = False
        self.timer = threading.Timer(timeout_ms / 1000, self._fire)
        self.timer.daemon = True

    def _fire(self) -> None:
        self.fired = True
        try:
            from firebird.driver.types import CancelType

            # Connection has no public cancel method in firebird-driver 2.1
            self.con._att.cancel_operation(CancelType.RAISE)
        except Exception as exc:
            _warn_once("_att.cancel_operation", exc)

    def __enter__(self) -> "Deadline":
        self.timer.start()
        return self

    def __exit__(self, *exc: object) -> None:
        self.timer.cancel()

    def error(self, exc: Exception) -> dict:
        if self.fired:
            return {"cols": [], "rows": [], "error": f"timeout: job exceeded {self.timeout_ms} ms"}
        return _error(exc)


def _run_statements(con, statements: list[str]) -> dict:
    """Execute statements on the connection's main transaction; return the last result set."""
    result: dict = {"cols": [], "rows": [], "error": None}
    cur = con.cursor()
    try:
        for stmt in statements:
            cur.execute(stmt)
            if cur.description:
                cols = [d[0] for d in cur.description]
                chars = _char_columns(cur) or [None] * len(cols)
                rows = [[_value(v, c) for v, c in zip(row, chars)] for row in cur.fetchall()]
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


_IDENTITY_SQL = (
    "SELECT TRIM(RDB$RELATION_NAME), TRIM(RDB$FIELD_NAME), TRIM(RDB$GENERATOR_NAME)"
    " FROM RDB$RELATION_FIELDS WHERE RDB$GENERATOR_NAME IS NOT NULL ORDER BY 1, 2"
)


def _quote(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def identity_state(con) -> list[tuple[str, str, int]]:
    """(table, column, current generator value) for every identity column."""
    cur = con.cursor()
    try:
        cur.execute(_IDENTITY_SQL)
        columns = cur.fetchall()
        values: tuple = ()
        if columns:
            gens = ", ".join(f"GEN_ID({_quote(g)}, 0)" for _, _, g in columns)
            cur.execute(f"SELECT {gens} FROM RDB$DATABASE")
            values = cur.fetchone()
    finally:
        cur.close()
        _rollback(con)
    return [(t, c, v) for (t, c, _), v in zip(columns, values)]


def restore_identities(con, baseline: list[tuple[str, str, int]]) -> None:
    """Reset generators a job has moved. In Firebird 3, RESTART WITH v makes v + 1 the next value."""
    if not baseline:
        return
    current = {(t, c): v for t, c, v in identity_state(con)}
    cur = con.cursor()
    try:
        for table, column, value in baseline:
            if current.get((table, column), value) != value:
                cur.execute(f"ALTER TABLE {_quote(table)} ALTER COLUMN {_quote(column)} RESTART WITH {int(value)}")
                _commit(con)
    finally:
        cur.close()


def run_ddl_isolated(settings: dict[str, str], setup: list[str], job: dict, timeout_ms: int) -> dict:
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
    except Exception as exc:
        _cleanup(con)
        return _error(exc)
    deadline = Deadline(con, timeout_ms)
    try:
        with deadline:
            _execute_committing_ddl(con, split_sql(job["sql"]))
            check = job.get("check")
            if not check or not check.strip():
                return {"cols": [], "rows": [], "error": None}
            return _run_statements(con, split_sql(check))
    except Exception as exc:
        return deadline.error(exc)
    finally:
        _cleanup(con)


def run_job(con, job: dict, timeout_ms: int = DEFAULT_TIMEOUT_MS) -> dict:
    deadline = Deadline(con, timeout_ms)
    try:
        with deadline:
            if job["kind"] == "query":
                return _run_statements(con, split_sql(job["sql"]))
            _run_statements(con, split_sql(job["sql"]))
            check = job.get("check")
            if not check or not check.strip():
                return {"cols": [], "rows": [], "error": None}
            return _run_statements(con, split_sql(check))
    except Exception as exc:  # driver errors carry the Firebird message
        return deadline.error(exc)
    finally:
        # A failing rollback leaves the shared database in an unknown state:
        # let it propagate and abort the batch instead of hiding it.
        _rollback(con)


def run_batch(batch: Any, settings: dict[str, str] | None = None) -> dict:
    setup, jobs, timeout_ms = validate_batch(batch)
    settings = settings or _settings()
    con = create_scratch_db(settings)
    try:
        results: dict[str, dict] = {}
        setup_error = None
        baseline: list[tuple[str, str, int]] = []
        try:
            run_setup(con, setup)
            baseline = identity_state(con)
        except Exception as exc:
            setup_error = "setup failed: " + " ".join(str(exc).split())
        for job in jobs:
            if setup_error:
                results[job["id"]] = {"cols": [], "rows": [], "error": setup_error}
            elif job["kind"] == "ddl":
                results[job["id"]] = run_ddl_isolated(settings, setup, job, timeout_ms)
            else:
                results[job["id"]] = run_job(con, job, timeout_ms)
                restore_identities(con, baseline)
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
