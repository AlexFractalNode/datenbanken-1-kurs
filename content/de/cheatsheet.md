---
title: Cheatsheet Datenbanken 1 (A4)
lang: de
status: draft
---

# Cheatsheet Datenbanken 1

Kompaktüberblick über t01–t13. Details und Begründungen stehen in den Lerntexten, Begriffe im Glossar. SQL gilt für Firebird 3 (FB3); PostgreSQL (PG) nur, wo es abweicht.

## 1. Grundbegriffe und Architektur (t01–t03)

- DBS = DBMS + Datenbank (Anwendungsdaten + Data Dictionary). Schema = Struktur (selten geändert), Ausprägung = Daten zu einem Zeitpunkt.
- ANSI-SPARC: extern (viele Sichten) – konzeptionell (ein Gesamtschema; eng: Tabellen, weit: auch ER-Schema) – intern (Dateien, Indexe). Physische Datenunabhängigkeit = interne Änderung, logische = konzeptionelle Änderung ohne Auswirkung auf Sichten.
- Entwurfsphasen (6): Anforderungsanalyse → konzeptionell → logisch → Datendefinition → physisch → Implementierung/Wartung. Validierung begleitet alle Phasen.
- Sichtenintegration: Namens- (Synonym/Homonym), Typ-, Wertebereichs-, Bedingungs-, Strukturkonflikt.
- Sicht im Entwurf (Benutzersicht) ≠ SQL-View.

## 2. Notationen (t04)

| Element | Chen | Hinweis |
|---|---|---|
| Entitätstyp / Beziehungstyp / Attribut | Rechteck / Raute / Ellipse | Schlüssel unterstrichen |
| mehrwertig / abgeleitet / zusammengesetzt | doppelte / gestrichelte Ellipse / Unter-Ellipsen | |
| schwacher Typ | doppelter Rahmen, doppelte Raute | partieller Schlüssel gestrichelt unterstrichen |
| Pflichtteilnahme | Doppellinie | entspricht min ≥ 1 |
| Spezialisierung | Dreieck „is-a“ | total/partiell × disjunkt/überlappend |

**Kardinalität lesen.** Chen: gegenüber (look-across), nur Obergrenzen. (min,max): beim eigenen Typ. Umrechnung binär: max bei A = Chen-Angabe bei B.

| Chen (A : B) | (min,max) bei A | (min,max) bei B |
|---|---|---|
| 1 : 1 | (0,1) | (0,1) |
| 1 : n | (0,*) | (1,1) |
| m : n | (0,*) | (0,*) |

Konvention dieses Kurses, nur ohne Text, Doppellinie oder MC-Symbole; sonst gilt der Aufgabentext. 1:n: links Elternseite, rechts Kindseite. Hierarchische Rekursion: beide Rollen min = 0. Alternativen: Krähenfuß, UML-Multiplizität (0..1, 1..*, gegenüber notiert).

## 3. Relationales Modell und Integrität (t05)

Relation r ⊆ D₁ × … × Dₙ. Grad = Spaltenzahl, Kardinalität = Zeilenzahl. SQL-Tabellen: Duplikate, Spaltenfolge und NULL möglich.

| Integritätsart | Frage | Mittel |
|---|---|---|
| Entität | eindeutig identifizierbar? | PRIMARY KEY (eindeutig, nie NULL) |
| referenziell | Verweis ins Leere? | FOREIGN KEY → PK oder UNIQUE; NULL erlaubt, wenn nicht NOT NULL |
| Domäne | Wert im Bereich? | Typ, NOT NULL, CHECK, DOMAIN |
| benutzerdefiniert | fachliche Regel? | CHECK (eine Zeile), Trigger (mehrzeilig, alt/neu) |

Referenzielle Aktionen: NO ACTION (Standard), CASCADE, SET NULL, SET DEFAULT. FB3 hat kein RESTRICT. CHECK lässt UNKNOWN durch.

## 4. ERM → Relationen (t06)

