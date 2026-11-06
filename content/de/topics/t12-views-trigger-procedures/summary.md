---
id: t12
lang: de
title: Views, Trigger, Stored Procedures, Index
order: 12
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: firebird-30-language-reference
    ref: "Kap. 5.5 INDEX (CREATE [UNIQUE] [ASC|DESC] INDEX, COMPUTED BY, automatischer Index zu PRIMARY KEY, UNIQUE und FOREIGN KEY, UNIQUE erlaubt mehrere NULL, bis 16 Spalten); Kap. 5.6 VIEW (CREATE VIEW mit Spaltenliste, Bedingungen für automatisch änderbare Sichten, nur lesbare Sichten per Trigger änderbar, WITH CHECK OPTION mit NULL-Weitergabe statt Defaults); Kap. 5.7 TRIGGER (Legacy- und SQL:2003-Form, ACTIVE/INACTIVE, BEFORE/AFTER, Ereignisse mit OR, POSITION, INSERTING/UPDATING/DELETING); Kap. 5.8 PROCEDURE; Kap. 5.9 FUNCTION; Kap. 7.6 Trigger (7.6.2 OLD und NEW: Verfügbarkeit je Ereignis, NEW nur in BEFORE schreibbar); Kap. 6.7 EXECUTE PROCEDURE (bei selektierbarer Prozedur nur erste Zeile); Kap. 7.1 PSQL-Elemente (Doppelpunkt vor Variablen in DML, SET TERM in isql); Kap. 7.2 Stored Procedures (Vorteile, ausführbar vs. selektierbar, SUSPEND)"
  - id: postgresql-17-docs-sql
    ref: "Kap. 11 Indexes (11.1 Nutzen, Pflegeaufwand, Planer entscheidet, ANALYZE; 11.2 B-Tree als Standard, LIKE mit festem Präfix; 11.3 mehrspaltige Indexe, führende Spalten); 5.5 Constraints (PRIMARY KEY und UNIQUE erzeugen B-Tree-Index, FOREIGN KEY nicht); Kap. 37.1 Overview of Trigger Behavior (BEFORE/AFTER/INSTEAD OF, Zeilen- und Anweisungstrigger, NEW/OLD, Rückgabewert von BEFORE-Triggern)"
  - id: postgresql-17-docs-sql-commands
    ref: "CREATE VIEW (nicht materialisiert, Updatable Views, WITH LOCAL/CASCADED CHECK OPTION mit CASCADED als Standard, INSTEAD-OF-Trigger); CREATE TRIGGER (Synopsis mit REFERENCING, FOR EACH ROW/STATEMENT mit STATEMENT als Standard, WHEN; Abschnitt Compatibility: Norm mit REFERENCING OLD ROW/NEW ROW, mehrere Ereignisse per OR als Erweiterung); CREATE PROCEDURE (CALL); CREATE INDEX; Kap. 11.2 Index Types (Hash); Kap. 11.8 Partial Indexes (partieller UNIQUE-Index)"
  - id: sqlite-documentation
    ref: "CREATE VIEW (Sichten nur lesbar, INSTEAD OF als Ausweg): https://www.sqlite.org/lang_createview.html ; CREATE TRIGGER (nur FOR EACH ROW, NEW/OLD je Ereignis): https://www.sqlite.org/lang_createtrigger.html ; CREATE INDEX (UNIQUE, mehrspaltig, NULL in UNIQUE-Indexen, partieller Index mit WHERE): https://www.sqlite.org/lang_createindex.html"
  - id: wp-sicht-datenbank
    ref: "Abschnitte Funktion (Vereinfachung, Zugriffsschutz), Arten (Selektions-, Projektions-, Verbund-, Aggregationssicht), Updates (Probleme je Sichttyp, WITH CHECK OPTION, Updates per Trigger), Materialized View"
  - id: wp-datenbanktrigger
    ref: "Abschnitt Eigenschaften (Auslösung bei INSERT/UPDATE/DELETE, vor oder nach der Änderung, INSTEAD OF, Zeilen- vs. Anweisungstrigger, Integritätsprüfung, Kettenreaktionen, prozedurale Sprachen)"
  - id: wp-gespeicherte-prozedur
    ref: "Definition, Implementierung (Vorteile: weniger Netzlast, Leistung, Clients ohne direkte Schreibrechte), herstellerspezifische Sprachen (PL/SQL, PL/pgSQL, Transact-SQL)"
  - id: wp-datenbankindex
    ref: "Definition, logarithmische Suche im B+-Baum statt sequenzieller Suche, automatischer Index auf Primärschlüssel, zusammengesetzte Indexe, CREATE INDEX nicht im SQL-Standard"
  - id: wp-datenunabhaengigkeit
    ref: "logische und physische Datenunabhängigkeit; Schemaänderung per Sichtdefinition vor dem Anwendungsprogramm verbergen"
  - id: wp-ansi-sparc-architektur
    ref: "Drei-Ebenen-Architektur (externe, konzeptionelle, interne Ebene), Datenunabhängigkeit"
---

# Views, Trigger, Stored Procedures, Index

## Lernziele

Nach diesem Thema kannst du …

- eine Sicht mit `CREATE VIEW` von Hand schreiben, ihre Zwecke an einem eigenen Beispiel erklären und begründen, ob sie änderbar ist,
- die Wirkung von `WITH CHECK OPTION` an konkreten Anweisungen vorhersagen,
- Sichten der externen Ebene und Indexe der internen Ebene zuordnen und daran logische und physische Datenunabhängigkeit erklären,
- einen BEFORE- oder AFTER-Trigger in Standardform oder in Firebird PSQL schreiben und `NEW` und `OLD` richtig einsetzen,
- erklären, wann eine Regel prozedural (per Trigger) statt deklarativ (per Constraint) gesichert werden muss, auch für Übergangsregeln zwischen altem und neuem Zustand,
- ausführbare und selektierbare Stored Procedures in Firebird unterscheiden und aufrufen,
- begründen, wann ein Index sinnvoll ist, was er kostet und in welcher Spaltenreihenfolge ein zusammengesetzter Index angelegt wird.

