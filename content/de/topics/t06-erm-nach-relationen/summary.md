---
id: t06
lang: de
title: ERM → Relationen
order: 6
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: oer-informatik-relationenmodell
    ref: "Abschnitte „Vom konzeptuellen ins logische Modell“, „Transformationsschritte“ (Primärschlüssel wählen; Kardinalitäten in Fremdschlüsselbeziehungen transformieren: 1:N, M:N, 1:1), „Transformation von schwachen Entitätstypen mit identifizierender Assoziation“, „Optionalitäten transformieren“, „Mehrere Beziehungen zwischen denselben Relationen“, „Beziehungen mit drei Beteiligten“ (Primärschlüssel je nach Anforderung, wiederholte Kombination mit Datum im Schlüssel), „Referentielle Integrität“ (ON DELETE/ON UPDATE CASCADE), „Was das Relationenmodell nicht ausdrücken kann“; im Abschnitt 1:1 Zusammenlegen als erste und einfachste Möglichkeit; im Abschnitt M:N Auflösung in zwei 1:N-Beziehungen"
  - id: wp-entity-relationship-modell
    ref: "Abschnitte „Überführung in ein relationales Modell“ (starke/schwache Entitätstypen, 1:1 mit Fremdschlüssel auf einer der beiden Seiten, 1:N, N:M, mehrwertige Attribute, n-äre Beziehungen mit n−1 Fremdschlüsseln im Schlüssel) und „Spezialisierung und Generalisierung mittels is-a-Beziehung“ (Subtypen als eigene oder gemeinsame Tabellen)"
  - id: inf-schule-datenbanksysteme
    ref: "Entwurf von Datenbanken – Unterseite „Relationales Datenmodell“ (https://inf-schule.de/datenbanksysteme/ermodelle/datenmodell)"
  - id: wikibooks-en-relational-database-design
    ref: "Kapitel „Relationships“, Abschnitt „Entity-Relationship diagrams“ (1:n über Fremdschlüssel auf der n-Seite, m:n als eigene Tabelle)"
  - id: wpen-entity-relationship-model
    ref: "Sections „Introduction“ (relationship implemented as foreign key), „Components – Role naming“"
  - id: wp-schluessel-datenbank
    ref: "Abschnitte „Primärschlüssel und Alternativschlüssel“ (zusammengesetzter Primärschlüssel), „Fremdschlüssel“, „Fremdschlüssel und Beziehungstypen“ (Verknüpfungsrelation bei m:n)"
  - id: wp-referentielle-integritaet
    ref: "Abschnitte zu Löschweitergabe/Änderungsweitergabe, Master- und Detailtabelle sowie zu rekursiven Beziehungen (Master- und Detailtabelle identisch)"
  - id: wikibooks-einfuehrung-in-sql
    ref: "Kapitel „Fremdschlüssel-Beziehungen“ (Einfüge- und Löschreihenfolge, Ringbeziehungen): https://de.wikibooks.org/wiki/Einführung_in_SQL:_Fremdschlüssel-Beziehungen"
  - id: firebird-30-language-reference
    ref: "Kap. 2.3 Identifiers (max. 31 Bytes); Kap. 5.4.1 CREATE TABLE (Spalten- und Tabellen-Constraints, FOREIGN KEY mit ON DELETE/ON UPDATE: NO ACTION, CASCADE, SET DEFAULT, SET NULL; UNIQUE und NULL); Kap. 5.4.2 ALTER TABLE (ADD/DROP CONSTRAINT); Kap. 3 BOOLEAN"
  - id: postgresql-17-docs-sql
    ref: "5.5 Constraints (CHECK, NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY): https://www.postgresql.org/docs/17/ddl-constraints.html"
  - id: postgresql-17-docs-sql-commands
    ref: "CREATE TABLE (DEFERRABLE, RESTRICT), DROP TABLE (CASCADE/RESTRICT, Abschnitt Compatibility: SQL-Standard): https://www.postgresql.org/docs/17/sql-createtable.html ; https://www.postgresql.org/docs/17/sql-droptable.html"
  - id: wp-relationale-datenbank
    ref: "Abschnitte „Beziehungen zwischen Tabellen“, „Datenbankschema und Modellierung“, „Gegenüberstellung von Grundbegriffen“"
  - id: wp-objektrelationale-abbildung
    ref: "Abschnitt „Abbildung von Vererbungshierarchien“ (Tabelle pro Vererbungshierarchie/Single Table mit Diskriminator, Tabelle pro Unterklasse/Joined bzw. Class Table, Tabelle pro konkrete Klasse/Concrete Table; je Nachteile wie fehlendes NOT NULL bzw. keine gemeinsame Abfrage über Klassen)"
  - id: wpen-single-table-inheritance
    ref: "Artikel insgesamt: eine Tabelle für die ganze Hierarchie, Typ-Spalte als Diskriminator, NULL in nicht zutreffenden Spalten; Bezeichnungen Table-Per-Class-Hierarchy und Table-Per-Hierarchy (TPH)"
---

# ERM → Relationen

## Lernziele

Nach diesem Thema kannst du …

- ein ER-Modell in Chen- oder (min,max)-Notation regelgerecht in ein **Relationenschema** überführen und es in Kurzschreibweise notieren,
- für jede Beziehungsart (1:1, 1:n, m:n, ternär, rekursiv, identifizierend) begründen, wo der Fremdschlüssel hinkommt, welcher Primärschlüssel entsteht und wann eine eigene Relation die bessere Wahl ist,
- aus den Unter- und Obergrenzen ableiten, wann eine Spalte `NOT NULL`, `UNIQUE` oder `CHECK` braucht und was sich deklarativ nicht erzwingen lässt,
- die drei Abbildungsvarianten der Generalisierung mit ihren Fachbegriffen benennen (vertikale, horizontale, „virtuelle“ Fragmentierung bzw. Class, Concrete, Single Table Inheritance), skizzieren, vergleichen und passend zu total/partiell und disjunkt/überlappend auswählen,
- vollständige `CREATE TABLE`-Anweisungen in Firebird-3-Syntax in einer gültigen Anlage-Reihenfolge schreiben, auch bei zyklischen Fremdschlüsseln.

## Vom ER-Modell zum Relationenschema

