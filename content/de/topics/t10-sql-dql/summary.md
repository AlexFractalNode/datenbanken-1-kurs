---
id: t10
lang: de
title: SQL-DQL
order: 10
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: postgresql-17-docs-sql
    ref: "4.1.1 Identifiers and Key Words (doppelte Anführungszeichen für Bezeichner, einfache für Zeichenketten); Kap. 7 Queries: 7.2.1.1 Joined Tables (CROSS, INNER, LEFT/RIGHT/FULL, NATURAL ohne gemeinsame Spalten = Kreuzprodukt, USING; ON vs. WHERE beim äußeren Join), 7.2.1.3 Subqueries (abgeleitete Tabelle; Alias nach Standard nötig, in PostgreSQL ab Version 16 optional), 7.2.2 WHERE, 7.2.3 GROUP BY und HAVING (nicht gruppierte Spalten, funktionale Abhängigkeit, HAVING ohne GROUP BY = eine Gruppe), 7.4 Combining Queries, 7.5 Sorting Rows (NULLS FIRST/LAST, NULL standardmäßig größer als alle Werte, Alias und Spaltennummer im ORDER BY), 7.6 LIMIT and OFFSET (eindeutige Sortierung nötig); 8.5.1 Date/Time Input (ISO 8601 empfohlen, Deutung von Tag/Monat abhängig von DateStyle); 9.1 Logical Operators (Wahrheitstabellen mit NULL); 9.3 Mathematical Functions (round mit Stellenzahl nur für numeric, ceil, floor, trunc, mod, abs, sqrt, power); 9.4 String Functions (left, right, lpad/rpad, trim mit leading/trailing/both, position); 9.9 Date/Time Functions (EXTRACT inkl. DOY, CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP); 9.21 Aggregate Functions (COUNT(*) vs. COUNT(x), NULL bei leerer Eingabe, COALESCE); 9.24 Subquery Expressions (EXISTS, IN, NOT IN mit NULL, ANY/SOME, ALL, leere Unterabfrage, NULL-Ergebnis bei IN/ANY/ALL ohne entscheidenden Vergleich)"
  - id: postgresql-17-docs-sql-commands
    ref: "SELECT: Abschnitt Description (Verarbeitungsschritte FROM, WHERE, GROUP BY/HAVING, SELECT-Liste, DISTINCT, UNION/INTERSECT/EXCEPT, ORDER BY, LIMIT/OFFSET/FETCH); Ausgabenamen in ORDER BY und GROUP BY erlaubt, in WHERE und HAVING nicht"
  - id: firebird-30-language-reference
    ref: "Kap. 6.1 SELECT: 6.1.1 FIRST, SKIP (Nicht-Standard); 6.1.2 Spaltenliste (ALL/DISTINCT); 6.1.4 Joins (inner, outer, natural, named columns, cross, implicit; IS NOT DISTINCT FROM); 6.1.5 WHERE (nur TRUE); 6.1.6 GROUP BY und HAVING (nicht aggregierte Spalten, Alias/Position im GROUP BY, nicht im HAVING; HAVING wird im Zusammenhang mit GROUP BY beschrieben, ohne GROUP BY laut Test ebenfalls zulässig); 6.1.8 UNION (DISTINCT/ALL; ORDER BY laut diesem Abschnitt nur mit Spaltenpositionen); 6.1.9 ORDER BY (NULLS FIRST/LAST; bei UNION laut diesem Abschnitt auch Namen/Aliase der ersten Teilabfrage); 6.1.10 ROWS (nicht mit FIRST/SKIP oder OFFSET/FETCH im selben SELECT kombinierbar); 6.1.11 OFFSET, FETCH; Kap. 8 Built-in Scalar Functions: 8.2 Mathematical Functions (ROUND mit Stellenzahl auch negativ, halbe Werte weg von null; TRUNC; CEIL/CEILING; FLOOR; MOD rundet nicht ganzzahlige Argumente; ABS; SQRT und POWER liefern DOUBLE PRECISION), 8.3 String Functions (LEFT, RIGHT, LPAD/RPAD, TRIM mit LEADING/TRAILING/BOTH, POSITION liefert 0 ohne Treffer, CHAR_LENGTH bei CHAR), 8.4 Date and Time Functions (DATEADD und DATEDIFF in FROM/TO- bzw. TO-Form und Kommaform, EXTRACT mit WEEKDAY 0–6 und YEARDAY 0–365); Datumsliterale in der Form TT.MM.JJJJ in den DDL-Beispielen; Kap. 9 Aggregate Functions"
  - id: sqlite-documentation
    ref: "NULL Handling in SQLite (Vergleich mehrerer DBMS: NULL bei DISTINCT und UNION nicht verschieden, NULL OR TRUE, CASE WHEN NULL); SELECT"
  - id: wikibooks-einfuehrung-in-sql
    ref: "Kapitel „Ausführliche SELECT-Struktur“ (Schreibreihenfolge, Mengenquantifizierer, FIRST/LIMIT als Nicht-Standard), „WHERE-Klausel im Detail“ (LIKE mit % und _, Datumswerte als Zeichenketten TT.MM.JJJJ in den Beispielen), „Einfache Tabellenverknüpfung“, „Arbeiten mit JOIN“, „OUTER JOIN“, „Mehr zu JOIN“, „Berechnete Spalten“, „Gruppierungen“, „Unterabfragen“ (Ergebnis als einzelner Wert, als Liste mehrerer Werte, als Tabelle im FROM), „Funktionen“"
  - id: oer-informatik-datenbanken
    ref: "Selektion/Projektion (DISTINCT, Alias, LIKE mit % und _, BETWEEN, IN, IS NULL); Aggregatfunktionen (COUNT(*) vs. COUNT(spalte), NULL in AVG, GROUP-BY-Regel, HAVING vs. WHERE, logische Auswertungsreihenfolge, LEFT JOIN und NULL); JOIN; Unterabfragen (Einteilung skalar / Liste bzw. Spalte / Tabelle, Unterabfrage in SELECT-Liste und FROM, IN/NOT IN mit NULL-Falle, <> ALL wie NOT IN, ANY/SOME/ALL, ALL über leere Menge, korreliert, EXISTS/NOT EXISTS)"
  - id: inf-schule-datenbanksysteme
    ref: "Datenbank für Geodaten (terra): Kapitel „Verbessern der Ausgabe“ (Alias, DISTINCT), „Ergebnisse zusammenfassen“ (Aggregation, Subselect), „Beziehungen innerhalb von Tabellen“ (Selbstreferenz, Tabellenalias)"
  - id: wp-join-sql
    ref: "Abschnitte „Kartesisches Produkt (CROSS JOIN)“ inkl. SQL-89-Kommaschreibweise, „Innerer Verbund“ (NATURAL JOIN, JOIN … USING, JOIN … ON mit Equi-Join und Theta-Join), „Äußerer Verbund (OUTER JOIN)“ (LEFT, RIGHT, FULL), „Self Join“"
  - id: wpen-join-sql
    ref: "Sections „Cross join“, „Inner join“ (equi-join, natural join), „Outer join“ (left, right, full), „Self-join“"
  - id: wp-sql
    ref: "Abschnitt „Sprachelemente und Beispiele“ (NULL verschieden von allen Werten, COUNT und NULL, LEFT OUTER JOIN füllt mit NULL); Einordnung der DQL als Teil der DML"
  - id: wp-dreiwertige-logik
    ref: "Abschnitt „Ł3 und K3“ (Kleene-Wahrheitstabellen für ∧, ∨, ¬ mit dem dritten Wert ½; Konjunktion als Minimum, Disjunktion als Maximum)"
  - id: wp-aggregatfunktion
    ref: "Abschnitt „Unterteilungen“ (COUNT, SUM, MIN, MAX distributiv; AVG algebraisch aus SUM und COUNT)"
  - id: wikibooks-relationenalgebra-und-sql
    ref: "Unterseiten „Projektion“, „Selektion“, „Join“, „Mengenoperationen“, „Gruppierungsoperator und Aggregatfunktionen“ (Entsprechung Algebra ↔ SQL)"
