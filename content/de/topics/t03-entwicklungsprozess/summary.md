---
id: t03
lang: de
title: Entwicklungsprozess
order: 3
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: watt-database-design-2e
    ref: "Kap. 13 Database Development Process: Abschnitt zum Software Development Life Cycle (Wasserfallmodell mit Testing und Maintenance), „Database Life Cycle“, „Requirements Gathering“ (data and functional requirements, Interviews, Datenanforderungsdokument), „Analysis“ (konzeptuelles Datenmodell: was, nicht wie), „Logical Design“ (iteratives Verfeinern; logisches Schema als DDL), „Implementation“ (Speicherschema, Sicherheit, externe Schemata), „Realizing the Design“ (DDL-Skripte, Datenbank ohne Daten), „Populating the Database“ (Import, Massenladen mit ausgesetzten Prüfungen)"
  - id: oer-informatik-erm
    ref: "Abschnitte „Konzeptueller Datenbankentwurf“ (Entwurfsschritte: Anforderungsanalyse, konzeptueller, logischer, Verteilungsentwurf, physischer Entwurf und Implementierung, Test und Validierung, Anwendung und Wartung), „Modellierungsphasen im konzeptuellen Modell“ (Nominalextraktion, Synonyme im Glossar), „Entität oder Attribut?“, „Bottom-Up-Entwurf per Generalisierung“, „Top-Down-Entwurf per Spezialisierung“, „Inside-Out-Entwurf“, „Vorgegebene Modelle erweitern und vervollständigen“, „Validierung“, „Nächste Entwurfsphase: das logische Datenmodell“: https://oer-informatik.de/erm"
  - id: wp-datenmodellierung
    ref: "Abschnitt „Verfahren“ (konzeptuelles, logisches und physisches Schema mit Ergebnissen je Phase, Präzisierung mit Auftraggebern, Meilensteine; Feldformate im logischen Schema) und Abschnitt „Methoden“ (Analyse existierender Listen, Ausgaben und Auswertungen; Top-down, Bottom-up); Einleitung (Datenmodelle langlebiger als Software)"
  - id: wpen-database-design
    ref: "Sections „Conceptual data modeling“ (Determining data to be stored als Teil der requirements analysis; Conceptual schema, ER-Diagramm beschreibt information requirements), „Logical data modeling“ mit „Normalization“ (spätere Denormalisierung v. a. aus Performancegründen), „Physical design“ (data elements and data types, indexing, backup)"
  - id: inf-schule-datenbanksysteme
    ref: "Entwurf von Datenbanken, Unterseite „Die Miniwelt“ (Miniwelt als modellierter Ausschnitt der realen Welt, schrittweises Vorgehen, konzeptionelles Modell unabhängig vom späteren Datenbanktyp): https://inf-schule.de/datenbanksysteme/ermodelle/miniwelt"
  - id: wp-entity-relationship-modell
    ref: "Einleitung (relevanter Ausschnitt der realen Welt; konzeptionelle Phase: das Was, nicht das Wie), Abschnitte „Einsatz des ERM beim Datenbankdesign“, „ER-Diagramme“ (Teilmodelle großer Modelle), „Beschreibung der Modellkomponenten“ (Übernahme in ein zentrales Datenmodell)"
  - id: wp-data-dictionary
    ref: "Abschnitt „Anwendungsübergreifende Datenkonsistenz“ (einheitliche Datenelemente über Tabellen hinweg); Data Dictionary als Metadatenkatalog, der auch als Glossar genutzt werden kann"
  - id: wp-schema-informatik
    ref: "Abschnitt „Schematische Heterogenität“ (Integration unterschiedlicher Schemata; Namenskonflikte durch Synonyme und Homonyme; strukturelle vs. semantische Heterogenität; abweichende Datentypen bzw. Einheiten) und Abschnitt „Schemata in Datenbanken“ (externes Schema für Benutzergruppen, konzeptionelles Schema auf Basis des semantischen Datenmodells, internes Schema)"
  - id: wpen-schema-matching
    ref: "Abschnitt „Impediments“ (semantische und strukturelle Heterogenität, Synonyme und Homonyme, abweichende Einheiten und Genauigkeit) und Abschnitt „Schema matching“, Methodology „Conforming the Schemas“ (Schemata vor dem Zusammenführen angleichen); nur Teildeckung, Wertebereichs- und Bedingungskonflikte fehlen"
  - id: wp-ansi-sparc-architektur
    ref: "Einleitung: externe Ebene (individuelle Sichten für Benutzer und Anwendungen), konzeptionelle Ebene (vollständige, redundanzfreie Darstellung; Normalisierung des relationalen Schemas), interne Ebene (physische Speicherung, effizienter Zugriff, Indizes als bewusste Redundanz)"
---

# Entwicklungsprozess

## Lernziele

Nach diesem Thema kannst du …

