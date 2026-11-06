---
id: t05
lang: de
title: Relationales Modell & Integrität
order: 5
status: reviewed
reviews: [fach, aufgaben, leak]
sources:
  - id: wpen-relational-model
    ref: "Abschnitte zu Relation, Tupel, Attribut, Domäne (heading/body, degree, cardinality), Eigenschaften (keine Duplikate, keine Ordnung, atomare Werte), „Keys“ (candidate, primary, alternate, foreign key auf candidate key) und „Integrity constraints“ (beliebige Bedingungen, Key- und Foreign-Key-Constraints als häufigste Fälle)"
  - id: wp-relation-datenbank
    ref: "Abschnitte „Relationen als Tabellen“ und „Definition“ (Teilmenge des kartesischen Produkts der Wertebereiche, Grad/Stelligkeit, Kardinalität, keine Duplikate, Abweichung von SQL)"
  - id: wp-relationale-datenbank
    ref: "Abschnitte „Grundlegende Konzepte“, „Datenbankschema und Modellierung“ und „Gegenüberstellung von Grundbegriffen“ (Relation/Tabelle, Tupel/Zeile, Attribut/Spalte)"
  - id: wikibooks-en-relational-database-design
    ref: "Kapitel „Basic Concepts“ (relation, tuple, attribute, domain, arity, cardinality; https://en.wikibooks.org/wiki/Relational_Database_Design/Basic_Concepts) und „Constraints“ (Primary keys, Foreign keys, Other Constraints; https://en.wikibooks.org/wiki/Relational_Database_Design/Constraints)"
  - id: watt-database-design-2e
    ref: "Kap. 7 The Relational Data Model (domain, degree, Eigenschaften einer Tabelle); Kap. 9 Integrity Rules and Constraints (Domain Integrity, Entity Integrity, Referential Integrity, Foreign Key Rules, Enterprise Constraints, Business Rules)"
  - id: wp-schluessel-datenbank
    ref: "Abschnitte „Formale Definition“ (Definiertheit), „Primärschlüssel und Alternativschlüssel“, „Fremdschlüssel“ (kompatible Wertebereiche, Verweis auf Schlüsselkandidat bzw. Alternativschlüssel, zusammengesetzt, Selbstreferenz)"
  - id: wp-referentielle-integritaet
    ref: "Abschnitte „Definitionen“, „Erweiterungen / Besonderheiten“ (Lösch- und Änderungsweitergabe, Selbstreferenz mit NULL, Wertebereichsintegrität als abgegrenzte Integritätsart), „Technische Umsetzung“ (kompatible Datentypen, mehrspaltige Schlüssel)"
  - id: oer-informatik-relationenmodell
    ref: "Abschnitte „Grundbegriffe: Tabellen, Datensätze und Schlüssel“ (PK eindeutig und nie NULL), „Referentielle Integrität“ mit Löschregeln (RESTRICT/NO ACTION, CASCADE, SET NULL), Fremdschlüssel: NULL bei Optionalität und gleicher Datentyp, „Was das Relationenmodell nicht ausdrücken kann“ (Trigger, Anwendung)"
  - id: postgresql-17-docs-sql
    ref: "5.5 Constraints (CHECK bei TRUE oder NULL erfüllt, CHECK nicht über andere Zeilen/Tabellen, PRIMARY KEY = UNIQUE + NOT NULL, UNIQUE mit mehreren NULL, FK auf PK/UNIQUE, FK-Spalten NULL-fähig, MATCH FULL, gleiche Anzahl und Typen, referenzielle Aktionen): https://www.postgresql.org/docs/17/ddl-constraints.html ; Kap. 37 Triggers; ergänzend aus derselben Dokumentation (außerhalb Teil II) Appendix D.2 Unsupported Features (CREATE ASSERTION nicht unterstützt): https://www.postgresql.org/docs/17/unsupported-features-sql-standard.html"
  - id: postgresql-17-docs-sql-commands
    ref: "CREATE DOMAIN (VALUE im CHECK, TRUE oder UNKNOWN erfüllt, eine Regel für viele Spalten): https://www.postgresql.org/docs/17/sql-createdomain.html ; CREATE TABLE (CHECK ohne Unterabfragen): https://www.postgresql.org/docs/17/sql-createtable.html"
  - id: firebird-30-language-reference
    ref: "Kap. 5.3.1 CREATE DOMAIN (CHECK mit VALUE, nur FALSE wird abgewiesen; Beispiel mit Unterabfrage im Domänen-CHECK); Kap. 5.4.1 CREATE TABLE, Constraints (PRIMARY KEY mit NOT-NULL-Spalten, UNIQUE mit NULL, FOREIGN KEY auf PK oder UNIQUE, ohne Spaltenangabe PK, ON DELETE/ON UPDATE: NO ACTION (Standard), CASCADE, SET DEFAULT, SET NULL; Spalten- und Tabellen-Constraints; CHECK geprüft bei INSERT/UPDATE der Zeile); Kap. 5.7.1 CREATE TRIGGER (BEFORE/AFTER, INSERT/UPDATE/DELETE); Kap. 5.15 CREATE EXCEPTION"
  - id: wp-integritaetsbedingung
    ref: "Abschnitt „Definition“ (Annahmen über Daten wie Datentyp, Wertebereich, Abhängigkeiten; konsistenter Zustand erfüllt alle Bedingungen; Prüfung durch das System statt nur durch Programmierer; Reaktion durch Unterbinden der Änderung oder Folgeänderungen, Verweis auf Trigger) und „Beispiele“ › Datenbanken (Schlüssel, Fremdschlüssel)"
  - id: sqlite-documentation
    ref: "Foreign Key Support (Abschn. 1 NULL im Kindschlüssel, 2 Aktivierung per PRAGMA foreign_keys, 3 Elternschlüssel PK oder UNIQUE, 4.1 zusammengesetzte Fremdschlüssel, 4.3 ON DELETE/ON UPDATE): https://www.sqlite.org/foreignkeys.html"
  - id: wp-datenbanktrigger
    ref: "Abschnitt „Eigenschaften“ (Auslösung bei INSERT/UPDATE/DELETE, BEFORE/AFTER, Einsatz für Integritätsprüfungen)"