## Laufendes Beispiel

Ein kleiner Online-Teeladen speichert in Firebird 3:

- `kunde (kunde_id, vorname, nachname, email, geburtsdatum, ort, newsletter)`
- `tee (tee_id, name, sorte, preis_100g, bestand_g)`
- `bestellung (bestellung_id, kunde_id, bestellt_am, status)`
- `bestellposten (bestellung_id, tee_id, menge_g, preis_100g)`

In `bestellposten` steht der Preis zum Zeitpunkt der Bestellung, damit spätere Preisänderungen alte Bestellungen nicht verfälschen.

**Einordnung.** Die vier Werkzeuge dieses Themas gehören zu verschiedenen Ebenen der ANSI-SPARC-Architektur (Drei-Ebenen-Architektur, Thema t02) und zu verschiedenen Entwurfsphasen (Thema t03):

| Werkzeug | Ebene | Phase |
| --- | --- | --- |
| Sicht | externe Ebene (eine Sicht ist ein Baustein eines externen Schemas) | Datendefinition |
| Trigger, Stored Procedure | konzeptionelle Ebene (Regeln und Abläufe zu den Tabellen) | Datendefinition |
| Index | interne Ebene (Zugriffsweg, Speicherorganisation) | physischer Entwurf |

Die Zuordnung von Triggern und Prozeduren ist eine Entscheidung dieses Kurses: Sie werden hier zum konzeptionellen Schema gezählt, weil sie Regeln und Operationen auf den Tabellen festlegen und keine Benutzersicht bilden. Prozeduren, die reine Anwendungslogik enthalten, ordnen manche Darstellungen eher der Anwendung zu.

`CREATE INDEX` ist zwar DDL-Syntax, inhaltlich aber eine Entscheidung des physischen Entwurfs, genauso wie Speicherorganisation und Tuning.

## Sichten (Views) und ihre Änderbarkeit

Eine **Sicht** (*view*) ist eine virtuelle Tabelle. Sie wird durch eine gespeicherte Abfrage definiert. Das DBMS speichert nur diese Definition, keine Zeilen. Bei jedem Zugriff wertet es die Abfrage auf den aktuellen Daten der **Basistabellen** aus. Eine Sicht ist deshalb nie veraltet und kann überall dort im `FROM` stehen, wo eine Tabelle stehen darf.

Grammatik in Firebird 3 (verkürzt):

```
CREATE VIEW name [(spalte, ...)] AS select-anweisung [WITH CHECK OPTION];
```

Zwei Sichten für den Teeladen:

```sql
CREATE VIEW v_newsletter AS
SELECT kunde_id, vorname, nachname, email
FROM kunde
WHERE newsletter = TRUE;

CREATE VIEW v_kundenumsatz (kunde_id, nachname, bestellungen, umsatz) AS
SELECT k.kunde_id, k.nachname,
       COUNT(DISTINCT b.bestellung_id),
       SUM(p.menge_g * p.preis_100g / 100)
FROM kunde k
JOIN bestellung b    ON b.kunde_id = k.kunde_id
JOIN bestellposten p ON p.bestellung_id = b.bestellung_id
GROUP BY k.kunde_id, k.nachname;
```

`v_newsletter` ist eine Selektions- und Projektionssicht: Sie wählt Zeilen aus und blendet Spalten aus. `v_kundenumsatz` ist eine Verbund- und Aggregationssicht. Danach genügt `SELECT * FROM v_kundenumsatz WHERE umsatz > 100`.

Berechnete Spalten brauchen einen Namen. Den gibt entweder die Spaltenliste hinter dem Sichtnamen oder ein Alias im SELECT. Geändert wird eine Sicht in Firebird mit `CREATE OR ALTER VIEW` (PostgreSQL: `CREATE OR REPLACE VIEW`), gelöscht mit `DROP VIEW`.

### Wozu Sichten?

| Zweck | Beispiel im Teeladen |
| --- | --- |
| **Vereinfachung** | Der Umsatz-Join mit Gruppierung steht einmal in `v_kundenumsatz`, niemand muss ihn neu schreiben. |
| **Datenschutz** | Das Marketing bekommt Leserechte nur auf `v_newsletter` (Rechtevergabe in Thema t13). Geburtsdatum und Wohnort sieht es nicht. |
| **Logische Datenunabhängigkeit** | Wandern die E-Mail-Adressen später in eine eigene Tabelle `kontakt`, definiert man `v_newsletter` mit einem Join neu. Programme, die die Sicht lesen, bleiben unverändert (vgl. ANSI-SPARC-Architektur in Thema t02). |

Das Gegenstück ist die **physische Datenunabhängigkeit**: Änderungen auf der internen Ebene, etwa ein neuer Index, verändern weder Tabellen noch Sichten noch die Ergebnisse von Abfragen (siehe Abschnitt Indexe).

Eine Sicht sichert keine Integrität. Wer direkt auf die Tabelle schreiben darf, umgeht sie. Regeln gehören als Constraint oder Trigger an die Tabelle.

**Materialisierte Sicht** (*materialized view*): Sie speichert das Ergebnis wie eine Tabelle. Lesen ist dann schnell, aber der Inhalt muss aufgefrischt werden (PostgreSQL: `CREATE MATERIALIZED VIEW`, `REFRESH MATERIALIZED VIEW`). Firebird 3 kennt keine materialisierten Sichten.