---

# SQL-DQL

## Lernziele

- Du schreibst Abfragen mit Projektion, Filter, Funktionen, Sortierung und Ergebnisbegrenzung von Hand in Firebird-3-Syntax und kennst die PostgreSQL-Abweichungen.
- Du bestimmst das Ergebnis von Abfragen mit NULL-Werten sicher – dreiwertige Logik und die NULL-Regeln der Aggregatfunktionen inklusive.
- Du gruppierst mit GROUP BY und unterscheidest Bedingungen für WHERE und für HAVING.
- Du wählst den passenden Join (inner, outer, natural, cross, self) und erkennst, wann ein äußerer Join unbemerkt zum inneren wird.
- Du formulierst Mengenoperationen und Unterabfragen (IN, EXISTS, ANY/ALL, korreliert, in SELECT-Liste und FROM) und ersetzt INTERSECT/EXCEPT in Firebird 3.
- Du erklärst die logische Auswertungsreihenfolge, leitest daraus ab, wo Aliase und Aggregate erlaubt sind, und ordnest abweichende Darstellungen ein.

## Grundaufbau einer Abfrage

Die *Data Query Language (DQL)* ist der lesende Teil von SQL – viele Quellen zählen sie zur DML. Ihre einzige Anweisung ist `SELECT`. Eine Abfrage (*query*) berechnet aus Tabellen eine neue Ergebnistabelle. Die Klauseln stehen immer in dieser Schreibreihenfolge:

```sql
SELECT [DISTINCT] spaltenliste
FROM tabellen
[WHERE zeilenbedingung]
[GROUP BY gruppierung]
[HAVING gruppenbedingung]
[ORDER BY sortierung]
```

In Firebird sind nur `SELECT` und `FROM` Pflicht; ein `SELECT 1` ohne Tabelle braucht dort `FROM RDB$DATABASE`. Schlüsselwörter schreiben wir groß, Bezeichner klein.

Zur relationalen Algebra: Die SELECT-Liste entspricht der Projektion π, das WHERE der Selektion σ, der Join ⋈, `FROM a, b` dem Produkt ×. Der wichtigste Unterschied: SQL liefert **Multimengen** (*multisets*). Gleiche Zeilen bleiben stehen, bis man sie mit `DISTINCT` entfernt.

## Projektion, DISTINCT, Alias, berechnete Spalten

Die SELECT-Liste legt fest, welche Spalten ausgegeben werden (Projektion, *projection*). `*` steht für alle Spalten. Erlaubt sind auch Ausdrücke – eine **berechnete Spalte** (*computed column*):

```sql
SELECT titel, gebuehr_monat, gebuehr_monat * 12 AS jahresgebuehr
FROM kurs;
```

Mit `AS` vergibst du einen **Alias** (Ersatznamen); das Wort `AS` ist optional. Auch Tabellen bekommen Aliase (`FROM kurs k` oder gleichwertig `FROM kurs AS k`, danach `k.titel`) – Pflicht, wenn dieselbe Tabelle zweimal vorkommt. Ohne Alias vergibt jedes System eigene Spaltennamen (Firebird z. B. `COUNT` oder `CONCATENATION`, PostgreSQL `count` oder `?column?`).

`SELECT DISTINCT ort FROM person` liefert jeden Ort nur einmal. `DISTINCT` bezieht sich auf die **ganze Ergebniszeile**, nicht auf die erste Spalte; zwei NULL-Werte gelten dabei als gleich. Das Gegenstück `ALL` ist der Standard.

## WHERE: Vergleiche, LIKE, BETWEEN, IN

`WHERE` behält nur die Zeilen, für die die Bedingung **TRUE** ist. Bausteine sind Vergleiche (`=`, `<>`, `<`, `<=`, `>`, `>=`) und Prädikate (*predicates*), verknüpft mit `AND`, `OR`, `NOT`. `AND` bindet stärker als `OR` – im Zweifel klammern. Für „ungleich“ ist `<>` die Standardschreibweise; Firebird und PostgreSQL akzeptieren auch `!=`, das wir hier nicht verwenden.

- `LIKE` vergleicht mit einem Muster. Platzhalter (*wildcards*): `%` für beliebig viele Zeichen (auch keins), `_` für genau ein Zeichen. `vorname LIKE 'L___'` findet „Lina“ und „Leon“, aber nicht „Lukas“. Groß-/Kleinschreibung zählt; ohne Rücksicht darauf vergleicht man portabel mit `UPPER(x) LIKE UPPER('…')`. Firebird kennt zusätzlich `CONTAINING` und `STARTING WITH`, PostgreSQL `ILIKE`.
- `BETWEEN a AND b` schließt **beide** Grenzen ein: `eintritt BETWEEN DATE '2017-01-01' AND DATE '2017-12-31'`.
- `IN (…)` prüft die Zugehörigkeit zu einer Liste: `familie IN ('Streich', 'Zupf')` entspricht zwei mit `OR` verbundenen Gleichheiten.
- `IS NULL` / `IS NOT NULL` prüft auf fehlende Werte (nächster Abschnitt).

**Anführungszeichen und Platzhalter:** Zeichenketten stehen in SQL in **einfachen** Anführungszeichen (`'Talhausen'`). **Doppelte** Anführungszeichen markieren Bezeichner (*delimited identifiers*), also Tabellen- oder Spaltennamen: `"Talhausen"` sucht eine Spalte dieses Namens und führt zum Fehler. Wer SQL aus Desktop-Datenbanken wie Microsoft Access kennt, ist dort andere Konventionen gewohnt (`*` und `?` als Platzhalter, Text in doppelten Anführungszeichen). In Firebird, PostgreSQL und im Standard gilt das nicht: `*` und `?` sind in einem LIKE-Muster gewöhnliche Zeichen, Platzhalter sind nur `%` und `_`.