---

# Relationales Modell & Integrität

## Lernziele

Nach diesem Thema kannst du …

- Relation, Tupel, Attribut, Domäne, Grad und Kardinalität formal und in der Tabellensicht erklären und an einer Tabelle ablesen,
- die Eigenschaften einer Relation (keine Duplikate, keine Ordnung, atomare Werte) begründen und sagen, wo SQL-Tabellen davon abweichen,
- Entitäts-, referenzielle, Domänen- und benutzerdefinierte Integrität unterscheiden und zu jeder ein eigenes Beispiel mit passendem Sicherungsmittel nennen,
- für eine konkrete Änderung vorhersagen, ob das DBMS sie ausführt oder abweist – und welche Bedingung dabei greift,
- deklarative und prozedurale Integritätssicherung vergleichen und begründen, wann ein Trigger nötig ist,
- ein Schema auf die Eigenschaften seiner Fremdschlüssel prüfen: Verweisziel, Datentyp, NULL-Fähigkeit, referenzielle Aktion.

## Worum es geht

Das **relationale Modell** (*relational model*) geht auf E. F. Codd (1970) zurück. Es legt fest, wie Daten logisch aussehen – als Relationen – und welche Regeln diese Daten immer erfüllen müssen. Wie man ein ER-Modell in Relationen übersetzt, steht in t06; hier geht es um das Modell selbst und um die **Integrität** der Daten.

Laufendes Beispiel ist die Musikschul-Datenbank (`db/musikschule`). Die Kurzschreibweise ist dieselbe wie in t06 und t07: Primärschlüssel unterstrichen, Fremdschlüssel mit Pfeil auf die Zieltabelle. *Notationsvarianten:* Andere Darstellungen hängen `(PK)`, `(FK)` an die Spalte oder markieren Fremdschlüssel gestrichelt, kursiv oder mit einem vorangestellten Zeichen wie `↑` oder `#` (siehe t06). Inhaltlich ist das gleich.

Auszug (nicht alle Spalten; weitere Tabellen wie `schueler`, `instrument`, `termin`, `ausleihe`, `vertretung` und `zahlung` stehen im README der Datenbank):

- person(<u>person_id</u>, vorname, nachname, geburtsdatum, email, telefon, ort)
- lehrkraft(<u>person_id → person</u>, eingestellt_am, stundensatz, hauptinstrument_id → instrument)
- raum(<u>raum_id</u>, bezeichnung, etage, plaetze, hat_klavier)
- kurs(<u>kurs_id</u>, titel, instrument_id → instrument, lehrkraft_id → lehrkraft, raum_id → raum, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum)
- belegung(<u>schueler_id → schueler, kurs_id → kurs</u>, angemeldet_am, abgemeldet_am, rabatt_prozent)

`kurs.lehrkraft_id` verweist auf `lehrkraft.person_id` – der Name eines Fremdschlüssels muss nicht mit dem Namen der Zielspalte übereinstimmen.

## Relation, Tupel, Attribut, Domäne

| Begriff | Tabellensicht | englisch |
|---|---|---|
| Relation | Tabelle | *relation* |
| Tupel | Zeile, Datensatz | *tuple* |
| Attribut | Spalte | *attribute* |
| Domäne (Wertebereich) | erlaubte Werte einer Spalte | *domain* |
| Relationenschema | Tabellenkopf: Name, Spalten, Domänen | *relation schema* |
| Grad (Stelligkeit) | Anzahl der Spalten | *degree*, *arity* |
| Kardinalität | Anzahl der Zeilen | *cardinality* |

**Formal.** Eine **Domäne** D ist eine Menge zulässiger, atomarer Werte. Ein **Relationenschema** R(A₁, …, Aₙ) ordnet jedem Attribut Aᵢ eine Domäne Dᵢ = dom(Aᵢ) zu. Eine **Relation** r über R ist eine Teilmenge des kartesischen Produkts dieser Domänen:

r ⊆ D₁ × D₂ × … × Dₙ

Jedes Element von r ist ein **Tupel** (v₁, …, vₙ) mit genau einem Wert vᵢ aus Dᵢ je Attribut. „Teilmenge“ ist der entscheidende Punkt: Das Produkt enthält jede denkbare Kombination – auch einen Raum „Saal“ in der 7. Etage mit 4 Plätzen. Gespeichert ist nur die kleine Auswahl, die die Miniwelt gerade beschreibt.

**Beispiel** (Werte zur Illustration, nicht aus den Seed-Daten):

| raum_id | bezeichnung | etage | plaetze | hat_klavier |
|---|---|---|---|---|
| 1 | Saal | 0 | 30 | TRUE |
| 2 | Studio A | 1 | 4 | TRUE |
| 3 | Probenkeller | -1 | 12 | FALSE |

