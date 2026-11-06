---
id: t13
lang: de
title: Anwendungszugriff & Sicherheit
order: 13
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: wp-datenbank
    ref: "Einleitung (Datenbankanwendungen als Programme, die ihre Daten über ein Datenbanksystem verwalten); Funktionen eines DBMS (Datenschutz, Datensicherheit); Mehrbenutzerfähigkeit (Berechtigungen werden geprüft); Sprachen (Berechtigungssteuerung): https://de.wikipedia.org/wiki/Datenbank"
  - id: watt-database-design-2e
    ref: "Kap. 14 Database Users (Anwendungsnutzer, Anwendungsprogrammierer, DBA autorisiert Zugriffe)"
  - id: wp-schichtenarchitektur
    ref: "Klassifikationen (strikte und lockere Schichtung); Vor- und Nachteile; Schichtenarchitekturen nach Anzahl der Schichten (Zwei-Schichten als Client-Server, Drei-Schichten mit Präsentations-, Logik- und Datenhaltungsschicht; Thin und Fat Client): https://de.wikipedia.org/wiki/Schichtenarchitektur"
  - id: inf-schule-datenbanksysteme
    ref: "Zugriff auf Datenbanken (https://inf-schule.de/datenbanksysteme/zugriff): Architektur eines Informationssystems (Browser, Webserver, Datenbanksystem; Skalierung auf mehrere Rechner); Datenbankzugriff mit Python (Verbindung mit Host, Benutzer, Passwort, Datenbank; Cursor, execute, fetchone, fetchall, close); Exkurs Gefahren bei Benutzereingaben (Ursache String-Formatierung, minimale Rechte, commit/rollback); Fachkonzept Benutzer (Rechte auf Datenbank-, Tabellen- und Attributebene)"
  - id: wp-open-database-connectivity
    ref: "Einleitung und Details (standardisierte Schnittstelle mit SQL, von Microsoft auf Basis des Call Level Interface von X/Open und ISO/IEC, Treiber je DBMS, Verbindungsdaten unter einem Namen, Zugriff nur über die ODBC-Komponente, Windows und Unix): https://de.wikipedia.org/wiki/Open_Database_Connectivity"
  - id: wp-java-database-connectivity
    ref: "Einleitung (einheitliche Java-API, Treiber meist vom Hersteller, Pakete java.sql und javax.sql, seit JDK 1.1, vergleichbar mit ODBC); Typen von JDBC-Treibern 1–4 (Typ 1 laut Artikel seit Java 9 nicht mehr unterstützt, abweichend von der Angabe Java 8): https://de.wikipedia.org/wiki/Java_Database_Connectivity"
  - id: pep-249
    ref: "Module Interface (connect mit dsn, user, password, host, database; paramstyle qmark, numeric, named, format, pyformat); Connection Objects (close mit implizitem Rollback ohne vorheriges commit, commit, rollback, cursor; Auto-Commit anfangs aus); Cursor Objects (execute mit gebundenen Parametern, Attribut rowcount, fetchone mit None am Ende, fetchall): https://peps.python.org/pep-0249/"
  - id: wp-sql-injection
    ref: "Einleitung (deutsch SQL-Einschleusung, Programmierfehler); Voraussetzungen (Sonderzeichen in Eingaben werden nicht maskiert oder geprüft); Vorgang (Veränderung von Daten, Ausspähen über UNION, Kommentare, angehängte Befehle, zeitbasierte und blinde SQL-Injection, Administratorrechte); Gegenmaßnahmen (Prepared Statements als sicherster Weg, Eingabeprüfung, Escaping, minimale Rechte, Stored Procedures kein genereller Schutz); Java (JDBC): Connection, Statement, PreparedStatement, setString, executeQuery, ResultSet: https://de.wikipedia.org/wiki/SQL-Injection"
  - id: wpen-sql-injection
    ref: "Root cause (Eingabe gelangt vom Daten- in den Befehlskontext durch Verkettung oder Interpolation); Techniken (Tautologie, Kommentar, gestapelte Abfragen, blind); Mitigation (parameterized statements, allow-list statt deny-list, least privilege, Escaping als fragil eingestuft, Stored Procedures unter den OWASP-Empfehlungen): https://en.wikipedia.org/wiki/SQL_injection"
  - id: wp-prepared-statement
    ref: "Funktionsweise (Platzhalter, einmal vorbereiten, mehrfach mit Parametern ausführen), Vorteile (Schutz vor SQL-Injection, Geschwindigkeit bei Wiederholung), Beispiele Java (prepareStatement, setString, executeQuery) und PHP PDO (benannte Platzhalter): https://de.wikipedia.org/wiki/Prepared_Statement"
  - id: sqlite-documentation
    ref: "Prepared Statement Object, Lebenszyklus prepare → bind → step → reset → finalize: https://www.sqlite.org/c3ref/stmt.html ; Binding Values To Prepared Statements (Literale durch Parameter ersetzbar; Formen ?, ?NNN, :AAA, @AAA, $AAA): https://www.sqlite.org/c3ref/bind_blob.html"
  - id: postgresql-17-docs-sql
    ref: "4.2.2 Positional Parameters (Wert, der von außen geliefert wird; Client-Bibliotheken übergeben Datenwerte getrennt vom SQL-Text): https://www.postgresql.org/docs/17/sql-expressions.html ; 5.8 Privileges (Eigentümer, Rechtearten, PUBLIC mit Default-Rechten EXECUTE auf Funktionen und CONNECT/TEMPORARY auf Datenbanken, Spaltenrechte, WITH GRANT OPTION mit kaskadierendem Entzug): https://www.postgresql.org/docs/17/ddl-priv.html"
  - id: postgresql-17-docs-sql-commands
    ref: "GRANT (Objektrechte, Spaltenrechte für SELECT/INSERT/UPDATE/REFERENCES, mehrere Tabellen und ALL TABLES IN SCHEMA, Rollenmitgliedschaft mit ADMIN und INHERIT, PUBLIC, WITH GRANT OPTION, Sequenzrechte getrennt); REVOKE (GRANT OPTION FOR, RESTRICT/CASCADE mit RESTRICT als Default, laut Compatibility in der Norm verpflichtend; Rechte addieren sich aus direkt, Rolle und PUBLIC; nur selbst vergebene Rechte entziehbar, Beispiel zweier Gewährender; Superuser handelt als Eigentümer; Warnungen bei fehlenden Grant Options); CREATE USER/CREATE ROLE (LOGIN, INHERIT); CREATE FUNCTION (SECURITY INVOKER/DEFINER, Abschnitt Writing SECURITY DEFINER Functions Safely mit festem search_path und REVOKE EXECUTE FROM PUBLIC); SET ROLE; PREPARE (einmal analysieren, mehrfach ausführen)"
  - id: firebird-30-language-reference
    ref: "Kap. 13 Security: 13.2 CREATE USER (PASSWORD Pflicht, Sicherheitsdatenbank, Admin-Rechte dort nötig); 13.3 SQL Privileges (Eigentümer); 13.4 CREATE ROLE; 13.5 GRANT (Tabellenrechte, Spaltenliste nur bei UPDATE und REFERENCES, EXECUTE, USAGE für Sequenzen und Exceptions, Empfänger PROCEDURE/TRIGGER/VIEW/ROLE/USER, PUBLIC, WITH GRANT OPTION, GRANTED BY, Rollenempfänger ist immer ein Benutzername, WITH ADMIN OPTION, eine aktive Rolle zur Zeit, Schlüsselwörter USER/ROLE, DDL-Rechte CREATE/ALTER ANY/DROP ANY); 13.6 REVOKE (GRANT OPTION FOR, ADMIN OPTION FOR, GRANTED BY, REVOKE ALL ON ALL, nur Gewährende entziehen, PUBLIC gesondert entziehen); SET ROLE (Rollenwechsel in der Sitzung, CURRENT_ROLE); Kap. 7 PSQL (EXECUTE STATEMENT). SET ROLE und GRANT Rolle TO Rolle am FB-3.0.14-Container geprüft (Orchestrator, 2026-11-06)"
  - id: oer-informatik-datenbanken
    ref: "SQL: Benutzer und Rechte verwalten (DCL), https://oer-informatik.de/sql-dcl: Authentifizierung und Autorisierung, Rechteebenen, Rollen als benannte Rechtebündel, WITH GRANT OPTION und WITH ADMIN OPTION, Prinzip der minimalen Rechte, Risiko eines gemeinsamen Admin-Kontos bei SQL-Injection"
  - id: wp-data-control-language
    ref: "DCL: Vergabe und Entzug von Berechtigungen mit GRANT und REVOKE: https://de.wikipedia.org/wiki/Data_Control_Language"
  - id: wpen-jdbc-driver
    ref: "Type 1 driver (JDBC-ODBC bridge, mit Java 8 aus dem JDK entfernt); Treibertypen 2–4"
  - id: wpen-java-database-connectivity
    ref: "Section Examples (DriverManager.getConnection, executeUpdate, while (rs.next()), setAutoCommit(false), commit, rollback)"