**Datumsliterale:** Eindeutig und in beiden Systemen gleich ist `DATE 'JJJJ-MM-TT'` bzw. die ISO-Zeichenkette `'2025-03-01'`. Firebird wandelt auch eine Zeichenkette im deutschen Format implizit in ein Datum um, wenn sie mit einer DATE-Spalte verglichen wird: `WHERE eintritt >= '01.03.2025'` ist dort gültig (Punkt als Trenner bedeutet Tag.Monat.Jahr). Viele Firebird-Beispiele schreiben Datumswerte so. In PostgreSQL ist das nicht verlässlich: Wie Tag und Monat in einer Zeichenkette gedeutet werden, hängt von der Einstellung `DateStyle` ab. Für Lösungen, die überall gleich laufen, nimm die ISO-Form.

## NULL und dreiwertige Logik

`NULL` ist kein Wert, sondern eine Markierung (*null value*): Der Wert fehlt, ist unbekannt oder ist für diese Zeile nicht anwendbar (eine Provision bei jemandem ohne Vertriebsaufgabe). Ein Vergleich mit NULL ist deshalb weder wahr noch falsch, sondern **UNKNOWN** – auch `NULL = NULL`. SQL arbeitet mit einer **dreiwertigen Logik** (*three-valued logic*). Sie entspricht der Kleene-Logik K3, in der UNKNOWN die Rolle des mittleren Werts „½“ spielt.

| AND | T | F | U |
| --- | --- | --- | --- |
| **T** | T | F | U |
| **F** | F | F | F |
| **U** | U | F | U |

| OR | T | F | U |
| --- | --- | --- | --- |
| **T** | T | T | T |
| **F** | T | F | U |
| **U** | T | U | U |

`NOT U = U`. Merkregel: FALSE entscheidet ein AND, TRUE entscheidet ein OR – sonst bleibt UNKNOWN.

**Rechnen mit Zahlen statt Tabellen:** Setzt man T = 1, U = ½ und F = 0, ergeben sich alle Felder aus drei Regeln. `a AND b` ist das **Minimum** der beiden Werte, `a OR b` das **Maximum**, `NOT a` ist `1 − a`. Beispiel: T AND U = min(1, ½) = ½ = U; F OR U = max(0, ½) = U; NOT U = 1 − ½ = U.

**Exklusives Oder (XOR):** „genau eins von beiden“, also `(a OR b) AND NOT (a AND b)`. Setzt man in diese Definition ein, entsteht die Tabelle:

| XOR | T | F | U |
| --- | --- | --- | --- |
| **T** | F | T | U |
| **F** | T | F | U |
| **U** | U | U | U |

Sobald ein Operand UNKNOWN ist, bleibt XOR UNKNOWN – kein Wert des anderen Operanden entscheidet es. Ein eigenes Schlüsselwort `XOR` für Wahrheitswerte gibt es weder in Firebird 3 noch in PostgreSQL. Man schreibt die Definition aus oder vergleicht zwei BOOLEAN-Ausdrücke mit `<>`; auch `<>` liefert UNKNOWN, sobald eine Seite NULL ist.

Wirkung in Abfragen: `WHERE`, `HAVING` und die `ON`-Bedingung behalten nur TRUE; UNKNOWN fällt wie FALSE heraus. Hat `telefon` den Wert NULL, liefert weder `WHERE telefon = '000 1'` noch `WHERE NOT (telefon = '000 1')` die Zeile. Fehlende Werte findest du nur mit `IS NULL`.

**Vereinfachte Lesart „Vergleich mit NULL ist falsch“:** Manche Darstellungen sagen vereinfacht, ein Vergleich mit NULL liefere FALSE und NULL-Werte seien untereinander verschieden. Für ein einfaches WHERE stimmt das im Ergebnis: Die Zeile fällt heraus, egal ob FALSE oder UNKNOWN. Unter `NOT` trennt sich das aber: `NOT FALSE` wäre TRUE und die Zeile käme durch, `NOT UNKNOWN` bleibt UNKNOWN und die Zeile fällt weiterhin heraus. Genau so verhalten sich Firebird und PostgreSQL. Auch „untereinander verschieden“ gilt nur für Vergleiche; bei `DISTINCT`, `GROUP BY` und `UNION` gelten NULL-Werte als gleich (siehe unten). Rechne deshalb immer mit UNKNOWN. Firebird und PostgreSQL kennen außerdem `a IS NOT DISTINCT FROM b` – ein „gleich“, bei dem zwei NULL als gleich gelten. Mit dem Datentyp `BOOLEAN` lässt sich UNKNOWN auch direkt prüfen (`IS UNKNOWN`).

Weitere NULL-Regeln:
- Arithmetik und Verkettung mit NULL ergeben NULL: `5 + NULL`, `'a' || NULL`. Ersatzwerte liefert `COALESCE(x, ersatz)`.
- `CASE WHEN bedingung …` behandelt UNKNOWN wie FALSE; ohne `ELSE` ist das Ergebnis NULL.
- Bei `DISTINCT`, `GROUP BY` und `UNION` gelten NULL-Werte als **nicht verschieden** und bilden eine gemeinsame Gruppe bzw. Zeile.

## NULL in Aggregaten

Aggregatfunktionen (*aggregate functions*) verdichten viele Zeilen zu einem Wert: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. `SUM` und `AVG` brauchen Zahlen. `MIN` und `MAX` funktionieren auch für Zeichenketten (Sortierfolge) und Datumswerte, z. B. `MIN(startdatum)` für den frühesten Kursbeginn.

- `COUNT(*)` zählt **Zeilen**, `COUNT(spalte)` nur Werte **ungleich NULL**, `COUNT(DISTINCT spalte)` verschiedene Werte ungleich NULL.
- `SUM`, `AVG`, `MIN`, `MAX` übergehen NULL. `AVG` teilt also durch die Zahl der Werte: Aus 10, 20, NULL, 30 wird 20, nicht 15 – passend dazu, dass sich AVG aus SUM und COUNT zusammensetzt.
- Bei leerer Eingabe (oder nur NULL-Werten) liefern `SUM`, `AVG`, `MIN`, `MAX` NULL, `COUNT` liefert 0. Wer 0 braucht, schreibt `COALESCE(SUM(x), 0)`.

