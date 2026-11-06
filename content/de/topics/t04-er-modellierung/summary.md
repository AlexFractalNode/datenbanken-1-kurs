---
id: t04
lang: de
title: ER-Modellierung
order: 4
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: wp-entity-relationship-modell
    ref: "Abschnitte „Begriffe“ (Grundlegende Komponenten; Besondere Sachverhalte: Grad, Kardinalität, schwache Entitätstypen, rekursive Beziehungen), „Beziehungen mit spezieller Semantik“ (Spezialisierung und Generalisierung mittels is-a: Teilmenge, total, partiell, disjunkt, überlappend; Aggregation und Zerlegung mittels is-part-of: Aggregat, Komponente, Rollen- und Mengenaggregation), „ER-Diagramme“ (Liste der Notationsformen: MC-Notation, (min,max)-Notation nach Abrial 1974)"
  - id: wpen-entity-relationship-model
    ref: "Sections „Components“ (entity sets, relationship sets as mathematical relations; roles; cardinalities: double line = total participation, look-across vs. same-side, Abrial (min,max)), „Related diagramming convention techniques“ (Crow's foot notation), Abschnitt zu Modellierungsproblemen (fan trap, chasm trap)"
  - id: oer-informatik-erm
    ref: "Abschnitte „Entitätstyp“, „Attribut“ (optional/verpflichtend), „Beziehungstyp“, „Wo steht welche Zahl? Kardinalitäten lesen“, „Feste Anzahlen und Optionalität“ (erweiterte Chen-Notation 1, C, N, M, NC, MC), „Besondere Beziehungstypen“, „Erweiterte Notationsmittel …“ (mehrwertige/abgeleitete Attribute, schwache Entitätstypen, schwacher Schlüssel), „Notation … nach Martin und Chen“, „Zeiträume und Verläufe: die Historie modellieren“, „Schlüssel im ER-Diagramm kennzeichnen“ (Fremdschlüssel nur auf Auftrag), „Typische Fehler“"
  - id: oer-informatik-relationenmodell
    ref: "Abschnitte „Transformationsschritte – Primärschlüssel wählen“ (Schlüsselkandidaten, natürlicher vs. künstlicher Schlüssel) und „Kardinalitäten in Fremdschlüssel transformieren“ (M:N mit zusammengesetztem Schlüssel)"
  - id: inf-schule-datenbanksysteme
    ref: "Entwurf von Datenbanken, Unterseite https://inf-schule.de/datenbanksysteme/ermodelle/kardinalitaet (je Leserichtung ein Satz; Unter- und Obergrenze), am 2026-11-05 live abgerufen; nicht im Quellen-Cache"
  - id: wp-schluessel-datenbank
    ref: "Abschnitte „Einführung“ (Superschlüssel), „Schlüsselkandidat“, „Primärschlüssel und Alternativschlüssel“, „Sekundärschlüssel“, „Stellvertretender Schlüssel“, „Fremdschlüssel“"
  - id: wp-normalisierung-datenbank
    ref: "Abschnitte zur zweiten und dritten Normalform (Begriff Nichtschlüsselattribut)"
  - id: wpen-database-normalization
    ref: "Section „Normal forms“ (non-prime attribute)"
  - id: wpen-relational-model
    ref: "Sections „Conceptualization – Constraints – Keys / Foreign keys“, „Set-theoretic formulation“ (relation as subset of a Cartesian product)"
  - id: watt-database-design-2e
    ref: "Kap. 8 The Entity Relationship Data Model (weak entity als existence-dependent). Direktabruf nicht möglich (HTTP 403), Angabe nur über Suchauszug geprüft; ergänzende Quelle, Kernaussagen anderweitig belegt"
  - id: wp-datenmodellierung
    ref: "Abschnitte „Verfahren“ (konzeptuelles Schema) und „Methoden“"
  - id: wp-unified-modeling-language
    ref: "Abschnitt „Spracheinheiten – Klassen“ (Multiplizität mit unterer und oberer Schranke)"
  - id: wp-temporale-datenbank
    ref: "Abschnitt „Kriterien“ (Gültigkeitszeit, Transaktionszeit, Zeitstempelung)"
  - id: wp-sql
    ref: "Abschnitt zu NULL (fehlender Wert)"
---

# ER-Modellierung

## Lernziele

Nach diesem Thema kannst du …

- die Bausteine eines ER-Modells (Entitätstyp, Attribut, Beziehungstyp, Schlüssel) benennen, in **Chen-Notation** zeichnen und jeweils mit einem eigenen Beispiel erklären,
- Kardinalitäten in Chen-Notation und in **(min,max)-Notation** angeben und in beide Richtungen umrechnen, auch ohne Anforderungstext nach der Standardkonvention des Kurses (Detail-Seite einer 1:n-Beziehung (1,1), sonst min = 0),
- schwache Entitätstypen, Existenzabhängigkeit, Teilnahmebeschränkung, Rollen, rekursive und n-äre Beziehungen erkennen und darstellen,
- Generalisierung/Spezialisierung und Aggregation (Teil-Ganzes) einsetzen und auseinanderhalten,
- Zeitbezug (Historie über Gültigkeitszeiträume) im Modell abbilden,
- aus einem Text oder aus Beispieltabellen ein ER-Diagramm erstellen, ein gegebenes Diagramm lesen und Modellierungsfehler finden.

## Wozu ein ER-Modell?

Das *Entity-Relationship-Modell* (ER-Modell, ERM; deutsch auch *Gegenstands-Beziehungs-Modell*) beschreibt einen Ausschnitt der realen Welt, die *Miniwelt*, auf der **konzeptuellen Ebene**: Welche Dinge gibt es, welche Eigenschaften haben sie, wie hängen sie zusammen? Tabellen, Datentypen und DBMS kommen erst im nächsten Schritt hinzu, wenn das Modell in ein relationales Schema überführt wird (Thema t06). Ein ER-Modell besteht aus dem Diagramm (ERD) und einer kurzen textlichen Beschreibung. Ein um Generalisierung, Aggregation u. Ä. ergänztes Modell heißt oft *erweitertes ER-Modell* (EERM).