Das ER-Modell aus Thema t04 beschreibt die Miniwelt **konzeptuell**. Beim *logischen Entwurf* wird es in ein **Relationenschema** (*relational schema*) übersetzt: eine Menge von Tabellen mit Spalten, Primärschlüsseln und Fremdschlüsseln. Diese Übersetzung folgt festen Regeln und lässt sich weitgehend mechanisch durchführen. Die Bausteine des ER-Modells (Entitätstyp, Schlüssel, schwacher Entitätstyp, Rolle, Spezialisierung) werden hier nicht neu erklärt, siehe t04.

Der zentrale neue Baustein ist der **Fremdschlüssel** (*Foreign Key*): eine Spalte (oder Spaltengruppe), deren Werte auf den Primärschlüssel (*Primary Key*) bzw. einen `UNIQUE`-Schlüssel einer anderen oder derselben Tabelle verweisen. Die referenzierte Tabelle heißt auch **Eltern-** oder **Mastertabelle** (*parent*), die verweisende **Kind-** oder **Detailtabelle** (*child*). Im ER-Modell gibt es keine Fremdschlüssel. **Jede Beziehung wird entweder zu einem Fremdschlüssel oder zu einer eigenen Tabelle.**

**Ziele der Abbildung.** Eine gute Abbildung

- erhält die Information des ER-Modells: alle Fakten und möglichst viele Kardinalitäten als Constraints,
- speichert jeden Fakt nur einmal (minimale Redundanz),
- kommt mit möglichst wenigen Tabellen aus, denn jede zusätzliche Tabelle kostet bei Abfragen einen Join,
- bleibt nachvollziehbar: Jede Tabelle und jeder Fremdschlüssel lässt sich einem Element des ER-Modells zuordnen.

Diese Ziele ziehen teils in verschiedene Richtungen. Weniger Tabellen bedeuten oft mehr NULL-Werte. Deshalb gibt es bei 1:1, bei attributtragenden Beziehungen und bei der Generalisierung mehrere vertretbare Lösungen, und man muss die gewählte begründen.

**Kurzschreibweise in diesem Kurs:** `tabelle(PK, Attribut, FK → Zieltabelle)`. Primärschlüsselspalten sind unterstrichen, Fremdschlüssel tragen einen Pfeil auf die Zieltabelle, z. B. kurs(<u>kurs_nr</u>, titel, ausbilder_nr → ausbilder).
*Notationsvarianten:* Andere Quellen schreiben Zusätze wie `(PK)`, `(FK)` oder `(PK, FK)` hinter die Spalte. Wieder andere markieren Fremdschlüssel grafisch, etwa gestrichelt unterstrichen, kursiv oder mit einem vorangestellten Zeichen wie `#` oder `↑`. Inhaltlich ist das gleich. Gib in Prüfungen und Abgaben an, welche Schreibweise du benutzt.

Als durchgehendes Beispiel dient eine **Segelschule**: Ausbilder:innen leiten Kurse, Teilnehmer:innen buchen Kurse und werden je Kurs einem Boot zugeteilt. Boote haben Liegeplätze und werden gewartet.

![Ausgangs-ERM Segelschule in Chen- und (min,max)-Notation: leitet (1:n), ist Mentor:in von (rekursiv), bucht (m:n), wird eingeteilt (ternär), liegt an (1:1)](diagrams/segelschule-grundmodell.dot)

## Entitätstypen und Attribute abbilden

**Regel (starker Entitätstyp):** Jeder Entitätstyp wird zu einer Tabelle. Jedes einfache Attribut wird zu einer Spalte, der Schlüssel des Entitätstyps wird zum Primärschlüssel. Weitere Schlüsselkandidaten bekommen `UNIQUE`. Ab hier legt man auch Datentypen und Pflichtangaben (`NOT NULL`) fest.

**Zusammengesetzte Attribute** (auch *strukturierte* oder *komplexe* Attribute) werden in ihre Teile **aufgelöst**: Aus „Adresse (Straße, PLZ, Ort)“ werden drei Spalten `strasse`, `plz`, `ort`. Das zusammengesetzte Attribut selbst verschwindet als Spalte.

**Mehrwertige Attribute** (auch *mengenwertige* Attribute oder *Mehrfachattribute*) passen nicht in eine Zelle, weil eine Zelle nur einen atomaren Wert aufnimmt. Sie werden zu einer **eigenen Tabelle** mit dem Fremdschlüssel des Besitzers und dem Wert. Der Primärschlüssel ist die Kombination beider: teilnehmer_telefon(<u>teilnehmer_nr → teilnehmer, telefon</u>). Eine Komma-Liste „0151 …, 0171 …“ in einer Spalte wäre falsch (siehe t07, 1. Normalform).

**Abgeleitete Attribute** (z. B. Alter aus Geburtsdatum) werden normalerweise **nicht** gespeichert, sondern bei Bedarf berechnet.

Ergebnis für die Teilnehmer:innen:

- teilnehmer(<u>teilnehmer_nr</u>, vorname, nachname, strasse, plz, ort, geburtsdatum)
- teilnehmer_telefon(<u>teilnehmer_nr → teilnehmer, telefon</u>)

## 1:n-Beziehungen

**Regel:** Der Primärschlüssel der **1-Seite** wird als Fremdschlüssel in die Tabelle der **n-Seite** aufgenommen. Attribute der Beziehung wandern im Standardfall mit auf die n-Seite. Hat die Beziehung einen Zeitbezug oder viele optionale Teilnehmer, ist eine eigene Relation besser (Abschnitt „Beziehung als eigene Relation“).

Beispiel „Ausbilder:in *leitet* Kurs“ (Chen: 1 bei Ausbilder:in, n bei Kurs): kurs(<u>kurs_nr</u>, titel, beginn, ende, ausbilder_nr → ausbilder).

Warum nicht umgekehrt? Ein Fremdschlüssel in `ausbilder` hätte pro Ausbilder:in nur **eine** Zelle. Mehrere Kurse würden mehrere Werte in einer Zelle oder wiederholte Zeilen erzwingen.

**Pflichtteilnahme → NOT NULL.** Die (min,max)-Angabe der n-Seite entscheidet über die Fremdschlüsselspalte:

| (min,max) beim Typ mit dem FK | Bedeutung | Fremdschlüsselspalte |
|---|---|---|
| (1,1) | jeder Kurs hat genau eine Leitung | `NOT NULL` |
| (0,1) | Leitung darf fehlen | NULL erlaubt |

