#!/usr/bin/env python3
"""Run all SQL tasks on Firebird 3 and PostgreSQL (PGlite) and compare the results.

Usage:
    sqltest.py [--engines fb,pg] [--topic tNN] [--write-snapshots DIR]
               [--content DIR] [--db-dir DIR] [--fb-via auto|local|compose]
               [--timeout SECONDS] [--job-timeout SECONDS]

Tasks come from <content>/tNN-*/sql-tasks.yml (default content/de/topics).
Each file is a YAML list of tasks (a mapping with a `tasks` list is accepted
too). Used fields: id, db, kind (query|ddl|dml), solution (Firebird),
solution_pg, engines (default [fb, pg]), ordered (default false), check.

Per database and engine the runner builds the database once (schema +
seed) and runs all tasks in one batch. Every task sees the same database:
changes are rolled back and identity generators/sequences are reset after
each task, so results do not depend on task order or --topic. ddl/dml
tasks need a `check` query. A task that runs longer than --job-timeout
seconds fails with "timeout"; the others still run. A task passes when it
runs without error on every selected engine it lists and, if both engines
ran, the normalised results are equal (resultcmp, trim=False: the runners
trim CHAR columns themselves).
With --write-snapshots the results (PostgreSQL side if available) are
written as DIR/<topic>.json, `{"id": {"cols", "rows", "ordered"}}`, but
only when every task passed.

Firebird: `--fb-via local` runs tools/fb_runner.py on this machine (needs
libfbclient and a server, e.g. `docker compose -f docker-compose.test.yml
up -d firebird`); `compose` runs it inside the fbrunner container of
docker-compose.test.yml; `auto` (default, or env SQLTEST_FB_VIA) uses local
when the client library loads, else compose. SQLTEST_COMPOSE overrides the
compose command (default "docker compose").

Exit code 0 when all tasks pass, 1 on any mismatch or error, 2 on usage errors.
"""
from __future__ import annotations

import argparse
import functools
import json
import os
import shlex
import shutil
import subprocess
import sys
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

import resultcmp
from fb_runner import split_sql

TOOLS = Path(__file__).resolve().parent
REPO = TOOLS.parent
DEFAULT_CONTENT = REPO / "content" / "de" / "topics"
DEFAULT_DB_DIR = REPO / "db"
COMPOSE_FILE = REPO / "docker-compose.test.yml"
ENGINES = ("fb", "pg")
KINDS = {"query", "ddl", "dml"}
TIMEOUT = 900  # seconds per engine batch
JOB_TIMEOUT = 30.0  # seconds per task
# Statements that would end or escape the runner's per-job transaction.
FORBIDDEN_START = {"COMMIT", "BEGIN", "END", "ABORT", "START TRANSACTION", "SET TRANSACTION", "PREPARE TRANSACTION"}


class TaskError(Exception):
    """Invalid task file or database directory."""


class EngineError(Exception):
    """A runner could not be started or returned no usable output."""


@dataclass
class Task:
    id: str
    topic: str
    db: str
    kind: str
    solution: str
    solution_pg: str | None = None
    engines: list[str] = field(default_factory=lambda: list(ENGINES))
    ordered: bool = False
    check: str | None = None
    source: str = ""

    def sql_for(self, engine: str) -> str:
        if engine == "pg" and self.solution_pg:
            return self.solution_pg
        return self.solution


# --- loading ---------------------------------------------------------------------


def _forbidden_statement(sql: str) -> str | None:
    for stmt in split_sql(sql):
        words = stmt.upper().split()
        if not words:
            continue
        if words[0] == "ROLLBACK" and not (len(words) > 1 and words[1] == "TO"):
            return "ROLLBACK"
        if words[0] in FORBIDDEN_START:
            return words[0]
        if " ".join(words[:2]) in FORBIDDEN_START:
            return " ".join(words[:2])
    return None