- Entitätstyp → Tabelle; zusammengesetztes Attribut → Teilspalten; mehrwertiges Attribut → eigene Tabelle; abgeleitetes Attribut → nicht speichern.
- 1:n → FK auf der n-Seite; NOT NULL, wenn die n-Seite (1,1) hat. 1:1 → FK mit UNIQUE. m:n → Zwischentabelle, PK = beide FKs.
- Ternär: Tabelle mit drei FKs; FKs der Partner mit Chen-1 gehören nicht in den PK; wiederholbare Kombination → Zeitattribut in den PK.
- Rekursiv: 1:n → FK auf dieselbe Tabelle (NULL-fähig, Spaltenname = Rolle); m:n → Zwischentabelle mit zwei FKs auf dieselbe Tabelle.
- Schwacher Typ: PK = Besitzer-FK + partieller Schlüssel (ON DELETE CASCADE).
- Generalisierung: vertikale Fragmentierung (Super + Sub, Sub-PK = FK); horizontale Fragmentierung (nur Subtypen, nur bei total und disjunkt); virtuelle Fragmentierung (eine Gesamttabelle mit Typspalte, NULL-Spalten).
- Anlegen: Eltern vor Kindern; Löschen umgekehrt; Zyklen mit ALTER TABLE … ADD CONSTRAINT.

## 5. Normalisierung (t07)

| Form | Bedingung | Zerlegungsschritt |
|---|---|---|
| 1NF | atomare Werte, keine Wiederholungsgruppen | Gruppe auf Zeilen auflösen |
| 2NF | kein Nichtschlüsselattribut hängt von Schlüsselteil ab | Teil-Determinante + abhängige Attribute auslagern |
| 3NF | keine transitive Abhängigkeit | Zwischenglied + abhängige Attribute auslagern |
| BCNF | jede Determinante einer nicht-trivialen FD ist Superschlüssel | Ausblick |
| 4NF | keine unabhängigen mehrwertigen Fakten | Ausblick |

3NF-Kurztest: Für jede nicht-triviale FD X → A ist X Superschlüssel oder A Primattribut. Zerlegung verlustfrei, wenn die gemeinsamen Attribute Superschlüssel eines Teils sind. FDs sind Regeln der Miniwelt, keine Beobachtungen. Anomalien: Einfüge-, Änderungs-, Löschanomalie.

## 6. Relationale Algebra (t08)

| Operator | Symbol | SQL-Entsprechung |
|---|---|---|
| Selektion / Projektion | σ_{θ}(R) / π_{A}(R) | WHERE / SELECT DISTINCT |
| Umbenennung | ρ_{neu←alt}(R) | AS |
| Produkt | R × S | CROSS JOIN |
| Theta-/Natürlicher Join | R ⋈_{θ} S / R ⋈ S | JOIN … ON / NATURAL JOIN |
| Äußere Joins | ⟕ ⟖ ⟗ | LEFT / RIGHT / FULL OUTER JOIN |
| Semi-/Anti-Join | R ⋉ S / R ▷ S | EXISTS / NOT EXISTS |
| ∪ / ∩ / − | | UNION / (FB3: EXISTS) / (FB3: NOT EXISTS) |
| Division | R ÷ S | verschachtelte Unterabfragen |

∪, ∩, − nur vereinigungsverträglich. Relationen sind Mengen, SQL-Ergebnisse Multimengen. Operatorbaum von unten nach oben lesen, Selektion früh.

## 7. SQL-Schablonen (t09–t11, FB3)

```sql
CREATE TABLE kurs (
  kurs_id   INTEGER GENERATED BY DEFAULT AS IDENTITY,   -- Identity ist implizit NOT NULL
  titel     VARCHAR(60) DEFAULT 'neu' NOT NULL,
  raum_id   INTEGER,
  gebuehr   NUMERIC(8,2) CHECK (gebuehr >= 0),
  CONSTRAINT pk_kurs PRIMARY KEY (kurs_id),
  CONSTRAINT fk_kurs_raum FOREIGN KEY (raum_id)
    REFERENCES raum (raum_id) ON DELETE SET NULL
);
ALTER TABLE kurs ADD niveau VARCHAR(16);          -- FB3: ohne COLUMN
INSERT INTO kurs (titel, gebuehr) VALUES ('Gitarre', 25.00);
UPDATE kurs SET gebuehr = gebuehr * 1.1 WHERE niveau = 'Anfaenger';
DELETE FROM kurs WHERE kurs_id = 7;
```

```sql
SELECT k.titel, COUNT(b.kurs_id) AS belegungen
FROM kurs k LEFT JOIN belegung b ON b.kurs_id = k.kurs_id
WHERE k.gebuehr > 10
GROUP BY k.kurs_id, k.titel
HAVING COUNT(b.kurs_id) > 2
ORDER BY belegungen DESC, k.titel
OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY;   -- FB3 alternativ SELECT FIRST 5 …
```

Unterabfragen: `WHERE x IN (SELECT …)`, `WHERE NOT EXISTS (SELECT 1 FROM … WHERE …)`, `WHERE g > (SELECT AVG(g) FROM kurs)`.

