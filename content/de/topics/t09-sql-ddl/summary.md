---
id: t09
lang: de
title: SQL-Grundlagen & DDL
order: 9
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: firebird-30-language-reference
    ref: "Kap. 2 SQL Language Structure (Bezeichner ohne Anführungszeichen in Großbuchstaben, Kommentare); Syntax-Notation der Referenz mit [ ] und { | }; Kap. 3 Character Data Types (Kollationen, z. B. UNICODE_CI); Kap. 3 Data Types and Subtypes (SMALLINT/INTEGER/BIGINT, NUMERIC/DECIMAL bis 18 Stellen mit Speicherung als Ganzzahltyp, FLOAT/DOUBLE PRECISION, CHAR/VARCHAR/NCHAR mit Byte-Obergrenze 32 767 bzw. 32 765, DATE/TIME/TIMESTAMP mit 1/10 000 s, BOOLEAN seit 3.0, BLOB-Subtypen TEXT/BINARY, Zeichensatz OCTETS); Kap. 5.3 CREATE/ALTER DOMAIN (DEFAULT, NOT NULL nicht überschreibbar, ein CHECK mit VALUE ohne Namen; Empfehlung NULL-fähige Domäne); Kap. 5 CREATE DATABASE (CREATE SCHEMA als Synonym); Kap. 5.4.1 CREATE TABLE (Spalten- und Tabellen-Constraints, Constraint-Namen bis 31 Zeichen, zugehörige Indexe mit datenbankweit eindeutigem Namen, UNIQUE mit NULL bei mehrspaltigen Schlüsseln, DEFAULT nur Literal/NULL/Kontextvariable, Identity ohne DEFAULT/COMPUTED und ohne Umwandlung, START WITH als Wert vor der ersten Nummer, FK-Aktionen NO ACTION/CASCADE/SET DEFAULT/SET NULL mit Default zum Zeitpunkt der FK-Definition, CHECK mit Unterabfragen); Kap. 5.4.2 ALTER TABLE (ADD ohne COLUMN, DROP, DROP CONSTRAINT, ALTER COLUMN TO/TYPE/POSITION/SET DEFAULT/DROP DEFAULT/SET bzw. DROP NOT NULL/RESTART; Umbenennen nicht bei Spalten in Constraints, Triggern, Prozeduren, Sichten; NOT NULL ohne DEFAULT scheitert bei gefüllter Tabelle; Identity nicht zu gefüllter Tabelle; neuer CHECK prüft Altdaten nicht; keine Typänderung bei PK/UNIQUE/FK-Spalten und bei möglichem Datenverlust; RESTART mit um eins höherem Folgewert); Kap. 5.4.3 DROP TABLE (scheitert bei Abhängigkeiten, keine Zusätze); Kap. 5.14 SEQUENCE (CREATE SEQUENCE/GENERATOR, Startwert 0, INCREMENT, GEN_ID, Bug bei START WITH)"
  - id: postgresql-17-docs-sql
    ref: "4.1 Lexical Structure (Groß-/Kleinschreibung, Kommentare, Semikolon); 5.2 Default Values; 5.5 Constraints (CHECK mit NULL und ohne Unterabfragen, NOT NULL, UNIQUE mit NULLS DISTINCT auch bei mehreren Spalten, PRIMARY KEY erzwingt NOT NULL, FOREIGN KEY mit NO ACTION/RESTRICT/CASCADE/SET NULL/SET DEFAULT, Unterschied NO ACTION/RESTRICT): https://www.postgresql.org/docs/17/ddl-constraints.html ; 5.7 Modifying Tables; Kap. 8 Data Types (numeric: Präzision bis 1000, langsamer als Ganzzahl und Gleitkomma, Überlauf bei zu vielen Stellen; real/double precision als ungefähre Typen; bytea; Bitketten; Zeit mit Mikrosekunden; Zeichensatz der Datenbank gilt für alle Texttypen; FLOAT ohne Angabe = double precision)"
  - id: postgresql-17-docs-sql-commands
    ref: "CREATE TABLE (GENERATED ALWAYS/BY DEFAULT AS IDENTITY, DEFAULT-Ausdrücke), CREATE DOMAIN (mehrere, benennbare Domänen-Constraints; Empfehlung NULL-fähige Domäne), CREATE SEQUENCE (nextval, keine Rückgabe bei Rollback), ALTER TABLE (ADD [COLUMN] mit Default für vorhandene Zeilen, RENAME COLUMN, RENAME TO, ALTER COLUMN TYPE, SET/DROP NOT NULL, ADD/DROP IDENTITY, RESTART, ALTER CONSTRAINT nur für Fremdschlüssel, NOT VALID, RENAME nicht mit anderen Teilbefehlen kombinierbar), CREATE INDEX (Indexname im Schema eindeutig), CREATE DATABASE, CREATE SCHEMA, DROP TABLE (RESTRICT/CASCADE), TRUNCATE; Synopsis-Notation [ ], { | }, … (erklärt im Preface, Abschnitt 3 Conventions: https://www.postgresql.org/docs/17/notation.html)"
  - id: wp-sql
    ref: "Geschichte und Normversionen (SQL-86 bis SQL:2016), Sprachbestandteile (DQL als Teilmenge der DML, DCL als Rechteverwaltung, TCL), Datentypen (FLOAT, REAL, CLOB, BLOB): https://de.wikipedia.org/wiki/SQL"
  - id: wp-data-control-language
    ref: "DCL = Vergabe und Entzug von Berechtigungen, deutsch Datenkontroll- bzw. Datenüberwachungssprache: https://de.wikipedia.org/wiki/Data_Control_Language"
  - id: wikibooks-einfuehrung-in-sql
    ref: "Kapitel „SQL-Befehle“ (DML (1) Daten abfragen, DML (2) Daten speichern, DDL, TCL, DCL); „DDL – Einzelheiten“ (Spaltendefinition, DEFAULT, automatische Zähler mit SEQUENCE in Firebird, ALTER TABLE ohne COLUMN in Firebird, Constraints); „Fremdschlüssel-Beziehungen“ (Optionen NO ACTION, RESTRICT, CASCADE, SET NULL, SET DEFAULT; Einfüge- und Löschreihenfolge): https://de.wikibooks.org/wiki/Einführung_in_SQL:_Fremdschlüssel-Beziehungen"
  - id: oer-informatik-datenbanken
    ref: "SQL DDL (https://oer-informatik.de/sql-ddl-basics): Einteilung DDL/DML/DQL/DCL (DQL oft zur DML gezählt), CREATE TABLE mit benannten Constraints, „Die Reihenfolge zählt“ (Anlegen und Löschen), Autowert-Syntax je DBMS"
  - id: sqlite-documentation
    ref: "Foreign Key Support, Abschnitt 4.3 (NO ACTION als Standard, RESTRICT sofort geprüft, SET NULL, SET DEFAULT, CASCADE): https://www.sqlite.org/foreignkeys.html ; CREATE TABLE (INTEGER PRIMARY KEY, AUTOINCREMENT)"
