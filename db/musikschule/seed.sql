-- Beispieldaten Musikschule (synthetisch, alle Personen erfunden).
-- Erzeugt mit: python db/musikschule/generate.py --seed 42
-- Nicht von Hand bearbeiten. Laeuft auf Firebird 3 und PostgreSQL.
-- Kommentar am Zeilenende: der Identity-Wert, den die Zeile erhaelt.

-- instrument
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('Klavier', 'Tasten', NULL); -- 1
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('Violine', 'Streich', 15.00); -- 2
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('Viola', 'Streich', 15.00); -- 3
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('Violoncello', 'Streich', 25.00); -- 4
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('Gitarre', 'Zupf', 10.00); -- 5
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('E-Bass', 'Zupf', 12.00); -- 6
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('Querflöte', 'Blas', 12.00); -- 7
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('Klarinette', 'Blas', 14.00); -- 8
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('Trompete', 'Blas', 14.00); -- 9
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('Schlagzeug', 'Schlag', NULL); -- 10
INSERT INTO instrument (bezeichnung, familie, leihgebuehr) VALUES ('Ukulele', 'Zupf', 6.00); -- 11

-- raum
INSERT INTO raum (bezeichnung, etage, plaetze, hat_klavier) VALUES ('R101', 1, 4, TRUE); -- 1
INSERT INTO raum (bezeichnung, etage, plaetze, hat_klavier) VALUES ('R102', 1, 2, TRUE); -- 2
INSERT INTO raum (bezeichnung, etage, plaetze, hat_klavier) VALUES ('R201', 2, 6, FALSE); -- 3
INSERT INTO raum (bezeichnung, etage, plaetze, hat_klavier) VALUES ('R202', 2, 3, FALSE); -- 4
INSERT INTO raum (bezeichnung, etage, plaetze, hat_klavier) VALUES ('Saal', 0, 30, TRUE); -- 5
INSERT INTO raum (bezeichnung, etage, plaetze, hat_klavier) VALUES ('Keller', -1, 5, FALSE); -- 6

-- person: 1-8 Lehrkraefte, 9-38 Schueler, 39 Interessent(in) ohne Rolle
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Jule', 'Neumann', DATE '1992-04-29', 'jule.neumann@example.org', '000 660086', 'Altdorf'); -- 1
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Moritz', 'Wolf', DATE '1975-12-25', 'moritz.wolf@example.org', '000 497887', 'Talhausen'); -- 2
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Jonas', 'Möller', DATE '1993-09-16', 'jonas.moeller@example.org', '000 330283', 'Altdorf'); -- 3
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Jakob', 'Haas', DATE '1979-07-20', 'jakob.haas@example.org', NULL, 'Lindenau'); -- 4
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Elias', 'Lang', DATE '1975-04-11', 'elias.lang@example.org', NULL, 'Talhausen'); -- 5
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Marie', 'Lorenz', DATE '1982-12-30', 'marie.lorenz@example.org', '000 321231', 'Wiesenfeld'); -- 6
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Ida', 'Meier', DATE '1979-02-12', 'ida.meier@example.org', '000 623481', 'Neustadt'); -- 7
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Clara', 'Schulz', DATE '1993-11-02', 'clara.schulz@example.org', '000 377746', 'Bergheim'); -- 8
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Rosa', 'Friedrich', DATE '1985-03-07', NULL, '000 711878', 'Neustadt'); -- 9
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Felix', 'Lehmann', DATE '2010-02-07', 'felix.lehmann@example.org', '000 214975', 'Bergheim'); -- 10
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('David', 'Koch', DATE '2016-06-20', 'david.koch@example.org', '000 590785', 'Wiesenfeld'); -- 11
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Mia', 'Lange', DATE '2007-04-05', 'mia.lange@example.org', NULL, 'Talhausen'); -- 12
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Malte', 'Winkler', DATE '2014-08-18', 'malte.winkler@example.org', '000 857168', 'Altdorf'); -- 13
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Lina', 'Keller', DATE '2018-03-24', 'lina.keller@example.org', '000 755674', 'Talhausen'); -- 14
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Wilma', 'Braun', DATE '2018-05-21', 'wilma.braun@example.org', '000 665579', 'Wiesenfeld'); -- 15
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Tilda', 'Fuchs', DATE '2014-04-09', 'tilda.fuchs@example.org', '000 972064', 'Talhausen'); -- 16
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Nora', 'Kaiser', DATE '1970-10-21', NULL, '000 609597', 'Lindenau'); -- 17
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Simon', 'Hartmann', DATE '2018-12-12', 'simon.hartmann@example.org', '000 676510', 'Bergheim'); -- 18
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Lena', 'Huber', DATE '2016-06-28', NULL, '000 823378', 'Bergheim'); -- 19
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Janne', 'Sommer', DATE '2015-12-13', 'janne.sommer@example.org', '000 642717', 'Neustadt'); -- 20
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Erik', 'Hahn', NULL, 'erik.hahn@example.org', '000 717024', 'Bergheim'); -- 21
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Fenja', 'Hoffmann', DATE '1991-10-02', 'fenja.hoffmann@example.org', NULL, 'Talhausen'); -- 22
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Paula', 'Schwarz', DATE '1970-09-04', 'paula.schwarz@example.org', '000 858490', 'Wiesenfeld'); -- 23
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Mila', 'Weiß', DATE '2012-06-13', NULL, '000 201639', 'Altdorf'); -- 24
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Lukas', 'Scholz', DATE '2016-07-01', NULL, '000 785197', 'Altdorf'); -- 25
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Sophie', 'Schmitt', DATE '1978-01-22', NULL, '000 300896', 'Bergheim'); -- 26
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Marta', 'Berger', DATE '2010-02-22', 'marta.berger@example.org', '000 179046', 'Neustadt'); -- 27
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Henri', 'Peters', NULL, NULL, NULL, 'Lindenau'); -- 28
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Leon', 'Brandt', DATE '2012-04-20', 'leon.brandt@example.org', '000 520521', 'Lindenau'); -- 29
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Frieda', 'Richter', DATE '1960-02-05', 'frieda.richter@example.org', '000 577110', 'Talhausen'); -- 30
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Anton', 'Jung', DATE '2017-11-30', 'anton.jung@example.org', NULL, 'Wiesenfeld'); -- 31
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Amelie', 'Graf', DATE '2008-05-14', 'amelie.graf@example.org', '000 627276', 'Wiesenfeld'); -- 32
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Karl', 'Krause', DATE '1982-10-12', 'karl.krause@example.org', '000 808011', 'Bergheim'); -- 33
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Noah', 'Roth', DATE '2012-07-09', 'noah.roth@example.org', '000 789305', 'Wiesenfeld'); -- 34
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Till', 'Beck', DATE '2014-02-04', 'till.beck@example.org', '000 350280', 'Talhausen'); -- 35
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Emma', 'Vogel', DATE '2013-09-23', NULL, NULL, 'Lindenau'); -- 36
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Ella', 'Zimmermann', NULL, 'ella.zimmermann@example.org', '000 465962', 'Lindenau'); -- 37
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Ben', 'Werner', DATE '2015-04-16', 'ben.werner@example.org', '000 417212', 'Wiesenfeld'); -- 38
INSERT INTO person (vorname, nachname, geburtsdatum, email, telefon, ort) VALUES ('Lotte', 'Becker', NULL, NULL, '000 795613', 'Lindenau'); -- 39