- die Phasen des Datenbankentwurfs in der richtigen Reihenfolge nennen und je Phase Ziel, Tätigkeiten, Ergebnisdokument und Abhängigkeit von Datenmodell bzw. DBMS beschreiben, auch in gängigen abweichenden Einteilungen,
- Informations- und Verarbeitungsanforderungen unterscheiden, für ein eigenes Projekt je mehrere Beispiele formulieren und eine Anforderungsspezifikation in Tabellenform (Objekt-, Beziehungs- und Prozessbeschreibung) anlegen,
- erklären, was bei der Sichtenintegration geschieht, und Namens-, Typ-, Wertebereichs-, Bedingungs- und Strukturkonflikte sowie Ober- und Unterbegriffe an einem Beispiel erkennen und auflösen,
- begründen, in welche Phase eine Entwurfsentscheidung gehört (z. B. Normalisierung, Tabellendefinition mit Datentyp, Index),
- erklären, warum Validierung alle Phasen begleitet, welche Prüfmethoden es gibt und wie es zu Rücksprüngen kommt.

## Phasenmodell des Datenbankentwurfs

Zwischen der Idee „Unser Ruderclub braucht eine App für Fahrtenbuch, Boote und Beiträge“ und der laufenden Datenbank liegen mehrere Arbeitsschritte. Jeder beantwortet eine eigene Frage und liefert ein Ergebnisdokument, auf dem der nächste aufbaut. Der Kurs verwendet dieses **Phasenmodell mit sechs Phasen**:

| Nr. | Phase | Leitfrage | gebunden an |
|---|---|---|---|
| 1 | Anforderungsanalyse (*requirements analysis*) | Was soll gespeichert und unterstützt werden? | nur die Fachseite |
| 2 | konzeptioneller Entwurf (*conceptual design*) | Welche Objekte, Eigenschaften und Beziehungen gibt es? | weder Datenmodell noch DBMS |
| 3 | logischer Entwurf (*logical design*) | Wie sieht das im Datenmodell aus, hier relational? | Datenmodell |
| 4 | Datendefinition (*data definition*) | Wie werden logisches Schema und Sichten in der Sprache des DBMS beschrieben? | DBMS-Produkt (DDL) |
| 5 | physischer Entwurf (*physical design*) | Wie werden die Daten intern abgelegt und schnell gefunden? | DBMS-Produkt, interne Ebene |
| 6 | Implementierung und Wartung | Datenbank anlegen, befüllen, anbinden, betreiben und anpassen | laufendes System |

**Validierung ist keine eigene Phase.** Sie begleitet alle Phasen als Querschnittsaufgabe: Jedes Ergebnis wird geprüft, bevor die nächste Phase darauf aufbaut (Abschnitt „Validierung als Querschnittsaufgabe“).

Von Phase zu Phase wird das Ergebnis technischer. Das konzeptionelle Schema ließe sich ebenso in eine objektorientierte Datenbank überführen. Das logische Schema ist relational, aber noch nicht auf Firebird oder PostgreSQL festgelegt. Erst Datendefinition und physischer Entwurf sind produktspezifisch. Diese Trennung hat einen praktischen Nutzen: Wechselt man auf ein anderes Produkt **mit demselben Datenmodell**, sind nur Datendefinition und physischer Entwurf neu zu erstellen. Konzeptionelles und logisches Schema bleiben gültig. Das lohnt sich, weil Datenstrukturen meist deutlich länger leben als die Programme, die mit ihnen arbeiten.

**Keine Einbahnstraße.** Das Modell erinnert an das *Wasserfallmodell* (*waterfall model*) der Softwareentwicklung. In der Praxis springt man zurück, wenn eine spätere Phase eine Lücke aufdeckt. Ein Beispiel: Beim logischen Entwurf fällt auf, dass unklar ist, ob ein Boot mehreren Bootsklassen angehören kann. Dann wird bei der Fachseite nachgefragt, das ER-Modell korrigiert, und alle betroffenen Dokumente werden nachgezogen. Je früher ein Fehler auffällt, desto billiger ist er.

**Notationsvarianten.** Quellen schneiden die Phasen unterschiedlich zu:
- **Sieben Phasen ohne Datendefinition:** Anforderungsanalyse, konzeptioneller, logischer, physischer Entwurf, Implementierung, Validierung (Test), Betrieb und Wartung. Das DDL-Skript mit Datentypen ist dann Ergebnis des physischen Entwurfs, und die Validierung zählt als eigene Phase.
- **Physischer Entwurf als Teil der Implementierung:** Das logische Schema wird direkt als DDL notiert, Speicherschema, Sicherheit und externe Schemata folgen bei der Implementierung.
- **Andere Namen für den konzeptionellen Schritt:** Englischsprachige Darstellungen nennen ihn teils *analysis* bzw. *data analysis*. Vorsicht, im Deutschen meint *Datenanalyse* meist eine Teiltätigkeit der Anforderungsanalyse (siehe unten).
- **Verschobener Begriff „konzeptionell“:** Manche Lehrbücher nennen das ER-Modell *semantisches Datenmodell* (Fachkonzept) und bezeichnen erst das technische, z. B. relationale Modell als *konzeptionelles Schema*. Das ist das, was hier logisches Schema heißt. Solche Darstellungen setzen oft eine Planungsphase davor und kennen eine eigene Phase für die Auswahl des DBMS.
- **Verteilungsentwurf:** Bei verteilten Datenbanken wird nach dem logischen Entwurf festgelegt, welche Daten an welchem Standort liegen.
- **Drei Schritte:** Anforderungsanalyse, konzeptionelle Modellierung, Implementierung des Schemas.
- **Zwei Schritte** in Einführungen: Miniwelt als ER-Modell darstellen, danach in das Datenmodell der Datenbank überführen.
- *Konzeptionell* und *konzeptuell* werden gleichbedeutend verwendet.

