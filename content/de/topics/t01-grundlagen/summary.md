---
id: t01
lang: de
title: Grundlagen & Begriffe
order: 1
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: wp-daten
    ref: "Daten in der Informatik (Zeichen nach Syntax, Bedeutung erst im Kontext), Normdefinitionen (DIN 44300, ISO/IEC 2382-1: Daten als formalisierte Darstellung von Information), strukturierte Daten"
  - id: wp-information
    ref: "Verwandte Begriffe – Daten (Daten als potenzielle Information), syntaktische, semantische und pragmatische Ebene"
  - id: wp-wissen
    ref: "Organisationstheoretischer Ansatz (Wissenspyramide/DIKW; Wissen als Information mit Erfahrungskontext und Handlungsbezug)"
  - id: wp-persistenz-informatik
    ref: "Einleitung (dauerhafte Speicherung über Programmende und Neustart hinaus; Beispiele Datenbank und Datei)"
  - id: wp-datenbank
    ref: "Einleitung (Datenbank auch als Datenbanksystem bezeichnet), Komponenten eines Datenbanksystems (DBMS bzw. DBVS, Datenbank bzw. Datenbasis, Datenbankanwendung), Funktionen eines DBMS (Metadaten, Datensicherheit, Datenschutz, Datenintegrität, Mehrbenutzerfähigkeit), Sprachen (DDL, DML, DCL)"
  - id: watt-database-design-2e
    ref: "Kap. 1 Before the Advent of Database Systems; Kap. 2 Fundamental Concepts; Kap. 3 Characteristics and Benefits of a Database; Kap. 4/5 (Schema und Instanz); Kap. 14 Database Users"
  - id: oer-informatik-datenbanken
    ref: "DBMS (https://oer-informatik.de/dbms): Begriffsklärung Datenbank, Datenbanksystem, DBMS; Aufgaben eines DBMS nach Codd. DB-Konzepte (https://oer-informatik.de/datenbankkonzepte): Mehrbenutzerbetrieb, Katalog, Zugriffskontrolle"
  - id: wp-data-dictionary
    ref: "Einleitung (Metadatenkatalog), Inhalte (Tabellen, Felder, Schlüssel, Integritätsbedingungen, Trigger, Zugriffsrechte, Indizes), Nutzergruppen (Datendesigner, Anwendungsprogrammierer, Endbenutzer, DBA)"
  - id: wp-schema-informatik
    ref: "Einleitung (Schema als formale Strukturbeschreibung), Datenbankschema (Schema als Objektcontainer eines Benutzers; Schema im Data Dictionary), Drei-Ebenen-Architektur"
  - id: wp-relation-datenbank
    ref: "Relationen als Tabellen (Tabelleninhalt als Teilmenge der möglichen Tupel)"
  - id: wp-entity-relationship-modell
    ref: "Einleitung (relevanter Ausschnitt der realen Welt), Grundlegende Komponenten (Typ- vs. Instanzebene)"
  - id: wp-datenmodellierung
    ref: "Einleitung und Verfahren (Ausschnitt der realen Welt, Abgrenzung nach Zweck)"
  - id: wp-datenbankadministrator
    ref: "Aufgaben des DBA (Datenbankentwurf, Schemata, Rechte, Sicherung, Leistung, Installation); DBA als Rolle"
  - id: wp-datenunabhaengigkeit
    ref: "Definition, physische und logische Datenunabhängigkeit"
  - id: wp-transaktion-informatik
    ref: "Definition (ganz oder gar nicht, Commit/Abort), ACID (Isolation, Dauerhaftigkeit), Konflikte bei gleichzeitigem Zugriff"
  - id: wp-data-definition-language
    ref: "DDL (CREATE, ALTER, DROP)"
  - id: wp-data-manipulation-language
    ref: "DML (INSERT, UPDATE, DELETE, Abfragen)"
  - id: wp-data-control-language
    ref: "DCL (GRANT, REVOKE)"
  - id: wp-open-database-connectivity
    ref: "ODBC als Programmierschnittstelle zum DBMS"
  - id: wp-java-database-connectivity
    ref: "JDBC als Programmierschnittstelle zum DBMS"
  - id: wpen-codds-12-rules
    ref: "Lead (Regel 0 bis 12; Kriterien für relationale DBMS), History (Anlass; unterschiedliche Bewertungen der Erfüllung), Rules, References (Computerworld 1985)"
  - id: wp-edgar-f-codd
    ref: "Leben (zwölf Evaluierungsregeln für OLAP), Schriften (1970, 1990)"
  - id: wp-relationale-datenbank
    ref: "Einleitung (Vorschlag des relationalen Modells 1970)"
  - id: firebird-30-language-reference
    ref: "Appendix D System Tables (RDB$RELATIONS, RDB$RELATION_FIELDS)"
---

# Grundlagen & Begriffe

## Lernziele

Nach diesem Thema kannst du …