### Wann ist eine Sicht änderbar?

Ein `INSERT`, `UPDATE` oder `DELETE` auf eine Sicht muss das DBMS in eine Änderung der Basistabelle übersetzen. Das geht nur, wenn jede Zeile der Sicht **genau einer** Zeile einer Tabelle entspricht. Firebird 3 nennt eine Sicht automatisch änderbar, wenn sie

- aus genau **einer** Tabelle oder änderbaren Sicht liest (kein Join),
- keine Prozeduren aufruft,
- keine Spalten aus Unterabfragen oder Ausdrücken enthält,
- keine Aggregate, keine Fensterfunktionen und kein `GROUP BY`, `HAVING` oder `ORDER BY` enthält,
- kein `DISTINCT` und keine Zeilenbegrenzung (`FIRST`, `SKIP`, `ROWS`, `OFFSET … FETCH`) enthält,
- und wenn jede Spalte der Basistabelle, die in der Sicht fehlt, NULL erlaubt, einen Default hat oder per Trigger gefüllt wird.

`v_newsletter` erfüllt das, sofern die ausgeblendeten Spalten optional sind oder einen Default haben. `v_kundenumsatz` erfüllt es nicht: Bei `UPDATE v_kundenumsatz SET umsatz = 0` ist offen, welche Bestellposten sich wie ändern sollen.

> **Variante je DBMS:** PostgreSQL verlangt ebenfalls genau eine Tabelle im `FROM` und verbietet `DISTINCT`, `GROUP BY`, `HAVING`, `LIMIT`/`OFFSET`, Mengenoperationen und Aggregate. Berechnete Spalten erlaubt es aber: Sie sind dann nur lesbar, die übrigen Spalten bleiben änderbar. Fehlt eine Pflichtspalte, scheitert dort erst das konkrete INSERT. SQLite-Sichten sind überhaupt nicht änderbar. Mengenoperationen (`UNION` usw.) schließen die Änderbarkeit in Firebird, PostgreSQL und SQLite aus; die Norm kennt dagegen auch änderbare `UNION ALL`-Sichten, die einzelne andere Systeme umsetzen. Für nicht änderbare Sichten bieten PostgreSQL und SQLite `INSTEAD OF`-Trigger. In Firebird macht man eine nur lesbare Sicht mit gewöhnlichen Triggern auf der Sicht änderbar.

> **Achtung, Firebird:** Laut Referenz schreibt Firebird Änderungen über eine Sicht, auf der Trigger definiert sind, **nicht mehr automatisch** in die Basistabelle, auch wenn die Sicht an sich änderbar wäre. Die Trigger müssen die Basistabellen dann selbst ändern. Wer an eine änderbare Sicht nur einen Protokolltrigger hängt, riskiert also, die automatische Weitergabe zu verlieren. Ob das nur für die Ereignisse gilt, für die es Trigger gibt, oder für alle, ist in diesem Kurs nicht geprüft. Sicher ist, alle Ereignisse in eigenen Triggern zu behandeln.

### WITH CHECK OPTION

Ohne Zusatz darf ein UPDATE über eine Sicht eine Zeile so ändern, dass sie danach nicht mehr in der Sicht erscheint. Auch ein INSERT darf Zeilen anlegen, die die Sicht nicht zeigt. `WITH CHECK OPTION` verbietet das: Erfüllt die neue oder geänderte Zeile die WHERE-Bedingung der Sicht nicht, wird die Anweisung abgewiesen. Der Zusatz setzt eine automatisch änderbare Sicht voraus; Firebird verlangt außerdem eine eigene WHERE-Bedingung der Sicht.

```sql
CREATE VIEW v_angebot AS
SELECT tee_id, name, preis_100g, bestand_g
FROM tee
WHERE bestand_g > 0
WITH CHECK OPTION;

UPDATE v_angebot SET preis_100g = 7.90 WHERE tee_id = 3;   -- erlaubt
UPDATE v_angebot SET bestand_g = 0 WHERE tee_id = 3;       -- abgewiesen
```

Ein UPDATE über die Sicht trifft außerdem nur Zeilen, die die Sicht zeigt. Für einen ausverkauften Tee ändert es still 0 Zeilen.

> **Varianten:** PostgreSQL unterscheidet `WITH LOCAL CHECK OPTION` (nur die Bedingung dieser Sicht) und `WITH CASCADED CHECK OPTION` (auch die Bedingungen darunterliegender Sichten); ohne Angabe gilt CASCADED. Firebird 3 kennt diese Zusätze nicht.
>
> **Firebird-Eigenheiten der Check Option:**
> - Die Sicht braucht eine eigene WHERE-Bedingung. PostgreSQL erlaubt die Check Option auch ohne, etwa um Bedingungen darunterliegender Sichten durchzusetzen.
> - Firebird prüft die Eingabe gegen die WHERE-Bedingung, **bevor** etwas an die Basistabelle geht. Scheitert die Prüfung, kommen Defaults und Trigger der Basistabelle gar nicht zum Zug und können die Eingabe nicht mehr „reparieren“. Besteht die Eingabe die Prüfung, feuern die Trigger wie gewohnt.
> - Sichtspalten, die im INSERT fehlen, gibt Firebird bei einer Sicht **mit** Check Option als NULL an die Tabelle weiter. Deren Defaults greifen dann nicht. Bei einer Sicht **ohne** Check Option werden fehlende Spalten gar nicht weitergegeben, und die Defaults der Tabelle greifen wie gewohnt.

## Trigger (BEFORE/AFTER) und prozedurale Integrität

Ein **Trigger** (deutsch auch **Auslöser**) ist ein im DBMS gespeichertes Programm, das bei einer Datenänderung **automatisch** läuft. Niemand ruft ihn auf. Ein Trigger besteht aus

