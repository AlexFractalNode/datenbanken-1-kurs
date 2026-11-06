---
id: t02
lang: de
title: Datenbankmodelle & Architektur
order: 2
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: wp-datenbankmodell
    ref: "Abschnitt „Definition“ (drei Bestandteile nach Codd: generische Datenstruktur, generische Operatoren, Integritätsbedingungen, die zulässige Inhalte über die Struktur hinaus einschränken; konkrete Relationen bilden das Schema) und „Beispiele“ (Liste der Datenbankmodelle inkl. Graph)"
  - id: wp-datenmodellierung
    ref: "Einleitung (formale Abbildung der relevanten Objekte eines Ausschnitts der realen Welt; „Datenmodell“ als Ergebnis der Modellierung) und Abschnitt „Verfahren“ (konzeptuelles Schema als semantisches Modell, logisches und physisches Schema, angelehnt an ANSI-SPARC)"
  - id: inf-schule-datenbanksysteme
    ref: "Entwurf von Datenbanken › Die Miniwelt, Abschnitt 3.3.2 „Ein Ausschnitt der Schulwelt“ (Miniwelt als modellierter, für die Anwendung relevanter Ausschnitt der realen Welt; daraus ein vereinfachtes konzeptionelles Modell): https://inf-schule.de/datenbanksysteme/ermodelle/miniwelt"
  - id: wp-datenbank
    ref: "Abschnitte „Geschichte“ (Dateien als Vorläufer, eigene Softwareschicht ab den 1960ern, IMS mit DL/I hierarchisch, CODASYL-Netzwerkmodell, Codd und System R, Ingres, Oracle, Ablösung in den 1980ern, NoSQL ab etwa 2001), „Beispiele“ (relationale Produkte) und „Datenbankmodell“ (hierarchisch, Netzwerk, relational, objektorientiert, dokumentenorientiert, Mischformen)"
  - id: wp-hierarchisches-datenbankmodell
    ref: "Abschnitte „Bedeutung“ (IMS/DB von IBM, Altsysteme bei Banken und Versicherungen, XML, LDAP) und „Aufbau“ (Baum, Wurzel, Blätter, Eltern-Kind-Beziehung, nur 1:1 und 1:n, n:m über Redundanz oder virtuelle Eltern-Kind-Beziehungen)"
  - id: wp-relationale-datenbank
    ref: "Abschnitte „Grundlegende Konzepte“, „Abgrenzung“ (Ältere Ansätze: Struktur beim Entwurf festgelegt; Objektorientierte und Objektrelationale Datenbanken; SQL-99) und „Kritik am relationalen Datenbankmodell“ (Segmentierung, künstliche Schlüssel, mengen- vs. satzorientiert, Verhalten nicht abbildbar)"
  - id: wpen-relational-model
    ref: "Sections „History“ (Codd 1969/1970, general model of data), „Relational operations“ (declarative querying; recursive queries need an additional fixpoint operator), „SQL and the relational model“ (duplicates, NULL), „Alternatives“ (hierarchical and network models still in high-volume data centers; object-oriented databases)"
  - id: wp-edgar-f-codd
    ref: "Abschnitt „Leben“ (IBM, Aufsatz von 1970, Turing Award 1981). Hinweis: Die dort genannten zwölf Regeln betreffen OLAP und werden hier nicht verwendet"
  - id: oer-informatik-datenbanken
    ref: "Seite DBMS (https://oer-informatik.de/dbms): relationale DBMS und marktübliche Produkte (u. a. Oracle, MySQL, MariaDB, SQL Server, PostgreSQL, Db2, SQLite); Abgrenzung zu Key-Value-, Dokument- und Graphdatenbanken"
  - id: wp-objektdatenbank
    ref: "Anforderungen an ein ODBMS (komplexe Objekte, Objektidentität, Kapselung, Klassenhierarchien, späte Bindung), ODMG mit OQL/ODL, Vor- und Nachteile, Geschichte (Entstehung Ende der 1980er, untergeordnete Marktrolle, Systeme wie db4o)"
  - id: wp-objektrelationale-datenbank
    ref: "Einleitung (Brücke zwischen relationalen und Objektdatenbanken), „Weitere Details“ (Entstehung durch Spracherweiterung relationaler Systeme um objektorientierte Methoden und Datentypen; Anwendungsbeispiel Geoinformationssysteme)"
  - id: postgresql-17-docs-sql
    ref: "5.11 Inheritance (INHERITS, ONLY; UNIQUE, PRIMARY KEY und FOREIGN KEY werden nicht vererbt; Abgrenzung zur SQL:1999-Typvererbung): https://www.postgresql.org/docs/17/ddl-inherit.html; 7.8 WITH Queries (rekursive Anfragen mit WITH RECURSIVE): https://www.postgresql.org/docs/17/queries-with.html"
  - id: wp-ansi-sparc-architektur
    ref: "Einleitung und Ebenenbeschreibung (ANSI/SPARC 1975, Alternativnamen Drei-Ebenen-/Drei-Schema-Architektur, externe/konzeptionelle/interne bzw. physische Ebene, Normalisierung des relationalen Schemas auf der konzeptionellen Ebene, physische und logische Datenunabhängigkeit inkl. Wechsel von Speichermedium oder Datenbankprodukt)"
  - id: wpen-three-schema-approach
    ref: "Sections „Overview“ (external, conceptual, internal schema; conceptual schema as single integrated, application-neutral definition of the concepts as users think of them, later called conceptual model with entities and their relationships; mappings to databases and programming languages) and „History“ (1975, ANSI/X3/SPARC)"
  - id: wp-schema-informatik
    ref: "Abschnitt „Schemata in Datenbanken“ (externes, konzeptionelles, internes Schema; Data-Dictionary)"
  - id: wp-datenunabhaengigkeit
    ref: "Datenunabhängigkeit über eine stabile Schnittstelle; physische Datenunabhängigkeit (Index als Beispiel; Netzwerk- und hierarchische Datenbanken an Zugriffspfade gebunden), logische Datenunabhängigkeit (nur bei einfachen Schemaänderungen, Sicht als Mittel)"
  - id: wpen-codds-12-rules
    ref: "Rules 8 (physical data independence) and 9 (logical data independence, information-preserving changes)"
  - id: firebird-30-language-reference
    ref: "Kap. 5 Data Definition (DDL) Statements: CREATE VIEW, CREATE TABLE, CREATE INDEX als typische Anweisungen je Ebene"
  - id: watt-database-design-2e
    ref: "Geprüft über die inhaltsgleiche CC-BY-Ausgabe auf LibreTexts (https://eng.libretexts.org/Bookshelves/Computer_Science/Databases_and_Data_Structures/Database_Design_2e_(Watt)): Kap. 1 Before the Advent of Database Systems (dateibasierte Systeme, Redundanz, Integritätsregeln in Programmen); Kap. 3 Characteristics and Benefits (Datenunabhängigkeit, mehrere Sichten); Kap. 4 Types of Data Models (hierarchisch als Baum, Netzwerk mit Satztypen und Set-Typen, relational); Kap. 5 Data Modelling (Datenmodell als Konzepte für Daten, Beziehungen, Semantik und Bedingungen samt Grundoperationen; Abstraktionsebenen extern, konzeptionell als Gesamtsicht, meist als ERD dargestellt, intern, physisch; logische und physische Datenunabhängigkeit); Kap. 6 Classification of DBMS (relational: Oracle, SQL Server, DB2, MySQL; objektorientiert: O2, ObjectStore, Jasmine, weniger verbreitet als erwartet; hierarchisch/Netzwerk noch auf Großrechnern)"
  - id: wp-objektrelationale-abbildung
    ref: "Prinzip (Objekte einer objektorientierten Anwendung werden in einer relationalen Datenbank abgelegt): Alternative zu objektrelationalen DBMS-Merkmalen"
  - id: wp-modell
    ref: "Abschnitt „Wissenschaftliche Hauptmerkmale“ (Abbildungs-, Verkürzungs- und Pragmatismusmerkmal nach Stachowiak)"
  - id: wpen-object-relational-database
    ref: "Sections „Overview“ (object–relational mapping als Alternative) und „History“ (relationale Produkte mit objektrelationalen Erweiterungen, u. a. Db2, Oracle, PostgreSQL)"
  - id: wpen-network-model
    ref: "CODASYL-Netzwerkmodell; Abschnitt „Database systems“ (u. a. IDMS)"
  - id: wp-netzwerkdatenbankmodell
    ref: "CODASYL-Netzwerkmodell (Satztypen, Set-Typen); Vertreter u. a. UDS"