Wichtig sind Reihenfolge und Inhalte der Schritte. Wenn du eine andere Einteilung verwendest, nenne sie ausdrücklich, damit deine Darstellung nachvollziehbar bleibt.

**Bezug zur Drei-Ebenen-Architektur (t02).** Die ANSI-SPARC-Ebenen lassen sich auf zwei gleichberechtigte Arten mit dem Entwurf verbinden:
- **Enge Lesart:** Die konzeptionelle Ebene ist das Gesamtschema im DBMS, bei relationalen Systemen also die Tabellen. Es entsteht im logischen Entwurf und wird in der Datendefinition beschrieben. Das ER-Modell liegt dann vor der Architektur.
- **Weite Lesart:** Schon das DBMS-unabhängige ER-Schema gehört auf die konzeptionelle Ebene, daneben das datenbankspezifische Schema. Der Entwurf folgt den Ebenen: Benutzersichten als externe Schemata, ER-Modell und Relationenschema als konzeptionelles Schema, physischer Entwurf als internes Schema.

In beiden Lesarten entsprechen die Sichten der Benutzergruppen den externen Schemata, und der physische Entwurf betrifft die interne Ebene.

## Anforderungsanalyse (Informations- und Verarbeitungsanforderungen)

Ziel der Anforderungsanalyse ist, vor jeder Modellierung zu klären, **was** die Datenbank leisten soll. Zuerst wird die **Miniwelt** (*mini-world*, auch *universe of discourse*) abgegrenzt: der Ausschnitt der Realität, der abgebildet wird. Im Ruderclub gehören Mitglieder, Boote, das Fahrtenbuch, Schadensmeldungen, Trainingsgruppen, Beiträge und Vereinsreisen dazu. Die Getränkekasse im Bootshaus und die Belegung des Parkplatzes gehören nicht dazu.

**Einordnung ins Requirements Engineering.** Die Anforderungsanalyse ist ein Ausschnitt des *Requirements Engineering*, das eng mit dem Anforderungsmanagement verwandt ist. Beteiligt sind die **Stakeholder**: alle, die Anforderungen haben oder vom System betroffen sind. Im Ruderclub sind das Vorstand, Bootswart:in, Kassenwart:in, Trainer:innen und Mitglieder, aber auch der Datenschutz, weil IBANs gespeichert werden. Die Arbeit gliedert sich in vier Tätigkeiten:

1. **Ermitteln:** Anforderungen erheben.
2. **Analysieren:** Widersprüche, Lücken und Mehrdeutigkeiten finden.
3. **Spezifizieren:** Anforderungen verbindlich dokumentieren.
4. **Validieren:** mit den Stakeholdern prüfen, ob das Dokument ihre Wünsche richtig wiedergibt.

Wie viel vorab festgelegt wird, hängt vom Vorgehensmodell ab:
- **Schwergewichtige**, plangetriebene Modelle erheben die Anforderungen möglichst vollständig vor dem Entwurf. Typische Dokumente sind das **Lastenheft** (der Auftraggeber beschreibt, *was* er braucht) und das **Pflichtenheft** (der Auftragnehmer beschreibt, *wie* er es umsetzen will).
- **Agile** Modelle sammeln Anforderungen schrittweise und setzen sie in kurzen Iterationen um. Für das Datenbankschema bedeutet das häufigere, kleinere Änderungen.

**Vorgehen:**
1. Benutzergruppen bestimmen. Jede Gruppe hat ihre eigene **Sicht** (*user view*) auf die Daten.
2. Anforderungen erheben:
   - Gespräche mit den Gruppen führen,
   - vorhandene Unterlagen auswerten (Papier-Fahrtenbuch, Beitragsliste, Trainingspläne),
   - Abläufe beobachten,
   - Anwendungsfälle (*Use Cases*) beschreiben: ein Ablauf mit Akteur, Auslöser, Schritten und Ergebnis, z. B. „Ausfahrt eintragen“,
   - *User Stories* formulieren: kurze Sätze aus Nutzersicht, z. B. „Als Bootswart:in möchte ich alle offenen Schäden eines Boots sehen, damit ich Reparaturen planen kann.“
3. Begriffe klären: Mehrdeutiges wird mit der Fachseite präzisiert und in einem **Glossar** festgehalten. Das erleichtert später die Sichtenintegration. Ein *Data Dictionary* (Datenkatalog) ist dagegen ein Metadatenkatalog im bzw. zum DBMS. Es kann die vereinbarten Begriffe später aufnehmen und dann auch als Glossar dienen.
4. Alles in einer **Anforderungsspezifikation** (*requirements specification*) zusammenfassen und von der Fachseite abnehmen lassen.

Inhaltlich besteht die Analyse aus zwei Teiltätigkeiten. Die **Datenanalyse** erfasst die Informationsanforderungen, die **Funktionsanalyse** die Verarbeitungsanforderungen:

- **Informationsanforderungen** (*information requirements*) betreffen den **Datenbestand**: welche Objekte, Eigenschaften und Beziehungen gespeichert werden und welche Integritätsbedingungen gelten (Wertebereiche, Eindeutigkeit, Kardinalitäten).
- **Verarbeitungsanforderungen** (*processing requirements*; gleichbedeutend *Datenverarbeitungsanforderungen* oder *Bearbeitungsanforderungen*) betreffen den **Umgang mit den Daten**: welche Abfragen, Auswertungen und Änderungsvorgänge vorkommen, wie oft, wie schnell, mit welchen Datenmengen und wer sie ausführen darf.

Verarbeitungsanforderungen sind nicht einfach dasselbe wie „funktionale Anforderungen“. Welche Vorgänge es gibt, ist funktional. Antwortzeit, Datenvolumen und Zugriffsschutz gelten im Requirements Engineering dagegen als **nicht-funktionale** Anforderungen (Qualitätsanforderungen). Für den Datenbankentwurf zählen beide Anteile zu den Verarbeitungsanforderungen.

| | Informationsanforderung | Verarbeitungsanforderung |
|---|---|---|
| Leitfrage | Was wird gespeichert, was ist zulässig? | Was wird damit getan, wie oft, wie schnell, von wem? |
| Beispiel 1 | Zu jedem Boot werden Bootsname (eindeutig), Bootsklasse und Baujahr gespeichert. | Vor jeder Ausfahrt trägt die Mannschaft Boot und Personen ein, an Sommerabenden bis zu 40-mal pro Stunde. |
| Beispiel 2 | Jede Ausfahrt wird mit genau einem Boot gefahren. | Am Saisonende wird je Mitglied die Summe der geruderten Kilometer ausgegeben. |
| Beispiel 3 | Die Kilometer einer Ausfahrt liegen zwischen 1 und 200. | Die Bootswart:in sieht alle Schäden eines Boots in unter 2 Sekunden. |
| Beispiel 4 | Ein Mitglied hat eine IBAN, falls es per Lastschrift zahlt. | Nur die Kassenwart:in darf IBANs lesen und ändern. |
| wirkt vor allem auf | ER-Modell, Relationenschema, Constraints | Prüfung des Schemas, Indexe, Sichten und Rechte, Anwendungsprogramme, Testfälle |

**Faustregel zur Einordnung.** Sätze über den Bestand („hat“, „gehört zu“, „ist eindeutig“, „liegt zwischen“) sind Informationsanforderungen. Das gilt auch dann, wenn sie wie Regeln klingen: Ein Wertebereich ist eine Integritätsbedingung des Bestands. Sätze mit einer Tätigkeit samt Häufigkeit, Zeitvorgabe oder Berechtigung („wird jeden Montag ausgewertet“, „in unter 2 s“, „nur … darf“) sind Verarbeitungsanforderungen. Die Kilometersumme je Mitglied aus Beispiel 2 wird berechnet, nicht gespeichert. Sie ist ein abgeleiteter Wert (t04) und gehört zur Verarbeitung.

**Anforderungsspezifikation in Tabellenform.** Damit nichts vergessen wird, hält man die Anforderungen in drei Arten von Tabellen fest. Die folgende Spaltenauswahl ist eine Darstellung dieses Kurses. In der Praxis sind Spaltennamen und -umfang verschieden, die Inhalte aber ähnlich.

*Objektbeschreibung*: ein Objekt mit seinen Attributen.
- Die Typ- und Längenangaben sind fachlich gemeint („Text, höchstens 30 Zeichen“). Ebenso üblich sind allgemeine Typnamen wie Ganzzahl, Zeichenkette, Dezimalzahl oder Datum. DBMS-Datentypen folgen erst in der Datendefinition.
- Die Spalte zu Mehrfachwerten heißt auch „Anzahl Werte“. Sie kann statt ja/nein eine Anzahl oder Spanne enthalten, z. B. 1 oder 0 bis 3.
- Der Belegungsgrad (auch Füllgrad, oder als Muss/Kann angegeben) sagt, bei wie vielen Objekten das Attribut einen Wert hat.

| Objekt Boot (ca. 35) | Typ, Länge | Wertebereich/Regel | mehrwertig | Belegung | identifizierend |
|---|---|---|---|---|---|
| Bootsname | Text, 30 | im Verein eindeutig | nein | 100 % | ja |
| Bootsklasse | Text, 5 | Kürzel wie 1x, 2-, 4x+, 8+ | nein | 100 % | nein |
| Baujahr | Ganzzahl, 4 | 1950 bis aktuelles Jahr | nein | ca. 90 % | nein |

*Beziehungsbeschreibung*: beteiligte Objekte (wahlweise mit ihrer Rolle), Kardinalität, eigene Attribute und Mengengerüst, also die erwarteten Anzahlen.

| Beziehung | beteiligte Objekte (Rolle) | Kardinalität | Attribute | Mengengerüst |
|---|---|---|---|---|
| rudert mit | Mitglied (Ruderer:in), Ausfahrt | m:n, je Ausfahrt 1 bis 9 Personen | keine | ca. 6000 Ausfahrten/Jahr, im Mittel 3 Personen |
| mit | Ausfahrt, Boot (genutztes Boot) | n:1, jede Ausfahrt genau ein Boot | keine | ca. 170 Ausfahrten je Boot und Jahr |