- Grad = 5, Kardinalität = 3. Ein `INSERT` ändert die Kardinalität, der Grad ändert sich nur durch eine Schemaänderung (`ALTER TABLE`).
- (2, 'Studio A', 1, 4, TRUE) ist ein Tupel, `plaetze` ein Attribut.
- dom(hat_klavier) = {TRUE, FALSE}; dom(plaetze) sind die positiven ganzen Zahlen. Der Datentyp `SMALLINT` allein ließe auch −3 zu – **eine Domäne kann enger sein als der Datentyp.**

**Schema und Ausprägung.** Das Relationenschema beschreibt den Aufbau und bleibt meist lange gleich. Die **Ausprägung** (der Zustand) ist die Menge der Tupel, die gerade gespeichert ist; sie ändert sich mit jeder Datenänderung.

**Datenbankschema und relationale Datenbank.** Die Menge aller Relationenschemata einer Anwendung (samt ihren Integritätsbedingungen) heißt **Datenbankschema** (*database schema*). Eine **relationale Datenbank** ist dann eine Menge von Relationen, je eine Ausprägung zu jedem Relationenschema. Innerhalb eines Datenbankschemas sind die Relationennamen eindeutig, so wie die Attributnamen innerhalb einer Relation. Die Musikschule hat ein Datenbankschema mit elf Relationenschemata, `raum` gibt es darin genau einmal.

**Verwechslungsgefahr:**
- Die Kardinalität einer *Relation* ist eine Anzahl von Tupeln – nicht die Kardinalität eines *Beziehungstyps* im ER-Modell (t04, z. B. 1:n).
- „Relation“ kommt von der mathematischen Relation und bedeutet nicht „Beziehung“ (*relationship*).

## Eigenschaften einer Relation

Weil eine Relation eine Menge ist, gilt:

1. **Keine doppelten Tupel.** Jedes Tupel kommt höchstens einmal vor. Daraus folgt: Jede Relation hat mindestens einen Schlüsselkandidaten – spätestens die Menge aller Attribute ist ein Superschlüssel, und durch Weglassen überflüssiger Attribute erhält man einen minimalen (Superschlüssel, Schlüsselkandidat, Primärschlüssel: siehe t04, t07).
2. **Keine Reihenfolge der Tupel.** Es gibt keine „erste“ oder „dritte“ Zeile; ein Tupel findet man über seine Werte, also über einen Schlüssel – nicht über seine Position.
3. **Keine Reihenfolge der Attribute.** Attribute werden über ihren Namen angesprochen; deshalb sind die Namen innerhalb einer Relation eindeutig.
   *Variante:* In der rein mathematischen Schreibweise r ⊆ D₁ × … × Dₙ ist ein Tupel eine geordnete Liste, die Position zählt also. Darstellungen mit benannten Attributen fassen ein Tupel als Zuordnung „Attributname → Wert“ auf; dann spielt die Spaltenfolge keine Rolle. Inhaltlich beschreiben beide dasselbe.
4. **Atomare Werte aus einer Domäne.** Jede Zelle enthält genau einen unteilbaren Wert aus der Domäne ihres Attributs – keine Liste. Das ist die 1. Normalform (t07).

**SQL-Tabellen weichen ab:**
- Ohne `PRIMARY KEY` oder `UNIQUE` sind doppelte Zeilen möglich – Tabellen sind Multimengen (t08).
- Spalten haben eine feste Reihenfolge (`SELECT *`, `INSERT` ohne Spaltenliste).
- Ohne `ORDER BY` ist die Zeilenfolge nicht festgelegt.
- `NULL` markiert einen fehlenden Wert. Es ist kein Element einer Domäne und führt zur dreiwertigen Logik (t10).

## Integritätsbedingungen im Überblick

Eine **Integritätsbedingung** (*integrity constraint*) ist eine Regel, die jeder zulässige Zustand der Datenbank erfüllen muss; sie gehört zum Schema. Sind alle Bedingungen erfüllt, ist die Datenbank **konsistent**. Das DBMS weist jede Änderung zurück, die eine Bedingung verletzen würde.

| Art | Leitfrage | typisches Mittel | Beispiel Musikschule |
|---|---|---|---|
| Entitätsintegrität | Ist jedes Tupel eindeutig identifizierbar? | `PRIMARY KEY` | PK (schueler_id, kurs_id) in `belegung` |
| referenzielle Integrität | Zeigt jeder Verweis auf etwas Vorhandenes? | `FOREIGN KEY` | `kurs.lehrkraft_id → lehrkraft` |
| Domänenintegrität | Liegt jeder Wert im erlaubten Bereich? | Datentyp, `NOT NULL`, `CHECK` auf eine Spalte, `CREATE DOMAIN` | `niveau` nur aus drei Stufen |
| benutzerdefinierte Integrität | Gilt die fachliche Regel? | `CHECK` über mehrere Spalten, Trigger | `enddatum >= startdatum`, Kursgröße |

