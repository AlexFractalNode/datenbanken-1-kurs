---
id: t11
lang: de
title: SQL-DML
order: 11
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: firebird-30-language-reference
    ref: "Kap. 3 Datentypen (Dialekt 3: keine implizite Umwandlung in Ausdrücken außer Verkettung, CAST nötig); Kap. 6.2 INSERT (VALUES liefert genau eine Zeile, INSERT … SELECT null bis viele Zeilen, Zuweisungskompatibilität der Werte zu den Spalten, DEFAULT VALUES); 6.2.4, 6.3.5, 6.5.5 RETURNING (höchstens eine Zeile; in DSQL bei null betroffenen Zeilen eine Zeile mit NULL-Werten, in PSQL mit INTO keine Rückgabe; OLD/NEW bei UPDATE); 6.3 UPDATE (ohne WHERE alle Zeilen, Alias); 6.3.2 SET-Klausel (rechte Seiten mit den alten Werten, geändert in 2.5; jede Spalte nur einmal); 6.4 UPDATE OR INSERT (MATCHING); 6.5 DELETE (ohne WHERE alle Zeilen); 6.6 MERGE (WHEN MATCHED UPDATE/DELETE, WHEN NOT MATCHED INSERT); 5.4.1 CREATE TABLE (FK-Aktionen NO ACTION, CASCADE, SET DEFAULT, SET NULL für ON DELETE und ON UPDATE); 5.14 SEQUENCE (NEXT VALUE FOR, GEN_ID); Transaktionssteuerung (COMMIT, ROLLBACK, SAVEPOINT)"
  - id: firebird-25-release-notes
    ref: "OldSetClauseSemantics (UPDATE … SET: ab Firebird 2.5 sehen die rechten Seiten nur die Ausgangswerte der Zeile, nicht bereits zugewiesene neue Werte): https://firebirdsql.org/file/documentation/release_notes/html/en/2_5/rnfb25-fbconf-oldset.html"
  - id: postgresql-17-docs-sql
    ref: "Kap. 6 Data Manipulation: 6.1 Inserting Data, 6.2 Updating Data, 6.3 Deleting Data, 6.4 Returning Data from Modified Rows: https://www.postgresql.org/docs/17/dml.html ; 5.5.5 Foreign Keys (NO ACTION, RESTRICT, CASCADE, SET NULL, SET DEFAULT; SET DEFAULT braucht eine passende Elternzeile); 10.4 Value Storage (Umwandlung in den Spaltentyp beim Speichern)"
  - id: postgresql-17-docs-sql-commands
    ref: "INSERT (mehrere Zeilen in VALUES, DEFAULT in der Werteliste, DEFAULT VALUES, fehlende Spalten erhalten Default oder NULL, RETURNING je Zeile, ON CONFLICT DO NOTHING/DO UPDATE mit EXCLUDED): https://www.postgresql.org/docs/17/sql-insert.html ; UPDATE (FROM, Unterabfrage im SET); DELETE (USING); TRUNCATE (CONTINUE/RESTART IDENTITY, keine ON-DELETE-Trigger, Abweisung bei Fremdschlüsseln anderer Tabellen, CASCADE, transaktional): https://www.postgresql.org/docs/17/sql-truncate.html ; CREATE TABLE (DEFERRABLE INITIALLY DEFERRED); CREATE SEQUENCE (nextval); SAVEPOINT, ROLLBACK TO SAVEPOINT; MERGE"
  - id: sqlite-documentation
    ref: "Foreign Key Support (Einfügen einer Kindzeile ohne Elternzeile scheitert; Wirkung von CASCADE, SET NULL, SET DEFAULT und NO ACTION beim Löschen und Ändern der Elternzeile; aufgeschobene Fremdschlüssel mit DEFERRABLE INITIALLY DEFERRED): https://www.sqlite.org/foreignkeys.html"
  - id: wikibooks-einfuehrung-in-sql
    ref: "Kapitel „DML (2) – Daten speichern“ (INSERT einzeln und mit SELECT, UPDATE und DELETE ohne WHERE wirken auf alle Zeilen, TRUNCATE technisch nahe der DDL, aus Anwendersicht DML): https://de.wikibooks.org/wiki/Einf%C3%BChrung_in_SQL:_DML_(2)_-_Daten_speichern ; „Fremdschlüssel-Beziehungen“ (Einfüge- und Löschreihenfolge); „TCL – Ablaufsteuerung“"
  - id: oer-informatik-datenbanken
    ref: "SQL INSERT/UPDATE/DELETE (https://oer-informatik.de/sql-dml-insert ; https://oer-informatik.de/sql-dml-update ; https://oer-informatik.de/sql-dml-delete): UPDATE ohne WHERE, Vorab-Prüfung per SELECT, Unterabfragen als neuer Wert (auch korreliert), Bedingungen über andere Tabellen, NULL setzen und finden; SQL DDL (https://oer-informatik.de/sql-ddl-basics): Vergleich DELETE/TRUNCATE/DROP (TRUNCATE setzt AUTO_INCREMENT zurück, scheitert bei verweisenden Fremdschlüsseln; in MariaDB/MySQL implizites COMMIT, nicht zurückrollbar)"
  - id: wp-data-manipulation-language
    ref: "INSERT, UPDATE, DELETE; Abgrenzung zur DQL; TRUNCATE (Zähler wird zurückgesetzt)"
  - id: wp-referentielle-integritaet
    ref: "Fremdschlüsselbedingung beim Einfügen und Ändern; Lösch- und Änderungsweitergabe, Abweisung, mehrstufige Weitergabe, Zurücksetzen bei Verletzung"
  - id: wp-transaktion-informatik
    ref: "Transaktion als Einheit, ACID, COMMIT und ROLLBACK"
