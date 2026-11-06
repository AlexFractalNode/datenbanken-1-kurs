# Datenbanken 1 – offener Lernkurs

Ein frei nutzbarer, deutschsprachiger Lernkurs zu den Grundlagen relationaler Datenbanken: in eigenen Worten geschrieben, auf Basis offener Quellen, mit Übungen zum Selbstlernen.

**Web-App:** <https://alexfractalnode.github.io/datenbanken-1-kurs/>

## Inhalt

13 Themen, von den Grundlagen über ER-Modellierung, das relationale Modell, Normalisierung und relationale Algebra bis zu SQL (DDL, DQL, DML), Views, Triggern, Indexen und Anwendungszugriff. Zu jedem Thema gibt es:

- eine Zusammenfassung mit Quellenangaben und eine Liste typischer Fehler,
- Karteikarten mit Wiederholungsplanung (FSRS),
- Quizfragen mit Sofort-Feedback,
- Papier-Aufgaben mit Musterlösung und Bewertungsraster zur Selbstkontrolle,
- SQL-Aufgaben, die im Browser-Playground (PGlite) laufen. Firebird-3-Besonderheiten sind gekennzeichnet.

Dazu kommen zwei Probeklausuren (90 Minuten), ein Glossar, ein Cheatsheet, eine Checkliste für einen selbst geschriebenen Spickzettel und ein Lernplan.

## Downloads

PDFs (Aufgaben, Lösungen, Probeklausuren, Cheatsheet) und Anki-Pakete gibt es auf der Downloads-Seite der Web-App und als Assets der jeweiligen Release.

## Lokal arbeiten

Voraussetzungen: Python mit [uv](https://docs.astral.sh/uv/), Node.js, für Firebird-Tests Docker oder Podman.

```bash
uv run tools/check.py                                          # alle Prüfungen wie in der CI
uv run pytest -q                                               # Python-Tests
docker compose -f docker-compose.test.yml up -d firebird       # Firebird 3 für SQL-Tests
uv run tools/sqltest.py --engines fb,pg --topic t10            # SQL-Aufgaben eines Themas prüfen
cd web && npm ci && npm run dev                                # Web-App lokal
```

Die Inhalte liegen als Text unter `content/` (Schemas in `schema/`), die Beispieldatenbanken unter `db/`. Unterschiede zwischen Firebird 3 und PostgreSQL sind in `db/DIALECT-NOTES.md` gesammelt.

## Disclaimer

Dieses Projekt ist **inoffiziell**. Es wurde von Studierenden erstellt und weder von einer Hochschule noch von Lehrenden erstellt oder geprüft. Alle Angaben sind ohne Gewähr. Maßgeblich sind immer die Unterlagen und Vorgaben deiner eigenen Lehrveranstaltung. Fehler bitte als Issue melden.

## Sprachen

Inhalte und Oberfläche sind auf Deutsch, eine englische Fassung folgt (v1.1). Code, Bezeichner und Commit-Nachrichten sind auf Englisch.

## Lizenz

- Inhalte: [CC BY-SA 4.0](LICENSE-CONTENT)
- Code: [MIT](LICENSE)
- Verwendete Quellen und ihre Lizenzen: [`sources.yml`](sources.yml)

Copyright 2026 Alexander (AlexFractalNode)

## Mitmachen

Fehler gefunden oder eine Idee? Siehe [CONTRIBUTING.md](CONTRIBUTING.md).