*Varianten bei Einteilung und Namen:*
- **Kurznamen:** In manchen Darstellungen heißen die Arten nach dem Gegenstand der Regel, etwa **Primärschlüsselbedingung**, **Fremdschlüsselbedingung** und **Attributbedingung**. Die Domänenintegrität heißt auch **Wertebereichsintegrität**. Die Kurznamen sind nicht überall genau gleich abgegrenzt. So meint „Primärschlüsselbedingung“ mitunter nur die Festlegung höchstens eines Primärschlüssels.
- **Vierte Art:** Die benutzerdefinierte Integrität heißt je nach Darstellung auch **Geschäftsregeln** (*business rules*) oder in englischen Lehrbüchern *enterprise constraints*. Manche Lehrbücher sprechen von **intrarelationaler Integrität**. Dem Wort nach sind das nur Regeln innerhalb einer Relation, dieser Kurs zählt aber auch tabellenübergreifende Regeln (Fall 2 unten) zur vierten Art.
- **„Semantische“ und „logische Integrität“ werden uneinheitlich verwendet.**
  - Manche Darstellungen meinen mit „semantischer Integrität“ die benutzerdefinierte Integrität, andere ordnen den Begriff der Domänenintegrität zu.
  - Wieder andere nutzen ihn als Oberbegriff für „die Daten stimmen mit der Realität überein“, im Gegensatz zur physischen Integrität unbeschädigter Speicherstrukturen (so in t01). Auch „logische Integrität“ steht teils für die vierte Art, teils für diese Ebene neben der physischen Integrität.
  - Dieser Kurs verwendet beide Begriffe nur im Oberbegriffssinn. Wer sie anders benutzt, sollte dazusagen, welche Art gemeint ist.
- Manche Darstellungen fassen alle Wertebeschränkungen unter „Domänenintegrität“ zusammen, andere führen die Eindeutigkeit von Schlüsseln als eigene Art. Wo `UNIQUE` hingehört, ist deshalb nicht einheitlich. Dieser Kurs nennt es **Eindeutigkeitsbedingung** (`UNIQUE`-Constraint).
- Ein `NOT NULL` außerhalb des Primärschlüssels zählt in diesem Kurs zur Domänenintegrität: Die Spalte lässt die Markierung NULL nicht zu.
- „Referentiell“ (z. B. Wikipedia) und „referenziell“ (dieser Kurs) sind gleichwertige Schreibweisen.

## Entitätsintegrität

**Regel:** Jede Relation hat einen Primärschlüssel; seine Werte sind eindeutig, und **kein** Attribut des Primärschlüssels ist NULL.

Der Primärschlüssel ist die „Adresse“ eines Tupels, über die auch Fremdschlüssel verweisen. Ein NULL-Wert hieße „unbekannt“ – ein Tupel mit unbekannter Adresse ließe sich weder sicher von anderen unterscheiden noch referenzieren. Das gilt für **jeden Teil** eines zusammengesetzten Schlüssels: In `belegung` ist (17, NULL) unzulässig, obwohl `schueler_id` einen Wert hat; ebenso abgewiesen wird ein zweites Tupel mit (17, 3).

*Variante:* In der engen Fassung mancher Lehrbücher verlangt die Entitätsintegrität nur das NULL-Verbot im Primärschlüssel; die Eindeutigkeit folgt dort schon aus der Schlüsseleigenschaft. Andere Quellen nehmen beides in die Regel auf. Wer beide Teile nennt, liegt mit jeder Fassung richtig.

Die Regel gilt für die **gespeicherten** Relationen (Basistabellen). Ein Abfrageergebnis oder eine Sicht (t12) braucht keinen Primärschlüssel und darf doppelte Zeilen enthalten, etwa nach einer Projektion, die den Schlüssel weglässt.

**In SQL:** `PRIMARY KEY` bedeutet „eindeutig und nicht NULL“. PostgreSQL ergänzt das `NOT NULL` selbst; in Firebird müssen PK-Spalten `NOT NULL` sein, man deklariert es deshalb ausdrücklich (t06). Eine Tabelle hat **höchstens einen** Primärschlüssel. SQL erzwingt ihn nicht: Tabellen ohne `PRIMARY KEY` sind erlaubt, verletzen aber die Entitätsintegrität des Modells (siehe die SQL-Abweichungen oben).

**Weitere Schlüsselkandidaten.** Ein Schlüsselkandidat ist im Modell eindeutig **und** in jedem Tupel definiert, also nie NULL. Das DBMS prüft einen nicht gewählten Schlüsselkandidaten (Alternativschlüssel) nur, wenn er ausdrücklich deklariert ist, in SQL mit `UNIQUE` **und** `NOT NULL`. Beispiel: `raum.bezeichnung NOT NULL UNIQUE`.

Ein `UNIQUE` ohne `NOT NULL` ist dagegen nur eine **Eindeutigkeitsbedingung** für die vorhandenen Werte, kein Schlüsselkandidat im Sinne des Modells. Beispiel: `person.email` ist `UNIQUE`, aber optional. Die Entitätsintegrität betrifft solche Spalten nicht. Bei NULL unterscheiden sich die Systeme:
- **Einspaltiges `UNIQUE`:** Mehrere Zeilen mit NULL sind in Firebird 3 und PostgreSQL erlaubt, weil zwei NULL nicht als gleich gelten.
- **Mehrspaltiges `UNIQUE (a, b)` mit teilweise NULL:** Firebird 3 lässt `(1, NULL)` nur **einmal** zu, mehrfach erlaubt ist dort nur der ganz leere Schlüssel `(NULL, NULL)`. PostgreSQL erlaubt `(1, NULL)` beliebig oft.

## Referenzielle Integrität

**Regel:** Zu jedem Fremdschlüsselwert, der nicht NULL ist, gibt es in der referenzierten Relation ein Tupel mit genau diesem Schlüsselwert. Es gibt keine Verweise ins Leere (*dangling references*, verwaiste Zeilen).