---

# Datenbankmodelle & Architektur

## Lernziele

Nach diesem Thema kannst du …

- den Begriff *Datenbankmodell* mit seinen drei Bestandteilen erklären, ihn vom *Schema* einer Anwendung abgrenzen und den allgemeinen Modellbegriff an einem eigenen Beispiel zeigen,
- hierarchisches, Netzwerk-, relationales, objektorientiertes und objektrelationales Modell zeitlich einordnen, ihre Struktur skizzieren, typische Vertreter nennen und je Vor- und Nachteile angeben,
- begründen, warum sich das relationale Modell durchgesetzt hat,
- die drei Ebenen der ANSI-SPARC-Architektur mit ihren Aufgaben an einem Beispiel erläutern und Bestandteile einer Datenbank der richtigen Ebene zuordnen,
- logische und physische Datenunabhängigkeit unterscheiden, konkrete Änderungen einer der beiden zuordnen und die Grenzen der logischen Datenunabhängigkeit benennen.

## Modellbegriff

Ein **Modell** (*model*) ist ein vereinfachtes Abbild eines Originals, das für einen bestimmten Zweck angefertigt wird. Eine Datenbank bildet so einen Ausschnitt der realen Welt ab, die *Miniwelt* (siehe t01), und übernimmt davon nur, was für die Anwendung relevant ist.

**Vertiefung: drei Modellmerkmale.** Die allgemeine Modelltheorie (nach Herbert Stachowiak) zerlegt diese Definition in drei Merkmale – hier am Beispiel der Mitgliederverwaltung einer Kletterhalle:

- **Abbildungsmerkmal:** Das Modell steht für ein Original. Der Datensatz „Mitglied 4711, Lina Berger“ steht für eine reale Person.
- **Verkürzungsmerkmal:** Das Modell übernimmt nur die Eigenschaften, die für den Zweck zählen: Name, Geburtsdatum, Tarif und Schuhgröße für Leihschuhe – nicht aber Augenfarbe oder Lieblingsroute.
- **Pragmatisches Merkmal:** Das Modell ist für einen bestimmten Zweck, bestimmte Nutzer und eine bestimmte Zeit gemacht. Die Mitgliederverwaltung dient Einlass und Abrechnung; für das Routenbau-Team wären Wände, Griffe und Schwierigkeitsgrade wichtig.

Daraus folgt: Es gibt nicht *das* richtige Modell, sondern nur ein für den Zweck geeignetes.

In der Datenbankwelt musst du zwei Ebenen auseinanderhalten:

1. **Datenbankmodell** bzw. **Datenmodell** im allgemeinen Sinn (*data model*, *database model*): die allgemeinen Beschreibungsmittel, mit denen man die Daten beliebiger Anwendungen aufschreibt. Nach Codd besteht es aus drei Teilen:
   - **generische Datenstrukturen** – die **statischen** Eigenschaften, also wie Daten aufgebaut sind (relational: Relationen aus Tupeln),
   - **generische Operatoren** – die **dynamischen** Eigenschaften, also wie man Daten abfragt, einfügt, ändert und ableitet (relational: relationale Algebra, t08),
   - **Integritätsbedingungen**, die festlegen, welche Datenbankzustände zulässig sind und welche Zustandsübergänge erlaubt sind. Ein Teil steckt schon im Modell selbst (**modellinhärent**: im hierarchischen Modell hat jeder Satz genau einen Elternsatz, im relationalen Modell hat jedes Tupel einer Relation dieselben Attribute). Weitere Bedingungen definiert man **explizit** im Schema, z. B. Primär- und Fremdschlüssel oder „Tarifpreis ≥ 0“ (t05). Eine Bedingung an einen Übergang wäre „der Jahresbeitrag darf bei einer Verlängerung nicht sinken“.
2. **Schema** einer Anwendung: das konkrete Ergebnis, das mit diesen Mitteln beschrieben wird – etwa die Tabellen der Kletterhalle. Schema vs. Ausprägung: siehe t01.

Als Bild: Das Datenbankmodell ist die Bauweise (Holzrahmenbau, Stahlbeton), das Schema der Bauplan eines bestimmten Hauses. **Begriffsvariante:** In der Entwurfsliteratur heißt auch das Ergebnis einer Modellierung „Datenmodell“, etwa „das ER-Modell der Kletterhalle“ (t03, t04). Achte auf den Zusammenhang: Geht es um *die Art*, Daten zu strukturieren, oder um die Struktur *einer* Anwendung?

## Hierarchisches Modell und Netzwerkmodell

Bevor es Datenbanksysteme gab, verwaltete jede Anwendung ihre eigenen Dateien. Die einfachste Form sind **flache Dateien** (*flat files*): ein Satz pro Zeile, ohne Beziehungen zwischen Dateien, oft für genau ein Programm gebaut und deshalb mehrfach kopiert. In den 1960er-Jahren wurde die Datenverwaltung zu einer eigenen Softwareschicht; die ersten großen Systeme folgten zwei Modellen.

**Hierarchisches Modell.** Das älteste Datenbankmodell speichert Daten als **Baum**: Ein Satztyp (*record type*) ist die **Wurzel**, jeder andere Satztyp hat **genau einen** Elternsatztyp (Eltern-Kind-Beziehung, *parent-child relationship*); Satztypen ohne Kinder heißen Blätter. Bekanntester Vertreter ist **IMS** von IBM mit der Sprache DL/I (entstanden in den 1960ern).

Beispiel Sportverein: Verein → Abteilung (Handball, Volleyball) → Mannschaft → Spieler:in. „Wer spielt in Handball Damen 1?“ ist leicht zu beantworten – man steigt im Baum hinab. Jana spielt aber in zwei Mannschaften, und ein Satz hat nur einen Elternsatz. Also muss ihr Datensatz **zweimal** gespeichert werden; ändert sich ihre Telefonnummer, müssen beide Kopien geändert werden (Änderungsanomalie, siehe t07).

![Hierarchisches Modell: Baum mit doppelt gespeicherter Spielerin](diagrams/hierarchie-sportverein.dot)

- Direkt darstellbar sind nur 1:1- und 1:n-Beziehungen; m:n geht nur über Kopien oder über **virtuelle Eltern-Kind-Beziehungen** (Verweise in einen anderen Baum).
- **Vorteile:** passt zu natürlich hierarchischen Daten; Zugriffe entlang der vorgesehenen Pfade sind einfach und schnell, weil das System nur im Baum absteigen muss; Altsysteme bei Banken und Versicherungen laufen teils noch damit; die Idee lebt in XML und in Verzeichnisdiensten wie LDAP weiter.
- **Nachteile:** m:n nur mit Redundanz, man arbeitet immer innerhalb eines Baums, die Struktur wird beim Entwurf festgelegt, und die Programme hängen an den Zugriffspfaden (siehe Datenunabhängigkeit).

