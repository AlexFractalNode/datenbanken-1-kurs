---
id: t08
lang: de
title: Relationale Algebra
order: 8
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: wp-relationale-algebra
    ref: "Abschnitte „Allgemein“ (prozedurale Sprache vs. deskriptive Kalküle, Codds Zielsetzung), „Operationen“ (Mengenoperationen mit Typkompatibilität, Kartesisches Produkt als eigener Abschnitt, Projektion, Selektion, Join mit Equi-, Natural, Semi, Outer und Anti Join inkl. SQL-Entsprechung „not exists“ (Beleg 1 für die Herleitung Semi-Join ↔ EXISTS im Abschnitt „Übersetzung nach SQL“), Funktionsschreibweisen JOIN/NATURALJOIN/LEFTOUTERJOIN, Umbenennung mit ρ[neu←alt] und linear R[alt→neu], Division), „Minimalität und Vollständigkeit“, „Erweiterungen – Nullwerte, Multimengensemantik“"
  - id: wpen-relational-algebra
    ref: "Sections „Set operators“ (union, difference and Cartesian product taken from set theory; union compatibility = same set of attributes; disjoint headers for the product), „Projection“, „Selection“, „Rename“, „Outer joins“, „Use of algebraic properties for query optimization“ (disjunction as union of selections, selection and intersection, projection and union/difference)"
  - id: wpen-relational-model
    ref: "Abschnitt zu Anfragen: relationale Algebra und relationaler Kalkül als zwei Wege, Anfragen zu formulieren; deklarativer Grundgedanke des Modells"
  - id: wikibooks-relationenalgebra-und-sql
    ref: "Unterseiten „Einleitung“ (Abgeschlossenheit, Sicherheit gegenüber Kalkülen), „Selektion (Restriktion)“, „Projektion“, „Umbenennung“, „Kartesisches Produkt“, „Join“ (Equi-, Natural-, Semi-, Outer-Join), „Mengenoperationen“ (jeweils Definition, Beispiel, SQL)"
  - id: wp-relation-datenbank
    ref: "Abschnitte „Relationen als Tabellen“ und „Definition“ (Relation als Menge, Grad, Kardinalität)"
  - id: wp-join-sql
    ref: "Abschnitte „Kartesisches Produkt (CROSS JOIN)“, „Innerer Verbund“, „NATURAL JOIN“, „JOIN ... USING ...“, „JOIN ... ON ...“, „Äußerer Verbund (OUTER JOIN)“"
  - id: wpen-join-sql
    ref: "Sections „Cross join“, „Inner join“ (Equi-join, Natural join), „Outer join“ (Beispiel, in dem Left, Right und Full verschiedene Zeilen liefern; Primär-/Fremdschlüssel im Beispielschema)"
  - id: wikibooks-en-relational-database-design
    ref: "Chapter „Retrieving data“, section „Relational Algebra“ (u. a. Division)"
  - id: firebird-30-language-reference
    ref: "Kap. 6.1 SELECT: 6.1.4 Joins (NATURAL, USING, OUTER, CROSS), 6.1.8 UNION; DISTINCT in der Spaltenliste; Kap. 4 Prädikate EXISTS und IN"
  - id: postgresql-17-docs-sql
    ref: "Kap. 7 Queries: 7.2.1.1 Joined Tables, 7.4 Combining Queries (UNION, INTERSECT, EXCEPT; union compatible = gleiche Spaltenzahl, verträgliche Typen); 9.24 Subquery Expressions (EXISTS wahr, sobald die Unterabfrage mindestens eine Zeile liefert, Beleg 2 für die Herleitung Semi-Join ↔ EXISTS; IN; NOT IN bei NULL)"
  - id: wpen-join-relational-algebra
    ref: "Sections „Semijoin“ (R ⋉ S: Tupel von R mit Partner, nur Attribute von R; Symbol ⋊ für die rechte Richtung), „Antijoin“ (R ▷ S = R − (R ⋉ S), Schreibweise als ⋉ mit Querstrich), „θ-join and equijoin“, „Natural join“"
---

# Relationale Algebra

## Lernziele

Nach diesem Thema kannst du …

- die relationale Algebra vom Relationenkalkül abgrenzen und ihre Operatoren nach Stelligkeit sowie in mengen- und relationenorientierte einteilen,
- die Operatoren (σ, π, ρ, ×, ⋈, ⟕/⟖/⟗, ⋉/⋊, ∪, ∩, −, ÷) benennen, in der Standardnotation und in gängigen Varianten lesen und mit einem eigenen Beispiel erklären,
- einen gegebenen Ausdruck auf kleinen Relationen von Hand auswerten, die Ergebnistabelle samt Attributen angeben und das Ergebnis in Worten beschreiben,
- eine natürlichsprachliche Anfrage in einen (geschachtelten) Ausdruck übersetzen und als Operatorbaum zeichnen,
- Ausdrücke äquivalent umformen, insbesondere Selektionen möglichst früh ausführen, und begründen, warum das günstiger ist,
- Ausdrücke in SQL übersetzen und umgekehrt, inklusive des Unterschieds zwischen Mengen (Algebra) und Multimengen (SQL).

## Grundlage: Relationen sind Mengen

Die *relationale Algebra (relational algebra)* ist eine formale Anfragesprache. Jeder Operator nimmt eine oder zwei Relationen entgegen und liefert wieder eine Relation. Weil Ein- und Ausgabe vom selben Typ sind, lassen sich Operatoren beliebig ineinander schachteln (Abgeschlossenheit). Damit lässt sich jede Anfrage als endliche Kombination weniger Grundoperatoren aufschreiben, und jede solche Kombination liefert in endlich vielen Schritten ein endliches Ergebnis. Codd hat die Algebra zusammen mit dem relationalen Modell als Grundlage für Anfragesprachen entworfen; Nutzer sollen dabei nicht wissen müssen, wie die Daten intern gespeichert sind.