**Umrechnung beachten:** In der Chen-Notation kommt der Fremdschlüssel auf die Seite mit **n**, in der (min,max)-Notation auf die Seite mit **max = 1**. Das ist dieselbe Seite, die Angaben sind nur vertauscht notiert (t04). Die **Untergrenze der 1-Seite** (z. B. „jede Ausbilder:in leitet mindestens einen Kurs“, (1,n)) lässt sich mit Fremdschlüssel, `NOT NULL` oder `UNIQUE` **nicht** erzwingen. Dafür bräuchte man Trigger (t12) oder Prüfungen in der Anwendung. Dasselbe gilt für feste Obergrenzen wie „höchstens 8 Teilnehmende“.

## 1:1-Beziehungen

Bei 1:1 gibt es mehrere korrekte Abbildungen. Die Quellen schreiben keine einzige Lösung vor. Sie nennen dieselben Optionen, aber in unterschiedlicher Reihenfolge:

1. **Zusammenlegen** zu einer Tabelle. Mehrere Darstellungen nennen das als erste und einfachste Lösung. Der Schlüssel der eingegliederten Seite bleibt als `UNIQUE`-Spalte erhalten. Ideal, wenn beide Seiten verpflichtend sind ((1,1) zu (1,1)) und die Daten meist gemeinsam gebraucht werden. Ist eine Seite optional, bleiben deren Spalten oft NULL.
2. **Zwei Tabellen, Fremdschlüssel auf einer Seite plus `UNIQUE`.** Ohne `UNIQUE` dürfte derselbe Wert mehrfach vorkommen, dann wäre es eine 1:n-Beziehung. Die Seite ist fachlich **frei wählbar**. Dieser Kurs empfiehlt die Seite, die **verpflichtend** teilnimmt ((1,1)): Dann wird die Spalte `NOT NULL`, es entstehen keine leeren Zellen, und die Untergrenze ist erzwungen. Liegt der FK auf der optionalen Seite, ist die Abbildung ebenfalls korrekt. Die Spalte bleibt dann aber NULL-fähig, und die (1,1) der Gegenseite lässt sich nicht erzwingen.
3. **Gemeinsamer Primärschlüssel:** Der PK der abhängigen Tabelle ist zugleich FK auf die andere (wie bei der vertikalen Generalisierungsvariante, siehe unten).
4. **Eigene Beziehungstabelle** mit zwei `UNIQUE`-Spalten. Das passt, wenn **beide Seiten optional** sind oder die Beziehung eigene Attribute mit Zeitbezug hat (siehe „Beziehung als eigene Relation“).

*Variante:* Welche Option als „Standard“ gilt, hängt von der Quelle ab. Manche beginnen mit dem Zusammenlegen, andere mit dem Fremdschlüssel plus `UNIQUE`, und viele lassen die FK-Richtung offen. Bewertet wird die Begründung: NULL-Werte, erzwingbare Untergrenzen, gemeinsamer Zugriff.

Beispiel „Boot *liegt an* Liegeplatz“: Jeder gemietete Liegeplatz gehört genau einem Boot (1,1). Jollen haben keinen Liegeplatz, also Boot (0,1). Der FK kommt in `liegeplatz`:
liegeplatz(<u>platz_nr</u>, steg, laenge_m, boot_nr → boot) mit `boot_nr NOT NULL UNIQUE`.

## m:n-Beziehungen

**Regel:** Eine m:n-Beziehung wird zu einer **Zwischentabelle** (*junction table*, auch Verknüpfungs- oder Beziehungstabelle). Sie enthält die Primärschlüssel beider Seiten als Fremdschlüssel. **Zusammen** bilden sie einen **zusammengesetzten Primärschlüssel** (*composite primary key*). Attribute der Beziehung werden Spalten der Zwischentabelle.

Beispiel „Teilnehmer:in *bucht* Kurs“ mit Buchungsdatum und „bezahlt“:
buchung(<u>teilnehmer_nr → teilnehmer, kurs_nr → kurs</u>, buchungsdatum, bezahlt)

Die Zwischentabelle **löst die m:n-Beziehung in zwei 1:n-Beziehungen auf**: teilnehmer 1:n buchung und kurs 1:n buchung. Jede Buchungszeile gehört zu genau einer Person und genau einem Kurs. Deshalb liegen beide Fremdschlüssel nach der 1:n-Regel in `buchung`.

Der zusammengesetzte PK verhindert, dass dieselbe Person denselben Kurs zweimal bucht. Darf ein Paar **mehrfach** vorkommen (z. B. mit Historie, t04), reicht er nicht. Dann gehört ein weiteres Attribut wie ein Datum in den Primärschlüssel, oder man führt einen künstlichen Schlüssel ein und setzt `UNIQUE` auf die passende Spaltenkombination.

## Beziehung als eigene Relation (auch bei 1:n und 1:1)

„FK auf die n-Seite“ und „FK mit `UNIQUE`“ sind die schlanken Standardlösungen. Jede binäre Beziehung lässt sich aber auch wie m:n als **eigene Relation** abbilden. Ihr Primärschlüssel zeigt dann die Kardinalität:

- **1:n:** PK = FK der n-Seite. leitung(<u>kurs_nr → kurs</u>, ausbilder_nr → ausbilder, honorar): Jeder Kurs hat höchstens eine Leitung, eine Ausbilder:in kann viele Kurse leiten.
- **1:1:** PK = FK der einen Seite, der FK der anderen Seite bekommt `UNIQUE`.

Das lohnt sich in drei Fällen:

1. Die Beziehung ist **optional**, und ein FK auf der n-Seite bliebe in den meisten Zeilen NULL.
2. Die Beziehung hat **eigene Attribute**, die fachlich nicht zur n-Seite gehören.
3. Die Beziehung hat einen **Zeitbezug** (Gültigkeitszeitraum, Historie). Soll gespeichert werden, wer einen Kurs in welchem Zeitraum geleitet hat, wird aus 1:n über die Zeit eine m:n-Beziehung. Der Beginn gehört dann in den PK: leitung(<u>kurs_nr → kurs, von</u>, bis, ausbilder_nr → ausbilder). Ebenso bei 1:1: belegung(<u>platz_nr → liegeplatz, von</u>, bis, boot_nr → boot). Zu jedem Zeitpunkt gibt es ein Boot je Platz, über die Jahre viele. Dass sich Zeiträume nicht überschneiden, lässt sich deklarativ nicht prüfen (Trigger, t12).