**Auswertungsreihenfolge:** FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → Begrenzung. Spaltenaliase sind im WHERE und HAVING unbekannt, im ORDER BY bekannt.

**NULL:** Vergleich mit NULL = UNKNOWN, Prüfung mit IS NULL. WHERE/HAVING/ON behalten nur TRUE. `NOT IN` mit NULL in der Liste liefert nie TRUE. COUNT(*) zählt Zeilen, COUNT(x) nur Werte.

**Dialekthinweise (FB3 ↔ PG)**

| Thema | FB3 | PG |
|---|---|---|
| INTERSECT, EXCEPT | fehlen (EXISTS / NOT EXISTS) | vorhanden |
| LIMIT n | fehlt (FIRST / ROWS / FETCH) | vorhanden |
| NULL bei ORDER BY ASC | zuerst | zuletzt → NULLS FIRST/LAST angeben |
| AVG über Ganzzahl | abgeschnitten | NUMERIC → vorher CAST |
| NUMERIC(p,s), p ≤ 9 | Präzision nicht erzwungen | erzwungen |
| DEFAULT / NOT NULL | DEFAULT zuerst | beliebig |
| UNIQUE (a,b) mit (1,NULL) | nur einmal | beliebig oft |
| Datumsliteral | DATE '2025-12-24' | gleich |
| ORDER BY nach UNION | nur Spaltennummern | Namen erlaubt |
| INSERT … VALUES | eine Zeile je Anweisung; kein DEFAULT in der Werteliste (INSERT … SELECT für mehrere) | mehrere Zeilen |
| ADD / DROP bei ALTER TABLE | ohne COLUMN, ohne Klammern | mit COLUMN |
| TRUNCATE | fehlt (DELETE) | vorhanden |
| SELECT ohne FROM | FROM RDB$DATABASE | geht |
| RETURNING | höchstens eine Zeile | mehrere |
| Upsert | UPDATE OR INSERT … MATCHING | INSERT … ON CONFLICT; MERGE ab PG 15 |

Weitere Kurzzeilen: Sprachklassen DDL (CREATE/ALTER/DROP), DML (INSERT/UPDATE/DELETE), DQL (SELECT), DCL (GRANT/REVOKE), TCL (COMMIT/ROLLBACK/SAVEPOINT). `CREATE DOMAIN d AS NUMERIC(8,2) CHECK (VALUE >= 0)`; `CREATE SEQUENCE s`, `NEXT VALUE FOR s`. Datum: `EXTRACT(YEAR FROM d)`, `DATEDIFF(DAY FROM a TO b)` bzw. `b - a`, `DATEADD(DAY, 1, d)` bzw. `d + 1`. MC-Symbole (t04): 1 genau eins, c kein/ein, m/n mindestens eins, mc/nc beliebig viele; Legende der Quelle prüfen.

## 8. Views, Trigger, Prozeduren, Index (t12)

- View: gespeicherte Abfrage (externe Ebene); automatisch änderbar nur auf einer Tabelle ohne Join, Aggregat, GROUP BY, DISTINCT, berechnete Spalten, Mengenoperationen, FIRST/SKIP. Mit eigenen Triggern gibt Firebird Änderungen nicht mehr automatisch weiter. WITH CHECK OPTION verhindert Herausfallen.
- Trigger: BEFORE (prüfen, NEW setzen) / AFTER (protokollieren); OLD lesbar, NEW nur in BEFORE änderbar. FB3: PSQL, `SET TERM ^ ;`, Fehler mit `EXCEPTION`.
- Prozedur: `EXECUTE PROCEDURE p(…)` oder `SELECT … FROM p(…)` mit SUSPEND.
- Index: B-Baum, interne Ebene, beschleunigt selektive Suche, kostet beim Schreiben; ändert keine Ergebnisse.

## 9. Anwendungszugriff und Rechte (t13)

- Drei Schichten: Präsentation – Logik – Datenhaltung. Schnittstellen ODBC/JDBC: verbinden, Anweisung, ausführen, Ergebnis lesen, commit/rollback.
- SQL-Injection: Verkettung von Eingaben. Schutz: Prepared Statements (Platzhalter nur für Werte), minimale Rechte.
- `GRANT recht ON objekt TO empfänger [WITH GRANT OPTION]`, `REVOKE recht ON objekt FROM empfänger`. Rechte addieren sich aus direkt, aktiver Rolle und PUBLIC. FB3: je Sitzung genau eine aktive Rolle (beim Verbinden angeben oder `SET ROLE r`).
- Rollen: `CREATE ROLE r; GRANT SELECT ON t TO ROLE r; GRANT r TO USER u;`