### Algebra und Relationenkalkül

Für dieselbe Anfrage gibt es zwei formale Beschreibungsweisen:

- Die **relationale Algebra** ist **prozedural**: Ein Ausdruck gibt die Schritte an, mit denen das Ergebnis aus den Basisrelationen konstruiert wird („erst filtern, dann verbinden, dann projizieren“).
- Der *Relationenkalkül (relational calculus)* ist **deklarativ** (beschreibend): Er gibt nur eine logische Bedingung an, die die Ergebnistupel erfüllen müssen, und sagt nichts über den Rechenweg.

Eigenes Beispiel: „Namen der Profis“ als Algebra `π_{name}(σ_{stufe='Profi'}(Mitglied))`, also „aus Mitglied die Profis auswählen und auf name verkürzen“. Als Kalkül sinngemäß „alle Namen n, zu denen es in Mitglied ein Tupel mit diesem Namen und der Stufe Profi gibt“. SQL ist überwiegend deklarativ formuliert; intern übersetzt das Datenbanksystem eine Anfrage aber in einen Algebra-Ausdruck (siehe Operatorbaum).

### Einteilung der Operatoren

Zwei Einteilungen sind üblich:

- **nach Stelligkeit:** *unäre* Operatoren haben eine Eingaberelation, *binäre* zwei (×, alle Joins, ∪, ∩, −, ÷). Als unäre Operatoren nennt der Kursstandard σ und π. Die Umbenennung ρ ist ebenfalls einstellig, wird aber nicht in jeder Einteilung mitgezählt, weil sie nur Namen und keine Inhalte ändert. Wer ρ als dritten unären Operator nennt, liegt nicht falsch.
- **nach Herkunft:** *mengenorientierte* Operatoren stammen aus der Mengenlehre und betrachten Tupel als Ganzes (∪, ∩, −). *Relationenorientierte* Operatoren nutzen die Attributstruktur der Relationen (σ, π, ρ, ×, Joins, ÷).

**Zuordnung des Kreuzprodukts:** Im Kursstandard, der auch für die Klausur gilt, zählt × zu den **relationenorientierten** Operatoren. Es setzt Tupel zu neuen, längeren Tupeln zusammen und ändert dabei das Schema. *Variante:* Andere Darstellungen zählen × zu den mengenorientierten Operatoren, weil es aus dem kartesischen Produkt der Mengenlehre kommt. Wer diese Variante verwendet, sollte die Zuordnung kurz begründen.

### Relationen als Mengen

Eine *Relation* ist eine **Menge** von *Tupeln (tuples)* über festen Attributen. Daraus folgen zwei Regeln, die beim Auswerten von Hand ständig gebraucht werden:

- **Keine Duplikate.** Ein Tupel ist enthalten oder nicht. Entstehen durch einen Operator zwei gleiche Tupel, bleibt nur eines übrig.
- **Keine Reihenfolge.** Die Zeilenfolge in den Tabellen unten ist reine Darstellung.

Die Anzahl der Attribute heißt *Grad (degree)*, die Anzahl der Tupel *Kardinalität*.

SQL weicht davon ab: Tabellen und Abfrageergebnisse sind *Multimengen (multisets, bags)*. Gleiche Zeilen dürfen mehrfach vorkommen, solange kein Schlüssel das verhindert, und `SELECT` entfernt sie nur mit `DISTINCT`. Ein SQL-Ausdruck entspricht einem Algebra-Ausdruck deshalb nur dann exakt, wenn Duplikate ausgeschlossen sind oder mit `DISTINCT` entfernt werden.

### Laufendes Beispiel: Vereinssternwarte

Alle Beispiele dieses Textes beziehen sich auf drei kleine Relationen einer Vereinssternwarte. Schlüsselattribute sind fett gesetzt.

`Mitglied(`**mnr**`, name, stufe)`

| mnr | name | stufe |
| --- | --- | --- |
| 1 | Ada | Profi |
| 2 | Ben | Neuling |
| 3 | Cem | Profi |
| 4 | Dana | Neuling |

`Teleskop(`**tnr**`, modell, oeffnung)`, Öffnung in cm

| tnr | modell | oeffnung |
| --- | --- | --- |
| T1 | Refraktor | 15 |
| T2 | Dobson | 40 |
| T3 | Schmidt-Cassegrain | 28 |

`Sitzung(`**mnr, tnr, objekt**`)`: Wer hat mit welchem Teleskop welches Objekt beobachtet?

| mnr | tnr | objekt |
| --- | --- | --- |
| 1 | T2 | Saturn |
| 1 | T3 | Orionnebel |
| 2 | T2 | Mond |
| 3 | T2 | Saturn |

## Selektion, Projektion, Umbenennung

### Selektion σ

Die *Selektion (selection)*, auch *Restriktion* genannt, `σ_{Bedingung}(R)` filtert **Zeilen**: Sie behält genau die Tupel von R, für die die Bedingung wahr ist. Die Bedingung vergleicht ein Attribut mit einer Konstanten (`oeffnung > 20`) oder zwei Attribute miteinander und kann mit ∧, ∨ und ¬ verknüpft werden. Der Grad bleibt gleich, die Kardinalität sinkt oder bleibt gleich.

`σ_{stufe='Profi'}(Mitglied)`:

| mnr | name | stufe |
| --- | --- | --- |
| 1 | Ada | Profi |
| 3 | Cem | Profi |

Die Bedingung wird **für jedes Tupel einzeln** geprüft. `σ_{tnr='T2' ∧ tnr='T3'}(Sitzung)` ist deshalb immer leer, auch wenn Ada beide Teleskope benutzt hat. Ihre Nutzungen stehen nämlich in zwei verschiedenen Tupeln.