---

# Anwendungszugriff & Sicherheit

## Lernziele

Nach diesem Thema kannst du …

- eine Datenbankanwendung in Präsentations-, Logik- und Datenhaltungsschicht zerlegen und eine Zwei-Schichten- von einer Drei-Schichten-Architektur unterscheiden,
- erklären, wozu Schnittstellen wie ODBC, JDBC und die Python DB-API und ihre Treiber dienen, und den Ablauf Verbindung → Anweisung → Ergebnis → Abschluss wiedergeben,
- an einem Codebeispiel zeigen, wie SQL-Injection entsteht, welchen SQL-Text eine bösartige Eingabe erzeugt und was sie anrichten kann,
- unsicheren Code mit einem Prepared Statement reparieren und Whitelisting sowie minimale Rechte als Ergänzung begründen,
- Benutzern und Rollen in Firebird 3 mit `GRANT` und `REVOKE` Objektrechte geben und entziehen und die wichtigsten Unterschiede zu PostgreSQL nennen.

## Datenbankanwendungen und Schichten

Eine **Datenbankanwendung** (*database application*) ist ein Programm, das seine Daten nicht selbst in Dateien ablegt, sondern über ein Datenbanksystem verwaltet. Die meisten Menschen sehen die Datenbank nie direkt, sondern nur durch solche Anwendungen. Geschrieben werden sie von Anwendungsprogrammiererinnen und -programmierern, die dafür das DBMS und seine Schnittstellen kennen müssen.

Laufendes Beispiel ist die **Kantinen-App** eines Unternehmens: Mitarbeitende sehen den Speiseplan, bestellen ihr Mittagessen vor und bezahlen über ein Guthabenkonto mit Kartennummer. In der Datenbank liegen die Tabellen `gericht`, `bestellung` und `konto`.

„Sicherheit“ meint in diesem Thema vor allem die **Zugriffskontrolle** aus t01 (Datenschutz): Nur Berechtigte dürfen Daten lesen oder ändern. Das schützt die Vertraulichkeit (niemand liest fremde Guthaben) und die Integrität (niemand ändert sie unbefugt). Die Datensicherung gegen Verlust gehört nicht hierher.

**Schichtenarchitektur** (*layered architecture*). Die Software wird in Schichten zerlegt. Jede Schicht hat eine klar umrissene Aufgabe und nutzt nur die Dienste der Schichten unter ihr, und zwar über deren Schnittstelle. Bei *strikter* Schichtung spricht eine Schicht nur mit der direkt darunterliegenden, bei *lockerer* Schichtung mit jeder tieferen. Strikte Schichtung macht Schichten leichter austauschbar und testbar, lockere ist oft schneller, koppelt die Schichten aber enger.

Allgemein spricht man von einer **Mehrschichten-** bzw. **n-Schichten-Architektur** (*n-tier architecture*). Die klassische Aufteilung hat drei Schichten:

| Schicht | Aufgabe | In der Kantinen-App |
| --- | --- | --- |
| **Präsentationsschicht** (*presentation tier*, Frontend) | Daten anzeigen, Eingaben entgegennehmen | Speiseplan im Browser oder in der Handy-App, Bestellknopf |
| **Logikschicht** (Anwendungs- oder Geschäftslogik, *business logic*) | Regeln und Abläufe, Prüfungen, SQL-Anweisungen an die Datenbank | Bestellschluss 10 Uhr prüfen, Preis vom Guthaben abbuchen, Eingaben prüfen |
| **Datenhaltungsschicht** (*data tier*, Backend) | speichern, suchen, Integrität und Rechte durchsetzen | Firebird-Server mit `gericht`, `bestellung`, `konto` |

![Drei-Schichten-Architektur der Kantinen-App](diagrams/drei-schichten-kantine.dot)

**Verteilung auf Rechner.** Schichten sind zunächst eine *logische* Gliederung. Zum Entwickeln können alle drei auf einem Rechner laufen. Im Betrieb verteilt man sie meist:

- **Zwei Schichten (klassisches Client-Server):** Auf jedem Arbeitsplatz läuft ein Programm mit Oberfläche **und** Logik, das sich direkt mit dem Datenbankserver verbindet. Jeder Arbeitsplatz braucht Treiber und Zugangsdaten. Ändert sich eine Regel, muss das Programm überall erneuert werden. Ein solches Programm mit eigener Logik nennt man *Fat Client*.
- **Drei Schichten:** Der Client ist oft nur ein Browser (*Thin Client*) und spricht per HTTP mit einem Anwendungsserver. Nur dieser verbindet sich mit der Datenbank. Logik und Zugangsdaten liegen an einer Stelle, und die Datenbank ist von außen nicht erreichbar. Bei viel Last kann man mehrere Anwendungsserver vor dieselbe Datenbank stellen.

Der Anwendungsserver ist dabei Server für den Browser und zugleich Client des DBMS. Der Preis der Schichtung: Daten laufen durch mehrere Schichten und werden dabei umgewandelt, das kostet Zeit.

> **Begriffsfalle:** Die Drei-Schichten-Architektur verteilt die *Software einer Anwendung*. Das ANSI-SPARC-Modell aus t02 beschreibt dagegen *Ebenen der Schemabeschreibung* innerhalb des Datenbanksystems. Beide haben „drei“ im Namen, sonst nichts gemeinsam.

## Schnittstellen: ODBC, JDBC und Python DB-API

Jedes DBMS spricht über das Netz sein eigenes Protokoll. Damit ein Programm nicht für jedes DBMS neu geschrieben werden muss, gibt es **Datenbankschnittstellen** (*database API*). Sie bieten einheitliche Aufrufe zum Verbinden, Senden von SQL und Lesen der Ergebnisse. Für jedes DBMS gibt es einen **Treiber** (*driver*), meist vom Hersteller, der diese Aufrufe in das Protokoll des DBMS übersetzt. Beim Wechsel des DBMS tauscht man den Treiber und die Verbindungsangaben. Der SQL-Text selbst muss trotzdem zum Dialekt passen (siehe t09/t10).

- **ODBC** (*Open Database Connectivity*): eine sprachunabhängige Funktionsschnittstelle, über die Programme SQL an beliebige DBMS schicken, sofern es einen ODBC-Treiber gibt. Die Anwendung greift nie direkt auf die Datenbank zu, sondern immer über die ODBC-Komponente. Verbindungsdaten (Server, Port, Datenbank, Benutzer, Passwort) lassen sich unter einem Namen als Datenquelle hinterlegen; das Programm nennt dann nur diesen Namen. Zur Herkunft: Grundlage ist das *Call Level Interface* (CLI) von X/Open und ISO/IEC, entwickelt hat ODBC Microsoft. Heute ist es nicht mehr auf Windows beschränkt, sondern auch unter Unix verfügbar.
- **JDBC** (*Java Database Connectivity*): das Gegenstück für Java, Teil der Java-Plattform (Pakete `java.sql`, `javax.sql`). Die wichtigsten Objekte sind `Connection` (die Verbindung), `Statement` bzw. `PreparedStatement` (die Anweisung) und `ResultSet` (das Ergebnis). JDBC-Treiber werden in vier Typen eingeteilt:

  | Typ | Arbeitsweise |
  | --- | --- |
  | 1 | Brücke zu einem installierten ODBC-Treiber (JDBC-ODBC-Brücke) |
  | 2 | ruft eine plattformabhängige Client-Bibliothek des DBMS auf |
  | 3 | schickt die Aufrufe über ein Netzprotokoll an einen Middleware-Server, der sie für das DBMS übersetzt |
  | 4 | spricht direkt das Netzprotokoll des DBMS, ohne Zwischenstation |

  > **Quellenvariante:** Die mit dem JDK ausgelieferte JDBC-ODBC-Brücke wurde mit **Java 8** entfernt. Eine der Quellen nennt dafür Java 9. Brücken anderer Anbieter gibt es weiterhin.
- **Python DB-API** (PEP 249): die gemeinsame Schnittstelle der Python-Datenbankmodule, ein modernes Beispiel für dasselbe Prinzip.

Der Ablauf ist überall gleich:

| Schritt | JDBC | Python DB-API |
| --- | --- | --- |
| 1. Verbindung aufbauen (Server, Datenbank, Benutzer, Passwort) | `Connection con = DriverManager.getConnection(url, benutzer, passwort)` | `con = treiber.connect(...)` |
| 2. Anweisung erzeugen | `con.createStatement()` bzw. `con.prepareStatement(sql)` | `cur = con.cursor()` |
| 3. ausführen | `executeQuery()` für Abfragen, `executeUpdate()` für INSERT/UPDATE/DELETE | `cur.execute(sql, parameter)` |
| 4. Ergebnis zeilenweise lesen | `ResultSet rs`, Schleife `while (rs.next()) { … rs.getString("name") … }` | `cur.fetchone()` (am Ende `None`), `cur.fetchall()` |
| 5. abschließen | nach `con.setAutoCommit(false)`: `con.commit()` bzw. `con.rollback()`; danach `close()` | `con.commit()` bzw. `con.rollback()`, `close()` |