**Netzwerkmodell.** Parallel dazu definierte das Gremium **CODASYL** Ende der 1960er ein netzwerkartiges Modell; Systeme nach dieser Vorgabe (bekannte Vertreter sind **IDMS** und **UDS** von Siemens) waren wie IMS vor allem in den 1970ern verbreitet. Es verallgemeinert den Baum zum **Graphen**: Ein Datensatz darf mit **mehreren** übergeordneten Datensätzen verknüpft sein. Jana wird einmal gespeichert und ist mit beiden Mannschaften verbunden.

![Netzwerkmodell: Spielerin einmal gespeichert, mit zwei Mannschaften verknüpft](diagrams/netzwerk-sportverein.dot)

- **Vorteile:** flexibler als der Baum, m:n-Zusammenhänge ohne Kopien.
- **Nachteile:** komplexe Struktur und Programme. Wie beim hierarchischen Modell ist der Zugriff **navigierend** (*navigational access*): Das Programm folgt Satz für Satz den gespeicherten Verweisen („gehe zum Verein, dann zur ersten Abteilung, dann …“) und muss die Zugriffspfade kennen. Werden diese geändert, muss auch das Programm geändert werden.

## Relationales Modell (Überblick)

**Edgar F. Codd** (IBM) stellte das relationale Modell 1970 vor („A Relational Model of Data for Large Shared Data Banks“) und erhielt dafür 1981 den Turing Award. Aus seinen Arbeiten entstand der Prototyp **System R**, an der Universität Berkeley parallel Ingres; Oracle und später IBM machten SQL kommerziell erfolgreich. In den 1980er-Jahren verdrängten relationale Systeme die hierarchischen und Netzwerksysteme in den meisten Organisationen.

**Grundidee:** Alle Daten stehen als **Werte in Relationen** (Tabellen aus Tupeln). Beziehungen entstehen nicht über Zeiger, sondern über **gleiche Werte**, etwa einen Fremdschlüssel. Die Begriffe Relation, Tupel, Attribut und Domäne behandelt t05, Fremdschlüssel t04 und t05.

Der Sportverein relational (Primärschlüssel unterstrichen, Fremdschlüssel mit Pfeil auf die Zieltabelle, wie in t05):
- spieler(<u>spieler_nr</u>, name, telefon)
- mannschaft(<u>mannschaft_nr</u>, bezeichnung, abteilung)
- einsatz(<u>spieler_nr → spieler, mannschaft_nr → mannschaft</u>)

Jana steht genau einmal in spieler. „Wer spielt in Damen 1?“ und „Wo spielt Jana?“ sind gleich einfache Anfragen.

Abfragen sind **deklarativ** (*declarative*): Man beschreibt, **was** man haben will; das DBMS entscheidet, **wie** es die Daten findet. Intern übersetzt es SQL in Operatoren der relationalen Algebra (t08).

**Typische Vertreter:** die frühen Systeme System R (IBM, Prototyp), Ingres und Oracle; heute u. a. Oracle, IBM Db2, Microsoft SQL Server, MySQL/MariaDB, PostgreSQL, SQLite und das in diesem Kurs genutzte Firebird. Mehrere der großen Systeme (z. B. Oracle, Db2, PostgreSQL) haben zusätzlich objektrelationale Erweiterungen und werden deshalb oft auch als **objektrelational** eingeordnet (siehe unten).

- **Vorteile:** einheitliche, einfache Struktur; mathematische Grundlage; deklarative Anfragen; Datenunabhängigkeit; Normalisierung gegen Redundanz (t07); SQL als verbreiteter Standard.
- **Kritik**, nach drei Gesichtspunkten geordnet:
  - *Verhalten:* Methoden lassen sich nicht zusammen mit den Daten speichern.
  - *Zugriff:* Das mengenorientierte SQL passt schlecht zu satzorientierten Programmiersprachen. Rekursive Anfragen (z. B. „alle Vorgesetzten über beliebig viele Stufen“) kann die klassische relationale Algebra nicht ausdrücken; SQL wurde dafür später um `WITH RECURSIVE` erweitert.
  - *Struktur:* Ein fachliches Objekt ist auf viele Tabellen verteilt und muss per Join zusammengesetzt werden; oft werden künstliche Schlüssel nur zur Verwaltung eingeführt.
- **Hinweis:** SQL weicht in Details vom Modell ab, etwa durch doppelte Zeilen und NULL (t05, t10).

## Objektorientierte und objektrelationale Modelle

**Objektorientierte Datenbanken** (*object databases*, ODBMS) entstanden Ende der 1980er-Jahre; breiter diskutiert und standardisiert wurden sie in den 1990ern. Sie speichern Objekte so, wie eine objektorientierte Programmiersprache sie kennt. Grundprinzipien:

- **komplexe Objekte** aus beliebigen Typen, auch geschachtelt,
- **Objektidentität**: jedes Objekt hat eine systemweit eindeutige **OID**, die gleich bleibt, auch wenn sich alle Attributwerte ändern (anders als ein Primärschlüssel, t04),
- **Kapselung**: Daten und Methoden bilden eine Einheit, der Zugriff läuft über Methoden,
- **Nachrichten**: Objekte arbeiten zusammen, indem sie einander Nachrichten schicken, also Methoden anderer Objekte aufrufen,
- **Klassen, Vererbung und Spezialisierung**: Unterklassen übernehmen Attribute und Methoden der Oberklasse und ergänzen oder überschreiben sie; welche Methode läuft, entscheidet sich erst zur Laufzeit (späte Bindung).

Für Anfragen standardisierte die ODMG die Sprache **OQL**. Ein Vertreter ist z. B. **db4o** (mittlerweile eingestellt). Beispiel Bäckerei: Ein Objekt `Torte` ist eine Spezialisierung von `Backware`, enthält eine Liste von `Zutat`-Objekten und hat eine Methode `preisBerechnen()`, die ihrerseits jeder Zutat die Nachricht `kostenJeGramm()` schickt; das Objekt wird als Ganzes gespeichert und geladen.

- **Vorteile:** Die Fehlanpassung zwischen Objekten und Tabellen entfällt (*impedance mismatch* – die Lücke zwischen objektorientierter Programmierung und relationaler Speicherung); komplexe Objekte lassen sich ohne Joins lesen; künstliche Schlüssel sind unnötig.
- **Nachteile:** Die Daten sind eng an das Klassenmodell einer Programmiersprache gebunden; Anwendungen in anderen Sprachen und spontane Auswertungen kommen schwerer heran. Die Schnittstellen sind nicht einheitlich, ein Systemwechsel ist aufwendig. Der Markt ist klein, deshalb sind verbreitete Werkzeuge und Schnittstellen (ODBC/JDBC, Auswertungswerkzeuge) kaum darauf eingestellt. Bei manchen Anfragen und beim Sperren vieler Objekte kann die Leistung leiden.

**Objektrelationale Datenbanken** (ORDBMS) schlagen eine Brücke: Grundlage bleibt ein **relationales** System mit Tabellen und SQL, erweitert um objektorientierte Konzepte – eigene strukturierte Datentypen, Methoden und Vererbung, vor allem bei Tabellendefinitionen. Entstanden sind sie in den 1990ern, indem Hersteller ihre relationalen Systeme sprachlich erweiterten; der Standard **SQL:1999** enthält entsprechende Sprachmittel. Eine Umsetzung ist die Tabellenvererbung in PostgreSQL. Sie ist **PostgreSQL-spezifisch** (nicht die Typvererbung aus SQL:1999) und wird in den Firebird-Musterlösungen des Kurses nicht verwendet:

    CREATE TABLE backware (name VARCHAR(40), preis NUMERIC(6,2));
    CREATE TABLE torte (stockwerke INTEGER) INHERITS (backware);

Eine Abfrage auf `backware` liefert auch die Torten; `FROM ONLY backware` schränkt auf die Elterntabelle ein.

- **Vorteile:** bewährte relationale Basis, SQL und Werkzeuge bleiben; komplexere Strukturen möglich.
- **Nachteile:** Mischform mit herstellerspezifischen Lösungen; die Vererbung hat Lücken – in PostgreSQL gehen Primärschlüssel-, `UNIQUE`- und Fremdschlüsselbedingungen nicht auf Untertabellen über.
- **Verbreitung:** Reine Objektdatenbanken sind Nischensysteme geblieben. Objektrelationale Merkmale stecken dagegen als Erweiterung in relationalen Systemen und sind damit überall verfügbar, wo diese Systeme laufen. **Einschätzungsvariante:** Wie stark sie tatsächlich genutzt werden, wird unterschiedlich bewertet. Viele Anwendungen speichern weiter in klassischen Tabellen und bilden ihre Objekte im Programm darauf ab (objektrelationale Abbildung, *object-relational mapping*). Merke: *Verfügbar* heißt nicht *genutzt*.

**Ausblick:** Außerhalb dieser fünf Modelle gibt es **semistrukturierte** Daten wie XML (baumartig, erinnert an das hierarchische Modell) und die nicht-relationalen Systeme, die etwa ab 2001 unter dem Sammelbegriff **NoSQL** wichtiger wurden: **Key-Value-Speicher** (Schlüssel → beliebiger Wert), **dokumentenorientierte** Datenbanken (z. B. JSON-Dokumente), **Graphdatenbanken** (Knoten und Kanten) und **spaltenorientierte** Systeme. Beim letzten Begriff sind zwei Bedeutungen im Umlauf: *Column Stores* legen die Werte einer Tabelle spaltenweise statt zeilenweise ab, was Auswertungen über wenige Spalten beschleunigt; *Wide-Column*-Systeme gruppieren Daten je Zeilenschlüssel in flexible Spaltenfamilien.