**Dialektfalle:** Firebird 3 behält bei `AVG` Typ und Skala der Spalte. Der Durchschnitt von 1, 2 und 4 in einer INTEGER-Spalte ist dort 2, über `NUMERIC(8,2)` wird auf zwei Stellen abgeschnitten; PostgreSQL rechnet genau. Neutral formuliert man `AVG(CAST(x AS DOUBLE PRECISION))`, für einen auf zwei Stellen gerundeten Wert `CAST(AVG(CAST(x AS NUMERIC(12,4))) AS NUMERIC(12,2))`.

## Sortierung und Ergebnisbegrenzung

`ORDER BY` sortiert das Ergebnis, aufsteigend (`ASC`, Standard) oder absteigend (`DESC`), getrennt für jede Sortierspalte. Ohne `ORDER BY` ist die Reihenfolge **nicht festgelegt**. Sortieren darfst du nach Spalten, Ausdrücken, Aliasen oder Spaltennummern (`ORDER BY 2`).

Wo NULL landet, unterscheidet sich je nach System:

| | aufsteigend | absteigend |
| --- | --- | --- |
| Firebird 3 (getestet) | NULL zuerst | NULL zuletzt |
| PostgreSQL | NULL zuletzt | NULL zuerst |

Die Firebird-Referenz nennt pauschal `NULLS FIRST` als Standard; das getestete Verhalten bei `DESC` weicht davon ab. Portabel ist nur die ausdrückliche Angabe: `ORDER BY budget ASC NULLS LAST, projekt_id`.

**Ergebnisbegrenzung** (*row limiting*) – drei Schreibweisen:

| | Plätze 2 bis 4 | Hinweis |
| --- | --- | --- |
| Firebird | `SELECT FIRST 3 SKIP 1 … ORDER BY …` | direkt hinter SELECT; zusätzlich `ROWS 2 TO 4` |
| PostgreSQL | `… ORDER BY … LIMIT 3 OFFSET 1` | `LIMIT` gibt es in Firebird nicht |
| SQL-Standard | `… ORDER BY … OFFSET 1 ROWS FETCH NEXT 3 ROWS ONLY` | läuft in beiden |

Innerhalb eines SELECT darfst du in Firebird nur **eine** dieser Schreibweisen verwenden: `ROWS` lässt sich nicht mit `FIRST`/`SKIP` oder `OFFSET`/`FETCH` kombinieren.

Eine Begrenzung ist nur eindeutig, wenn die Sortierung eindeutig ist – im Zweifel bis zum Primärschlüssel sortieren: `ORDER BY gebuehr_monat DESC, kurs_id`.

**Extremwerte und Gleichstand:** „Der teuerste Kurs“ lässt sich auf zwei Arten formulieren, die sich bei Gleichstand unterscheiden:

```sql
-- (a) alle Zeilen mit dem Höchstwert
SELECT titel, gebuehr_monat
FROM kurs
WHERE gebuehr_monat = (SELECT MAX(gebuehr_monat) FROM kurs);

-- (b) genau eine Zeile
SELECT FIRST 1 titel, gebuehr_monat
FROM kurs
ORDER BY gebuehr_monat DESC, kurs_id;
```

Teilen sich zwei Kurse die höchste Gebühr, liefert (a) beide, (b) nur einen – welchen, entscheidet erst die zweite Sortierspalte; ohne sie ist es nicht festgelegt. Ist nach „dem“ Datensatz mit dem Höchstwert gefragt, ist (a) die sichere Lösung. (b) passt, wenn ausdrücklich genau eine Zeile verlangt ist. Für Extremwerte je Gruppe wird (a) korreliert: `WHERE x.preis = (SELECT MAX(y.preis) FROM … y WHERE y.gruppe = x.gruppe)`.

## Aggregatfunktionen, GROUP BY, HAVING

`GROUP BY` fasst Zeilen mit gleichen Werten in den Gruppierungsspalten zu **einer** Ergebniszeile zusammen (*grouping*); die Aggregate werden je Gruppe berechnet:

```sql
SELECT k.kurs_id, k.titel, COUNT(*) AS aktive
FROM kurs k
JOIN belegung b ON b.kurs_id = k.kurs_id
WHERE b.abgemeldet_am IS NULL
GROUP BY k.kurs_id, k.titel
HAVING COUNT(*) >= 5;
```

- **Regel für die SELECT-Liste:** nur Gruppierungsspalten und Aggregate. Firebird verlangt das streng; PostgreSQL erlaubt zusätzlich Spalten, die funktional vom gruppierten Primärschlüssel abhängen. Portabel: alle nicht aggregierten Spalten ins `GROUP BY`.
- **WHERE vs. HAVING:** `WHERE` filtert **Zeilen vor** dem Gruppieren und darf keine Aggregate enthalten. `HAVING` filtert **Gruppen danach**, meist mit einem Aggregat. Eine Bedingung, die an jeder einzelnen Zeile prüfbar ist, gehört ins WHERE.
- Ohne `GROUP BY` bildet eine Abfrage mit Aggregat genau eine Gruppe aus allen Zeilen. Das gilt auch für ein `HAVING` ohne `GROUP BY`: `SELECT COUNT(*) FROM kurs HAVING COUNT(*) > 10` liefert eine Zeile oder keine. Das ist Standard und läuft in PostgreSQL und Firebird 3 (getestet). Die Firebird-Referenz beschreibt HAVING nur im Zusammenhang mit GROUP BY, verbietet die Form aber nicht. Manche Lehrmaterialien lassen HAVING vereinfachend nur mit GROUP BY zu. Wer sich daran hält, schreibt nichts Falsches, denn ohne Gruppierung lässt sich die Bedingung meist auch anders formulieren.
- `GROUP BY` sortiert nicht. Manche Systeme liefern Gruppen zufällig in der Reihenfolge der Gruppierungsspalten, weil sie intern sortieren. Garantiert ist eine Reihenfolge aber nur mit `ORDER BY`.

## Joins

Ein Join (*Verbund*) verknüpft Zeilen zweier Tabellen.