- einem **Namen**,
- der **auslösenden Datenbankoperation**: Ereignis (`INSERT`, `UPDATE`, `DELETE`) und Tabelle (oder Sicht),
- dem **Zeitpunkt**: `BEFORE` (vor dem Schreiben der Zeile) oder `AFTER` (danach),
- den **Folgeaktionen**: dem Rumpf, der dann ausgeführt wird.

**Zeilen- und Anweisungstrigger.** Ein Zeilentrigger (*row-level*, `FOR EACH ROW`) läuft einmal je betroffener Zeile: Ändert ein UPDATE 50 Zeilen, läuft er 50-mal. Ein Anweisungstrigger (*statement-level*, `FOR EACH STATEMENT`) läuft einmal je Anweisung, auch wenn sie keine Zeile trifft. Firebird- und SQLite-DML-Trigger sind immer Zeilentrigger. PostgreSQL kennt beide, und dort gilt **ohne Angabe `FOR EACH STATEMENT`**, ebenso in der SQL-Norm. Wer in PostgreSQL `FOR EACH ROW` vergisst, bekommt also still einen Anweisungstrigger, in dem es kein `NEW` und `OLD` gibt.

Im Rumpf eines Zeilentriggers stehen `OLD` (Zeile vorher) und `NEW` (Zeile nachher) bereit:

| Ereignis | `OLD` | `NEW` |
| --- | --- | --- |
| INSERT | nicht vorhanden | neue Zeile |
| UPDATE | alte Fassung | neue Fassung |
| DELETE | gelöschte Zeile | nicht vorhanden |

`OLD` ist immer nur lesbar. `NEW` darf man nur in einem **BEFORE**-Trigger ändern, ausgenommen berechnete Spalten (`COMPUTED BY`). Was dort in `NEW` steht, wird gespeichert. In einem AFTER-Trigger ist die Zeile schon geschrieben. Bei einem Trigger für mehrere Ereignisse (`AFTER INSERT OR UPDATE OR DELETE`) sagen die Booleschen Variablen `INSERTING`, `UPDATING` und `DELETING`, was gerade passiert. Damit greift man nur auf die Zeile zu, die es beim jeweiligen Ereignis gibt. Bei einem fehlenden `OLD` bzw. `NEW` liefert PostgreSQL NULL, in Firebird sollte man darauf gar nicht zugreifen.

> **Variante:** `INSTEAD OF`-Trigger, die statt der Änderung laufen, gibt es in PostgreSQL und SQLite für Sichten. Firebird kennt sie nicht.

### Deklarativ oder prozedural?

> **Begriffsvariante:** In vielen Lehrbüchern bilden „statisch“ und „deklarativ“ sowie „dynamisch“ und „prozedural“ jeweils **ein** Begriffspaar. *Deklarative* (statische) Integritätsregeln werden bei der Tabellendefinition festgelegt und gelten für jeden Zustand. *Prozedurale* (dynamische) Integritätsregeln vergleichen den Zustand vor und nach einer Änderung und lassen sich nur zur Laufzeit prüfen. Diese Gleichsetzung sollte man kennen. Der Kurs unterscheidet im Folgenden feiner, weil die beiden Paare in der Praxis nicht immer zusammenfallen.

Feiner betrachtet lassen sich Integritätsbedingungen (Thema t05) nach zwei Gesichtspunkten einteilen:

- **Statisch oder dynamisch.** Eine *statische* Bedingung muss in jedem einzelnen Datenbankzustand gelten („der Preis ist nicht negativ“). Eine *dynamische* Bedingung (Übergangsbedingung) vergleicht den Zustand **vor** einer Änderung mit dem Zustand **danach** („der Bestellstatus darf nicht von `'versandt'` zurück auf `'offen'` wechseln“). Sie lässt sich nur zur Laufzeit prüfen, im Moment der Änderung.
- **Deklarativ oder prozedural.** *Deklarativ* beschreibt man die Bedingung als Constraint (`NOT NULL`, `CHECK`, `UNIQUE`, `FOREIGN KEY`, Thema t09), und das DBMS prüft sie selbst. *Prozedural* formuliert man sie als Programm, das bei der Änderung läuft, meist als Trigger. Er sieht `OLD` und `NEW` und eignet sich deshalb für dynamische Bedingungen.

Deklarative Constraints kommen zuerst, weil das DBMS sie zuverlässig und ohne eigenen Code prüft. Einen Trigger braucht man, wenn eine Regel

- alten und neuen Zustand vergleicht (dynamische Bedingung),
- eine Aktion auslöst statt nur zu prüfen (Protokoll, Bestand nachziehen, abgeleiteten Wert eintragen),
- andere Zeilen oder Tabellen einbezieht („nur bestellen, was auf Lager ist“) und **zuverlässig** gelten soll.

**CHECK mit Unterabfrage und ASSERTION.** Für Regeln über mehrere Tabellen sieht der SQL-Standard `CREATE ASSERTION` vor, eine Bedingung über die ganze Datenbank. Weder Firebird noch PostgreSQL setzen sie um. Firebird 3 erlaubt dafür Unterabfragen im CHECK, etwa `CHECK (menge_g <= (SELECT bestand_g FROM tee WHERE tee_id = bestellposten.tee_id))`. Geprüft wird ein solcher CHECK aber nur, wenn die **eigene Zeile** eingefügt oder geändert wird. Sinkt danach der Bestand in `tee`, bleibt der verletzende Bestellposten unbemerkt stehen. Der Fehler fällt erst beim nächsten UPDATE dieses Postens auf. PostgreSQL verbietet Unterabfragen im CHECK ganz. Eine Assertion würde nach der Norm bei jeder betroffenen Änderung geprüft, egal in welcher Tabelle, und wäre damit zuverlässig; nur gibt es sie in den beiden Systemen nicht. In Firebird und PostgreSQL wird eine tabellenübergreifende Bedingung deshalb erst mit Triggern auf **allen** beteiligten Tabellen zuverlässig.

