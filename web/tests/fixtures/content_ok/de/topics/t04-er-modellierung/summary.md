---
id: t04
lang: de
title: ER-Modellierung
order: 4
status: draft
reviews: []
sources:
  - id: wp-erm
    ref: Abschnitt Grundbegriffe
  - id: pg-docs
    ref: Kapitel 5.1
---

# ER-Modellierung

## Worum es geht

Ein **ER-Modell** beschreibt die Miniwelt mit Entitätstypen, Attributen und Beziehungstypen.

- Entitätstyp: Rechteck
- Beziehungstyp: Raute

| Attributart | Bedeutung | Beispiel | Darstellung in Chen-Notation |
|---|---|---|---|
| zusammengesetzt (composite) | besteht aus Teilattributen | Name = Vorname + Nachname | Ellipse mit Unter-Ellipsen |

![Kunde gibt Bestellung auf](diagrams/beziehung.dot)

## Typische Fehler

- Beziehungstypen als Entitätstypen modellieren.
- Kardinalitäten vertauschen.