- **INNER JOIN** (kurz `JOIN`): nur Paare, für die die `ON`-Bedingung TRUE ist; Zeilen ohne Partner verschwinden. Mehrere Joins hängt man hintereinander; braucht man eine Tabelle in zwei Rollen (z. B. `person` für Schüler und für die Lehrkraft), bekommt sie zwei Aliase.
- **Equi-Join und Theta-Join:** Verknüpft die Bedingung nur über Gleichheit (`b.kurs_id = k.kurs_id`), heißt der Join *Equi-Join* (Gleichverbund) – der Normalfall über Fremdschlüssel. Im `ON` darf aber jede Bedingung stehen, auch mit `<`, `<=`, `<>` oder `BETWEEN`. Ein solcher Join heißt *Non-Equi-Join*; im SQL-Sprachgebrauch sagt man oft auch *Theta-Join*. Genau genommen ist der Theta-Join in der relationalen Algebra der allgemeine Verbund mit beliebigem Vergleichsoperator θ, und der Equi-Join ist sein Spezialfall mit θ = „=“. Beispiel: Kurse, deren Gebühr in einer Preisstufe liegt, `JOIN stufe s ON k.gebuehr_monat BETWEEN s.von AND s.bis` (eigene Tabelle `stufe`), oder Paare ohne Doppelungen mit `p2.person_id > p1.person_id` (Self-Join, unten).
- **LEFT / RIGHT / FULL OUTER JOIN** (*outer join*): zuerst das Ergebnis des inneren Joins, dazu die Zeilen ohne Partner der linken, rechten bzw. beider Seiten – die fehlenden Spalten werden mit NULL aufgefüllt. `A RIGHT JOIN B` = `B LEFT JOIN A`.
- **„Ohne“-Abfragen (Anti-Join):** `kurs k LEFT JOIN belegung b ON b.kurs_id = k.kurs_id WHERE b.kurs_id IS NULL` liefert die Kurse ohne Belegung. Zum Zählen nimmt man `COUNT(b.kurs_id)`, nicht `COUNT(*)` – sonst zählt die NULL-Zeile als 1.
- **ON oder WHERE?** Beim inneren Join gleichwertig, beim äußeren nicht: Eine Bedingung auf die rechte Tabelle im `WHERE` (`WHERE b.rabatt_prozent > 0`) entfernt die mit NULL aufgefüllten Zeilen – der LEFT JOIN wird faktisch zum inneren. Im `ON` wählt sie nur die Partner aus.
- **NATURAL JOIN** verbindet über **alle** gleichnamigen Spalten und gibt sie nur einmal aus; `JOIN … USING (kurs_id)` nennt die Spalten ausdrücklich. Vorsicht: `kurs NATURAL JOIN termin` vergleicht auch `raum_id`. Haben die Tabellen gar keine gleichnamige Spalte, gibt es keine Bedingung – das Ergebnis ist das kartesische Produkt.
- **CROSS JOIN** bildet das kartesische Produkt (*Cartesian product*): jede Zeile mit jeder, |A| · |B| Zeilen.
- **Alte Komma-Syntax:** `FROM kurs k, belegung b WHERE b.kurs_id = k.kurs_id` ist ein innerer Join im Stil von SQL-89. Fehlt die Bedingung, entsteht still ein Produkt – explizite Joins sind deshalb vorzuziehen; beide Stile nicht mischen.
- **Self-Join:** eine Tabelle mit sich selbst, unter zwei Aliasen in zwei Rollen. Typisch bei rekursiven Beziehungen. Beispiel mit einer eigenen Tabelle `lehrgang(lehrgang_id, titel, vorstufe_id)`, in der `vorstufe_id` auf den Lehrgang verweist, der vorher abgeschlossen sein muss: `lehrgang l LEFT JOIN lehrgang v ON v.lehrgang_id = l.vorstufe_id` liefert zu jedem Lehrgang seine Vorstufe – dank `LEFT` auch die Einstiegslehrgänge ohne Vorstufe (mit NULL). Ein Self-Join braucht keine rekursive Beziehung: `person p1 JOIN person p2 ON p2.ort = p1.ort AND p2.person_id > p1.person_id` findet Paare von Personen aus demselben Ort, jedes Paar einmal.

## Mengenoperationen

Mengenoperationen (*set operations*) verknüpfen die Ergebnisse zweier Abfragen. Beide Teile brauchen gleich viele Spalten mit verträglichen Typen; die Spaltennamen kommen aus dem ersten Teil. Fehlt einem Teil eine Spalte, füllt man mit einer Konstante oder mit `CAST(NULL AS typ)` auf.

`ORDER BY` steht einmal ganz am Ende und sortiert das Gesamtergebnis. **Sicher und portabel sind Spaltennummern** (`ORDER BY 1, 2`). PostgreSQL erlaubt auch die Spaltennamen des ersten Teils. Firebird 3 lehnt Namen und Aliase an dieser Stelle ab („invalid ORDER BY clause“) und akzeptiert nur Spaltennummern – getestet mit Firebird 3.0.14. Wer ganz sichergehen will, macht die Vereinigung zur abgeleiteten Tabelle und sortiert außen: `SELECT * FROM (… UNION …) u ORDER BY u.nachname`.

- `UNION` vereinigt und entfernt Duplikate (auch innerhalb eines Teils); `UNION ALL` behält alle Zeilen.
- `INTERSECT` (Schnittmenge) und `EXCEPT` (Differenz) gibt es in PostgreSQL, **nicht in Firebird 3**. Ersatz:
  - A ∩ B: `WHERE EXISTS (SELECT 1 FROM … WHERE … = außen.…)` oder `WHERE x IN (SELECT …)`
  - A − B: `WHERE NOT EXISTS (…)`
- Die Ersatzformen entfernen keine Duplikate (ggf. `DISTINCT` ergänzen) und behandeln zwei NULL nicht als gleich – `INTERSECT`/`EXCEPT` schon.

## Unterabfragen

Eine Unterabfrage (*subquery*) ist ein `SELECT` in Klammern innerhalb einer anderen Abfrage – im `WHERE` oder `HAVING`, in der SELECT-Liste oder im `FROM`.

**Einteilung nach der Form des Ergebnisses:**

| Art | Ergebnis | typische Verwendung |
| --- | --- | --- |
| skalare Unterabfrage (*scalar subquery*) | genau ein Wert (eine Zeile, eine Spalte) | Vergleich mit `=`, `<`, `>` …; als Spalte in der SELECT-Liste |
| Listen- bzw. Spaltenunterabfrage | eine Spalte, beliebig viele Zeilen | `IN`, `NOT IN`, `ANY`, `ALL` |
| Tabellenunterabfrage | beliebig viele Zeilen und Spalten | im `FROM` als abgeleitete Tabelle; mit `EXISTS` |

Quer dazu steht die Frage, ob eine Unterabfrage **korreliert** ist (*correlated subquery*): Sie verwendet eine Spalte der äußeren Abfrage und lässt sich deshalb **nicht für sich allein ausführen**. Gedanklich wird sie für jede äußere Zeile neu ausgewertet. Eine unkorrelierte Unterabfrage ist dagegen eigenständig lauffähig und liefert für alle äußeren Zeilen dasselbe Ergebnis.