### Projektion π

Die *Projektion (projection)* `π_{Attributliste}(R)` wählt **Spalten** aus: Jedes Tupel wird auf die genannten Attribute verkürzt. Dabei können gleiche Tupel entstehen, und davon bleibt jeweils nur eins.

`π_{objekt}(Sitzung)`:

| objekt |
| --- |
| Saturn |
| Orionnebel |
| Mond |

Das Ergebnis hat drei Tupel, obwohl Sitzung vier hat. Das SQL-Gegenstück `SELECT objekt FROM sitzung` liefert vier Zeilen mit Saturn doppelt. Erst `SELECT DISTINCT objekt FROM sitzung` entspricht der Projektion.

Selektion und Projektion lassen sich schachteln. Der innere Ausdruck wird zuerst ausgewertet:
`π_{name}(σ_{stufe='Profi'}(Mitglied))` ergibt {Ada, Cem}.
Die umgekehrte Reihenfolge `σ_{stufe='Profi'}(π_{name}(Mitglied))` ist nicht definiert, weil `stufe` nach der Projektion fehlt.

### Umbenennung ρ

Die *Umbenennung (rename)* ändert Namen, nicht Inhalte:

- `ρ_{neu←alt}(R)` benennt ein Attribut um, z. B. `ρ_{nummer←mnr}(Mitglied)`.
- `ρ_{S}(R)` gibt der ganzen Relation den Namen S, `ρ_{S(A, B, C)}(R)` zusätzlich allen Attributen neue Namen.

Gebraucht wird ρ vor allem in drei Fällen: wenn eine Relation mit sich selbst verknüpft wird, wenn gleichnamige Attribute beim Produkt kollidieren und wenn Attributnamen für Mengenoperationen oder einen natürlichen Join angeglichen werden müssen.

**Merkregel für alle Pfeil-Schreibweisen:** Der Pfeil zeigt **immer auf den neuen Namen**. `ρ_{nummer←mnr}`, `Mitglied[nummer←mnr]` und `Mitglied[mnr→nummer]` meinen alle dasselbe: Aus mnr wird nummer. Nur die Schrägstrich-Form `ρ_{nummer/mnr}` hat keinen Pfeil; dort steht der neue Name vorn.

### Notationsvarianten

| Operator | Standard in diesem Kurs | Varianten in der Literatur |
| --- | --- | --- |
| Selektion | `σ_{preis>10}(R)` | Postfix linear `R[preis>10]`; Präfix mit abgekürztem Operatornamen, Bedingung in eckigen und Relation in runden Klammern, z. B. `SEL[preis>10](R)` (die Abkürzung schwankt je nach Text) |
| Projektion | `π_{A,B}(R)` | linear `R[A,B]`, großes `Π` (englische Texte) |
| Umbenennung | `ρ_{neu←alt}(R)` | `ρ[neu←alt](R)`, `ρ_{neu/alt}(R)`; linear ohne ρ entweder `R[neu←alt]` (neuer Name zuerst) oder `R[alt→neu]` (alter Name zuerst) |
| Produkt | `R × S` | `R * S` in manchen Texten (Vorsicht: andere Texte schreiben `*` für den natürlichen Join) |
| Theta-/Equi-Join | `R ⋈_{Bedingung} S` | Bedingung handschriftlich unter dem Symbol; Funktionsschreibweise `JOIN(R, Bedingung, S)` |
| natürlicher Join | `R ⋈ S` | `NATURALJOIN(R, S)` |
| äußere Joins | `R ⟕_{Bedingung} S` usw. | `LEFTOUTERJOIN(R, Bedingung, S)`, `RIGHTOUTERJOIN(R, Bedingung, S)`, `FULLOUTERJOIN(R, Bedingung, S)`; auch Kurzformen ohne „OUTER“ wie `LEFTJOIN(R, Bedingung, S)` |
| Semi-/Anti-Join | `R ⋉ S`, `R ▷ S` | `SEMIJOIN(R, Bedingung, S)`, `ANTIJOIN(R, Bedingung, S)`, Bedingung ebenfalls in der Mitte; Anti-Join auch als ⋉ mit Querstrich darüber |
| Differenz | `R − S` | `R ∖ S` |
| Füllwert äußerer Joins | `NULL` | `ω` |

In der Funktionsschreibweise steht die **Bedingung in der Mitte** zwischen den beiden Relationen, nicht am Ende. `JOIN(Mitglied, Mitglied.mnr=Sitzung.mnr, Sitzung)` ist also `Mitglied ⋈_{Mitglied.mnr=Sitzung.mnr} Sitzung`. Gemeint ist bei allen Varianten dasselbe. Gib in der Klausur im Zweifel kurz an, welche Schreibweise du verwendest.

## Kartesisches Produkt

Das *kartesische Produkt (Cartesian product)*, auch Kreuzprodukt, `R × S` kombiniert **jedes** Tupel von R mit **jedem** Tupel von S. Für Grad und Kardinalität gilt:

- Grad(R × S) = Grad(R) + Grad(S)
- |R × S| = |R| · |S|

`Mitglied × Teleskop` hat also 3 + 3 = 6 Attribute und 4 · 3 = 12 Tupel.

Anders als ∪, ∩ und − verlangt das Produkt **keine** Vereinigungsverträglichkeit: Die beiden Relationen dürfen beliebig verschiedene Attribute haben. Haben beide ein gleichnamiges Attribut, etwa `mnr` in `Mitglied × Sitzung`, unterscheidet man die beiden Spalten durch Qualifizieren mit dem Relationsnamen (`Mitglied.mnr`, `Sitzung.mnr`). Manche Darstellungen erlauben das Produkt nur bei disjunkten Attributnamen. Dann muss vorher mit ρ umbenannt werden.

