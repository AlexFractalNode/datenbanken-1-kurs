#!/usr/bin/env python3
"""Generate seed.sql for the Firma sample database.

Usage: generate.py [--seed 42] [--out PATH|-]

The output is deterministic for a given seed and runs unchanged on
Firebird 3 and PostgreSQL. Identity values are not inserted explicitly:
both engines number a fresh identity column 1, 2, 3, ... in insert order,
and the generator relies on that order (see db/DIALECT-NOTES.md).
All persons are invented; names come from the small lists below.
"""
from __future__ import annotations

import argparse
import datetime as dt
import random
import sys
from decimal import Decimal
from pathlib import Path

VORNAMEN = [
    "Anja", "Bernd", "Carla", "Dirk", "Elif", "Frank", "Gesa", "Holger", "Ines", "Jens",
    "Katrin", "Lars", "Merle", "Niklas", "Olga", "Pia", "Ralf", "Svenja", "Timo", "Ute",
    "Volker", "Yvonne", "Kerstin", "Sven", "Birgit", "Heiko", "Silke", "Uwe", "Petra", "Rainer",
    "Tanja", "Marco", "Doris", "Kai", "Nadine", "Yusuf",
]
NACHNAMEN = [
    "Albers", "Bauer", "Conrad", "Dietrich", "Ebert", "Frank", "Gerlach", "Horn", "Jäger", "Kühn",
    "Ludwig", "Martens", "Nowak", "Otto", "Pohl", "Quast", "Reuter", "Seidel", "Thiel", "Unger",
    "Voigt", "Wagner", "Ziegler", "Böhm", "Engel", "Franke", "Günther", "Heinrich", "Kraft", "Simon",
    "Arnold", "Busch", "Schäfer", "Mertens",
]
# bezeichnung, standort; Abteilung 6 hat (noch) keine Mitarbeitenden und keine Leitung
ABTEILUNGEN = [
    ("Geschäftsführung", "Nordstadt"),
    ("Vertrieb", "Südhafen"),
    ("Entwicklung", "Westpark"),
    ("Personal", "Nordstadt"),
    ("Einkauf", "Südhafen"),
    ("Forschung", "Westpark"),
]
# Mitarbeitende je Abteilung ohne die Leitung
STAB = {1: 1, 2: 6, 4: 3, 5: 3}
ENTWICKLUNG_TEAMS = 2       # Teamleitungen unter der Abteilungsleitung Entwicklung
ENTWICKLUNG_PRO_TEAM = 4
# titel, abteilung, start, ende, budget, mit Mitarbeit?
PROJEKTE = [
    ("Webshop-Relaunch", 3, "2023-03-01", "2024-02-29", "180000.00", True),
    ("CRM-Einführung", 2, "2023-09-01", None, "95000.00", True),
    ("Lagerumstellung", 5, "2024-01-15", "2024-10-31", "60000.00", True),
    ("Mitarbeiterportal", 4, "2024-02-01", None, "40000.00", True),
    ("Datenplattform", 3, "2024-05-01", None, None, True),
    ("Messeauftritt 2025", 2, "2024-11-01", None, "25000.00", True),
    ("Sensorstudie", 6, "2025-01-07", None, "120000.00", True),
    ("Archivdigitalisierung", 4, "2025-03-01", None, "15000.00", False),
]
BESCHREIBUNG = {
    "Datenplattform": "Zentrale Auswertung der Vertriebs- und Lagerdaten; Budget noch offen.",
    "Sensorstudie": "Machbarkeitsstudie der neuen Abteilung Forschung.",
    "Archivdigitalisierung": "Geplant, noch ohne Projektteam.",
}
ROLLEN = ["Entwicklung", "Beratung", "Test", "Fachbereich", None]


def lit(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, Decimal)):
        return str(value)
    if isinstance(value, dt.date):
        return f"DATE '{value.isoformat()}'"
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    raise TypeError(f"unsupported value {value!r}")


def d(text: str) -> dt.date:
    return dt.date.fromisoformat(text)


def rand_date(rng: random.Random, start: dt.date, end: dt.date) -> dt.date:
    return start + dt.timedelta(days=rng.randint(0, (end - start).days))