Die beiden Schnittstellen haben verschiedene Voreinstellungen. In JDBC ist **Auto-Commit** anfangs eingeschaltet, jede Anweisung wird also sofort bestätigt. Für eine Transaktion aus mehreren Anweisungen schaltet man es mit `con.setAutoCommit(false)` ab. Erst danach sind `commit()` und `rollback()` erlaubt, im Auto-Commit-Modus lösen sie eine `SQLException` aus. Die DB-API schreibt vor, dass Auto-Commit anfangs aus ist; ohne `commit()` gehen Änderungen beim Schließen verloren. Vor dem `commit()` kann das Programm prüfen, ob eine Änderung so viele Zeilen getroffen hat wie erwartet. In der DB-API steht die Zahl in `cur.rowcount`, in JDBC ist sie der Rückgabewert von `executeUpdate()`. Weicht die Zahl ab, ruft es `rollback()` auf. Das fängt auch manche Folgen einer Injection ab.

```python
con = treiber.connect(host="db.firma.local", database="kantine",
                      user="kantine_app", password=passwort)
cur = con.cursor()
cur.execute("SELECT name, preis FROM gericht WHERE kategorie = ? AND aktiv = TRUE",
            ("vegetarisch",))
for name, preis in cur.fetchall():
    print(name, preis)
cur.close()
con.close()
```

**Cursor.** SQL liefert eine *Menge* von Zeilen, ein Programm arbeitet mit einzelnen Variablen. Ein **Cursor** bzw. das `ResultSet` steht auf einer Zeile des Ergebnisses, und das Programm holt die Zeilen nacheinander ab. So wird die mengenorientierte Abfrage zeilenweise verarbeitet.

## SQL-Injection

**SQL-Injection** (deutsch auch *SQL-Einschleusung*) ist ein Angriff, bei dem eine Eingabe den **SQL-Text verändert**, den die Anwendung an das DBMS schickt. Die Ursache liegt immer im Programm: Es setzt den SQL-Text durch **Verkettung** (oder String-Formatierung, f-Strings usw.) aus festen Teilen und der Eingabe zusammen. Beim DBMS kommt nur noch fertiger Text an. Welcher Teil vom Programm stammt und welcher vom Benutzer, ist nicht mehr zu erkennen: Die Eingabe gerät vom Datenteil in den Befehlsteil.

> **Zwei gleichwertige Formulierungen der Ursache:**
>
> - *Mechanismus:* Die Eingabe wird in den SQL-Text eingesetzt (Verkettung).
> - *Lücke:* Die Eingabe wird dabei nicht geprüft, und Metazeichen wie Apostroph, Semikolon oder `--` werden nicht maskiert. Sie behalten deshalb ihre Bedeutung in SQL.
>
> Beide beschreiben dasselbe von zwei Seiten und sind als Antwort richtig. Die Abhilfe setzt trotzdem beim Mechanismus an: Bei der Parameterbindung kommt die Eingabe gar nicht erst in den SQL-Text. Dann gibt es nichts mehr zu maskieren, und eine vergessene oder fehlerhafte Maskierung kann keine Lücke mehr öffnen. Bei Zahlenparametern ohne Anführungszeichen hilft Maskieren ohnehin nicht (siehe Tabelle unten).

Beispiel: Die Kantinen-App zeigt die Bestellungen zu einer Kartennummer.

```python
nr = formular["karten_nr"]
sql = ("SELECT b.bestell_id, b.datum, g.name FROM bestellung b "
       "JOIN gericht g ON g.gericht_id = b.gericht_id "
       "JOIN konto k ON k.konto_id = b.konto_id "
       "WHERE k.karten_nr = '" + nr + "'")
cur.execute(sql)        # unsicher!
```

Mit der Eingabe `40711` entsteht `… WHERE k.karten_nr = '40711'`, alles in Ordnung. Mit der Eingabe `x' OR '1'='1` entsteht:

```sql
... WHERE k.karten_nr = 'x' OR '1'='1'
```

Das erste Apostroph der Eingabe beendet das Literal, das schließende Apostroph des Programms passt genau zum letzten `'1`. Die Bedingung ist für jede Zeile wahr, die App zeigt **alle Bestellungen aller Mitarbeitenden**.

**Lerntipp:** Schreib bei solchen Beispielen den fertigen SQL-Text Zeichen für Zeichen hin und markiere, welche Teile aus der Eingabe stammen. Dann siehst du sofort, wo ein Literal endet.

Typische Muster:

| Muster | Eingabe (Idee) | Wirkung |
| --- | --- | --- |
| Bedingung aushebeln | `' OR '1'='1` | WHERE wird für jede Zeile wahr |
| Zahlenparameter | `0 OR 1=1` bzw. `7; DELETE FROM bestellung` | wie oben, aber **ohne Apostroph** (siehe unten) |
| Rest abschneiden | `…' --` | alles nach `--` ist Kommentar, z. B. eine weitere Bedingung |
| fremde Tabellen anhängen | `' UNION SELECT … FROM konto --` | Zeilen anderer Tabellen erscheinen im Ergebnis; die Spaltenzahl muss gleich sein, die Typen müssen zueinander passen. Fehlende Spalten füllt der Angreifer mit `NULL` oder Konstanten auf. |
| Metadaten ausspähen | `' UNION SELECT NULL, NULL, RDB$RELATION_NAME FROM RDB$RELATIONS --` | liest aus dem Systemkatalog (in Firebird die `RDB$`-Systemtabellen) die Namen von Tabellen und Spalten und bereitet so gezielte Angriffe vor |
| zweite Anweisung | `'; DELETE FROM konto --` | nur, wenn Schnittstelle bzw. Treiber mehrere Anweisungen je Aufruf ausführen; das ist von System zu System verschieden |
| blinde Injection | Ja/Nein-Bedingungen, Zeitverzögerung | liest Daten auch ohne sichtbare Ausgabe oder Fehlermeldung aus |

**Zahlenparameter.** Steht eine Zahl im SQL-Text, setzt das Programm sie meist ohne Anführungszeichen ein:

```python
sql = "SELECT bestell_id, datum, status FROM bestellung WHERE konto_id = " + eingabe
```

Die Eingabe `0 OR 1=1` ergibt `… WHERE konto_id = 0 OR 1=1`, also alle Bestellungen. Es muss kein Literal beendet werden, deshalb braucht der Angriff **kein Apostroph**. Apostrophe zu maskieren oder zu verbieten, nützt hier gar nichts. Schutz bieten die Parameterbindung (`WHERE konto_id = ?`) und eine Typprüfung im Programm: Die Eingabe wird vorher in eine ganze Zahl umgewandelt (`int(eingabe)`), alles andere wird abgewiesen.