Manche Regeln über mehrere Zeilen derselben Tabelle gehen trotzdem deklarativ, nämlich über einen **eindeutigen Index**. „Jeder Tee erscheint in einer Bestellung höchstens einmal“ ist schlicht `UNIQUE (bestellung_id, tee_id)`. „Höchstens ein offener Eintrag je Schlüssel“ geht in PostgreSQL und SQLite mit einem partiellen Index: `CREATE UNIQUE INDEX … ON t (schluessel) WHERE offen`.

Trigger haben ihren Preis. Sie arbeiten unsichtbar für die Anwendung, ein Trigger kann weitere Trigger auslösen, und jede Änderung wird langsamer. Was ein Constraint kann, gehört deshalb nicht in einen Trigger.

### Standardform eines Triggers

Die SQL-Norm beschreibt Trigger unabhängig von einem Produkt (verkürzt):

```
CREATE TRIGGER name
  {BEFORE | AFTER} {INSERT | DELETE | UPDATE [OF spalte, ...]} ON tabelle
  [REFERENCING OLD ROW AS alt NEW ROW AS neu]
  [FOR EACH {ROW | STATEMENT}]
  [WHEN (bedingung)]
  anweisung
```

Beispiel für die Übergangsbedingung aus dem Teeladen in dieser Form:

```sql
CREATE TRIGGER trg_status_pruefen
  BEFORE UPDATE OF status ON bestellung
  REFERENCING OLD ROW AS alt NEW ROW AS neu
  FOR EACH ROW
  WHEN (alt.status = 'versandt' AND neu.status = 'offen')
  BEGIN ATOMIC
    SIGNAL SQLSTATE '45000';     -- Änderung mit Fehler abweisen
  END
```

`REFERENCING` gibt der alten und der neuen Zeile Namen, `WHEN` beschränkt den Trigger auf passende Zeilen. Die Produkte weichen davon ab: Firebird schreibt `OLD`/`NEW` fest und kennt kein `WHEN`; PostgreSQL nennt die Zeilen ebenfalls fest `OLD`/`NEW`, nutzt `REFERENCING` nur für Übergangstabellen (`OLD TABLE`/`NEW TABLE`) und ruft als Aktion immer eine Funktion auf. Auf Papier ist jede dieser Schreibweisen richtig, wenn Ereignis, Zeitpunkt, Ebene und Folgeaktion stimmen.

### Syntax in Firebird PSQL

Trigger, Prozeduren und Blöcke schreibt man in Firebird in **PSQL** (*Procedural SQL*). Jede Anweisung im Rumpf endet mit `;`. Das Skriptwerkzeug isql beendet eine Anweisung aber ebenfalls am Semikolon. Deshalb stellt man das Endezeichen vorher um:

```sql
CREATE EXCEPTION ex_bestand 'Nicht genug Tee auf Lager.';

SET TERM ^ ;

CREATE TRIGGER trg_bestellposten_bi FOR bestellposten
ACTIVE BEFORE INSERT POSITION 0
AS
DECLARE VARIABLE v_preis   NUMERIC(6,2);
DECLARE VARIABLE v_bestand INTEGER;
BEGIN
  SELECT preis_100g, bestand_g FROM tee
  WHERE tee_id = NEW.tee_id
  INTO :v_preis, :v_bestand;

  IF (NEW.preis_100g IS NULL) THEN      -- abgeleiteter Wert
    NEW.preis_100g = v_preis;

  IF (v_bestand < NEW.menge_g) THEN     -- Prüfung über eine andere Tabelle
    EXCEPTION ex_bestand;
END^

SET TERM ; ^
```

- `SET TERM ^ ;` macht `^` zum Endezeichen, `END^` schließt den Trigger ab, `SET TERM ; ^` stellt das Semikolon wieder her. `SET TERM` ist ein Befehl von isql, kein SQL. Werkzeuge, die eine Anweisung am Stück senden, brauchen es nicht.
- Kopf: `FOR tabelle [ACTIVE | INACTIVE] {BEFORE | AFTER} ereignis [OR ereignis …] [POSITION n]`. `ACTIVE` ist der Standard und darf fehlen; mit `ALTER TRIGGER name INACTIVE` schaltet man einen Trigger ab, mit `DROP TRIGGER name` löscht man ihn. Gleichwertig ist die SQL:2003-Form `CREATE TRIGGER name BEFORE INSERT ON bestellposten AS …`. `POSITION` ordnet mehrere Trigger desselben Zeitpunkts (kleinere Zahl zuerst).
- Zuweisung mit `=`. In SELECT, INSERT, UPDATE und DELETE stehen Variablen mit Doppelpunkt (`:v_preis`), `NEW` und `OLD` ohne.
- `EXCEPTION name` löst eine vorher mit `CREATE EXCEPTION` angelegte Ausnahme aus. Die auslösende Anweisung wird abgebrochen und zurückgenommen, die Anwendung erhält die Meldung.
- `IF (…) THEN` steuert eine Anweisung oder einen Block `BEGIN … END`. Ein `END IF` gibt es nicht.

Zweites Beispiel, ein **Protokoll** per AFTER-Trigger:

```sql
SET TERM ^ ;

CREATE TRIGGER trg_tee_preis_au FOR tee
ACTIVE AFTER UPDATE POSITION 0
AS
BEGIN
  IF (NEW.preis_100g IS DISTINCT FROM OLD.preis_100g) THEN
    INSERT INTO preis_historie (tee_id, preis_alt, preis_neu, geaendert_am)
    VALUES (NEW.tee_id, OLD.preis_100g, NEW.preis_100g, CURRENT_TIMESTAMP);
END^

SET TERM ; ^
```

`IS DISTINCT FROM` behandelt NULL wie einen Wert. `<>` ergäbe beim Wechsel von oder zu NULL den Wert UNKNOWN, und der Trigger würde nichts protokollieren.

Vor Firebird 3 waren Trigger der übliche Weg zu automatischen Schlüsseln: `NEW.tee_id = NEXT VALUE FOR seq_tee;` in einem BEFORE-INSERT-Trigger. Heute erledigt das eine Identity-Spalte (Thema t09).

### Unterschied zu PostgreSQL (PL/pgSQL)

In PostgreSQL steht die Logik in einer eigenen **Triggerfunktion**. Der Trigger verweist nur auf sie:

```sql
CREATE FUNCTION f_preis_historie() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.preis_100g IS DISTINCT FROM OLD.preis_100g THEN
    INSERT INTO preis_historie (tee_id, preis_alt, preis_neu, geaendert_am)
    VALUES (NEW.tee_id, OLD.preis_100g, NEW.preis_100g, CURRENT_TIMESTAMP);
  END IF;
  RETURN NULL;          -- bei AFTER wird der Rückgabewert ignoriert
END $$;

CREATE TRIGGER trg_tee_preis_au AFTER UPDATE ON tee
FOR EACH ROW EXECUTE FUNCTION f_preis_historie();
```

Weitere Unterschiede: Zuweisung mit `:=`, `IF … END IF`, Fehler mit `RAISE EXCEPTION '…'`. Ein BEFORE-Zeilentrigger gibt die Zeile zurück, mit der es weitergehen soll: bei INSERT und UPDATE `RETURN NEW` (gegebenenfalls geändert), bei DELETE `RETURN OLD`. Liefert er `NULL`, entfällt die Änderung dieser Zeile still. Vorsicht deshalb bei `RETURN NEW` in einem BEFORE-DELETE-Trigger: `NEW` ist dort NULL, und das Löschen findet nicht statt. Ohne `FOR EACH ROW` wird der Trigger zum Anweisungstrigger (siehe oben).

## Stored Procedures (Grundidee)

Eine **gespeicherte Prozedur** (*stored procedure*) ist ein benanntes Programm mit Parametern, das in der Datenbank liegt und **auf dem Server** läuft. Anwendungen, Trigger und andere Prozeduren rufen sie auf.

- **Vorteile:** Mehrere Schritte kosten nur einen Aufruf, das spart Netzverkehr. Die Logik liegt an einer Stelle für alle Anwendungen und wird zentral geändert. Man kann Rechte nur auf die Prozedur vergeben statt auf die Tabellen: Das Anwendungskonto bekommt nur `EXECUTE`, die Tabellenrechte erhält in Firebird die Prozedur selbst (`GRANT … TO PROCEDURE p`, siehe Thema t13).
- **Nachteile:** Jede Plattform hat ihre eigene Sprache (PSQL, PL/pgSQL, PL/SQL, Transact-SQL). Ein Wechsel des DBMS heißt also umschreiben. Außerdem ist Logik in der Datenbank schwerer zu testen und zu versionieren.

Firebird unterscheidet zwei Arten:

| | ausführbare Prozedur | selektierbare Prozedur |
| --- | --- | --- |
| Zweck | etwas erledigen, meist ändern | Zeilen liefern, wirkt wie eine Tabelle |
| Ausgabe | höchstens ein Satz Ausgabewerte | beliebig viele Zeilen, je `SUSPEND` eine |
| Aufruf | `EXECUTE PROCEDURE p(…);` | `SELECT … FROM p(…);` |

Ausführbar, ein Storno mit zwei Schritten:

```sql
SET TERM ^ ;

CREATE PROCEDURE bestellung_stornieren (p_bestellung_id INTEGER)
AS
DECLARE VARIABLE v_tee   INTEGER;
DECLARE VARIABLE v_menge INTEGER;
BEGIN
  FOR SELECT tee_id, menge_g FROM bestellposten
      WHERE bestellung_id = :p_bestellung_id
      INTO :v_tee, :v_menge
  DO
    UPDATE tee SET bestand_g = bestand_g + :v_menge WHERE tee_id = :v_tee;

  UPDATE bestellung SET status = 'storniert'
  WHERE bestellung_id = :p_bestellung_id;
END^

SET TERM ; ^

EXECUTE PROCEDURE bestellung_stornieren(4711);
```

Selektierbar, Umsatz je Teesorte:

```sql
SET TERM ^ ;

CREATE PROCEDURE umsatz_je_sorte (p_jahr INTEGER)
RETURNS (sorte VARCHAR(20), umsatz NUMERIC(12,2))
AS
BEGIN
  FOR SELECT t.sorte, SUM(p.menge_g * p.preis_100g / 100)
      FROM bestellposten p
      JOIN tee t        ON t.tee_id = p.tee_id
      JOIN bestellung b ON b.bestellung_id = p.bestellung_id
      WHERE EXTRACT(YEAR FROM b.bestellt_am) = :p_jahr
      GROUP BY t.sorte
      INTO :sorte, :umsatz
  DO
    SUSPEND;
END^

SET TERM ; ^

SELECT sorte, umsatz FROM umsatz_je_sorte(2025) ORDER BY umsatz DESC;
```

`SUSPEND` gibt die aktuellen Ausgabewerte als Zeile an den Aufrufer und wartet, bis er sie abgeholt hat. Ruft man eine selektierbare Prozedur mit `EXECUTE PROCEDURE` auf, kommt nur die erste Zeile.