Durchgehendes Beispiel ist eine **Imkerei**: Imker:innen betreuen Bienenvölker, kontrollieren sie und stellen sie an Standorten auf.

## Entität, Entitätstyp und Attributarten

Eine **Entität** (*entity*) ist ein einzelnes, eindeutig unterscheidbares Objekt der Miniwelt, etwa das Bienenvolk Nr. 17. Alle gleichartigen Entitäten bilden einen **Entitätstyp** (*entity type*), hier `Bienenvolk`. Die Menge der aktuell vorhandenen Entitäten eines Typs heißt **Entitätsmenge** (*entity set*). Im Diagramm ist ein Entitätstyp ein **Rechteck**, benannt im Singular.

**Attribute** (*attributes*) beschreiben Eigenschaften eines Entitäts- oder Beziehungstyps und hängen als **Ellipse** daran. Die Attributarten bilden Gegensatzpaare. Jedes Paar beantwortet eine eigene Frage, ein Attribut hat also aus jeder Zeile genau eine Eigenschaft:

| Frage | Gegensatzpaar | Beispiel (Imker:in) | Darstellung |
|---|---|---|---|
| Hat der Wert Teile? | **einfach/atomar** (*simple*) vs. **zusammengesetzt** (*composite*) | Geburtsdatum vs. Name = Vorname + Nachname | Ellipse vs. Ellipse mit Unter-Ellipsen |
| Wie viele Werte je Entität? | **einwertig** (*single-valued*) vs. **mehrwertig** (*multivalued*) | Geburtsdatum vs. Telefon (Festnetz, Handy) | Ellipse vs. doppelte Ellipse |
| Gespeichert oder berechnet? | **gespeichert** (*stored*) vs. **abgeleitet** (*derived*) | Geburtsdatum vs. Alter | Ellipse vs. gestrichelte Ellipse |
| Muss ein Wert vorhanden sein? | **Pflichtattribut** (*mandatory*) vs. **optionales Attribut** (*optional*) | Name vs. Mitgliedschaft im Imkerverein | kein einheitliches Symbol, z. B. Zusatz „(0,1)“ oder „opt.“ an der Attributkante |

Ein **optionales Attribut** darf bei einzelnen Entitäten fehlen. Ob ein Attribut Pflicht ist, legt die Anforderungsanalyse fest („muss angegeben werden“ vs. „falls vorhanden“). In der späteren Tabelle steht ein fehlender Wert als `NULL`; Pflichtattribute werden dort zu `NOT NULL`-Spalten.

![Grundmodell Imkerei in Chen-Notation mit einfachen, zusammengesetzten, mehrwertigen und abgeleiteten Attributen](diagrams/imkerei-grundmodell.dot)

**Notationsvariante:** Manche Quellen zählen auch Sammelattribute wie eine Adresse (Straße, PLZ, Ort) zu den mehrwertigen und zeichnen sie mit doppelter Ellipse. Dieser Kurs trennt streng: *mehrwertig* = mehrere Werte derselben Art, *zusammengesetzt* = ein Wert aus mehreren Teilen.

**Entität oder Attribut?** Eine Information wird zum eigenen Entitätstyp, wenn sie selbst Eigenschaften hat, an Beziehungen teilnimmt oder als einheitliche Auswahlliste gepflegt werden soll. Die Bienenrasse bleibt Attribut, solange nur ihr Name zählt. Sollen auch Herkunft und Sanftmut-Bewertung gespeichert werden, wird `Bienenrasse` ein Entitätstyp.

## Schlüsselarten

Ein Schlüssel identifiziert jede Entität eines Typs eindeutig. Im ER-Diagramm wird der gewählte Schlüssel **unterstrichen** (bei einem zusammengesetzten Schlüssel alle beteiligten Attribute).

- **Superschlüssel** (*superkey*): jede Attributmenge, deren Werte die Entitäten eindeutig unterscheiden – sie darf überflüssige Attribute enthalten. Beispiel Bienenvolk: {Volk-Nr., Bienenrasse} ist ein Superschlüssel, weil schon die Volk-Nr. allein eindeutig ist.
- **Schlüsselkandidat / Kandidatenschlüssel** (*candidate key*): ein **minimaler** Superschlüssel – lässt man ein Attribut weg, geht die Eindeutigkeit verloren. Ein Entitätstyp kann mehrere Kandidaten haben, z. B. Volk-Nr. und die amtliche Stockkarten-Nummer.
- **Primärschlüssel** (*Primary Key*): der eine Kandidat, der ausgewählt wird. Er sollte kurz sein und sich nie ändern. Die übrigen Kandidaten heißen **Alternativschlüssel** (*alternate keys*). **Variante:** Manche Darstellungen nennen sie auch *Sekundärschlüssel*. Andere verstehen unter Sekundärschlüssel allgemeiner jedes Suchattribut, das nicht eindeutig sein muss. Im Zweifel „Alternativschlüssel“ verwenden.
- **Schlüsselattribut** und **Nichtschlüsselattribut** (*non-key attribute*, auch *non-prime attribute*): Ein Attribut, das in mindestens einem Schlüsselkandidaten vorkommt, ist ein Schlüsselattribut. Alle übrigen Attribute sind Nichtschlüsselattribute. Beim Bienenvolk mit den Kandidaten {Volk-Nr.} und {Stockkarten-Nr.} sind Bienenrasse und Jahrgang der Königin Nichtschlüsselattribute. Der Begriff wird in der Normalisierung (t07) wichtig.
- **Künstlicher Schlüssel / Surrogatschlüssel** (*surrogate key*): ein zusätzlich eingeführtes Attribut ohne fachliche Bedeutung, etwa eine fortlaufende Nummer. Man nimmt ihn, wenn kein natürlicher Kandidat stabil, kurz und immer vorhanden ist. Der fachliche Schlüssel (*natural key*) bleibt dann als eindeutiges Attribut erhalten.
- **Fremdschlüssel** (*Foreign Key*), nur als Ausblick: In der Tabelle verweist ein Attribut auf den Primärschlüssel einer anderen (oder derselben) Tabelle. **Konvention:** Ins ER-Diagramm trägt man Fremdschlüssel grundsätzlich *nicht* ein, weil der Beziehungstyp die Verbindung schon ausdrückt. Sie entstehen bei der Überführung (t06). Verlangt eine Aufgabe sie ausdrücklich, markiert man sie (z. B. mit „FK“). Manche Beispieldiagramme zeigen die Schlüssel der Partner zusätzlich am abhängigen Typ oder an der Beziehung. Prüfe dann, ob das als Vorgriff auf die Überführung gemeint ist.