Der Preis ist eine Tabelle und ein Join mehr.

**Relationen zusammenfassen.** Umgekehrt kann man Tabellen mit **gleichem Primärschlüssel** zu einer zusammenfassen. Das ist sinnvoll, wenn (1) der Schlüssel in beiden dieselbe Bedeutung hat, (2) zu fast jeder Zeile der einen Tabelle eine Zeile der anderen gehört, also kaum NULL-Werte entstehen, und (3) die Daten meist gemeinsam abgefragt werden. Ohne Zeitbezug und mit Pflicht auf der n-Seite geht leitung(<u>kurs_nr</u>, ausbilder_nr) deshalb in `kurs` auf. Daraus entsteht genau die Standardregel „FK auf die n-Seite“. Entstünden viele NULL-Spalten oder Wiederholungen, fasst man nicht zusammen.

## Ternäre Beziehungen

**Regel:** Eine n-äre Beziehung wird zu einer Tabelle mit **einem Fremdschlüssel je beteiligtem Entitätstyp** plus den Beziehungsattributen.

**Welcher Primärschlüssel?** Die Chen-Kardinalität einer ternären Beziehung beantwortet die Frage: „Wie viele X gehören zu einer festen Kombination der beiden anderen?“

- Stehen überall n/m, bilden **alle drei** Fremdschlüssel den PK.
- Steht bei einem Teilnehmer eine **1**, bestimmen die beiden anderen ihn eindeutig. Sein Fremdschlüssel gehört dann **nicht** in den PK, sondern wird nur `NOT NULL`. Fremdschlüssel von Teilnehmern mit n/m gehören immer zum PK.
- Stehen bei mehreren Teilnehmern Einsen, gibt es mehrere Schlüsselkandidaten. Einen davon wählt man als PK, den anderen sichert man mit `UNIQUE` ab.
- **Darf dieselbe Kombination mehrfach vorkommen**, reicht keine Auswahl der Fremdschlüssel. Dann gehört wie bei m:n ein Zeitattribut in den PK. Beispiel: Eine Ausbilder:in prüft eine Teilnehmer:in in einer Prüfungsart, und Wiederholungsprüfungen sind erlaubt: pruefung(<u>ausbilder_nr → ausbilder, teilnehmer_nr → teilnehmer, art_nr → pruefungsart, datum</u>, ergebnis). Ternäre Tabellen mit vier PK-Spalten widersprechen der Regel also nicht, sie erweitern sie.

Viele Beispiele zeigen nur den häufigsten Fall „überall n/m, alle drei FKs bilden den PK“. Die Regel für Einsen folgt aus derselben Frage: Welche Spalten müssen zusammen eindeutig sein?

Beispiel „Teilnehmer:in *wird* in einem Kurs einem Boot *zugeteilt*“ mit 1 bei Boot (je Kurs und Person genau ein Boot):
einteilung(<u>kurs_nr → kurs, teilnehmer_nr → teilnehmer</u>, boot_nr → boot)

*Tipp:* Wenn nur gebuchte Personen eingeteilt werden dürfen, kann `(kurs_nr, teilnehmer_nr)` statt auf zwei Tabellen auch als **zusammengesetzter Fremdschlüssel** auf `buchung` verweisen. Das ist strenger und spart einen FK.

## Rekursive Beziehungen

Bei einer rekursiven Beziehung verweist der Fremdschlüssel auf **dieselbe Tabelle**. Weil der Name des Primärschlüssels schon vergeben ist, braucht die FK-Spalte einen eigenen Namen. Man nimmt den **Rollennamen**.

- **Rekursiv 1:n** (Mentor:in 1, Schützling n). Zwei Abbildungen:
  - *FK in derselben Tabelle* (Standard), gefüllt bei der Rolle mit „n“ (Schützling): ausbilder(<u>ausbilder_nr</u>, vorname, nachname, lizenz, mentor_nr → ausbilder). `mentor_nr` muss NULL erlauben, sonst bräuchte schon die erste Ausbilder:in eine Mentor:in.
  - *Eigene Beziehungsrelation*: mentoring(<u>schuetzling_nr → ausbilder</u>, mentor_nr → ausbilder, seit) mit `mentor_nr NOT NULL`. Der PK liegt auf der Rolle mit „n“, also hat jede Person höchstens eine Mentor:in. Vorteile: keine NULL-Werte bei Personen ohne Mentor:in, Platz für Beziehungsattribute wie „seit“ und für Historie. Nachteil: eine Tabelle und ein Join mehr.
- **Rekursiv 1:1** (jede Ausbilder:in hat höchstens eine feste Vertretung und vertritt höchstens eine Person). Zwei Abbildungen:
  - *FK in derselben Tabelle mit `UNIQUE`*: ausbilder(…, vertretung_nr → ausbilder), `vertretung_nr` NULL-fähig und `UNIQUE`.
  - *Eigene Relation*: vertretung(<u>ausbilder_nr → ausbilder</u>, vertreter_nr → ausbilder) mit `vertreter_nr NOT NULL UNIQUE`. Das spart NULL-Werte, kostet aber einen Join.
  - Ist die Beziehung **symmetrisch** (Tandempartner:in: Ist A Partner:in von B, gilt das auch umgekehrt), muss man sich entscheiden. Speichert man beide Richtungen (A→B und B→A), ist das redundant, und dass beide Einträge zusammenpassen, prüft kein Constraint. Speichert man nur eine Richtung, gibt es keine Redundanz. Dann muss aber jede Abfrage beide Spalten prüfen (`… WHERE ausbilder_nr = 7 OR partner_nr = 7`), und dass eine Person nicht in zwei Paaren steckt, sichert `UNIQUE` je Spalte nicht mehr ab.
- **Rekursiv m:n** (ein Kurs *setzt* mehrere Kurse *voraus* und ist Voraussetzung für mehrere): Zwischentabelle mit zwei Fremdschlüsseln auf dieselbe Tabelle, benannt nach den Rollen:
  kurs_voraussetzung(<u>kurs_nr → kurs, voraussetzung_nr → kurs</u>), sinnvoll mit `CHECK (kurs_nr <> voraussetzung_nr)`.

## Schwache Entitätstypen

![Spezialisierung Boot (disjunkt, total) und schwacher Entitätstyp Wartung](diagrams/segelschule-boot-wartung.dot)

