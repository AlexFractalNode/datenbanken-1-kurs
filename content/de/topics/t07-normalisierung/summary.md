---
id: t07
lang: de
title: Normalisierung
order: 7
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: wp-normalisierung-datenbank
    ref: "Abschnitte „Vorgehen“ (Ziel: Konsistenzerhöhung durch Redundanzvermeidung), „Normalformen“ (1NF, 2NF, 3NF, BCNF, 4NF jeweils mit Erläuterung), „Bemerkungen“ (Verbundtreue, Abhängigkeitstreue)"
  - id: wp-funktionale-abhaengigkeit
    ref: "Abschnitte „Formale Definition“, „Axiome von Armstrong“ (inkl. Pseudotransitivitätsregel), „Normalisierung mit funktionalen Abhängigkeiten“, „Attributhülle“"
  - id: wp-denormalisierung
    ref: "Abschnitte „Bereiche der Denormalisierung“ (Rücknahme 1NF, Rücknahme 2NF/3NF, vorweggenommene Aggregation, Index) und „Nachteile“"
  - id: wpen-database-normalization
    ref: "Sections „Objectives“ (insertion, update, deletion anomalies), „Normal forms“, „Example“ (Satisfying 1NF, 2NF, 3NF, 4NF)"
  - id: wpen-functional-dependency
    ref: "Sections „Properties and axiomatization of functional dependencies“, „Closure“ (Closure of a set of attributes), „Applications to normalization“ (Heath's theorem)"
  - id: wikibooks-en-relational-database-design
    ref: "Kapitel „Normalization“ (https://en.wikibooks.org/wiki/Relational_Database_Design/Normalization): „Why perform normalization?“, „The normal forms“ (BCNF- und 3NF-Zerlegung, Abhängigkeitserhaltung), „Normal Forms, without the logic fetish“, „Denormalization“"
  - id: oer-informatik-datenbanken
    ref: "Normalisierung (https://oer-informatik.de/normalisierung): „Redundanz und Inkonsistenz“, „Anomalien“, „Die erste/zweite/dritte Normalform (1NF/2NF/3NF)“, „Bewusst gegen die Normalform: Denormalisierung“"
  - id: oer-informatik-relationenmodell
    ref: "Abschnitt „Transformationsschritte“ / „Kardinalitäten in Fremdschlüsselbeziehungen transformieren“ (Kennzeichnung von Fremdschlüsseln mit ↑…↑ bzw. (FK))"
---

# Normalisierung

## Lernziele

Nach diesem Thema kannst du …

- Einfüge-, Änderungs- und Löschanomalien an konkreten Zeilen einer Tabelle nachweisen,
- funktionale Abhängigkeiten aus Geschäftsregeln ablesen und triviale, volle, partielle und transitive Abhängigkeiten unterscheiden,
- Schlüsselkandidaten bestimmen und Primattribute von Nichtschlüsselattributen trennen, bei unübersichtlichen FD-Mengen mit der Attributhülle (Vertiefung),
- eine unnormalisierte Tabelle schrittweise in die 1., 2. und 3. Normalform überführen und jeden Schritt mit einer konkreten Abhängigkeit begründen,
- prüfen, ob eine Zerlegung verlustfrei und abhängigkeitserhaltend ist,
- Denormalisierung begründet einsetzen und BCNF sowie 4NF an je einem Beispiel einordnen.

## Worum es geht

**Normalisierung** (*normalization*) zerlegt Relationen schrittweise anhand ihrer funktionalen Abhängigkeiten, bis jede Tatsache nur noch an einer Stelle gespeichert ist – Ziel ist, Redundanz zu vermeiden und damit die Konsistenz zu sichern. Die **Normalformen** (*normal forms*, NF) sind aufeinander aufbauende Prüfkriterien: Eine Relation in 3NF ist auch in 2NF und 1NF. Die Gesamtheit dieser Kriterien und Verfahren heißt auch **Normalformenlehre**.

**Schreibweisen:** 1NF, 2NF, 3NF sind die üblichen Kürzel; ebenso verbreitet ist die Schreibweise mit Punkt (1.NF, 2.NF, 3.NF) oder ausgeschrieben „1. Normalform“. Gemeint ist jeweils dasselbe.

Durchgehendes Beispiel ist eine **Kaffeerösterei**, die Cafés beliefert. Bisher steht alles in einer einzigen Lieferliste.

**Kurskonvention für Relationenschemata** (dieselbe wie in t06): Ein Schema schreiben wir als Relationsname(Attribut, Attribut, …).