*Vorgangsbeschreibung* (auch Prozessbeschreibung): was getan wird, wie oft und wie dringend, welche Daten dabei gelesen oder geändert werden und in welchem Umfang.

| Vorgang | Auslöser und Häufigkeit | Dringlichkeit | gelesene/geänderte Daten | Umfang je Ausführung |
|---|---|---|---|---|
| Ausfahrt eintragen | vor jeder Ausfahrt, bis 40/h an Sommerabenden | hoch | Boot, Mitglieder, Datum | 1 Ausfahrt, bis 9 Teilnahmen |
| Schäden eines Boots anzeigen | Anfrage der Bootswart:in, ca. 10/Tag, unter 2 s | hoch | Boot, Schaden | bis 20 Schäden |
| Jahreskilometer je Mitglied | Saisonende, 1/Jahr | niedrig | Mitglied, Ausfahrt, rudert mit | alle Ausfahrten eines Jahres |

## Konzeptioneller Entwurf

Der konzeptionelle Entwurf beschreibt die Miniwelt formal, aber unabhängig von Datenmodell und DBMS. Er sagt, *was* es gibt, nicht *wie* es gespeichert wird. Übliches Werkzeug ist das ER-Modell (Notation und Bausteine siehe t04), alternativ ein UML-Klassendiagramm. Aus den Informationsanforderungen werden Entitätstypen, Attribute, Beziehungstypen und Kardinalitäten. Ein Hilfsmittel dabei ist die Nominalextraktion aus dem Anforderungstext (siehe t04).

Bei mehreren Benutzergruppen modelliert man meist zuerst **je Sicht ein Teilschema** und führt diese anschließend zusammen (nächster Abschnitt). Für die Richtung gibt es drei Strategien:
- ***Top-down*:** von zentralen Oberbegriffen ausgehen und sie per Spezialisierung verfeinern.
- ***Bottom-up*:** gefundene Entitätstypen und Attribute sammeln und per Generalisierung zu Oberbegriffen zusammenfassen.
- ***Inside-out*:** ein vorhandenes Modell weiterverwenden und erweitern.

Generalisierung und Spezialisierung sind in t04 beschrieben.

**Ergebnis** ist das integrierte ER-Diagramm (im Kurs in Chen-Notation, an jeder Kante zusätzlich die (min,max)-Angabe) mit einer textlichen Beschreibung. Dazu gehören Integritätsbedingungen, die das Diagramm nicht zeigt, etwa „km zwischen 1 und 200“. Weil das Modell ohne Technik auskommt, kann die Fachseite es gegenlesen. Es ist die gemeinsame Sprache von Fachseite und Entwicklung.

## Sichtenintegration (Konsolidierung)

Die **Sichtenintegration** (*view integration*, auch Konsolidierung) führt die Teilschemata aller Benutzergruppen zu **einem** widerspruchs- und redundanzfreien konzeptionellen Gesamtschema zusammen. Sie gehört zum konzeptionellen Entwurf. Nötig ist sie, weil jede Gruppe nur ihren Ausschnitt kennt, eigene Begriffe verwendet und Dinge anders modelliert. Legt man die Sichten einfach nebeneinander, entstehen doppelte, vermischte oder widersprüchliche Entitätstypen.

Im Ruderclub liegen drei Sichten vor:

![Drei Einzelsichten des Ruderclubs (Bootswart:in, Kassenwart:in, Trainer:in) in Chen-Notation mit (min,max)](diagrams/ruderclub-sichten.dot)

**Vorgehen in vier Schritten** (Zusammenfassung dieses Kurses; offene Quellen beschreiben vor allem das Angleichen der Schemata vor dem Zusammenführen):
1. Sichten vergleichen und Konflikte erkennen.
2. Konflikte mit der Fachseite klären und auflösen.
3. Zusammenführen: Gemeinsame Elemente werden nur einmal aufgenommen, überflüssige Beziehungen gestrichen.
4. Gesamtschema prüfen: Ist jede Anforderung jeder Sicht noch darstellbar?

**Konfliktarten.** Der Kurs unterscheidet fünf Arten. Zu jeder ist ein Beispiel aus den drei Sichten angegeben:

| Konfliktart | Bedeutung | im Ruderclub | Auflösung |
|---|---|---|---|
| **1. Namenskonflikt: Synonym** | verschiedene Namen, dieselbe Sache | Ruderer:in (A) und Mitglied (B): Ins Fahrtenbuch dürfen sich nur Mitglieder eintragen, die Mengen sind gleich. | ein Name („Mitglied“), Attribute vereinigen, ins Glossar |
| **1. Namenskonflikt: Homonym** | gleicher Name, verschiedene Sachen | „Fahrt“ ist in A eine Ausfahrt im Boot (Datum, km), in B eine Vereinsreise (Ziel, Kosten). | umbenennen in **Ausfahrt** und **Vereinsreise** |
| **2. Typkonflikt** | dasselbe Element, unterschiedliche Darstellung bzw. Codierung, auch unterschiedliche Einheiten oder Genauigkeit | Mitgl.-Nr. in C als Zahl 417, in B als Text „RC-0417“; ebenso eine Bootslänge in m bzw. cm | eine Darstellung festlegen (hier Zahl), Altwerte umrechnen, das Präfix „RC-“ nur bei der Anzeige ergänzen |
| **3. Wertebereichskonflikt** | gleiche Darstellung, aber unterschiedliche zulässige Werte | Bootsklasse: A kennt nur Rennbootklassen (1x, 2x, 4x+, 8+), C zusätzlich Gig-Boote (z. B. C4x+). | mit der Fachseite klären; hier die Vereinigung beider Wertemengen, weil der Club beide Bootsarten besitzt |
| **4. Bedingungskonflikt** | unterschiedliche Integritätsbedingungen, v. a. Schlüssel und Kardinalitäten | A identifiziert Ruderer:innen über den Namen, B Mitglieder über die Mitgl.-Nr. | Mitgl.-Nr. wird Schlüssel, weil Namen nicht eindeutig sind (zwei Personen namens Jonas Weber) |
| **5. Strukturkonflikt** | derselbe Sachverhalt mit verschiedenen Modellelementen | Bootsklasse: in A Attribut von Boot, in C Entitätstyp | auf die ausdrucksstärkere Form einigen: Entitätstyp, weil Bootsklasse eigene Attribute (Plätze) und Beziehungen hat |