Für sich allein ist das Produkt selten sinnvoll: Es paart auch Ada mit Bens Sitzungen. Nützlich wird es erst zusammen mit einer Selektion, und das ist genau der Join.

## Theta-, Equi- und natürlicher Verbund (Join)

### Theta-Join

Der allgemeine *Verbund (join)* mit einer beliebigen Vergleichsbedingung θ heißt *Theta-Join*:

`R ⋈_{θ} S = σ_{θ}(R × S)`

θ darf =, ≠, <, ≤, >, ≥ verwenden und verknüpfen. Beispiel mit Umbenennung, weil Teleskop mit sich selbst verglichen wird: Welche Teleskop-Paare gibt es, bei denen das erste eine kleinere Öffnung hat als das zweite?

`π_{tnr, tnr2}(Teleskop ⋈_{oeffnung<oeffnung2} ρ_{T(tnr2, modell2, oeffnung2)}(Teleskop))`

| tnr | tnr2 |
| --- | --- |
| T1 | T2 |
| T1 | T3 |
| T3 | T2 |

### Equi-Join

Ein *Equi-Join* (deutsch auch *Gleichverbund* oder *Gleichheitsverbund*) ist ein Theta-Join, dessen Bedingung nur Gleichheit verwendet. Beide verglichenen Attribute bleiben im Ergebnis stehen:

`Mitglied ⋈_{Mitglied.mnr=Sitzung.mnr} Sitzung` hat 6 Attribute (`Mitglied.mnr`, `name`, `stufe`, `Sitzung.mnr`, `tnr`, `objekt`) und 4 Tupel.

In der Praxis verbindet ein Join meist eine Fremdschlüsselspalte mit dem Primärschlüssel, auf den sie verweist, hier `Sitzung.mnr` mit `Mitglied.mnr`.

### Natürlicher Join

Der *natürliche Verbund (natural join)* `R ⋈ S` hat keinen Index. Er setzt Gleichheit auf **allen** gleichnamigen Attributen voraus und übernimmt jedes gemeinsame Attribut nur **einmal**.

`Mitglied ⋈ Sitzung` (gemeinsam: `mnr`):

| mnr | name | stufe | tnr | objekt |
| --- | --- | --- | --- | --- |
| 1 | Ada | Profi | T2 | Saturn |
| 1 | Ada | Profi | T3 | Orionnebel |
| 2 | Ben | Neuling | T2 | Mond |
| 3 | Cem | Profi | T2 | Saturn |

Dana fehlt, weil sie keinen Partner in Sitzung hat. Zwei Sonderfälle muss man kennen:

- **Kein gemeinsames Attribut:** Der natürliche Join ist dann das kartesische Produkt, z. B. `Mitglied ⋈ Teleskop`.
- **Mehrere gemeinsame Attribute:** Alle müssen übereinstimmen. Heißen zwei Spalten zufällig gleich, obwohl sie Verschiedenes bedeuten, gehen Tupel unbemerkt verloren. Dann die Bedingung lieber ausschreiben oder vorher umbenennen.

Formal ist der natürliche Join ein Equi-Join über alle gleichnamigen Attribute, gefolgt von einer Projektion, die die doppelten Spalten entfernt. Er ist deshalb **nicht** identisch mit dem Equi-Join: Die Grade unterscheiden sich um die Zahl der gemeinsamen Attribute (hier 5 statt 6).

Der natürliche Join ist kommutativ und assoziativ (bei benannten Attributen spielt die Spaltenreihenfolge keine Rolle). Bei `Mitglied ⋈ Sitzung ⋈ Teleskop` ist die Klammerung deshalb für das Ergebnis egal. Beim Theta-Join gilt die Umklammerung `(R ⋈_{θ1} S) ⋈_{θ2} T = R ⋈_{θ1} (S ⋈_{θ2} T)` nur, wenn jede Bedingung ausschließlich Attribute der Teilausdrücke verwendet, die sie an dieser Stelle verbindet (θ2 hier nur Attribute von S und T). Vorsicht beim natürlichen Join über viele Relationen: Je mehr Relationen beteiligt sind, desto leichter teilen zwei davon unbemerkt einen Attributnamen.

## Äußerer Verbund und Semi-Join

### Äußerer Join

Beim inneren Join verschwinden Tupel ohne Partner, im Beispiel Dana. Der *äußere Verbund (outer join)* behält sie und füllt die fehlenden Attribute mit **NULL** auf:

| Symbol | Name | zusätzlich erhalten bleiben |
| --- | --- | --- |
| `R ⟕ S` | Left Outer Join | partnerlose Tupel von R |
| `R ⟖ S` | Right Outer Join | partnerlose Tupel von S |
| `R ⟗ S` | Full Outer Join | partnerlose Tupel beider Seiten |

`Mitglied ⟕ Sitzung` enthält die vier Tupel des natürlichen Joins und zusätzlich:

| mnr | name | stufe | tnr | objekt |
| --- | --- | --- | --- | --- |
| 4 | Dana | Neuling | NULL | NULL |

`Sitzung ⟖ Teleskop` (gemeinsam: `tnr`) ergänzt das nie benutzte Teleskop T1 als `(NULL, T1, NULL, Refraktor, 15)` mit den Attributen `mnr, tnr, objekt, modell, oeffnung`.

`Mitglied ⟗ Sitzung` ist auf diesen Daten gleich `Mitglied ⟕ Sitzung`: Jede Sitzung gehört zu einem vorhandenen Mitglied, also gibt es rechts nichts Partnerloses. Verschieden werden die drei Varianten erst, wenn **beide** Seiten partnerlose Tupel haben, typischerweise wenn nicht über einen Fremdschlüssel verbunden wird. Die Übungsaufgaben enthalten solche Daten.

