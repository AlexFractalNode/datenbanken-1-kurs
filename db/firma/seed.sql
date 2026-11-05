-- Beispieldaten Firma (synthetisch, alle Personen erfunden).
-- Erzeugt mit: python db/firma/generate.py --seed 42
-- Nicht von Hand bearbeiten. Laeuft auf Firebird 3 und PostgreSQL.
-- Kommentar am Zeilenende: der Identity-Wert, den die Zeile erhaelt.

-- abteilung (leiter_id wird nach mitarbeiter gesetzt)
INSERT INTO abteilung (bezeichnung, standort, leiter_id) VALUES ('Geschäftsführung', 'Nordstadt', NULL); -- 1
INSERT INTO abteilung (bezeichnung, standort, leiter_id) VALUES ('Vertrieb', 'Südhafen', NULL); -- 2
INSERT INTO abteilung (bezeichnung, standort, leiter_id) VALUES ('Entwicklung', 'Westpark', NULL); -- 3
INSERT INTO abteilung (bezeichnung, standort, leiter_id) VALUES ('Personal', 'Nordstadt', NULL); -- 4
INSERT INTO abteilung (bezeichnung, standort, leiter_id) VALUES ('Einkauf', 'Südhafen', NULL); -- 5
INSERT INTO abteilung (bezeichnung, standort, leiter_id) VALUES ('Forschung', 'Westpark', NULL); -- 6

-- mitarbeiter (vorgesetzter_id rekursiv, NULL = Geschaeftsfuehrung)
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Holger', 'Seidel', 'holger.seidel@firma.example', DATE '2008-04-01', 10450.00, NULL, 1, NULL); -- 1
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Bernd', 'Albers', 'bernd.albers@firma.example', DATE '2017-02-10', 7800.00, 350.00, 2, 1); -- 2
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Svenja', 'Ludwig', 'svenja.ludwig@firma.example', DATE '2010-07-24', 6100.00, NULL, 3, 1); -- 3
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Pia', 'Ziegler', 'pia.ziegler@firma.example', DATE '2023-11-01', 6700.00, NULL, 4, 1); -- 4
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Olga', 'Otto', 'olga.otto@firma.example', DATE '2015-06-29', 6250.00, NULL, 5, 1); -- 5
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Elif', 'Busch', 'elif.busch@firma.example', DATE '2014-03-23', 3300.00, NULL, 1, 1); -- 6
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Sven', 'Jäger', 'sven.jaeger@firma.example', DATE '2017-07-11', 3850.00, 550.00, 2, 2); -- 7
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Dirk', 'Ebert', 'dirk.ebert@firma.example', DATE '2023-04-05', 4150.00, 325.00, 2, 2); -- 8
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Yvonne', 'Gerlach', 'yvonne.gerlach@firma.example', DATE '2017-04-21', 4100.00, 350.00, 2, 2); -- 9
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Rainer', 'Engel', 'rainer.engel@firma.example', DATE '2024-01-13', 3850.00, 750.00, 2, 2); -- 10
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Kai', 'Kraft', 'kai.kraft@firma.example', DATE '2024-05-01', 3200.00, 675.00, 2, 2); -- 11
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Carla', 'Dietrich', 'carla.dietrich@firma.example', DATE '2023-03-30', 3500.00, 625.00, 2, 2); -- 12
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Timo', 'Conrad', 'timo.conrad@firma.example', DATE '2014-06-29', 3500.00, NULL, 4, 4); -- 13
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Niklas', 'Nowak', 'niklas.nowak@firma.example', DATE '2019-05-15', 4200.00, NULL, 4, 4); -- 14
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Nadine', 'Arnold', 'nadine.arnold@firma.example', DATE '2015-01-21', 5000.00, NULL, 4, 4); -- 15
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Anja', 'Martens', 'anja.martens@firma.example', DATE '2024-06-08', 4750.00, NULL, 5, 5); -- 16
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Birgit', 'Thiel', 'birgit.thiel@firma.example', DATE '2013-12-05', 4000.00, NULL, 5, 5); -- 17
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Gesa', 'Heinrich', 'gesa.heinrich@firma.example', DATE '2010-04-04', 3700.00, NULL, 5, 5); -- 18
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Yusuf', 'Bauer', 'yusuf.bauer@firma.example', DATE '2009-09-20', 5500.00, NULL, 3, 3); -- 19
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Ralf', 'Mertens', 'ralf.mertens@firma.example', DATE '2017-12-31', 3850.00, NULL, 3, 19); -- 20
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Volker', 'Horn', 'volker.horn@firma.example', DATE '2010-06-27', 3650.00, NULL, 3, 19); -- 21
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Ines', 'Reuter', 'ines.reuter@firma.example', DATE '2021-09-21', 4000.00, NULL, 3, 19); -- 22
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Petra', 'Quast', 'petra.quast@firma.example', DATE '2013-10-08', 4550.00, NULL, 3, 19); -- 23
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Lars', 'Franke', 'lars.franke@firma.example', DATE '2017-11-16', 6000.00, NULL, 3, 3); -- 24
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Katrin', 'Pohl', 'katrin.pohl@firma.example', DATE '2019-04-17', 3450.00, NULL, 3, 24); -- 25
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Marco', 'Voigt', 'marco.voigt@firma.example', DATE '2014-12-10', 3400.00, NULL, 3, 24); -- 26
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Silke', 'Günther', 'silke.guenther@firma.example', DATE '2014-07-14', 4750.00, NULL, 3, 24); -- 27
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Kerstin', 'Böhm', 'kerstin.boehm@firma.example', DATE '2021-02-02', 3800.00, NULL, 3, 24); -- 28
INSERT INTO mitarbeiter (vorname, nachname, email, eintritt, gehalt, provision, abteilung_id, vorgesetzter_id) VALUES ('Heiko', 'Frank', 'heiko.frank@firma.example', DATE '2024-08-28', 1250.00, NULL, NULL, 3); -- 29

