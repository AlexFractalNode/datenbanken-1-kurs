import os
import re
import subprocess
import sys
from pathlib import Path

import pytest

import resultcmp
import sqltest

REPO = Path(__file__).resolve().parent.parent
DB_DIR = REPO / "db"

TABLES = {
    "musikschule": [
        "person", "lehrkraft", "schueler", "instrument", "kurs", "raum",
        "belegung", "termin", "ausleihe", "vertretung", "zahlung",
    ],
    "firma": ["abteilung", "mitarbeiter", "projekt", "mitarbeit"],
}
MIN_ROWS = {"belegung": 40, "mitarbeit": 25}

# Data properties later SQL tasks rely on (each query returns one count).
PROPERTIES = {
    "musikschule": {
        "kurs_ohne_belegung": "SELECT COUNT(*) FROM kurs k WHERE NOT EXISTS (SELECT 1 FROM belegung b WHERE b.kurs_id = k.kurs_id)",
        "offene_ausleihe": "SELECT COUNT(*) FROM ausleihe WHERE rueckgabe IS NULL",
        "kurs_ohne_instrument": "SELECT COUNT(*) FROM kurs WHERE instrument_id IS NULL",
        "kurs_ohne_raum": "SELECT COUNT(*) FROM kurs WHERE raum_id IS NULL",
        "offene_zahlung": "SELECT COUNT(*) FROM zahlung WHERE bezahlt_am IS NULL",
        "lehrkraft_und_schueler": "SELECT COUNT(*) FROM lehrkraft l JOIN schueler s ON s.person_id = l.person_id",
        "person_ohne_rolle": (
            "SELECT COUNT(*) FROM person p WHERE NOT EXISTS (SELECT 1 FROM lehrkraft l WHERE l.person_id = p.person_id)"
            " AND NOT EXISTS (SELECT 1 FROM schueler s WHERE s.person_id = p.person_id)"
        ),
        "vertretungskette": "SELECT COUNT(*) FROM vertretung a JOIN vertretung b ON b.lehrkraft_id = a.vertreter_id",
        "abmeldung": "SELECT COUNT(*) FROM belegung WHERE abgemeldet_am IS NOT NULL",
    },
    "firma": {
        "ohne_vorgesetzten": "SELECT COUNT(*) FROM mitarbeiter WHERE vorgesetzter_id IS NULL",
        "ohne_abteilung": "SELECT COUNT(*) FROM mitarbeiter WHERE abteilung_id IS NULL",
        "abteilung_ohne_mitarbeiter": "SELECT COUNT(*) FROM abteilung a WHERE NOT EXISTS (SELECT 1 FROM mitarbeiter m WHERE m.abteilung_id = a.abteilung_id)",
        "abteilung_ohne_leitung": "SELECT COUNT(*) FROM abteilung WHERE leiter_id IS NULL",
        "projekt_ohne_mitarbeit": "SELECT COUNT(*) FROM projekt p WHERE NOT EXISTS (SELECT 1 FROM mitarbeit x WHERE x.projekt_id = p.projekt_id)",
        "provision_null": "SELECT COUNT(*) FROM mitarbeiter WHERE provision IS NULL",
        "hierarchie_tiefe_3": (
            "SELECT COUNT(*) FROM mitarbeiter a JOIN mitarbeiter b ON a.vorgesetzter_id = b.mitarbeiter_id"
            " JOIN mitarbeiter c ON b.vorgesetzter_id = c.mitarbeiter_id"
        ),
        "leiter_in_eigener_abteilung": "SELECT COUNT(*) FROM abteilung a JOIN mitarbeiter m ON m.mitarbeiter_id = a.leiter_id AND m.abteilung_id = a.abteilung_id",
    },
}
# Required minimum per property.
PROPERTY_MIN = {"leiter_in_eigener_abteilung": 5}