| Modell | entstanden | Hauptverbreitung | Vertreter | Struktur | Beziehungen | Zugriff | typischer Nachteil |
|---|---|---|---|---|---|---|---|
| hierarchisch | 1960er | 1970er | IMS | Baum | 1:1, 1:n; m:n nur mit Kopien | navigierend | Redundanz, starre Struktur |
| Netzwerk | Ende 1960er (CODASYL) | 1970er | IDMS, UDS | Graph | auch mehrere Elternsätze | navigierend | komplex, an Zugriffspfade gebunden |
| relational | 1970 (Codd) | ab 1980er | Firebird, MySQL, SQL Server, SQLite; Oracle, Db2, PostgreSQL | Relationen | über gleiche Werte | deklarativ (SQL) | Objekte zerlegt, Joins nötig |
| objektorientiert | Ende 1980er | 1990er (Nischen) | db4o, ObjectStore, O2 | Objekte mit OID | Referenzen, Vererbung | Methoden, OQL | wenig verbreitet, uneinheitlich |
| objektrelational | 1990er (SQL:1999) | als Erweiterung relationaler Systeme | Oracle, Db2, PostgreSQL | Tabellen + eigene Typen | Werte, teils Vererbung | SQL | herstellerspezifisch |

Oracle, Db2 und PostgreSQL stehen bewusst in zwei Zeilen: Ihr Kern ist relational, durch ihre Erweiterungen gelten sie zugleich als objektrelational.

**Hinweis zu Jahreszahlen:** Je nachdem, ob eine Darstellung die *Entstehung* oder die *Hauptverbreitung* meint, stehen unterschiedliche Jahrzehnte da (z. B. Objektdatenbanken: entstanden Ende der 1980er, verbreitet in den 1990ern). Nenne beim Lernen am besten beides. Hierarchisches und Netzwerkmodell entstanden etwa gleichzeitig; danach folgen relational und dann objektorientiert/objektrelational.

## ANSI-SPARC-Drei-Ebenen-Architektur

1975 schlug das **ANSI/X3/SPARC**-Komitee vor, die Beschreibung einer Datenbank in drei Ebenen zu trennen. Gebräuchliche Namen sind **Drei-Ebenen-Modell**, *Drei-Ebenen-Architektur* und *Drei-Schema-Architektur* (*three-schema approach*). Ziel: Benutzer und Anwendungen sollen von Änderungen an der Datenbankstruktur möglichst nicht betroffen sein.

- **Externe Ebene** (*external level*, auch *Benutzer-* oder *Sichtenebene*). **Aufgabe:** jeder Benutzergruppe und Anwendung genau den Ausschnitt der Daten in der für sie passenden Form zeigen und alles andere verbergen. Typisches Objekt ist eine Sicht (*view*, `CREATE VIEW`, siehe t12). Es gibt **viele** externe Schemata.
- **Konzeptionelle Ebene** (*conceptual level*, in manchen Texten auch *logische Ebene*). **Aufgabe:** die **eine**, integrierte und anwendungsneutrale Gesamtbeschreibung liefern – welche Daten es gibt, wie sie zusammenhängen, welche Integritätsbedingungen gelten. Sie ist vollständig und redundanzfrei. Bei relationalen Datenbanken stehen hier die normalisierten Tabellen (`CREATE TABLE` mit Schlüsseln und Fremdschlüsseln).
- **Interne Ebene** (*internal level*, auch *physische Ebene*). **Aufgabe:** festlegen, **wie und wo** gespeichert wird, damit der Zugriff schnell ist: Dateien und Seiten, Satzformat, Dateiorganisation (unsortierte Heap-Ablage, Baumstrukturen wie der B-Baum, Hash-Verfahren), Indexe (`CREATE INDEX`), Speicherreihenfolge. Bewusste Redundanz ist erlaubt (ein Index kopiert Spaltenwerte).

Zwischen den Ebenen übersetzt das DBMS über **Abbildungen** (*mappings*): extern ↔ konzeptionell und konzeptionell ↔ intern. Sie wirken in zwei Richtungen: Eine Anfrage an eine Sicht wird **nach unten** in eine Anfrage an die Tabellen und weiter in Zugriffe auf Dateien und Indexe übersetzt; das Ergebnis wird **nach oben** wieder in die Form der Sicht gebracht. Beschrieben werden die Schemata im Data Dictionary (t01).

Beispiel Kletterhalle:
- **extern:** Die Theke sieht Mitgliedsnummer, Name, Tarif, „Abo gültig bis“ und offenen Betrag. Das Routenbau-Team sieht Route, Wand, Grad, Farbe, Schraubdatum und die Durchschnittsbewertung. Die Mitglieder-App zeigt nur die eigenen Besuche.
- **konzeptionell:** mitglied(<u>mitglied_nr</u>, vorname, nachname, geburtsdatum, tarif, abo_ende), besuch(<u>mitglied_nr → mitglied, datum, uhrzeit</u>), route(<u>route_nr</u>, wand, grad, farbe, schraubdatum), bewertung(<u>mitglied_nr → mitglied, route_nr → route</u>, sterne).
- **intern:** eine Datenbankdatei auf SSD, Indexe auf besuch(datum) und mitglied(nachname), Seitengröße, Pufferverwaltung.