- Die Attribute des *Primary Key (Primärschlüssel)* sind <u>unterstrichen</u>, z. B. Cafe(<u>CafeNr</u>, CafeName); bei einem zusammengesetzten Primärschlüssel alle beteiligten Attribute.
- Ein *Foreign Key (Fremdschlüssel)* bekommt einen nachgestellten Pfeil auf die Relation, auf die er verweist, z. B. Lieferung(<u>LiefNr</u>, Datum, CafeNr → Cafe). Gelesen: „CafeNr verweist auf den Primärschlüssel von Cafe.“
- Ein Attribut kann beides sein: In Position(<u>LiefNr → Lieferung, SortenNr → Sorte</u>, Menge_kg) bilden zwei Fremdschlüssel zusammen den Primärschlüssel.

**Verwechslungsgefahr:** Derselbe Pfeil → bezeichnet in diesem Thema auch funktionale Abhängigkeiten. Unterscheiden lässt sich beides sicher: In der Schema-Klammer steht hinter dem Pfeil immer ein **Relationsname** (Fremdschlüssel); eine funktionale Abhängigkeit steht dagegen als eigene Zeile außerhalb des Schemas und verbindet **Attribute** (z. B. CafeNr → CafeName).

**Notationsvarianten für Fremdschlüssel:** Manche Texte umschließen den Attributnamen mit Pfeilen (↑CafeNr↑) oder hängen die Zusätze (PK), (FK) bzw. (PK, FK) an. Ein an den Namen angehängtes # kennzeichnet in manchen Darstellungen allgemein ein identifizierendes Schlüsselattribut, nicht speziell einen Fremdschlüssel. Wer eine andere als die Kursschreibweise benutzt, sollte sie in der Antwort kurz erklären.

## Anomalien

Die Lieferliste in flacher Form (jede Lieferposition eine Zeile):

| LiefNr | Datum | CafeNr | CafeName | SortenNr | Sortenname | FarmNr | Farmname | Kilopreis | Menge_kg |
|---|---|---|---|---|---|---|---|---|---|
| L-501 | 03.03.2027 | C7 | Café Bohne | S12 | Bergnebel | F3 | Finca Alta | 24,00 | 5 |
| L-501 | 03.03.2027 | C7 | Café Bohne | S15 | Rotblüte | F8 | Las Nubes | 21,50 | 2 |
| L-502 | 04.03.2027 | C9 | Rösterbar Süd | S12 | Bergnebel | F3 | Finca Alta | 24,00 | 3 |
| L-503 | 05.03.2027 | C7 | Café Bohne | S20 | Seeufer | F3 | Finca Alta | 19,00 | 4 |

Der Name von C7 steht dreimal da, „Finca Alta“ ebenfalls dreimal. Diese **Redundanz** (*redundancy*) führt zu drei Arten von **Anomalien** (*anomalies*) – unerwünschten Effekten beim Ändern des Datenbestands:

- **Änderungsanomalie** (*update anomaly*): Café Bohne heißt künftig „Bohne & Blatt“. Der Name muss in drei Zeilen geändert werden; wird eine vergessen, hat C7 zwei verschiedene Namen – der Bestand ist inkonsistent.
- **Einfügeanomalie** (*insertion anomaly*): Die neue Sorte S31 „Morgentau“ soll ins Sortiment, ist aber noch nie geliefert worden. Ohne Lieferung fehlt ein Teil des Schlüssels (LiefNr) – die Sorte lässt sich nicht eintragen, ohne eine Scheinlieferung zu erfinden oder einen Schlüsselteil leer zu lassen.
- **Löschanomalie** (*deletion anomaly*): Lieferung L-501 wird storniert und gelöscht. Damit verschwinden auch die einzigen Angaben zur Sorte Rotblüte und zur Farm Las Nubes – obwohl nur die Lieferung weg sollte.

Alle drei Anomalien haben dieselbe Ursache: In einer Tabelle stecken mehrere Sachverhalte (Lieferung, Café, Sorte, Farm, Position), die unabhängig voneinander existieren.

## Funktionale Abhängigkeit

**Formal:** Seien X und Y Attributmengen einer Relation R. Die **funktionale Abhängigkeit** (*functional dependency*, FD) X → Y gilt, wenn in jeder zulässigen Ausprägung r von R für je zwei Tupel t₁, t₂ gilt:

t₁[X] = t₂[X] ⇒ t₁[Y] = t₂[Y]

Man liest „X bestimmt Y (funktional)“ oder „Y ist funktional abhängig von X“; X heißt **Determinante** (*determinant*). Das Zeichen ⇒ steht in dieser Formel und im ganzen Kurs für „daraus folgt“.

**Anschaulich:** Kennt man den Wert von X, gibt es genau einen passenden Wert von Y. In der Lieferliste gilt SortenNr → Sortenname: Jede Zeile mit S12 nennt „Bergnebel“.