- **Skalar:** `WHERE gebuehr_monat > (SELECT AVG(gebuehr_monat) FROM kurs)` umgeht das Verbot von Aggregaten im WHERE. Keine Zeile → NULL; mehrere Zeilen → Laufzeitfehler.
- **IN:** `WHERE person_id IN (SELECT schueler_id FROM ausleihe WHERE rueckgabe IS NULL)`. Anders als ein Join vervielfacht `IN` die äußeren Zeilen nicht.
- **NOT IN mit NULL:** `x NOT IN (1, 2, NULL)` bedeutet `x <> 1 AND x <> 2 AND x <> NULL` und ist nie TRUE. Enthält die Unterabfrage einen NULL-Wert, ist das Ergebnis leer. Sicher: `NOT EXISTS` – oder NULL in der Unterabfrage herausfiltern.
- **EXISTS / NOT EXISTS:** wahr, sobald die Unterabfrage mindestens eine Zeile liefert; nie UNKNOWN. Die SELECT-Liste ist egal (`SELECT 1`).
- **ANY (= SOME) / ALL:** `gebuehr_monat > ANY (…)` heißt „größer als mindestens einer“, `gebuehr_monat > ALL (…)` „größer als jeder“. Bei leerer Unterabfrage ist ANY FALSE und ALL TRUE – `> (SELECT MAX …)` wäre dagegen UNKNOWN. `= ANY` entspricht `IN`, `<> ALL` entspricht `NOT IN`.
- **Schreibweise:** Eine Werteliste in Klammern ist nur bei `IN`/`NOT IN` erlaubt (`x IN (1, 2, 3)`). Nach `ANY`, `SOME` und `ALL` muss in Firebird 3 eine Unterabfrage stehen; PostgreSQL erlaubt dort alternativ ein Array, aber ebenfalls keine Klammerliste. `x > ALL (1, 2, 3)` ist also in beiden Systemen ein Syntaxfehler. Manche Darstellungen schreiben ALL zur Erklärung trotzdem mit einer Werteliste. Gemeint ist dann die Werteliste, die eine Unterabfrage liefert.
- **NULL in der Liste bei IN, ANY, ALL:** Gedanklich wird `IN`/`ANY` zu einer OR-Kette und `ALL` zu einer AND-Kette von Einzelvergleichen; dann gilt die Tabelle von oben. Angenommen, die Unterabfrage `(SELECT x FROM t)` liefert die Werte 3, 8 und NULL:
  - `5 IN (SELECT x FROM t)`: FALSE OR FALSE OR UNKNOWN = UNKNOWN – nicht FALSE. `3 IN (…)` ist TRUE, ein Treffer genügt.
  - `5 > ANY (SELECT x FROM t)`: TRUE, weil 5 > 3. `1 > ANY (…)`: UNKNOWN.
  - `10 > ALL (SELECT x FROM t)`: TRUE AND TRUE AND UNKNOWN = UNKNOWN. `1 > ALL (…)`: FALSE, weil 1 > 3 schon falsch ist.
  
  Merke: Entscheidet kein Einzelvergleich das Ergebnis, ist es UNKNOWN. Im WHERE fällt die Zeile dann heraus. Unter `NOT` bleibt sie ebenfalls draußen; daher kommt die NOT-IN-Falle.
- **Korreliert**, Beispiel: Instrumente, deren Leihgebühr über dem Durchschnitt der eigenen Familie liegt:

```sql
SELECT i.bezeichnung, i.familie, i.leihgebuehr
FROM instrument i
WHERE i.leihgebuehr > (SELECT AVG(CAST(i2.leihgebuehr AS DOUBLE PRECISION))
                       FROM instrument i2
                       WHERE i2.familie = i.familie);
```

Die Unterabfrage verweist auf `i.familie` und ist allein nicht lauffähig. Instrumente ohne Leihgebühr fallen heraus: `NULL > …` ist UNKNOWN.

**Unterabfrage in der SELECT-Liste:** Eine skalare, meist korrelierte Unterabfrage liefert je Zeile einen Wert, z. B. die Zahl der Kurse je Lehrkraft:

```sql
SELECT l.person_id,
       (SELECT COUNT(*) FROM kurs k
        WHERE k.lehrkraft_id = l.person_id) AS kurse
FROM lehrkraft l;
```

Hätte eine Lehrkraft keinen Kurs, stünde hier richtig 0 – anders als beim LEFT JOIN mit `COUNT(*)`. Ein GROUP BY ist nicht nötig.

**Unterabfrage im FROM (abgeleitete Tabelle, *derived table*):** Das Ergebnis wird wie eine Tabelle benutzt. Nach dem SQL-Standard braucht sie einen Alias. Firebird 3 und PostgreSQL ab Version 16 erlauben auch, ihn wegzulassen. Mit Alias läuft die Abfrage überall, und die Spalten lassen sich eindeutig ansprechen (`t.anzahl`); vergib ihn deshalb immer. So lassen sich Aggregate über Aggregate bilden, die direkt verboten sind (`AVG(COUNT(*))`). Beispiel: durchschnittliche Zahl der Belegungen je belegtem Kurs:

```sql
SELECT AVG(CAST(t.anzahl AS DOUBLE PRECISION)) AS schnitt
FROM (SELECT kurs_id, COUNT(*) AS anzahl
      FROM belegung
      GROUP BY kurs_id) t;
```

## Datums-, Zeichenketten- und Konvertierungsfunktionen

### Datum und Uhrzeit

| Zweck | Firebird 3 | PostgreSQL |
| --- | --- | --- |
| heutiges Datum, jetzige Uhrzeit, Zeitstempel | `CURRENT_DATE`, `CURRENT_TIME`, `CURRENT_TIMESTAMP` | gleich |
| Tage zwischen zwei Daten | `b - a`, auch `DATEDIFF(DAY FROM a TO b)` oder `DATEDIFF(DAY, a, b)` | `b - a` |
| Tage addieren | `d + 7`, auch `DATEADD(7 DAY TO d)` oder `DATEADD(DAY, 7, d)` | `d + 7` |
| Monat addieren | `DATEADD(1 MONTH TO d)` oder `DATEADD(MONTH, 1, d)` | `d + INTERVAL '1 month'` (liefert timestamp) |
| Jahr, Monat, Tag | `EXTRACT(YEAR FROM d)` | gleich |
| Wochentag (0 = Sonntag) | `EXTRACT(WEEKDAY FROM d)` | `EXTRACT(DOW FROM d)` |
| Tag im Jahr | `EXTRACT(YEARDAY FROM d)`, **1. Januar = 0** | `EXTRACT(DOY FROM d)`, **1. Januar = 1** |

`DATEADD` und `DATEDIFF` haben in Firebird zwei gleichwertige Formen: die Schreibweise mit `TO` bzw. `FROM … TO` und die Kommaform *(Einheit, Menge, Datum)* bzw. *(Einheit, Anfang, Ende)*. Beide gibt es nur in Firebird; die Differenz `b - a` und `d + 7` sind portabel. Beim Tag im Jahr unterscheiden sich die Systeme um 1. Portabel rechnet man vom 1. Januar des jeweiligen Jahres aus; für Daten aus 2025 also `d - DATE '2025-01-01' + 1`. Aufgaben mit festem Ergebnis dürfen nicht von `CURRENT_DATE` abhängen.