-- lehrkraft (Subtyp von person)
INSERT INTO lehrkraft (person_id, eingestellt_am, stundensatz, hauptinstrument_id) VALUES (1, DATE '2013-01-05', 40.00, 1);
INSERT INTO lehrkraft (person_id, eingestellt_am, stundensatz, hauptinstrument_id) VALUES (2, DATE '2012-08-03', 35.00, 2);
INSERT INTO lehrkraft (person_id, eingestellt_am, stundensatz, hauptinstrument_id) VALUES (3, DATE '2022-05-30', 36.50, 5);
INSERT INTO lehrkraft (person_id, eingestellt_am, stundensatz, hauptinstrument_id) VALUES (4, DATE '2016-02-10', 41.00, 7);
INSERT INTO lehrkraft (person_id, eingestellt_am, stundensatz, hauptinstrument_id) VALUES (5, DATE '2023-07-26', 38.50, 4);
INSERT INTO lehrkraft (person_id, eingestellt_am, stundensatz, hauptinstrument_id) VALUES (6, DATE '2017-09-09', 38.50, 10);
INSERT INTO lehrkraft (person_id, eingestellt_am, stundensatz, hauptinstrument_id) VALUES (7, DATE '2015-12-03', 48.00, 8);
INSERT INTO lehrkraft (person_id, eingestellt_am, stundensatz, hauptinstrument_id) VALUES (8, DATE '2020-12-16', 40.00, NULL);