**Regel:** Der schwache Entitätstyp wird zu einer Tabelle, die den Primärschlüssel des Besitzers als Fremdschlüssel enthält. Ihr **Primärschlüssel = Fremdschlüssel des Besitzers + partieller Schlüssel**. Die identifizierende Beziehung braucht keine eigene Tabelle.

wartung(<u>boot_nr → boot, lfd_nr</u>, datum, beschreibung, kosten)

Eine Wartung hat ohne ihr Boot keinen Sinn. Für den Besitzer-Fremdschlüssel legt man deshalb drei Eigenschaften fest:

1. **Pflichtwert:** `NOT NULL`. Das gilt ohnehin, weil die Spalte zum PK gehört.
2. **Löschweitergabe:** `ON DELETE CASCADE`. Wird ein Boot gelöscht, löscht das DBMS dessen Wartungseinträge mit.
3. **Änderungsweitergabe:** `ON UPDATE CASCADE`. Ändert sich eine `boot_nr`, zieht das DBMS die Wartungszeilen nach, statt die Änderung abzulehnen.

Dieselben drei Eigenschaften gelten für den PK-Fremdschlüssel der Subtyp-Tabellen in der vertikalen Generalisierungsvariante (siehe unten). Eine solche **referenzielle Aktion** (*referential action*) passt für abhängige Daten ohne eigenen Wert, z. B. auch für `teilnehmer_telefon`. Bei Geschäftsdaten wäre sie gefährlich: Ein `CASCADE` von `teilnehmer` auf `buchung` würde beim Löschen einer Person still deren Buchungshistorie vernichten. Firebird 3 kennt bei `ON DELETE`/`ON UPDATE` die Aktionen `NO ACTION` (Voreinstellung: Die Operation wird abgelehnt, solange Verweise bestehen), `CASCADE`, `SET NULL` und `SET DEFAULT`.

Verweist eine andere Tabelle auf eine schwache Entität, braucht sie einen **zusammengesetzten Fremdschlüssel** aus beiden PK-Spalten, z. B. `(boot_nr, lfd_nr) → wartung`.

## Generalisierung: drei Abbildungsvarianten

Das relationale Modell kennt keine Vererbung. Eine is-a-Hierarchie wird deshalb auf eine von drei Arten nachgebildet. Beispiel: Boot (boot_nr, bootsname, baujahr) mit den Subtypen Jolle (schwertart) und Kielboot (tiefgang_m, kojen), **disjunkt und total**.

**Namen der Varianten.** Für die drei Varianten sind zwei Begriffsfamilien verbreitet. Die **Fragmentierungsbegriffe** beschreiben, wie die gedachte Gesamttabelle aller Boote zerschnitten wird. Die **Musternamen** stammen aus der objektrelationalen Abbildung (*object-relational mapping*, ORM), also aus Werkzeugen, die Klassen auf Tabellen abbilden. Quellen nummerieren die Varianten unterschiedlich. Manche zählen nach der Tabellenanzahl, dann ist ihre „Variante 1“ die Gesamttabelle. Deshalb die Variante immer **benennen**, nicht nur nummerieren.

| In diesem Kurs | Fragmentierung | ORM-Muster | weitere Namen |
|---|---|---|---|
| Variante 1: Super- und Subtyp-Tabellen | **vertikale Fragmentierung**: Die Attribute werden spaltenweise auf Tabellen verteilt. | **Class Table Inheritance** | *Table per Type* (TPT), *Joined*, „Tabelle pro Unterklasse“ |
| Variante 2: nur Subtyp-Tabellen | **horizontale Fragmentierung**: Die Entitäten werden zeilenweise auf Tabellen verteilt. | **Concrete Table Inheritance** | *Table per Concrete Class* (TPC), „Tabelle pro konkrete Klasse“ |
| Variante 3: Gesamttabelle | **„virtuelle“ Fragmentierung** bzw. Gesamttabelle: Nichts wird zerschnitten, die Subtypen gibt es nur über das Typ-Attribut. | **Single Table Inheritance** | *Table per Hierarchy* (TPH), „Tabelle pro Vererbungshierarchie“ |

*Variante bei den Begriffen:* Die meisten Quellen ordnen „vertikal“ der Variante 1 und „horizontal“ der Variante 2 zu. Einzelne ORM-Dokumentationen vertauschen die beiden Wörter. Außerdem meint „Table per Class“ je nach Werkzeug Variante 1 oder Variante 2. In JPA/Hibernate etwa steht `TABLE_PER_CLASS` für Variante 2. Im Zweifel die Variante zusätzlich kurz beschreiben. Manche Kurzüberblicke fassen die drei Fragmentierungen in knappe Formeln, die nicht zu den ausführlichen Definitionen passen. Maßgeblich ist immer die ausführliche Beschreibung: welche Tabellen entstehen und welche Attribute sie enthalten, so wie in der Tabelle oben.

**Variante 1 – vertikale Fragmentierung (Class Table Inheritance): eine Tabelle je Super- und Subtyp.** Die Subtyp-Tabelle enthält nur ihre zusätzlichen Attribute. Ihr **PK ist zugleich FK** auf den Supertyp, mit `ON DELETE CASCADE` und `ON UPDATE CASCADE` wie bei schwachen Entitätstypen.

- boot(<u>boot_nr</u>, bootsname, baujahr)
- jolle(<u>boot_nr → boot</u>, schwertart)
- kielboot(<u>boot_nr → boot</u>, tiefgang_m, kojen)

Vorteile: keine Redundanz, keine NULL-Spalten für fremde Subtypen. Andere Tabellen können auf `boot` **oder** gezielt auf einen Subtyp verweisen (z. B. könnte `liegeplatz.boot_nr` auf `kielboot` zeigen). Funktioniert für alle vier Kombinationen. Neue Supertyp-Attribute ändern nur eine Tabelle. Nachteile: Für vollständige Daten braucht man Joins (zwei Tabellenzugriffe). Ob ein Boot wirklich in genau einer (disjunkt) bzw. mindestens einer (total) Subtyp-Tabelle steht, lässt sich deklarativ nicht prüfen (Trigger oder Anwendung).

**Variante 2 – horizontale Fragmentierung (Concrete Table Inheritance): nur Subtyp-Tabellen mit geerbten Attributen.** Jeder Subtyp bekommt alle Attribute des Supertyps dazu, eine Supertyp-Tabelle gibt es nicht.