Für die Pflichtspalte `kurs.lehrkraft_id` lässt sich die Regel in relationaler Algebra (t08) als Teilmengenbeziehung schreiben:

π_{lehrkraft_id}(kurs) ⊆ ρ_{lehrkraft_id←person_id}(π_{person_id}(lehrkraft))

Bei einem NULL-fähigen Fremdschlüssel wie `kurs.raum_id` gilt das nur für die Tupel, die überhaupt einen Wert haben.

**Welche Änderungen sind gefährlich?** Die referenzierte Tabelle heißt **Eltern**tabelle (*parent*), die verweisende **Kind**tabelle (*child*). Gleichwertig sind „referenzierte“ und „referenzierende“ Relation sowie „Master-“ und „Detailtabelle“. Manche Texte sprechen von Vater- bzw. Mutterrelation.

| Operation | Tabelle | Gefahr | Beispiel |
|---|---|---|---|
| `INSERT` | Kind | Wert ohne Gegenstück | Kurs mit `lehrkraft_id = 99` |
| `UPDATE` des FK | Kind | neuer Wert ohne Gegenstück | `raum_id` eines Kurses auf 42 |
| `DELETE` | Eltern | Verweise bleiben zurück | Raum löschen, der noch belegt ist |
| `UPDATE` des Schlüssels | Eltern | alte Verweise zeigen ins Leere | `raum_id` 3 wird 30 |

Harmlos sind `INSERT` in die Elterntabelle und `DELETE` in der Kindtabelle. Ausnahme: Bei einem rekursiven Fremdschlüssel ist dieselbe Tabelle Eltern- und Kindtabelle. Dort kann auch ein `DELETE` Verweise ins Leere erzeugen. Auf der Kindseite weist das DBMS den Verstoß immer ab; auf der Elternseite weist es ab oder führt eine **referenzielle Aktion** aus (siehe Fremdschlüssel-Eigenschaften).

## Domänenintegrität

**Regel:** Jeder Attributwert liegt in der Domäne seines Attributs.

Mittel, von grob nach fein:
- **Datentyp und Länge** – `DATE`, `VARCHAR(30)`; ein Text in einer Datumsspalte ist damit ausgeschlossen.
- **`NOT NULL`**, wenn ein Wert Pflicht ist.
- **`CHECK` auf eine Spalte** – `plaetze > 0`, `rabatt_prozent BETWEEN 0 AND 50`.
- **`CREATE DOMAIN`** – eine benannte Domäne bündelt Typ und Regel, alle Spalten, die sie verwenden, haben dieselbe Regel. In der Musikschule:

```sql
CREATE DOMAIN d_betrag AS NUMERIC(8,2) CHECK (VALUE >= 0);
CREATE DOMAIN d_niveau AS VARCHAR(16)
  CHECK (VALUE IN ('Anfaenger', 'Mittelstufe', 'Fortgeschritten'));
```

`stundensatz`, `gebuehr_monat`, `leihgebuehr` und `betrag` haben die Domäne `d_betrag`. `VALUE` steht im CHECK einer Domäne für den geprüften Wert.

*Variante zu `DEFAULT`:* Manche Darstellungen zählen den Spaltenvorgabewert (`DEFAULT`) zu den Mitteln der Domänenintegrität, weil er für einen zulässigen Startwert sorgt. In diesem Kurs zählt er nicht dazu. Er füllt nur einen fehlenden Wert auf, wenn die Spalte beim `INSERT` weggelassen wird, und lässt jeden anderen, auch unzulässigen Wert durch. Absichern muss man weiterhin mit Typ, `NOT NULL` und `CHECK`.

*Dialekthinweis:* Auch der Datentyp grenzt nicht immer so genau ab, wie er aussieht. Firebird 3 erzwingt bei `NUMERIC(p,s)` mit p ≤ 9 die Präzision nicht: `NUMERIC(6,2)` nimmt dort 99999,99 an, PostgreSQL weist den Wert ab. Obergrenzen sichert man deshalb mit einem `CHECK`.

**Achtung NULL:** Ein CHECK gilt als erfüllt, wenn die Bedingung TRUE **oder UNKNOWN** ergibt; nur FALSE wird abgewiesen (Firebird und PostgreSQL). `NULL >= 0` ist UNKNOWN, daher nimmt `leihgebuehr` den Wert NULL an – hier gewollt, NULL bedeutet „nicht ausleihbar“. Wo ein Wert Pflicht ist, braucht die Spalte zusätzlich `NOT NULL`, wie bei `stundensatz d_betrag NOT NULL`.

## Benutzerdefinierte Integrität

**Regel:** alle übrigen fachlichen Regeln der Miniwelt, die weder aus Schlüsseln noch aus einzelnen Domänen folgen. Sie stammen aus den Anforderungen und werden beim Entwurf festgehalten. Für die Umsetzung entscheidet die **Reichweite** der Regel:

1. **Innerhalb einer Zeile, über mehrere Spalten:**
   - In `kurs` gilt `enddatum >= startdatum`.
   - In `vertretung` gilt `vertreter_id <> lehrkraft_id` und `bis >= von`.
   - Eine Zahlung gehört nie zugleich zu einem Kurs und zu einer Ausleihe.

   Lösung: `CHECK`, also deklarativ. Für eine Tabelle, die eine solche Bedingung noch nicht hat, sähe das so aus (in `db/musikschule` ist sie schon angelegt):

   ```sql
   ALTER TABLE zahlung ADD CONSTRAINT ck_zahlung_bezug
     CHECK (kurs_id IS NULL OR ausleihe_id IS NULL);
   ```

   Ein offenes `enddatum` (NULL) stört den CHECK nicht – UNKNOWN gilt als erfüllt.