Die Prozedur läuft in der Transaktion des Aufrufers, und der Aufruf zählt als **eine** Anweisung. Scheitert darin das zweite UPDATE, nimmt Firebird die Wirkung des ganzen Aufrufs zurück, also auch die des ersten UPDATE. Die Transaktion bleibt offen, frühere Anweisungen in ihr bleiben erhalten (vgl. Thema t11). Geändert wird eine Prozedur mit `CREATE OR ALTER PROCEDURE`, gelöscht mit `DROP PROCEDURE`.

Neben Prozeduren gibt es **gespeicherte Funktionen** (Firebird 3: `CREATE FUNCTION`). Eine Funktion liefert genau einen Wert und steht deshalb wie eine eingebaute Funktion in einem Ausdruck (`SELECT netto(preis_100g) FROM tee`). Eine Prozedur wird dagegen für sich aufgerufen.

> **PostgreSQL:** `CREATE PROCEDURE … LANGUAGE plpgsql AS $$ … $$;`, Aufruf mit `CALL p(…)`. Was in Firebird eine selektierbare Prozedur ist, schreibt man dort als Funktion mit `RETURNS TABLE (…)` und ruft sie mit `SELECT * FROM f(…)` auf.

**Abgrenzung:** Eine Sicht ist eine gespeicherte Abfrage ohne Parameter und ohne Ablaufsteuerung. Eine Prozedur wird ausdrücklich aufgerufen und kann Parameter, Schleifen und Änderungen enthalten. Ein Trigger läuft ohne Aufruf, ausgelöst durch eine Änderung.

## Indexe (Zweck, Primärschlüssel-Index)

Ein **Index** gehört zur internen Ebene. Er verknüpft jeden vorkommenden Wert einer Spalte (oder einer Spaltenkombination), den **Suchschlüssel**, mit den Fundstellen der Zeilen, die diesen Wert haben. Fragt jemand `WHERE nachname = 'Mohr'`, prüft das DBMS ohne Index jede Zeile von `kunde` (*full table scan*). Mit Index schlägt es den Schlüssel `'Mohr'` nach und liest danach nur die Zeilen, auf die der Eintrag zeigt.

Weil ein Index nur den Zugriffsweg betrifft, darf man ihn jederzeit anlegen oder löschen, ohne dass sich Tabellen, Sichten oder Abfrageergebnisse ändern. Das ist **physische Datenunabhängigkeit**.

![B-Baum-Index auf nachname: Wurzel mit Trennschlüsseln, drei verkettete Blätter mit Verweisen auf Zeilen](diagrams/btree-nachname.dot)

**B-Baum, grob:** Die Standardstruktur ist ein balancierter Mehrwegbaum, der B-Baum. Bei der Variante, in der alle Schlüssel in den Blättern stehen, spricht man vom B+-Baum (in deutschen Lehrbüchern auch B*-Baum). Innere Knoten enthalten Trennschlüssel und Verweise auf Kindknoten, die Blätter alle Schlüssel mit Verweis auf die Zeile. Alle Blätter liegen gleich tief, und benachbarte Blätter sind verkettet. Eine Suche läuft von der Wurzel zu einem Blatt. Weil jeder Knoten viele Schlüssel fasst, sind das auch bei Millionen Zeilen nur wenige Schritte (logarithmischer Aufwand). Der Baum unterstützt `=`, `<`, `>`, `BETWEEN`, `IS NULL` und Sortierung. `LIKE` mit festem Präfix (`'Mo%'`) kann er ebenfalls nutzen, `LIKE '%hr'` nicht. In PostgreSQL gilt das Präfix-`LIKE` allerdings nur bei der Sortierung `C` oder mit einer eigenen Operatorklasse (`text_pattern_ops`).

Eine Alternative für reine Gleichheitssuchen ist der **Hash-Index**: Er berechnet aus dem Schlüssel direkt die Fundstelle, unterstützt aber weder Bereiche noch Sortierung (PostgreSQL: `CREATE INDEX … USING hash`; Firebird 3 bietet nur B-Bäume).

**Automatische Indexe:** Für jeden `PRIMARY KEY` und jeden `UNIQUE`-Constraint legt das DBMS selbst einen eindeutigen Index an. Nur so kann es Eindeutigkeit schnell prüfen.

> **Variante:** Firebird legt auch für jeden `FOREIGN KEY` automatisch einen Index an. PostgreSQL tut das nicht; dort indiziert man Fremdschlüsselspalten bei Bedarf selbst, etwa für Joins oder kaskadierendes Löschen. Mehrere NULL in einem UNIQUE-Index sind in beiden erlaubt; bei teilweise NULL in mehrspaltigen Schlüsseln verhalten sie sich verschieden (siehe Thema t09).

**Syntax:** Der heutige SQL-Standard regelt Indexe nicht, weil sie zur internen Ebene gehören. Die Form ist aber fast überall gleich:

```sql
CREATE INDEX ix_kunde_ort_name ON kunde (ort, nachname);
CREATE UNIQUE INDEX ix_tee_name ON tee (name);
CREATE DESCENDING INDEX ix_bestellung_datum ON bestellung (bestellt_am);  -- Firebird
CREATE INDEX ix_kunde_mail_gross ON kunde COMPUTED BY (UPPER(email));     -- Firebird
DROP INDEX ix_kunde_ort_name;
```

In Firebird gilt die Richtung (`ASC`/`DESC`) für den ganzen Index. PostgreSQL schreibt sie je Spalte (`(bestellt_am DESC)`) und indiziert Ausdrücke direkt in der Klammer (`(UPPER(email))`).