Die Durchschnittsbewertung ist nicht gespeichert, sondern wird bei jeder Anfrage an die Routenbau-Sicht aus bewertung berechnet – ein Beispiel für die Abbildung nach oben.

![ANSI-SPARC-Architektur am Beispiel einer Kletterhalle](diagrams/ansi-sparc-kletterhalle.dot)

**Zwei Lesarten der konzeptionellen Ebene.** Was „auf der konzeptionellen Ebene steht“, wird unterschiedlich weit gefasst:

1. **Enge Lesart (Architektur):** Das konzeptionelle Schema ist das gemeinsame logische Gesamtschema der *laufenden* Datenbank, das das DBMS verwaltet. Bei relationalen Systemen sind das die Tabellen mit ihren Integritätsbedingungen. Das ER-Diagramm gehört in dieser Lesart zum Entwurf, nicht zur Architektur.
2. **Weite Lesart (viele Lehrbücher und Lehrveranstaltungen):** Die drei Ebenen werden mit dem Datenbankentwurf verbunden. Auf der konzeptionellen Ebene steht dann sowohl das **semantische Schema bzw. ER-Schema** als auch das daraus abgeleitete **Datenbankschema** (Tabellen).

Warum es beide gibt: Beide Sichten beschreiben auf dieser Ebene das *Was* – welche Daten es gibt und wie sie zusammenhängen –, unabhängig von Speicherung und einzelnen Anwendungen. Die weite Lesart betont zusätzlich, woher dieses Gesamtschema kommt: aus dem konzeptuellen Entwurf (t03, t04). **Lerntipp:** Nutze die Lesart deiner Lehrveranstaltung und nenne sie in deiner Antwort.

**Notationsvariante: vier statt drei Stufen.** Manche Lehrbücher zerlegen die Abstraktion in vier Modelle: *extern* (Sichten), *konzeptionell* (Gesamtsicht, meist als ER-Diagramm), *intern* (das Modell, wie es das gewählte DBMS sieht, z. B. Tabellen) und *physisch* (Dateiorganisation, Zugriffsverfahren, Speicherung). Dort heißt also das Tabellenschema „intern“, und erst die vierte Stufe entspricht der internen Ebene des Drei-Ebenen-Modells. Wer diese Variante nutzt, sollte sie ausdrücklich nennen.

**Begriffsfallen:**
- „Konzeptionell“ und „konzeptuell“ werden als Synonyme verwendet.
- Das Phasenmodell des Entwurfs (t03) nennt das ER-Modell *konzeptuell* und das Tabellenschema *logisch*. Wer ANSI-SPARC und Entwurfsphasen in einer Antwort verbindet, sagt am besten dazu, welches Begriffssystem gemeint ist. Im Drei-Ebenen-Modell gehören die Tabellen in beiden Lesarten auf die konzeptionelle Ebene, nicht auf die interne; anders ist es nur in der vierstufigen Variante.

**Abgrenzung: Systemsicht.** ANSI-SPARC betrachtet die Architektur aus Sicht der Anwendungen: Welche Beschreibungen gibt es, und wer sieht welche? Daneben lässt sich ein DBMS aus Systemsicht beschreiben, als **Schichtenmodell** seines inneren Aufbaus. Gebräuchlich ist das **Fünf-Schichten-Modell** (nach Theo Härder). Grob gelesen von oben nach unten: Übersetzung und Optimierung mengenorientierter Anfragen, satzweiser Zugriff über Zugriffspfade, Abbildung von Sätzen auf Seiten, Pufferverwaltung im Hauptspeicher und schließlich die Dateien auf dem Externspeicher. Dieses Modell wird hier nicht vertieft; wichtig ist nur, die beiden Blickwinkel nicht zu vermischen.

## Logische und physische Datenunabhängigkeit

**Datenunabhängigkeit** (*data independence*) bedeutet: Anwendungen arbeiten mit den Daten, ohne zu wissen, wie sie gespeichert sind. Eine Änderung auf einer Ebene erreicht die darüberliegenden Ebenen nicht – angepasst wird nur die Abbildung. Codd nahm beide Arten in seine Regeln für relationale Systeme auf (Regeln 8 und 9, siehe t01).

**Physische Datenunabhängigkeit** (*physical data independence*): Die **interne Ebene** lässt sich ändern, ohne dass konzeptionelles Schema und Anwendungen geändert werden müssen. Beispiele aus der Kletterhalle:
- ein Index auf besuch(datum), weil die Tagesstatistik langsam ist,
- die Datenbankdatei zieht auf ein neues Speichersystem um,
- besuch wird intern nach Jahren getrennt abgelegt.

Die Thekenanwendung schickt dieselben Anfragen wie vorher; weil Anfragen deklarativ sind, nutzt das DBMS den neuen Index von selbst. **Quellenvariante:** Eine Quelle zählt auch den Wechsel des Datenbankprodukts dazu. Das klappt in der Praxis nur so weit, wie beide Systeme dasselbe Schema und denselben SQL-Dialekt verstehen – Firebird und PostgreSQL unterscheiden sich z. B. bei `FIRST`/`LIMIT` (t10).