Merkhilfe für die Symbole: Die verlängerten Striche am ⋈ stehen auf der Seite, deren Tupel **vollständig** erhalten bleiben.

**Mit oder ohne Bedingung.** Ohne Index ist der natürliche äußere Join gemeint: Die gemeinsamen Attribute erscheinen einmal, bei einem rechts partnerlosen Tupel kommt ihr Wert aus der rechten Relation (T1 oben). Die Bedingung kann aber auch wie beim Theta-Join als Index stehen, z. B. `R ⟕_{R.a=S.b} S`. Für die Spalten gibt es zwei Darstellungen:

- **Kursstandard (Klausur):** Bei einer Gleichheitsbedingung wird die Join-Spalte nur **einmal** notiert, wie beim natürlichen äußeren Join. Ihr Wert kommt aus der Seite, die das Tupel liefert.
- **Variante:** Wie beim Equi-Join bleiben **beide** Vergleichsattribute stehen (`R.a` und `S.b`), und auf der Seite ohne Partner steht NULL. Diese Form ist ebenfalls richtig und bei Ungleichheitsbedingungen ohnehin nötig.

Schreib in der Klausur dazu, welche Form du verwendest, und qualifiziere doppelte Namen.

Die klassische Algebra kennt eigentlich keine Nullwerte. Erst die äußeren Joins führen sie ein. Manche Quellen schreiben den Füllwert als ω statt NULL. Spätere Selektionen auf solchen Attributen folgen der dreiwertigen Logik.

### Semi-Join

Der *Semi-Join* `R ⋉ S` beantwortet die Frage „Welche Tupel von R haben **mindestens einen** Partner in S?“ Ausgegeben werden **nur die Attribute von R**:

`R ⋉ S = π_{Attribute von R}(R ⋈ S)`

`Mitglied ⋉ Sitzung`:

| mnr | name | stufe |
| --- | --- | --- |
| 1 | Ada | Profi |
| 2 | Ben | Neuling |
| 3 | Cem | Profi |

Ada hat zwei Sitzungen, erscheint aber nur einmal: Nach dem Wegprojizieren der Sitzungsattribute sind ihre beiden Tupel gleich.

Genauer heißt ⋉ *linker Semi-Join*. Der *rechte Semi-Join* `R ⋊ S` ist die Spiegelung: Er liefert die Tupel von **S**, die einen Partner in R haben, mit **nur den Attributen von S**:

`R ⋊ S = π_{Attribute von S}(R ⋈ S) = S ⋉ R`

`Sitzung ⋊ Teleskop` (gemeinsam: `tnr`) liefert die Teleskope, die mindestens einmal benutzt wurden:

| tnr | modell | oeffnung |
| --- | --- | --- |
| T2 | Dobson | 40 |
| T3 | Schmidt-Cassegrain | 28 |

T2 kommt in drei Sitzungen vor, steht aber nur einmal da. T1 fehlt, weil es keine Sitzung damit gibt. `Mitglied ⋊ Sitzung` dagegen ergibt alle vier Sitzungen, weil jede ein vorhandenes Mitglied hat.

**Regel für die Richtung:** Entscheidend ist allein die Definition, also auf die Attribute welcher Relation projiziert wird. Beim **linken** Semi-Join `R ⋉ S = π_{Attribute von R}(R ⋈ S)` ist es die linke Relation, beim **rechten** Semi-Join `R ⋊ S = π_{Attribute von S}(R ⋈ S)` die rechte. Die andere Relation wird nur auf Partner geprüft. Bei `Sitzung ⋊ Teleskop` steht Teleskop rechts, also kommen Teleskop-Tupel heraus. Wer unsicher ist, schreibt den Semi-Join als Projektion eines Joins aus. Manche Beispielsammlungen beschriften links und rechts uneinheitlich; maßgeblich ist immer die Definition.

**Ergänzung: Anti-Join.** Das Gegenstück ist der *Anti-Join* `R ▷ S = R − (R ⋉ S)`, also die Tupel von R **ohne** Partner. `Mitglied ▷ Sitzung` liefert Dana. Er gehört nicht zum Kernbestand jeder Darstellung, ist aber für die Übersetzung nach SQL nützlich. Manche Texte schreiben ihn als ⋉ mit einem Querstrich darüber.

## Vereinigung, Durchschnitt, Differenz

Die drei Mengenoperationen arbeiten tupelweise:

- `R ∪ S` (Vereinigung): Tupel, die in R **oder** in S liegen. Gemeinsame Tupel erscheinen einmal.
- `R ∩ S` (Durchschnitt): Tupel, die in R **und** in S liegen.
- `R − S` (Differenz): Tupel aus R, die **nicht** in S liegen. Die Differenz ist nicht kommutativ.

Der Durchschnitt ist ableitbar: `R ∩ S = R − (R − S)`.

### Vereinigungsverträglichkeit

Die Operationen sind nur für *vereinigungsverträgliche (union-compatible)* Relationen definiert; ein anderer Name dafür ist *Typkompatibilität*. Die Literatur formuliert die Voraussetzung unterschiedlich:

- **namensbezogen (Standard in diesem Kurs und für die Klausur):** gleicher Grad, **gleiche Attributnamen** (notfalls nach einer Umbenennung mit ρ), gleiche Wertebereiche und gleiche Reihenfolge der Attribute,
- **positionsbezogen:** nur gleicher Grad, und die Attribute an gleicher Position haben denselben Wertebereich; die Namen dürfen abweichen. So arbeitet auch SQL: `UNION`, `INTERSECT` und `EXCEPT` verlangen nur gleiche Spaltenzahl und verträgliche Typen.