- jolle(<u>boot_nr</u>, bootsname, baujahr, schwertart)
- kielboot(<u>boot_nr</u>, bootsname, baujahr, tiefgang_m, kojen)

Vorteile: Zugriff auf einen Subtyp ohne Join, keine NULL-Spalten. Nachteile: Ein Boot ohne Subtyp hat keinen Platz, deshalb ist die Variante **ungeeignet für partiell**. Bei Überlappung stehen die gemeinsamen Attribute doppelt (Redundanz). Die Eindeutigkeit von `boot_nr` über beide Tabellen ist nicht deklarativ gesichert. Ein Fremdschlüssel „auf alle Boote“ (z. B. aus `einteilung`) ist unmöglich, weil er nur **eine** Zieltabelle haben kann. Abfragen über alle Boote brauchen eine Vereinigung (t08/t10). Dass `jolle` und `kielboot` zusammen „die Boote“ bilden, weiß nur die Anwendung, das DBMS kennt keinen Zusammenhang. Wird ein Supertyp-Attribut geändert oder ergänzt (z. B. `heimathafen`), muss man **jede** Subtyp-Tabelle ändern.
*Erweiterung:* Legt man zusätzlich eine Supertyp-Tabelle nur für Boote **ohne** Subtyp an, speichert man jede Entität vollständig in genau einer Tabelle. Dann geht auch partiell, die übrigen Nachteile bleiben.

**Variante 3 – „virtuelle“ Fragmentierung (Single Table Inheritance): eine Gesamttabelle mit Typ-Attribut.** Alle Attribute aller Subtypen landen in einer Tabelle, ein **Typ-Attribut** (*discriminator*) sagt, welcher Subtyp gilt. Nicht zutreffende Spalten bleiben NULL.

- boot(<u>boot_nr</u>, bootsname, baujahr, bootsart, schwertart, tiefgang_m, kojen)

Vorteile: einfache Abfragen ohne Joins, Fremdschlüssel auf alle Boote möglich. Disjunkt und total lassen sich mit `bootsart NOT NULL` und einem `CHECK` erzwingen, ebenso subtypabhängige Pflichtfelder. Nachteile: viele NULL-Spalten. Pflichtangaben eines Subtyps gehen nur per `CHECK`, nicht per `NOT NULL`. Beziehungen, die nur für einen Subtyp gelten, lassen sich per FK nicht auf diesen Subtyp einschränken. Für **überlappend** reicht ein einzelnes Typ-Attribut nicht. Man nimmt dann je Subtyp ein Kennzeichen (z. B. `ist_jolle BOOLEAN`).

Vergleich bei k Subtypen:

| | Variante 1: vertikal (Class Table) | Variante 2: horizontal (Concrete Table) | Variante 3: Gesamttabelle (Single Table) |
|---|---|---|---|
| Anzahl Tabellen | k + 1 | k | 1 |
| Zugriffe für eine vollständige Entität | 2 Tabellen (Join) | 1 Tabelle, wenn der Subtyp bekannt ist, sonst bis zu k | 1 Tabelle |
| Zugriffe für alle Entitäten des Supertyps | 1 Tabelle (nur Supertyp-Attribute) | k Tabellen (Vereinigung) | 1 Tabelle |
| Wer verwaltet die Zusammengehörigkeit von Super- und Subtyp? | DBMS über PK = FK | nur die Anwendung | DBMS über Typ-Attribut und `CHECK` |
| Speicher | keine Subtyp-NULLs, Schlüssel je Subtyp doppelt | am kompaktesten, bei Überlappung redundant | viele NULL-Spalten |
| Supertyp-Attribut ändern/ergänzen | 1 Tabelle | **jede** Subtyp-Tabelle | 1 Tabelle |
| partiell | geeignet | **ungeeignet** (außer mit Rest-Tabelle) | geeignet (Typ „keiner“ bzw. alle Kennzeichen FALSE) |
| total | erlaubt, aber nicht deklarativ erzwingbar | ergibt sich von selbst | per `NOT NULL`/`CHECK` auf dem Typ |
| disjunkt | erlaubt, aber nicht deklarativ erzwingbar | Nummern-Eindeutigkeit über Tabellen nicht gesichert | per einzelnem Typ-Attribut |
| überlappend | geeignet | nur mit Redundanz | nur mit einem Kennzeichen je Subtyp |

Faustregel: Die vertikale Variante (Class Table) ist der flexible Standard. Die Gesamttabelle (Single Table) lohnt sich bei wenigen subtypspezifischen Attributen und vielen Abfragen über alle Entitäten. Die horizontale Variante (Concrete Table) eignet sich nur für **total und disjunkt**, und auch dann nur, wenn Abfragen fast immer einen einzelnen Subtyp betreffen und sich der Supertyp selten ändert.

## CREATE TABLE in Firebird 3

Aus dem Relationenschema werden `CREATE TABLE`-Anweisungen. Grundgerüst laut Firebird-Referenz (verkürzt):

```sql
CREATE TABLE tabelle (
  spalte datentyp [DEFAULT wert] [NOT NULL] [<spalten-constraint>],
  ...
  [CONSTRAINT name] PRIMARY KEY (spalten),
  [CONSTRAINT name] UNIQUE (spalten),
  [CONSTRAINT name] FOREIGN KEY (spalten) REFERENCES ziel [(spalten)]
      [ON DELETE {NO ACTION | CASCADE | SET DEFAULT | SET NULL}]
      [ON UPDATE {NO ACTION | CASCADE | SET DEFAULT | SET NULL}],
  [CONSTRAINT name] CHECK (bedingung)
);
```

Constraints sollte man **benennen**, damit man sie später per `ALTER TABLE … DROP CONSTRAINT` gezielt entfernen kann. Dieser Kurs nutzt Präfixe (`pk_…`, `fk_…`, `uq_…`, `ck_…`). *Variante:* Verbreitet sind auch Großschreibung (`PK_KURS`), Suffixe (`kurs_pk`, `buchung_kurs_fk`) oder andere Kürzel. Wichtig ist nur, dass die Namen eindeutig und sprechend sind. Bezeichner dürfen in Firebird 3 höchstens 31 Bytes lang sein. In Firebird steht `DEFAULT` vor `NOT NULL`. Primärschlüsselspalten deklariert man hier ausdrücklich `NOT NULL`. Ein Fremdschlüssel kann nur auf einen Primärschlüssel oder einen `UNIQUE`-Schlüssel zeigen, und die Datentypen müssen passen.