---

# SQL-DML

## Lernziele

Nach diesem Thema kannst du …

- `INSERT`-Anweisungen mit und ohne Spaltenliste sowie `INSERT … SELECT` von Hand schreiben und vorhersagen, welche Werte Default- und Identity-Spalten bekommen,
- `UPDATE` und `DELETE` mit berechneten Werten, Bedingungen und Unterabfragen formulieren, die betroffenen Zeilen bestimmen und `DELETE` von `TRUNCATE` und `DROP` abgrenzen,
- für eine Folge von Anweisungen vorhersagen, welche das DBMS abweist (Typ, NOT NULL, PRIMARY KEY, UNIQUE, CHECK, Fremdschlüssel) und wie die Tabelle danach aussieht,
- die Wirkung von `CASCADE`, `SET NULL`, `SET DEFAULT` und `NO ACTION` bei `ON DELETE` und `ON UPDATE` über mehrere Tabellen hinweg vorhersagen,
- Zeilen in einer gültigen Reihenfolge einfügen und automatisch vergebene Schlüssel richtig weiterverwenden,
- erklären, wie `COMMIT` und `ROLLBACK` Änderungen abschließen oder verwerfen.

## Überblick

Die DML (*Data Manipulation Language*, deutsch auch Datenmanipulationssprache) ändert den **Inhalt** von Tabellen, ihre Struktur bleibt gleich. Drei Anweisungen bilden den Kern: `INSERT` fügt Zeilen ein, `UPDATE` ändert sie, `DELETE` entfernt sie. Manche Quellen zählen auch `SELECT` zur DML (siehe Thema t09). Statt „Zeile“ liest man oft „Datensatz“ oder „Tupel“. Die Tabelle, auf die ein Fremdschlüssel zeigt, heißt hier Elterntabelle, die verweisende Kindtabelle. Andere Texte sagen Master- und Detailtabelle oder Vater- und Sohntabelle.

Alle drei haben gemeinsam:

- Sie wirken auf genau **eine** Zieltabelle, aber auf eine ganze Menge von Zeilen. Welche Zeilen das sind, legt bei `UPDATE` und `DELETE` die WHERE-Bedingung fest. Getroffen werden nur Zeilen, für die sie TRUE ergibt.
- Das DBMS prüft jede neue oder geänderte Zeile. Verletzt auch nur eine Zeile eine Regel, wird die **ganze Anweisung** abgewiesen, und es bleibt nichts halb geändert.
- Trifft eine Anweisung keine Zeile, ist das kein Fehler. Das DBMS meldet dann „0 Zeilen betroffen“.

**Wann eine Anweisung abgewiesen wird.** Für jede betroffene Zeile prüft das DBMS:

| Prüfung | abgewiesen, wenn … |
| --- | --- |
| Datentyp | sich ein Wert nicht in den Spaltentyp umwandeln lässt, eine Zeichenkette länger ist als `VARCHAR(n)` erlaubt oder eine Zahl außerhalb des Wertebereichs liegt (z. B. 40000 in `SMALLINT`) |
| NOT NULL | die Spalte NULL bekäme, weil der Wert fehlt und es keinen Default gibt, oder weil NULL ausdrücklich dasteht |
| PRIMARY KEY, UNIQUE | der Wert (bzw. die Wertkombination) schon in einer anderen Zeile steht. Bei einspaltigem UNIQUE darf NULL mehrfach vorkommen (mehrspaltig: Dialektunterschied, siehe t09) |
| CHECK | die Bedingung FALSE ergibt. UNKNOWN (z. B. durch NULL) gilt als erfüllt |
| FOREIGN KEY | der Wert weder NULL ist noch in der Elterntabelle vorkommt |

Wird ein Literal einer Spalte zugewiesen (in `VALUES` oder im `SET`), wandelt das DBMS es in den Spaltentyp um, wenn das möglich ist. `'2.20'` in einer `NUMERIC`-Spalte wird zur Zahl 2,20, `'2025-03-01'` in einer `DATE`-Spalte zum Datum (in Firebird 3 getestet). `'zwei Euro'` oder `'2025-13-01'` lassen sich nicht umwandeln, und die Anweisung scheitert. Das gilt nur für die Zuweisung: In Rechenausdrücken wie `'2.20' * 2` wandelt Firebird 3 (Dialekt 3) Zeichenketten nicht automatisch um und verlangt `CAST`. Sauberer ist es ohnehin, Zahlen ohne Anführungszeichen und Datumswerte als `DATE '2025-03-01'` zu schreiben.

