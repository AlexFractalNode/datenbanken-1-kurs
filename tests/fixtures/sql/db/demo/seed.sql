-- Placeholder rows, shared by both engines. IDs come from the identity
-- columns (1, 2, ... in insert order), see db/DIALECT-NOTES.md.
INSERT INTO artikel (kuerzel, bezeichnung, preis, angelegt) VALUES ('AAA', 'Platzhalter Alpha', 2.50, DATE '2024-01-15');
INSERT INTO artikel (kuerzel, bezeichnung, preis, angelegt) VALUES ('BBB', 'Platzhalter Beta', 10.00, DATE '2024-02-01');
INSERT INTO artikel (kuerzel, bezeichnung, preis, angelegt) VALUES ('CCC', 'Platzhalter Gamma', 7.25, DATE '2024-02-20');
INSERT INTO artikel (kuerzel, bezeichnung, preis, angelegt) VALUES ('DDD', 'Platzhalter Delta', 7.25, DATE '2024-03-05');
