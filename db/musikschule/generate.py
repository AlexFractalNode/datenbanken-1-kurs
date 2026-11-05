#!/usr/bin/env python3
"""Generate seed.sql for the Musikschule sample database.

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
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

VORNAMEN = [
    "Lena", "Jonas", "Mia", "Paul", "Emma", "Felix", "Clara", "Moritz", "Ida", "Theo",
    "Greta", "Karl", "Frieda", "Lukas", "Marie", "Elias", "Nora", "Jakob", "Lotte", "Simon",
    "Paula", "Anton", "Fenja", "Noah", "Mila", "Leon", "Ella", "David", "Sophie", "Erik",
    "Amelie", "Ben", "Lina", "Oskar", "Rosa", "Till", "Wilma", "Henri", "Marta", "Ole",
    "Jule", "Malte", "Tilda", "Janne",
]
NACHNAMEN = [
    "Becker", "Hoffmann", "Schulz", "Koch", "Richter", "Wolf", "Neumann", "Schwarz",
    "Zimmermann", "Braun", "Krüger", "Hartmann", "Lange", "Schmitt", "Werner", "Krause",
    "Meier", "Lehmann", "Huber", "Kaiser", "Fuchs", "Peters", "Lang", "Scholz", "Möller",
    "Weiß", "Jung", "Hahn", "Vogel", "Friedrich", "Keller", "Berger", "Winkler", "Roth",
    "Beck", "Lorenz", "Sommer", "Brandt", "Graf", "Haas",
]
ORTE = ["Lindenau", "Bergheim", "Talhausen", "Neustadt", "Wiesenfeld", "Altdorf"]

# bezeichnung, familie, leihgebuehr (None = nicht ausleihbar), Inventar-Praefix
INSTRUMENTE = [
    ("Klavier", "Tasten", None, "KL"),
    ("Violine", "Streich", "15.00", "VL"),
    ("Viola", "Streich", "15.00", "VA"),
    ("Violoncello", "Streich", "25.00", "VC"),
    ("Gitarre", "Zupf", "10.00", "GI"),
    ("E-Bass", "Zupf", "12.00", "EB"),
    ("Querflöte", "Blas", "12.00", "QF"),
    ("Klarinette", "Blas", "14.00", "KN"),
    ("Trompete", "Blas", "14.00", "TR"),
    ("Schlagzeug", "Schlag", None, "SZ"),
    ("Ukulele", "Zupf", "6.00", "UK"),
]
# bezeichnung, etage, plaetze, hat_klavier
RAEUME = [
    ("R101", 1, 4, True),
    ("R102", 1, 2, True),
    ("R201", 2, 6, False),
    ("R202", 2, 3, False),
    ("Saal", 0, 30, True),
    ("Keller", -1, 5, False),
]
# Lehrkraefte: Hauptinstrument (Name oder None)
LEHRKRAFT_INSTRUMENT = [
    "Klavier", "Violine", "Gitarre", "Querflöte", "Violoncello", "Schlagzeug", "Klarinette", None,
]
# titel, instrument, lehrkraft (1-basiert), raum, niveau, max, gebuehr, start, ende, wochentag, uhrzeit, dauer, belegbar
KURSE = [
    ("Klavier für Einsteiger", "Klavier", 1, "R101", "Anfaenger", 4, "62.00", "2024-09-02", None, 0, "15:00", 45, True),
    ("Klavier Mittelstufe", "Klavier", 1, "R102", "Mittelstufe", 2, "78.00", "2024-09-02", None, 1, "16:00", 60, True),
    ("Violine Grundkurs", "Violine", 2, "R201", "Anfaenger", 5, "58.00", "2024-09-02", None, 2, "15:30", 45, True),
    ("Gitarre in der Gruppe", "Gitarre", 3, "R201", "Anfaenger", 6, "45.00", "2024-09-02", None, 0, "17:00", 60, True),
    ("Gitarre für Fortgeschrittene", "Gitarre", 3, "R202", "Fortgeschritten", 3, "55.00", "2024-09-02", None, 3, "18:00", 60, True),
    ("Querflöte Mittelstufe", "Querflöte", 4, "R202", "Mittelstufe", 3, "64.00", "2024-09-02", None, 1, "14:30", 45, True),
    ("Cello für Erwachsene", "Violoncello", 5, "R201", "Anfaenger", 4, "66.00", "2024-09-02", "2025-01-31", 3, "19:00", 60, True),
    ("Schlagzeug-Workshop", "Schlagzeug", 6, "Keller", "Anfaenger", 5, "50.00", "2024-09-02", "2024-12-20", 4, "16:30", 90, True),
    ("Klarinetten-Ensemble", "Klarinette", 7, "Saal", "Fortgeschritten", 8, "40.00", "2024-09-02", None, 2, "18:30", 90, True),
    ("Musiktheorie", None, 8, None, "Anfaenger", 12, "25.00", "2024-09-02", None, 4, "15:00", 45, True),
    ("Chor", None, 8, "Saal", "Anfaenger", 30, "20.00", "2024-09-02", None, 3, "17:30", 90, True),
    ("Jazz-Improvisation", "Klavier", 1, "R101", "Fortgeschritten", 4, "85.00", "2025-02-03", None, 0, "18:00", 60, False),
    ("Trompete Grundkurs", "Trompete", 7, "R202", "Anfaenger", 3, "60.00", "2025-02-03", None, 1, "15:00", 45, False),
]
BESCHREIBUNG = {
    "Musiktheorie": "Noten lesen, Intervalle, Rhythmus. Der Raum wechselt je nach Termin.",
    "Chor": "Offen für alle Altersgruppen, keine Vorkenntnisse nötig.",
    "Jazz-Improvisation": "Geplanter Kurs, Anmeldung ab Januar.",
}
GRUENDE = ["Krankheit", "Fortbildung", "Konzertreise", None]
ZAHLUNGSARTEN = ["Ueberweisung", "Lastschrift", "Bar"]

N_LEHRKRAEFTE = 8
N_SCHUELER = 30  # zusaetzlich ist Lehrkraft 5 auch Schueler(in)
MONATE = [dt.date(2024, 9, 1), dt.date(2024, 10, 1), dt.date(2024, 11, 1)]


def lit(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, Decimal)):
        return str(value)
    if isinstance(value, dt.date):
        return f"DATE '{value.isoformat()}'"
    if isinstance(value, dt.time):
        return f"TIME '{value.strftime('%H:%M:%S')}'"
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    raise TypeError(f"unsupported value {value!r}")


class Script:
    def __init__(self) -> None:
        self.lines: list[str] = []
        self.counter: dict[str, int] = {}

    def comment(self, text: str) -> None:
        self.lines.append(f"\n-- {text}")

    def insert(self, table: str, cols: list[str], values: list, identity: bool = True) -> int:
        """Append one INSERT; returns the identity value the row will get."""
        row_id = self.counter.get(table, 0) + 1
        self.counter[table] = row_id
        sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(lit(v) for v in values)});"
        if identity:
            sql += f" -- {row_id}"
        self.lines.append(sql)
        return row_id

    def raw(self, sql: str) -> None:
        self.lines.append(sql)


def d(text: str) -> dt.date:
    return dt.date.fromisoformat(text)


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def rand_date(rng: random.Random, start: dt.date, end: dt.date) -> dt.date:
    return start + dt.timedelta(days=rng.randint(0, (end - start).days))


def build(seed: int) -> str:
    rng = random.Random(seed)
    s = Script()
    names = list(zip(rng.sample(VORNAMEN, N_LEHRKRAEFTE + N_SCHUELER + 1),
                     rng.sample(NACHNAMEN, N_LEHRKRAEFTE + N_SCHUELER + 1)))

    s.comment("instrument")
    instrument_id = {}
    for name, familie, gebuehr, _ in INSTRUMENTE:
        instrument_id[name] = s.insert(
            "instrument", ["bezeichnung", "familie", "leihgebuehr"],
            [name, familie, Decimal(gebuehr) if gebuehr else None])

    s.comment("raum")
    raum_id = {}
    raum_plaetze = {}
    for name, etage, plaetze, klavier in RAEUME:
        raum_id[name] = s.insert("raum", ["bezeichnung", "etage", "plaetze", "hat_klavier"],
                                 [name, etage, plaetze, klavier])
        raum_plaetze[name] = plaetze

    s.comment("person: 1-8 Lehrkraefte, 9-38 Schueler, 39 Interessent(in) ohne Rolle")
    person_cols = ["vorname", "nachname", "geburtsdatum", "email", "telefon", "ort"]
    persons = []
    for i, (vor, nach) in enumerate(names):
        teacher = i < N_LEHRKRAEFTE
        if teacher:
            geb = rand_date(rng, d("1965-01-01"), d("1995-12-31"))
        elif rng.random() < 0.25:
            geb = rand_date(rng, d("1960-01-01"), d("2000-12-31"))
        else:
            geb = rand_date(rng, d("2007-01-01"), d("2018-12-31"))
        if not teacher and rng.random() < 0.08:
            geb = None
        local = (vor + "." + nach).lower()
        for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
            local = local.replace(a, b)
        email = f"{local}@example.org" if teacher or rng.random() < 0.7 else None
        # area code 000 does not exist, so no number can belong to a real person
        telefon = f"000 {rng.randint(100000, 999999)}" if rng.random() < 0.8 else None
        pid = s.insert("person", person_cols, [vor, nach, geb, email, telefon, rng.choice(ORTE)])
        persons.append((pid, geb))

    s.comment("lehrkraft (Subtyp von person)")
    lehrkraefte = []
    for i in range(N_LEHRKRAEFTE):
        pid = persons[i][0]
        haupt = LEHRKRAFT_INSTRUMENT[i]
        s.insert("lehrkraft", ["person_id", "eingestellt_am", "stundensatz", "hauptinstrument_id"],
                 [pid, rand_date(rng, d("2010-01-01"), d("2023-08-31")),
                  money(Decimal(rng.randint(64, 96)) / 2),
                  instrument_id[haupt] if haupt else None], identity=False)
        lehrkraefte.append(pid)

    s.comment("schueler (Subtyp von person); person 5 ist zugleich Lehrkraft")
    schueler = []
    ermaessigt = {}
    for pid, geb in [persons[4]] + persons[N_LEHRKRAEFTE:N_LEHRKRAEFTE + N_SCHUELER]:
        young = geb is not None and geb.year >= 2007
        erm = young and rng.random() < 0.3
        s.insert("schueler", ["person_id", "eintritt", "ermaessigt"],
                 [pid, rand_date(rng, d("2019-01-01"), d("2024-09-01")), erm], identity=False)
        schueler.append(pid)
        ermaessigt[pid] = erm

    s.comment("kurs")
    kurse = []
    for (titel, instr, lk, raum, niveau, maxt, gebuehr, start, ende, wtag, uhr, dauer, belegbar) in KURSE:
        kid = s.insert(
            "kurs",
            ["titel", "instrument_id", "lehrkraft_id", "raum_id", "niveau", "max_teilnehmer",
             "gebuehr_monat", "startdatum", "enddatum", "beschreibung"],
            [titel, instrument_id[instr] if instr else None, lehrkraefte[lk - 1],
             raum_id[raum] if raum else None, niveau, maxt, Decimal(gebuehr), d(start),
             d(ende) if ende else None, BESCHREIBUNG.get(titel)])
        kurse.append({"id": kid, "titel": titel, "lehrkraft": lehrkraefte[lk - 1], "raum": raum, "max": maxt,
                      "gebuehr": Decimal(gebuehr), "start": d(start), "ende": d(ende) if ende else None,
                      "wtag": wtag, "uhr": uhr, "dauer": dauer, "belegbar": belegbar, "teilnehmer": []})

    s.comment("belegung (m:n schueler-kurs)")
    belegungen = []
    offen = [k for k in kurse if k["belegbar"]]
    for pid in schueler:
        wanted = rng.choices([1, 2, 3], weights=[4, 4, 1])[0]
        choices = [k for k in offen if k["lehrkraft"] != pid]
        rng.shuffle(choices)
        taken = 0
        for k in choices:
            if taken == wanted:
                break
            if len(k["teilnehmer"]) >= k["max"]:
                continue
            angemeldet = rand_date(rng, k["start"] - dt.timedelta(days=30), k["start"] + dt.timedelta(days=40))
            abgemeldet = None
            if rng.random() < 0.12:
                abgemeldet = angemeldet + dt.timedelta(days=rng.randint(30, 90))
            rabatt = 20 if ermaessigt[pid] else (10 if rng.random() < 0.1 else 0)
            k["teilnehmer"].append(pid)
            belegungen.append((pid, k, angemeldet, abgemeldet, rabatt))
            taken += 1
    belegungen.sort(key=lambda b: (b[1]["id"], b[0]))
    for pid, k, angemeldet, abgemeldet, rabatt in belegungen:
        s.insert("belegung", ["schueler_id", "kurs_id", "angemeldet_am", "abgemeldet_am", "rabatt_prozent"],
                 [pid, k["id"], angemeldet, abgemeldet, rabatt], identity=False)

    s.comment("termin (je belegtem Kurs acht Wochen ab 2. September 2024)")
    for k in kurse:
        if not k["teilnehmer"]:
            continue
        h, m = (int(x) for x in k["uhr"].split(":"))
        for week in range(8):
            datum = k["start"] + dt.timedelta(days=k["wtag"] + 7 * week)
            ausweich = None
            if k["raum"] is None or rng.random() < 0.1:
                fits = [r for r, p in raum_plaetze.items() if p >= len(k["teilnehmer"]) and r != k["raum"]]
                if fits:  # a full Saal has no alternative
                    ausweich = raum_id[rng.choice(fits)]
            s.insert("termin", ["kurs_id", "datum", "uhrzeit", "dauer_min", "raum_id", "ausgefallen"],
                     [k["id"], datum, dt.time(h, m), k["dauer"], ausweich, rng.random() < 0.08])

    s.comment("ausleihe (rueckgabe NULL = noch ausgeliehen)")
    leihbar = [(name, prefix) for name, _, gebuehr, prefix in INSTRUMENTE if gebuehr and name != "Ukulele"]
    ausleihen = []
    inventar_used: set[str] = set()
    for i in range(12):
        pid = rng.choice(schueler)
        name, prefix = rng.choice(leihbar)
        while True:
            inv = f"{prefix}-{rng.randint(1, 40):03d}"
            if inv not in inventar_used:
                inventar_used.add(inv)
                break
        ausgabe = rand_date(rng, d("2024-08-15"), d("2025-01-15"))
        rueckgabe = None if i % 3 == 0 else ausgabe + dt.timedelta(days=rng.randint(21, 150))
        aid = s.insert("ausleihe", ["instrument_id", "schueler_id", "inventar_nr", "ausgabe", "rueckgabe"],
                       [instrument_id[name], pid, inv, ausgabe, rueckgabe])
        ausleihen.append((aid, pid, name, ausgabe))

    s.comment("vertretung (rekursiv lehrkraft-lehrkraft); 1->2->3 bildet eine Kette")
    pairs = [(1, 2), (2, 3), (4, 7), (6, 3), (8, 1), (5, 2)]
    for i, (vertreten, vertreter) in enumerate(pairs):
        von = rand_date(rng, d("2024-09-09"), d("2024-10-21"))
        bis = von + dt.timedelta(days=rng.choice([0, 2, 6, 13]))
        s.insert("vertretung", ["lehrkraft_id", "vertreter_id", "von", "bis", "grund"],
                 [lehrkraefte[vertreten - 1], lehrkraefte[vertreter - 1], von, bis, GRUENDE[i % len(GRUENDE)]])

    s.comment("zahlung (bezahlt_am NULL = offen)")
    gebuehr = {name: Decimal(g) for name, _, g, _ in INSTRUMENTE if g}
    zahlung_cols = ["schueler_id", "kurs_id", "ausleihe_id", "betrag", "faellig_am", "bezahlt_am", "zahlungsart"]
    for pid, k, angemeldet, abgemeldet, rabatt in belegungen:
        betrag = money(k["gebuehr"] * (100 - rabatt) / 100)
        for monat in MONATE:
            if abgemeldet and abgemeldet < monat:
                break
            if angemeldet >= (monat + dt.timedelta(days=31)).replace(day=1):
                continue  # registered after this month
            faellig = monat + dt.timedelta(days=14)
            unpaid = rng.random() < (0.35 if monat == MONATE[-1] else 0.05)
            bezahlt = None if unpaid else faellig + dt.timedelta(days=rng.randint(-14, 20))
            art = None if unpaid else rng.choice(ZAHLUNGSARTEN)
            s.insert("zahlung", zahlung_cols, [pid, k["id"], None, betrag, faellig, bezahlt, art])
    for aid, pid, name, ausgabe in ausleihen:
        faellig = ausgabe + dt.timedelta(days=14)
        paid = rng.random() < 0.7
        s.insert("zahlung", zahlung_cols,
                 [pid, None, aid, gebuehr[name], faellig,
                  faellig + dt.timedelta(days=rng.randint(0, 10)) if paid else None,
                  rng.choice(ZAHLUNGSARTEN) if paid else None])

    header = [
        "-- Beispieldaten Musikschule (synthetisch, alle Personen erfunden).",
        f"-- Erzeugt mit: python db/musikschule/generate.py --seed {seed}",
        "-- Nicht von Hand bearbeiten. Laeuft auf Firebird 3 und PostgreSQL.",
        "-- Kommentar am Zeilenende: der Identity-Wert, den die Zeile erhaelt.",
    ]
    return "\n".join(header + s.lines) + "\n"


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