# Realism: each query counts violations and must return 0.
VIOLATIONS = {
    "musikschule": {
        "belegung_vor_eintritt": (
            "SELECT COUNT(*) FROM belegung b JOIN schueler s ON s.person_id = b.schueler_id"
            " WHERE b.angemeldet_am < s.eintritt"
        ),
        "zahlung_vor_anmeldung": (
            "SELECT COUNT(*) FROM zahlung z JOIN belegung b ON b.schueler_id = z.schueler_id AND b.kurs_id = z.kurs_id"
            " WHERE z.faellig_am < b.angemeldet_am OR z.bezahlt_am < b.angemeldet_am"
        ),
        "zahlung_ohne_belegung": (
            "SELECT COUNT(*) FROM zahlung z WHERE z.kurs_id IS NOT NULL AND NOT EXISTS"
            " (SELECT 1 FROM belegung b WHERE b.schueler_id = z.schueler_id AND b.kurs_id = z.kurs_id)"
        ),
        "zahlung_nach_abmeldung": (
            "SELECT COUNT(*) FROM zahlung z JOIN belegung b ON b.schueler_id = z.schueler_id AND b.kurs_id = z.kurs_id"
            " WHERE b.abgemeldet_am IS NOT NULL AND z.faellig_am > b.abgemeldet_am"
        ),
        "ausleihe_vor_eintritt": (
            "SELECT COUNT(*) FROM ausleihe a JOIN schueler s ON s.person_id = a.schueler_id WHERE a.ausgabe < s.eintritt"
        ),
        "leihzahlung_vor_ausgabe": (
            "SELECT COUNT(*) FROM zahlung z JOIN ausleihe a ON a.ausleihe_id = z.ausleihe_id"
            " WHERE z.faellig_am < a.ausgabe OR z.bezahlt_am < a.ausgabe OR z.schueler_id <> a.schueler_id"
        ),
        "kurs_vor_einstellung": (
            "SELECT COUNT(*) FROM kurs k JOIN lehrkraft l ON l.person_id = k.lehrkraft_id WHERE k.startdatum < l.eingestellt_am"
        ),
        "termin_ausserhalb_kurs": (
            "SELECT COUNT(*) FROM termin t JOIN kurs k ON k.kurs_id = t.kurs_id"
            " WHERE t.datum < k.startdatum OR t.datum > k.enddatum"
        ),
    },
    "firma": {
        "mitarbeit_nach_projektende_eingetreten": (
            "SELECT COUNT(*) FROM mitarbeit x JOIN mitarbeiter m ON m.mitarbeiter_id = x.mitarbeiter_id"
            " JOIN projekt p ON p.projekt_id = x.projekt_id WHERE p.enddatum IS NOT NULL AND m.eintritt > p.enddatum"
        ),
        "eintritt_vor_geschaeftsfuehrung": (
            "SELECT COUNT(*) FROM mitarbeiter m"
            " WHERE m.eintritt < (SELECT g.eintritt FROM mitarbeiter g WHERE g.vorgesetzter_id IS NULL)"
        ),
    },
}

# Primary key per table, for content comparison between the engines.
PRIMARY_KEYS = {
    "person": "person_id", "lehrkraft": "person_id", "schueler": "person_id", "instrument": "instrument_id",
    "kurs": "kurs_id", "raum": "raum_id", "belegung": "schueler_id, kurs_id", "termin": "termin_id",
    "ausleihe": "ausleihe_id", "vertretung": "vertretung_id", "zahlung": "zahlung_id",
    "abteilung": "abteilung_id", "mitarbeiter": "mitarbeiter_id", "projekt": "projekt_id",
    "mitarbeit": "mitarbeiter_id, projekt_id",
}


def _batch(db, engine):
    jobs = [{"id": f"rows:{t}", "kind": "query", "sql": f"SELECT COUNT(*) FROM {t}"} for t in TABLES[db]]
    jobs += [{"id": f"prop:{k}", "kind": "query", "sql": q} for k, q in PROPERTIES[db].items()]
    jobs += [{"id": f"bad:{k}", "kind": "query", "sql": q} for k, q in VIOLATIONS[db].items()]
    return {"setup": sqltest.setup_scripts(DB_DIR, db, engine), "jobs": jobs}


def _counts(db, engine):
    out = sqltest.run_engine(engine, _batch(db, engine))
    assert "setup_error" not in out, out.get("setup_error")
    counts = {}
    for key, res in out["results"].items():
        assert res["error"] is None, f"{db}/{engine} {key}: {res['error']}"
        counts[key] = res["rows"][0][0]
    return counts