def build(seed: int) -> str:
    rng = random.Random(seed)
    lines: list[str] = []
    counter: dict[str, int] = {}

    def insert(table: str, cols: list[str], values: list, identity: bool = True) -> int:
        row_id = counter.get(table, 0) + 1
        counter[table] = row_id
        sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(lit(v) for v in values)});"
        lines.append(sql + (f" -- {row_id}" if identity else ""))
        return row_id

    lines.append("\n-- abteilung (leiter_id wird nach mitarbeiter gesetzt)")
    for bez, ort in ABTEILUNGEN:
        insert("abteilung", ["bezeichnung", "standort", "leiter_id"], [bez, ort, None])

    # (abteilung_id or None, vorgesetzter index or None, stufe)
    plan: list[tuple[int | None, int | None, str]] = [(1, None, "gf")]
    leitung = {1: 0}
    for abt in (2, 3, 4, 5):
        leitung[abt] = len(plan)
        plan.append((abt, 0, "leitung"))
    for abt, n in STAB.items():
        plan += [(abt, leitung[abt], "stab")] * n
    for _ in range(ENTWICKLUNG_TEAMS):
        team = len(plan)
        plan.append((3, leitung[3], "team"))
        plan += [(3, team, "stab")] * ENTWICKLUNG_PRO_TEAM
    plan.append((None, leitung[3], "werkstudent"))

    names = list(zip(rng.sample(VORNAMEN, len(plan)), rng.sample(NACHNAMEN, len(plan))))
    gehalt_range = {"gf": (190, 220), "leitung": (120, 160), "team": (100, 120), "stab": (60, 100),
                    "werkstudent": (24, 26)}
    lines.append("\n-- mitarbeiter (vorgesetzter_id rekursiv, NULL = Geschaeftsfuehrung)")
    ids: list[int] = []
    abteilung_of: list[int | None] = []
    eintritt_of: list[dt.date] = []
    cols = ["vorname", "nachname", "email", "eintritt", "gehalt", "provision", "abteilung_id", "vorgesetzter_id"]
    for (vor, nach), (abt, boss, stufe) in zip(names, plan):
        local = (vor + "." + nach).lower()
        for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
            local = local.replace(a, b)
        eintritt = d("2008-04-01") if stufe == "gf" else rand_date(
            rng, d("2024-04-01") if stufe == "werkstudent" else d("2009-01-01"), d("2024-10-01"))
        lo, hi = gehalt_range[stufe]
        gehalt = Decimal(rng.randint(lo, hi) * 50).quantize(Decimal("0.01"))
        provision = Decimal(rng.randint(8, 36) * 25).quantize(Decimal("0.01")) if abt == 2 else None
        mid = insert("mitarbeiter", cols, [vor, nach, f"{local}@firma.example", eintritt, gehalt, provision,
                                           abt, ids[boss] if boss is not None else None])
        ids.append(mid)
        abteilung_of.append(abt)
        eintritt_of.append(eintritt)

    lines.append("\n-- Leitung der Abteilungen (1:1)")
    for abt, idx in sorted(leitung.items()):
        lines.append(f"UPDATE abteilung SET leiter_id = {ids[idx]} WHERE abteilung_id = {abt};")

    lines.append("\n-- projekt")
    projekte = []
    for titel, abt, start, ende, budget, besetzt in PROJEKTE:
        pid = insert("projekt", ["titel", "abteilung_id", "startdatum", "enddatum", "budget", "beschreibung"],
                     [titel, abt, d(start), d(ende) if ende else None, Decimal(budget) if budget else None,
                      BESCHREIBUNG.get(titel)])
        projekte.append((pid, abt, besetzt, d(ende) if ende else None))

    lines.append("\n-- mitarbeit (m:n mitarbeiter-projekt mit Stunden)")
    for pid, abt, besetzt, ende in projekte:
        if not besetzt:
            continue
        # only people who joined the company before the project ended
        eligible = [i for i in range(1, len(abteilung_of)) if ende is None or eintritt_of[i] <= ende]
        own = [i for i in eligible if abteilung_of[i] == abt]
        others = [i for i in eligible if abteilung_of[i] != abt]
        team = rng.sample(own, min(len(own), rng.randint(2, 4))) + rng.sample(others, rng.randint(2, 4))
        team.sort()
        own_team = [i for i in team if abteilung_of[i] == abt]
        lead = own_team[0] if own_team else team[0]  # lead from the responsible department
        for i in team:
            stunden = Decimal(rng.randint(20, 840)) / 2
            rolle = "Projektleitung" if i == lead else rng.choice(ROLLEN)
            insert("mitarbeit", ["mitarbeiter_id", "projekt_id", "stunden", "rolle"],
                   [ids[i], pid, stunden.quantize(Decimal("0.1")), rolle], identity=False)

    header = [
        "-- Beispieldaten Firma (synthetisch, alle Personen erfunden).",
        f"-- Erzeugt mit: python db/firma/generate.py --seed {seed}",
        "-- Nicht von Hand bearbeiten. Laeuft auf Firebird 3 und PostgreSQL.",
        "-- Kommentar am Zeilenende: der Identity-Wert, den die Zeile erhaelt.",
    ]
    return "\n".join(header + lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent / "seed.sql"),
                    help="output file, '-' for stdout")
    args = ap.parse_args(argv)
    text = build(args.seed)
    if args.out == "-":
        sys.stdout.buffer.write(text.encode("utf-8"))
    else:
        Path(args.out).write_text(text, encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