---

# SQL-Grundlagen & DDL

## Lernziele

Nach diesem Thema kannst du …

- SQL-Anweisungen den Sprachklassen DDL, DML, DQL, DCL und TCL zuordnen und die gängigen Einteilungsvarianten nennen,
- für Attribute passende Datentypen in Firebird 3 wählen und die wichtigsten Unterschiede zu PostgreSQL benennen,
- `CREATE TABLE`-Anweisungen mit benannten Constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, NOT NULL) und Defaults von Hand schreiben – in einer gültigen Reihenfolge,
- die Wirkung von `ON DELETE` und `ON UPDATE` an Beispieldaten vorhersagen,
- Identity-Spalten und Sequenzen anlegen und unterscheiden,
- Tabellen mit `ALTER TABLE` ändern, mit `DROP` entfernen und Wertebereiche mit `CREATE DOMAIN` festlegen.

## SQL und seine Sprachklassen

SQL (*Structured Query Language*) ist eine **deklarative** (nichtprozedurale) und **mengenorientierte** Sprache:

- **Deklarativ:** Du beschreibst, welches Ergebnis du willst. Wie das DBMS dorthin kommt (Reihenfolge, Indexe, Schleifen), entscheidet es selbst.
- **Mengenorientiert:** Eine Anweisung wirkt auf alle Zeilen, die ihre Bedingung erfüllen, nicht auf eine einzelne Zeile. `UPDATE fahrstunde SET dauer_min = 90 WHERE schueler_id = 7` ändert mit einem Befehl alle passenden Stunden.

Der Sprachkern ist genormt: zuerst 1986 von ANSI und 1987 von ISO, danach in Stufen wie SQL-92, SQL:1999 und SQL:2003, seitdem in regelmäßigen Fortschreibungen (z. B. SQL:2011, SQL:2016). Jedes DBMS hat aber einen eigenen **Dialekt** mit Erweiterungen und Lücken. In diesem Kurs ist Firebird 3 die Referenz, PostgreSQL die Vergleichsgröße.

**Schreibregeln.**

- Schlüsselwörter und Bezeichner ohne Anführungszeichen sind unabhängig von der Groß- und Kleinschreibung: `create table Kurs` ist dasselbe wie `CREATE TABLE KURS`. Firebird speichert solche Namen in Großbuchstaben (so sieht es die Norm vor), PostgreSQL in Kleinbuchstaben. Nur in doppelten Anführungszeichen (`"Kurs"`) zählt die Schreibweise.
- Zeichenkettenliterale stehen in **einfachen** Anführungszeichen. Bei der üblichen Sortierfolge (Kollation) wird ihr Inhalt genau so verglichen, wie er dasteht: `'Bar'` und `'bar'` sind dann verschiedene Werte. Firebird kennt auch Kollationen ohne Unterscheidung der Schreibweise (z. B. `UNICODE_CI`), unter denen beide als gleich gelten. Ein Apostroph im Text wird verdoppelt (`'Rock''n''Roll'`).
- Kommentare: `-- bis zum Zeilenende` oder `/* über mehrere Zeilen */`.
- Jede Anweisung endet mit einem Semikolon `;`.
- In diesem Kurs werden Schlüsselwörter groß und Tabellen- und Spaltennamen klein geschrieben.

Die Anweisungen teilt man nach ihrem Zweck in Sprachklassen ein:

| Klasse | Zweck | Befehle |
| --- | --- | --- |
| **DDL** (*Data Definition Language*) | Struktur anlegen, ändern, löschen | `CREATE`, `ALTER`, `DROP` |
| **DML** (*Data Manipulation Language*) | Zeilen einfügen, ändern, löschen | `INSERT`, `UPDATE`, `DELETE` |
| **DQL** (*Data Query Language*) | Daten lesen | `SELECT` |
| **DCL** (*Data Control Language*) | Rechte vergeben und entziehen | `GRANT`, `REVOKE` |
| **TCL** (*Transaction Control Language*) | Transaktionen steuern | `COMMIT`, `ROLLBACK`, `SAVEPOINT` |

> **Einteilungsvarianten:**
>
> - Viele Quellen zählen `SELECT` zur DML (DML = Daten abfragen *und* ändern) und kennen keine eigene DQL.
> - TCL wird nicht überall als eigene Klasse geführt. Manche Darstellungen ordnen `COMMIT` und `ROLLBACK` der DCL zu.
> - **DCL** (deutsch *Datenkontrollsprache* oder *Datenüberwachungssprache*) ist in den offenen Quellen dieses Kurses die Rechtevergabe mit `GRANT` und `REVOKE`. Manche Lehrbücher fassen sie weiter. Dann gehören auch Integritätsregeln, Speicher- und Zugriffsstrukturen (z. B. Indexe), Transaktionen und Datensicherung dazu. Solche Darstellungen setzen die Sprachklassen außerdem in Bezug zur Drei-Ebenen-Architektur (Thema t02).
>
> In der Klausur gibst du an, welche Einteilung du verwendest.

Faustregel: Ändert die Anweisung das **Schema**, ist sie DDL. Ändert sie den **Inhalt**, ist sie DML. `DROP TABLE kunde` ist also DDL, `DELETE FROM kunde` ist DML, obwohl bei beiden Daten verschwinden. Ein Grenzfall ist `TRUNCATE TABLE kunde` in PostgreSQL. Es leert die Tabelle auf einen Schlag, statt Zeilen einzeln zu löschen, und wird deshalb oft zur DDL gezählt. Firebird 3 kennt `TRUNCATE` nicht, dort schreibt man `DELETE FROM kunde`.

**Schemaobjekte der DDL.** DDL-Befehle wirken auf benannte Objekte. In der Regel gibt es für jedes Objekt `CREATE`, `ALTER` und `DROP`:

| Objekt | Firebird 3 | PostgreSQL |
| --- | --- | --- |
| Datenbank | `CREATE DATABASE` (laut Referenz auch `CREATE SCHEMA`; das Werkzeug isql erkennt nur `CREATE DATABASE`) | `CREATE DATABASE` |
| Schema (Namensraum in der Datenbank) | gibt es nicht | `CREATE SCHEMA` |
| Tabelle, Domäne, Sequenz | in diesem Thema | gleich |
| Sicht, Index, Trigger, Prozedur | Thema t12 | gleich |

Synonyme (Zweitnamen für ein Objekt), wie sie manche anderen DBMS anbieten, kennen weder Firebird 3 noch PostgreSQL.

In Firebird und PostgreSQL ist auch DDL transaktional: Ein `ROLLBACK` nimmt ein `CREATE TABLE` zurück. Firebird kann ein neu angelegtes Objekt allerdings erst nach dem `COMMIT` benutzen.