Künstliche Schlüssel kann Firebird 3 über eine **Identity-Spalte** selbst vergeben, z. B. `kurs_nr INTEGER GENERATED BY DEFAULT AS IDENTITY` (Details in t09). Die Beispiele hier vergeben die Nummern von Hand, damit die Abbildung im Vordergrund steht.

Ausschnitt der Segelschule (vertikale Variante für Boot, `boot` und `teilnehmer` sind schon angelegt):

```sql
CREATE TABLE ausbilder (
  ausbilder_nr INTEGER     NOT NULL,
  vorname      VARCHAR(40) NOT NULL,
  nachname     VARCHAR(40) NOT NULL,
  lizenz       VARCHAR(20),
  mentor_nr    INTEGER,
  CONSTRAINT pk_ausbilder PRIMARY KEY (ausbilder_nr),
  CONSTRAINT fk_ausbilder_mentor FOREIGN KEY (mentor_nr)
    REFERENCES ausbilder (ausbilder_nr)
);

CREATE TABLE kurs (
  kurs_nr      INTEGER     NOT NULL,
  titel        VARCHAR(60) NOT NULL,
  beginn       DATE        NOT NULL,
  ende         DATE        NOT NULL,
  ausbilder_nr INTEGER     NOT NULL,          -- (1,1): Pflicht
  CONSTRAINT pk_kurs PRIMARY KEY (kurs_nr),
  CONSTRAINT fk_kurs_ausbilder FOREIGN KEY (ausbilder_nr)
    REFERENCES ausbilder (ausbilder_nr),
  CONSTRAINT ck_kurs_zeitraum CHECK (ende >= beginn)
);

CREATE TABLE liegeplatz (
  platz_nr INTEGER      NOT NULL,
  steg     CHAR(1)      NOT NULL,
  laenge_m NUMERIC(4,1),
  boot_nr  INTEGER      NOT NULL,             -- 1:1, Pflichtseite
  CONSTRAINT pk_liegeplatz PRIMARY KEY (platz_nr),
  CONSTRAINT uq_liegeplatz_boot UNIQUE (boot_nr),
  CONSTRAINT fk_liegeplatz_boot FOREIGN KEY (boot_nr)
    REFERENCES boot (boot_nr)
);

CREATE TABLE buchung (
  teilnehmer_nr INTEGER NOT NULL,
  kurs_nr       INTEGER NOT NULL,
  buchungsdatum DATE    NOT NULL,
  bezahlt       BOOLEAN DEFAULT FALSE NOT NULL,
  CONSTRAINT pk_buchung PRIMARY KEY (teilnehmer_nr, kurs_nr),
  CONSTRAINT fk_buchung_teilnehmer FOREIGN KEY (teilnehmer_nr)
    REFERENCES teilnehmer (teilnehmer_nr),
  CONSTRAINT fk_buchung_kurs FOREIGN KEY (kurs_nr)
    REFERENCES kurs (kurs_nr)
);

CREATE TABLE einteilung (
  kurs_nr       INTEGER NOT NULL,
  teilnehmer_nr INTEGER NOT NULL,
  boot_nr       INTEGER NOT NULL,
  CONSTRAINT pk_einteilung PRIMARY KEY (kurs_nr, teilnehmer_nr),
  CONSTRAINT fk_einteilung_kurs FOREIGN KEY (kurs_nr)
    REFERENCES kurs (kurs_nr),
  CONSTRAINT fk_einteilung_teilnehmer FOREIGN KEY (teilnehmer_nr)
    REFERENCES teilnehmer (teilnehmer_nr),
  CONSTRAINT fk_einteilung_boot FOREIGN KEY (boot_nr)
    REFERENCES boot (boot_nr)
);

CREATE TABLE wartung (
  boot_nr      INTEGER  NOT NULL,
  lfd_nr       SMALLINT NOT NULL,
  datum        DATE     NOT NULL,
  beschreibung VARCHAR(200),
  kosten       NUMERIC(8,2),
  CONSTRAINT pk_wartung PRIMARY KEY (boot_nr, lfd_nr),
  CONSTRAINT fk_wartung_boot FOREIGN KEY (boot_nr)
    REFERENCES boot (boot_nr) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE jolle (
  boot_nr    INTEGER     NOT NULL,
  schwertart VARCHAR(20) NOT NULL,
  CONSTRAINT pk_jolle PRIMARY KEY (boot_nr),
  CONSTRAINT fk_jolle_boot FOREIGN KEY (boot_nr)
    REFERENCES boot (boot_nr) ON DELETE CASCADE ON UPDATE CASCADE
);
```

Bei der Gesamttabelle (Single Table) sichert ein `CHECK` die Disjunktheit und die Pflichtfelder je Subtyp. `bootsart` muss dabei `NOT NULL` sein. Ein `CHECK` gilt schon als erfüllt, wenn seine Bedingung UNKNOWN ergibt. Mit `bootsart = NULL` würde jede Zeile durchgelassen (dreiwertige Logik, t10).

```sql
  bootsart CHAR(1) NOT NULL,
  ...
  CONSTRAINT ck_boot_art CHECK (
       (bootsart = 'J' AND schwertart IS NOT NULL
                       AND tiefgang_m IS NULL AND kojen IS NULL)
    OR (bootsart = 'K' AND schwertart IS NULL
                       AND tiefgang_m IS NOT NULL))
```

**PostgreSQL- und Standard-Hinweis:** Diese Anweisungen laufen in PostgreSQL unverändert. PostgreSQL kennt zusätzlich die Aktion `RESTRICT`, verzögert prüfbare Constraints (`DEFERRABLE`) und `DROP TABLE name [RESTRICT | CASCADE]`. Diese Formen gehören zum SQL-Standard und stehen deshalb in vielen allgemeinen Syntaxübersichten. **Firebird 3 hat alle drei nicht.** Dort wird `DROP TABLE` abgelehnt, solange ein Fremdschlüssel auf die Tabelle zeigt. Das entspricht dem Verhalten von `RESTRICT`. Wer allgemeine SQL-Syntax angibt, darf `DROP TABLE … CASCADE` also schreiben. Für Firebird 3 ist es falsch.

## Reihenfolge beim Anlegen und Löschen