**Folgen.** Vertrauliche Daten lesen (Kartennummern, Guthaben), Daten ändern oder löschen, Prüfungen und Anmeldungen umgehen, höhere Rechte erlangen, auf manchen Systemen sogar Befehle auf dem Server ausführen. Was davon gelingt, hängt vor allem an den **Rechten des Datenbankkontos**, mit dem die Anwendung verbunden ist. Die Injection läuft mit genau diesen Rechten.

## Schutz: Prepared Statements, Whitelisting, minimale Rechte

### Prepared Statements und Parameterbindung

Ein **Prepared Statement** (*vorbereitete Anweisung*) ist SQL-Text mit **Platzhaltern** statt Werten:

1. **Vorbereiten:** Das Programm schickt den Text mit Platzhaltern. Das DBMS analysiert ihn, die Struktur der Anweisung steht damit fest.
2. **Binden:** Die Werte werden getrennt vom SQL-Text übergeben (*Parameterbindung*).
3. **Ausführen**, beliebig oft mit neuen Werten.

Weil die Struktur feststeht, bevor die Eingabe eintrifft, wird die Eingabe nur als **Wert** benutzt und nie als SQL gelesen. `x' OR '1'='1` ist dann eine gewöhnliche Kartennummer, die es nicht gibt. Ergebnis: keine Zeile.

```python
sql = ("SELECT b.bestell_id, b.datum, g.name FROM bestellung b "
       "JOIN gericht g ON g.gericht_id = b.gericht_id "
       "JOIN konto k ON k.konto_id = b.konto_id "
       "WHERE k.karten_nr = ?")
cur.execute(sql, (nr,))
```

```java
PreparedStatement ps = con.prepareStatement(
    "SELECT name, preis FROM gericht WHERE kategorie = ?");
ps.setString(1, kategorie);
ResultSet rs = ps.executeQuery();
```

Regeln für Platzhalter:

- Der Platzhalter steht **ohne Anführungszeichen**. `'?'` wäre ein Textliteral aus einem Fragezeichen.
- Bei `LIKE` bindet man das ganze Muster: `WHERE name LIKE ?` mit dem Wert `"%" + suchwort + "%"`.
- Welches Zeichen der Platzhalter ist, legt die Schnittstelle fest: `?` (JDBC, ODBC, SQLite), benannte Formen wie `:name` (z. B. SQLite, PHP PDO), `$1` in PostgreSQL.
- In der Python DB-API gibt jeder Treiber im Attribut `paramstyle` an, welchen Stil er verwendet: `qmark` (`?`), `numeric` (`:1`), `named` (`:name`), `format` (`%s`) oder `pyformat` (`%(name)s`). Bei Treibern mit `format` ist **`%s` ein echter Platzhalter**. Sicher oder unsicher entscheidet sich nicht am Zeichen, sondern am Aufruf:
  - sicher: `cur.execute("… WHERE karten_nr = %s", (nr,))`, der Wert geht als eigenes Argument an `execute`;
  - unsicher: `cur.execute("… WHERE karten_nr = '%s'" % nr)` oder ein f-String. Hier setzt Python den Wert schon **vor** dem Aufruf in den Text ein, das ist Verkettung.

Nebeneffekt: Weil die Anweisung nur einmal analysiert wird, läuft eine wiederholte Ausführung mit neuen Werten schneller. Dasselbe Muster zeigt die SQLite-C-Schnittstelle: vorbereiten, binden, ausführen, zurücksetzen, erneut binden, am Ende freigeben.

**Grenze:** Platzhalter stehen nur für **Werte** (Literale). Tabellen- und Spaltennamen, Schlüsselwörter wie `ASC`/`DESC` oder ganze Bedingungen lassen sich nicht binden.

### Whitelisting

**Whitelisting** (Positivliste, *allow-list*) lässt nur ausdrücklich vorgesehene Eingaben zu. Es ist das Mittel für alles, was kein Wert ist:

```python
erlaubt = {"preis": "preis", "name": "name"}
spalte = erlaubt.get(sortierung)
if spalte is None:
    raise ValueError("unbekannte Sortierung")
sql = "SELECT name, preis FROM gericht ORDER BY " + spalte
```

Eingesetzt wird nur ein im Programm hinterlegter Baustein, nie die Eingabe selbst. Auch Werte prüft man gegen ein erwartetes Format, z. B. Kartennummer genau fünf Ziffern. Eine *Negativliste* (bestimmte Zeichen oder Wörter verbieten) ist dagegen nie vollständig und lässt sich umgehen.

### Minimale Rechte

Nach dem **Prinzip der minimalen Rechte** (*principle of least privilege*) bekommt das Datenbankkonto der Anwendung nur, was sie wirklich braucht. Die Kantinen-App liest also Gerichte und liest und legt Bestellungen an, sie löscht nichts, ändert kein Schema und meldet sich nie als Administrator oder Eigentümer der Tabellen an. Das verhindert keine Injection, begrenzt aber den Schaden. Teilen sich alle Programme ein einziges Admin-Konto, reicht eine einzige Lücke, um alles zu lesen oder zu löschen.

**Zugriff nur über Prozeduren.** Noch enger wird es, wenn die Anwendung gar keine Tabellenrechte bekommt, sondern nur `EXECUTE` auf Stored Procedures (t12). Die Prozedur erledigt einen fachlichen Schritt vollständig, z. B. „Gericht bestellen und Guthaben abbuchen“. In Firebird 3 bekommt die **Prozedur selbst** die nötigen Tabellenrechte:

```sql
GRANT SELECT ON gericht TO PROCEDURE bestellen;
GRANT SELECT, UPDATE ON konto TO PROCEDURE bestellen;
GRANT INSERT ON bestellung TO PROCEDURE bestellen;
GRANT EXECUTE ON PROCEDURE bestellen TO kantine_app;
```