def _assert_counts(db, counts):
    for table in TABLES[db]:
        assert counts[f"rows:{table}"] >= MIN_ROWS.get(table, 5), f"{db}.{table} has too few rows"
    for prop in PROPERTIES[db]:
        assert counts[f"prop:{prop}"] >= PROPERTY_MIN.get(prop, 1), f"{db}: property {prop} not met"
    for bad in VIOLATIONS[db]:
        assert counts[f"bad:{bad}"] == 0, f"{db}: {counts[f'bad:{bad}']} rows violate {bad}"


def _contents(db, engine):
    jobs = [
        {"id": t, "kind": "query", "sql": f"SELECT * FROM {t} ORDER BY {PRIMARY_KEYS[t]}"} for t in TABLES[db]
    ]
    out = sqltest.run_engine(engine, {"setup": sqltest.setup_scripts(DB_DIR, db, engine), "jobs": jobs})
    for table, res in out["results"].items():
        assert res["error"] is None, f"{db}/{engine} {table}: {res['error']}"
    return out["results"]


@pytest.mark.parametrize("db", sorted(TABLES))
def test_db_loads_in_pglite(db):
    _assert_counts(db, _counts(db, "pg"))


@pytest.mark.parametrize("db", sorted(TABLES))
def test_pg_tables_match_documented_names(db):
    batch = {
        "setup": sqltest.setup_scripts(DB_DIR, db, "pg"),
        "jobs": [{
            "id": "t",
            "kind": "query",
            "sql": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1",
        }],
    }
    res = sqltest.run_engine("pg", batch)["results"]["t"]
    assert res["error"] is None
    assert [r[0] for r in res["rows"]] == sorted(TABLES[db])
    readme = (DB_DIR / db / "README.md").read_text(encoding="utf-8")
    for table in TABLES[db]:
        assert f"`{table}`" in readme
    erd = (DB_DIR / db / "erd.dot").read_text(encoding="utf-8")
    assert re.search(rf"^graph {db} \{{", erd, re.M), "erd.dot must define an undirected graph named after the db"


@pytest.mark.parametrize("db", sorted(TABLES))
def test_seed_is_deterministic(db, tmp_path):
    out = tmp_path / "seed.sql"
    proc = subprocess.run(
        [sys.executable, str(DB_DIR / db / "generate.py"), "--seed", "42", "--out", str(out)],
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0, proc.stderr
    committed = (DB_DIR / db / "seed.sql").read_text(encoding="utf-8")
    assert out.read_text(encoding="utf-8") == committed
    other = tmp_path / "other.sql"
    subprocess.run([sys.executable, str(DB_DIR / db / "generate.py"), "--seed", "7", "--out", str(other)], check=True)
    assert other.read_text(encoding="utf-8") != committed


@pytest.mark.parametrize("db", sorted(TABLES))
def test_firebird_ddl_features(db):
    ddl = (DB_DIR / db / "schema.sql").read_text(encoding="utf-8").upper()
    assert "GENERATED BY DEFAULT AS IDENTITY" in ddl
    assert "CREATE DOMAIN" in ddl
    assert "ON DELETE CASCADE" in ddl or "ON DELETE SET NULL" in ddl


@pytest.mark.firebird
@pytest.mark.parametrize("db", sorted(TABLES))
def test_db_loads_in_firebird_like_pglite(db):
    ok, reason = sqltest.fb_available()
    if not ok:
        if os.environ.get("SQLTEST_REQUIRE_FB") == "1":
            pytest.fail(f"Firebird required but not available: {reason}")
        pytest.skip(f"Firebird not available: {reason}")
    fb = _counts(db, "fb")
    _assert_counts(db, fb)
    assert fb == _counts(db, "pg")
    fb_rows, pg_rows = _contents(db, "fb"), _contents(db, "pg")
    for table in TABLES[db]:
        a, b = fb_rows[table], pg_rows[table]
        assert [c.lower() for c in a["cols"]] == b["cols"], table
        assert resultcmp.equal(a, b, ordered=True, trim=False), f"{db}.{table} differs between fb and pg"