**Formulierungsvariante:** Manche Texte sagen statt „genau ein“ lieber „**höchstens** ein“ Y-Wert. Der Grund sind Nullwerte und noch nicht erfasste Angaben: Ist Y leer, gibt es zu dem X-Wert gar keinen Y-Wert, aber eben nie zwei verschiedene. Beide Lesarten meinen dieselbe formale Bedingung oben.

Wichtig: Funktionale Abhängigkeiten sind **Regeln der Miniwelt**, keine Beobachtungen in Beispieldaten. Beispieldaten können eine FD höchstens widerlegen. In der Tabelle oben passt zu jedem Datum genau eine CafeNr – trotzdem gilt Datum → CafeNr nicht, weil die Rösterei an einem Tag mehrere Cafés beliefern darf.

Schreibweise: Mengenklammern lässt man meist weg (LiefNr, SortenNr → Menge_kg); X → A, B ist gleichbedeutend mit den beiden FDs X → A und X → B.

**Triviale FD** (*trivial functional dependency*): X → Y heißt trivial, wenn Y ⊆ X, z. B. {LiefNr, SortenNr} → SortenNr. Sie gilt immer und sagt nichts über die Miniwelt; bei der Prüfung von Normalformen zählen nur nicht-triviale FDs.

**Armstrong-Axiome** (*Armstrong's axioms*, Vertiefung): Aus gegebenen FDs lassen sich alle weiteren mit drei Regeln herleiten:

- Reflexivität: Ist Y ⊆ X, dann gilt X → Y.
- Verstärkung: Aus X → Y folgt XZ → YZ.
- Transitivität: Aus X → Y und Y → Z folgt X → Z.

Abgeleitete Regeln:

- Vereinigung: Aus X → Y und X → Z folgt X → YZ.
- Zerlegung: Aus X → YZ folgt X → Y (und X → Z).
- Pseudotransitivität: Aus X → Y und WY → Z folgt WX → Z. Beispiel: Aus LiefNr → CafeNr und {CafeNr, SortenNr} → Rabatt (ein Rabatt je Café und Sorte) folgt {LiefNr, SortenNr} → Rabatt.

## Volle, partielle und transitive Abhängigkeit

- **Volle funktionale Abhängigkeit** (*full functional dependency*): Y ist voll funktional abhängig von X, wenn X → Y gilt und für keine echte Teilmenge X' ⊊ X auch X' → Y gilt. Menge_kg hängt voll von {LiefNr, SortenNr} ab: Lieferung L-501 enthält mehrere Sorten, Sorte S12 kommt in mehreren Lieferungen vor – erst beide zusammen legen die Menge fest.
- **Partielle Abhängigkeit** (*partial dependency*): X → Y gilt, aber schon ein **echter Teil** von X bestimmt Y. {LiefNr, SortenNr} → Datum ist partiell, weil bereits LiefNr → Datum gilt. Partielle Abhängigkeiten setzen eine Determinante mit mindestens zwei Attributen voraus.
- **Transitive Abhängigkeit** (*transitive dependency*): Z hängt transitiv von X ab, wenn es eine Attributmenge Y gibt, für die gilt:
  1. X → Y und Y → Z,
  2. Y → X gilt **nicht**,
  3. Y ist in keinem Schlüsselkandidaten enthalten – im einfachsten Fall ist Y ein einzelnes Nichtschlüsselattribut,
  4. Z gehört weder zu X noch zu Y.

  Beispiel: SortenNr → FarmNr und FarmNr → Farmname. FarmNr ist ein Nichtschlüsselattribut und legt die Sorte nicht fest (eine Farm liefert mehrere Sorten). Farmname hängt also über FarmNr transitiv von SortenNr ab.

  Bedingung 3 trennt transitiv von partiell: In {LiefNr, SortenNr} → LiefNr → Datum ist das Zwischenglied LiefNr ein Schlüsselteil. Das ist eine **partielle** Abhängigkeit, keine transitive.

  Bedingung 2 schließt aus, dass Y seinerseits X festlegt. Hat jedes Café eine eindeutige Steuernummer, gilt CafeNr → Steuernummer → CafeName, aber auch Steuernummer → CafeNr: X und Y bestimmen sich gegenseitig. Weil CafeNr ein Schlüssel ist, ist Steuernummer dann ein Superschlüssel (hier sogar ein Schlüsselkandidat), und die Kette erzeugt keine Redundanz – **keine** transitive Abhängigkeit.

**Notationsvariante (transitive Abhängigkeit):** Viele Darstellungen definieren einfacher: X → Y und Y → Z, wobei Y kein Schlüssel(kandidat) bzw. ein Nichtschlüsselattribut ist; Y ↛ X wird nicht eigens verlangt. Für die Normalisierung ist das gleichwertig, denn dort ist X ein Schlüssel: Ist Y ein Nichtschlüsselattribut, kann Y → X nicht gelten – sonst wäre Y selbst ein Schlüsselkandidat. Die Fassung mit Y ↛ X macht diese Folgerung nur ausdrücklich. Beide Fassungen sind als Antwort richtig.

**Notationsvariante (Pfeilsymbole):** In manchen Texten wird die volle funktionale Abhängigkeit mit einem Doppelpfeil geschrieben (X ⇒ Y), und auch für die transitive Abhängigkeit gibt es eigene Pfeilsymbole. In diesem Kurs bedeutet ⇒ dagegen immer „daraus folgt“ (FD-Definition, Armstrong-Axiome), und ↠ steht für mehrwertige Abhängigkeiten (Ausblick 4NF). Volle, partielle und transitive Abhängigkeiten schreiben wir mit dem einfachen Pfeil → und nennen die Art in Worten. Prüfe in jedem anderen Text, was ein Doppelpfeil dort bedeutet.

## Attributhülle und Schlüsselkandidaten (Vertiefung)

Dieser Abschnitt geht über das Minimum hinaus. In vielen Aufgaben lässt sich der Schlüssel direkt aus den Geschäftsregeln ablesen; die Attributhülle ist das Werkzeug für unübersichtliche FD-Mengen oder mehrere Schlüsselkandidaten. Primattribut und Nichtschlüsselattribut (Ende des Abschnitts) brauchst du dagegen für jede Normalform.

Die **Attributhülle** (*attribute closure*) X⁺ einer Attributmenge X ist die Menge aller Attribute, die sich mit der FD-Menge F aus X herleiten lassen. Berechnung:

1. Setze X⁺ := X.
2. Suche eine FD A → B aus F, deren linke Seite A vollständig in X⁺ liegt, und füge B zu X⁺ hinzu.
3. Wiederhole Schritt 2, bis sich X⁺ nicht mehr ändert.

Damit prüfst du dreierlei:

- X → Y gilt genau dann, wenn Y ⊆ X⁺.
- X ist **Superschlüssel** (*superkey*), wenn X⁺ alle Attribute von R enthält.
- X ist **Schlüsselkandidat** (Kandidatenschlüssel, *candidate key*), wenn X Superschlüssel ist und kein Attribut weggelassen werden kann (Minimalität).

Für die Lieferliste gelten:

- F1: LiefNr → Datum, CafeNr
- F2: CafeNr → CafeName
- F3: SortenNr → Sortenname, FarmNr, Kilopreis
- F4: FarmNr → Farmname
- F5: LiefNr, SortenNr → Menge_kg

Berechnung von {LiefNr, SortenNr}⁺: Start {LiefNr, SortenNr}; F1 ergänzt Datum, CafeNr; F2 ergänzt CafeName; F3 ergänzt Sortenname, FarmNr, Kilopreis; F4 ergänzt Farmname; F5 ergänzt Menge_kg – das sind alle zehn Attribute, also ein Superschlüssel. {LiefNr}⁺ = {LiefNr, Datum, CafeNr, CafeName} und {SortenNr}⁺ = {SortenNr, Sortenname, FarmNr, Kilopreis, Farmname} reichen nicht – {LiefNr, SortenNr} ist minimal und damit Schlüsselkandidat.

**Faustregeln** (folgen direkt aus dem Verfahren): Ein Attribut, das auf keiner rechten Seite vorkommt, muss in jedem Schlüsselkandidaten stecken. Ein Attribut, das nur rechts und nie links vorkommt, gehört zu keinem Schlüsselkandidaten. Hier stehen LiefNr und SortenNr nie rechts – deshalb ist {LiefNr, SortenNr} der einzige Schlüsselkandidat.

Ein **Primattribut** (*prime attribute*) ist in mindestens einem Schlüsselkandidaten enthalten, ein **Nichtschlüsselattribut** (*non-prime attribute*, auch Nichtprimattribut) in keinem. In der Lieferliste sind LiefNr und SortenNr Primattribute, alle anderen Nichtschlüsselattribute.

## Die Normalformen 0NF bis 3NF

### 0NF: unnormalisierte Form

So sah die Lieferliste ursprünglich aus – ein Lieferschein pro Zeile:

| LiefNr | Datum | Café | Positionen |
|---|---|---|---|
| L-501 | 03.03.2027 | C7 Café Bohne | S12 Bergnebel (F3 Finca Alta, 24,00 €/kg): 5 kg; S15 Rotblüte (F8 Las Nubes, 21,50 €/kg): 2 kg |
| L-502 | 04.03.2027 | C9 Rösterbar Süd | S12 Bergnebel (F3 Finca Alta, 24,00 €/kg): 3 kg |
| L-503 | 05.03.2027 | C7 Café Bohne | S20 Seeufer (F3 Finca Alta, 19,00 €/kg): 4 kg |

Typisch für die **unnormalisierte Form** (*unnormalized form*, UNF):

- **Wiederholungsgruppen** (*repeating groups*): Eine Zelle enthält mehrere gleichartige Wertgruppen (hier die Positionen) – oder es gibt nummerierte Spalten wie Sorte1, Sorte2, Sorte3.
- **Nicht atomare Werte**: Eine Zelle fasst mehrere Angaben zusammen („C7 Café Bohne“ = Nummer und Name).

**Notationsvariante:** Die Bezeichnung „0. Normalform“ (0NF) ist vor allem in deutschsprachigen Lehrtexten üblich; in den Quellen ist von *unnormalisierter Form* (UNF) oder von *Non-First-Normal-Form* (NF²) die Rede. Vorsicht bei NF²: Wörtlich heißt es nur „nicht in erster Normalform“. Der Begriff wird aber auch für **bewusst geschachtelte Relationen** verwendet, in denen ein Attributwert selbst eine Relation ist, wie es objektrelationale Systeme erlauben. Dort ist die Schachtelung ein gewolltes Modell und kein Entwurfsfehler.

### 1NF: atomare Werte, keine Wiederholungsgruppen

**Definition:** Eine Relation ist in **erster Normalform** (1NF), wenn

- jedes Attribut einen festen **Wertebereich** (*domain*, Domäne) hat, d. h. alle Werte einer Spalte haben denselben Datentyp: Kilopreis enthält nur Dezimalzahlen, nicht mal „24,00“ und mal „auf Anfrage“,
- dieser Wertebereich **unstrukturiert** ist: Jeder Attributwert ist ein einzelner, unteilbarer (**atomarer**) Wert – keine Menge, Liste oder Aufzählung, kein zusammengesetzter Datensatz und keine eingebettete Tabelle. Mengen- oder tupelwertige Typen (Typkonstruktoren) sind also ausgeschlossen,
- es **keine Wiederholungsgruppen** gibt, weder als mehrere Werte in einer Zelle noch als nummerierte Spalten gleicher Bedeutung (Sorte1, Sorte2, …).

**Schritt:** Wiederholungsgruppe auflösen – jede Position erhält eine eigene Zeile, die Kopfdaten (LiefNr, Datum, Café) werden wiederholt; zusammengesetzte Zellen werden in Einzelattribute zerlegt („C7 Café Bohne“ → CafeNr, CafeName). Ergebnis ist die flache Tabelle aus dem Abschnitt „Anomalien“ mit dem Schlüssel {LiefNr, SortenNr}. Die 1NF beseitigt also nicht die Redundanz – sie macht sie erst sichtbar.

Alternativ lässt sich die Wiederholungsgruppe gleich in eine eigene Relation auslagern (Lieferkopf und Positionen getrennt); das nimmt einen Teil der 2NF vorweg. Beide Wege sind üblich.

**Notationsvariante:** Manche Definitionen verlangen für die 1NF zusätzlich, dass keine zwei Zeilen gleich sind bzw. dass ein Primärschlüssel festgelegt ist; andere zählen das nicht zur 1NF.

**Hinweis:** Was „atomar“ ist, hängt von der Verwendung ab. Eine Lieferadresse als ein Textfeld ist unproblematisch, solange nie nach Ort gesucht oder sortiert wird.

### 2NF: keine partiellen Abhängigkeiten

**Definition:** Eine Relation ist in **zweiter Normalform** (2NF), wenn sie in 1NF ist und jedes Nichtschlüsselattribut von **jedem** Schlüsselkandidaten voll funktional abhängig ist – kein Nichtschlüsselattribut hängt also schon von einem echten Teil eines Schlüsselkandidaten ab.

**Prüfung am Beispiel:** Datum, CafeNr und CafeName hängen schon von LiefNr allein ab (F1, F2); Sortenname, FarmNr, Kilopreis und Farmname schon von SortenNr allein (F3, F4). Nur Menge_kg hängt voll vom Schlüssel ab. Die Lieferliste ist nicht in 2NF.

**Schritt:** Für jede partielle Abhängigkeit wird die Determinante mit allen von ihr abhängigen Attributen in eine eigene Relation ausgelagert (dort ist sie Primärschlüssel); in der Ursprungsrelation bleibt die Determinante als Fremdschlüssel stehen.

- Lieferung(<u>LiefNr</u>, Datum, CafeNr, CafeName)
- Sorte(<u>SortenNr</u>, Sortenname, FarmNr, Farmname, Kilopreis)
- Position(<u>LiefNr → Lieferung, SortenNr → Sorte</u>, Menge_kg)

**Notationsvariante (wichtig):** Viele Darstellungen formulieren die 2NF über den **Primärschlüssel**: Jedes Nichtschlüsselattribut hängt voll vom Primärschlüssel ab. Daraus stammt die verbreitete Faustregel „Besteht der Primärschlüssel aus nur einem Attribut, ist eine 1NF-Relation automatisch in 2NF“ bzw. „die 2NF ist nur bei zusammengesetztem Schlüssel relevant“.

- Ist der Primärschlüssel der **einzige** Schlüsselkandidat – der häufigste Fall –, stimmen beide Fassungen überein, und die Faustregel ist richtig.
- Unterschiede gibt es nur, wenn zusätzlich ein **zusammengesetzter Alternativschlüssel** existiert. Nach der Definition über alle Schlüsselkandidaten (Kursfassung) kann ein Nichtschlüsselattribut partiell von diesem Alternativschlüssel abhängen; dann ist die Relation nicht in 2NF, obwohl der Primärschlüssel einattributig ist. In der Primärschlüssel-Fassung gelten die Attribute des Alternativschlüssels als Nichtschlüsselattribute, und dieselbe Abhängigkeit fällt in der Regel erst bei der 3NF als transitive Abhängigkeit auf. Die zerlegten Relationen sind am Ende dieselben.

Präzise gilt in beiden Fassungen: Sind **alle** Schlüsselkandidaten einattributig, ist eine 1NF-Relation automatisch in 2NF. Gib bei einer Begründung an, auf welche Fassung du dich stützt.

### 3NF: keine transitiven Abhängigkeiten

**Definition:** Eine Relation ist in **dritter Normalform** (3NF), wenn sie in 2NF ist und kein Nichtschlüsselattribut transitiv von einem Schlüsselkandidaten abhängt.

Gleichwertig und oft schneller zu prüfen: Für jede nicht-triviale FD X → A gilt: X ist Superschlüssel **oder** A ist ein Primattribut.

**Prüfung am Beispiel:** In Lieferung gilt LiefNr → CafeNr → CafeName, CafeNr ist kein Schlüssel. In Sorte gilt SortenNr → FarmNr → Farmname. Beide Relationen verletzen die 3NF.

**Schritt:** Das transitiv abhängige Attribut wandert mit seiner direkten Determinante in eine eigene Relation; die Determinante bleibt als Fremdschlüssel zurück.

- Cafe(<u>CafeNr</u>, CafeName)
- Lieferung(<u>LiefNr</u>, Datum, CafeNr → Cafe)
- Farm(<u>FarmNr</u>, Farmname)
- Sorte(<u>SortenNr</u>, Sortenname, Kilopreis, FarmNr → Farm)
- Position(<u>LiefNr → Lieferung, SortenNr → Sorte</u>, Menge_kg)

Probe an den Anomalien: Die Umbenennung von C7 betrifft eine Zeile; Morgentau lässt sich ohne Lieferung in Sorte eintragen; das Löschen von L-501 entfernt nur Lieferkopf und Positionen – Rotblüte und Las Nubes bleiben erhalten.

**Notationsvarianten:**

- Als Merksatz liest man oft, Nichtschlüsselattribute dürften nur vom Schlüssel abhängen und nicht voneinander. Das ist leicht zu behalten, erfasst aber nicht jeden Fall: Eine Determinante aus einem Schlüsselteil **und** einem Nichtschlüsselattribut wirkt nach dem Merksatz unauffällig. Angenommen, Position(<u>LiefNr, SortenNr</u>, Menge_kg, Verpackung, Versandart) und je Lieferung und Verpackungsart ist die Versandart fest: {LiefNr, Verpackung} → Versandart. Die Determinante ist kein Superschlüssel und Versandart kein Primattribut – die 3NF ist verletzt.
- Manche Texte sprechen nur vom Primärschlüssel statt von allen Schlüsselkandidaten (siehe 2NF).
- Gleichwertig zur Kursfassung ist die Begründung „ein Nichtschlüsselattribut hängt transitiv vom Schlüssel ab“; der Test über Superschlüssel und Primattribut ist nur die schneller prüfbare Form.
- Manche Lehrtexte nennen die BCNF (siehe Ausblick) „dritte Normalform nach Boyce-Codd“ und die hier definierte 3NF „3NF nach Codd“. Schreibt ein solcher Text danach nur „3NF“, ist oft die strengere BCNF gemeint. Prüfe deshalb, welche Definition hinter dem Kürzel steht.

## Verlustfreie Zerlegung und Abhängigkeitserhaltung

Jeder Normalisierungsschritt ist eine **Zerlegung** (*decomposition*, auch Dekomposition) einer Relation in Projektionen. Zwei Eigenschaften soll sie haben.

**Verlustfreie Zerlegung** (*lossless decomposition*, auch *lossless join*, verlustlose oder verbundtreue Zerlegung): Der natürliche Verbund der Teilrelationen ergibt für jede zulässige Ausprägung wieder genau die Ausgangsrelation: π_{R1}(r) ⋈ π_{R2}(r) = r. „Verlust“ heißt dabei nicht, dass Zeilen fehlen – der Verbund enthält immer alle ursprünglichen Tupel –, sondern dass zusätzliche **Scheintupel** (*spurious tuples*, auch unechte Tupel) entstehen und die echten Kombinationen nicht mehr erkennbar sind.

**Kriterium für zwei Teile:** Die Zerlegung von R in R1 und R2 ist verlustfrei, wenn die gemeinsamen Attribute R1 ∩ R2 einen der beiden Teile funktional bestimmen (also Superschlüssel von R1 oder von R2 sind).

Gegenbeispiel: Am 04.03. gehen zwei Lieferungen raus, L-502 an C9 und L-504 an C7. Zerlegt man in A(LiefNr, Datum) und B(Datum, CafeNr), ist das gemeinsame Attribut Datum in keinem Teil Schlüssel. Allein für die Zeilen dieses Tages liefert der Verbund A ⋈ B vier statt zwei Tupel, darunter die Scheintupel (L-502, 04.03., C7) und (L-504, 04.03., C9); an jedem weiteren Tag mit mehreren Lieferungen kommen weitere hinzu. Richtig wäre (LiefNr, Datum) und (LiefNr, CafeNr) – LiefNr ist Schlüssel beider Teile.

**Abhängigkeitserhaltung** (*dependency preservation*, auch abhängigkeitstreue Zerlegung): Jede FD der Ausgangsrelation lässt sich nach der Zerlegung innerhalb der Teilrelationen prüfen – genauer: Aus den FDs, die in den einzelnen Teilen gelten, lässt sich die ganze ursprüngliche FD-Menge herleiten.

**Formulierungsvariante:** Häufig wird einfacher verlangt, dass jede ursprüngliche FD vollständig in einer der Teilrelationen liegt. Das ist ein hinreichender Spezialfall der Kursfassung: Wer so zerlegt, ist auf der sicheren Seite. Die Kursfassung erlaubt zusätzlich, dass sich eine FD erst aus den FDs mehrerer Teile herleiten lässt. Gegenbeispiel: Lieferung(LiefNr, Datum, CafeNr, CafeName) wird in (LiefNr, Datum, CafeNr) und (LiefNr, CafeName) zerlegt. Das ist verlustfrei, aber CafeNr → CafeName liegt in keinem Teil mehr; das DBMS kann nicht verhindern, dass zwei Lieferungen an C7 verschiedene Café-Namen tragen. Richtig ist die Zerlegung entlang der FD: (CafeNr, CafeName).

Die 3NF lässt sich immer verlustfrei **und** abhängigkeitserhaltend erreichen; für die BCNF ist verlustfrei immer möglich, abhängigkeitserhaltend nicht immer (siehe Ausblick).

## Denormalisierung

**Denormalisierung** (*denormalization*) nimmt eine Normalisierung bewusst zurück und speichert Daten wieder redundant. Man entwirft zuerst vollständig normalisiert und denormalisiert erst im physischen Entwurf gezielt einzelne Stellen.

**Warum:** vor allem Leseleistung – weniger Verbunde für häufige Auswertungen oder Berichte. Typische Formen:

- Attribute zurückholen: Farmname wieder in Sorte speichern, weil die Etiketten-Druckliste ihn ständig braucht.
- vorberechnete Aggregate: Gesamtmenge je Lieferung in Lieferung ablegen, statt sie jedes Mal aus Position zu summieren.
- Rücknahme der 1NF, z. B. eine fertig formatierte Anschrift als ein Feld.

**Risiken:** Die Anomalien kehren zurück; redundante Kopien müssen synchron gehalten werden (z. B. per Trigger), was Schreibvorgänge und Massenänderungen verlangsamt; mehr Speicher. Vorher lohnt der Blick auf Alternativen ohne Redundanz im Schema, etwa einen Index oder eine materialisierte Sicht. Eine Denormalisierung sollte dokumentiert und ihre Konsistenzsicherung festgelegt sein.

**Abgrenzung:** Den Kilopreis *zum Lieferzeitpunkt* in Position zu speichern, ist eine eigene Tatsache – SortenNr → Lieferpreis gilt nicht, weil sich der Listenpreis ändern kann. Manche Darstellungen nennen das trotzdem eine bewusste Abweichung von der Normalform; formal verletzt es keine Normalform.

## Ausblick: BCNF und 4. Normalform

Die folgenden Normalformen gehören zum Ausblick: Du solltest sie einordnen und an einem kleinen Beispiel erkennen können; der Schwerpunkt des Themas liegt bei 1NF bis 3NF.

**Boyce-Codd-Normalform** (BCNF): Für jede nicht-triviale FD X → A ist X ein Superschlüssel – jede Determinante ist ein Schlüssel. Die BCNF ist strenger als die 3NF, weil die Ausnahme „A ist Primattribut“ wegfällt. Ein Unterschied entsteht nur bei mehreren, sich überlappenden zusammengesetzten Schlüsselkandidaten.

Mini-Beispiel: Bezug(Café, Sorte, Röster:in). Jede Röster:in ist auf genau eine Sorte spezialisiert (Röster:in → Sorte); jedes Café bezieht jede Sorte von genau einer Röster:in (Café, Sorte → Röster:in). Schlüsselkandidaten sind {Café, Sorte} und {Café, Röster:in}; alle Attribute sind Primattribute, also 3NF. Röster:in → Sorte hat aber keinen Superschlüssel als Determinante – keine BCNF. Die Zerlegung in (Röster:in, Sorte) und (Café, Röster:in) ist verlustfrei, aber die FD Café, Sorte → Röster:in lässt sich danach in keinem Teil mehr prüfen.

**4. Normalform** (4NF): betrifft **mehrwertige Abhängigkeiten** (*multivalued dependencies*, MVD) X ↠ Y – zu einem X-Wert gehört eine ganze Menge von Y-Werten, unabhängig von den übrigen Attributen. Eine Relation ist in 4NF, wenn sie in BCNF ist und jede nicht-triviale MVD einen Superschlüssel als linke Seite hat.

Mini-Beispiel aus einer Tauchschule: Lehrkraft(Kürzel, Sprache, Spezialkurs). Tom Berg unterrichtet auf Deutsch und Englisch und bietet Nacht- und Strömungstauchen an. Sprachen und Kurse sind voneinander unabhängig, also braucht es alle vier Kombinationen als Zeilen. Die Relation ist schlüsselvoll (alle Attribute bilden zusammen den einzigen Schlüssel) und damit in BCNF – trotzdem erfordert eine neue Sprache zwei neue Zeilen. Lösung: (Kürzel, Sprache) und (Kürzel, Spezialkurs).

**Weitere Normalformen:** Die Reihe endet nicht bei der 4NF. Die **5. Normalform** (5NF) betrifft Verbundabhängigkeiten (*join dependencies*): Manche Relationen lassen sich nur in drei oder mehr Teile verlustfrei zerlegen, nicht in zwei. Jede Relation in 5NF ist auch in 4NF, jede in 4NF auch in BCNF und so weiter. In der Praxis endet der Entwurf meist bei 3NF oder BCNF.

## Auf einen Blick

- Redundanz verursacht Einfüge-, Änderungs- und Löschanomalien.
- X → Y: gleiche X-Werte erzwingen gleiche Y-Werte; FDs stammen aus Regeln der Miniwelt, nicht aus Beispieldaten.
- Trivial: Y ⊆ X. Voll: kein echter Teil von X reicht. Partiell: ein echter Teil reicht. Transitiv: X → Y → Z über ein Zwischenglied Y, das kein Schlüsselteil ist und X nicht bestimmt (Y ↛ X).
- X⁺ berechnen (Vertiefung): Start bei X, rechte Seiten anwendbarer FDs hinzufügen, bis nichts mehr dazukommt; Superschlüssel ⇔ X⁺ = alle Attribute; Schlüsselkandidat = minimaler Superschlüssel.
- 0NF: Wiederholungsgruppen/nicht atomare Werte. 1NF: einheitlicher, unstrukturierter Wertebereich je Spalte, atomare Werte, keine Wiederholungsgruppen.
- 2NF: 1NF + kein Nichtschlüsselattribut hängt von einem echten Teil eines Schlüsselkandidaten ab. Faustregel „einattributiger Primärschlüssel ⇒ 2NF“ gilt, wenn er der einzige Schlüsselkandidat ist.
- 3NF: 2NF + keine transitive Abhängigkeit eines Nichtschlüsselattributs; Kurztest: X Superschlüssel oder A Primattribut.
- Zerlegungen müssen verlustfrei (gemeinsame Attribute sind Schlüssel eines Teils) und möglichst abhängigkeitserhaltend sein.
- Denormalisierung nur gezielt, begründet und mit Konsistenzsicherung.
- Ausblick: BCNF: jede Determinante ist Superschlüssel. 4NF: keine unabhängigen mehrwertigen Fakten in einer Relation. 5NF: Verbundabhängigkeiten.
- Schemata im Kurs: Primärschlüssel <u>unterstrichen</u>, Fremdschlüssel mit nachgestelltem Pfeil auf die Zielrelation (CafeNr → Cafe).
