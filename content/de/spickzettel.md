---
title: Spickzettel-Inhaltsliste (handschriftlich, 10×10 cm)
lang: de
status: draft
---

# Spickzettel-Inhaltsliste

**Angenommene Bedingungen, ohne Gewähr:** Als Hilfsmittel wird ein handschriftlicher Zettel von 10×10 cm, einseitig, angenommen. Ob es zusätzlich ein SQL-Syntaxblatt gibt, kann sich unterscheiden. Prüf die Bedingungen deiner Prüfung selbst nach und streich Doppelungen mit dem Syntaxblatt, falls es eines gibt.

**Keine Aussage zur Prüfung:** Die Liste sagt nichts darüber, was geprüft oder wie gewichtet wird. Die Reihenfolge richtet sich nach **Platzbedarf und typischer Fehleranfälligkeit** beim Lernen, nicht nach Bedeutung in der Prüfung. Die Liste nennt vor allem Inhalte, die typischerweise nicht auf einem SQL-Syntaxblatt stehen.

**Platz:** Auf 10×10 cm passen handschriftlich grob 20–25 Zeilen mit je 35–45 Zeichen. Die Zeilenangaben unten gehen von Stichwortform aus und sind Richtwerte; zusammen ergeben alle Blöcke deutlich mehr, als auf den Zettel passt. Wähl nach deinen eigenen Fehlern aus (siehe Tipps).

## Block A – fehleranfällig und kompakt (ca. 14 Zeilen)

| Inhalt (Stichwortform) | Zeilen | Thema |
|---|---|---|
| **Kardinalität** (Konvention dieses Kurses): Chen = gegenüber, nur max; (min,max) = eigener Typ; max bei A = Chen bei B. Ohne Text/Doppellinie/MC: 1:1 → (0,1)/(0,1); 1:n → Elternseite (0,\*), Kindseite (1,1); m:n → (0,\*)/(0,\*). Doppellinie = min ≥ 1. Hierarchische Rekursion: beide Rollen min = 0 | 5–6 | t04 |
| **NF-Kriterien:** 1NF atomar; 2NF kein Nichtschlüsselattribut hängt von Schlüsselteil ab; 3NF keine transitive Abhängigkeit (X Superschlüssel oder A Primattribut); BCNF jede Determinante einer nicht-trivialen FD Superschlüssel | 3–4 | t07 |
| **Zerlegung:** 2NF: Teil-Determinante + Abhängige raus, bleibt FK. 3NF: Zwischenglied + Abhängige raus. Verlustfrei: gemeinsame Attribute = Superschlüssel eines Teils | 2–3 | t07 |
| **NULL-Fallen:** Vergleich mit NULL = UNKNOWN; WHERE/HAVING/ON nur TRUE; `NOT IN` + NULL → nie TRUE → `NOT EXISTS`; `IS NULL`. COUNT(\*) Zeilen, COUNT(x) nur Werte; Aggregate übergehen NULL | 3 | t10 |

## Block B – Überführung ERM → Tabellen (ca. 9 Zeilen)

| Inhalt (Stichwortform) | Zeilen | Thema |
|---|---|---|
| 1:n FK auf n-Seite (NOT NULL, wenn n-Seite (1,1)); 1:1 FK + UNIQUE; m:n Zwischentabelle, PK = beide FKs | 2 | t06 |
| Ternär: 3 FKs; Chen-1-Partner nicht in den PK; wiederholbar → Zeitattribut in den PK | 2 | t06 |
| Rekursiv: 1:n FK auf dieselbe Tabelle (NULL-fähig); m:n Zwischentabelle, zwei FKs auf dieselbe Tabelle; Spaltenname = Rolle | 2 | t06 |
| Schwach: PK = Besitzer-FK + partieller Schlüssel, ON DELETE CASCADE | 1 | t06 |
| Generalisierung: vertikal (Super + Sub, Sub-PK = FK) / horizontal (nur Subtypen, nur total **und** disjunkt) / virtuell (eine Tabelle + Typspalte, NULL-Spalten). Anlegen: Eltern zuerst | 3 | t06 |

## Block C – SQL-Auswertung und Algebra (ca. 9 Zeilen)

| Inhalt (Stichwortform) | Zeilen | Thema |
|---|---|---|
| **Auswertungsreihenfolge:** FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → Begrenzung. Spaltenalias im WHERE/HAVING unbekannt, im ORDER BY bekannt | 2 | t10 |
| **Algebra-Symbole:** σ Selektion, π Projektion (ohne Duplikate), ρ_{neu←alt}, × Produkt, ⋈ Join, ⟕ ⟖ ⟗, ⋉ ⋊ Semi-, ▷ Anti-Join, ∪ ∩ −, ÷. ∪ ∩ − nur vereinigungsverträglich. Baum von unten nach oben | 4–5 | t08 |
| **Ersatz in FB3:** ∩ → EXISTS/IN, − → NOT EXISTS (NULL: nicht gleich) | 1–2 | t08, t10 |

## Block D – Firebird-3-Besonderheiten (ca. 8 Zeilen, Auswahl)

- Kein INTERSECT/EXCEPT/LIMIT; stattdessen `FIRST n SKIP m` oder `OFFSET m ROWS FETCH NEXT n ROWS ONLY`.
- `ORDER BY` nach UNION nur mit Spaltennummern.
- `INSERT … VALUES` nur eine Zeile, kein DEFAULT in der Werteliste; mehrere Zeilen mit `INSERT … SELECT`.
- `DEFAULT` vor `NOT NULL`; `ALTER TABLE … ADD` ohne COLUMN; `ALTER COLUMN … TO` scheitert bei Spalten in Constraints; nachträglicher PK nur auf NOT-NULL-Spalten.
- Identity `START WITH n` → erste ID n + 1.
- NULL bei `ORDER BY ASC`: zuerst (FB), zuletzt (PG) → `NULLS FIRST/LAST` angeben.
- AVG über Ganzzahl abgeschnitten; `NUMERIC(p≤9)` ohne erzwungene Präzision; mehrspaltiges UNIQUE mit Teil-NULL (nur einmal).
- Kein RESTRICT; kein TRUNCATE; `SELECT` ohne FROM nur über `RDB$DATABASE`.

(Quellen: Lerntexte t09–t11 und Cheatsheet §7.)

## Optional – wenn noch Platz ist (ca. 3 Zeilen)

- Fremdschlüssel: Ziel PK oder UNIQUE, gleiche Domäne, NULL-fähig, muss nicht eindeutig sein; Aktionen NO ACTION, CASCADE, SET NULL, SET DEFAULT.

## Eher weglassen

- Wörtliche Definitionen und Merksätze, die du auswendig kannst, sowie reines Begriffswissen (z. B. die Namen der Integritätsarten).
- Alles, was du auf einem Syntaxblatt vorfindest, falls es eines gibt.
- Lange Beispiele; ein Mini-Beispiel (LEFT JOIN mit Anti-Join-Filter) in 2 Zeilen reicht.

## Tipps zum Erstellen

1. Schreib nach jeder Lernwoche (siehe Lernplan) die Fehler auf, die dir wirklich unterlaufen sind, und nimm genau diese auf.
2. Schreib den Zettel rechtzeitig vor T und übe eine Probeklausur (e01 oder e02) mit ihm. Was du nie nachgeschlagen hast, fliegt raus.
3. Sortiere nach Themenblöcken mit Überschrift, damit du schnell suchen kannst.