## Datentypen

Ein Datentyp legt fest, welche Werte eine Spalte aufnehmen kann und welche Operationen darauf sinnvoll sind.

| Gruppe | Firebird 3 | Inhalt | PostgreSQL |
| --- | --- | --- | --- |
| exakte Zahl | `SMALLINT` | ganze Zahl, 16 Bit (−32 768 … 32 767) | gleich |
| exakte Zahl | `INTEGER` | ganze Zahl, 32 Bit (ca. ±2,1 Mrd.) | gleich |
| exakte Zahl | `BIGINT` | ganze Zahl, 64 Bit (ca. ±9,2 · 10¹⁸) | gleich |
| exakte Zahl | `NUMERIC(p,s)`, `DECIMAL(p,s)` | Festkommazahl: p Stellen, davon s nach dem Komma, p ≤ 18 | gleich, p bis 1000 |
| ungefähre Zahl | `FLOAT` | binäre Gleitkommazahl, 32 Bit (ca. 7 Stellen) | `REAL` (Achtung: `FLOAT` ohne Angabe ist in PostgreSQL 64 Bit, also `DOUBLE PRECISION`) |
| ungefähre Zahl | `DOUBLE PRECISION` | binäre Gleitkommazahl, 64 Bit (ca. 15 Stellen) | gleich |
| Text | `CHAR(n)` | Text fester Länge, rechts mit Leerzeichen aufgefüllt | gleich |
| Text | `VARCHAR(n)` | Text variabler Länge, n ist Pflicht | n optional |
| Text | `NCHAR(n)`, `NCHAR VARYING(n)` | *national character*: `CHAR(n)` bzw. `VARCHAR(n)` mit fest eingestelltem Zeichensatz (in Firebird ISO8859_1) | kein eigener Typ, für alle Texttypen gilt der Zeichensatz der Datenbank |
| großes Objekt | `BLOB SUB_TYPE TEXT` | langer Text (in der Norm *CLOB*, Character Large Object) | `TEXT` |
| großes Objekt | `BLOB SUB_TYPE BINARY` | Binärdaten wie Bild oder PDF (in der Norm *BLOB*, Binary Large Object) | `BYTEA` |
| Binärwert | `CHAR(n) CHARACTER SET OCTETS` | n Bytes, kein Text (z. B. Prüfsumme) | `BYTEA`, Bitketten `BIT(n)` |
| Zeit | `DATE` / `TIME` / `TIMESTAMP` | nur Datum / nur Uhrzeit / beides; Sekundenbruchteile bis 1/10 000 s | gleich, bis zur Mikrosekunde |
| Wahrheitswert | `BOOLEAN` | `TRUE`, `FALSE`, `UNKNOWN` (= NULL), seit Firebird 3.0 | gleich |

**Exakt oder ungefähr.** Ganzzahltypen und `NUMERIC`/`DECIMAL` sind *exakt*: Jeder Wert im erlaubten Bereich wird genau so gespeichert, wie er geschrieben ist. `FLOAT`, `REAL` und `DOUBLE PRECISION` sind *ungefähr*. Sie decken riesige Wertebereiche ab und rechnen schnell, speichern viele Dezimalbrüche aber nur näherungsweise. Man wägt also **Genauigkeit gegen Geschwindigkeit und Wertebereich** ab. Gleitkommazahlen rechnet der Prozessor direkt in Hardware. Exakte Dezimalzahlen mit vielen Stellen rechnet das DBMS dagegen in Software, so bei `numeric` in PostgreSQL, und das ist deutlich langsamer. Dafür stimmen Summen auf den Cent. Firebird 3 speichert `NUMERIC` bis 18 Stellen als skalierte Ganzzahl, dort ist der Geschwindigkeitsunterschied gering. Gleitkomma passt für Messwerte, bei denen eine winzige Abweichung keine Rolle spielt (z. B. Sensordaten).

**NUMERIC(p,s) genau gelesen.** p ist die Gesamtzahl der Stellen (*precision*), s die Zahl der Nachkommastellen (*scale*). Laut Deklaration und SQL-Standard fasst `NUMERIC(6,2)` also höchstens 9999,99, und PostgreSQL weist größere Werte mit einem Überlauffehler ab.

> **Dialekt, prüfungsrelevant:** Firebird 3 erzwingt die Präzision **nicht**. Es speichert `NUMERIC`/`DECIMAL` intern als ganze Zahl (je nach p `SMALLINT`, `INTEGER` oder `BIGINT`) mit s gedachten Nachkommastellen. Fest ist nur die Zahl der Nachkommastellen. Eine Spalte `NUMERIC(6,2)` nimmt deshalb auch 99 999,99 an. Die Grenze ist der Bereich des internen Ganzzahltyps, nicht p. Wer eine fachliche Obergrenze braucht, sichert sie mit einem CHECK ab: `CHECK (betrag BETWEEN 0 AND 9999.99)`. Das wirkt in beiden Systemen gleich.

Die höchste erlaubte Präzision legt jeder Hersteller selbst fest. Firebird 3 erlaubt p ≤ 18, PostgreSQL bei deklarierter Präzision bis 1000, und andere Quellen nennen wieder andere Werte. Die Firebird-Doku unterscheidet `NUMERIC` (genau wie deklariert) und `DECIMAL` (mindestens wie deklariert). Im Verhalten sind beide aber fast gleich.

Beim Wählen helfen drei Regeln:

- **Geld** immer als `NUMERIC`, nie als Gleitkommazahl: `DOUBLE PRECISION` speichert viele Dezimalbrüche nur näherungsweise, Summen weichen dann ab.
- **Codes** wie Postleitzahl, Telefon- oder Artikelnummer sind Text: Mit ihnen wird nicht gerechnet, und führende Nullen müssen erhalten bleiben (`CHAR(5)` für die PLZ 01067).
- **Kleinster passender Typ:** Für Minuten einer Fahrstunde reicht `SMALLINT`; Ja/Nein-Angaben sind `BOOLEAN`.

**Länge bei Text.** Bei `CHAR(n)` und `VARCHAR(n)` zählt n **Zeichen**, nicht Bytes. Eine Spalte `VARCHAR(30)` fasst also 30 Zeichen, auch mit Umlauten in UTF8. Eine Byte-Grenze gibt es nur für das größte erlaubte n: Ein Wert darf höchstens 32 767 Bytes (`CHAR`) bzw. 32 765 Bytes (`VARCHAR`) belegen. Weil ein UTF8-Zeichen bis zu 4 Bytes braucht, lässt sich mit UTF8 höchstens n = 8 191 deklarieren.

## CREATE TABLE mit Constraints

Grundform (verkürzte Grammatik):

```
CREATE TABLE tabelle (
    spalte datentyp [DEFAULT wert] [spalten-constraint ...],
    ...
    [CONSTRAINT name] tabellen-constraint,
    ...
);
```