2. **Über mehrere Zeilen oder Tabellen:**
   - Ein Kurs hat höchstens `max_teilnehmer` aktive Belegungen.
   - Termine liegen innerhalb der Kurslaufzeit.
   - Die Vertretungszeiträume derselben Lehrkraft überschneiden sich nicht.

   `UNIQUE` und `FOREIGN KEY` kennen keine Obergrenzen > 1 und keine Zeitraumvergleiche. Ein CHECK bezieht sich auf die eigene Zeile.
   - **PostgreSQL** verbietet Unterabfragen im CHECK ganz.
   - **Firebird 3** erlaubt sie zwar (`CHECK (… (SELECT COUNT(*) …) …)`). Geprüft wird aber nur, wenn sich die eigene Zeile ändert. Senkt jemand `max_teilnehmer` in `kurs`, merkt der CHECK in `belegung` nichts. Eine mehrzeilige oder tabellenübergreifende Regel ist damit nicht zuverlässig gesichert.
   - Der SQL-Standard sieht dafür eigenständige, an keine Tabelle gebundene **Zusicherungen** (`CREATE ASSERTION`) vor. Weder Firebird 3 noch PostgreSQL setzen sie um.

   Praktische Lösung: Trigger oder Prüfung in der Anwendung.
3. **Über Änderungen**, die den alten mit dem neuen Wert vergleichen, z. B. „der Stundensatz darf nicht sinken“. Ein Constraint sieht nur den neuen Zustand. Lösung: ein Trigger, der `OLD` und `NEW` vergleicht.

**Statisch und dynamisch (Variante in manchen Lehrbüchern).** Manche Lehrbücher teilen Integritätsbedingungen zusätzlich danach ein, worauf sie sich beziehen:
- **Statische Integritätsbedingungen** (Zustandsbedingungen) betreffen einen einzelnen Zustand, den jeder gespeicherte Zustand erfüllen muss. Dazu gehören die Fälle 1 und 2, aber ebenso Entitäts-, referenzielle und Domänenintegrität.
- **Dynamische Integritätsbedingungen** (Übergangsbedingungen) betreffen den Übergang von einem Zustand zum nächsten, wie in Fall 3. Sie lassen sich nur prüfen, während die Änderung läuft.

Die Einteilung liegt quer zu den vier Arten.

Genaue Zahlengrenzen und mehrzeilige Regeln kann das Relationenmodell mit Schlüsseln und Kardinalitäten nicht ausdrücken; man notiert sie als Zusatzbedingung zum Schema (siehe auch t06).

## Deklarative vs. prozedurale Integritätssicherung

**Deklarativ** heißt: Die Bedingung steht im Schema. Man beschreibt, **was** gelten soll; das DBMS prüft sie bei jeder betroffenen Änderung selbst – `PRIMARY KEY`, `UNIQUE`, `NOT NULL`, `FOREIGN KEY`, `CHECK`, `DOMAIN`. In `CREATE TABLE` gibt es zwei Formen:
- **Spaltenbedingungen** (*column constraints*) stehen direkt bei einer Spalte, z. B. `plaetze SMALLINT NOT NULL CHECK (plaetze > 0)`. `NOT NULL` geht nur so.
- **Tabellenbedingungen** (*table constraints*) stehen nach den Spalten und können mehrere Spalten betreffen, z. B. `PRIMARY KEY (schueler_id, kurs_id)` oder `CHECK (enddatum >= startdatum)`.

**Prozedural** heißt in diesem Kurs: Ein Programm legt fest, **wie** geprüft wird. Im DBMS sind das vor allem **Trigger** (*trigger*): gespeicherte Programme, die bei `INSERT`, `UPDATE` oder `DELETE` auf einer Tabelle automatisch laufen, wahlweise `BEFORE` oder `AFTER` der Änderung. Ein Trigger kann die Änderung durch einen Fehler abbrechen (in Firebird eine `EXCEPTION`). Ein `BEFORE`-Trigger kann sie stattdessen auch korrigieren, indem er Werte in `NEW` setzt. Auch Stored Procedures und Anwendungscode gehören zu den prozeduralen Mitteln. Dass das System auf eine drohende Verletzung entweder mit Abweisen oder mit Folgeänderungen reagieren kann, gilt allgemein für Integritätsbedingungen. Referenzielle Aktionen wie `CASCADE` sind die deklarative Form der Folgeänderung.

*Variante:* Manche Darstellungen definieren „prozedurale Integritätsregeln“ enger. Gemeint sind dann genau die Regeln, die den Zustand vor und nach einer Änderung vergleichen und sich deshalb nur zur Laufzeit prüfen lassen, also die dynamischen Bedingungen (Fall 3 oben). Die Einteilung „deklarativ / prozedural“ beschreibt dann die Art der Regel, nicht das Mittel. In der Sache passt beides zusammen: Dynamische Regeln brauchen immer ein prozedurales Mittel, im DBMS meist einen Trigger. Trigger dienen aber auch für statische Regeln über mehrere Zeilen.