## Beziehungstypen und Kardinalitäten in Chen-Notation

Eine **Beziehung** (*relationship*) verbindet konkrete Entitäten („Imkerin Lea betreut Volk 17“). Gleichartige Beziehungen bilden einen **Beziehungstyp** (*relationship type*, auch *Relationstyp*). Er wird als **Raute** gezeichnet und mit den beteiligten Entitätstypen verbunden. Auch ein Beziehungstyp kann Attribute haben, etwa „betreut seit“. So ein Wert beschreibt das Paar aus Imker:in und Volk, nicht einen der beiden für sich. Bei m:n lässt er sich keinem Partner zuordnen, bei 1:n könnte er technisch auch an der n-Seite stehen; fachlich sauber ist die Raute.

**Formale Sicht.** Die Menge aller aktuellen Beziehungen eines Typs (*Beziehungsmenge*, *relationship set*) ist eine mathematische Relation, also eine Teilmenge des kartesischen Produkts der beteiligten Entitätsmengen: `betreut ⊆ Imker:in × Bienenvolk`. Jede Beziehung ist ein Tupel, z. B. (Lea, Volk 17). Bei drei Partnern gilt `R ⊆ E1 × E2 × E3`. Folge: Als Element einer Menge kommt dasselbe Tupel höchstens **einmal** vor. Soll sich eine Kombination wiederholen (ein Volk kehrt an denselben Standort zurück), reicht ein Attribut an der Raute dafür nicht. Man braucht einen eigenen Entitätstyp, entweder für die Zuordnung oder für die Zeit (siehe Zeitbezug).

**Identifikationsschlüssel eines Beziehungstyps.** Eine Beziehung ist durch die Schlüssel der beteiligten Entitäten eindeutig bestimmt. Bei `Imker:in besucht Kurs` (m:n) ist das die Kombination (Imker-Nr., Kurs-Nr.). Bei 1:n genügt der Schlüssel der n-Seite: Jedes Volk hat höchstens eine betreuende Imker:in, also identifiziert die Volk-Nr. die Beziehung `betreut`. Bei 1:1 genügt jeder der beiden Partnerschlüssel. Dieser Schlüssel wird nicht eigens ins ERD gezeichnet. Bei der Überführung wird er zum Primärschlüssel einer Beziehungstabelle.

Die **Kardinalität** (*cardinality*) gibt an, mit wie vielen Partnern eine Entität **höchstens** verbunden sein kann. Bei binären Beziehungen unterscheidet man:

- **1:1**: auf beiden Seiten höchstens ein Partner,
- **1:n**: links höchstens einer, rechts beliebig viele,
- **n:1**: dasselbe mit vertauschten Seiten. Beim Zeichnen ist das gleichwertig zu 1:n, beim Umrechnen kommt es auf die Seite an.
- **m:n** (auch n:m geschrieben): auf beiden Seiten beliebig viele.

**Leseregel Chen (*look-across*):** Die Angabe an der Kante bei A sagt, wie viele A-Entitäten zu **einer** Entität am anderen Ende gehören. Deshalb steht die „1“ bei `Imker:in` (ein Volk hat höchstens eine Imker:in) und das „n“ bei `Bienenvolk` (eine Imker:in hat viele Völker). Zur Probe hält man eine Entität fest und zählt ihre Partner, und zwar in **beiden** Richtungen, denn Anforderungstexte nennen oft nur eine. Den Beziehungsnamen wählt man als Verb so, dass er in Leserichtung des Diagramms (links nach rechts, oben nach unten) einen Satz ergibt: „Imker:in *betreut* Bienenvolk“. Passt das nicht, kennzeichnet ein kleiner Pfeil am Namen die Leserichtung.

**Teilnahmebeschränkung (*participation constraint*).** Die reine Chen-Notation zeigt nur Obergrenzen. Ob jede Entität an der Beziehung teilnehmen *muss*, wird eigens dargestellt:
- **totale Teilnahme** (*total participation*, Pflicht): Jede Entität nimmt an mindestens einer Beziehung teil. Gezeichnet als **Doppellinie** zwischen Rechteck und Raute, entspricht min ≥ 1.
- **partielle Teilnahme** (*partial participation*, optional): einfache Linie, entspricht min = 0.

Diese Lesart der einfachen Linie gilt nur in Diagrammen, die Teilnahme durchgängig kennzeichnen. Ein reines Chen-Diagramm ohne jede Teilnahmeangabe liest der Kurs nach der Standardkonvention im nächsten Abschnitt.

Beispiel: Jedes Volk *muss* betreut werden, also Doppellinie zwischen `Bienenvolk` und `betreut`. Eine Imker:in darf (noch) ohne Volk sein, also einfache Linie.

![Teilnahmebeschränkung: Doppellinie bei totaler, einfache Linie bei partieller Teilnahme](diagrams/teilnahme-imkerei.dot)

**Achtung, Begriffskollision:** „total/partiell“ heißt auch eine Eigenschaft der Spezialisierung, nämlich ob jede Entität des Obertyps zu einem Subtyp gehört (siehe unten). Die Teilnahme betrifft eine **Beziehung**, die Spezialisierung die **is-a-Hierarchie**. Schreib in Antworten deshalb dazu, welches von beiden du meinst.