> **Dialektunterschied Stellenzahl:** PostgreSQL weist einen Wert ab, der mehr Vorkommastellen hat, als `NUMERIC(p,s)` erlaubt. Firebird 3 erzwingt die Präzision bei kleinem `p` (bis 9) nicht und nimmt etwa 99999.99 in `NUMERIC(6,2)` an. Obergrenzen sichert man deshalb besser mit `CHECK` ab.

Laufendes Beispiel ist ein Hofladen mit Online-Bestellung:

```sql
CREATE TABLE kunde (
    kunde_id   INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name       VARCHAR(40) NOT NULL,
    email      VARCHAR(60) UNIQUE,
    stammkunde BOOLEAN DEFAULT FALSE NOT NULL
);
CREATE TABLE produkt (
    produkt_id  INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    bezeichnung VARCHAR(40) NOT NULL UNIQUE,
    preis       NUMERIC(6,2) NOT NULL,
    vorrat      INTEGER DEFAULT 0 NOT NULL
);
CREATE TABLE bestellung (
    bestellung_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    kunde_id      INTEGER REFERENCES kunde (kunde_id) ON DELETE SET NULL,
    datum         DATE NOT NULL
);
CREATE TABLE bestellposten (
    bestellung_id INTEGER NOT NULL REFERENCES bestellung (bestellung_id) ON DELETE CASCADE,
    produkt_id    INTEGER NOT NULL REFERENCES produkt (produkt_id),
    menge         SMALLINT NOT NULL CHECK (menge > 0),
    PRIMARY KEY (bestellung_id, produkt_id)
);
```

## INSERT

Verkürzte Grammatik (Firebird 3):

```
INSERT INTO tabelle [(spalte, …)]
  { VALUES (wert, …) | select-anweisung | DEFAULT VALUES }
  [RETURNING spalte, …]
```

**Mit Spaltenliste** (empfohlen) nennst du nur die Spalten, für die du einen Wert hast:

```sql
INSERT INTO produkt (bezeichnung, preis)
VALUES ('Honig 500 g', 6.50);
```

Für jede Spalte, die in der Liste fehlt, gilt:

- Eine Identity-Spalte bekommt den nächsten Zählerwert (hier `produkt_id`).
- Eine Spalte mit Default bekommt den Default (hier `vorrat = 0`).
- Alle anderen werden NULL. Ist eine solche Spalte `NOT NULL`, wird das INSERT abgewiesen.

Ein ausdrücklich geschriebenes `NULL` überschreibt den Default: `INSERT INTO produkt (bezeichnung, preis, vorrat) VALUES ('Eier, 6 Stück', 2.40, NULL)` scheitert an `NOT NULL`, statt 0 einzusetzen.

**Eine Folge von INSERTs durchgehen.** Angenommen, `produkt` ist leer und jede Anweisung läuft für sich:

| Anweisung | Ergebnis |
| --- | --- |
| `INSERT INTO produkt (bezeichnung, preis) VALUES ('Quark', '2.20')` | gelingt: ID vom Zähler, Preis 2,20 (Literal umgewandelt), Vorrat 0 (Default) |
| `INSERT INTO produkt (bezeichnung, preis) VALUES ('Quark', 2.50)` | abgewiesen: `bezeichnung` ist UNIQUE |
| `INSERT INTO produkt (bezeichnung) VALUES ('Butter')` | abgewiesen: `preis` ist NOT NULL und hat keinen Default |
| `INSERT INTO produkt (bezeichnung, preis) VALUES ('Butter', 'zwei Euro')` | abgewiesen: kein gültiger Zahlenwert |
| `INSERT INTO produkt (bezeichnung, preis, vorrat) VALUES ('Butter', 2.90, 12)` | gelingt |

Danach stehen genau zwei Zeilen in der Tabelle: Quark und Butter.

**Ohne Spaltenliste** braucht jede Spalte einen Wert, genau in der Reihenfolge der Tabellendefinition. Defaults greifen dann nicht, und eine Identity-Spalte müsstest du selbst füllen. Das passt nur zu Tabellen ohne Identity, etwa Zwischentabellen: `INSERT INTO bestellposten VALUES (17, 3, 2);`. Fügt jemand später eine Spalte hinzu, bricht die Anweisung.

**Mehrere Zeilen.** In Firebird 3 liefert `VALUES` genau **eine** Zeile, für drei Produkte schreibst du drei INSERTs. PostgreSQL erlaubt mehrere Wertelisten in einer Anweisung (`VALUES (…), (…)`) und dazu das Schlüsselwort `DEFAULT` als Wert. Firebird 3 weist `DEFAULT` in der Werteliste ab (am Firebird-3-Server getestet). Dort lässt du die Spalte einfach weg. `INSERT INTO t DEFAULT VALUES` füllt in beiden Systemen eine ganze Zeile nur mit Defaults.