`kantine_app` kann jetzt bestellen, aber weder `konto` lesen noch Guthaben beliebig ändern. Eine Injection im Programm kann höchstens die Prozedur mit anderen Werten aufrufen. Die Prozedurparameter sind typisiert, `bestellen(7, 12)` erwartet zwei ganze Zahlen. In PostgreSQL läuft eine Funktion normalerweise mit den Rechten des Aufrufers; für dieses Muster legt man sie mit `SECURITY DEFINER` an, dann läuft sie mit den Rechten ihres Eigentümers. Weil PostgreSQL `EXECUTE` auf neue Funktionen an `PUBLIC` vergibt (siehe Absatz zum Eigentümer), entzieht man es dort zuerst, `REVOKE EXECUTE ON FUNCTION bestellen(INTEGER, INTEGER) FROM PUBLIC`, und gibt es dann nur dem App-Konto. Sonst könnte jeder die Funktion mit den Rechten ihres Eigentümers aufrufen. Die Doku empfiehlt für solche Funktionen außerdem einen fest gesetzten `search_path`.

> **Quellenvarianten:**
>
> - **Escaping** (Sonderzeichen maskieren, z. B. Apostroph verdoppeln): Eine Quelle nennt es als Gegenmaßnahme, wenn man die Funktionen des jeweiligen DBMS verwendet. Eine andere stuft es als fehleranfällig ein, weil es nicht alle Fälle abdeckt. Einigkeit herrscht darin, dass Parameterbindung vorgeht. Bei Zahlenparametern ohne Anführungszeichen wirkt Escaping gar nicht.
> - **Stored Procedures**: Eine Quelle sieht darin keinen generellen Schutz, eine andere führt sie unter den empfohlenen Maßnahmen. Einordnung: Eine Prozedur, die ihre Parameter nur als Werte verwendet, wirkt wie ein Prepared Statement. Setzt sie intern SQL-Text aus Parametern zusammen (in Firebird z. B. mit `EXECUTE STATEMENT`), ist sie genauso angreifbar. Ihr größter Sicherheitsbeitrag liegt im Rechtemuster oben: Die Anwendung darf nur, was die Prozeduren anbieten.

## Rechtevergabe mit GRANT und REVOKE

Das DBMS trennt **Authentifizierung** (Wer meldet sich an? Benutzername und Passwort) von **Autorisierung** (Darf dieser Benutzer diese Anweisung ausführen?). Die Autorisierung prüft es bei jeder Anweisung. Fehlt das Recht, wird die Anweisung abgewiesen. Vergeben und entzogen werden Rechte mit der DCL (`GRANT`, `REVOKE`, siehe t09).

**Benutzer.** In Firebird 3 und PostgreSQL gleich geschrieben:

```sql
CREATE USER kantine_app PASSWORD 'Kt-2025-app';
CREATE USER koch_jan    PASSWORD 'Kt-2025-jan';
```

In Firebird 3 liegen Benutzer in der Sicherheitsdatenbank des Servers, anlegen dürfen sie nur Administratoren dieser Sicherheitsdatenbank. In PostgreSQL ist `CREATE USER` eine Rolle, die sich anmelden darf (`CREATE ROLE … LOGIN`).

**Eigentümer.** Wer ein Objekt anlegt, ist sein **Eigentümer** (*owner*) und hat alle Rechte darauf. Auf Tabellen und Sichten haben alle anderen zunächst keine Rechte, außer Administratoren. Rechte vergeben dürfen der Eigentümer, Administratoren und wer ein Recht mit Weitergaberecht erhalten hat. PostgreSQL gibt `PUBLIC` allerdings für manche Objektarten Rechte von vornherein, u. a. `EXECUTE` auf neue Funktionen und Prozeduren sowie `CONNECT` und `TEMPORARY` auf Datenbanken. Wer minimale Rechte will, entzieht sie ausdrücklich (`REVOKE EXECUTE ON FUNCTION … FROM PUBLIC`).

**Wer vergibt was?** Rechte gibt es auf mehreren Ebenen: für die ganze Datenbank bzw. ein Schema, für einzelne Tabellen und Sichten und für einzelne Spalten. Daneben gibt es Rechte zum **Anlegen und Ändern von Objekten**. In Firebird 3 heißen sie z. B. `CREATE TABLE`, `ALTER ANY TABLE` und `DROP ANY TABLE`, also Rechte auf Objektarten statt auf einzelne Objekte. Eine übliche Aufgabenteilung:

- **Administrator (DBA):** legt Benutzer und Rollen an, vergibt Anlegerechte und verwaltet die Rechte insgesamt.
- **Entwicklerin:** bekommt Anlegerechte, legt die Tabellen an und ist damit deren Eigentümerin.
- **Anwender und Anwendungskonten:** bekommen nur DML-Rechte (`SELECT`, `INSERT`, …) auf das, was sie brauchen, oft über Rollen.

**Objektrechte in Firebird 3:**

| Recht | erlaubt | Spaltenliste |
| --- | --- | --- |
| `SELECT` | lesen | nein (PostgreSQL: ja) |
| `INSERT` | einfügen | nein (PostgreSQL: ja) |
| `UPDATE` | ändern | **ja** |
| `DELETE` | löschen | nein |
| `REFERENCES` | Fremdschlüssel auf die Tabelle anlegen | **ja** |
| `ALL` | alle fünf | – |
| `EXECUTE` | Prozedur oder Funktion aufrufen | – |
| `USAGE` | Sequenz weiterzählen (in FB3 auch Exceptions) | – |

```sql
GRANT SELECT ON gericht TO kantine_app;
GRANT SELECT, INSERT ON bestellung TO kantine_app;
GRANT UPDATE (status) ON bestellung TO koch_jan;
GRANT SELECT ON gericht TO lea WITH GRANT OPTION;   -- Lea darf weitergeben
GRANT SELECT ON gericht TO PUBLIC;                  -- alle Benutzer, auch künftige
```

**Sichten als Zugriffsschutz (siehe t12).** Spalten, die jemand nicht *sehen* soll, verbirgt man in Firebird über eine Sicht und gibt das `SELECT` nur auf die Sicht. Mit einer WHERE-Bedingung beschränkt eine Sicht auch die **Zeilen**, und zwar abhängig von den Werten:

```sql
CREATE VIEW v_bestellung_heute AS
SELECT bestell_id, gericht_id, status
FROM bestellung
WHERE datum = CURRENT_DATE;

GRANT SELECT ON v_bestellung_heute TO r_kueche;   -- kein Recht auf bestellung selbst
```

Die Küche sieht nur die Bestellungen des Tages, ohne `konto_id` und ohne ältere Bestellungen. Rechte auf die Basistabelle braucht sie dafür nicht.

In PostgreSQL deckt ein Tabellenrecht die zugehörigen Sequenzen nicht ab, sie brauchen eigene Rechte.

**Rollen.** Eine **Rolle** (*role*) ist ein benanntes Bündel von Rechten für eine Aufgabe. Gemeint ist nicht die Rolle im ER-Modell (t04). Man gibt die Rechte der Rolle und die Rolle den Personen. Wechselt jemand die Aufgabe, ändert sich nur die Zuordnung.

```sql
CREATE ROLE r_kueche;
GRANT SELECT ON bestellung TO r_kueche;
GRANT SELECT ON gericht TO r_kueche;
GRANT UPDATE (status) ON bestellung TO r_kueche;
GRANT r_kueche TO koch_jan;                    -- mit WITH ADMIN OPTION dürfte Jan sie weiter zuweisen
```

Firebird empfiehlt, den Empfänger eindeutig als `TO ROLE r_kueche` bzw. `TO USER koch_jan` zu schreiben. Ohne Schlüsselwort sucht der Server zuerst eine Rolle dieses Namens. PostgreSQL kennt diese Schlüsselwörter an dieser Stelle nicht, `TO r_kueche` läuft in beiden.

**Aktive Rolle in Firebird 3.** Zugewiesen werden können einem Benutzer mehrere Rollen, **aktiv ist aber genau eine je Sitzung**. Jan gibt sie beim Verbinden an (Rollenname in den Verbindungsangaben) oder wechselt in der Sitzung mit `SET ROLE r_kueche;`. Welche gerade gilt, zeigt `CURRENT_ROLE`; ohne Rolle steht dort `NONE`. Es zählen nur die Rechte der aktiven Rolle, dazu Jans direkte Rechte und die von `PUBLIC`. Die Rechte weiterer ihm zugewiesener Rollen wirken in diesem Moment nicht.

**Keine Rollenhierarchie in Firebird 3.** Der Empfänger einer Rollenzuweisung ist dort immer ein Benutzername. `GRANT r_kasse TO r_kueche;` läuft zwar ohne Fehler, weist `r_kasse` aber einem *Benutzer* namens `R_KUECHE` zu. Wer die Rolle `r_kueche` nutzt, bekommt dadurch keine Rechte von `r_kasse`. PostgreSQL erlaubt Rollen als Mitglieder anderer Rollen. Ob ein Mitglied die Rechte erbt, richtet sich dort nach dem `INHERIT`-Attribut des Mitglieds, das bei `CREATE ROLE` standardmäßig gesetzt ist. Zusätzlich gibt es `SET ROLE`.

**Entziehen mit REVOKE.**

```sql
REVOKE INSERT ON bestellung FROM kantine_app;
REVOKE GRANT OPTION FOR SELECT ON gericht FROM lea;   -- nur das Weitergaberecht
REVOKE r_kueche FROM koch_jan;
REVOKE SELECT ON gericht FROM PUBLIC;
```

- **Wer darf entziehen?** Grundsätzlich nur, wer das Recht vergeben hat. Ein REVOKE trifft nur die eigene Vergabe. Ist sie gar nicht vorhanden, entzieht es nichts, unter Umständen **ohne Fehlermeldung**.
  - *Firebird 3:* Ein Administrator kann mit `GRANTED BY benutzer` stellvertretend für den Gewährenden entziehen. `REVOKE ALL ON ALL FROM tom`, von einem Administrator ausgeführt, entfernt alle Rechte und Rollen, die Tom direkt zugewiesen wurden, gleich von wem.
  - *PostgreSQL:* Ein Superuser handelt beim REVOKE so, als wäre er der Eigentümer. Er entzieht also die Vergaben des Eigentümers. Was andere über ihr Weitergaberecht vergeben haben, erreicht er nur über die Kette mit `CASCADE`. Fehlen dem Ausführenden die nötigen Weitergaberechte, gibt PostgreSQL je nach Fall eine Warnung aus oder bricht mit einem Fehler ab.
- **Rechte addieren sich:** Ein Benutzer darf alles, was ihm direkt, über eine Rolle oder über `PUBLIC` erlaubt ist. In Firebird 3 zählt dabei nur die gerade aktive Rolle. `REVOKE … FROM tom` nimmt nur das direkte Recht. Was an `PUBLIC` vergeben wurde, muss von `PUBLIC` entzogen werden. Hat Tom dasselbe Recht von zwei Gewährenden bekommen, behält er es, bis **beide** es entzogen haben.
- **Weitergabeketten:** Die SQL-Norm sieht bei REVOKE die Zusätze `RESTRICT` (abbrechen, wenn weitergegebene Rechte davon abhängen) und `CASCADE` (abhängige Rechte mit entziehen) vor. PostgreSQL setzt beide um, ohne Angabe gilt `RESTRICT`. Firebird 3 kennt die Zusätze nicht. Wie es weitergegebene Rechte beim Entzug behandelt, beschreibt die Firebird-Referenz nicht; dazu macht dieser Kurs keine Aussage.

**Rechtegraph mit CASCADE (PostgreSQL).** Die Eigentümerin E der Tabelle `konto` hat vergeben:

```
E ──SELECT, WITH GRANT OPTION──► A ──SELECT──► C
E ──SELECT, WITH GRANT OPTION──► B ──SELECT──► C
                                  A ──SELECT──► D
```

Jetzt führt E `REVOKE SELECT ON konto FROM a CASCADE;` aus:

- A verliert das Recht (Vergabe von E entzogen).
- D verliert es, denn D hatte es nur von A, und diese Vergabe hing am Weitergaberecht von A.
- C **behält** es, denn C hat es zusätzlich von B. Der kaskadierende Entzug folgt nur der Kette, die bei E und A beginnt.
- B ist nicht betroffen.