**Modifizierte Chen-Notation (MC-Notation).** Statt der Doppellinie schreibt diese Variante die Optionalität direkt an die Kante. Gängige Symbole: `1` (genau eins), `c` (kein oder eins), `m` bzw. `n` (mindestens eins, beliebig viele) und `mc` bzw. `nc` (beliebig viele, auch keins). Feste Obergrenzen dürfen als Zahl stehen (z. B. 2 statt n). **Notationsvarianten:** Der Name schwankt zwischen „modifiziert“ (MC-Notation), „erweitert“ und Namen nach den Symbolen (z. B. „1-c-m-mc-Notation“). Manche schreiben `cn` statt `nc`. Vor allem bedeutet das Viele-Symbol nicht überall dasselbe: In der MC-Notation heißt `m`/`n` „mindestens eins“, in anderen Darstellungen schließt dasselbe Symbol die Null ein. Lies bei fremden Diagrammen deshalb zuerst die Legende.

## (min,max)-Notation und Umrechnung zur Chen-Notation

Die **(min,max)-Notation** geht auf J.-R. Abrial (1974) zurück. Sie fragt: *An wie vielen Beziehungen dieses Typs nimmt eine Entität mindestens und höchstens teil?* Die Angabe steht **beim eigenen Entitätstyp** (*same-side*). `min = 0` bedeutet optional, `min ≥ 1` Pflicht. Für „beliebig viele“ sind `n`, `m` und `*` gleichwertig; viele Darstellungen schreiben durchgängig den Stern, also `(0,*)`. Auch das Trennzeichen variiert: `(0,*)`, `(0:*)` oder `[0;*]` meinen dasselbe.

![Dieselbe Beziehung in Chen-Notation und in (min,max)-Notation](diagrams/kardinalitaet-chen-vs-minmax.dot)

Im Beispiel betreut eine Imker:in 0 bis beliebig viele Völker, also `(0,*)` **bei Imker:in**. Jedes Volk hat genau eine Imker:in, also `(1,1)` **bei Bienenvolk**. Das entspricht hier zugleich der Standardkonvention für 1:n (siehe unten). Die Chen-„1“ steht dagegen bei Imker:in. Bei binären Beziehungen erscheinen die Obergrenzen also **vertauscht**.

**Umrechnungsregeln (binäre Beziehung A — R — B):**

1. **Chen → (min,max), Obergrenzen:** Die Chen-Angabe bei **B** wird zum **max** bei **A**, und umgekehrt.
2. **Untergrenzen:** Gibt der Anforderungstext sie her, gilt der Text („muss“, „genau“, „mindestens“ → min ≥ 1; „kann“, „höchstens“, „auch keine“ → 0). Eine Doppellinie bedeutet min ≥ 1. Fehlt jede Angabe, gilt die Standardkonvention unten.
3. **(min,max) → Chen:** Das **max** bei A wird zur Chen-Angabe bei B; ein max > 1 wird zu n bzw. m (oder bleibt als feste Zahl). Das min geht in der reinen Chen-Notation verloren. Erhalten bleibt es nur mit Doppellinie oder MC-Notation.

**Standardkonvention dieses Kurses für reine Chen-Kardinalitäten.** Oft ist nur `1:1`, `1:n`, `n:1` oder `m:n` gegeben, ohne Text, ohne Doppellinie, ohne MC-Symbole. Dann gelten diese Default-Untergrenzen:

| Chen (A : B) | (min,max) bei A | (min,max) bei B |
|---|---|---|
| 1 : 1 | (0,1) | (0,1) |
| 1 : n (A = „1“-Seite/Master, B = „n“-Seite/Detail) | (0,*) | **(1,1)** |
| n : 1 (A = Detail, B = Master) | **(1,1)** | (0,*) |
| m : n | (0,*) | (0,*) |

Begründung: In einer 1:n-Beziehung gehört jede Entität der Detail-Seite standardmäßig zu **genau einem** Master. Ein Bienenvolk ohne betreuende Imker:in ist der Ausnahmefall, und Ausnahmen werden ausdrücklich angegeben: per Text („kann auch ohne …“), per MC-Symbol `c` oder über die Teilnahmeangabe. Bei 1:1 und m:n ist keine Seite als Detail ausgezeichnet, dort bleibt es bei min = 0.

Beispiel: `Imker:in —1— betreut —n— Bienenvolk` ohne weitere Angaben ergibt Imker:in (0,*), Bienenvolk (1,1). Heißt es im Text „ein Volk kann vorübergehend ohne Imker:in sein“, wird daraus Bienenvolk (0,1). Legt eine Aufgabe etwas anderes fest, gilt immer die Aufgabe.

**Variante anderer Quellen (nicht Kursstandard):** Manche Darstellungen setzen bei fehlenden Angaben überall min = 0 an, also auch für die Detail-Seite einer 1:n-Beziehung (0,1). Sie begründen das damit, dass reine Chen-Notation nichts über Pflicht aussagt. Wenn dir diese Lesart begegnet, erkennst du sie daran, dass die Quelle es so ausdrücklich festlegt. In diesem Kurs und in den Aufgaben gilt die Tabelle oben.

**Davon getrennt: die MC-Notation.** Dort sind die Symbole selbst schon mit Untergrenzen belegt. Die folgende Tabelle gilt **nur** für MC-Angaben, nicht für reine Chen-Kardinalitäten:

| MC-Angabe bei B | bedeutet für jede A-Entität | (min,max) bei A |
|---|---|---|
| 1 | genau ein B-Partner | (1,1) |
| c | kein oder ein B-Partner | (0,1) |
| m bzw. n | mindestens ein, beliebig viele | (1,n) |
| mc bzw. nc | beliebig viele, auch keiner | (0,n) |

Dasselbe Zeichen „1“ oder „n“ ergibt also je nach Notation eine andere Untergrenze. Schreib bei jeder Umrechnung dazu, welche Notation du liest.