- begründen, warum Datenhaltung in einzelnen Dateien zu Redundanz, Inkonsistenz, verlorenen Änderungen und starren Programmen führt und was ein Datenbanksystem dagegen tut (einschließlich Datenunabhängigkeit),
- Datenbank bzw. Datenbasis, DBMS, Datenbanksystem, Datenbankanwendung und Data Dictionary auseinanderhalten,
- Daten, Information und Wissen sowie persistente und transiente Daten an eigenen Beispielen unterscheiden,
- Miniwelt, Schema und Ausprägung an einem eigenen Beispiel erklären,
- Codds Anforderungen an ein DBMS und seine zwölf Regeln für relationale Systeme nennen, erläutern und Situationen zuordnen,
- typische Benutzerrollen mit ihren Tätigkeiten beschreiben.

## Worum es geht

Durchgehendes Beispiel ist der **Kleingartenverein „Am Sonnenhang“** mit 60 Parzellen. Bisher arbeitet jedes Vorstandsmitglied mit eigenen Dateien:

- Die Vorsitzende führt eine Tabellenkalkulationsdatei mit Parzellen, Pächter:innen und Anschriften.
- Der Kassenwart hat eine eigene Datei für die Pachtzahlungen – mit Namen und Anschriften noch einmal.
- Der Wasserwart notiert die Zählerstände je Jahr in einer Textdatei.

Der Verein will auf ein Datenbanksystem umstellen. An diesem Umstieg lassen sich die Grundbegriffe des Kurses erklären.

## Vom Dateisystem zum Datenbanksystem

Solange jedes Vorstandsmitglied seine eigene Datei pflegt, scheint alles zu funktionieren. Die Schwächen zeigen sich erst im Alltag: Eine Adresse ist an einer Stelle aktuell und an einer anderen veraltet, zwei gleichzeitige Eingaben überschreiben sich, und ein Auswertungsskript liefert nach einer kleinen Umstellung falsche Zahlen. Die Tabelle stellt beide Arten der Datenhaltung gegenüber.

| Aspekt | Datenhaltung in Dateien je Anwendung | Datenbanksystem |
|---|---|---|
| Datenbestand | jede Anwendung hat eigene Dateien | ein integrierter, gemeinsamer Bestand |
| Redundanz | ungeplant, mit Gefahr der Inkonsistenz | weitgehend vermieden bzw. kontrolliert |
| Konsistenzregeln | in jedem Programm einzeln programmiert | einmal definiert, vom DBMS bei jeder Änderung geprüft |
| Struktur der Daten | steckt im Programmcode (Spaltenposition, Trennzeichen) | zentral im Data Dictionary (siehe unten) |
| Mehrbenutzerbetrieb | wer zuletzt speichert, überschreibt alle anderen | Transaktionen und Synchronisation |
| Zugriffsschutz | grob, je Datei | fein, je Tabelle, Spalte oder Sicht |
| Sicherung und Wiederherstellung | von Hand | Aufgabe des DBMS |
| Abfragen | je Auswertung ein eigenes Programm | deklarative Sprache (SQL) |

Zwei Punkte genauer, die Redundanz folgt im nächsten Abschnitt:

**Mehrbenutzerbetrieb** (*multi-user operation*). Öffnen Vorsitzende und Kassenwart gleichzeitig dieselbe Datei, ergänzen je einen Eintrag und speichern, überschreibt der zweite Speichervorgang den ersten. Diese **verlorene Änderung** (*lost update*) bemerkt niemand. Ein DBMS fasst Änderungen zu **Transaktionen** zusammen, die ganz oder gar nicht wirken, und synchronisiert gleichzeitige Zugriffe, etwa durch Sperren.

**Datenunabhängigkeit** (*data independence*). Das Auswertungsskript des Wasserwarts liest „die dritte Spalte“. Fügt er eine Spalte „Zählernummer“ davor ein, rechnet das Skript stillschweigend mit falschen Werten. Im Datenbanksystem steht die Struktur im Katalog; Anwendungen greifen über Namen und eine Datenbanksprache zu. So sind Programme und Datenspeicherung entkoppelt (Programm-Daten-Unabhängigkeit):

- **Physische Datenunabhängigkeit:** Ein neuer Index oder ein anderer Speicherort erfordert keine Programmänderung.
- **Logische Datenunabhängigkeit:** Einfache Änderungen der Tabellenstruktur, etwa eine zusätzliche Spalte, berühren Anwendungen nicht, die Spalten über ihren Namen ansprechen. Betroffen sind nur Anweisungen, die sich auf die Spaltenreihenfolge oder -anzahl verlassen, z. B. `SELECT *` oder ein `INSERT` ohne Spaltenliste. Solche Anwendungen lassen sich über eine Sicht abschirmen, die die alte Struktur weiter anbietet.

Die Einordnung in die Drei-Ebenen-Architektur mit externen Schemata folgt in t02.

## Redundanz und Konsistenz

