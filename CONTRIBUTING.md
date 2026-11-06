# Mitmachen

Danke für dein Interesse!

## Issues

Fehler, unklare Erklärungen oder Ideen bitte als Issue melden. Nenne die betroffene ID (z. B. `t03-c012`) und, wenn möglich, einen Verbesserungsvorschlag mit Quelle.

## Pull Requests

1. Fork erstellen, Branch anlegen.
2. Änderungen klein und thematisch fokussiert halten.
3. `uv run tools/check.py` ausführen. Alle Prüfungen müssen grün sein: Schema-Validierung, Tests, SQL-Tests, Web-Build.
4. Commit-Nachrichten auf Englisch im Conventional-Commits-Stil (`feat:`, `fix:`, `docs:`, `content:`, `chore:`).

## Eigene Worte

Beiträge müssen in eigenen Worten verfasst sein. Übernimm keine Texte, Aufgaben, Beispiele oder Abbildungen aus Skripten, Folien, Büchern oder Klausuren. Allgemeine Definitionen und Lehrbuch-Szenarien sind erlaubt, wenn du sie selbst formulierst.

## Quellenpflicht

Jede fachliche Aussage, die nicht Allgemeinwissen ist, braucht eine **offene** Quelle, also offizielle DBMS-Dokumentation, Wikipedia/Wikibooks, OER oder frei lizenzierte Skripte. Quellen werden mit Lizenz in `sources.yml` geführt und im Frontmatter der Zusammenfassung per ID referenziert.

## Inhalte und Format

- Das Format jeder Inhaltsart ist in `schema/` beschrieben.
- SQL-Aufgaben müssen auf **Firebird 3** und **PostgreSQL** dasselbe Ergebnis liefern, Firebird-only-Aufgaben sind mit `engines: [fb]` gekennzeichnet. Dialektunterschiede stehen in `db/DIALECT-NOTES.md`. Was dort steht, ist am System geprüft.
- ER-Diagramme verwenden die Chen-Notation mit (min,max).
- Status eines Elements:
  - `draft`: Entwurf
  - `reviewed`: fachlich, aufgabenseitig und auf eigene Worte geprüft
  - `verified`: zusätzlich stichprobenartig von einer weiteren Person bestätigt

## Lizenz

Mit deinem Beitrag stimmst du zu, dass Inhalte unter CC BY-SA 4.0 und Code unter MIT veröffentlicht werden.