### Zeichenketten

| Zweck | Firebird 3 und PostgreSQL |
| --- | --- |
| Verkettung, Teilstring | `a || b`, `SUBSTRING(x FROM 1 FOR 3)` |
| Anfang, Ende | `LEFT(x, 3)`, `RIGHT(x, 4)` |
| Position, Länge | `POSITION('@' IN x)` (0, wenn nicht enthalten), `CHAR_LENGTH(x)` |
| Groß-/Kleinschreibung | `UPPER(x)`, `LOWER(x)` |
| Auffüllen auf Länge n | `LPAD(x, 8, '0')` links, `RPAD(x, 8, '.')` rechts; ohne drittes Argument mit Leerzeichen; längere Werte werden gekürzt |
| Zeichen entfernen | `TRIM(x)` beidseitig Leerzeichen; `TRIM(LEADING '0' FROM x)`, `TRIM(TRAILING '.' FROM x)`, `TRIM(BOTH '-' FROM x)` |

Abweichend: Werte einer Gruppe als Liste heißen in Firebird `LIST(x, ', ')`, in PostgreSQL `STRING_AGG(x, ', ')`.

Weil `POSITION` ohne Treffer 0 liefert, wird `SUBSTRING(x FROM 1 FOR POSITION('@' IN x) - 1)` bei einem Wert ohne `@` zu einer Länge von −1 und bricht mit einem Fehler ab. Bei unsicheren Daten vorher mit `WHERE x LIKE '%@%'` filtern oder mit `CASE` abfangen.

### Mathematische Funktionen

| Funktion | Bedeutung | Beispiele |
| --- | --- | --- |
| `ROUND(x, n)` | auf n Nachkommastellen runden, n darf negativ sein | `ROUND(3.14159, 2)` = 3,14; `ROUND(1234.5, -2)` = 1200; `ROUND(-2.5)` = −3 |
| `TRUNC(x, n)` | abschneiden (Richtung null) | `TRUNC(-2.7)` = −2 |
| `CEILING(x)` bzw. `CEIL(x)` | kleinste ganze Zahl ≥ x | `CEILING(2.1)` = 3; `CEILING(-2.7)` = −2 |
| `FLOOR(x)` | größte ganze Zahl ≤ x | `FLOOR(2.9)` = 2; `FLOOR(-2.1)` = −3 |
| `MOD(a, b)` | Rest der ganzzahligen Division | `MOD(17, 5)` = 2 |
| `ABS(x)` | Betrag | `ABS(-4)` = 4 |
| `SQRT(x)` | Quadratwurzel | `SQRT(16)` = 4 |
| `POWER(x, y)` | Potenz xʸ | `POWER(2, 10)` = 1024 |

Merke bei negativen Zahlen: `CEILING` rundet Richtung +∞, `FLOOR` Richtung −∞, `TRUNC` Richtung null. `ROUND` rundet eine genaue 5 vom Nullpunkt weg (bei NUMERIC in beiden Systemen). Negative Stellenzahl rundet auf Zehner, Hunderter usw.

Dialektunterschiede: Firebird behält bei `ROUND(x, n)` die Skala des Arguments (`ROUND(123.654, 1)` = 123.700). PostgreSQL kennt `ROUND` mit Stellenzahl nur für `NUMERIC`, nicht für `DOUBLE PRECISION` – dort vorher `CAST(… AS NUMERIC(12,4))`. `MOD` rundet in Firebird nicht ganzzahlige Argumente vor der Division, PostgreSQL rechnet mit dem echten Rest. Verwende `MOD` deshalb nur mit ganzen Zahlen. `SQRT` und `POWER` liefern in Firebird `DOUBLE PRECISION`.

### Typumwandlung und Sonstiges

Typumwandlung mit `CAST(x AS typ)`, z. B. `CAST('2025-03-01' AS DATE)`. Bei `CHAR(n)`-Spalten zählt Firebird die Füllzeichen mit (`CHAR_LENGTH`) – `TRIM(x)` verwenden. `COALESCE` und `NULLIF` gibt es in beiden, ebenso das **CASE**-Konstrukt:

```sql
CASE WHEN plaetze >= 10 THEN 'Saal'
     WHEN plaetze >= 4  THEN 'Gruppenraum'
     ELSE 'Einzelraum' END AS kategorie
```

Die Zweige werden von oben geprüft; der erste mit TRUE gewinnt.

## Logische Auswertungsreihenfolge

Die Schreibreihenfolge ist nicht die Reihenfolge, in der eine Abfrage logisch ausgewertet wird. Nach dem SQL-Standard (und so beschreibt es auch PostgreSQL) gilt:

1. `FROM` mit allen Joins – die Zwischentabelle entsteht,
2. `WHERE` – Zeilen filtern,
3. `GROUP BY` – Gruppen bilden,
4. `HAVING` – Gruppen filtern,
5. `SELECT` – Ausgabespalten berechnen, **jetzt** entstehen die Aliase,
6. `DISTINCT`, danach Mengenoperationen,
7. `ORDER BY` – sortieren,
8. Ergebnisbegrenzung (`OFFSET … FETCH`, `FIRST`/`SKIP`, `LIMIT`).

Folgen: Ein Alias der SELECT-Liste ist im `WHERE` und `HAVING` unbekannt, im `ORDER BY` aber erlaubt. Aggregate sind im `WHERE` verboten, weil es dort noch keine Gruppen gibt. Dialekt-Ausnahme: Firebird und PostgreSQL akzeptieren Aliase und Spaltennummern auch im `GROUP BY` – beim Schreiben von Hand besser den Ausdruck wiederholen. Die Reihenfolge beschreibt die **Bedeutung** der Abfrage, nicht den Ablauf: Der Optimierer darf umordnen, solange das Ergebnis gleich bleibt.

### Andere Darstellungen der Reihenfolge

Nicht alle Lehrmaterialien und Lehrbücher zeigen die Reihenfolge so. Zwei Varianten sind verbreitet:

| Darstellung | Reihenfolge | „SELECT“ bedeutet dort … |
| --- | --- | --- |
| Standardsicht | FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY | Ausgabewerte berechnen |
| Variante A | FROM → WHERE → SELECT → GROUP BY → HAVING → ORDER BY | festlegen, welche Spalten und Ausdrücke ins Ergebnis kommen |
| Variante B | FROM → WHERE → GROUP BY → HAVING → ORDER BY → SELECT | die fertig sortierte Zwischentabelle auf die Ausgabespalten zuschneiden |