Das Wort **Redundanz** (*redundancy*) kommt aus der Technik. Dort bezeichnet es zusätzliche Ressourcen, die man im Normalbetrieb nicht bräuchte und die einen Ausfall abfangen, etwa eine gespiegelte zweite Festplatte. Auf Daten übertragen heißt redundant: Eine Angabe ist mehrfach gespeichert oder lässt sich aus anderen Angaben ableiten, ist also eigentlich überflüssig. Im Verein stehen Name und Anschrift jeder Pächterin bei der Vorsitzenden und noch einmal beim Kassenwart.

**Konsistenz** (*consistency*) heißt, dass der Datenbestand widerspruchsfrei ist und alle Regeln erfüllt, die im abgebildeten Weltausschnitt gelten (Integritätsbedingungen, siehe t05). **Inkonsistenz** liegt vor, wenn sich gespeicherte Angaben widersprechen.

Redundanz ist die häufigste Ursache für Inkonsistenz: Pächterin Kaya zieht um, nur die Vorsitzende trägt die neue Anschrift ein, und die Pachtrechnung geht an die alte Adresse. Außerdem kostet jede Kopie Speicher und Pflegeaufwand. Welche Fehler beim Einfügen, Ändern und Löschen in redundanten Tabellen entstehen (Anomalien), behandelt t07.

Nicht jede Redundanz ist ein Fehler:

- **Unkontrollierte Redundanz** entsteht ungeplant, etwa weil zwei Personen dieselbe Liste führen. Niemand ist für den Abgleich zuständig. Sie ist zu vermeiden.
- **Kontrollierte Redundanz** wird mit bekanntem Zweck eingesetzt, und der Umgang mit den Kopien ist geregelt. Indexe und Replikate führt das System automatisch nach. Eine Datensicherung wird dagegen absichtlich *nicht* laufend angeglichen: Sie hält den Stand eines bestimmten Zeitpunkts fest, und genau das macht sie für die Wiederherstellung wertvoll. Auch eine begründete Denormalisierung gehört hierher (siehe t07).

## Datenbank, DBMS, Datenbanksystem

Ein Datenbanksystem besteht aus zwei Teilen: der Software, die verwaltet, und dem Bestand, der verwaltet wird.

- Die **Datenbank** (DB, *database*), auch **Datenbasis** genannt, ist der gespeicherte, zusammengehörige Datenbestand des Vereins. Zur Datenbasis gehören die Anwendungsdaten (Parzellen, Pächter:innen, Zahlungen, Zählerstände) und das Data Dictionary, das diese Daten beschreibt (siehe unten).
- Das **Datenbankmanagementsystem** (DBMS, *database management system*; deutsch auch Datenbankverwaltungssystem, DBVS) ist die Software, die den Bestand verwaltet, z. B. Firebird oder PostgreSQL. Seine Aufgaben lassen sich in drei Gruppen fassen:
  - **Definieren:** festlegen, welche Strukturen, Datentypen und Bedingungen gelten (Schema, per DDL),
  - **Konstruieren:** die Datenbank tatsächlich anlegen und mit ersten Daten füllen; wo und in welcher Form sie physisch liegen, entscheidet das DBMS,
  - **Manipulieren:** Daten abfragen, ändern, löschen und daraus Auswertungen erzeugen (per DML).

  Dabei kontrolliert es jeden lesenden und schreibenden Zugriff, auch den gleichzeitigen mehrerer Benutzer.
- Das **Datenbanksystem** (DBS, *database system*) ist das DBMS zusammen mit der von ihm verwalteten Datenbasis: DBS = DBMS + DB. Manche Darstellungen zählen die **Kommunikationsschnittstellen** (z. B. Netzwerkzugang, Programmierschnittstellen) als dritten Bestandteil hinzu.
- Eine **Datenbankanwendung** (*database application*) ist ein Programm, das das Datenbanksystem nutzt, z. B. die Web-Oberfläche der Pachtverwaltung. Sie gehört nicht zum Datenbanksystem.

Im Sprachgebrauch, auch in Fachtexten, wird „Datenbank“ oft gleichbedeutend mit „Datenbanksystem“ verwendet. Wer genau sein will, unterscheidet: Firebird ist ein DBMS, die Vereinsdaten sind die Datenbank, beides zusammen ist das Datenbanksystem. Diese Trennung hilft, weil sich Fragen wie „Wer prüft die Rechte?“ (das DBMS) oder „Was wird gesichert?“ (die Datenbank) nur so klar beantworten lassen.

![Aufbau eines Datenbanksystems mit Anwendungen, DBMS und Datenbasis aus Anwendungsdaten und Data Dictionary](diagrams/datenbanksystem-aufbau.dot)

## Daten, Information, Wissen

Eine Datenbank speichert *Daten*. Was das genau heißt, klären drei Begriffe, die eng zusammenhängen.