def _task_from(raw: Any, topic: str, source: str) -> Task:
    where = f"{source}"
    if not isinstance(raw, dict):
        raise TaskError(f"{where}: every task must be a mapping")
    tid = raw.get("id")
    if not isinstance(tid, str) or not tid:
        raise TaskError(f"{where}: task without string id")
    where = f"{source}: {tid}"
    for key in ("db", "solution"):
        if not isinstance(raw.get(key), str) or not raw[key].strip():
            raise TaskError(f"{where}: '{key}' must be a non-empty string")
    kind = raw.get("kind")
    if kind not in KINDS:
        raise TaskError(f"{where}: kind must be one of {sorted(KINDS)}, got {kind!r}")
    engines = raw.get("engines", list(ENGINES))
    if not isinstance(engines, list) or not engines or any(e not in ENGINES for e in engines):
        raise TaskError(f"{where}: engines must be a non-empty subset of {list(ENGINES)}")
    ordered = raw.get("ordered", False)
    if not isinstance(ordered, bool):
        raise TaskError(f"{where}: ordered must be true or false")
    for key in ("solution_pg", "check"):
        if raw.get(key) is not None and not isinstance(raw[key], str):
            raise TaskError(f"{where}: '{key}' must be a string")
    if kind in ("ddl", "dml") and not (raw.get("check") or "").strip():
        # without a check query a ddl/dml task could only ever "pass trivially"
        raise TaskError(f"{where}: kind {kind} needs a 'check' query")
    task = Task(
        id=tid,
        topic=topic,
        db=raw["db"],
        kind=kind,
        solution=raw["solution"],
        solution_pg=raw.get("solution_pg"),
        engines=list(engines),
        ordered=ordered,
        check=raw.get("check"),
        source=source,
    )
    for label, sql in (("solution", task.solution), ("solution_pg", task.solution_pg), ("check", task.check)):
        if sql:
            bad = _forbidden_statement(sql)
            if bad:
                raise TaskError(f"{where}: {label} must not contain transaction control ({bad})")
    return task


def load_tasks(content: Path, topic: str | None = None) -> list[Task]:
    """Read all sql-tasks.yml below content/tNN-*/; raises TaskError on invalid data."""
    tasks: list[Task] = []
    seen: set[str] = set()
    if not content.is_dir():
        return tasks
    for path in sorted(content.glob("*/sql-tasks.yml")):
        dir_topic = path.parent.name.split("-", 1)[0]
        if topic and dir_topic != topic:
            continue
        try:
            data = yaml.safe_load(path.read_text(encoding="utf-8"))
        except yaml.YAMLError as exc:
            raise TaskError(f"{path}: invalid YAML: {exc}") from exc
        if data is None:
            continue
        if isinstance(data, dict):
            data = data.get("tasks", data.get("items"))
        if not isinstance(data, list):
            raise TaskError(f"{path}: expected a list of tasks")
        for raw in data:
            task = _task_from(raw, dir_topic, str(path))
            if task.id in seen:
                raise TaskError(f"{path}: duplicate task id {task.id}")
            seen.add(task.id)
            tasks.append(task)
    return tasks


def setup_scripts(db_dir: Path, db: str, engine: str) -> list[str]:
    """schema(.pg).sql and seed.sql of one database, in load order."""
    base = db_dir / db
    if not base.is_dir():
        raise TaskError(f"unknown database {db!r}: {base} does not exist")
    schema = base / "schema.sql"
    if engine == "pg" and (base / "schema.pg.sql").is_file():
        schema = base / "schema.pg.sql"
    if not schema.is_file():
        raise TaskError(f"database {db!r}: {schema.name} missing")
    scripts = [schema.read_text(encoding="utf-8")]
    seed = base / "seed.sql"
    if seed.is_file():
        scripts.append(seed.read_text(encoding="utf-8"))
    return scripts


# --- engines ---------------------------------------------------------------------


def _local_fb_client() -> bool:
    try:
        from firebird.driver import driver_config
        from firebird.driver.fbapi import load_api
    except ImportError:
        return False
    lib = os.environ.get("FB_CLIENT_LIBRARY")
    if lib:
        driver_config.fb_client_library.value = lib
    try:
        load_api()
    except Exception:
        return False
    return True


def fb_via(choice: str = "auto") -> str:
    if choice == "auto":
        choice = os.environ.get("SQLTEST_FB_VIA", "auto")
    if choice in ("local", "compose"):
        return choice
    if choice != "auto":
        raise EngineError(f"unknown Firebird mode {choice!r} (local|compose|auto)")
    return "local" if _local_fb_client() else "compose"


def fb_command(via: str) -> tuple[list[str], list[str] | None]:
    """Runner command and, in compose mode, the command that removes its container."""
    if via == "local":
        return [sys.executable, str(TOOLS / "fb_runner.py")], None
    compose = shlex.split(os.environ.get("SQLTEST_COMPOSE", "docker compose"))
    if not compose or shutil.which(compose[0]) is None:
        raise EngineError(f"compose command {compose!r} not found; install Docker or use --fb-via local")
    # A killed `compose run` client leaves its container behind; a known name lets us remove it.
    name = f"sqltest-fbrunner-{uuid.uuid4().hex[:12]}"
    cmd = [*compose, "-f", str(COMPOSE_FILE), "run", "--rm", "-T", "--name", name, "fbrunner"]
    return cmd, [compose[0], "rm", "-f", name]