Eigenes Beispiel: `Kundin(name, ort)` und `Lieferant(firma, ort)`, wobei name und firma beide Texte sind. Positionsbezogen wäre `Kundin ∪ Lieferant` erlaubt, nach dem Kursstandard nicht, weil name ≠ firma. Zulässig ist `Kundin ∪ ρ_{name←firma}(Lieferant)`.

Auf der sicheren Seite bist du, wenn beide Seiten auf dieselben Attribute projiziert sind. `Mitglied − Sitzung` ist nicht erlaubt, `π_{mnr}(Mitglied) − π_{mnr}(Sitzung)` schon.

### Beispiel

Sei `A = π_{mnr}(σ_{tnr='T2'}(Sitzung)) = {1, 2, 3}` (wer hat T2 benutzt) und `B = π_{mnr}(σ_{tnr='T3'}(Sitzung)) = {1}` (wer hat T3 benutzt).

| Ausdruck | Ergebnis | Bedeutung |
| --- | --- | --- |
| `A ∪ B` | {1, 2, 3} | T2 oder T3 benutzt |
| `A ∩ B` | {1} | T2 **und** T3 benutzt |
| `A − B` | {2, 3} | T2, aber nicht T3 |
| `B − A` | ∅ | T3, aber nicht T2 |
| `π_{mnr}(Mitglied) − π_{mnr}(Sitzung)` | {4} | noch nie beobachtet |

„Sowohl … als auch“ über verschiedene Tupel formuliert man also mit ∩ und nicht mit ∧ in einer einzigen Selektion.

### Ausblick: Division ÷

Die *Division (division)* beantwortet „für alle“-Fragen: „Welche Mitglieder haben **alle** Teleskope mit mehr als 20 cm Öffnung benutzt?“

`π_{mnr, tnr}(Sitzung) ÷ π_{tnr}(σ_{oeffnung>20}(Teleskop))`

Der Divisor ist {T2, T3}. Das Ergebnis hat die Attribute des Dividenden, die nicht im Divisor vorkommen, hier `mnr`. Es enthält die Werte, die mit **jedem** Divisor-Tupel kombiniert vorkommen: nur Ada (1). Ben und Cem haben lediglich T2 benutzt.

Die Division ist kein Grundoperator. Mit X als den Attributen von R, die nicht in S stehen, gilt:

`R ÷ S = π_{X}(R) − π_{X}((π_{X}(R) × S) − R)`

Schritt für Schritt im Beispiel: Die Kandidaten sind {1, 2, 3}. Alle denkbaren Kombinationen mit {T2, T3} bilden und die vorhandenen abziehen ergibt {(2, T3), (3, T3)}. Den Kandidaten 2 und 3 fehlt also etwas. Übrig bleibt {1}.

Eine übliche **minimale Grundmenge** ist σ, π, ρ, ×, ∪ und −. Join, Durchschnitt, Semi-Join und Division lassen sich daraus zusammensetzen.

## Ausdrücke auswerten und schachteln

### Vorgehen beim Formulieren

Eine Anfrage wie „Namen der Profis, die den Saturn beobachtet haben“ zerlegt man in Fragen:

1. Welche Relationen enthalten die benötigten Attribute? `name`, `stufe` stehen in Mitglied, `objekt` in Sitzung.
2. Wie hängen sie zusammen? Über `mnr`, also Join.
3. Welche Bedingungen filtern? `stufe='Profi'`, `objekt='Saturn'`.
4. Was wird ausgegeben? `name`, also Projektion ganz außen.

Direkt hingeschrieben:
`π_{name}(σ_{stufe='Profi' ∧ objekt='Saturn' ∧ Mitglied.mnr=Sitzung.mnr}(Mitglied × Sitzung))`

### Operatorbaum

Ein *Operatorbaum (operator tree)* stellt einen Ausdruck als Baum dar. Die Blätter sind Basisrelationen, die inneren Knoten Operatoren, die Wurzel ist der zuletzt ausgeführte Operator. Einstellige Operatoren (σ, π, ρ) haben ein Kind, zweistellige (×, ⋈, ∪, ∩, −) zwei. Ausgewertet wird **von unten nach oben**.

![Operatorbaum des direkt hingeschriebenen Ausdrucks: π über σ über Mitglied × Sitzung](diagrams/operatorbaum-naiv.dot)

### Ausdruck in Worten beschreiben

Häufig ist der umgekehrte Weg gefragt: Was liefert ein gegebener Ausdruck? Man liest ihn von innen nach außen und fasst am Ende in einem Satz zusammen, **welche Objekte** mit **welchen Attributen** unter **welcher Bedingung** herauskommen. Beispiel: `π_{name}(Mitglied ⋉ σ_{tnr='T3'}(Sitzung))` heißt „Namen der Mitglieder, die mindestens eine Sitzung mit T3 hatten“. Kleinigkeiten wie „mindestens eine“, „keine“ oder „sowohl … als auch“ entscheiden über die Punkte.

### Äquivalente Umformungen: Selektion früh (Vertiefung)

Verschiedene Ausdrücke können dasselbe Ergebnis liefern. Datenbanksysteme übersetzen eine Anfrage intern in einen Operatorbaum und formen ihn so um, dass die Zwischenergebnisse klein bleiben. Die wichtigsten Regeln:

- **Kaskade:** `σ_{a ∧ b}(R) = σ_{a}(σ_{b}(R))`. Eine Konjunktion darf in einzelne Selektionen zerlegt werden, deren Reihenfolge beliebig ist.
- **Disjunktion:** `σ_{a ∨ b}(R) = σ_{a}(R) ∪ σ_{b}(R)`.
- **Selektion nach unten schieben:** `σ_{c}(R × S) = σ_{c}(R) × S`, wenn c nur Attribute von R verwendet. Das gilt ebenso für ⋈ und ∩.
- **Produkt plus Gleichheit wird zum Join:** `σ_{R.a=S.a}(R × S) = R ⋈_{R.a=S.a} S`. Exakt gleich ist nur der **Equi-Join**, beide a-Spalten bleiben erhalten. Der natürliche Join `R ⋈ S` (a einziges gemeinsames Attribut) hat eine Spalte weniger; er entsteht erst durch eine zusätzliche Projektion, die die doppelte Spalte entfernt. Wird außen ohnehin auf andere Attribute projiziert, darf man deshalb auch den natürlichen Join schreiben.
- **Selektion und Projektion tauschen:** nur, wenn alle Bedingungsattribute in der Projektionsliste stehen.
- **Mengenoperationen:** σ darf über ∪, ∩ und − verteilt werden. π darf über ∪ verteilt werden, aber **nicht** über − oder ∩. Gegenbeispiel mit Attributen (X, Y): R = {(a, 1)}, S = {(a, 2)}. Dann ist `π_{X}(R − S) = {(a)}`, aber `π_{X}(R) − π_{X}(S) = ∅`.

Angewandt auf das Beispiel (wegen der äußeren Projektion auf name ist der natürliche Join hier gleichwertig):

`π_{name}(σ_{stufe='Profi'}(Mitglied) ⋈ σ_{objekt='Saturn'}(Sitzung))`

![Optimierter Operatorbaum: Selektionen direkt über den Basisrelationen, darüber natürlicher Join und Projektion](diagrams/operatorbaum-optimiert.dot)

Der Gewinn zeigt sich an den Zwischenergebnissen. Der naive Baum erzeugt im Produkt 4 · 4 = 16 Tupel. Der optimierte filtert zuerst auf je 2 Tupel und verbindet dann nur noch diese. Das Ergebnis ist in beiden Fällen {Ada, Cem}. Bei echten Tabellen mit Tausenden Zeilen ist der Unterschied entsprechend größer.

## Übersetzung nach SQL

Die SQL-Beispiele verwenden die Musikschul-Datenbank des Kurses (Tabellen `kurs`, `raum`, `instrument`, `ausleihe`) in Firebird-3-Syntax.

| Algebra | SQL |
| --- | --- |
| `σ_{Bedingung}(R)` | `WHERE Bedingung` |
| `π_{A, B}(R)` | `SELECT DISTINCT A, B` |
| `ρ` | `AS` (Spalten- oder Tabellenalias) |
| `R × S` | `R CROSS JOIN S` oder `FROM R, S` |
| `R ⋈_{θ} S` | `R JOIN S ON θ` |
| `R ⋈ S` | `R NATURAL JOIN S` oder `R JOIN S USING (…)` |
| `R ⟕ S`, `R ⟖ S`, `R ⟗ S` | `LEFT`, `RIGHT`, `FULL OUTER JOIN` |
| `R ⋉ S` | `WHERE EXISTS (SELECT … FROM S WHERE …)` oder `WHERE … IN (SELECT … FROM S)` |
| `R ⋊ S` | wie `S ⋉ R`: äußere Abfrage über S, `EXISTS` auf R |
| `R ▷ S` | `WHERE NOT EXISTS (…)` |
| `R ∪ S` | `UNION` (`UNION ALL` behält Duplikate) |
| `R ∩ S`, `R − S` | PostgreSQL: `INTERSECT`, `EXCEPT`. Firebird 3: nur `UNION`, daher `EXISTS`/`IN` bzw. `NOT EXISTS` (NULL-Hinweis unten beachten) |
| `R ÷ S` | kein eigener Operator, wird über verschachtelte Unterabfragen formuliert |

**Selektion, Projektion, Join.**
`π_{titel, bezeichnung}(σ_{niveau='Anfaenger'}(kurs) ⋈_{kurs.raum_id=raum.raum_id} raum)`

```sql
SELECT DISTINCT k.titel, r.bezeichnung
FROM kurs k
JOIN raum r ON k.raum_id = r.raum_id
WHERE k.niveau = 'Anfaenger';
```

Ohne `DISTINCT` könnte derselbe Titel im selben Raum mehrfach erscheinen, nämlich einmal je Kurs.

**Äußerer Join.** `π_{titel, bezeichnung}(kurs ⟕ raum)` behält auch den Kurs ohne festen Raum (`raum_id` NULL) mit `bezeichnung = NULL`:

```sql
SELECT DISTINCT k.titel, r.bezeichnung
FROM kurs k
LEFT OUTER JOIN raum r ON k.raum_id = r.raum_id;
```

**Semi-Join.** `raum ⋉ kurs` liefert alle Räume, in denen mindestens ein Kurs stattfindet:

```sql
SELECT r.*
FROM raum r
WHERE EXISTS (SELECT 1 FROM kurs k WHERE k.raum_id = r.raum_id);
```

Warum entspricht `EXISTS` dem Semi-Join? Das ist eine Herleitung aus zwei Bausteinen, keine Quelle stellt die Entsprechung direkt fest:

1. `EXISTS (…)` ist wahr, sobald die Unterabfrage **mindestens eine** Zeile liefert. Die korrelierte Unterabfrage liefert genau die Join-Partner des aktuellen Raums. Die äußere Abfrage gibt jeden Raum höchstens einmal und nur mit den Spalten von `raum` aus, also genau `raum ⋉ kurs`.
2. Gegenprobe: Dem Anti-Join entspricht in SQL `NOT EXISTS`. Weil `R ⋉ S = R − (R ▷ S)` gilt, bleiben mit `EXISTS` genau die Tupel übrig, die `NOT EXISTS` aussortieren würde. Ein `JOIN` mit `SELECT DISTINCT r.*` liefert dasselbe, wiederholt aber zunächst jeden Raum je Kurs.