**INSERT … SELECT** fügt jede Ergebniszeile einer Abfrage ein, also null bis beliebig viele Zeilen. `VALUES` fällt weg, Konstanten und Ausdrücke in der SELECT-Liste sind erlaubt:

```sql
-- Zum Hoffest bekommt jeder Stammkunde eine (zunächst leere) Bestellung
INSERT INTO bestellung (kunde_id, datum)
SELECT kunde_id, DATE '2025-09-06'
FROM kunde
WHERE stammkunde = TRUE;
```

Spaltenzahl und Typen der SELECT-Liste müssen zur Spaltenliste passen. Willst du nur **einen** Wert aus einer anderen Tabelle holen, geht auch eine skalare Unterabfrage in `VALUES`. Sie darf dann höchstens eine Zeile liefern. Findet sie nichts, wird der Wert NULL, und die Zeile wird trotzdem eingefügt oder scheitert an NOT NULL. `INSERT … SELECT` fügt in diesem Fall dagegen gar keine Zeile ein.

## UPDATE

```
UPDATE tabelle
SET spalte = ausdruck [, spalte = ausdruck …]
[WHERE bedingung]
```

**Ohne WHERE werden alle Zeilen geändert**, ohne Rückfrage. Rechts im SET darfst du den alten Wert verwenden, und mehrere Spalten lassen sich in einer Anweisung ändern:

```sql
-- knappe Produkte: 5 % teurer, 20 Stück nachbestellt
UPDATE produkt
SET preis  = preis * 1.05,
    vorrat = vorrat + 20
WHERE vorrat < 10;
```

Alle Ausdrücke einer Zeile werden mit den Werten **vor** der Änderung berechnet. `SET a = b, b = a` tauscht deshalb die beiden Werte. So verlangt es der Standard, so beschreiben es die PostgreSQL-Doku und die Firebird-Referenz, und die Release Notes zu Firebird 2.5 nennen diese Version als Zeitpunkt der Umstellung. Am Firebird-3-Server ist der Tausch getestet. Jede Spalte darf im SET nur **einmal** vorkommen, `SET preis = 2, preis = 3` ist ein Fehler.

**Unterabfrage im WHERE.** Steht die Bedingung in einer anderen Tabelle, wählst du die Zeilen mit `IN` oder `EXISTS` aus:

```sql
UPDATE kunde
SET stammkunde = TRUE
WHERE kunde_id IN (SELECT kunde_id
                   FROM bestellung
                   WHERE datum >= DATE '2025-01-01'
                   GROUP BY kunde_id
                   HAVING COUNT(*) >= 5);
```

**Unterabfrage im SET.** Eine skalare Unterabfrage liefert den neuen Wert. Sie kann **korreliert** sein, sich also auf die gerade geänderte Zeile beziehen:

```sql
-- Bestellung 42 wird ausgeliefert: Vorrat der enthaltenen Produkte verringern
UPDATE produkt
SET vorrat = vorrat - (SELECT b.menge
                       FROM bestellposten b
                       WHERE b.bestellung_id = 42
                         AND b.produkt_id = produkt.produkt_id)
WHERE produkt_id IN (SELECT produkt_id FROM bestellposten WHERE bestellung_id = 42);
```

Liefert die Unterabfrage im SET mehr als eine Zeile, bricht das UPDATE ab. Liefert sie keine, ist ihr Wert NULL. Ohne das zweite WHERE träfe das UPDATE alle Produkte, auch die, die nicht in Bestellung 42 vorkommen. Für sie ergäbe `vorrat - NULL` den Wert NULL. Weil `vorrat` NOT NULL ist, würde das DBMS dann das **ganze** UPDATE abweisen, auch für die richtigen Produkte. Wäre die Spalte NULL-fähig, ginge der Vorrat dieser Produkte dagegen still verloren. Auch `SUM` über keine Zeilen ist NULL, `COALESCE(SUM(…), 0)` hilft. `COUNT` liefert dagegen 0.

PostgreSQL kennt zusätzlich `UPDATE … FROM andere_tabelle`, Firebird 3 nicht. Die Unterabfrage ist in beiden Systemen die sichere Form.

**Tipp:** Schreib zuerst ein `SELECT` mit derselben WHERE-Bedingung, sieh dir an, welche Zeilen kommen, und vergleiche danach die gemeldete Zahl der geänderten Zeilen damit. In einer offenen Transaktion lässt sich ein Irrtum noch mit `ROLLBACK` verwerfen.

**Primärschlüssel ändern.** Wird ein Schlüssel geändert, auf den Fremdschlüssel zeigen, entscheidet deren `ON UPDATE`-Regel (siehe unten). Ist sie nicht `CASCADE`, geht man in drei Schritten vor: Elternzeile mit dem neuen Schlüssel einfügen, die Kindzeilen per `UPDATE` auf den neuen Wert umhängen, die alte Elternzeile löschen. Hat die Elterntabelle weitere UNIQUE-Spalten, braucht die neue Zeile dort vorübergehend einen anderen Wert, der danach per `UPDATE` korrigiert wird.