-- Leitung der Abteilungen (1:1)
UPDATE abteilung SET leiter_id = 1 WHERE abteilung_id = 1;
UPDATE abteilung SET leiter_id = 2 WHERE abteilung_id = 2;
UPDATE abteilung SET leiter_id = 3 WHERE abteilung_id = 3;
UPDATE abteilung SET leiter_id = 4 WHERE abteilung_id = 4;
UPDATE abteilung SET leiter_id = 5 WHERE abteilung_id = 5;

-- projekt
INSERT INTO projekt (titel, abteilung_id, startdatum, enddatum, budget, beschreibung) VALUES ('Webshop-Relaunch', 3, DATE '2023-03-01', DATE '2024-02-29', 180000.00, NULL); -- 1
INSERT INTO projekt (titel, abteilung_id, startdatum, enddatum, budget, beschreibung) VALUES ('CRM-Einführung', 2, DATE '2023-09-01', NULL, 95000.00, NULL); -- 2
INSERT INTO projekt (titel, abteilung_id, startdatum, enddatum, budget, beschreibung) VALUES ('Lagerumstellung', 5, DATE '2024-01-15', DATE '2024-10-31', 60000.00, NULL); -- 3
INSERT INTO projekt (titel, abteilung_id, startdatum, enddatum, budget, beschreibung) VALUES ('Mitarbeiterportal', 4, DATE '2024-02-01', NULL, 40000.00, NULL); -- 4
INSERT INTO projekt (titel, abteilung_id, startdatum, enddatum, budget, beschreibung) VALUES ('Datenplattform', 3, DATE '2024-05-01', NULL, NULL, 'Zentrale Auswertung der Vertriebs- und Lagerdaten; Budget noch offen.'); -- 5
INSERT INTO projekt (titel, abteilung_id, startdatum, enddatum, budget, beschreibung) VALUES ('Messeauftritt 2025', 2, DATE '2024-11-01', NULL, 25000.00, NULL); -- 6
INSERT INTO projekt (titel, abteilung_id, startdatum, enddatum, budget, beschreibung) VALUES ('Sensorstudie', 6, DATE '2025-01-07', NULL, 120000.00, 'Machbarkeitsstudie der neuen Abteilung Forschung.'); -- 7
INSERT INTO projekt (titel, abteilung_id, startdatum, enddatum, budget, beschreibung) VALUES ('Archivdigitalisierung', 4, DATE '2025-03-01', NULL, 15000.00, 'Geplant, noch ohne Projektteam.'); -- 8

-- mitarbeit (m:n mitarbeiter-projekt mit Stunden)
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (2, 1, 66.0, 'Beratung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (5, 1, 331.0, 'Beratung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (15, 1, 415.5, 'Fachbereich');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (18, 1, 315.0, 'Entwicklung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (20, 1, 207.0, 'Projektleitung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (21, 1, 205.0, NULL);
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (23, 1, 249.5, NULL);
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (24, 1, 138.5, NULL);
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (11, 2, 403.5, 'Projektleitung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (12, 2, 338.0, 'Test');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (17, 2, 67.0, 'Test');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (26, 2, 232.5, 'Beratung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (5, 3, 162.5, 'Projektleitung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (6, 3, 337.0, NULL);
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (8, 3, 321.5, 'Beratung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (16, 3, 88.0, 'Test');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (17, 3, 400.0, 'Beratung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (22, 3, 286.0, NULL);
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (26, 3, 10.0, NULL);
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (3, 4, 133.0, NULL);
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (4, 4, 50.0, 'Projektleitung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (10, 4, 53.5, 'Fachbereich');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (12, 4, 45.0, NULL);
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (14, 4, 402.0, 'Beratung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (15, 4, 75.5, 'Fachbereich');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (9, 5, 214.0, 'Test');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (12, 5, 234.0, NULL);
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (20, 5, 241.0, 'Projektleitung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (22, 5, 71.5, 'Beratung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (24, 5, 125.0, 'Entwicklung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (26, 5, 183.0, 'Entwicklung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (4, 6, 127.0, 'Entwicklung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (5, 6, 26.0, 'Test');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (7, 6, 46.0, 'Projektleitung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (10, 6, 273.0, 'Beratung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (11, 6, 152.5, 'Fachbereich');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (12, 6, 119.5, NULL);
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (9, 7, 252.0, 'Projektleitung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (17, 7, 218.0, 'Beratung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (20, 7, 58.0, 'Entwicklung');
INSERT INTO mitarbeit (mitarbeiter_id, projekt_id, stunden, rolle) VALUES (27, 7, 347.0, 'Fachbereich');