Laufendes Beispiel ist eine Fahrschule: Fahrlehrkräfte geben Fahrstunden, jede Fahrstunde gehört zu einem Fahrschüler.

```sql
CREATE TABLE fahrlehrer (
    fahrlehrer_id INTEGER GENERATED BY DEFAULT AS IDENTITY,
    vorname       VARCHAR(30) NOT NULL,
    nachname      VARCHAR(30) NOT NULL,
    lizenz_nr     VARCHAR(12) NOT NULL,
    CONSTRAINT pk_fahrlehrer PRIMARY KEY (fahrlehrer_id),
    CONSTRAINT uq_fahrlehrer_lizenz UNIQUE (lizenz_nr)
);

CREATE TABLE fahrschueler (
    schueler_id   INTEGER GENERATED BY DEFAULT AS IDENTITY,
    vorname       VARCHAR(30) NOT NULL,
    nachname      VARCHAR(30) NOT NULL,
    klasse        VARCHAR(3) DEFAULT 'B' NOT NULL,
    angemeldet_am DATE DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT pk_fahrschueler PRIMARY KEY (schueler_id),
    CONSTRAINT ck_fahrschueler_klasse CHECK (klasse IN ('A', 'A2', 'B', 'BE'))
);

CREATE TABLE fahrstunde (
    stunde_id     INTEGER GENERATED BY DEFAULT AS IDENTITY,
    schueler_id   INTEGER NOT NULL,
    fahrlehrer_id INTEGER,
    beginn        TIMESTAMP NOT NULL,
    dauer_min     SMALLINT DEFAULT 45 NOT NULL,
    CONSTRAINT pk_fahrstunde PRIMARY KEY (stunde_id),
    CONSTRAINT fk_fahrstunde_schueler FOREIGN KEY (schueler_id)
        REFERENCES fahrschueler (schueler_id) ON DELETE CASCADE,
    CONSTRAINT fk_fahrstunde_lehrer FOREIGN KEY (fahrlehrer_id)
        REFERENCES fahrlehrer (fahrlehrer_id) ON DELETE SET NULL,
    CONSTRAINT uq_fahrstunde_termin UNIQUE (schueler_id, beginn),
    CONSTRAINT ck_fahrstunde_dauer CHECK (dauer_min BETWEEN 45 AND 180)
);
```

Die Bausteine:

- **`NOT NULL`** – die Spalte braucht in jeder Zeile einen Wert. Nur als Spalten-Constraint.
- **`PRIMARY KEY`** (Primärschlüssel, *primary key*) – Werte eindeutig und nie NULL; höchstens einer je Tabelle. Das DBMS legt dafür automatisch einen Index an.
- **`UNIQUE`** – kein Wert bzw. keine Wertkombination doppelt; damit sichert man Alternativschlüssel wie `lizenz_nr`. `uq_fahrstunde_termin` verhindert, dass ein Schüler zwei Stunden mit demselben Beginn hat. Für NULL gilt:
  - **Einspaltiges UNIQUE:** NULL ist beliebig oft erlaubt, weil zwei NULL-Werte nicht als gleich gelten. Das gilt in Firebird 3 und PostgreSQL.
  - **Mehrspaltiges UNIQUE mit teilweise NULL: Dialektunterschied.** Firebird 3 wertet zwei Zeilen als Duplikat, wenn in beiden dieselben Schlüsselspalten NULL sind und alle übrigen Schlüsselspalten gleiche Werte haben. Mehrfach erlaubt sind nur vollständig leere Schlüssel (alle Spalten NULL). PostgreSQL erlaubt jede Kombination mit mindestens einer NULL beliebig oft. Ein `UNIQUE (fahrlehrer_id, beginn)` über die NULL-fähige Lehrkraft-Spalte würde also in Firebird zwei Stunden ohne Lehrkraft mit gleichem Beginn abweisen und in PostgreSQL annehmen. Das Beispiel legt den Constraint deshalb auf die Pflichtspalten `(schueler_id, beginn)`.
- **`CHECK (bedingung)`** – jede Zeile muss die Bedingung erfüllen. Abgewiesen wird nur bei FALSE; liefert die Bedingung wegen NULL den Wert UNKNOWN, ist die Zeile erlaubt. Wer NULL verbieten will, schreibt zusätzlich `NOT NULL`. Firebird 3 erlaubt in der Bedingung sogar Unterabfragen (`EXISTS (SELECT …)`), PostgreSQL nicht. Die SQL-Norm kennt außerdem freistehende Zusicherungen (`CREATE ASSERTION`) über mehrere Tabellen, die keins der beiden Systeme umsetzt.
- **`DEFAULT wert`** – wird eingesetzt, wenn ein INSERT die Spalte nicht nennt; ein ausdrücklich geschriebenes `NULL` überschreibt den Default. In Firebird steht `DEFAULT` **vor** `NOT NULL` und erlaubt nur ein Literal, `NULL` oder eine Kontextvariable wie `CURRENT_DATE`. PostgreSQL erlaubt beliebige Ausdrücke ohne Spaltenbezug und jede Reihenfolge.
- **`FOREIGN KEY (spalten) REFERENCES ziel (spalten)`** (Fremdschlüssel, *foreign key*) – jeder Wert ist NULL oder kommt im Ziel vor. Das Ziel muss PRIMARY KEY oder UNIQUE sein und bereits existieren. Ausnahme ist der Selbstbezug: Ein Fremdschlüssel auf die eigene Tabelle darf im selben `CREATE TABLE` stehen (z. B. `vorgesetzter_id` in einer Mitarbeitertabelle). Ohne Spaltenliste hinter dem Tabellennamen gilt der Primärschlüssel des Ziels.

> **Ist DEFAULT ein Constraint? Zwei Sichtweisen.** Die Dokus von Firebird und PostgreSQL führen DEFAULT getrennt von den Constraints, weil er nichts verbietet, sondern nur einen Ersatzwert liefert. Er kann deshalb nie verletzt werden. Andere Darstellungen zählen DEFAULT als Spaltenbedingung zu den deklarativen Integritätsregeln, weil er im Schema festlegt, welche Werte eine Spalte bekommt. Beide Einordnungen sind vertretbar. In der Klausur nennst du die Einordnung und den Unterschied.

**Spalten- oder Tabellen-Constraint.** Ein Spalten-Constraint (auch *Spaltenbedingung*) steht in der Spaltendefinition (`lizenz_nr VARCHAR(12) NOT NULL UNIQUE`). Ein Tabellen-Constraint (auch *Tabellenbedingung*) steht als eigener Eintrag und darf mehrere Spalten nennen. Zusammengesetzte Schlüssel, zusammengesetzte Fremdschlüssel und CHECKs über mehrere Spalten gehen **nur** als Tabellen-Constraint.