## DELETE

```
DELETE FROM tabelle [WHERE bedingung]
```

Ohne WHERE werden **alle** Zeilen gelöscht. Die Tabelle selbst bleibt mit Spalten, Constraints und Rechten bestehen. Auch hier wählt eine Unterabfrage die Zeilen über eine andere Tabelle aus:

```sql
-- ausverkaufte Produkte, die nie bestellt wurden, aus dem Sortiment nehmen
DELETE FROM produkt
WHERE vorrat = 0
  AND NOT EXISTS (SELECT 1 FROM bestellposten b
                  WHERE b.produkt_id = produkt.produkt_id);
```

`NOT IN (SELECT …)` funktioniert hier auch, liefert aber keine einzige Zeile, sobald die Unterabfrage ein NULL enthält (siehe Thema t10). PostgreSQL bietet zusätzlich `DELETE … USING`.

**DELETE, TRUNCATE, DROP.**

| Anweisung | Wirkung | danach |
| --- | --- | --- |
| `DELETE FROM t [WHERE …]` | löscht Zeilen einzeln, referenzielle Aktionen und Trigger wirken je Zeile | Tabelle existiert, ggf. leer |
| `TRUNCATE TABLE t` | leert die ganze Tabelle auf einmal, ohne WHERE, meist schneller | Tabelle existiert, leer |
| `DROP TABLE t` | entfernt die Tabelle selbst (DDL) | Tabelle existiert nicht mehr |

`TRUNCATE` unterscheidet sich von `DELETE FROM t` in mehr als dem Tempo. Die folgenden Punkte gelten für PostgreSQL:

- Es löst keine `ON DELETE`-Trigger aus (nur eigene `ON TRUNCATE`-Trigger) und arbeitet keine zeilenweisen referenziellen Aktionen ab.
- Verweisen Fremdschlüssel **anderer** Tabellen auf `t`, wird `TRUNCATE TABLE t` abgewiesen, außer diese Tabellen werden in derselben Anweisung mitgeleert. Es genügt, dass ein solcher Fremdschlüssel existiert. Ob tatsächlich Zeilen verweisen, prüft PostgreSQL nicht, denn dafür müsste es die Tabellen durchsuchen. `TRUNCATE TABLE t CASCADE` leert alle verweisenden Tabellen **vollständig** mit, nicht nur die passenden Zeilen.
- Es ist in PostgreSQL transaktional: Ein `ROLLBACK` stellt die Zeilen wieder her.
- Der Identity-Zähler läuft standardmäßig weiter (`CONTINUE IDENTITY`). Nur `TRUNCATE TABLE t RESTART IDENTITY` setzt ihn zurück.

> **Varianten:** Zähler und Transaktion verhalten sich je nach System verschieden. In MariaDB und MySQL setzt `TRUNCATE` den `AUTO_INCREMENT`-Zähler zurück. Außerdem löst es dort wie jede DDL-Anweisung ein implizites `COMMIT` aus und lässt sich nicht mit `ROLLBACK` zurücknehmen. PostgreSQL behält den Zähler ohne Zusatz und kann TRUNCATE zurückrollen. Auch die Einordnung schwankt: Technisch steht `TRUNCATE` der DDL nahe, aus Sicht der Anwendung leert es nur Inhalte und wird deshalb oft bei der DML genannt. Firebird 3 kennt `TRUNCATE` nicht (am Firebird-3-Server getestet). Dort schreibt man `DELETE FROM t`.

## Wirkung referenzieller Aktionen

Fremdschlüssel prüft das DBMS bei jeder DML-Anweisung, und zwar von beiden Seiten:

| Anweisung | was geprüft wird | Folge |
| --- | --- | --- |
| INSERT in die Kindtabelle, UPDATE ihrer FK-Spalte | Wert ist NULL oder existiert in der Elterntabelle | sonst abgewiesen |
| DELETE in der Elterntabelle | `ON DELETE`-Regel | CASCADE, SET NULL, SET DEFAULT oder Abweisung |
| UPDATE des Schlüssels in der Elterntabelle | `ON UPDATE`-Regel | wie oben, CASCADE übernimmt den neuen Wert |

Die Aktionen selbst sind in Thema t09 definiert. CASCADE heißt in manchen Texten Lösch- bzw. Änderungsweitergabe. Für die Vorhersage zählt, was jede Aktion mit den Kindzeilen macht und woran sie scheitern kann:

| Aktion | ON DELETE (Elternzeile gelöscht) | ON UPDATE (Elternschlüssel geändert) | scheitert, wenn … |
| --- | --- | --- | --- |
| `NO ACTION` (Standard) | Abweisung | Abweisung | nur dann, wenn tatsächlich Kindzeilen auf den alten Wert verweisen |
| `CASCADE` | Kindzeilen mitlöschen | Kindzeilen übernehmen den neuen Wert | eine Regel weiter unten in der Kette abweist |
| `SET NULL` | FK der Kindzeilen wird NULL | ebenso | die FK-Spalte NOT NULL ist (etwa weil sie zum Primärschlüssel gehört) |
| `SET DEFAULT` | FK der Kindzeilen bekommt den Default | ebenso | es in der Elterntabelle keine Zeile mit dem Default-Schlüssel gibt, oder der neue Wert einen PRIMARY KEY, UNIQUE oder CHECK der Kindtabelle verletzt |

Auch SET NULL und SET DEFAULT ändern Kindzeilen. Für die geänderten Zeilen gelten deshalb alle Regeln der Kindtabelle weiter.

Im Hofladen gilt:

- `DELETE FROM bestellung WHERE bestellung_id = 42` löscht per CASCADE alle Posten dieser Bestellung mit.
- `DELETE FROM kunde WHERE kunde_id = 3` lässt die Bestellungen des Kunden stehen, setzt aber `kunde_id` auf NULL (SET NULL). Die Posten bleiben unberührt.
- `DELETE FROM produkt WHERE produkt_id = 5` wird abgewiesen, solange ein Posten das Produkt enthält (keine Aktion = `NO ACTION`). Ein Produkt, das in keinem Posten vorkommt, lässt sich dagegen ohne Weiteres löschen.
- Angenommen, `bestellung.kunde_id` hätte `DEFAULT 0` und `ON DELETE SET DEFAULT` statt SET NULL. Dann bräuchte `kunde` eine Platzhalterzeile mit `kunde_id = 0` („Laufkundschaft“). Ohne sie würde jedes `DELETE` eines Kunden mit Bestellungen abgewiesen, weil der Default selbst den Fremdschlüssel verletzt. Bei `bestellposten.produkt_id` ginge das nicht gut: Die Spalte gehört zum Primärschlüssel, und zwei gelöschte Produkte derselben Bestellung ergäben zweimal `(bestellung_id, 0)`.

**Mehrstufige Wirkung.** Beim Löschen setzt nur CASCADE eine Kette fort: Werden Kindzeilen gelöscht, gelten für sie wieder deren eigene Regeln. SET NULL und SET DEFAULT ändern nur die FK-Spalte der Kindzeile. Die Zeile bleibt, und für ihre eigenen Kinder passiert nichts. Weiter geht es dort nur, wenn die geänderte Spalte selbst wieder von einem Fremdschlüssel referenziert wird. In der Beispieldatenbank Musikschule löscht `DELETE FROM person WHERE person_id = …` für eine Schülerin die Zeile in `schueler` (CASCADE). Davon hängen wiederum Belegungen und Zahlungen ab (CASCADE). Hat sie aber noch eine Ausleihe (`ausleihe → schueler` ohne Aktion), wird die **ganze** Anweisung abgewiesen. Dann bleiben auch Person, Belegungen und Zahlungen unverändert. Beim Vorhersagen gehst du deshalb jede Kette bis zum Ende durch, und eine einzige Sperre entscheidet.

**Reihenfolge.** Beim Einfügen kommen erst die Eltern, dann die Kinder: `kunde` → `bestellung` → `bestellposten`, und `produkt` vor `bestellposten`. Beim Löschen ohne CASCADE ist es umgekehrt. Verweisen zwei Tabellen gegenseitig aufeinander (in der Firma-Datenbank hat eine Abteilung eine Leitung, und Mitarbeitende gehören zu einer Abteilung), fügt man eine Seite zunächst mit NULL ein und trägt den Verweis per `UPDATE` nach:

```sql
INSERT INTO abteilung (bezeichnung, standort) VALUES ('Qualität', 'Westpark');   -- leiter_id NULL
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, abteilung_id)
SELECT 'Ada', 'Brenner', 'ada.brenner@firma.example', DATE '2025-04-01', 5200, abteilung_id
FROM abteilung WHERE bezeichnung = 'Qualität';
UPDATE abteilung
SET leiter_id = (SELECT mitarbeiter_id FROM mitarbeiter WHERE email = 'ada.brenner@firma.example')
WHERE bezeichnung = 'Qualität';
```

> **Variante:** PostgreSQL und SQLite können die Prüfung eines Fremdschlüssels bis zum Ende der Transaktion aufschieben (`DEFERRABLE INITIALLY DEFERRED`). Dann dürfen zwei Zeilen, die aufeinander verweisen, innerhalb einer Transaktion in beliebiger Reihenfolge eingefügt werden. Geprüft wird erst beim `COMMIT`. Firebird 3 kennt aufgeschobene Fremdschlüssel nicht, dort bleibt der Weg über NULL und `UPDATE`.

## Automatische Schlüsselwerte beim Einfügen