- **Daten** (*data*) sind Zeichen oder Zeichenketten, die nach festen Regeln aufgebaut sind (Syntax) und maschinell verarbeitet werden können. Sie sind die **dargestellte Form** einer Information. Ohne Kontext sind sie bedeutungsoffen: Die Zeile `17;2025;38` aus der Datei des Wasserwarts könnte ein Datum, eine Hausnummer mit Postleitzahl oder eine Bestellnummer sein. Die Normen (früher DIN 44300, heute ISO/IEC 2382) fassen Daten entsprechend als Darstellung von Information nach vereinbarten Regeln auf.
- **Information** (*information*) entsteht, wenn jemand Daten in einem Kontext **interpretiert** und ihnen so eine Bedeutung gibt (Semantik). Wer weiß, dass die Felder Parzelle, Jahr und Verbrauch in m³ bedeuten, liest: „Parzelle 17 hat 2025 38 m³ Wasser verbraucht.“ Die Beziehung gilt in beide Richtungen: Information wird als Daten dargestellt, um sie zu speichern oder zu übertragen; Daten werden durch Interpretation wieder zu Information. Dieselben Daten können in einem anderen Kontext eine andere Information tragen.
- **Wissen** (*knowledge*) ist Information, die mit weiteren Informationen und Erfahrung verknüpft ist und dadurch hilft, ein Problem zu lösen oder eine Entscheidung zu treffen (Pragmatik). Ob aus einer Information Wissen wird, hängt vom Vorwissen ab: Der Wasserwart weiß, dass Parzellen dieser Größe etwa 12–15 m³ im Jahr verbrauchen. 38 m³ deuten für ihn auf ein Leck, also prüft er die Leitung. Ein neues Vereinsmitglied ohne diesen Vergleich zieht aus derselben Information keinen Schluss.

Diese Stufen werden oft als Pyramide gezeichnet. Die Darstellungen unterscheiden sich:

- Das englische **DIKW-Modell** (*data, information, knowledge, wisdom*) setzt über das Wissen noch die Stufe Weisheit.
- Andere Darstellungen beginnen eine Stufe tiefer bei den **Zeichen** (Buchstaben, Ziffern) und enden beim Wissen: Zeichen → Daten → Information → Wissen. Zeichen werden durch Syntaxregeln zu Daten, Daten durch Bedeutung zu Information, Information durch Vernetzung zu Wissen.

Im Alltag setzt man Daten und Information häufig gleich. Für die Datenbank ist die Trennung wichtig: Damit aus den gespeicherten Daten zuverlässig Information wird, speichert sie die Beschreibung der Daten mit (Schema und Data Dictionary, siehe unten). Relationale Datenbanken speichern **strukturierte Daten**, die einem festen Datenmodell folgen, anders als Texte, Bilder und andere unstrukturierte Daten ohne formale Struktur.

## Persistente und transiente Daten

- **Persistente Daten** (*persistent data*) liegen auf einem dauerhaften Speicher, in einer Datenbank oder einer Datei. Sie überstehen das Ende des Programms, das sie erzeugt hat, und einen Neustart, und sie bleiben bestehen, bis jemand sie ausdrücklich löscht. Weil sie nicht an einen Programmlauf gebunden sind, können auch andere Programme und Prozesse auf sie zugreifen. Beispiel: der gespeicherte Pachtvertrag von Parzelle 17, den sowohl die Pachtverwaltung als auch das Abrechnungsskript lesen.
- **Transiente Daten** (*transient data*) existieren nur, solange ein Programm läuft, typischerweise im Arbeitsspeicher, und nur dieses Programm sieht sie. Beispiele: die Zwischensumme der Wassergebühren während der Jahresabrechnung oder eine eingetippte, aber noch nicht gespeicherte Zählerablesung.

Persistent heißt **nicht** unveränderlich: Die Pacht wird jedes Jahr angepasst und ist trotzdem persistent. Ein DBMS garantiert, dass bestätigte Änderungen dauerhaft erhalten bleiben (das „D“ für Dauerhaftigkeit in den ACID-Eigenschaften von Transaktionen, siehe t11).

## Miniwelt

Die **Miniwelt** (*mini-world*), auch **Diskursbereich** (*universe of discourse*, UoD) genannt, ist der Ausschnitt der realen Welt, der für einen bestimmten Zweck relevant ist und den die Datenbank abbilden soll, zusammen mit den Regeln, die dort gelten. Abgegrenzt wird sie über den Zweck:

- Für die Vereinsverwaltung gehören dazu: Parzellen mit Fläche, Pächter:innen, Pachtverträge, Zahlungen, Wasserzähler und Ablesungen.
- Nicht dazu gehören: welche Gemüsesorten in den Beeten wachsen oder wann eine Pächterin Geburtstag hat, solange der Verein das nicht für seinen Zweck braucht.
- Regeln der Miniwelt sind z. B.: Jede Parzelle hat höchstens einen Hauptpachtvertrag; ein Zählerstand ist nie kleiner als der vorige.

Solche Regeln werden später zu Kardinalitäten im ER-Modell (t04) und zu Integritätsbedingungen (t05). Die Miniwelt selbst ist real; das **Schema** ist ihr Modell in der Datenbank, die **Ausprägung** bildet ihren aktuellen Zustand ab.

## Schema und Ausprägung