**Faustregel dieses Kurses** zur Abgrenzung von Typ- und Wertebereichskonflikt: Lassen sich die Werte der einen Sicht eindeutig in die der anderen umrechnen, ist nur die Darstellung verschieden, also ein Typkonflikt. Sind in einer Sicht Werte erlaubt, die die andere ausschließt, liegt ein Wertebereichskonflikt vor.

**Ober- und Unterbegriffe** (*Hyperonym/Hyponym*) werden ebenfalls bereinigt. „Sportler:in“ aus Sicht C meint nur die trainierenden Mitglieder, also eine **Teilmenge** von „Mitglied“. Das ist kein Synonym. Aufgelöst wird über den Oberbegriff:
- entweder Mitglied mit optionaler Teilnahme (0,1) an der Beziehung zur Trainingsgruppe,
- oder eine Spezialisierung Sportler:in is-a Mitglied (t04).

Wer die (1,1) aus Sicht C ungeprüft auf alle Mitglieder überträgt, kann keine Fördermitglieder mehr speichern.

**Varianten der Einteilung:** Manche Darstellungen sprechen allgemein von struktureller und semantischer Heterogenität. Ober- und Unterbegriffe werden teils als eigene Art, teils bei den Namenskonflikten geführt. Wichtig ist, dass der Konflikt erkannt, benannt und begründet aufgelöst wird.

Nach der Auflösung entsteht das Gesamtschema. Der Beziehungstyp zwischen Mitglied und Trainingsgruppe heißt dort „ist in“, damit er sich von „gehört zu“ zwischen Boot und Bootsklasse unterscheidet.

![Integriertes Gesamtschema des Ruderclubs in Chen-Notation mit (min,max)](diagrams/ruderclub-gesamtschema.dot)

**Nicht verwechseln:** „Sicht“ meint hier das Teilschema einer Benutzergruppe im Entwurf. Eine SQL-View (`CREATE VIEW`, t12) ist eine gespeicherte Abfrage in der fertigen Datenbank. Die Brücke zwischen beiden: Benutzersichten werden als externe Schemata entworfen und in der Phase Datendefinition als Views samt Rechten beschrieben. Die Views setzen die Sichten also um, sie sind aber nicht die Integration selbst.

## Logischer Entwurf

Der logische Entwurf übersetzt das konzeptionelle Gesamtschema in das Datenmodell des Ziel-DBMS, im Kurs das relationale Modell. Er hängt vom Datenmodell ab, nicht vom Produkt. Die Arbeitsschritte sind in eigenen Themen beschrieben:

- ER-Modell nach festen Regeln in Relationen mit Primär- und Fremdschlüsseln überführen (t06),
- Relationen normalisieren (t07),
- Integritätsbedingungen als Schlüssel, `NOT NULL`, `UNIQUE` und `CHECK` formulieren (t05).

**Ergebnis** ist ein normalisiertes Relationenschema, im Ruderclub zum Beispiel:

- mitglied(<u>mitgl_nr</u>, name, iban, beitragsgruppe, geburtsjahr, steuerberechtigung, gruppenname → trainingsgruppe)
- ausfahrt(<u>fahrt_nr</u>, datum, km, bootsname → boot)
- rudert_mit(<u>mitgl_nr → mitglied, fahrt_nr → ausfahrt</u>)

Hier zeigt sich die Wirkung der Kardinalitäten: Die (0,1) aus der Sichtenintegration macht gruppenname zu einer Spalte, die `NULL` sein darf.

**Datentypen über die Phasen hinweg.** Fachliche Typ- und Längenangaben werden schon in der Anforderungsanalyse erhoben („Text, 30 Zeichen“). Im logischen Schema genügt eine grobe Angabe wie Zahl, Text oder Datum. Die DBMS-Datentypen wie `VARCHAR(34)` legt im Kursstandard die Datendefinition fest.

*Varianten:*
- Manche Darstellungen ergänzen Feldformate schon im logischen Schema.
- Andere legen Datentypen und DDL-Skript erst im physischen Entwurf fest.
- Wieder andere notieren das logische Schema direkt als DDL.

## Datendefinition