def pg_command() -> list[str]:
    node = shutil.which("node")
    if node is None:
        raise EngineError("node not found on PATH")
    if not (REPO / "node_modules" / "@electric-sql" / "pglite").is_dir():
        raise EngineError("@electric-sql/pglite missing; run `npm ci` in the repository root")
    return [node, str(TOOLS / "pglite-runner.mjs")]


def _run(
    cmd: list[str], payload: bytes | None, timeout: float, cleanup: list[str] | None = None
) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(cmd, input=payload, capture_output=True, timeout=timeout, cwd=REPO)
    except FileNotFoundError as exc:
        raise EngineError(f"cannot start {cmd[0]}: {exc}") from exc
    except subprocess.TimeoutExpired as exc:
        removed = ""
        if cleanup:
            try:
                rm = subprocess.run(cleanup, capture_output=True, timeout=60, cwd=REPO)
                removed = f"; container removed ({' '.join(cleanup)} -> exit {rm.returncode})"
            except (OSError, subprocess.TimeoutExpired) as rm_exc:
                removed = f"; removing the container failed: {rm_exc}"
        raise EngineError(f"{' '.join(cmd[:3])} timed out after {timeout}s{removed}") from exc


def run_engine(engine: str, batch: dict, via: str = "auto", timeout: float = TIMEOUT) -> dict:
    """Send one batch to a runner and return its parsed output."""
    cleanup = None
    if engine == "pg":
        cmd = pg_command()
    elif engine == "fb":
        cmd, cleanup = fb_command(fb_via(via))
    else:
        raise EngineError(f"unknown engine {engine!r}")
    proc = _run(cmd, json.dumps(batch).encode("utf-8"), timeout, cleanup)
    stderr = proc.stderr.decode("utf-8", "replace").strip()
    if proc.returncode != 0:
        raise EngineError(f"{engine} runner exited with {proc.returncode}: {stderr[-2000:]}")
    try:
        out = json.loads(proc.stdout.decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        raise EngineError(f"{engine} runner returned invalid JSON: {exc}; stderr: {stderr[-500:]}") from exc
    if not isinstance(out, dict) or not isinstance(out.get("results"), dict):
        raise EngineError(f"{engine} runner returned no results object")
    return out


@functools.cache
def fb_available(via: str = "auto") -> tuple[bool, str]:
    """Whether a Firebird server can be reached with the selected runner mode."""
    try:
        cmd, cleanup = fb_command(fb_via(via))
        proc = _run([*cmd, "--ping"], None, 600, cleanup)
    except EngineError as exc:
        return False, str(exc)
    if proc.returncode != 0:
        return False, proc.stderr.decode("utf-8", "replace").strip()[-500:]
    return True, ""


# --- comparison --------------------------------------------------------------------


def _short(result: dict, limit: int = 5) -> str:
    try:
        rows = resultcmp.normalize(result["rows"], result["cols"], trim=False)
    except ValueError as exc:
        return f"<invalid result: {exc}>"
    more = f" ... ({len(rows)} rows)" if len(rows) > limit else ""
    return f"cols={result['cols']} rows={rows[:limit]}{more}"


def _check_result(task: Task, engine: str, result: dict | None) -> str | None:
    if result is None:
        return f"{engine}: no result returned"
    if result.get("error"):
        return f"{engine}: {result['error']}"
    if not isinstance(result.get("cols"), list) or not isinstance(result.get("rows"), list):
        return f"{engine}: malformed result"
    if task.kind == "query" and not result["cols"]:
        return f"{engine}: query returned no result set"
    return None


def _snapshot(result: dict, ordered: bool) -> dict:
    rows = resultcmp.normalize(result["rows"], result["cols"], trim=False)
    return {"cols": list(result["cols"]), "rows": [list(r) for r in rows], "ordered": ordered}


def write_snapshots(target: Path, snapshots: dict[str, dict[str, dict]]) -> None:
    target.mkdir(parents=True, exist_ok=True)
    for topic, items in sorted(snapshots.items()):
        text = json.dumps(dict(sorted(items.items())), ensure_ascii=False, indent=1)
        (target / f"{topic}.json").write_text(text + "\n", encoding="utf-8")


# --- main --------------------------------------------------------------------------


def _engines_arg(value: str) -> list[str]:
    engines = [e.strip() for e in value.split(",") if e.strip()]
    if not engines or any(e not in ENGINES for e in engines):
        raise argparse.ArgumentTypeError(f"engines must be a comma list of {','.join(ENGINES)}")
    return list(dict.fromkeys(engines))


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Dual-engine SQL task runner")
    ap.add_argument("--engines", type=_engines_arg, default=list(ENGINES))
    ap.add_argument("--topic", help="only tasks of this topic, e.g. t08")
    ap.add_argument("--write-snapshots", type=Path, metavar="DIR")
    ap.add_argument("--content", type=Path, default=DEFAULT_CONTENT)
    ap.add_argument("--db-dir", type=Path, default=DEFAULT_DB_DIR)
    ap.add_argument("--fb-via", choices=("auto", "local", "compose"), default="auto")
    ap.add_argument("--timeout", type=int, default=TIMEOUT, help="seconds per engine batch")
    ap.add_argument("--job-timeout", type=float, default=JOB_TIMEOUT, help="seconds per task")
    args = ap.parse_args(argv)
    started = time.monotonic()

    try:
        tasks = load_tasks(args.content, args.topic)
    except TaskError as exc:
        print(f"ERROR {exc}")
        return 1
    if not tasks:
        print(f"no SQL tasks found in {args.content}" + (f" for {args.topic}" if args.topic else ""))
        return 0

    failures: dict[str, list[str]] = {}
    results: dict[tuple[str, str], dict] = {}  # (engine, task id) -> result
    by_db: dict[str, list[Task]] = {}
    for task in tasks:
        by_db.setdefault(task.db, []).append(task)

    for db, db_tasks in by_db.items():
        for engine in args.engines:
            selected = [t for t in db_tasks if engine in t.engines]
            if not selected:
                continue
            try:
                batch = {
                    "setup": setup_scripts(args.db_dir, db, engine),
                    "jobs": [
                        {"id": t.id, "sql": t.sql_for(engine), "kind": t.kind, "check": t.check}
                        for t in selected
                    ],
                    "job_timeout_ms": max(1, int(args.job_timeout * 1000)),
                }
                t0 = time.monotonic()
                out = run_engine(engine, batch, via=args.fb_via, timeout=args.timeout)
                print(f"ran {len(selected)} task(s) of {db} on {engine} in {time.monotonic() - t0:.1f}s")
            except (TaskError, EngineError) as exc:
                for t in selected:
                    failures.setdefault(t.id, []).append(f"{engine}: {exc}")
                continue
            if out.get("setup_error"):
                print(f"ERROR {db} on {engine}: {out['setup_error']}")
            for t in selected:
                results[(engine, t.id)] = out["results"].get(t.id)

    passed = skipped = 0
    snapshots: dict[str, dict[str, dict]] = {}
    for task in tasks:
        ran = [e for e in args.engines if e in task.engines]
        if not ran:
            skipped += 1
            print(f"SKIP {task.id}: engines {task.engines} not selected")
            continue
        problems = failures.get(task.id, [])
        if not problems:
            for engine in ran:
                msg = _check_result(task, engine, results.get((engine, task.id)))
                if msg:
                    problems.append(msg)
        if not problems and len(ran) == 2:
            fb, pg = results[("fb", task.id)], results[("pg", task.id)]
            if not resultcmp.equal(fb, pg, ordered=task.ordered, trim=False):
                order = "ordered" if task.ordered else "unordered"
                problems.append(f"fb and pg results differ ({order})\n    fb: {_short(fb)}\n    pg: {_short(pg)}")
        if problems:
            failures[task.id] = problems
            print(f"FAIL {task.id}: " + "\n    ".join(problems))
            continue
        passed += 1
        print(f"PASS {task.id}")
        source = "pg" if "pg" in ran else "fb"
        snapshots.setdefault(task.topic, {})[task.id] = _snapshot(results[(source, task.id)], task.ordered)

    failed = len(failures)
    elapsed = time.monotonic() - started
    print(f"{len(tasks)} tasks: {passed} passed, {failed} failed, {skipped} skipped in {elapsed:.1f}s")
    if failed:
        if args.write_snapshots:
            print("snapshots not written because of failures")
        return 1
    if args.write_snapshots:
        write_snapshots(args.write_snapshots, snapshots)
        print(f"snapshots written to {args.write_snapshots}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