- Das **Schema** (*database schema*) beschreibt die Struktur: welche Tabellen es gibt, welche Spalten mit welchen Datentypen, welche Bedingungen gelten. Es legt fest, wie gültige Daten aussehen, ändert sich selten und wird mit DDL definiert. Weil es Daten über Daten enthält, gehört es zu den **Metadaten** und ist im Data Dictionary gespeichert. Man kann es auch als die konkrete Anwendung eines Datenmodells (etwa des relationalen) auf eine bestimmte Miniwelt sehen.
- Die **Ausprägung** (*instance*, auch Instanz, Datenbankinstanz oder Datenbankzustand) ist die Menge der konkreten Daten zu einem Zeitpunkt. Sie ändert sich ständig durch DML (`INSERT`, `UPDATE`, `DELETE`) und muss stets zum Schema passen. Mit „Ausprägung“ ist dabei der ganze Zustand gemeint, nicht nur einzelne Werte darin.

Ein Begriffspaar aus der Logik benennt die beiden Ebenen: Das Schema bildet die **intensionale Ebene** (*intension*, was gelten soll), die Ausprägung die **extensionale Ebene** (*extension*, was tatsächlich gespeichert ist).

Beispiel: Schema Parzelle(<u>ParzellenNr</u>, Flaeche_m2, Pacht_EUR)

Ausprägung am 1. März (Ausschnitt aus allen Zeilen):

| ParzellenNr | Flaeche_m2 | Pacht_EUR |
|---|---|---|
| 12 | 300 | 180.00 |
| 17 | 420 | 240.00 |

Ausprägung am 1. April (derselbe Ausschnitt), nachdem Parzelle 17 geteilt wurde. Die abgetrennte Hälfte erhält die nächste freie Nummer 61. Die Zeilen haben sich geändert, das Schema ist dasselbe:

| ParzellenNr | Flaeche_m2 | Pacht_EUR |
|---|---|---|
| 12 | 300 | 180.00 |
| 17 | 210 | 120.00 |
| 61 | 210 | 120.00 |

Als Bild: Das Schema ist der Vordruck eines Formulars, die Ausprägung der Stapel ausgefüllter Formulare. Wer objektorientiert programmiert, kennt dieselbe Trennung als Klasse und Objekt: Die Klasse legt fest, welche Attribute es gibt, die Objekte tragen die Werte. In diesem Kurs begegnet dir das Paar Typ und Exemplar wieder als Entitätstyp und Entität (t04) sowie als Relationenschema und Relation (t05).

**Begriffsvarianten:**

- In manchen DBMS bezeichnet „Schema“ zusätzlich einen **Namensraum**, der einem Benutzer gehört und Tabellen, Sichten und Sequenzen enthält. Gemeint ist dann ein Container, nicht der Gegenbegriff zur Ausprägung.
- Externes, konzeptionelles und internes Schema der Drei-Ebenen-Architektur behandelt t02.

## Data Dictionary

Das **Data Dictionary** (Systemkatalog, Datenkatalog, Datenwörterbuch) ist der vom DBMS gepflegte Katalog der **Metadaten**. Darin stehen unter anderem:

- Tabellen, Spalten und Datentypen,
- Primär- und Fremdschlüssel sowie weitere Integritätsbedingungen,
- Sichten, Trigger, Prozeduren und Indexe,
- Benutzer und ihre Zugriffsrechte.

Die Anwendungsdaten stehen nicht darin: „Die Spalte Pacht_EUR hat den Typ NUMERIC(7,2)“ ist ein Katalogeintrag, „Parzelle 12 kostet 180 Euro“ nicht.

Weil ein Datenbanksystem diese Beschreibung selbst mitführt, nennt man es **selbstbeschreibend**: Die Struktur steht nicht in jedem Programm, sondern einmal zentral. Jede DDL-Anweisung (`CREATE`, `ALTER`, `DROP`) aktualisiert den Katalog automatisch. Das DBMS liest ihn bei jeder Anfrage, um Rechte und Integritätsbedingungen zu prüfen und einen Ausführungsplan zu wählen; DBA, Entwickler und Werkzeuge nutzen ihn ebenfalls.

In relationalen Systemen ist der Katalog selbst als Tabellen abgelegt und mit derselben Sprache abfragbar wie die Anwendungsdaten (Codds Regel 4, siehe unten). In Firebird heißen diese Systemtabellen z. B. `RDB$RELATIONS` (Tabellen und Sichten) und `RDB$RELATION_FIELDS` (Spalten).

## Anforderungen an ein DBMS

Auf Edgar F. Codd, den Begründer des relationalen Modells, gehen zwei Listen zurück, die leicht durcheinandergeraten: neun Anforderungen an das, was ein DBMS leisten soll, und zwölf Regeln, die festlegen, wann ein System relational ist.

### Neun Anforderungen nach Codd