**Begriffe.** Die Tabelle, auf die ein Fremdschlüssel zeigt, heißt *Eltern-*, *Vater-* oder *Mastertabelle*. Die Tabelle mit dem Fremdschlüssel heißt *Kind-* oder *Detailtabelle*. Für Primär- und Fremdschlüssel sind die Kürzel PK und FK üblich.

**Benennen.** Mit `CONSTRAINT name` bekommt jeder Constraint einen sprechenden Namen. Dann werden Fehlermeldungen verständlich, und man kann den Constraint später gezielt löschen. Das geht auch direkt in der Spaltendefinition: `lizenz_nr VARCHAR(12) NOT NULL CONSTRAINT uq_fahrlehrer_lizenz UNIQUE`. Ohne Namen vergibt Firebird Systemnamen wie `INTEG_27`. In diesem Kurs gelten die Präfixe `pk_`, `fk_`, `uq_` und `ck_` mit dem Tabellennamen dahinter. Andere Schemata sind gleichwertig, zum Beispiel Großbuchstaben (`PK_FAHRSTUNDE`) oder der Tabellenname vorn. Wichtig ist nur, dass das Schema einheitlich bleibt. In Firebird müssen Constraint-Namen in der **ganzen Datenbank** eindeutig sein, deshalb gehört die Tabelle in den Namen. PostgreSQL verlangt nur Eindeutigkeit je Tabelle. PRIMARY KEY- und UNIQUE-Constraints legen dort aber einen gleichnamigen Index an, und dessen Name muss im ganzen Schema eindeutig sein. Bezeichner dürfen in Firebird 3 höchstens 31 Bytes lang sein.

**Reihenfolge.** Eine Tabelle mit Fremdschlüssel kann erst angelegt werden, wenn die referenzierte Tabelle existiert – im Beispiel also erst `fahrlehrer` und `fahrschueler`, dann `fahrstunde`. Verweisen zwei Tabellen gegenseitig aufeinander, legt man eine zunächst ohne den Fremdschlüssel an und ergänzt ihn danach mit `ALTER TABLE … ADD CONSTRAINT`.

## Referenzielle Aktionen ON DELETE / ON UPDATE

Eine referenzielle Aktion legt fest, was mit den **Kindzeilen** passiert, wenn die referenzierte Elternzeile gelöscht wird (`ON DELETE`) oder ihr Schlüssel sich ändert (`ON UPDATE`).

| Aktion | Wirkung auf die Kindzeilen | Voraussetzung, sonst Fehler |
| --- | --- | --- |
| `NO ACTION` (Standard) | keine – die Anweisung wird abgewiesen, solange Kindzeilen existieren | – |
| `CASCADE` | DELETE: werden mitgelöscht. UPDATE: übernehmen den neuen Schlüssel | – |
| `SET NULL` | DELETE und UPDATE: FK-Spalte wird NULL | Spalte NULL-fähig |
| `SET DEFAULT` | DELETE und UPDATE: FK-Spalte wird auf ihren Default gesetzt | Default verweist auf eine vorhandene Elternzeile |
| `RESTRICT` | wie NO ACTION, aber sofort geprüft | **nicht in Firebird 3** |

Beispiel mit den Tabellen oben (Lehrkraft 1 hat die Stunden 31 und 33, Schüler 7 die Stunden 31 und 32):

- `DELETE FROM fahrlehrer WHERE fahrlehrer_id = 1` – die Lehrkraft verschwindet, die Stunden 31 und 33 bleiben mit `fahrlehrer_id = NULL` erhalten (SET NULL).
- `DELETE FROM fahrschueler WHERE schueler_id = 7` – die Stunden 31 und 32 werden mitgelöscht (CASCADE).
- Hätte `fk_fahrstunde_schueler` keine Aktion, würde das zweite DELETE abgewiesen und **nichts** geändert.

Aktionen wirken auch über mehrere Ebenen. Scheitert irgendwo in der Kette ein Schritt (z. B. ein `NO ACTION` weiter unten oder eine `NOT NULL`-Spalte bei SET NULL), wird die **ganze** Anweisung zurückgenommen. `ON DELETE` und `ON UPDATE` gelten getrennt: Wer nur `ON DELETE CASCADE` schreibt, hat für Schlüsseländerungen weiterhin `NO ACTION`.

**SET DEFAULT mit Platzhalter-Elternzeile.** SET DEFAULT setzt die FK-Spalte auf ihren Default. Damit dieser Wert den Fremdschlüssel nicht selbst verletzt, braucht die Elterntabelle eine Zeile mit genau diesem Schlüssel, also einen Platzhalter wie „kein Fahrzeug“:

```sql
CREATE TABLE fahrzeug (
    fahrzeug_id INTEGER NOT NULL,
    kennzeichen VARCHAR(12) NOT NULL,
    CONSTRAINT pk_fahrzeug PRIMARY KEY (fahrzeug_id)
);
INSERT INTO fahrzeug (fahrzeug_id, kennzeichen) VALUES (0, '(keins)');

-- zusätzlich in fahrstunde:
--   fahrzeug_id INTEGER DEFAULT 0 NOT NULL,
--   CONSTRAINT fk_fahrstunde_fahrzeug FOREIGN KEY (fahrzeug_id)
--       REFERENCES fahrzeug (fahrzeug_id) ON DELETE SET DEFAULT ON UPDATE SET DEFAULT
```

Wird ein Fahrzeug verkauft und gelöscht, bleiben seine Fahrstunden erhalten und zeigen auf den Platzhalter 0. Dasselbe passiert, wenn sich die Nummer eines Fahrzeugs ändert (`ON UPDATE SET DEFAULT`). Gegenüber SET NULL hat das einen Vorteil: Die FK-Spalte darf `NOT NULL` bleiben, und Abfragen müssen keinen NULL-Fall behandeln. Fehlt die Platzhalter-Zeile, scheitert das DELETE. Laut Firebird-3-Referenz nimmt Firebird dabei den Default, der beim **Anlegen des Fremdschlüssels** galt, nicht einen später mit `ALTER COLUMN … SET DEFAULT` geänderten. Den Default einer solchen Spalte änderst du deshalb besser nicht nachträglich.

Faustregeln: `CASCADE` für abhängige Teile (Positionen einer Bestellung), `SET NULL` für optionale Zuordnungen, `SET DEFAULT` für Pflichtzuordnungen mit Auffangwert, `NO ACTION` für eigenständige Geschäftsdaten, die nie still verschwinden dürfen.

> **Quellenvarianten:** PostgreSQL und SQLite unterscheiden `NO ACTION` und `RESTRICT` nur beim Zeitpunkt der Prüfung (`NO ACTION` darf bei aufgeschobenen Constraints bis zum Ende der Transaktion warten, `RESTRICT` prüft sofort). Firebird 3 kennt nur die vier Aktionen ohne RESTRICT – statt `ON DELETE RESTRICT` schreibt man dort `NO ACTION` oder nichts. `ON UPDATE CASCADE` bieten Firebird 3 und PostgreSQL beide an.

