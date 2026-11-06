# Roadmap

Geplante Erweiterungen nach v1.0.0. Jeder Punkt ist auch ein Issue im Milestone [v1.1](https://github.com/AlexFractalNode/datenbanken-1-kurs/milestones). Vorschläge und Fehlermeldungen sind willkommen, siehe [CONTRIBUTING.md](CONTRIBUTING.md).

## Neue Funktionen

- **Englische Fassung:** Inhalte und Oberfläche auf Englisch, jedes deutsche Element mit englischem Gegenstück.
- **Offline-Übungspaket:** ZIP mit `docker-compose` (Firebird 3, optional PostgreSQL), beiden Beispieldatenbanken sowie Aufgaben und Lösungen als Markdown.
- **NoSQL-Ausblick:** kurzes Zusatzthema zu nicht-relationalen Datenbanken.
- **Cheatsheet-PDF:** PDF direkt aus `content/de/cheatsheet.md` erzeugen.
- **Navigation:** Menüpunkte gruppieren, die Seitenzahl wächst.

## Inhalt und Qualität

- **Stichproben-Review:** Elemente stichprobenartig gegenlesen und bestätigte auf `verified` setzen.
- **Glossar:** offene Fälle klären, z. B. ob ein Begriff englisch bleibt (`keep_english`) und fehlende englische Entsprechungen.
- **Quellen:** zweite offene Quelle für Aussagen ergänzen, die bisher nur einfach belegt sind (u. a. Konfliktarten der Sichtenintegration, Fünf-Schichten-Modell, statische/dynamische Integritätsbedingungen, `CREATE ASSERTION`, Requirements-Engineering-Begriffe).
- **Firebird 3:** offene Verhaltensfragen am System prüfen und in `db/DIALECT-NOTES.md` aufnehmen. Gemeint sind: Sicht mit `EXISTS` und `WITH CHECK OPTION`, eindeutiger `COMPUTED BY`-Index als Ersatz für einen partiellen Index, änderbare Sicht mit Trigger, kaskadierendes `REVOKE`.
- **Zusammenfassungen straffen:** Einige Themen liegen deutlich über dem Richtwert von 2500 Wörtern.

## Technik und CI

- **Abhängigkeiten:** Dependabot-Updates der GitHub Actions prüfen und übernehmen (u. a. Ablösung von Node 20).
- **CI-Diagnose:** Playwright-Traces und Screenshots bei fehlgeschlagenen Tests als Artefakt hochladen.
- **Playground:** Transaktionsschutz weiter härten und einen verständlichen Hinweis für Browser ohne Modul-Worker geben.
- **Fortschritt:** Der Export soll auch die Tageszählung für neue Karten enthalten.
- **Tests:** doppelte Web-Test-Fixtures angleichen.