Codd hat Anfang der 1980er-Jahre zusammengefasst, welche Aufgaben ein DBMS übernehmen soll; in der Literatur wird dafür meist ein Zeitschriftenaufsatz von 1982 angegeben. Die Liste wird häufig im Zusammenhang mit relationalen Systemen behandelt, als das, was ein relationales DBMS nach Codd bieten muss. Manche Darstellungen lesen sie allgemeiner als Funktionskatalog für DBMS überhaupt; das ist eine Lesart, keine Festlegung Codds.

Die Namen der Anforderungen schwanken je nach Darstellung. Die Tabelle nennt gängige Alternativen und beschreibt jede Anforderung von ihrer Wirkung her: Was ginge schief, wenn das DBMS sie nicht erfüllte?

| Anforderung (auch genannt) | Ohne sie … | Beispiel Kleingartenverein |
|---|---|---|
| **Integration** (Datenintegration) | … legte jede Anwendung ihre eigenen Kopien an. Gefordert ist eine nichtredundante Datenhaltung: Jedes logische Datenelement, etwa eine Anschrift, liegt nur einmal vor. | Vorstand, Kasse und Wasserwart nutzen eine gemeinsame Datenbasis; Kayas Anschrift steht genau einmal darin. |
| **Operationen** (Sprache) | … gäbe es keinen geordneten Weg, Strukturen festzulegen (DDL), Daten einzufügen, abzufragen, zu ändern und zu löschen (DML) und Rechte zu vergeben (DCL). Dazu gehören verschiedene Zugangswege: eine Programmierschnittstelle für Anwendungen, eine interaktive oder grafische Oberfläche und der Zugriff über das Web. | Tabelle Zahlung mit `CREATE TABLE` anlegen, Pacht per `UPDATE` anpassen; der Kassenwart nutzt ein grafisches Werkzeug, die Pachtverwaltung eine Programmierschnittstelle. |
| **Katalog** (Data Dictionary) | … könnten weder Programme noch Menschen verlässlich nachsehen, wie die Daten aufgebaut sind. | Nachschlagen, welche Spalten die Tabelle Zahlung hat. |
| **Benutzersichten** | … müsste jede Gruppe mit dem gesamten Bestand arbeiten, auch mit Teilen, die sie nicht braucht. | Der Wasserwart bekommt Parzellen und Zählerstände angezeigt, die Bankdaten nicht. |
| **Konsistenzüberwachung** (Integritätssicherung, Konsistenzkontrolle) | … gelangten unsinnige oder widersprüchliche Werte unbemerkt in den Bestand (semantische Integrität), und beschädigte Speicherstrukturen, etwa nach einem Absturz, blieben unentdeckt (physische Integrität). | Ein Zählerstand kleiner als der vorige wird abgewiesen. |
| **Zugriffskontrolle** (Datenschutz, Datenzugriffskontrolle) | … dürfte jeder, der die Datenbank erreicht, alles lesen und ändern. | Nur der Kassenwart darf Zahlungen ändern. |
| **Transaktionen** | … bliebe bei einem Abbruch mitten in einem Vorgang ein halber Zustand zurück, und eine bereits bestätigte Änderung könnte bei einem Absturz doch verloren gehen. Gefordert ist beides: ganz oder gar nicht, und nach dem erfolgreichen Abschluss dauerhaft. | Zahlung buchen und offenen Betrag senken geschieht zusammen oder gar nicht; nach dem `COMMIT` übersteht die Buchung auch einen Stromausfall. |
| **Synchronisation** (Mehrbenutzerfähigkeit) | … überschrieben sich gleichzeitig Arbeitende gegenseitig oder sähen halbfertige Zwischenstände der anderen. Mit Synchronisation arbeitet jede Person so, als wäre sie allein im System (Isolation). | Vorsitzende und Kassenwart ändern zur selben Zeit denselben Pächterdatensatz; beide Änderungen bleiben erhalten. |
| **Datensicherung** (Recovery, Wiederherstellung) | … wäre der Bestand nach einem Plattendefekt, einem Systemabsturz oder einem versehentlichen Löschen verloren oder unbrauchbar. | Den Stand vom Vorabend zurückspielen und die seitdem bestätigten Buchungen nachfahren. |

Zwei Paare liegen nah beieinander:

- **Benutzersichten und Zugriffskontrolle:** Eine Sicht bestimmt, welcher Ausschnitt einer Gruppe *gezeigt* wird. Die Zugriffskontrolle entscheidet, welche Aktionen jemandem *erlaubt* sind. Häufig setzt man beides gemeinsam ein (Sichten siehe t12, Rechtevergabe siehe t13).
- **Transaktionen und Synchronisation:** Die Transaktion schützt einen einzelnen Vorgang vor dem Steckenbleiben auf halbem Weg. Die Synchronisation schützt mehrere Vorgänge, die zur selben Zeit laufen, voreinander.

### Codds zwölf Regeln für relationale DBMS

Die zwölf Regeln sind ein Kriterienkatalog dafür, wann ein DBMS als **relational** gelten darf. Codd wollte damit verhindern, dass Hersteller ältere Produkte nur dem Namen nach als relational vermarkten. Bekannt wurden die Regeln durch zwei Zeitschriftenartikel Codds von 1985 (*Computerworld*); Vorformen reichen bis in die 1970er-Jahre zurück. Trotz des Namens sind es 13 Regeln, gezählt von 0 bis 12:

- **Regel 0, Grundregel:** Das System verwaltet seine Datenbanken ausschließlich über relationale Fähigkeiten.
- **Regel 1, Informationsregel:** Alle Informationen liegen als Werte in Tabellen vor.
- **Regel 2, garantierter Zugriff:** Jeder einzelne Wert ist über Tabellenname, Primärschlüsselwert und Spaltenname erreichbar.
- **Regel 3, systematische Behandlung von NULL:** Fehlende oder nicht zutreffende Werte werden einheitlich markiert, unterscheidbar von 0 oder leerer Zeichenkette.
- **Regel 4, Online-Katalog:** Die Beschreibung der Datenbank liegt ebenfalls in Tabellen und ist mit derselben Sprache abfragbar.
- **Regel 5, umfassende Datensprache:** Mindestens eine Sprache deckt Datendefinition, Sichten, Datenmanipulation, Integrität, Rechte und Transaktionen ab.
- **Regel 6, Sichten ändern:** Jede Sicht, die theoretisch änderbar ist, muss auch im System änderbar sein.
- **Regel 7, mengenorientierte Operationen:** Einfügen, Ändern und Löschen wirken auf Mengen von Zeilen – nicht nur das Lesen.
- **Regel 8, physische Datenunabhängigkeit:** Änderungen an Speicherung und Zugriffswegen beeinflussen die Anwendungen nicht.
- **Regel 9, logische Datenunabhängigkeit:** Informationserhaltende Änderungen an den Basistabellen beeinflussen die Anwendungen nicht.
- **Regel 10, Integritätsunabhängigkeit:** Integritätsbedingungen werden in der Datensprache definiert und im Katalog gespeichert, nicht in den Anwendungen.
- **Regel 11, Verteilungsunabhängigkeit:** Für Benutzer ist nicht erkennbar, ob die Daten auf mehrere Orte verteilt sind.
- **Regel 12, Unterwanderungsverbot:** Eine satzweise arbeitende Low-Level-Schnittstelle darf die relationalen Integritätsregeln nicht umgehen.

Ob heutige Produkte alle Regeln vollständig erfüllen, wird in der Literatur unterschiedlich bewertet.

### Wie die beiden Listen zusammenhängen

| | neun Anforderungen | zwölf Regeln |
|---|---|---|
| Inhalt | Funktionen, die ein DBMS bereitstellen soll | Eigenschaften, an denen man ein relationales DBMS erkennt |
| Zweck | Leistungsumfang eines DBMS beschreiben | prüfen, ob ein Produkt die Bezeichnung „relational“ verdient |
| Einordnung | meist als Codds Anforderungen an (relationale) DBMS dargestellt, teils allgemein auf DBMS übertragen | setzen ausdrücklich das relationale Modell voraus |
| Überschneidung | Katalog, Konsistenzüberwachung, Operationen | Regel 4 (Katalog), Regel 10 (Integrität), Regel 5 (Datensprache) |

Ist allgemein von „Codds Regeln“ die Rede, lohnt sich der Hinweis, welche Liste man meint, denn beide stammen von ihm und überschneiden sich.

**Nicht verwechseln:** Codd hat 1993 außerdem zwölf Bewertungsregeln für **OLAP**-Analysewerkzeuge (*Online Analytical Processing*) veröffentlicht. Sie betreffen Werkzeuge zur Datenanalyse und haben mit den beiden Listen oben nichts zu tun.

## Benutzerrollen

Wer mit einem Datenbanksystem zu tun hat, nimmt eine oder mehrere **Rollen** ein. Eine Rolle beschreibt eine Tätigkeit, keine Person: Eine Person kann mehrere Rollen haben, eine Rolle kann von einer Gruppe ausgefüllt werden. Wie fein man die Rollen unterteilt und wie man sie gruppiert, unterscheidet sich zwischen Darstellungen. Die folgende Übersicht ordnet sie danach, ob jemand die Datenbank nutzt, entwickelt oder betreibt.

**Nutzen**

- **Endnutzer** (Endbenutzer, *end users*) arbeiten mit den Daten über fertige Programme und Werkzeuge: Masken, Berichte oder Abfrage-Assistenten, mit denen sie auch spontan etwas nachsehen können, ohne selbst SQL zu beherrschen. Beispiel: die Vorsitzende, die in der Pachtverwaltung alle Pächter:innen mit offenem Betrag anzeigen lässt.
- *Variante:* Manche Lehrbücher unterteilen die Endnutzer weiter in **Anwendungsnutzer**, die nur fertige Masken bedienen (gelegentlich *naive users* genannt), und **versierte Nutzer** (*sophisticated users*), die ihre Abfragen selbst formulieren. In der Einteilung dieses Kurses zählt das eigene Schreiben von Abfragen zur Entwicklung.

**Entwickeln**