## Automatische Schlüsselwerte

**Identity-Spalten.** Firebird 3 folgt dem SQL-Standard:

```sql
stunde_id INTEGER GENERATED BY DEFAULT AS IDENTITY [(START WITH n)]
```

- Lässt ein INSERT die Spalte weg, vergibt das DBMS den nächsten Wert. Eine Identity-Spalte ist automatisch NOT NULL; für Eindeutigkeit braucht sie zusätzlich PRIMARY KEY oder UNIQUE.
- `BY DEFAULT` erlaubt auch eigene Werte – diese schieben den internen Zähler aber nicht weiter, und später kollidiert ein automatisch vergebener Wert mit dem Primärschlüssel. Deshalb IDs nie selbst einfügen.
- Firebird 3 kennt nur `BY DEFAULT`; PostgreSQL bietet zusätzlich `GENERATED ALWAYS`, das eigene Werte ablehnt.
- **Achtung, Dialekt:** In Firebird 3 ist `START WITH n` der Wert **vor** der ersten Nummer – die erste ID ist n + 1. In PostgreSQL ist die erste ID n.
- Firebird 3 kann eine Identity-Spalte nicht zu einer Tabelle hinzufügen, die schon Zeilen hat.
- Eine Identity-Spalte hat keinen zusätzlichen `DEFAULT` (beide Systeme lehnen das ab) und in Firebird auch kein `COMPUTED BY`. Firebird 3 kann eine vorhandene Spalte nicht in eine Identity-Spalte umwandeln und auch nicht umgekehrt. PostgreSQL kann das mit `ALTER COLUMN … ADD/DROP IDENTITY`.
- **Zähler zurücksetzen:** `ALTER TABLE fahrstunde ALTER COLUMN stunde_id RESTART WITH 500`. PostgreSQL vergibt danach 500. Firebird 3 vergibt 501, wegen desselben dokumentierten Fehlers wie bei `START WITH`. Ohne `WITH n` springt der Zähler auf den Startwert aus dem `CREATE TABLE` zurück.

**Sequenzen (Generatoren).** Eine Sequenz ist ein eigenes Schemaobjekt, das fortlaufende Zahlen liefert:

```sql
CREATE SEQUENCE seq_beleg;                  -- Firebird und PostgreSQL
CREATE GENERATOR seq_beleg;                 -- Firebird, älteres Synonym
SELECT NEXT VALUE FOR seq_beleg FROM RDB$DATABASE;   -- Firebird: nächster Wert
SELECT GEN_ID(seq_beleg, 1) FROM RDB$DATABASE;       -- Firebird: dasselbe
SELECT GEN_ID(seq_beleg, 0) FROM RDB$DATABASE;       -- Firebird: aktueller Wert
SELECT nextval('seq_beleg');                         -- PostgreSQL
```

In Firebird steht eine neue Sequenz ohne `START WITH` auf 0, der erste Wert ist also 1. Mit `START WITH n` liefert Firebird 3 als ersten Wert n + Schrittweite (die Doku führt das als Fehler). In PostgreSQL kann eine Sequenz Default einer Spalte sein (`DEFAULT nextval('seq_beleg')`); in Firebird nicht – dort holt man den Wert im INSERT (`VALUES (NEXT VALUE FOR seq_beleg, …)`) oder per Trigger (siehe Thema t12).

**Identity oder Sequenz?** Identity ist die einfache Wahl für den Schlüssel *einer* Tabelle. Eine Sequenz lohnt sich, wenn mehrere Tabellen einen gemeinsamen Nummernkreis brauchen (Rechnungen und Gutschriften) oder die Nummer vor dem INSERT bekannt sein muss.

**Lücken sind normal.** Ein vergebener Wert wird nie zurückgegeben – auch nicht bei `ROLLBACK` oder einem gescheiterten INSERT. Sequenzen stehen außerhalb der Transaktionskontrolle, damit parallele Transaktionen nicht aufeinander warten.

> **Andere DBMS (nur zur Einordnung):** MySQL/MariaDB `AUTO_INCREMENT`, SQL Server `IDENTITY(1,1)`, SQLite `INTEGER PRIMARY KEY` (optional `AUTOINCREMENT`), PostgreSQL älter `SERIAL`.

## ALTER TABLE und DROP

`ALTER TABLE` ändert eine bestehende Tabelle. Mehrere Teilbefehle lassen sich in **einer** Anweisung mit Komma verbinden:

```sql
ALTER TABLE fahrstunde
    ADD km SMALLINT,
    ALTER COLUMN dauer_min SET DEFAULT 90,
    DROP CONSTRAINT ck_fahrstunde_dauer;
```

Die Spaltendefinition hinter `ADD` steht **ohne Klammern**, anders als in `CREATE TABLE`. `ADD (km SMALLINT)` ist in Firebird ein Syntaxfehler.

| Zweck | Firebird 3 | PostgreSQL |
| --- | --- | --- |
| Spalte hinzufügen | `ADD spalte typ …` (ohne `COLUMN`) | auch `ADD COLUMN` |
| Spalte löschen | `DROP spalte` | auch `DROP COLUMN` |
| Constraint hinzufügen | `ADD CONSTRAINT name …` | gleich |
| Constraint löschen | `DROP CONSTRAINT name` | gleich |
| Constraint ändern | gibt es nicht: `DROP CONSTRAINT`, dann `ADD CONSTRAINT` | `ALTER CONSTRAINT` nur für Eigenschaften eines FK (z. B. aufschiebbar); einen CHECK legt man auch hier neu an |
| Typ ändern | `ALTER COLUMN spalte TYPE typ` | gleich |
| Spalte umbenennen | `ALTER COLUMN alt TO neu` | `RENAME COLUMN alt TO neu` |
| Spaltenposition | `ALTER COLUMN spalte POSITION n` | gibt es nicht |
| Tabelle umbenennen | gibt es nicht (neu anlegen und umkopieren) | `RENAME TO neu` |
| Default | `ALTER COLUMN spalte SET DEFAULT wert` / `DROP DEFAULT` | gleich |
| Pflichtangabe | `ALTER COLUMN spalte SET NOT NULL` / `DROP NOT NULL` | gleich |
| Identity-Zähler | `ALTER COLUMN id RESTART [WITH n]` | gleich, anderer Folgewert (s. o.) |

Fallstricke:

- **Neue NOT-NULL-Spalte in gefüllter Tabelle:** `ALTER TABLE fahrstunde ADD km SMALLINT NOT NULL` scheitert in Firebird 3, weil die alten Zeilen keinen Wert hätten. Mit Default geht es in einem Schritt: `ADD km SMALLINT DEFAULT 0 NOT NULL`. Dann bekommen in Firebird 3 und PostgreSQL alle vorhandenen Zeilen den Wert 0. Brauchen die alten Zeilen verschiedene Werte, legst du die Spalte NULL-fähig an, füllst sie per `UPDATE` und setzt danach `SET NOT NULL`.
- **Typänderung:** Firebird lehnt Änderungen ab, bei denen Daten verloren gehen könnten (z. B. `VARCHAR(40)` → `VARCHAR(20)`), und ändert keine Spalten, die in PRIMARY KEY-, UNIQUE- oder FOREIGN KEY-Constraints stecken. Dann Constraint vorher löschen und danach neu anlegen.
- **Umbenennen:** Firebird 3 benennt keine Spalte um, die in einem Constraint vorkommt (PRIMARY KEY, UNIQUE, FOREIGN KEY, CHECK) oder in einem Trigger, einer Prozedur oder einer Sicht verwendet wird. Die Reihenfolge ist dann: Constraint löschen, Spalte umbenennen, Constraint mit dem neuen Spaltennamen neu anlegen. PostgreSQL passt Constraints beim Umbenennen selbst an.
- **Constraint ändern:** Eine Bedingung lässt sich nicht „umschreiben“. Um `ck_fahrstunde_dauer` auf höchstens 135 Minuten zu verschärfen, löschst du sie und legst sie neu an:
  ```sql
  ALTER TABLE fahrstunde DROP CONSTRAINT ck_fahrstunde_dauer;
  ALTER TABLE fahrstunde ADD CONSTRAINT ck_fahrstunde_dauer
      CHECK (dauer_min BETWEEN 45 AND 135);
  ```
- **Nachträglicher Primärschlüssel:** Firebird 3 legt einen PRIMARY KEY nur auf Spalten an, die schon `NOT NULL` sind, sonst meldet es einen eigenen Fehler. Vorher also `ALTER COLUMN … SET NOT NULL`. PostgreSQL setzt NOT NULL beim `ADD PRIMARY KEY` selbst, sofern keine NULL-Werte vorhanden sind. Doppelte Werte lassen den PK in beiden Systemen scheitern.
- **Nachträglicher CHECK:** Firebird prüft die vorhandenen Zeilen **nicht**; PostgreSQL prüft sie und bricht bei Verstößen ab (außer mit `NOT VALID`). Vorher per `SELECT` nach Verstößen suchen.

> **Quellenvariante: NOT NULL und UNIQUE nachträglich.** Manche Darstellungen sagen, NOT NULL und UNIQUE ließen sich einer bestehenden Spalte nicht nachträglich hinzufügen. Für die Begründung gibt es zwei Gesichtspunkte:
>
> - Die vorhandenen Daten können die neue Regel verletzen (NULL-Werte bzw. Duplikate). Dann scheitert der Befehl, und man muss die Daten vorher bereinigen.
> - `SET NOT NULL` gibt es in Firebird erst seit Version 3.0.
>
> In Firebird 3 und PostgreSQL gehen `ALTER COLUMN … SET NOT NULL` und `ADD CONSTRAINT … UNIQUE (…)`, solange die Daten passen. Firebird prüft bei `SET NOT NULL` alle vorhandenen Zeilen. In der Klausur schreibst du dazu, für welches System dein Befehl gilt.

**DROP.** `DROP TABLE t` entfernt die Tabelle samt Daten, Indexen und Triggern – anders als `DELETE FROM t`, das nur die Zeilen leert (DML). Firebird lehnt `DROP TABLE` ab, solange etwas von der Tabelle abhängt, etwa ein Fremdschlüssel einer anderen Tabelle. Gelöscht wird deshalb **umgekehrt zur Anlage-Reihenfolge**: Kinder vor Eltern; bei einem Zyklus vorher mit `DROP CONSTRAINT` öffnen. Analog gibt es `DROP DOMAIN` und `DROP SEQUENCE`.

Die Norm sieht zwei Zusätze vor: `DROP TABLE t RESTRICT` (Abbruch bei Abhängigkeiten) und `DROP TABLE t CASCADE`. PostgreSQL kennt beide, ohne Angabe gilt `RESTRICT`. Firebird 3 kennt keinen der beiden Zusätze und verhält sich immer wie `RESTRICT`. `CASCADE` entfernt in PostgreSQL die abhängigen **Objekte** (FK-Constraints anderer Tabellen, Sichten), nicht deren Zeilen. Manche Darstellungen beschreiben es als Löschen der verweisenden Zeilen. Das verwechselt es mit `ON DELETE CASCADE`.

## Domänen (CREATE DOMAIN)

Eine Domäne ist ein benannter, selbst definierter Datentyp: Basistyp plus optional Default, `NOT NULL` und CHECK. Sie setzt die Domänenintegrität aus dem relationalen Modell (Thema t05) direkt im Schema um.

```sql
CREATE DOMAIN d_minuten AS SMALLINT CHECK (VALUE > 0);

CREATE TABLE theoriestunde (
    theorie_id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    thema      VARCHAR(60) NOT NULL,
    dauer_min  d_minuten DEFAULT 90 NOT NULL
);
```

- Im CHECK steht `VALUE` für den gerade geprüften Wert – die Domäne kennt den Spaltennamen nicht.
- Eine Spalte nutzt die Domäne wie einen eingebauten Typ und darf eigene Constraints und einen eigenen Default ergänzen; der Spalten-Default überschreibt den der Domäne.
- **Lockern geht nicht:** Ist die Domäne `NOT NULL`, ist es jede Spalte dieses Typs auch, und Firebird 3 kann eine solche Spalte nicht NULL-fähig machen. Beide Dokus empfehlen deshalb, die Domäne NULL-fähig zu lassen und `NOT NULL` an der Spalte anzugeben (wie oben bei `dauer_min`).
- Vorteil: Regel und Typ stehen an **einer** Stelle, alle Spalten verhalten sich gleich, und `ALTER DOMAIN` wirkt überall. Die Beispieldatenbanken nutzen so `d_betrag` (`NUMERIC(8,2)`, `VALUE >= 0`) und `d_gehalt`.
- Eine Domäne muss vor der ersten Tabelle angelegt werden, die sie nutzt, und lässt sich erst löschen, wenn keine Spalte sie mehr verwendet.
- **Dialekt:** Die Grundform `CREATE DOMAIN name AS typ [DEFAULT …] [NOT NULL] [CHECK (…)]` ist in beiden Systemen gleich. Firebird 3 erlaubt aber nur **eine** CHECK-Bedingung je Domäne, und die bekommt keinen Namen. Mehrere Regeln verknüpfst du dort mit `AND`. PostgreSQL erlaubt mehrere und benannte Domänen-Constraints, z. B. `CREATE DOMAIN d_minuten AS SMALLINT CONSTRAINT ck_minuten_positiv CHECK (VALUE > 0)`. In Firebird ist diese Form ein Syntaxfehler.