In der Datendefinition wird aus dem Relationenschema samt den Benutzersichten ein ausführbares Skript für das gewählte **DBMS**, im Kurs in der DDL von Firebird 3 (t09). Manche Darstellungen geben der Sprache für Sichten und der für interne Speicherstrukturen eigene Namen. In SQL-Systemen gehen beide in der DDL auf. Festgelegt werden:

- Tabellen mit DBMS-Datentypen und Längen (IBAN als `VARCHAR(34)`, km als `SMALLINT`),
- Integritätsbedingungen: Primär- und Fremdschlüssel, `NOT NULL`, `UNIQUE`, `CHECK` (km zwischen 1 und 200) und Vorgabewerte (t05, t09),
- Domänen sowie Generatoren bzw. Sequenzen für künstliche Schlüssel,
- **externe Schemata**: Views für die Benutzersichten (t12) und Zugriffsrechte (t13). Ein Beispiel ist eine View auf die Mitglieder ohne IBAN für die Trainer:innen, während nur die Kasse die IBAN lesen darf.

**Ergebnis** ist ein DDL-Skript mit `CREATE TABLE`, `CREATE VIEW`, `GRANT` usw. Es beschreibt alle Tabellen, Constraints, Sichten und Rechte.

## Physischer Entwurf

Der physische Entwurf betrifft die **interne Ebene**: wie die Daten gespeichert und wie schnell sie gefunden werden. Die Bedeutung der Daten ändert er nicht. Grundlage sind vor allem die Verarbeitungsanforderungen mit ihren Häufigkeiten und Antwortzeiten. Festgelegt werden:

- **Indexe** als Zugriffspfade für häufige oder zeitkritische Zugriffe. Ein Beispiel ist ein Index auf die Bootsspalte der Schadensmeldungen, weil die Bootswart:in die Schäden eines Boots in unter 2 Sekunden sehen will (t12).
- Speicherorganisation und physische Parameter, z. B. Seitengröße, Datenbankdateien und Puffergröße,
- Maßnahmen zur Leistungsoptimierung, gegebenenfalls eine bewusste, begründete Denormalisierung (t07).

Manche Darstellungen planen hier auch die Datensicherung. Im Kurs gehört sie zu Betrieb und Wartung.

Technisch ist auch `CREATE INDEX` eine DDL-Anweisung. Zum physischen Entwurf gehört der Index trotzdem, weil er nur den Zugriff beschleunigt und auf der internen Ebene wirkt.

**Ergebnis** ist ein Index- und Speicherkonzept mit den zugehörigen Anweisungen und Parametern.

## Implementierung und Wartung

Bei der **Implementierung** wird die Datenbank tatsächlich erstellt:

- Die Skripte aus Datendefinition und physischem Entwurf werden ausgeführt. Danach existieren Tabellen, Constraints, Views und Indexe, aber noch keine Daten.
- Daten werden geladen oder aus Altbeständen übernommen, etwa die Mitgliederliste aus der bisherigen Tabellenkalkulation. Bei großen Importen setzt man Prüfungen manchmal zeitweise aus und schaltet sie danach wieder ein.
- Benutzer werden eingerichtet und erhalten ihre Rechte.
- Die Anwendungsprogramme (die App) werden entwickelt bzw. angebunden (t13).

**Betrieb und Wartung** umfassen die Pflege der laufenden Datenbank:

- neue Anforderungen umsetzen (der Club führt eine Bootsreservierung ein),
- Fehler beheben,
- Leistung verbessern (zusätzlicher Index),
- DBMS-Updates einspielen und Daten sichern.

Schemaänderungen laufen über `ALTER TABLE` (t09). Jede größere Änderung durchläuft die Phasen im Kleinen erneut: Anforderung klären, Modell anpassen, umsetzen, prüfen. Auch dabei werden die Dokumente nachgezogen.

## Validierung als Querschnittsaufgabe

**Validierung** prüft, ob ein Ergebnis die Anforderungen erfüllt. Sie ist keine Phase am Ende, sondern begleitet jede Phase. Je früher ein Fehler auffällt, desto weniger Arbeit hängt bereits an ihm.

Drei Vorgehensweisen ergänzen sich:
- **Testen mit Probedaten:** Man spielt ausgedachte Datensätze ein und beobachtet das Verhalten. Wird eine Ausfahrt mit 0 km abgewiesen? Stimmen die Summen der Auswertungen? Reicht die Antwortzeit?
- **Prototyping:** Die Fachseite probiert eine vorläufige Version aus, bevor endgültig implementiert wird, z. B. eine einfache Eingabemaske für „Ausfahrt eintragen“ auf einem Testschema. Ihre Rückmeldung präzisiert die Anforderungen früh.
- **Formale Prüfung:** Man belegt Eigenschaften des Schemas mit der Theorie, etwa die 3NF anhand der funktionalen Abhängigkeiten oder die Verlustfreiheit einer Zerlegung (t07). Streng genommen ist das eine Verifikation, also eine Prüfung gegen Regeln statt gegen die Wünsche der Fachseite.

Was in welcher Phase geprüft wird:

| Phase | typische Prüfung |
|---|---|
| Anforderungsanalyse | Die Stakeholder prüfen die Spezifikation auf Vollständigkeit und Richtigkeit. |
| konzeptioneller Entwurf | Ist jede Informationsanforderung im Modell wiederzufinden, nichts doppelt, keine Beziehung redundant (t04)? Lässt sich jede Verarbeitungsanforderung beantworten (die Kilometersumme je Mitglied über „rudert mit“ und Ausfahrt)? Die Fachseite liest das Modell gegen. |
| logischer Entwurf | formale Prüfung der Normalform und der Verlustfreiheit |
| Datendefinition | Testschema mit Probedaten: Greifen Constraints, Rechte und Views für jede Benutzergruppe? Prototyp für die Fachseite |
| physischer Entwurf | Antwortzeiten mit realistischen Datenmengen messen |
| Implementierung und Wartung | Testbetrieb mit übernommenen Altdaten, Abnahme durch die Fachseite, erneute Tests nach Änderungen |

## Ergebnisdokumente je Phase

| Phase | Ergebnisdokument | Vertiefung |
|---|---|---|
| Anforderungsanalyse | Anforderungsspezifikation: Abgrenzung der Miniwelt, Stakeholder und Benutzergruppen, Objekt-, Beziehungs- und Prozessbeschreibungen, Glossar; je nach Vorgehen Lasten- und Pflichtenheft oder User Stories | dieses Thema |
| konzeptioneller Entwurf | Sichten als Teil-ER-Modelle, integriertes ER-Diagramm mit Beschreibung und Integritätsbedingungen | t04 |
| logischer Entwurf | normalisiertes Relationenschema mit Primär- und Fremdschlüsseln und Integritätsbedingungen | t05, t06, t07 |
| Datendefinition | DDL-Skript: Tabellen mit Datentypen, Schlüsseln und Constraints, Generatoren, Views und Rechte | t09, t12, t13 |
| physischer Entwurf | Index- und Speicherkonzept (Zugriffspfade, physische Parameter), ggf. begründete Denormalisierung | t07, t12 |
| Implementierung und Wartung | angelegte und befüllte Datenbank, Import- bzw. Migrationsskripte, angebundene Anwendung; später Änderungsanträge und geänderte Skripte (`ALTER TABLE`) | t09, t11, t13 |
| begleitend: Validierung | Prüfprotokolle je Phase: Testprotokolle, Rückmeldungen zum Prototyp, Nachweise, Abnahme | t04, t07 |

## Auf einen Blick

- Kursstandard mit sechs Phasen: Anforderungsanalyse → konzeptioneller Entwurf → logischer Entwurf → Datendefinition → physischer Entwurf → Implementierung und Wartung. Die Validierung begleitet alle Phasen. Rücksprünge sind normal, die Dokumente werden nachgezogen.
- Das konzeptionelle Schema ist unabhängig von Datenmodell und DBMS, das logische hängt vom Datenmodell ab, Datendefinition und physischer Entwurf hängen vom Produkt ab.
- Varianten: sieben Phasen ohne Datendefinition und mit eigener Validierungsphase, physischer Entwurf als Teil der Implementierung, *analysis* als Name des konzeptionellen Schritts, „konzeptionell“ für das technische Modell (ER-Modell = semantisches Modell), Verteilungsentwurf, Drei- und Zwei-Schritt-Darstellungen; konzeptionell = konzeptuell.
- ANSI-SPARC: In der engen Lesart ist die konzeptionelle Ebene das DBMS-Gesamtschema, in der weiten gehört schon das ER-Schema dazu. In beiden sind Benutzersichten externe Schemata und der physische Entwurf die interne Ebene.
- Die Anforderungsanalyse ist Teil des Requirements Engineering (ermitteln, analysieren, spezifizieren, validieren). Sie grenzt die Miniwelt ab und bestimmt Stakeholder und Sichten. Erhoben wird über Gespräche, Unterlagen, Beobachtung, Use Cases und User Stories. Ein Glossar vereinheitlicht die Begriffe.
- Datenanalyse liefert Informationsanforderungen (Bestand inklusive Integritätsbedingungen), Funktionsanalyse liefert Verarbeitungsanforderungen (Vorgänge mit Häufigkeit, Zeit, Menge, Berechtigung; auch Datenverarbeitungs- bzw. Bearbeitungsanforderungen). Festgehalten wird beides in Objekt-, Beziehungs- und Prozessbeschreibungen.
- Sichtenintegration führt die Teilschemata im konzeptionellen Entwurf zu einem Gesamtschema zusammen. Konfliktarten: Namens- (Synonym/Homonym), Typ-, Wertebereichs-, Bedingungs- und Strukturkonflikte. Ober- und Unterbegriffe werden über Oberbegriff oder Spezialisierung bereinigt. Vor dem Gleichsetzen die Objektmengen prüfen.
- Sicht im Entwurf ≠ SQL-View (t12). Die Views setzen die Sichten in der Datendefinition um.
- Normalisierung gehört in den logischen Entwurf. Tabellen mit Datentypen, Constraints, Views und Rechte gehören in die Datendefinition. Indexe, Speicherparameter und eine eventuelle Denormalisierung gehören in den physischen Entwurf.
- Prüfen lässt sich durch Testen mit Probedaten, durch Prototyping und durch formale Prüfung (streng genommen Verifikation). Wartung heißt, die Phasen im Kleinen erneut zu durchlaufen.