**Preis:** Ein Index ist bewusst eingeführte Redundanz, denn er speichert Werte, die schon in der Tabelle stehen, ein zweites Mal in anderer Ordnung. Wie jede Redundanz muss er bei Änderungen nachgezogen werden: Kommt eine Zeile hinzu, fällt eine weg oder ändert sich ein Wert in einer Indexspalte, muss das DBMS auch den Baum anpassen. Lesezugriffe werden schneller, Schreibzugriffe langsamer, und Plattenplatz kostet er auch. Ob ein vorhandener Index überhaupt benutzt wird, entscheidet der Optimierer anhand von Statistiken (Firebird: `SET STATISTICS INDEX name`, PostgreSQL: `ANALYZE`).

**Wann lohnt er sich?** Man wägt drei Fragen ab:

- **Wie oft wird so gesucht?** Taucht die Spalte regelmäßig in `WHERE`, in `JOIN … ON` oder in `ORDER BY` auf, und ist die Tabelle so groß, dass das Durchlesen spürbar dauert?
- **Wie stark grenzt die Bedingung ein?** Ein Index zahlt sich aus, wenn die Bedingung nur einen kleinen Anteil der Zeilen trifft (hohe **Selektivität**). `WHERE newsletter = TRUE` trifft vielleicht jede zweite Zeile; dann ist es meist billiger, die Tabelle am Stück zu lesen, als jede zweite Zeile einzeln anzuspringen.
- **Wie oft wird geschrieben?** Bei einer Spalte, die ständig geändert, aber kaum gesucht wird, überwiegt der Pflegeaufwand.

**Zusammengesetzter Index:** `(ort, nachname)` ordnet die Einträge zuerst nach `ort` und innerhalb desselben Orts nach `nachname`. Man kann sich Aktenordner vorstellen, die nach Jahr und darin nach Monat abgelegt sind: Alle Unterlagen vom März 2025 findet man sofort, alle Märze über alle Jahre nur, indem man jeden Jahresordner öffnet. Entsprechend hilft der Index bei `WHERE ort = 'Kiel'` und bei `WHERE ort = 'Kiel' AND nachname = 'Mohr'`, kaum aber bei `WHERE nachname = 'Mohr'` allein. Faustregel: Spalten, die mit `=` gesucht werden, nach vorn, eine Bereichsbedingung (`BETWEEN`, `<`) dahinter.

## Auf einen Blick

- Eine Sicht ist eine gespeicherte Abfrage, keine Kopie der Daten. Sie gehört zur externen Ebene und wird in der Phase Datendefinition angelegt. Ihre Zwecke sind Vereinfachung, Datenschutz und logische Datenunabhängigkeit.
- Automatisch änderbar ist eine Sicht nur auf einer Tabelle ohne Join, Aggregat, GROUP BY, DISTINCT und Mengenoperationen. Berechnete Spalten schließen die Änderbarkeit in Firebird aus, in PostgreSQL sind nur sie selbst nicht änderbar. SQLite-Sichten sind nie änderbar. Firebird-Sichten mit eigenen Triggern geben Änderungen laut Referenz nicht mehr automatisch weiter; dann alle Ereignisse selbst behandeln.
- `WITH CHECK OPTION` weist Änderungen ab, durch die eine Zeile aus der Sicht herausfiele. Firebird prüft vor der Basistabelle; fehlende Spalten werden dabei NULL statt Default.
- Ein Trigger (Auslöser) hat Namen, auslösende Operation (Ereignis + Tabelle), Zeitpunkt (BEFORE/AFTER) und Folgeaktionen. In Firebird läuft er einmal je Zeile, in PostgreSQL ohne `FOR EACH ROW` einmal je Anweisung.
- `OLD` ist nur lesbar. `NEW` lässt sich nur in BEFORE-Triggern ändern. BEFORE prüft und leitet Werte ab, AFTER protokolliert und zieht Folgeänderungen nach. `INSERTING`/`UPDATING`/`DELETING` unterscheiden die Ereignisse.
- Constraints vor Triggern. Trigger braucht man für dynamische Bedingungen (alt gegen neu), für Aktionen und für zuverlässige Regeln über mehrere Tabellen. Ein CHECK mit Unterabfrage (Firebird) prüft nur bei Änderung der eigenen Zeile; die Norm sieht `CREATE ASSERTION` vor, umgesetzt ist sie weder in Firebird noch in PostgreSQL.
- Standardform: `CREATE TRIGGER … ON tabelle [REFERENCING …] FOR EACH ROW [WHEN (…)]`. PSQL in isql braucht `SET TERM ^ ;` … `END^` … `SET TERM ; ^`; Fehler löst `EXCEPTION name` aus.
- PostgreSQL: Triggerfunktion `RETURNS trigger` (BEFORE: `RETURN NEW` bei INSERT/UPDATE, `RETURN OLD` bei DELETE) und dazu `CREATE TRIGGER … FOR EACH ROW EXECUTE FUNCTION`.
- Stored Procedure: serverseitiges Programm mit Parametern. In Firebird wird eine ausführbare Prozedur mit `EXECUTE PROCEDURE` aufgerufen, eine selektierbare mit `SUSPEND` über `SELECT … FROM p(…)`. PostgreSQL nutzt `CALL` bzw. eine Funktion mit `RETURNS TABLE`.
- Ein Index gehört zur internen Ebene und zum physischen Entwurf. Er macht selektive Suchen schnell und ist Redundanz, die bei jedem Schreiben nachgezogen werden muss. Anlegen oder Löschen ändert keine Ergebnisse (physische Datenunabhängigkeit). Standard ist der B-Baum. PK und UNIQUE haben ihn automatisch, in Firebird auch FK.
- Im zusammengesetzten Index zählt die Reihenfolge: Gleichheitsspalten zuerst.