**Logische Datenunabhängigkeit** (*logical data independence*): Das **konzeptionelle Schema** lässt sich ändern, ohne dass externe Schemata und Anwendungen geändert werden müssen. Beispiele:
- mitglied bekommt die neue Spalte schuhgroesse – die Theken-Sicht nennt ihre Spalten ausdrücklich und bleibt gleich.
- Die Adressdaten werden aus mitglied in eine eigene Tabelle ausgelagert; die Basistabelle bekommt einen neuen Namen, und eine Sicht mit dem alten Namen `mitglied` setzt beide Tabellen per Join wieder zusammen. Lesende Anwendungen merken nichts; schreibende brauchen eine änderbare Sicht (in Firebird bei Join-Sichten über Trigger, t12).
- Eine Tabelle bekommt einen neuen Namen – eine Sicht mit dem alten Namen fängt das ab.

Firebird 3 kennt keinen Befehl zum Umbenennen einer Tabelle. Dort legt man die neue Tabelle an, kopiert die Daten um, löscht die alte Tabelle und legt danach die Sicht unter dem alten Namen an.

**Grenzen:** Logische Datenunabhängigkeit gelingt nur bei **informationserhaltenden** Änderungen. Wird die Spalte Geburtsdatum gelöscht, kann keine Sicht das Alter für die Jugendtarif-Prüfung zurückliefern. Außerdem braucht sie eine stabile Schnittstelle: Eine Anwendung, die mit `SELECT *` direkt auf die Basistabelle zugreift, bekommt die neue Spalte plötzlich mitgeliefert. Deshalb gilt: Physische Datenunabhängigkeit erreichen relationale Systeme weitgehend, logische nur eingeschränkt.

**Warum ältere Modelle hier schwach sind:** In hierarchischen und Netzwerkdatenbanken navigieren die Programme selbst über die Zugriffspfade; ändert man die Speicherstruktur, brechen sie. Das ist ein Hauptgrund für den Erfolg des relationalen Modells.

**Vorgehen zum Zuordnen einer Änderung:**
1. Welche Ebene wird geändert? Index, Datei, Speichermedium, Dateiorganisation → intern (typisch `CREATE INDEX`). Tabelle, Spalte, Datentyp, Schlüssel, Beziehung → konzeptionell (typisch `CREATE TABLE`/`ALTER TABLE`). Nur eine Sicht oder Maske → extern (typisch `CREATE VIEW`).
2. Was soll unverändert bleiben? Bleiben bei einer internen Änderung Schema und Anwendungen gleich → **physische** Datenunabhängigkeit. Bleiben bei einer konzeptionellen Änderung Sichten und Anwendungen gleich → **logische**.
3. Wird nur eine externe Sicht geändert, ist keine Datenunabhängigkeit nötig – die darunterliegenden Ebenen bleiben unverändert.

## Auf einen Blick

- Modell = zweckgebundenes, vereinfachtes Abbild (vertiefend: Abbildung, Verkürzung, Pragmatik). Datenbankmodell bzw. Datenmodell = Strukturen (statisch) + Operatoren (dynamisch) + Integritätsbedingungen (modellinhärent oder explizit); das konkrete Ergebnis einer Anwendung ist ihr Schema.
- Vorstufe: flache Dateien je Anwendung. Hierarchisch (1960er, IMS) und Netzwerk (etwa gleichzeitig, CODASYL; z. B. IDMS, UDS): Baum mit genau einem Elternsatz bzw. Graph mit mehreren. Beide navigierend und an Zugriffspfade gebunden.
- Relational (Codd 1970, verbreitet ab den 1980ern; z. B. Firebird, MySQL, Oracle, Db2, PostgreSQL): alles Werte in Relationen, Beziehungen über gleiche Werte, deklarative Anfragen. Kritik: zerlegte Objekte, Impedance Mismatch, keine Methoden.
- Objektorientiert (Ende 1980er/1990er; z. B. db4o, ObjectStore): OID, Kapselung, Nachrichten, Vererbung und Spezialisierung – Nischensysteme. Objektrelational (1990er, SQL:1999): relationales DBMS mit eigenen Typen, Methoden, Vererbung, etwa Oracle, Db2, PostgreSQL (`INHERITS`); breit verfügbar, Nutzung unterschiedlich eingeschätzt. Daneben XML und NoSQL (Key-Value, Dokument, spaltenorientiert, Graph).
- ANSI-SPARC (1975, Drei-Ebenen-Modell): viele externe Schemata (Sichten), genau ein konzeptionelles (Tabellen; in der weiten Lesart auch das ER-Schema), genau ein internes (Dateien, Indexe) – verbunden über Abbildungen in beide Richtungen. Variante mit vier Stufen beachten. Davon zu trennen: die Systemsicht als Fünf-Schichten-Modell des DBMS.
- Physische Datenunabhängigkeit: interne Änderung (Index, Speicher) → Schema und Anwendungen bleiben. Logische: konzeptionelle Änderung (Spalte, Zerlegung) → Sichten und Anwendungen bleiben – nur bei informationserhaltenden Änderungen und stabiler Schnittstelle.