- **Systemanalytiker und Datenbankdesigner** (Datenmodellierer) erheben die Anforderungen, grenzen die Miniwelt ab und entwerfen ER-Modell und Schema (siehe t03, t04). Beispiel: das Vorstandsmitglied, das mit allen Beteiligten klärt, welche Daten der Verein wirklich braucht.
- **Softwarearchitekten** legen fest, wie die Anwendung aufgebaut ist, etwa welche Schichten es gibt und wie sie an die Datenbank angebunden wird (siehe t13).
- **Anwendungsentwickler** (Anwendungsprogrammierer, *application programmers*) schreiben die Programme, die auf die Datenbank zugreifen, und formulieren dafür SQL, auch einzelne Ad-hoc-Abfragen. Beispiel: der Kassenwart, der selbst eine SQL-Abfrage für die Summe der offenen Beträge schreibt, oder ein Vereinsmitglied, das die Web-Oberfläche programmiert.

**Betreiben**

- Der **Datenbankadministrator** (DBA, *database administrator*) sorgt dafür, dass das Datenbanksystem zuverlässig läuft. Zu seinen Aufgaben gehören:
  - die Systemarchitektur mitbestimmen (z. B. ein zentraler Server, Zugriff über das Netz) und das DBMS installieren und aktualisieren,
  - am logischen und physischen Datenbankentwurf mitwirken: Tabellen, Indexe und Sichten anlegen und anpassen,
  - Altbestände übernehmen, etwa die bisherigen Tabellenkalkulationsdateien importieren,
  - Zugriffsschnittstellen für Anwendungen bereitstellen (z. B. ODBC, JDBC),
  - Benutzer und ihre Rechte verwalten,
  - Speicherplatz planen und überwachen, die Leistung beobachten und verbessern, die Datenbank bei Bedarf reorganisieren,
  - Datensicherungen einrichten und nach einem Fehler oder Systemausfall den Bestand wiederherstellen (Recovery).

**Außerhalb der einzelnen Datenbank**

- **DBMS-Entwickler** programmieren die DBMS-Software selbst, z. B. die Teams hinter Firebird oder PostgreSQL. Sie arbeiten nicht mit der Vereinsdatenbank, sondern bauen das Werkzeug, mit dem alle anderen arbeiten.
- Manche Darstellungen nennen zusätzlich einen **Datenadministrator**, der fachliche und rechtliche Anforderungen an die Daten verantwortet, etwa den Datenschutz.

## Auf einen Blick

- Dateien je Anwendung führen zu Redundanz und Inkonsistenz, verlorenen Änderungen und Programmen, die vom Dateiaufbau abhängen. Ein DBS bietet dagegen einen integrierten Bestand, zentrale Integritätsprüfung, Mehrbenutzerbetrieb, feine Rechte, Datensicherung und Datenunabhängigkeit.
- Unkontrollierte Redundanz führt zu Inkonsistenz. Kontrollierte Redundanz (Index, Replikat, Backup als bewusster Zeitpunktstand) hat einen Zweck und einen geregelten Umgang.
- DBS = DBMS + Datenbank (Datenbasis aus Anwendungsdaten und Data Dictionary). Das DBMS definiert, konstruiert und manipuliert die Datenbank. Eine Datenbankanwendung nutzt das DBS, gehört aber nicht dazu. „Datenbank“ wird oft auch für das ganze DBS gesagt.
- Daten sind dargestellte Information, Information ist interpretierte Daten, Wissen ist vernetzte Information, die beim Lösen eines Problems hilft. Pyramidenmodelle unterscheiden sich (mit Zeichen als Basis oder mit Weisheit als Spitze).
- Persistent = überdauert Programmende und Neustart, bleibt bis zum ausdrücklichen Löschen, für andere Prozesse zugänglich; transient = nur während des Programmlaufs. Persistent heißt nicht unveränderlich.
- Miniwelt (Diskursbereich, UoD) = zweckbezogener Weltausschnitt samt Regeln. Schema = intensionale Ebene (Struktur, Metadaten, DDL, selten geändert), Ausprägung = extensionale Ebene (Datenbestand zu einem Zeitpunkt, DML, ständig geändert).
- Das Data Dictionary enthält die Metadaten, wird vom DBMS gepflegt und ist in relationalen Systemen selbst als Tabellen abgelegt.
- Neun Anforderungen nach Codd: Integration, Operationen (Sprache), Katalog, Benutzersichten, Konsistenzüberwachung (Integritätssicherung), Zugriffskontrolle (Datenschutz), Transaktionen, Synchronisation (Mehrbenutzerfähigkeit), Datensicherung (Recovery).
- Zwölf Regeln (gezählt 0 bis 12): Kriterien dafür, dass ein DBMS relational ist. Nicht mit Codds OLAP-Regeln verwechseln.
- Rollen sind Tätigkeiten: Endnutzer; Systemanalytiker, Datenbankdesigner, Softwarearchitekt, Anwendungsentwickler; DBA; außerdem DBMS-Entwickler.