Wie kommt es dazu? Die Darstellungen fassen den Schritt „SELECT“ verschieden auf. In der Standardsicht ist er das **Berechnen** der Ausgabewerte. Ein Ausdruck wie `SUM(b.menge)` lässt sich erst berechnen, wenn die Gruppen feststehen, deshalb steht SELECT nach HAVING. Variante A meint mit SELECT die **Auswahl der Spalten**, die vor dem Gruppieren festgelegt wird. Variante B meint mit SELECT das **Wegschneiden** aller nicht ausgegebenen Spalten, also die Projektion als letzten Schritt. Sortiert wird dort auf der noch vollständigen Zwischentabelle. Alle drei beschreiben dieselbe Abfrage mit demselben Ergebnis.

Was jede Sicht gut erklärt:
- **Standardsicht:** Ein Alias ist im `HAVING` unbekannt, im `ORDER BY` bekannt. Firebird und PostgreSQL verlangen im HAVING den Ausdruck (`HAVING SUM(b.menge) > 50`).
- **Variante A:** Firebird und PostgreSQL erlauben im `GROUP BY` einen Alias oder eine Spaltennummer aus der SELECT-Liste. Das passt zu einer Sicht, in der die Ausgabespalten vor dem Gruppieren benannt werden. Dass der Alias im HAVING trotzdem verboten ist, erklärt diese Sicht nicht; das ist dort einfach eine Regel der Systeme.
- **Variante B:** Man darf nach Spalten sortieren, die gar nicht ausgegeben werden (`SELECT titel FROM kurs ORDER BY gebuehr_monat`), denn beim Sortieren sind noch alle Spalten da. Dass im `ORDER BY` trotzdem ein Alias der SELECT-Liste erlaubt ist, erklärt diese Sicht nicht; das ist dort eine ausdrückliche Erlaubnis der Systeme.
- **In allen Darstellungen** gilt: FROM zuerst, `WHERE` vor der Gruppierung und vor SELECT (ein Alias ist im WHERE deshalb immer unbekannt), `GROUP BY` vor `HAVING`, `ORDER BY` nach `HAVING`, die Ergebnisbegrenzung nach `ORDER BY`. Wo SELECT steht, unterscheidet sich.

**Prüfungstipp:** Verwendet deine Lehrveranstaltung eine andere Reihenfolge, nutze in der Prüfung deren Darstellung und begründe kurz, was der Schritt „SELECT“ dort bedeutet.

## Syntaxschablonen für den Spickzettel

```sql
-- Grundform
SELECT [DISTINCT] a, b, ausdruck AS alias
FROM t1 x
[INNER | LEFT | RIGHT | FULL] JOIN t2 y ON y.fk = x.pk
WHERE bedingung
GROUP BY a, b
HAVING aggregatbedingung
ORDER BY a [ASC | DESC] [NULLS FIRST | NULLS LAST], pk
OFFSET m ROWS FETCH NEXT n ROWS ONLY;      -- Standard, beide Systeme

SELECT FIRST n SKIP m … ORDER BY …;        -- Firebird
SELECT … ORDER BY … LIMIT n OFFSET m;      -- PostgreSQL

-- Prädikate
x LIKE 'A_%'        x BETWEEN a AND b       x IN (1, 2, 3)
x IS [NOT] NULL     x IS NOT DISTINCT FROM y

-- Unterabfragen
WHERE x IN (SELECT …)
WHERE EXISTS (SELECT 1 FROM t WHERE t.fk = aussen.pk)
WHERE x > ALL (SELECT …)    WHERE x = ANY (SELECT …)
WHERE x = (SELECT MAX(x) FROM t)            -- alle mit Höchstwert
SELECT a, (SELECT COUNT(*) FROM t WHERE t.fk = aussen.pk) AS n FROM …
SELECT … FROM (SELECT …) abgeleitet         -- Alias: Standard verlangt ihn, immer angeben

-- Mengen in Firebird 3
SELECT … UNION [ALL] SELECT … ORDER BY 1;
-- ∩: WHERE EXISTS (…)     − : WHERE NOT EXISTS (…)

-- Funktionen
ROUND(x, n)  TRUNC(x, n)  CEILING(x)  FLOOR(x)  MOD(a, b)  ABS(x)  SQRT(x)  POWER(x, y)
LEFT(s, n)  RIGHT(s, n)  LPAD/RPAD(s, n, 'z')  TRIM([LEADING|TRAILING|BOTH] 'z' FROM s)
DATEADD(7 DAY TO d) = DATEADD(DAY, 7, d)   DATEDIFF(DAY FROM a TO b) = DATEDIFF(DAY, a, b)   -- Firebird
```

## Auf einen Blick

- Schreibreihenfolge SELECT–FROM–WHERE–GROUP BY–HAVING–ORDER BY; logisch (Standard) FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. Darstellungen mit SELECT vor GROUP BY oder ganz am Ende fassen den Schritt SELECT anders auf (Spaltenauswahl bzw. Projektion zuletzt).
- SQL liefert Multimengen; `DISTINCT` entfernt doppelte Zeilen.
- Vergleiche mit NULL ergeben UNKNOWN; WHERE, HAVING und ON behalten nur TRUE; fehlende Werte mit `IS NULL` prüfen.
- `COUNT(*)` zählt Zeilen, `COUNT(spalte)` nur Werte; die übrigen Aggregate übergehen NULL und liefern bei leerer Eingabe NULL.
- WHERE filtert Zeilen vor, HAVING Gruppen nach dem Gruppieren; nicht aggregierte Spalten gehören ins GROUP BY.
- NULL-Sortierung ist systemabhängig – `NULLS FIRST/LAST` angeben. Begrenzung: `FIRST/SKIP`, `LIMIT/OFFSET` oder portabel `OFFSET … FETCH`.
- Äußere Joins füllen fehlende Partner mit NULL; Bedingungen auf die rechte Seite gehören ins ON. NATURAL JOIN nutzt alle gleichnamigen Spalten.
- Firebird 3 kennt kein INTERSECT, EXCEPT, LIMIT – Ersatz: EXISTS/NOT EXISTS bzw. FIRST/SKIP.
- `NOT IN` gegen eine Liste mit NULL ist leer; sicherer ist `NOT EXISTS`. ALL über eine leere Menge ist TRUE. Entscheidet bei IN/ANY/ALL kein Einzelvergleich, ist das Ergebnis UNKNOWN.
- Unterabfragen: skalar, Liste, Tabelle; korreliert heißt „allein nicht lauffähig“. Extremwerte mit `= (SELECT MAX …)` liefern alle Gleichplatzierten, `FIRST 1` nur einen.
- Text in einfachen Anführungszeichen, Bezeichner in doppelten; Platzhalter nur `%` und `_`. Datumswerte portabel als `DATE 'JJJJ-MM-TT'`.
- AVG über ganze Zahlen oder NUMERIC wird in Firebird abgeschnitten – vorher in einen genaueren Typ umwandeln.
