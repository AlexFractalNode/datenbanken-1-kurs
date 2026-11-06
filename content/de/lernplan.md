---
title: Lernplan zwölf Wochen (relativ zum Prüfungstermin T)
lang: de
status: draft
---

# Lernplan

**Annahmen:** T ist dein Prüfungstermin. Der Plan läuft von T−12 bis T und braucht pro Woche etwa 6–8 Stunden. Verschiebe Blöcke, wenn der Termin kürzer oder länger entfernt ist. Er trifft keine Aussage darüber, was geprüft wird oder wie stark etwas zählt.

## Formate im Kurs

| Format | Wofür | Rhythmus |
|---|---|---|
| **Karten (FSRS)** | Begriffe, Regeln, Kurzfragen; Wiederholungsabstände werden berechnet | täglich 10–20 min, nie ausfallen lassen |
| **Quiz** | Verständnis testen, typische Fehlvorstellungen aufdecken | nach jedem Thema |
| **Aufgaben** | Papierübungen (Modellieren, Normalisieren, Algebra) von Hand | 1–2 pro Thema, mit Zeitlimit |
| **Playground** | SQL ausprobieren und Aufgaben prüfen (PGlite im Browser) | in den SQL-Wochen mehrmals pro Woche |
| **Probeklausuren e01, e02** | Zeit, Ablauf und Lücken unter Prüfungsbedingungen testen | je einmal, ohne Unterbrechung |

Hinweis zum Playground: Er läuft auf PostgreSQL. Lies bei Abweichungen die Dialekthinweise zu Firebird 3 in den SQL-Themen und im Cheatsheet nach.

## Wochenplan

| Woche | Schwerpunkt | Karten / Quiz | Aufgaben / Playground |
|---|---|---|---|
| **T−12** | t01 Grundlagen, t02 Datenbankmodelle & Architektur | Karten t01, t02 anlegen; Quiz t01, t02 | Aufgaben t01, t02 |
| **T−11** | t03 Entwicklungsprozess, t04 ER-Modellierung (Teil 1: Bausteine, Schlüssel, Chen) | Karten t03, t04; Quiz t03 | Aufgaben t03; ersten ER-Entwurf aus einem Text zeichnen |
| **T−10** | t04 ER-Modellierung (Teil 2: (min,max), schwach, rekursiv, Generalisierung, Zeit) | Quiz t04 | Aufgaben t04; Kardinalitäten in beide Richtungen umrechnen |
| **T−9** | t05 Relationales Modell & Integrität, t06 Teil 1 (Entitätstypen, 1:1, 1:n, m:n, ternär, rekursiv) | Karten t05, t06; Quiz t05 | Aufgaben t05; Tabellen aus eigenen ER-Diagrammen ableiten |
| **T−8** | t06 Teil 2 (Generalisierung mit drei Varianten, schwache Typen, Anlegereihenfolge), t07 Normalisierung | Quiz t06, t07; Karten t07 | Aufgaben t06; Aufgaben t07 bis zur 3NF, Zerlegung auf Verlustfreiheit prüfen |
| **T−7** | t08 Relationale Algebra | Karten t08; Quiz t08 | Aufgaben t08 von Hand; Ausdrücke als Operatorbaum zeichnen |
| **T−6** | t09 SQL-Grundlagen & DDL | Karten t09; Quiz t09 | Aufgaben t09; im Playground eigene Tabellen anlegen |
| **T−5** | t10 SQL-DQL (Teil 1: Filter, NULL, Aggregate, Joins) | Karten t10; Quiz t10 | SQL-Aufgaben im Playground, täglich 3–4 |
| **T−4** | t10 SQL-DQL (Teil 2: Unterabfragen, Mengenoperationen, Reihenfolge), t11 SQL-DML | Quiz t10, t11 | SQL-Aufgaben t10, t11; FB3-Ersatz für INTERSECT/EXCEPT üben |
| **T−3** | t12 Views, Trigger, Procedures, Index; t13 Anwendungszugriff & Sicherheit | Karten t12, t13; Quiz t12, t13 | Aufgaben t12, t13; Views im Playground; Trigger, Prozeduren und GRANT auf Papier in FB3-Syntax |
| **T−2** | **Probeklausur e01** unter Prüfungsbedingungen, danach Auswertung | Karten: Fehlerthemen vertiefen | Fehlerliste anlegen; Spickzettel entwerfen (siehe Spickzettel-Liste) |
| **T−1** | Lücken aus e01 schließen; **Probeklausur e02**, danach Auswertung | Karten täglich, Quiz zu Fehlerthemen | Spickzettel mit e02 gegenprobieren und kürzen |
| **T** | Prüfungswoche | Karten nur leicht, nur Fälliges | Nichts Neues. Zettel, Unterlagen, Anreise vorbereiten, ausreichend schlafen |

## Regeln für jede Woche

1. **Karten zuerst.** Fälliges abarbeiten, bevor etwas Neues beginnt. Wer Karten stapeln lässt, verliert den Spacing-Effekt.
2. **Erst Papier, dann Playground.** SQL zuerst von Hand schreiben, dann im Playground prüfen und die Abweichung verstehen.
3. **Fehlerliste führen.** Jeder Fehler aus Quiz, Aufgaben und Klausuren kommt mit einer Zeile Begründung auf die Liste. Aus ihr entsteht der Spickzettel.
4. **Probeklausuren ernst nehmen.** Zeitlimit einhalten, keine Hilfsmittel außer denen, die du auch am Tag T hättest, danach Musterlösung nachvollziehen.
5. **Puffer einplanen.** Fällt eine Woche aus, verschiebe t12/t13 nach hinten und kürze zuerst die Teile, die der Kurs als Vertiefung oder Ausblick kennzeichnet (z. B. Attributhülle, Armstrong-Axiome, 4NF).