Ein Fremdschlüssel kann nur auf eine Tabelle zeigen, die **schon existiert**. Deshalb gilt:

1. **Anlegen:** zuerst Tabellen ohne Fremdschlüssel, dann Tabellen, deren Ziele alle schon existieren, usw. Das ist eine Abhängigkeitsreihenfolge, formal eine topologische Sortierung. Ein Verweis auf die eigene Tabelle (`mentor_nr`) stört nicht.
   Segelschule: `ausbilder`, `teilnehmer`, `boot` → `kurs`, `teilnehmer_telefon`, `liegeplatz`, `wartung`, `jolle`, `kielboot` → `buchung`, `kurs_voraussetzung`, `einteilung`.
   Verweist `einteilung` nach dem Tipp oben mit `(kurs_nr, teilnehmer_nr)` auf `buchung`, rückt sie eine Stufe nach hinten: … → `buchung`, `kurs_voraussetzung` → `einteilung`.
2. **Daten einfügen:** in derselben Reihenfolge (erst der Kurs, dann seine Buchungen).
3. **Löschen** (Zeilen und `DROP TABLE`): **umgekehrt**, also erst die verweisenden Tabellen. Ausnahme bei Zeilen: Wo `ON DELETE CASCADE` gesetzt ist, löscht das DBMS die abhängigen Zeilen selbst.

**Zyklen.** Verweisen zwei Tabellen gegenseitig aufeinander, gibt es keine gültige Reihenfolge. Beispiel-Erweiterung: Jedes Boot hat eine verantwortliche Bootswart:in (`boot.bootswart_nr → ausbilder`), und jede Ausbilder:in hat ein Stammboot (`ausbilder.stammboot_nr → boot`). Lösung: eine Tabelle zunächst **ohne** den kritischen Fremdschlüssel anlegen und ihn nachträglich per `ALTER TABLE` ergänzen.

```sql
CREATE TABLE ausbilder ( ... , stammboot_nr INTEGER, ... );   -- noch ohne FK auf boot
CREATE TABLE boot      ( ... , bootswart_nr INTEGER NOT NULL,
  CONSTRAINT fk_boot_bootswart FOREIGN KEY (bootswart_nr)
    REFERENCES ausbilder (ausbilder_nr) );
ALTER TABLE ausbilder ADD CONSTRAINT fk_ausbilder_stammboot
  FOREIGN KEY (stammboot_nr) REFERENCES boot (boot_nr);
```

Auch beim **Einfügen** muss der Kreis an einer Stelle offen sein. Weil Firebird jeden Fremdschlüssel sofort prüft, muss mindestens eine Spalte im Zyklus NULL erlauben: erst die Ausbilder:in mit `stammboot_nr = NULL`, dann das Boot, dann `UPDATE ausbilder SET stammboot_nr = …`. Beim Abbau löst man den Zyklus zuerst mit `ALTER TABLE ausbilder DROP CONSTRAINT fk_ausbilder_stammboot`, danach funktioniert `DROP TABLE` in umgekehrter Reihenfolge.

**Beziehung nachträglich ergänzen.** Kommt eine Beziehung erst später ins Modell, etwa die rekursive Vertretung, ergänzt man Spalte und Constraints per `ALTER TABLE`:

```sql
ALTER TABLE ausbilder ADD vertretung_nr INTEGER;
ALTER TABLE ausbilder ADD CONSTRAINT uq_ausbilder_vertretung UNIQUE (vertretung_nr);
ALTER TABLE ausbilder ADD CONSTRAINT fk_ausbilder_vertretung
  FOREIGN KEY (vertretung_nr) REFERENCES ausbilder (ausbilder_nr);
```

Eine neue Spalte in einer gefüllten Tabelle ist zunächst überall NULL. Ein `NOT NULL` lässt sich deshalb erst setzen, wenn alle Zeilen einen Wert haben.

## Auf einen Blick

- Entitätstyp → Tabelle, Schlüssel → PK. Zusammengesetztes Attribut → Teilspalten, mehrwertiges Attribut → eigene Tabelle (Besitzer-FK + Wert als PK), abgeleitetes Attribut → nicht speichern.
- **1:n:** FK auf die n-Seite (Chen „n“, (min,max) „max = 1“). `NOT NULL`, wenn min = 1 auf dieser Seite.
- **1:1:** Zusammenlegen, FK auf einer Seite **mit `UNIQUE`** (Seite frei wählbar, im Kurs bevorzugt die Pflichtseite, dann `NOT NULL`), gemeinsamer PK oder eigene Beziehungstabelle. Die Wahl begründen.
- **m:n:** Zwischentabelle = zwei 1:n-Beziehungen, PK = beide FKs, Beziehungsattribute dorthin. Wiederholbares Paar → Zeitattribut in den PK.
- **Eigene Relation auch bei 1:n/1:1:** bei optionaler Teilnahme, eigenen Attributen oder Zeitbezug. Zusammenfassen bei gleichem PK, Pflicht und gemeinsamem Zugriff.
- **Ternär:** Tabelle mit drei FKs. FKs der Teilnehmer mit Chen-1 gehören nicht in den PK. Wiederholbare Kombination → Zeitattribut in den PK.
- **Rekursiv:** FK auf dieselbe Tabelle (Spaltenname = Rolle) oder eigene Beziehungsrelation. 1:1 zusätzlich `UNIQUE`. Rekursiv m:n → Zwischentabelle mit zwei FKs auf dieselbe Tabelle.
- **Schwach:** PK = Besitzer-FK + partieller Schlüssel. Besitzer-FK: Pflicht, `ON DELETE CASCADE`, `ON UPDATE CASCADE`.
- **Generalisierung:** (1) vertikal / Class Table Inheritance: Super + Sub, Sub-PK = FK; (2) horizontal / Concrete Table Inheritance: nur Subtypen, nicht für partiell; (3) „virtuell“ / Single Table Inheritance: Gesamttabelle mit Typ-Attribut (`NOT NULL`) und NULL-Spalten.
- Nicht deklarativ erzwingbar: Mindestteilnahme der referenzierten Seite, feste Obergrenzen > 1, total/disjunkt in der vertikalen Variante.
- Anlegen: referenzierte Tabellen zuerst. Löschen: umgekehrt. Zyklen: `ALTER TABLE … ADD CONSTRAINT`, und eine FK-Spalte im Zyklus muss NULL erlauben.