**Durchschnitt.** `π_{instrument_id}(kurs) ∩ π_{instrument_id}(ausleihe)` liefert die Instrumente, die unterrichtet **und** ausgeliehen werden. In Firebird 3 ohne `INTERSECT`:

```sql
SELECT DISTINCT k.instrument_id
FROM kurs k
WHERE EXISTS (SELECT 1 FROM ausleihe a WHERE a.instrument_id = k.instrument_id);
```

Gleichwertig ist hier `WHERE k.instrument_id IN (SELECT a.instrument_id FROM ausleihe a)`. In PostgreSQL geht auch `SELECT instrument_id FROM kurs INTERSECT SELECT instrument_id FROM ausleihe;`. `DISTINCT` ist nötig, weil mehrere Kurse dasselbe Instrument haben können.

**Differenz.** `π_{bezeichnung}(instrument) − π_{bezeichnung}(instrument ⋈ kurs)` liefert Instrumente, zu denen es keinen Kurs gibt. In Firebird 3:

```sql
SELECT i.bezeichnung
FROM instrument i
WHERE NOT EXISTS (SELECT 1 FROM kurs k WHERE k.instrument_id = i.instrument_id);
```

In PostgreSQL geht es auch mit Mengenoperator:

```sql
SELECT bezeichnung FROM instrument
EXCEPT
SELECT i.bezeichnung FROM instrument i JOIN kurs k ON k.instrument_id = i.instrument_id;
```

Die Algebra vergleicht hier über die Bezeichnung, das SQL über den Schlüssel `instrument_id`. Das ist nur gleichwertig, weil `bezeichnung` UNIQUE ist: Zwei verschiedene Instrumente können nicht dieselbe Bezeichnung haben.

Vorsicht mit `NOT IN (SELECT instrument_id FROM kurs)`: Weil `kurs.instrument_id` NULL enthalten kann (Musiktheorie, Chor), ist die Bedingung dann nie wahr, und das Ergebnis bleibt leer.

**NULL-Hinweis zum Ersatz von ∩ und −.** `INTERSECT` und `EXCEPT` behandeln zwei NULL-Werte beim Vergleich als gleich, genau wie `DISTINCT`. Der Vergleich `a.x = k.x` in einer `EXISTS`-Unterabfrage ist bei NULL dagegen nie wahr. Enthalten **beide** Vergleichsspalten NULL (in der Musikschule etwa `kurs.raum_id` und `termin.raum_id`), weichen die Ergebnisse ab: `INTERSECT` liefert eine NULL-Zeile, `EXISTS` nicht; `EXCEPT` entfernt eine NULL-Zeile, `NOT EXISTS` behält sie. In den Beispielen oben stört das nicht, weil `ausleihe.instrument_id` und `instrument.bezeichnung` NOT NULL sind.

**Vorsicht mit `NATURAL JOIN`.** `kurs` und `termin` haben `kurs_id` **und** `raum_id` gemeinsam. Ein natürlicher Join würde auch die Räume vergleichen und Termine in einem anderen Raum verlieren. Deshalb besser `JOIN termin t USING (kurs_id)` oder `ON`.

Umgekehrt liest man SQL als Algebra von innen nach außen: `FROM` und `JOIN` ergeben Produkt bzw. Join, `WHERE` die Selektion, die `SELECT`-Liste die Projektion. Eine korrelierte `EXISTS`-Unterabfrage wird zum Semi-Join.

## Auf einen Blick

- Algebra = prozedural (wie wird das Ergebnis gebaut), Relationenkalkül = deklarativ (welche Bedingung erfüllt das Ergebnis).
- Unär: σ, π (ρ ist ebenfalls einstellig). Binär: ×, Joins, ∪, ∩, −, ÷. Mengenorientiert: ∪, ∩, −. Relationenorientiert: σ, π, ρ, ×, Joins, ÷ (Kursstandard; Variante: × mengenorientiert).
- Relationen sind Mengen: keine Duplikate, keine Reihenfolge. SQL arbeitet mit Multimengen, daher `DISTINCT`.
- σ (Restriktion) filtert Zeilen, π wählt Spalten und entfernt Duplikate, ρ benennt um. Bei jeder Pfeil-Schreibweise zeigt der Pfeil auf den neuen Namen.
- `R × S`: Grade addieren sich, Kardinalitäten multiplizieren sich, keine Vereinigungsverträglichkeit nötig.
- `R ⋈_{θ} S = σ_{θ}(R × S)`. Der Equi-Join behält beide Vergleichsattribute, der natürliche Join vergleicht alle gleichnamigen Attribute und behält jedes nur einmal. Funktionsschreibweise: `JOIN(R, Bedingung, S)`.
- ⟕/⟖/⟗ behalten partnerlose Tupel links, rechts oder beidseitig und füllen mit NULL auf.
- `R ⋉ S`: Tupel von R mit Partner, nur R-Attribute. `R ⋊ S`: Tupel von S mit Partner, nur S-Attribute. `R ▷ S`: Tupel von R ohne Partner.
- ∪, ∩, − nur bei Vereinigungsverträglichkeit. Kursstandard: gleicher Grad, gleiche Namen (ggf. nach ρ), gleiche Wertebereiche, gleiche Reihenfolge. SQL prüft nur Spaltenzahl und Typen.
- ÷ für „für alle“-Fragen, ableitbar aus π, × und −.
- Operatorbaum von unten nach oben lesen. Selektionen früh; Produkt plus Gleichheit ist exakt ein Equi-Join.
- Firebird 3 hat kein `INTERSECT`/`EXCEPT`, dort mit `EXISTS`/`IN` bzw. `NOT EXISTS` arbeiten. Bei NULL in beiden Vergleichsspalten weichen die Ergebnisse ab.
