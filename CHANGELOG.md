# Changelog

## [1.0.0] – 2026-11-08

### Inhalt
- 13 Themen mit Zusammenfassung, typischen Fehlern, Karteikarten, Quiz, Papier-Aufgaben (Lösung und Bewertungsraster) und SQL-Aufgaben, alle mit Status `reviewed`.
- Zwei Probeklausuren (je 90 Minuten) mit Musterlösung und Bewertungsraster.
- Glossar, Cheatsheet, Spickzettel-Checkliste und Lernplan.
- Beispieldatenbanken `musikschule` und `firma` für Firebird 3 und PostgreSQL, Dialekt-Notizen mit am System geprüften Unterschieden.
- Quellenverzeichnis `sources.yml` mit Lizenzangaben.

### Web-App
- Themenseiten, Karteikarten (FSRS), Quiz, Aufgaben mit Selbstbewertung, Klausursimulation mit Timer.
- SQL-Playground im Browser (PGlite) mit Auto-Check, Ohne-Rechner-Modus und Schema-Diagramm.
- Dashboard mit Fortschritt, fälligen Karten und Tageslimit für neue Karten.
- Glossar-, Cheatsheet-, Spickzettel-, Lernplan- und Downloads-Seite.
- Fortschritt lokal im Browser, mit Export, Import und Reset.

### Werkzeuge und CI
- Schema-Validierung, SQL-Runner für Firebird 3 und PostgreSQL, Ergebnisvergleich, Link-Check.
- PDF-Export (Typst) und Anki-Export.
- CI mit Tests, SQL-Tests, Web-Build, Playwright-Smoke und Deploy auf GitHub Pages; Actions per SHA gepinnt.