Ohne `CASCADE` hätte PostgreSQL das REVOKE abgewiesen, weil A das Recht an C und D weitergegeben hat.

> **Dialekt Firebird 3 ↔ PostgreSQL:**
>
> | Punkt | Firebird 3 | PostgreSQL |
> | --- | --- | --- |
> | Benutzer | `CREATE USER … PASSWORD`, Sicherheitsdatenbank des Servers | `CREATE USER` = Rolle mit `LOGIN` |
> | Spaltenrechte | nur `UPDATE`, `REFERENCES` | `SELECT`, `INSERT`, `UPDATE`, `REFERENCES` |
> | Rolle zuweisen an | nur Benutzer (`GRANT r1 TO r2` legt nur einen Benutzernamen an, keine Hierarchie) | auch an Rollen (Hierarchien) |
> | Rolle wirksam | genau eine aktive Rolle je Sitzung: beim Verbinden angeben oder mit `SET ROLE` wechseln | Rechte werden geerbt (`INHERIT`-Attribut des Mitglieds, Default an); zusätzlich `SET ROLE` |
> | REVOKE bei Weitergabeketten | keine Zusätze `RESTRICT`/`CASCADE`; Verhalten nicht beschrieben | `RESTRICT` (Default, Fehler) oder `CASCADE` |
> | stellvertretend entziehen | Administrator mit `GRANTED BY` | Superuser handelt als Eigentümer |
> | alles entziehen | `REVOKE ALL ON ALL FROM tom` | z. B. `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM tom` |
> | mehrere Tabellen je GRANT | je Tabelle eine Anweisung | `ON bestellung, gericht` erlaubt |
> | Prozedur mit eigenen Rechten | Rechte an die Prozedur: `GRANT … TO PROCEDURE p` | Funktion mit `SECURITY DEFINER`; vorher `EXECUTE` von `PUBLIC` entziehen |

**Spickzettel:**

```
GRANT {recht [, recht …] | ALL} ON tabelle TO {benutzer | rolle | PUBLIC} [WITH GRANT OPTION];  -- ¹
GRANT UPDATE (spalte [, …]) ON tabelle TO …;          -- FB3: Spaltenliste nur UPDATE/REFERENCES
GRANT EXECUTE ON PROCEDURE p TO …;
GRANT recht ON tabelle TO PROCEDURE p;                -- FB3: Rechte für die Prozedur selbst
CREATE ROLE r;   GRANT r TO benutzer [WITH ADMIN OPTION];
SET ROLE r;                                           -- aktive Rolle wechseln (FB3 und PG)
REVOKE [GRANT OPTION FOR] recht ON tabelle FROM … [RESTRICT | CASCADE];  -- ²
REVOKE [ADMIN OPTION FOR] r FROM benutzer;
```

¹ Weitergaberechte nicht an `PUBLIC`: In PostgreSQL sind Grant Options an `PUBLIC` unzulässig. Firebird 3 warnt ausdrücklich davor, eine Rolle `WITH ADMIN OPTION` an `PUBLIC` zu geben; auch `WITH GRANT OPTION` an `PUBLIC` vermeidet man besser.
² `RESTRICT`/`CASCADE` sieht die SQL-Norm vor (dort ist einer der beiden Zusätze Pflicht). PostgreSQL macht sie optional mit `RESTRICT` als Default, Firebird 3 kennt sie nicht.

## Auf einen Blick

- Datenbankanwendung = Programm, das seine Daten über ein DBMS verwaltet. Drei Schichten: Präsentation (anzeigen, eingeben), Logik (Regeln, SQL), Datenhaltung (DBMS).
- Zwei Schichten (Client-Server): Client mit Logik verbindet sich selbst mit der DB. Drei Schichten: Browser → Anwendungsserver → DB, nur der Anwendungsserver kennt die Zugangsdaten.
- Schichtenarchitektur (Software) ist nicht ANSI-SPARC (Schemaebenen).
- ODBC (sprachunabhängig), JDBC (Java), Python DB-API: einheitliche API, Treiber je DBMS. Ablauf: verbinden → Anweisung → ausführen → Ergebnis per Cursor/ResultSet zeilenweise lesen → commit/rollback, schließen.
- SQL-Injection (SQL-Einschleusung) entsteht, weil Eingaben ungeprüft und unmaskiert per Verkettung in den SQL-Text gelangen. Muster: `' OR '1'='1`, Zahlenparameter ohne Apostroph (`0 OR 1=1`), `--`, `UNION SELECT` (auch auf den Systemkatalog, fehlende Spalten mit `NULL`), angehängte Anweisung, blinde Injection. Der Schaden hängt an den Rechten des App-Kontos.
- Schutz Nr. 1: Prepared Statement mit Platzhaltern, ohne Anführungszeichen, LIKE-Muster als Ganzes binden. Der Platzhalterstil hängt vom Treiber ab (`paramstyle`; auch `%s` kann ein echter Platzhalter sein); sicher ist nur, was als eigenes Argument an `execute` geht. Platzhalter nur für Werte; Bezeichner und Sortierrichtung per Whitelisting, Zahlen zusätzlich per Typprüfung.
- Minimale Rechte begrenzen den Schaden, am engsten mit „nur `EXECUTE` auf Prozeduren, Tabellenrechte an die Prozedur“. Escaping und Stored Procedures als Injection-Schutz werden in den Quellen unterschiedlich bewertet.
- `GRANT recht ON objekt TO empfänger [WITH GRANT OPTION]`, `REVOKE [GRANT OPTION FOR] … FROM …`. Rechte addieren sich aus direkt, Rolle und `PUBLIC`; wer ein Recht von zwei Seiten hat, verliert es erst, wenn beide entziehen. Sichten mit WHERE beschränken Spalten und Zeilen.
- Firebird 3: Spaltenrechte nur für UPDATE/REFERENCES, Rollen nur an Benutzer, genau eine aktive Rolle je Sitzung (beim Verbinden oder per `SET ROLE`). PostgreSQL: mehr Spaltenrechte, Rollenhierarchien mit Vererbung, `RESTRICT`/`CASCADE` beim Entziehen weitergegebener Rechte.
