# Beispieldatenbank Firma

Ein mittelgroßes Unternehmen: Mitarbeitende gehören zu Abteilungen, jede Abteilung hat höchstens eine Leitung, Vorgesetzte bilden eine Hierarchie, Projekte werden von einer Abteilung verantwortet, und Mitarbeitende buchen Stunden auf Projekte. Alle Daten sind synthetisch und alle Personen erfunden.

| Datei | Inhalt |
| --- | --- |
| `schema.sql` | DDL in Firebird-3-Syntax (Referenz) |
| `schema.pg.sql` | dieselbe DDL für PostgreSQL / PGlite (nur `BLOB SUB_TYPE TEXT` → `TEXT`) |
| `seed.sql` | Daten, erzeugt mit `python db/firma/generate.py --seed 42`, läuft auf beiden Systemen |
| `generate.py` | Generator mit festen Namenslisten, deterministisch je Seed |
| `erd.dot` | ER-Diagramm in Chen-Notation (Graphviz) |

Ladereihenfolge: `schema.sql` (bzw. `schema.pg.sql`), danach `seed.sql`. Unterschiede zwischen Firebird und PostgreSQL stehen in [`../DIALECT-NOTES.md`](../DIALECT-NOTES.md). Die Namenskonventionen sind dieselben wie in der [Musikschule](../musikschule/README.md#namenskonventionen).

## Domänen

| Domäne | Typ | Regel |
| --- | --- | --- |
| `d_gehalt` | `NUMERIC(9,2)` | `VALUE > 0` |
| `d_stunden` | `NUMERIC(6,1)` | `VALUE >= 0` |

## Tabellen

### `abteilung`

| Spalte | Typ | Bedingungen |
| --- | --- | --- |
| `abteilung_id` | `INTEGER` | PK, Identity |
| `bezeichnung` | `VARCHAR(40)` | NOT NULL, UNIQUE |
| `standort` | `VARCHAR(30)` | NOT NULL |
| `leiter_id` | `INTEGER` | UNIQUE, FK → `mitarbeiter` ON DELETE SET NULL (Constraint `fk_abteilung_leiter`); NULL = ohne Leitung |

`leiter_id` ist UNIQUE, deshalb ist die Leitung eine 1:1-Beziehung. Weil `abteilung` und `mitarbeiter` aufeinander verweisen, legt das Schema den Fremdschlüssel erst nachträglich mit `ALTER TABLE` an, und `seed.sql` setzt die Leitung per `UPDATE`.

### `mitarbeiter`

| Spalte | Typ | Bedingungen |
| --- | --- | --- |
| `mitarbeiter_id` | `INTEGER` | PK, Identity |
| `vorname` | `VARCHAR(30)` | NOT NULL |
| `nachname` | `VARCHAR(30)` | NOT NULL |
| `email` | `VARCHAR(60)` | NOT NULL, UNIQUE |
| `eintritt` | `DATE` | NOT NULL |
| `gehalt` | `d_gehalt` | NOT NULL, monatlich brutto |
| `provision` | `NUMERIC(7,2)` | nur im Vertrieb, sonst NULL |
| `abteilung_id` | `INTEGER` | FK → `abteilung` ON DELETE SET NULL, optional |
| `vorgesetzter_id` | `INTEGER` | FK → `mitarbeiter` ON DELETE SET NULL (rekursiv), ≠ `mitarbeiter_id`; NULL = Geschäftsführung |

### `projekt`

| Spalte | Typ | Bedingungen |
| --- | --- | --- |
| `projekt_id` | `INTEGER` | PK, Identity |
| `titel` | `VARCHAR(60)` | NOT NULL, UNIQUE |
| `abteilung_id` | `INTEGER` | NOT NULL, FK → `abteilung` (verantwortliche Abteilung) |
| `startdatum` | `DATE` | NOT NULL |
| `enddatum` | `DATE` | NULL = läuft noch, sonst ≥ `startdatum` |
| `budget` | `NUMERIC(12,2)` | NULL = noch nicht festgelegt |
| `beschreibung` | `BLOB SUB_TYPE TEXT` (PG: `TEXT`) | optional |

### `mitarbeit` (m:n `mitarbeiter` ↔ `projekt`)

| Spalte | Typ | Bedingungen |
| --- | --- | --- |
| `mitarbeiter_id` | `INTEGER` | PK, FK → `mitarbeiter` ON DELETE CASCADE |
| `projekt_id` | `INTEGER` | PK, FK → `projekt` ON DELETE CASCADE |
| `stunden` | `d_stunden` | NOT NULL |
| `rolle` | `VARCHAR(20)` | optional; genau eine `'Projektleitung'` je besetztem Projekt |

## Daten (Seed 42)

| Tabelle | Zeilen |
| --- | --- |
| `abteilung` | 6 |
| `mitarbeiter` | 29 |
| `projekt` | 8 |
| `mitarbeit` | 41 |

Fälle, auf die sich Aufgaben verlassen können:

- Mitarbeiter 1 leitet die Geschäftsführung und hat keinen Vorgesetzten. Die Mitarbeiter 2–5 leiten die Abteilungen 2–5 und berichten an 1.
- In der Entwicklung gibt es zwei Teamleitungen unter der Abteilungsleitung. Die Hierarchie ist dadurch vier Ebenen tief.
- Ein Werkstudent hat keine Abteilung (`abteilung_id` NULL), aber einen Vorgesetzten.
- Abteilung 6 (Forschung) hat weder Mitarbeitende noch eine Leitung, verantwortet aber ein Projekt.
- Projekt 8 hat noch keine Mitarbeit; ein Projekt hat kein Budget; mehrere Projekte laufen noch (`enddatum` NULL).
- Mehrere Mitarbeitende arbeiten in keinem Projekt; `provision` ist nur im Vertrieb gesetzt; manche Mitarbeit hat keine Rolle.
- E-Mail-Adressen enden auf `@firma.example`.

Neu erzeugen: `python db/firma/generate.py --seed 42` (schreibt `seed.sql`). Andere Seeds ergeben andere Daten; die Aufgaben beziehen sich auf Seed 42.
