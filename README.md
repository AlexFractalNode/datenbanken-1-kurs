# Datenbanken 1 – offener Lernkurs

Entwurf. Ein frei nutzbarer, deutschsprachiger Lernkurs zu den Grundlagen relationaler Datenbanken.

## Was

Zusammenfassungen, Lernkarten, Quizfragen, Übungsaufgaben, SQL-Aufgaben und Probeklausuren zu 13 Themen
(von Grundlagen und Datenbankmodellen über ER-Modellierung, relationale Algebra und SQL bis zu Normalisierung und Transaktionen).

## Wie

- Inhalte liegen als Textdateien unter `content/`; die Themenübersicht steht in `content/topics.yml`.
- Eine statische Webseite (Astro + Preact) stellt sie interaktiv dar und wird über GitHub Pages veröffentlicht.
- SQL-Aufgaben laufen gegen Firebird 3 (Docker, in der CI) und PGlite (im Browser).
- Werkzeuge zur Prüfung der Inhalte liegen unter `tools/`, Tests unter `tests/` (`uv run pytest`).

## Disclaimer

Dieses Projekt ist inoffiziell, von Studierenden erstellt und ohne Gewähr.
Es stammt nicht vom Dozenten oder von der Hochschule.

## Sprachen

Inhalte und Oberfläche: Deutsch. Code, Bezeichner und Commit-Nachrichten: Englisch.

## Lizenz

- Inhalte: [CC BY-SA 4.0](LICENSE-CONTENT)
- Code: [MIT](LICENSE)

Copyright 2026 Alexander (AlexFractalNode)

## Mitmachen

Fehler gefunden oder Verbesserungsidee? Siehe [CONTRIBUTING.md](CONTRIBUTING.md).