| | deklarativ | prozedural (Trigger) |
|---|---|---|
| Form | Bedingung im Schema | Programmcode (PSQL, PL/pgSQL …) |
| Reichweite | Schlüssel, Verweise, eine Zeile | beliebig: mehrere Zeilen und Tabellen, alt/neu |
| Aufwand und Fehlerrisiko | gering | höher, jede auslösende Operation muss bedacht werden |
| Sichtbarkeit | im Schema dokumentiert | im Code verborgen |

**Faustregel:** Was deklarativ geht, löst man deklarativ; Trigger sind für den Rest da. Eine Prüfung **nur** im Anwendungsprogramm ist am schwächsten – andere Programme, Importe und direkte SQL-Befehle umgehen sie. Aber auch Deklaratives wirkt nur, wenn das DBMS es durchsetzt: SQLite etwa prüft Fremdschlüssel erst nach `PRAGMA foreign_keys = ON`.

Skizze eines Triggers für die Kursgröße (Firebird 3, PSQL, läuft nicht in PostgreSQL; Details in t12):

```sql
CREATE EXCEPTION ex_kurs_voll 'Kurs ist bereits voll belegt';

SET TERM ^ ;
CREATE TRIGGER trg_belegung_kapazitaet FOR belegung
ACTIVE BEFORE INSERT POSITION 0
AS
  DECLARE VARIABLE belegt INTEGER;
  DECLARE VARIABLE maximum SMALLINT;
BEGIN
  IF (NEW.abgemeldet_am IS NULL) THEN
  BEGIN
    SELECT COUNT(*) FROM belegung
     WHERE kurs_id = NEW.kurs_id AND abgemeldet_am IS NULL
      INTO :belegt;
    SELECT max_teilnehmer FROM kurs
     WHERE kurs_id = NEW.kurs_id
      INTO :maximum;
    IF (belegt >= maximum) THEN
      EXCEPTION ex_kurs_voll;
  END
END^
SET TERM ; ^
```

Die äußere Bedingung sorgt dafür, dass nur aktive Belegungen geprüft werden. Eine Zeile, die schon mit Abmeldedatum eingetragen wird, belegt keinen Platz.

Der Trigger hat Grenzen:
- **Nur `INSERT`.** Er fängt nur neue Belegungen ab. Die Regel kann auch verletzt werden, wenn eine Belegung per `UPDATE` in einen vollen Kurs umgehängt wird, wenn eine Abmeldung zurückgenommen wird (`abgemeldet_am` wieder NULL) oder wenn `max_teilnehmer` in `kurs` gesenkt wird.
- **Gleichzeitige Transaktionen.** Melden sich zwei Personen zugleich für den letzten Platz an, sieht jede Transaktion die noch nicht bestätigte Anmeldung der anderen nicht. Beide Prüfungen bestehen dann, und der Kurs ist überbucht.

Genau dieser Aufwand ist der Preis prozeduraler Lösungen.

## Eigenschaften von Fremdschlüsseln

Ein **Fremdschlüssel** (*Foreign Key*) ist ein Attribut oder eine Attributkombination, deren Werte auf einen Schlüssel einer anderen oder derselben Relation verweisen (Begriff und Abbildung von Beziehungen: t06). Für ihn gilt:

1. **Verweisziel ist ein Schlüssel der Zieltabelle.**
   - **Im Modell:** ein Schlüsselkandidat, im Normalfall der Primärschlüssel.
   - **In SQL:** der `PRIMARY KEY` oder eine `UNIQUE`-Spalte(nkombination) der Zieltabelle. Steht hinter `REFERENCES` keine Spalte, ist der Primärschlüssel gemeint.
   - Ein Verweis auf `instrument.bezeichnung` (`NOT NULL UNIQUE`, also ein Alternativschlüssel) wäre erlaubt, auf `person.nachname` nicht.
   - SQL verlangt für ein `UNIQUE`-Ziel kein `NOT NULL`. Im Sinne des Modells ist ein Schlüsselkandidat aber immer definiert, deshalb gehört `NOT NULL` dazu.

   *Variante:* Viele Einführungen definieren den Fremdschlüssel ausschließlich über den Primärschlüssel der referenzierten Relation. Als Modell-Lesart ist das vollständig richtig und deckt den Normalfall ab. Die DBMS lassen zusätzlich `UNIQUE`-Ziele zu.
2. **Gleiche Domäne.** Fremdschlüssel und Ziel haben denselben bzw. einen kompatiblen Datentyp, bei zusammengesetzten Schlüsseln gleich viele, paarweise passende Spalten. `kurs.lehrkraft_id` und `lehrkraft.person_id` sind beide `INTEGER`; ein `VARCHAR`-Fremdschlüssel auf einen `INTEGER`-Schlüssel wäre falsch. Der Name darf abweichen und folgt oft der Rolle.
3. **NULL-fähig, wenn nicht anders festgelegt.** NULL bedeutet „kein Verweis“ und wird nicht gegen die Elterntabelle geprüft. So bildet man optionale Beziehungen ab (`kurs.raum_id` ist NULL bei wechselndem Raum). Ist die Beziehung Pflicht, bekommt die Spalte `NOT NULL` (`kurs.lehrkraft_id`).
   Bei zusammengesetzten Fremdschlüsseln prüfen PostgreSQL und SQLite standardmäßig nicht, sobald **eine** Spalte NULL ist; in PostgreSQL verlangt `MATCH FULL`, dass alle oder keine Spalte NULL sind. Für Firebird 3 beschreibt die Referenzdokumentation das Verhalten nicht. Teil-NULL vermeidet man deshalb am besten ganz.