Zur Kontrolle eine m:n-Beziehung: „Eine Imker:in besucht beliebig viele Imkerkurse (auch keinen); ein Kurs findet nur mit mindestens 4 und höchstens 12 Teilnehmenden statt.“ (min,max): Imker:in `(0,n)`, Kurs `(4,12)`. Chen: bei Imker:in das max von Kurs (12 bzw. m), bei Kurs das max von Imker:in (n).

**Bei n-ären Beziehungen** hilft bloßes Vertauschen nicht. Chen fragt dort: „Wie viele X gehören zu einer festen *Kombination* der übrigen Partner?“ (min,max) fragt weiterhin: „An wie vielen Beziehungen nimmt ein X teil?“ Die Werte können zufällig gleich sein, müssen es aber nicht.

**Weitere Notationen (Alternativen):** In der **Krähenfuß-Notation** (*crow's foot*, Martin-Notation) steht ein Strich für „1“, eine Gabel für „viele“ und ein Kreis bzw. eine 0 für „optional“. Attribute stehen als Liste im Rechteck, Beziehungen haben keine Raute und keine eigenen Attribute. Im **UML-Klassendiagramm** heißen die Angaben *Multiplizitäten* (z. B. `0..1`, `1`, `1..*`, `*`). Sie haben Unter- und Obergrenze, werden aber wie bei Chen **gegenüber** notiert. Prüfe bei jedem fremden Diagramm zuerst, welche Leserichtung gilt.

## Schwache Entitätstypen, Existenzabhängigkeit und Rollen

**Existenzabhängigkeit** (*existence dependency*): Eine Entität von A kann nur existieren, solange sie mit mindestens einer Entität von B in Beziehung steht. Im Diagramm zeigt sich das als **min ≥ 1** bei A, als Doppellinie oder als MC-Symbol ohne c. Beispiel: Ein Volk ohne betreuende Imker:in darf es nicht geben, also Bienenvolk (1,1).
- **einseitig:** Nur A ist abhängig, z. B. Bienenvolk (1,1), Imker:in (0,n). Eine Imker:in kann ohne Volk angelegt werden, ein Volk nur zusammen mit einer Imker:in.
- **wechselseitig:** Beide Seiten haben min ≥ 1. Beispiel: Eine Imker:in wird erst mit ihrem ersten Volk erfasst, also Imker:in (1,n), Bienenvolk (1,1). Praktische Folge: Die Imker:in und ihr erstes Volk müssen gemeinsam angelegt werden.

Ein **schwacher Entitätstyp** (*weak entity type*) hat drei Merkmale:
1. Er ist **existenzabhängig** von einem **identifizierenden (starken) Entitätstyp**, dem Besitzer (*owner*). In Formularen spricht man oft von *Master* (Besitzer) und *Detail* (schwacher Typ).
2. Seine Entitäten sind nur **zusammen mit dem Schlüssel des Besitzers** eindeutig identifizierbar.
3. Er hat deshalb **keinen eigenen vollständigen Primärschlüssel**, sondern nur einen **partiellen Schlüssel** (*partial key*, auch *schwacher Schlüssel* oder *Partialschlüssel*).

Die Verbindung zum Besitzer ist die **identifizierende Beziehung** (*identifying relationship*). **Quellenvarianten:** Manche Lehrbücher definieren den schwachen Typ allein über die Existenzabhängigkeit, andere allein über die geliehene Identifikation. Nenne in Prüfungen beide Merkmale. Die Umkehrung gilt nicht: Ein Bienenvolk ist existenzabhängig von seiner Imker:in, hat aber mit der Volk-Nr. einen eigenen Schlüssel. Es ist deshalb **nicht** schwach.

Beispiel: Jede **Durchsicht** eines Volks wird mit dem Datum erfasst. Ohne Volk gibt es keine Durchsicht. Das Datum allein ist nicht eindeutig, denn am 1. Mai werden viele Völker geprüft. Erst `Volk-Nr. + Datum` identifiziert eine Durchsicht; das Datum ist der partielle Schlüssel.

![Schwacher Entitätstyp Durchsicht mit identifizierender Beziehung](diagrams/schwache-entitaet-durchsicht.dot)

Notation: schwacher Entitätstyp mit **doppeltem Rahmen**, identifizierende Beziehung als **doppelte Raute**, totale Teilnahme des schwachen Typs als Doppellinie, partieller Schlüssel **gestrichelt unterstrichen**. Vom Besitzer aus ist die Beziehung fast immer 1:n, und jede schwache Entität hat genau einen Besitzer: (1,1).

Eine **Rolle** (*role*) beschreibt, in welcher Funktion ein Entitätstyp an einer Beziehung teilnimmt; der Rollenname steht an der Kante. Rollen sind Pflicht, sobald derselbe Entitätstyp mehrfach an einer Beziehung beteiligt ist. Sonst wäre nicht lesbar, welche Kante was bedeutet.

## Rekursive und n-äre Beziehungen

Der **Grad** (*degree*, auch Stelligkeit) eines Beziehungstyps ist die **Anzahl der beteiligten Entitätstypen**. Binär (Grad 2) ist der Normalfall, ternär (Grad 3) und mehr ist selten. **Begriffsfalle:** Manche Quellen nennen den Grad auch „Komplexität“. Andere meinen mit „Grad“ oder „Komplexität“ die Kardinalität (1:n usw.), also etwas ganz anderes. Achte auf den Zusammenhang.

- **Rekursive (reflexive) Beziehung:** Ein Entitätstyp ist mit sich selbst verbunden. Beide Kanten führen zum selben Rechteck und werden durch **Rollen** unterschieden. Da nur ein Entitätstyp beteiligt ist, ist sie nach obiger Zählung *unär* (Grad 1). Wer stattdessen die Rollen zählt, kommt auf 2. Viele Darstellungen führen rekursive Beziehungen deshalb als eigene Kategorie. Beispiel Tierheim: „Tier *ist Mutter von* Tier“ mit den Rollen **Mutter** (Chen 1) und **Jungtier** (Chen n). In (min,max): Mutter-Rolle `(0,n)`, Jungtier-Rolle `(0,1)`, denn die Mutter ist oft unbekannt.
  **Regel für hierarchische Rekursionen** (Mutter–Jungtier, Vorgesetzte:r–Mitarbeiter:in, Haupt- und Nebengipfel): **Beide** Rollen bekommen die Untergrenze **0**. Schon eine einzige Rolle mit min ≥ 1 verlangt, dass jede Entität in dieser Rolle einen Partner desselben Typs hat. Dann gäbe es keine Wurzel bzw. kein letztes Glied: Eine endliche Hierarchie wäre unmöglich, möglich blieben nur endlose Ketten oder ein Zyklus, der in einer Hierarchie fachlich unsinnig ist. min = 0 gehört also gerade an die Rolle, die „eigentlich“ Pflicht scheint (die oberste Mutter hat keine erfasste Mutter).
  **Abgrenzung:** Bei symmetrischen Rekursionen ohne Hierarchie (z. B. „Spieler:in spielt im Doppel mit Spieler:in“ oder „Tanzpartner:in von“) sind Zyklen fachlich sinnvoll. Dort kann min ≥ 1 zulässig sein, etwa wenn nur erfasst wird, wer schon einen Partner hat.
- **Binäre Beziehung:** zwei verschiedene Entitätstypen.
- **n-äre Beziehung** (ternär bei drei): Eine Raute verbindet drei oder mehr Entitätstypen. Beispiel: „Eine Imker:in setzt an einem Standort ein bestimmtes Mittel gegen Varroa-Milben ein.“ Die Tatsache entsteht erst aus der *Kombination* von Imker:in, Standort und Mittel. Drei binäre Beziehungen (Imker:in–Standort, Standort–Mittel, Imker:in–Mittel) verlieren diese Kombination. Sie erlauben außerdem Schlüsse, die nie stimmten: Lea hat Mittel X schon einmal verwendet, Lea arbeitet am Standort S, und an S wurde X schon eingesetzt. Daraus folgt nicht, dass Lea X an S eingesetzt hat. Die Zerlegung ist also **nicht verlustfrei**: Die ursprünglichen Dreierkombinationen lassen sich nicht exakt zurückgewinnen. Gleichwertig zur ternären Raute ist ein eigener Entitätstyp `Behandlung` mit drei binären Beziehungen, der zusätzlich ein Datum tragen kann.

![Generalisierung Tier mit Subtypen Hund und Katze sowie rekursive Beziehung „ist Mutter von“ mit Rollen](diagrams/generalisierung-tierheim.dot)

## Generalisierung/Spezialisierung und Aggregation

Bei der **Generalisierung** (*generalization*) fasst man gemeinsame Attribute und Beziehungen mehrerer Entitätstypen in einem **Obertyp** (Supertyp) zusammen (bottom-up). Die **Spezialisierung** (*specialization*) geht den umgekehrten Weg: Vom Obertyp werden **Untertypen** (Subtypen) mit zusätzlichen Eigenschaften abgeleitet (top-down). Die Beziehung heißt **is-a** („Hund *ist ein* Tier“). Dabei gilt:

- Die Entitätsmenge eines Subtyps ist eine **Teilmenge** der Entitätsmenge des Obertyps. Jeder Hund ist auch ein Tier.
- Subtypen **erben** Schlüssel, Attribute und Beziehungen des Obertyps und haben keinen eigenen Schlüssel. Zur Verdeutlichung darf man den geerbten Schlüssel am Subtyp wiederholen.
- Subtypen sind **einseitig existenzabhängig** vom Obertyp: Die Hund-Entität gibt es nur, wenn es die zugehörige Tier-Entität gibt, aber nicht umgekehrt. Manche Darstellungen nennen Subtypen deshalb „schwach“. Vom schwachen Entitätstyp oben unterscheiden sie sich aber: Sie übernehmen den ganzen Schlüssel und haben keinen partiellen.

Das ursprüngliche Chen-Modell hat für is-a kein eigenes Symbol. Dieser Kurs zeichnet ein **Dreieck** mit der Beschriftung „is-a“; andere Diagramme verwenden dafür eine Raute mit „is-a“ oder einen Kreis.

Zwei voneinander unabhängige Eigenschaften beschreiben eine Spezialisierung. Statt total/partiell liest man auch *vollständig/unvollständig*.

| | **disjunkt** (*disjoint*): höchstens ein Subtyp je Entität | **überlappend** (*overlapping*): mehrere Subtypen möglich |
|---|---|---|
| **total** (*total*): jede Entität gehört zu mindestens einem Subtyp | Bienenvolk ist Wirtschaftsvolk oder Ableger, etwas Drittes gibt es nicht | Ansprechperson des Imkervereins ist Vorstandsmitglied und/oder Bienensachverständige:r; geführt wird nur, wer mindestens eins davon ist |
| **partiell** (*partial*): Entitäten ohne Subtyp erlaubt | Tierheim: Hund, Katze, daneben Kaninchen nur als „Tier“ | Imker:in kann zusätzlich Kursleiter:in und/oder Gutachter:in sein, muss aber nicht |

Im Tierheim-Diagramm ist die Spezialisierung von `Tier` **disjunkt und partiell**. Zur Erinnerung: Dieses total/partiell ist nicht die Teilnahmebeschränkung einer Beziehung.

**Aggregation** (*aggregation*) meint in der ER-Modellierung die **Teil-Ganzes-Beziehung** (*is-part-of*). Mehrere Einzelobjekte, die **Komponenten**, werden zu einem eigenständigen Ganzen zusammengefasst, dem **Aggregat**; den umgekehrten Blick nennt man **Zerlegung**. Beispiel: Eine *Beute* (Bienenkasten) besteht aus einem Boden, einem Deckel und mehreren Zargen. Eine Zarge *ist* keine Beute, sondern ein *Teil* davon; genau das trennt is-part-of von is-a. Eine der Kursquellen unterscheidet zusätzlich:

- **Rollenaggregation:** verschiedenartige Komponenten, jede in ihrer eigenen Rolle und je höchstens einmal, z. B. Boden und Deckel einer Beute (je 1:c).
- **Mengenaggregation:** viele gleichartige Komponenten, z. B. die Zargen einer Beute (1:nc).

Im Chen-Diagramm zeichnet man is-part-of als Raute mit dieser Beschriftung und notiert an den Kanten die Kardinalitäten wie bei jeder Beziehung. is-a- und is-part-of-Hierarchien lassen sich kombinieren: Die Teile dürfen selbst spezialisiert sein, etwa `Zarge` in `Brutraumzarge` und `Honigraumzarge` (disjunkt, total).

![Teil-Ganzes-Hierarchie (is-part-of) einer Beute mit Rollen- und Mengenaggregation, kombiniert mit einer is-a-Spezialisierung der Zarge](diagrams/aggregation-imkerei.dot)

**Lesehinweis für fremde Diagramme:** In englischsprachigen EER-Darstellungen steht „aggregation“ teils für etwas anderes. Dort wird ein Beziehungstyp samt seinen Entitätstypen eingerahmt und nimmt als Einheit an einer weiteren Beziehung teil. Diese Lesart ist in den Quellen dieses Kurses nicht belegt und wird hier nicht verwendet. Erkennbar ist sie am Rahmen um Raute und Rechtecke.

## Zeitbezug im ER-Modell

Ein einfaches ER-Modell bildet nur den **aktuellen Zustand** ab. Modelliert man „Bienenvolk *steht an* Standort“ als n:1, steht ein Volk immer an genau einem Ort. Bei einer Wanderung zur Rapsblüte wird die Zuordnung überschrieben, und die frühere Aufstellung ist verloren.

Soll der Verlauf erhalten bleiben (**Historisierung**), gibt es zwei formal saubere Muster:

1. **Zuordnung als eigener Entitätstyp** mit **Gültigkeitszeitraum**: `Standortwechsel` mit `von` und `bis`, verbunden mit Bienenvolk (1:n) und Standort (1:n). Jede Aufstellung ist eine eigene Entität, deshalb darf sich das Paar (Volk, Standort) beliebig oft wiederholen.
2. **Zeit als eigener Entitätstyp** in einer ternären Beziehung: `Zeitraum` (von, bis) zusammen mit Volk und Standort. Eine Rückkehr ergibt das Tupel (Volk, Standort, *anderer* Zeitraum), also ein neues Element der Beziehungsmenge.

**Nicht gleichwertig: Zeitattribute an einer m:n-Beziehung** (`steht an` mit `von`, `bis` an der Raute). In der Mengensicht (siehe formale Sicht) ist eine Beziehung durch ihre Partner bestimmt, also durch das Paar (Volk, Standort). Ein Attribut kann zwei Beziehungen mit demselben Paar nicht unterscheiden, eine Rückkehr an denselben Standort ist so nicht darstellbar. Diese Form taugt nur, wenn sich jedes Paar höchstens einmal ergibt. Manche Darstellungen erlauben sie trotzdem, wenn ausdrücklich vereinbart ist, dass `von` zum Schlüssel der Beziehung gehört. Das ist dann eine vereinfachende Notationserweiterung und keine Folge der Mengensicht.

Weitere Regeln:
- Ein leeres `bis` kennzeichnet die **aktuelle** Zuordnung. Eine zusätzliche direkte Beziehung „aktueller Standort“ wäre redundant.
- Dasselbe Volk kann mehrfach am selben Standort stehen. Das Paar (Volk, Standort) reicht deshalb nicht als Schlüssel. Man führt einen künstlichen Schlüssel ein oder macht `Standortwechsel` zum schwachen Entitätstyp von `Bienenvolk` mit dem partiellen Schlüssel `von`.
- Was das Diagramm nicht zeigen kann, notiert man als Zusatzbedingung, z. B. „Zeiträume desselben Volks überschneiden sich nicht“.

Temporale Datenbanken unterscheiden die **Gültigkeitszeit** (*valid time*: wann ein Sachverhalt in der realen Welt galt, etwa „Volk stand vom 20.4. bis 25.5. am Rapsfeld“) und die **Transaktionszeit** (*transaction time*: wann der Eintrag in der Datenbank gespeichert bzw. geändert wurde). Werden beide geführt, spricht man von *bitemporalen* Daten. Im ER-Modell modelliert man meist nur die Gültigkeitszeit über `von`/`bis`-Attribute.

## ER-Modell aus Text erstellen, lesen und prüfen

**Erstellen, bewährtes Vorgehen:**

1. **Substantive** markieren: Kandidaten für Entitätstypen oder Attribute (*Nominalextraktion*). Hat das Ding eigene Eigenschaften oder Beziehungen, wird es ein Entitätstyp, sonst ein Attribut.
2. Für jeden Entitätstyp einen **Schlüssel** festlegen (notfalls künstlich) und unterstreichen.
3. **Verben** zwischen Substantiven: Beziehungstypen, benannt in Leserichtung.
4. Kardinalitäten **in beiden Richtungen** bestimmen: „Ein A hat wie viele B? Ein B hat wie viele A?“ Signalwörter für min: *muss, genau, mindestens* vs. *kann, höchstens, auch keine*.
5. Attribute einordnen: am Entitätstyp oder am Beziehungstyp? Pflicht oder optional?
6. Sonderfälle prüfen: Generalisierung („es gibt zwei Arten von …“), Teil-Ganzes („besteht aus“), schwacher Typ („Nr. innerhalb von …“), Rollen/Rekursion („… von anderen …“), Zeitbezug („bisherige“, „von … bis“).

**Aus Beispieltabellen ableiten:** Manche Spaltengruppen sind bei einem Teil der Zeilen stets gemeinsam leer. Das deutet auf einen Subtyp hin. Sind bei einer Zeile mehrere solcher Gruppen gefüllt, ist die Spezialisierung überlappend; bleiben bei einer Zeile alle leer, ist sie partiell. Wiederholen sich Werte samt eigenen Zusatzspalten, steckt dahinter meist ein eigener Entitätstyp. Untergrenzen lassen sich aus Beispieldaten **nicht** sicher ablesen, denn eine Stichprobe zeigt nicht, was erlaubt ist. Sie gehören in den Text oder werden als Annahme notiert.

**Strukturregeln für Chen-Diagramme (beim Gegenlesen prüfen):**
- Entitätstypen haben eindeutige Namen. Ein Beziehungstyp ist eindeutig durch **Name plus verbundene Entitätstypen**. Zwei gleichnamige Rauten sind also erlaubt, wenn sie verschiedene Entitätstypen verbinden (z. B. ⟨hat⟩ zwischen Gruppe und Beet und ⟨hat⟩ zwischen Gruppe und Gerät). Verboten sind sie nur zwischen denselben Entitätstypen. Sprechende, unterschiedliche Namen sind trotzdem zu empfehlen.
- An demselben Element hängen keine zwei gleichnamigen Attribute. Gleiche Attributnamen an verschiedenen Typen sind erlaubt.
- Gleichartige Elemente werden nie direkt verbunden: kein Rechteck an Rechteck, keine Raute an Raute.
- Ein Beziehungstyp hat mindestens **zwei** Kanten. Bei Rekursion führen beide zum selben Rechteck und tragen Rollennamen.
- Ein Attribut hat genau **eine** Verbindung: zu einem Entitätstyp, zu einem Beziehungstyp oder (als Teilattribut) zu einem zusammengesetzten Attribut.
- Keine isolierten Entitätstypen, keine unbenannten Beziehungen, jede Anforderung im Diagramm wiederzufinden.

**Redundante Beziehungen vermeiden.** Bilden Beziehungen einen Zyklus, prüfe, ob eine davon aus den anderen folgt. Beispiel: Imker:in —1— betreut —n— Bienenvolk —n— steht an —1— Standort. Eine zusätzliche Beziehung „Imker:in *ist tätig an* Standort“ ist redundant, wenn sie nur bedeutet, dass dort eines ihrer Völker steht. Sie muss bei jeder Änderung mitgepflegt werden und kann dem Rest widersprechen. Eine Zusatzbeziehung im Zyklus ist nur richtig, wenn sie etwas **anderes** ausdrückt (z. B. „ist Standortpat:in“) oder wenn der Umweg nicht alle Fälle erfasst. Das ist etwa der Fall, wenn ein Standort schon zugeteilt ist, aber noch kein Volk dort steht.

**Lesen:** Jeden Beziehungstyp in zwei Sätze übersetzen, je einen pro Richtung, mit Unter- und Obergrenze: „Jedes Bienenvolk wird von **genau einer** Imker:in betreut. Eine Imker:in betreut **keins bis beliebig viele** Völker.“ Bei Chen schaut man dafür auf die **gegenüberliegende** Angabe, bei (min,max) auf die Angabe am **eigenen** Entitätstyp.

**Weitere Synonyme**, die dir in Aufgaben begegnen können: Entitätsmenge/Beziehungsmenge (für die Mengen der Ausprägungen), Relationstyp (Beziehungstyp), Teilnahmebeschränkung (*participation constraint*), Partialschlüssel (partieller Schlüssel), Master/Detail (Besitzer/abhängiger Typ), Gegenstands-Beziehungs-Modell (ERM), EERM (erweitertes ERM).

## Auf einen Blick

- Rechteck = Entitätstyp, Raute = Beziehungstyp, Ellipse = Attribut, Schlüssel unterstrichen; doppelte Ellipse = mehrwertig, gestrichelt = abgeleitet, Unter-Ellipsen = zusammengesetzt; optionale Attribute werden später NULL-fähige Spalten.
- Superschlüssel ⊇ Schlüsselkandidat (minimal); einer wird Primärschlüssel, die übrigen Alternativschlüssel; Attribute außerhalb aller Kandidaten sind Nichtschlüsselattribute; Fremdschlüssel nach Konvention erst im Relationenmodell.
- Beziehungstyp = Teilmenge des kartesischen Produkts der Entitätsmengen, identifiziert durch die Schlüssel der Partner.
- Chen (1:1, 1:n, n:1, m:n) liest man **gegenüber** und sieht nur Obergrenzen; Pflicht über Doppellinie (totale Teilnahme) oder MC-Symbole.
- Umrechnung binär: max bei A = Chen-Angabe bei B. min aus dem Text; ohne jede Angabe gilt der Kursstandard: 1:1 → (0,1)/(0,1), m:n → (0,*)/(0,*), 1:n → Master (0,*), Detail (1,1). MC-Symbole (1, c, m, mc) tragen eigene Untergrenzen.
- Existenzabhängigkeit = min ≥ 1 (einseitig oder wechselseitig). Schwacher Entitätstyp = existenzabhängig + nur mit Besitzerschlüssel identifizierbar + nur partieller Schlüssel.
- Rekursion braucht Rollen; bei hierarchischen Rekursionen haben beide Rollen min = 0; n-äre Beziehungen nicht vorschnell in binäre zerlegen (nicht verlustfrei).
- Spezialisierung: Subtyp ⊆ Obertyp, erbt den Schlüssel; total/partiell × disjunkt/überlappend, nicht mit der Teilnahme verwechseln.
- Aggregation = Teil-Ganzes (is-part-of) mit Rollen- und Mengenaggregation; kombinierbar mit is-a.
- Historie: eigener Entitätstyp für die Zuordnung (mit `von`/`bis`) oder für die Zeit, nicht nur ein Attribut an der Raute; keine redundanten Zyklen; Strukturregeln beim Gegenlesen prüfen (Beziehungstyp eindeutig über Name + Partner).