## Spickzettel: Syntaxschablonen

**Lesart der Schablonen:** `[ … ]` ist optional, `{ a | b }` heißt „genau eine der Alternativen“, `…` heißt „weitere wie davor“. So schreiben es auch die Dokus von Firebird und PostgreSQL. **Achtung, Notationsvariante:** In EBNF-artigen Grammatiken bedeuten geschweifte Klammern `{ … }` dagegen „beliebig oft wiederholen (auch keinmal)“, und die Auswahl steht dort ohne Klammern mit `|` oder in runden Klammern. Prüfe bei jeder Vorlage, welche Konvention gilt. Syntaxdiagramme zeigen dieselbe Grammatik grafisch: Du folgst den Pfeilen von links nach rechts, eine Verzweigung ist eine Alternative, ein Bogen zurück eine Wiederholung und ein Bogen um ein Element herum macht es optional.

```
CREATE DOMAIN d_name AS typ [DEFAULT wert] [NOT NULL] [CHECK (… VALUE …)];
                               -- FB: ein CHECK ohne Namen; PG: auch CONSTRAINT name CHECK …

CREATE TABLE t (
  id   INTEGER GENERATED BY DEFAULT AS IDENTITY [(START WITH n)],   -- FB: erste ID n+1
  sp   typ [DEFAULT wert] [NOT NULL] [[CONSTRAINT name] UNIQUE] [[CONSTRAINT name] CHECK (…)],
  CONSTRAINT pk_t PRIMARY KEY (id),
  CONSTRAINT uq_t_x UNIQUE (sp1, sp2),           -- FB: (1, NULL) nur einmal
  CONSTRAINT fk_t_z FOREIGN KEY (z_id) REFERENCES z (z_id)
      [ON DELETE {NO ACTION | CASCADE | SET NULL | SET DEFAULT}]
      [ON UPDATE {NO ACTION | CASCADE | SET NULL | SET DEFAULT}],
  CONSTRAINT ck_t_y CHECK (bedingung)            -- Obergrenzen hier, nicht über NUMERIC(p,s)
);

ALTER TABLE t teilbefehl [, teilbefehl …];
ALTER TABLE t ADD sp typ [DEFAULT wert] [NOT NULL];  -- ohne COLUMN, ohne Klammern
ALTER TABLE t DROP sp;
ALTER TABLE t ADD CONSTRAINT name …;                 -- PK: Spalten vorher NOT NULL (FB)
ALTER TABLE t DROP CONSTRAINT name;                  -- ändern = DROP + ADD
ALTER TABLE t ALTER COLUMN sp TYPE typ;              -- nicht bei PK/UNIQUE/FK-Spalten (FB)
ALTER TABLE t ALTER COLUMN sp TO neu;                -- PG: RENAME COLUMN sp TO neu
                                                     -- FB: nicht bei Spalten in Constraints,
                                                     --     Triggern, Prozeduren, Sichten
ALTER TABLE t ALTER COLUMN sp POSITION n;            -- nur FB
ALTER TABLE t ALTER COLUMN sp {SET DEFAULT wert | DROP DEFAULT};
ALTER TABLE t ALTER COLUMN sp {SET NOT NULL | DROP NOT NULL};
ALTER TABLE t ALTER COLUMN id RESTART [WITH n];      -- FB: nächster Wert n+1, PG: n

CREATE SEQUENCE s;    NEXT VALUE FOR s    GEN_ID(s, k)    -- PG: nextval('s')
DROP TABLE t;    DROP DOMAIN d_name;    DROP SEQUENCE s;  -- PG zusätzlich [RESTRICT | CASCADE]
```

## Auf einen Blick

- SQL ist deklarativ und mengenorientiert. Schlüsselwörter und Bezeichner ohne Anführungszeichen sind unabhängig von Groß- und Kleinschreibung, Textliterale nicht.
- DDL ändert das Schema, DML die Zeilen, DQL liest, DCL vergibt Rechte, TCL steuert Transaktionen – `SELECT` wird je nach Quelle zur DML oder zur DQL gezählt, und manche Lehrbücher fassen DCL weiter.
- Exakte Typen (Ganzzahl, `NUMERIC`) gegen ungefähre (`FLOAT`, `DOUBLE PRECISION`): Genauigkeit gegen Geschwindigkeit. Geld als `NUMERIC(p,s)`, Codes als `CHAR`/`VARCHAR`, langer Text in Firebird als `BLOB SUB_TYPE TEXT` (PostgreSQL `TEXT`), `BOOLEAN` seit Firebird 3.
- Firebird 3 erzwingt die Präzision von `NUMERIC(p,s)` nicht: Obergrenzen per CHECK absichern.
- Firebird: `DEFAULT` vor `NOT NULL`, Default nur Literal, NULL oder Kontextvariable, `VARCHAR` immer mit Länge.
- Zusammengesetzte Schlüssel und CHECKs über mehrere Spalten nur als Tabellen-Constraint; Constraints mit `pk_`/`fk_`/`uq_`/`ck_` benennen.
- Einspaltiges UNIQUE erlaubt mehrere NULL, CHECK lässt NULL durch; NULL verbieten kann nur `NOT NULL`. Bei mehrspaltigem UNIQUE mit teilweise NULL weicht Firebird 3 ab: `(1, NULL)` darf dort nur einmal vorkommen, in PostgreSQL beliebig oft.
- Referenzielle Aktionen in Firebird 3: NO ACTION (Standard), CASCADE, SET NULL, SET DEFAULT – kein RESTRICT. Scheitert ein Schritt, wird die ganze Anweisung zurückgenommen.
- Identity: `GENERATED BY DEFAULT AS IDENTITY`; in Firebird 3 liefert `START WITH n` als erste ID n + 1. Sequenz: `CREATE SEQUENCE`, `NEXT VALUE FOR`, `GEN_ID`. Lücken sind normal.
- `ALTER TABLE`: in Firebird `ADD`/`DROP` ohne `COLUMN` und ohne Klammern, mehrere Teilbefehle mit Komma; Umbenennen mit `ALTER COLUMN … TO …`, aber nicht für Spalten in Constraints; Constraints ändern = löschen und neu anlegen; nachträglicher PK nur auf NOT-NULL-Spalten. NOT-NULL-Spalten in gefüllten Tabellen mit DEFAULT anlegen oder über NULL-fähig → UPDATE → SET NOT NULL.
- SET DEFAULT braucht eine Platzhalter-Elternzeile mit dem Default-Schlüssel.
- Anlegen von den Eltern zu den Kindern, löschen umgekehrt; Zyklen per `ALTER TABLE … ADD/DROP CONSTRAINT` auflösen.
- `CREATE DOMAIN` bündelt Typ, Default und Regel (`VALUE`) zentral für alle Spalten, die sie nutzen.