4. **Nicht eindeutig.** Derselbe Wert darf mehrfach vorkommen – viele Kurse haben dieselbe Lehrkraft. Erst ein zusätzliches `UNIQUE` macht daraus eine 1:1-Beziehung (t06).
5. **Kann Teil des Primärschlüssels sein** oder der ganze Primärschlüssel (`belegung`, `lehrkraft.person_id → person`). Dann gilt für ihn zusätzlich die Entitätsintegrität – er ist nie NULL.
6. **Kann auf die eigene Tabelle zeigen**, und mehrere Fremdschlüssel können dieselbe Tabelle referenzieren: In `vertretung` verweisen `lehrkraft_id` und `vertreter_id` beide auf `lehrkraft` (rekursive Beziehung, Rollennamen: t06).
7. **Referenzielle Aktionen** (*referential actions*) legen mit `ON DELETE` und `ON UPDATE` fest, was beim Löschen oder Ändern der Elternzeile passiert (Ausblick auf t09):

| Aktion | Wirkung | Musikschule |
|---|---|---|
| `NO ACTION` (Voreinstellung) | ablehnen, solange Verweise bestehen | `kurs.lehrkraft_id`: Eine Lehrkraft mit Kursen ist nicht löschbar |
| `CASCADE` | Kindzeilen mitlöschen bzw. neuen Wert nachziehen | `lehrkraft → person`, `belegung → kurs` |
| `SET NULL` | Fremdschlüssel auf NULL setzen; Spalte muss NULL erlauben | `kurs.raum_id` |
| `SET DEFAULT` | Fremdschlüssel auf seinen Default setzen | in der Musikschule nicht genutzt |

**Ketten.** Referenzielle Aktionen setzen sich über mehrere Fremdschlüssel fort. Scheitert irgendwo in der Kette ein Schritt, nimmt das DBMS die **ganze** Anweisung zurück, nicht nur den letzten Schritt. Beispiel: Eine Person, die Lehrkraft ist und noch einen Kurs leitet, soll gelöscht werden.
- `lehrkraft → person` hat `ON DELETE CASCADE`, die Lehrkraft-Zeile würde also mitgelöscht.
- `kurs.lehrkraft_id → lehrkraft` hat aber `NO ACTION`, und der Kurs verweist noch auf sie.
- Deshalb scheitert das ganze `DELETE FROM person …`. Auch die Person bleibt erhalten.

Ebenso scheitert ein `SET NULL` auf einer `NOT NULL`-Spalte. Mehr zur Wirkung bei `DELETE` und `UPDATE`: t09, t11.

`RESTRICT` gibt es in PostgreSQL, SQLite und im SQL-Standard, **nicht in Firebird 3**. In PostgreSQL unterscheiden sich `RESTRICT` und `NO ACTION` nur bei aufschiebbaren Constraints; manche Quellen behandeln beide als gleichwertig.

## Auf einen Blick

- Relation = Menge von Tupeln, r ⊆ D₁ × … × Dₙ. Tupel = Zeile, Attribut = Spalte mit Domäne, Domäne = erlaubte atomare Werte (oft enger als der Datentyp).
- Grad = Anzahl der Attribute, Kardinalität = Anzahl der Tupel – nicht mit 1:n aus dem ER-Modell verwechseln.
- Eigenschaften: keine Duplikate, keine Tupel- und Attributreihenfolge, atomare Werte. SQL erlaubt Duplikate, hat eine Spaltenfolge und NULL.
- Datenbankschema = Menge der Relationenschemata, Relationennamen darin eindeutig.
- Entitätsintegrität: Im Modell hat jede Relation genau einen PK, eindeutig, kein PK-Teil NULL. SQL erlaubt höchstens einen und erzwingt ihn nicht. Alternativschlüssel = `UNIQUE` + `NOT NULL`. Ein `UNIQUE` ohne `NOT NULL` ist nur eine Eindeutigkeitsbedingung. Teil-NULL in mehrspaltigem UNIQUE: Firebird 3 ≠ PostgreSQL.
- Referenzielle Integrität: Jeder FK-Wert ≠ NULL hat ein Gegenstück. Kritisch: INSERT/UPDATE im Kind, DELETE/Schlüssel-UPDATE in den Eltern.
- Domänenintegrität: Datentyp, NOT NULL, Spalten-CHECK, DOMAIN. CHECK lässt UNKNOWN durch – also NULL ohne NOT NULL.
- Benutzerdefinierte Integrität: fachliche Regeln. Einzeilig per CHECK, mehrzeilig, tabellenübergreifend oder alt/neu per Trigger (Firebird erlaubt Unterabfragen im CHECK, sie sichern solche Regeln aber nicht zuverlässig; `CREATE ASSERTION` ist in Firebird 3 und PostgreSQL nicht umgesetzt). Manche Lehrbücher unterscheiden statische (Zustands-) und dynamische (Übergangs-)Bedingungen.
- Deklarativ vor prozedural; Trigger müssen alle auslösenden Änderungen abdecken; Prüfungen nur in der Anwendung sind umgehbar.
- Fremdschlüssel: Ziel PK oder UNIQUE, gleiche Domäne, NULL-fähig (optional) oder NOT NULL (Pflicht), nicht eindeutig, kann Teil des PK sein. Referenzielle Aktionen: NO ACTION (Default), CASCADE, SET NULL, SET DEFAULT – RESTRICT nicht in Firebird 3. Scheitert ein Schritt einer Kaskade, wird die ganze Anweisung zurückgenommen.