Eine Identity-Spalte lässt du im INSERT **weg**, das DBMS setzt den nächsten Zählerwert ein. Der Zähler läuft nur vorwärts. Gelöschte Nummern und Nummern aus zurückgerollten Transaktionen bleiben Lücken. Selbst eingetragene Werte schieben ihn nicht weiter und führen später zu Kollisionen mit dem Primärschlüssel (siehe Thema t09).

Oft braucht man die neue ID sofort, etwa für die Bestellung eines neuen Kunden. Zwei saubere Wege:

```sql
-- 1. RETURNING gibt die vergebene ID zurück (Firebird 3 und PostgreSQL)
INSERT INTO kunde (name, email)
VALUES ('Jara Lenz', 'jara.lenz@example.org')
RETURNING kunde_id;

-- 2. über einen eindeutigen fachlichen Wert nachschlagen
INSERT INTO bestellung (kunde_id, datum)
SELECT kunde_id, DATE '2025-09-06'
FROM kunde
WHERE email = 'jara.lenz@example.org';
```

In Firebird 3 darf eine Anweisung mit `RETURNING` höchstens **eine** Zeile betreffen, sonst gibt es einen Fehler. Betrifft sie gar keine Zeile, liefert Firebird bei einer Anweisung vom Client (DSQL) trotzdem eine Ergebniszeile, und zwar mit lauter NULL-Werten, ohne Fehlermeldung. In PSQL (Trigger, Prozeduren) mit `RETURNING … INTO` kommt dann nichts zurück, und die Variablen behalten ihren Wert. Die Referenz kennzeichnet dieses Verhalten als versionsabhängig. PostgreSQL liefert je betroffener Zeile ein Ergebnis, bei null Zeilen also keins. `RETURNING` gibt es auch bei UPDATE und DELETE:

- **UPDATE:** In Firebird wählt man mit `OLD.spalte` und `NEW.spalte` den Wert vor bzw. nach der Änderung, ohne Angabe gilt der neue. PostgreSQL liefert ohne Zusatz ebenfalls die neuen Werte.
- **DELETE:** Zurück kommen die Werte der gelöschten Zeile. Einen „neuen“ Wert gibt es hier nicht.

Falsch ist `SELECT MAX(kunde_id) + 1` als neue ID: Parallel arbeitende Nutzer bekommen dieselbe Nummer, und der Zähler kennt den Wert nicht. Wer eine Sequenz statt einer Identity-Spalte nutzt, holt den Wert ausdrücklich, und hier unterscheiden sich die Dialekte:

```sql
-- Firebird 3 (Standardform; ältere Schreibweise: GEN_ID(seq_beleg, 1))
INSERT INTO beleg (beleg_nr, text) VALUES (NEXT VALUE FOR seq_beleg, 'Kasse');
-- PostgreSQL
INSERT INTO beleg (beleg_nr, text) VALUES (nextval('seq_beleg'), 'Kasse');
```

## Einfügen oder ändern (Firebird-Hinweis)

Für „anlegen, falls neu, sonst ändern“ (*Upsert*) gibt es keine einheitliche Kurzform:

- **Firebird:** `UPDATE OR INSERT INTO produkt (bezeichnung, preis) VALUES ('Honig 500 g', 6.90) MATCHING (bezeichnung);` Im Änderungsfall werden alle genannten Spalten überschrieben. Ohne `MATCHING` gilt der Primärschlüssel.
- **PostgreSQL:** `INSERT … ON CONFLICT (bezeichnung) DO UPDATE SET preis = EXCLUDED.preis;` Das setzt einen UNIQUE-Constraint auf der Spalte voraus.
- **SQL-Standard:** `MERGE INTO ziel USING quelle ON … WHEN MATCHED THEN UPDATE … WHEN NOT MATCHED THEN INSERT …`, das Firebird 3 und PostgreSQL ab Version 15 können.

## Transaktionen: COMMIT und ROLLBACK

DML-Anweisungen laufen immer in einer **Transaktion** (*transaction*). Das ist eine Folge von Anweisungen, die als Einheit gilt und ganz oder gar nicht wirkt. Eine Bestellung mit ihren Posten und der Vorratsänderung gehört zusammen. Scheitert der dritte Schritt, sollen die ersten beiden nicht stehen bleiben.

- `COMMIT` beendet die Transaktion und macht alle ihre Änderungen dauerhaft und für andere sichtbar.
- `ROLLBACK` verwirft alle Änderungen seit Beginn der Transaktion. Mit `SAVEPOINT name` und `ROLLBACK TO SAVEPOINT name` geht das auch teilweise.
- Viele Werkzeuge bestätigen jede Anweisung automatisch (*Autocommit*). In PostgreSQL ist ohne `BEGIN` jede Anweisung ihre eigene Transaktion. Firebird startet Transaktionen über den Client, der sie meist automatisch beginnt.
- Zählerwerte von Identity-Spalten und Sequenzen gibt ein ROLLBACK nicht zurück.