-- schueler (Subtyp von person); person 5 ist zugleich Lehrkraft
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (5, DATE '2019-07-28', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (9, DATE '2020-01-14', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (10, DATE '2022-02-07', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (11, DATE '2022-09-28', TRUE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (12, DATE '2021-12-08', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (13, DATE '2023-12-15', TRUE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (14, DATE '2023-10-18', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (15, DATE '2020-04-03', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (16, DATE '2020-09-02', TRUE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (17, DATE '2019-05-28', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (18, DATE '2020-08-29', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (19, DATE '2019-06-21', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (20, DATE '2019-06-13', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (21, DATE '2023-01-05', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (22, DATE '2021-05-10', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (23, DATE '2021-10-19', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (24, DATE '2022-12-19', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (25, DATE '2023-07-23', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (26, DATE '2020-09-25', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (27, DATE '2021-08-27', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (28, DATE '2020-10-27', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (29, DATE '2020-12-26', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (30, DATE '2023-08-16', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (31, DATE '2022-09-22', TRUE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (32, DATE '2023-08-14', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (33, DATE '2021-10-13', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (34, DATE '2020-03-18', TRUE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (35, DATE '2019-06-08', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (36, DATE '2021-06-30', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (37, DATE '2021-03-28', FALSE);
INSERT INTO schueler (person_id, eintritt, ermaessigt) VALUES (38, DATE '2024-02-29', FALSE);

-- kurs
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Klavier für Einsteiger', 1, 1, 1, 'Anfaenger', 4, 62.00, DATE '2024-09-02', NULL, NULL); -- 1
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Klavier Mittelstufe', 1, 1, 2, 'Mittelstufe', 2, 78.00, DATE '2024-09-02', NULL, NULL); -- 2
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Violine Grundkurs', 2, 2, 3, 'Anfaenger', 5, 58.00, DATE '2024-09-02', NULL, NULL); -- 3
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Gitarre in der Gruppe', 5, 3, 3, 'Anfaenger', 6, 45.00, DATE '2024-09-02', NULL, NULL); -- 4
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Gitarre für Fortgeschrittene', 5, 3, 4, 'Fortgeschritten', 3, 55.00, DATE '2024-09-02', NULL, NULL); -- 5
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Querflöte Mittelstufe', 7, 4, 4, 'Mittelstufe', 3, 64.00, DATE '2024-09-02', NULL, NULL); -- 6
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Cello für Erwachsene', 4, 5, 3, 'Anfaenger', 4, 66.00, DATE '2024-09-02', DATE '2025-01-31', NULL); -- 7
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Schlagzeug-Workshop', 10, 6, 6, 'Anfaenger', 5, 50.00, DATE '2024-09-02', DATE '2024-12-20', NULL); -- 8
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Klarinetten-Ensemble', 8, 7, 5, 'Fortgeschritten', 8, 40.00, DATE '2024-09-02', NULL, NULL); -- 9
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Musiktheorie', NULL, 8, NULL, 'Anfaenger', 12, 25.00, DATE '2024-09-02', NULL, 'Noten lesen, Intervalle, Rhythmus. Der Raum wechselt je nach Termin.'); -- 10
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Chor', NULL, 8, 5, 'Anfaenger', 30, 20.00, DATE '2024-09-02', NULL, 'Offen für alle Altersgruppen, keine Vorkenntnisse nötig.'); -- 11
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Jazz-Improvisation', 1, 1, 1, 'Fortgeschritten', 4, 85.00, DATE '2025-02-03', NULL, 'Geplanter Kurs, Anmeldung ab Januar.'); -- 12
INSERT INTO kurs (titel, instrument_id, lehrkraft_id, raum_id, niveau, max_teilnehmer, gebuehr_monat, startdatum, enddatum, beschreibung) VALUES ('Trompete Grundkurs', 9, 7, 4, 'Anfaenger', 3, 60.00, DATE '2025-02-03', NULL, NULL); -- 13

-- belegung (m:n schueler-kurs)
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (11, 1, DATE '2024-10-12', NULL, 20);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (16, 1, DATE '2024-09-29', NULL, 20);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (25, 1, DATE '2024-09-06', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (26, 1, DATE '2024-08-04', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (14, 2, DATE '2024-09-21', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (25, 2, DATE '2024-10-01', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (15, 3, DATE '2024-10-09', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (16, 3, DATE '2024-09-07', NULL, 20);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (18, 3, DATE '2024-09-21', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (19, 3, DATE '2024-09-06', NULL, 10);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (22, 3, DATE '2024-08-30', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (9, 4, DATE '2024-09-27', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (12, 4, DATE '2024-09-13', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (31, 4, DATE '2024-08-13', NULL, 20);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (35, 4, DATE '2024-10-01', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (36, 4, DATE '2024-09-04', DATE '2024-10-18', 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (5, 5, DATE '2024-09-07', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (22, 5, DATE '2024-09-19', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (27, 5, DATE '2024-09-09', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (16, 6, DATE '2024-09-03', NULL, 20);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (23, 6, DATE '2024-09-03', DATE '2024-11-21', 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (32, 6, DATE '2024-08-15', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (17, 7, DATE '2024-09-12', NULL, 10);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (23, 7, DATE '2024-08-12', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (28, 7, DATE '2024-09-06', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (30, 7, DATE '2024-10-02', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (21, 8, DATE '2024-08-05', NULL, 10);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (24, 8, DATE '2024-08-04', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (29, 8, DATE '2024-09-18', NULL, 10);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (30, 8, DATE '2024-08-09', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (36, 8, DATE '2024-09-06', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (10, 9, DATE '2024-08-11', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (13, 9, DATE '2024-09-11', NULL, 20);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (15, 9, DATE '2024-08-18', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (17, 9, DATE '2024-08-22', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (20, 9, DATE '2024-08-13', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (25, 9, DATE '2024-08-14', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (33, 9, DATE '2024-09-29', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (38, 9, DATE '2024-09-23', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (9, 10, DATE '2024-09-27', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (11, 10, DATE '2024-09-25', NULL, 20);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (34, 10, DATE '2024-10-11', NULL, 20);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (36, 10, DATE '2024-08-05', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (37, 10, DATE '2024-09-24', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (38, 10, DATE '2024-09-12', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (18, 11, DATE '2024-08-05', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (21, 11, DATE '2024-09-25', NULL, 10);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (22, 11, DATE '2024-10-02', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (24, 11, DATE '2024-08-16', NULL, 0);
INSERT INTO belegung (schueler_id, kurs_id, angemeldet_am, abgemeldet_am, rabatt_prozent) VALUES (29, 11, DATE '2024-08-15', NULL, 0);

-- termin (je belegtem Kurs acht Wochen ab 2. September 2024)
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (1, DATE '2024-09-02', TIME '15:00:00', 45, 6, FALSE); -- 1
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (1, DATE '2024-09-09', TIME '15:00:00', 45, 6, FALSE); -- 2
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (1, DATE '2024-09-16', TIME '15:00:00', 45, NULL, FALSE); -- 3
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (1, DATE '2024-09-23', TIME '15:00:00', 45, NULL, FALSE); -- 4
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (1, DATE '2024-09-30', TIME '15:00:00', 45, NULL, FALSE); -- 5
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (1, DATE '2024-10-07', TIME '15:00:00', 45, NULL, FALSE); -- 6
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (1, DATE '2024-10-14', TIME '15:00:00', 45, NULL, FALSE); -- 7
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (1, DATE '2024-10-21', TIME '15:00:00', 45, NULL, FALSE); -- 8
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (2, DATE '2024-09-03', TIME '16:00:00', 60, NULL, FALSE); -- 9
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (2, DATE '2024-09-10', TIME '16:00:00', 60, NULL, FALSE); -- 10
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (2, DATE '2024-09-17', TIME '16:00:00', 60, NULL, FALSE); -- 11
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (2, DATE '2024-09-24', TIME '16:00:00', 60, NULL, FALSE); -- 12
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (2, DATE '2024-10-01', TIME '16:00:00', 60, NULL, FALSE); -- 13
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (2, DATE '2024-10-08', TIME '16:00:00', 60, NULL, FALSE); -- 14
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (2, DATE '2024-10-15', TIME '16:00:00', 60, NULL, FALSE); -- 15
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (2, DATE '2024-10-22', TIME '16:00:00', 60, NULL, FALSE); -- 16
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (3, DATE '2024-09-04', TIME '15:30:00', 45, NULL, FALSE); -- 17
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (3, DATE '2024-09-11', TIME '15:30:00', 45, NULL, FALSE); -- 18
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (3, DATE '2024-09-18', TIME '15:30:00', 45, NULL, FALSE); -- 19
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (3, DATE '2024-09-25', TIME '15:30:00', 45, NULL, FALSE); -- 20
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (3, DATE '2024-10-02', TIME '15:30:00', 45, NULL, FALSE); -- 21
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (3, DATE '2024-10-09', TIME '15:30:00', 45, NULL, FALSE); -- 22
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (3, DATE '2024-10-16', TIME '15:30:00', 45, NULL, FALSE); -- 23
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (3, DATE '2024-10-23', TIME '15:30:00', 45, NULL, FALSE); -- 24
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (4, DATE '2024-09-02', TIME '17:00:00', 60, NULL, FALSE); -- 25
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (4, DATE '2024-09-09', TIME '17:00:00', 60, NULL, FALSE); -- 26
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (4, DATE '2024-09-16', TIME '17:00:00', 60, NULL, FALSE); -- 27
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (4, DATE '2024-09-23', TIME '17:00:00', 60, NULL, FALSE); -- 28
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (4, DATE '2024-09-30', TIME '17:00:00', 60, NULL, FALSE); -- 29
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (4, DATE '2024-10-07', TIME '17:00:00', 60, NULL, FALSE); -- 30
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (4, DATE '2024-10-14', TIME '17:00:00', 60, NULL, TRUE); -- 31
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (4, DATE '2024-10-21', TIME '17:00:00', 60, NULL, FALSE); -- 32
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (5, DATE '2024-09-05', TIME '18:00:00', 60, NULL, FALSE); -- 33
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (5, DATE '2024-09-12', TIME '18:00:00', 60, NULL, FALSE); -- 34
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (5, DATE '2024-09-19', TIME '18:00:00', 60, NULL, FALSE); -- 35
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (5, DATE '2024-09-26', TIME '18:00:00', 60, 5, FALSE); -- 36
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (5, DATE '2024-10-03', TIME '18:00:00', 60, NULL, FALSE); -- 37
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (5, DATE '2024-10-10', TIME '18:00:00', 60, NULL, FALSE); -- 38
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (5, DATE '2024-10-17', TIME '18:00:00', 60, NULL, FALSE); -- 39
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (5, DATE '2024-10-24', TIME '18:00:00', 60, NULL, FALSE); -- 40
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (6, DATE '2024-09-03', TIME '14:30:00', 45, NULL, FALSE); -- 41
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (6, DATE '2024-09-10', TIME '14:30:00', 45, NULL, FALSE); -- 42
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (6, DATE '2024-09-17', TIME '14:30:00', 45, NULL, FALSE); -- 43
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (6, DATE '2024-09-24', TIME '14:30:00', 45, NULL, FALSE); -- 44
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (6, DATE '2024-10-01', TIME '14:30:00', 45, NULL, FALSE); -- 45
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (6, DATE '2024-10-08', TIME '14:30:00', 45, NULL, FALSE); -- 46
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (6, DATE '2024-10-15', TIME '14:30:00', 45, NULL, TRUE); -- 47
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (6, DATE '2024-10-22', TIME '14:30:00', 45, 5, FALSE); -- 48
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (7, DATE '2024-09-05', TIME '19:00:00', 60, NULL, FALSE); -- 49
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (7, DATE '2024-09-12', TIME '19:00:00', 60, 6, FALSE); -- 50
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (7, DATE '2024-09-19', TIME '19:00:00', 60, NULL, FALSE); -- 51
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (7, DATE '2024-09-26', TIME '19:00:00', 60, NULL, TRUE); -- 52
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (7, DATE '2024-10-03', TIME '19:00:00', 60, NULL, TRUE); -- 53
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (7, DATE '2024-10-10', TIME '19:00:00', 60, NULL, FALSE); -- 54
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (7, DATE '2024-10-17', TIME '19:00:00', 60, NULL, FALSE); -- 55
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (7, DATE '2024-10-24', TIME '19:00:00', 60, NULL, FALSE); -- 56
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (8, DATE '2024-09-06', TIME '16:30:00', 90, NULL, FALSE); -- 57
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (8, DATE '2024-09-13', TIME '16:30:00', 90, NULL, FALSE); -- 58
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (8, DATE '2024-09-20', TIME '16:30:00', 90, NULL, FALSE); -- 59
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (8, DATE '2024-09-27', TIME '16:30:00', 90, NULL, FALSE); -- 60
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (8, DATE '2024-10-04', TIME '16:30:00', 90, NULL, FALSE); -- 61
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (8, DATE '2024-10-11', TIME '16:30:00', 90, NULL, FALSE); -- 62
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (8, DATE '2024-10-18', TIME '16:30:00', 90, NULL, FALSE); -- 63
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (8, DATE '2024-10-25', TIME '16:30:00', 90, 5, FALSE); -- 64
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (9, DATE '2024-09-04', TIME '18:30:00', 90, NULL, FALSE); -- 65
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (9, DATE '2024-09-11', TIME '18:30:00', 90, NULL, FALSE); -- 66
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (9, DATE '2024-09-18', TIME '18:30:00', 90, NULL, FALSE); -- 67
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (9, DATE '2024-09-25', TIME '18:30:00', 90, NULL, FALSE); -- 68
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (9, DATE '2024-10-02', TIME '18:30:00', 90, NULL, FALSE); -- 69
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (9, DATE '2024-10-09', TIME '18:30:00', 90, NULL, FALSE); -- 70
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (9, DATE '2024-10-16', TIME '18:30:00', 90, NULL, FALSE); -- 71
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (9, DATE '2024-10-23', TIME '18:30:00', 90, NULL, TRUE); -- 72
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (10, DATE '2024-09-06', TIME '15:00:00', 45, 3, FALSE); -- 73
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (10, DATE '2024-09-13', TIME '15:00:00', 45, 5, FALSE); -- 74
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (10, DATE '2024-09-20', TIME '15:00:00', 45, 5, FALSE); -- 75
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (10, DATE '2024-09-27', TIME '15:00:00', 45, 3, FALSE); -- 76
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (10, DATE '2024-10-04', TIME '15:00:00', 45, 5, FALSE); -- 77
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (10, DATE '2024-10-11', TIME '15:00:00', 45, 3, FALSE); -- 78
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (10, DATE '2024-10-18', TIME '15:00:00', 45, 3, FALSE); -- 79
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (10, DATE '2024-10-25', TIME '15:00:00', 45, 3, FALSE); -- 80
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (11, DATE '2024-09-05', TIME '17:30:00', 90, NULL, FALSE); -- 81
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (11, DATE '2024-09-12', TIME '17:30:00', 90, NULL, FALSE); -- 82
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (11, DATE '2024-09-19', TIME '17:30:00', 90, NULL, FALSE); -- 83
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (11, DATE '2024-09-26', TIME '17:30:00', 90, NULL, FALSE); -- 84
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (11, DATE '2024-10-03', TIME '17:30:00', 90, NULL, FALSE); -- 85
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (11, DATE '2024-10-10', TIME '17:30:00', 90, NULL, FALSE); -- 86
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (11, DATE '2024-10-17', TIME '17:30:00', 90, NULL, FALSE); -- 87
INSERT INTO termin (kurs_id, datum, uhrzeit, dauer_min, raum_id, ausgefallen) VALUES (11, DATE '2024-10-24', TIME '17:30:00', 90, NULL, FALSE); -- 88

-- ausleihe (rueckgabe NULL = noch ausgeliehen)
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (6, 33, 'EB-022', DATE '2024-09-13', NULL); -- 1
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (3, 22, 'VA-010', DATE '2024-10-11', DATE '2025-02-10'); -- 2
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (7, 38, 'QF-006', DATE '2024-11-24', DATE '2024-12-18'); -- 3
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (3, 16, 'VA-030', DATE '2024-11-17', NULL); -- 4
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (6, 29, 'EB-038', DATE '2024-11-20', DATE '2025-03-16'); -- 5
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (5, 11, 'GI-031', DATE '2024-08-21', DATE '2024-12-03'); -- 6
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (5, 37, 'GI-005', DATE '2024-12-11', NULL); -- 7
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (6, 37, 'EB-027', DATE '2024-09-13', DATE '2024-11-08'); -- 8
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (2, 9, 'VL-020', DATE '2024-12-19', DATE '2025-02-07'); -- 9
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (5, 11, 'GI-035', DATE '2024-09-18', NULL); -- 10
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (9, 20, 'TR-024', DATE '2024-12-31', DATE '2025-05-08'); -- 11
INSERT INTO ausleihe (instrument_id, schueler_id, inventar_nr, ausgabe, rueckgabe) VALUES (4, 26, 'VC-027', DATE '2024-09-09', DATE '2025-02-02'); -- 12

-- vertretung (rekursiv lehrkraft-lehrkraft); 1->2->3 bildet eine Kette
INSERT INTO vertretung (lehrkraft_id, vertreter_id, von, bis, grund) VALUES (1, 2, DATE '2024-10-18', DATE '2024-10-31', 'Krankheit'); -- 1
INSERT INTO vertretung (lehrkraft_id, vertreter_id, von, bis, grund) VALUES (2, 3, DATE '2024-09-26', DATE '2024-09-26', 'Fortbildung'); -- 2
INSERT INTO vertretung (lehrkraft_id, vertreter_id, von, bis, grund) VALUES (4, 7, DATE '2024-10-02', DATE '2024-10-04', 'Konzertreise'); -- 3
INSERT INTO vertretung (lehrkraft_id, vertreter_id, von, bis, grund) VALUES (6, 3, DATE '2024-10-07', DATE '2024-10-20', NULL); -- 4
INSERT INTO vertretung (lehrkraft_id, vertreter_id, von, bis, grund) VALUES (8, 1, DATE '2024-09-24', DATE '2024-09-30', 'Krankheit'); -- 5
INSERT INTO vertretung (lehrkraft_id, vertreter_id, von, bis, grund) VALUES (5, 2, DATE '2024-09-15', DATE '2024-09-21', 'Fortbildung'); -- 6

-- zahlung (bezahlt_am NULL = offen)
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (11, 1, NULL, 49.60, DATE '2024-10-15', DATE '2024-10-23', 'Ueberweisung'); -- 1
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (11, 1, NULL, 49.60, DATE '2024-11-15', DATE '2024-11-13', 'Ueberweisung'); -- 2
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (16, 1, NULL, 49.60, DATE '2024-09-15', DATE '2024-09-30', 'Ueberweisung'); -- 3
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (16, 1, NULL, 49.60, DATE '2024-10-15', DATE '2024-10-02', 'Ueberweisung'); -- 4
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (16, 1, NULL, 49.60, DATE '2024-11-15', DATE '2024-11-16', 'Ueberweisung'); -- 5
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (25, 1, NULL, 62.00, DATE '2024-09-15', DATE '2024-09-14', 'Ueberweisung'); -- 6
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (25, 1, NULL, 62.00, DATE '2024-10-15', DATE '2024-10-14', 'Bar'); -- 7
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (25, 1, NULL, 62.00, DATE '2024-11-15', NULL, NULL); -- 8
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (26, 1, NULL, 62.00, DATE '2024-09-15', DATE '2024-09-22', 'Ueberweisung'); -- 9
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (26, 1, NULL, 62.00, DATE '2024-10-15', DATE '2024-10-01', 'Lastschrift'); -- 10
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (26, 1, NULL, 62.00, DATE '2024-11-15', DATE '2024-11-10', 'Ueberweisung'); -- 11
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (14, 2, NULL, 78.00, DATE '2024-09-15', DATE '2024-09-12', 'Ueberweisung'); -- 12
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (14, 2, NULL, 78.00, DATE '2024-10-15', DATE '2024-10-02', 'Ueberweisung'); -- 13
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (14, 2, NULL, 78.00, DATE '2024-11-15', NULL, NULL); -- 14
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (25, 2, NULL, 78.00, DATE '2024-10-15', DATE '2024-10-16', 'Bar'); -- 15
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (25, 2, NULL, 78.00, DATE '2024-11-15', NULL, NULL); -- 16
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (15, 3, NULL, 58.00, DATE '2024-10-15', DATE '2024-10-04', 'Ueberweisung'); -- 17
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (15, 3, NULL, 58.00, DATE '2024-11-15', DATE '2024-12-04', 'Ueberweisung'); -- 18
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (16, 3, NULL, 46.40, DATE '2024-09-15', DATE '2024-10-01', 'Lastschrift'); -- 19
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (16, 3, NULL, 46.40, DATE '2024-10-15', DATE '2024-11-02', 'Bar'); -- 20
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (16, 3, NULL, 46.40, DATE '2024-11-15', NULL, NULL); -- 21
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (18, 3, NULL, 58.00, DATE '2024-09-15', DATE '2024-09-03', 'Bar'); -- 22
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (18, 3, NULL, 58.00, DATE '2024-10-15', DATE '2024-11-03', 'Lastschrift'); -- 23
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (18, 3, NULL, 58.00, DATE '2024-11-15', DATE '2024-11-02', 'Ueberweisung'); -- 24
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (19, 3, NULL, 52.20, DATE '2024-09-15', DATE '2024-09-26', 'Lastschrift'); -- 25
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (19, 3, NULL, 52.20, DATE '2024-10-15', DATE '2024-11-01', 'Bar'); -- 26
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (19, 3, NULL, 52.20, DATE '2024-11-15', DATE '2024-11-05', 'Ueberweisung'); -- 27
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (22, 3, NULL, 58.00, DATE '2024-09-15', DATE '2024-09-10', 'Ueberweisung'); -- 28
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (22, 3, NULL, 58.00, DATE '2024-10-15', DATE '2024-10-21', 'Lastschrift'); -- 29
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (22, 3, NULL, 58.00, DATE '2024-11-15', DATE '2024-12-04', 'Lastschrift'); -- 30
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (9, 4, NULL, 45.00, DATE '2024-09-15', DATE '2024-09-28', 'Ueberweisung'); -- 31
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (9, 4, NULL, 45.00, DATE '2024-10-15', DATE '2024-10-08', 'Bar'); -- 32
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (9, 4, NULL, 45.00, DATE '2024-11-15', DATE '2024-11-14', 'Lastschrift'); -- 33
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (12, 4, NULL, 45.00, DATE '2024-09-15', DATE '2024-09-15', 'Lastschrift'); -- 34
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (12, 4, NULL, 45.00, DATE '2024-10-15', DATE '2024-10-30', 'Lastschrift'); -- 35
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (12, 4, NULL, 45.00, DATE '2024-11-15', DATE '2024-11-07', 'Lastschrift'); -- 36
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (31, 4, NULL, 36.00, DATE '2024-09-15', DATE '2024-09-17', 'Lastschrift'); -- 37
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (31, 4, NULL, 36.00, DATE '2024-10-15', DATE '2024-10-31', 'Ueberweisung'); -- 38
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (31, 4, NULL, 36.00, DATE '2024-11-15', NULL, NULL); -- 39
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (35, 4, NULL, 45.00, DATE '2024-10-15', DATE '2024-10-28', 'Ueberweisung'); -- 40
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (35, 4, NULL, 45.00, DATE '2024-11-15', DATE '2024-11-24', 'Ueberweisung'); -- 41
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (36, 4, NULL, 45.00, DATE '2024-09-15', DATE '2024-09-22', 'Bar'); -- 42
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (36, 4, NULL, 45.00, DATE '2024-10-15', DATE '2024-10-23', 'Bar'); -- 43
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (5, 5, NULL, 55.00, DATE '2024-09-15', DATE '2024-09-28', 'Bar'); -- 44
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (5, 5, NULL, 55.00, DATE '2024-10-15', DATE '2024-10-19', 'Bar'); -- 45
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (5, 5, NULL, 55.00, DATE '2024-11-15', NULL, NULL); -- 46
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (22, 5, NULL, 55.00, DATE '2024-09-15', DATE '2024-10-03', 'Ueberweisung'); -- 47
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (22, 5, NULL, 55.00, DATE '2024-10-15', DATE '2024-10-31', 'Ueberweisung'); -- 48
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (22, 5, NULL, 55.00, DATE '2024-11-15', DATE '2024-11-23', 'Bar'); -- 49
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (27, 5, NULL, 55.00, DATE '2024-09-15', DATE '2024-09-18', 'Bar'); -- 50
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (27, 5, NULL, 55.00, DATE '2024-10-15', DATE '2024-10-28', 'Bar'); -- 51
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (27, 5, NULL, 55.00, DATE '2024-11-15', DATE '2024-11-02', 'Bar'); -- 52
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (16, 6, NULL, 51.20, DATE '2024-09-15', DATE '2024-09-18', 'Ueberweisung'); -- 53
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (16, 6, NULL, 51.20, DATE '2024-10-15', DATE '2024-10-20', 'Lastschrift'); -- 54
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (16, 6, NULL, 51.20, DATE '2024-11-15', DATE '2024-11-12', 'Ueberweisung'); -- 55
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (23, 6, NULL, 64.00, DATE '2024-09-15', DATE '2024-09-26', 'Ueberweisung'); -- 56
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (23, 6, NULL, 64.00, DATE '2024-10-15', DATE '2024-10-02', 'Ueberweisung'); -- 57
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (23, 6, NULL, 64.00, DATE '2024-11-15', DATE '2024-11-14', 'Lastschrift'); -- 58
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (32, 6, NULL, 64.00, DATE '2024-09-15', DATE '2024-09-22', 'Ueberweisung'); -- 59
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (32, 6, NULL, 64.00, DATE '2024-10-15', DATE '2024-10-21', 'Bar'); -- 60
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (32, 6, NULL, 64.00, DATE '2024-11-15', DATE '2024-11-04', 'Ueberweisung'); -- 61
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (17, 7, NULL, 59.40, DATE '2024-09-15', DATE '2024-09-04', 'Bar'); -- 62
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (17, 7, NULL, 59.40, DATE '2024-10-15', DATE '2024-10-29', 'Bar'); -- 63
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (17, 7, NULL, 59.40, DATE '2024-11-15', DATE '2024-11-29', 'Lastschrift'); -- 64
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (23, 7, NULL, 66.00, DATE '2024-09-15', DATE '2024-10-03', 'Ueberweisung'); -- 65
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (23, 7, NULL, 66.00, DATE '2024-10-15', DATE '2024-10-08', 'Lastschrift'); -- 66
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (23, 7, NULL, 66.00, DATE '2024-11-15', DATE '2024-12-02', 'Bar'); -- 67
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (28, 7, NULL, 66.00, DATE '2024-09-15', DATE '2024-09-03', 'Ueberweisung'); -- 68
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (28, 7, NULL, 66.00, DATE '2024-10-15', DATE '2024-10-04', 'Ueberweisung'); -- 69
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (28, 7, NULL, 66.00, DATE '2024-11-15', NULL, NULL); -- 70
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (30, 7, NULL, 66.00, DATE '2024-10-15', DATE '2024-10-09', 'Lastschrift'); -- 71
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (30, 7, NULL, 66.00, DATE '2024-11-15', NULL, NULL); -- 72
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (21, 8, NULL, 45.00, DATE '2024-09-15', DATE '2024-10-02', 'Bar'); -- 73
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (21, 8, NULL, 45.00, DATE '2024-10-15', DATE '2024-10-09', 'Lastschrift'); -- 74
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (21, 8, NULL, 45.00, DATE '2024-11-15', DATE '2024-11-15', 'Bar'); -- 75
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (24, 8, NULL, 50.00, DATE '2024-09-15', DATE '2024-09-23', 'Ueberweisung'); -- 76
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (24, 8, NULL, 50.00, DATE '2024-10-15', DATE '2024-10-03', 'Lastschrift'); -- 77
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (24, 8, NULL, 50.00, DATE '2024-11-15', NULL, NULL); -- 78
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (29, 8, NULL, 45.00, DATE '2024-09-15', DATE '2024-09-21', 'Bar'); -- 79
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (29, 8, NULL, 45.00, DATE '2024-10-15', DATE '2024-10-26', 'Bar'); -- 80
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (29, 8, NULL, 45.00, DATE '2024-11-15', DATE '2024-11-19', 'Ueberweisung'); -- 81
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (30, 8, NULL, 50.00, DATE '2024-09-15', DATE '2024-09-21', 'Ueberweisung'); -- 82
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (30, 8, NULL, 50.00, DATE '2024-10-15', DATE '2024-10-30', 'Bar'); -- 83
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (30, 8, NULL, 50.00, DATE '2024-11-15', DATE '2024-11-06', 'Lastschrift'); -- 84
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (36, 8, NULL, 50.00, DATE '2024-09-15', DATE '2024-09-16', 'Lastschrift'); -- 85
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (36, 8, NULL, 50.00, DATE '2024-10-15', DATE '2024-11-03', 'Ueberweisung'); -- 86
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (36, 8, NULL, 50.00, DATE '2024-11-15', DATE '2024-11-20', 'Bar'); -- 87
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (10, 9, NULL, 40.00, DATE '2024-09-15', DATE '2024-09-22', 'Ueberweisung'); -- 88
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (10, 9, NULL, 40.00, DATE '2024-10-15', DATE '2024-10-08', 'Bar'); -- 89
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (10, 9, NULL, 40.00, DATE '2024-11-15', DATE '2024-11-23', 'Lastschrift'); -- 90
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (13, 9, NULL, 32.00, DATE '2024-09-15', DATE '2024-09-10', 'Ueberweisung'); -- 91
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (13, 9, NULL, 32.00, DATE '2024-10-15', DATE '2024-10-17', 'Ueberweisung'); -- 92
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (13, 9, NULL, 32.00, DATE '2024-11-15', NULL, NULL); -- 93
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (15, 9, NULL, 40.00, DATE '2024-09-15', DATE '2024-09-05', 'Ueberweisung'); -- 94
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (15, 9, NULL, 40.00, DATE '2024-10-15', DATE '2024-11-01', 'Lastschrift'); -- 95
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (15, 9, NULL, 40.00, DATE '2024-11-15', DATE '2024-11-29', 'Bar'); -- 96
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (17, 9, NULL, 40.00, DATE '2024-09-15', DATE '2024-09-21', 'Bar'); -- 97
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (17, 9, NULL, 40.00, DATE '2024-10-15', DATE '2024-10-29', 'Ueberweisung'); -- 98
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (17, 9, NULL, 40.00, DATE '2024-11-15', DATE '2024-11-20', 'Lastschrift'); -- 99
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (20, 9, NULL, 40.00, DATE '2024-09-15', DATE '2024-09-23', 'Bar'); -- 100
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (20, 9, NULL, 40.00, DATE '2024-10-15', DATE '2024-10-30', 'Lastschrift'); -- 101
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (20, 9, NULL, 40.00, DATE '2024-11-15', NULL, NULL); -- 102
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (25, 9, NULL, 40.00, DATE '2024-09-15', DATE '2024-09-19', 'Ueberweisung'); -- 103
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (25, 9, NULL, 40.00, DATE '2024-10-15', DATE '2024-10-06', 'Bar'); -- 104
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (25, 9, NULL, 40.00, DATE '2024-11-15', DATE '2024-11-25', 'Lastschrift'); -- 105
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (33, 9, NULL, 40.00, DATE '2024-09-15', DATE '2024-09-03', 'Lastschrift'); -- 106
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (33, 9, NULL, 40.00, DATE '2024-10-15', DATE '2024-10-13', 'Lastschrift'); -- 107
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (33, 9, NULL, 40.00, DATE '2024-11-15', DATE '2024-12-03', 'Ueberweisung'); -- 108
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (38, 9, NULL, 40.00, DATE '2024-09-15', DATE '2024-09-29', 'Ueberweisung'); -- 109
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (38, 9, NULL, 40.00, DATE '2024-10-15', DATE '2024-10-22', 'Bar'); -- 110
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (38, 9, NULL, 40.00, DATE '2024-11-15', NULL, NULL); -- 111
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (9, 10, NULL, 25.00, DATE '2024-09-15', DATE '2024-09-03', 'Ueberweisung'); -- 112
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (9, 10, NULL, 25.00, DATE '2024-10-15', DATE '2024-10-29', 'Bar'); -- 113
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (9, 10, NULL, 25.00, DATE '2024-11-15', DATE '2024-11-11', 'Lastschrift'); -- 114
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (11, 10, NULL, 20.00, DATE '2024-09-15', DATE '2024-09-19', 'Lastschrift'); -- 115
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (11, 10, NULL, 20.00, DATE '2024-10-15', DATE '2024-10-22', 'Bar'); -- 116
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (11, 10, NULL, 20.00, DATE '2024-11-15', DATE '2024-11-22', 'Ueberweisung'); -- 117
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (34, 10, NULL, 20.00, DATE '2024-10-15', DATE '2024-10-25', 'Lastschrift'); -- 118
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (34, 10, NULL, 20.00, DATE '2024-11-15', NULL, NULL); -- 119
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (36, 10, NULL, 25.00, DATE '2024-09-15', DATE '2024-09-10', 'Lastschrift'); -- 120
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (36, 10, NULL, 25.00, DATE '2024-10-15', DATE '2024-10-10', 'Lastschrift'); -- 121
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (36, 10, NULL, 25.00, DATE '2024-11-15', NULL, NULL); -- 122
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (37, 10, NULL, 25.00, DATE '2024-09-15', DATE '2024-09-26', 'Ueberweisung'); -- 123
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (37, 10, NULL, 25.00, DATE '2024-10-15', DATE '2024-10-06', 'Lastschrift'); -- 124
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (37, 10, NULL, 25.00, DATE '2024-11-15', DATE '2024-11-22', 'Ueberweisung'); -- 125
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (38, 10, NULL, 25.00, DATE '2024-09-15', DATE '2024-10-04', 'Ueberweisung'); -- 126
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (38, 10, NULL, 25.00, DATE '2024-10-15', DATE '2024-10-28', 'Bar'); -- 127
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (38, 10, NULL, 25.00, DATE '2024-11-15', DATE '2024-11-24', 'Lastschrift'); -- 128
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (18, 11, NULL, 20.00, DATE '2024-09-15', DATE '2024-09-14', 'Lastschrift'); -- 129
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (18, 11, NULL, 20.00, DATE '2024-10-15', DATE '2024-11-01', 'Ueberweisung'); -- 130
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (18, 11, NULL, 20.00, DATE '2024-11-15', NULL, NULL); -- 131
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (21, 11, NULL, 18.00, DATE '2024-09-15', DATE '2024-09-05', 'Lastschrift'); -- 132
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (21, 11, NULL, 18.00, DATE '2024-10-15', DATE '2024-10-07', 'Bar'); -- 133
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (21, 11, NULL, 18.00, DATE '2024-11-15', DATE '2024-12-04', 'Ueberweisung'); -- 134
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (22, 11, NULL, 20.00, DATE '2024-10-15', DATE '2024-10-09', 'Bar'); -- 135
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (22, 11, NULL, 20.00, DATE '2024-11-15', DATE '2024-11-11', 'Ueberweisung'); -- 136
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (24, 11, NULL, 20.00, DATE '2024-09-15', DATE '2024-09-11', 'Bar'); -- 137
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (24, 11, NULL, 20.00, DATE '2024-10-15', DATE '2024-10-27', 'Lastschrift'); -- 138
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (24, 11, NULL, 20.00, DATE '2024-11-15', DATE '2024-11-16', 'Lastschrift'); -- 139
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (29, 11, NULL, 20.00, DATE '2024-09-15', DATE '2024-09-29', 'Ueberweisung'); -- 140
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (29, 11, NULL, 20.00, DATE '2024-10-15', DATE '2024-10-20', 'Lastschrift'); -- 141
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (29, 11, NULL, 20.00, DATE '2024-11-15', DATE '2024-11-13', 'Lastschrift'); -- 142
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (33, NULL, 1, 12.00, DATE '2024-09-27', DATE '2024-10-06', 'Lastschrift'); -- 143
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (22, NULL, 2, 15.00, DATE '2024-10-25', DATE '2024-10-29', 'Lastschrift'); -- 144
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (38, NULL, 3, 12.00, DATE '2024-12-08', DATE '2024-12-14', 'Ueberweisung'); -- 145
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (16, NULL, 4, 15.00, DATE '2024-12-01', NULL, NULL); -- 146
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (29, NULL, 5, 12.00, DATE '2024-12-04', NULL, NULL); -- 147
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (11, NULL, 6, 10.00, DATE '2024-09-04', DATE '2024-09-08', 'Ueberweisung'); -- 148
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (37, NULL, 7, 10.00, DATE '2024-12-25', DATE '2024-12-30', 'Bar'); -- 149
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (37, NULL, 8, 12.00, DATE '2024-09-27', NULL, NULL); -- 150
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (9, NULL, 9, 15.00, DATE '2025-01-02', NULL, NULL); -- 151
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (11, NULL, 10, 10.00, DATE '2024-10-02', DATE '2024-10-03', 'Lastschrift'); -- 152
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (20, NULL, 11, 14.00, DATE '2025-01-14', DATE '2025-01-16', 'Lastschrift'); -- 153
INSERT INTO zahlung (schueler_id, kurs_id, ausleihe_id, betrag, faellig_am, bezahlt_am, zahlungsart) VALUES (26, NULL, 12, 25.00, DATE '2024-09-23', DATE '2024-10-01', 'Ueberweisung'); -- 154