**Wenn eine Anweisung mitten in der Transaktion scheitert.** Zurückgenommen wird zunächst nur diese eine Anweisung. Die früheren Anweisungen der Transaktion bleiben in beiden Systemen vorerst stehen, ein automatisches ROLLBACK der ganzen Transaktion gibt es nicht. Danach unterscheiden sich die Systeme:

- **Firebird:** Die Transaktion läuft normal weiter (in Firebird 3 getestet). Man kann die nächste Anweisung schicken und am Ende `COMMIT` oder `ROLLBACK` wählen.
- **PostgreSQL:** Die Transaktion gilt als abgebrochen. Jede weitere Anweisung wird abgewiesen, bis die Transaktion endet. Ein `COMMIT` wird zwar angenommen, wirkt aber wie ein `ROLLBACK`: Auch die früheren, erfolgreichen Anweisungen sind danach verworfen. Retten lässt sich nur etwas mit `ROLLBACK TO SAVEPOINT`, falls vorher ein Savepoint gesetzt wurde.

> **Variante:** Manche Darstellungen beschreiben, dass bei einer Verletzung der referenziellen Integrität die ganze Transaktion zurückgesetzt wird. Das ist ein übliches Vorgehen der Anwendung, die auf den Fehler mit `ROLLBACK` reagiert. Firebird und PostgreSQL tun es nicht von selbst.

Isolation, Sperren und die ACID-Eigenschaften im Einzelnen sind Vertiefungsstoff.

## Spickzettel: Syntaxschablonen

```
INSERT INTO t (a, b) VALUES (w1, w2);              -- FB 3: eine Zeile je INSERT
INSERT INTO t (a, b) SELECT x, y FROM q WHERE …;   -- ohne VALUES
INSERT INTO t DEFAULT VALUES;
INSERT INTO t (a) VALUES (w) RETURNING id;          -- FB 3: höchstens eine Zeile
INSERT INTO t (id, a) VALUES (NEXT VALUE FOR s, w);  -- FB; PG: nextval('s')

UPDATE t SET a = ausdruck, b = ausdruck WHERE …;     -- rechts: alte Werte
UPDATE t SET a = (SELECT … WHERE q.k = t.k) WHERE …; -- skalar, ggf. korreliert

DELETE FROM t WHERE …;                              -- ohne WHERE: alle Zeilen
DELETE FROM t WHERE k IN (SELECT k FROM q WHERE …);

UPDATE OR INSERT INTO t (k, a) VALUES (…) MATCHING (k);   -- nur Firebird
COMMIT;   ROLLBACK;   SAVEPOINT s;   ROLLBACK TO SAVEPOINT s;
```

## Auf einen Blick

- DML ändert Inhalte: `INSERT`, `UPDATE`, `DELETE`. Abgewiesen wird bei nicht umwandelbarem Wert, fehlendem Pflichtwert ohne Default, doppeltem PK- oder UNIQUE-Wert, CHECK = FALSE oder ungültigem Fremdschlüssel. Verletzt eine Zeile eine Regel, scheitert die ganze Anweisung.
- INSERT mit Spaltenliste: Fehlende Spalten bekommen Identity-Wert, Default oder NULL. Ohne Spaltenliste braucht jede Spalte einen Wert in Definitionsreihenfolge.
- Firebird 3: eine Zeile je `INSERT … VALUES`, kein `DEFAULT` in der Werteliste. Mehrere Zeilen aus einer Abfrage mit `INSERT … SELECT`.
- UPDATE und DELETE ohne WHERE treffen **alle** Zeilen. Vorher mit `SELECT` und derselben Bedingung prüfen.
- Rechts im SET stehen die alten Werte. Eine skalare Unterabfrage im SET darf höchstens eine Zeile liefern, keine Zeile ergibt NULL.
- `DELETE` löscht Zeilen einzeln, `TRUNCATE` leert alles auf einmal, ohne ON-DELETE-Trigger und zeilenweise Aktionen (nicht in Firebird 3; Zähler und Zurückrollen systemabhängig, z. B. PostgreSQL vs. MariaDB/MySQL), `DROP TABLE` entfernt die Tabelle.
- Einfügen: Eltern vor Kindern. Löschen bei NO ACTION: Kinder vor Eltern. Zyklen über NULL und späteres UPDATE auflösen.
- Nur CASCADE setzt ein Löschen über weitere Ebenen fort. SET NULL und SET DEFAULT ändern nur die FK-Spalte und beenden die Kette. SET NULL scheitert an NOT NULL, SET DEFAULT an einem fehlenden Default-Schlüssel in der Elterntabelle.
- NO ACTION weist nur ab, wenn tatsächlich Kindzeilen verweisen. Trifft eine Kette auf eine solche Sperre, wird die ganze Anweisung abgewiesen.
- Identity-Spalten weglassen. Die neue ID per `RETURNING` (Firebird 3: höchstens eine Zeile) oder über einen eindeutigen Wert holen, nie per `MAX + 1`.
- `COMMIT` macht Änderungen dauerhaft, `ROLLBACK` verwirft sie. Vergebene Zählerwerte bleiben verbraucht.
