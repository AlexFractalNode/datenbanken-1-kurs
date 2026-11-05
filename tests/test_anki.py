import json
import shutil
import sqlite3
import zipfile
from pathlib import Path

import anki_export
import genanki
from content import load_all

FIXTURE = Path(__file__).parent / "fixtures" / "content_ok"


def _card_count():
    c = load_all(FIXTURE)
    return sum(len(v) for v in c.cards.values())


def _run(out, *extra):
    assert anki_export.main(["--root", str(FIXTURE), "--out", str(out), *extra]) == 0


def _extract_db(apkg: Path) -> Path:
    db = apkg.parent / (apkg.stem + ".sqlite")
    with zipfile.ZipFile(apkg) as z:
        db.write_bytes(z.read("collection.anki2"))
    return db


def _guids(apkg: Path) -> list[str]:
    con = sqlite3.connect(_extract_db(apkg))
    try:
        return sorted(r[0] for r in con.execute("select guid from notes"))
    finally:
        con.close()


def test_guid_stable_across_runs(tmp_path):
    _run(tmp_path / "a")
    _run(tmp_path / "b")
    ga = _guids(tmp_path / "a" / "db1-de.apkg")
    gb = _guids(tmp_path / "b" / "db1-de.apkg")
    assert ga == gb
    assert genanki.guid_for("t04-c001") in ga
    assert len(set(ga)) == _card_count()


def test_apkg_sqlite_structure(tmp_path):
    _run(tmp_path, "--per-topic")
    assert (tmp_path / "db1-de-t04.apkg").is_file()
    con = sqlite3.connect(_extract_db(tmp_path / "db1-de.apkg"))
    try:
        assert con.execute("select count(*) from notes").fetchone()[0] == _card_count()
        assert con.execute("select count(*) from cards").fetchone()[0] == _card_count()
        models, decks = (json.loads(x) for x in con.execute("select models, decks from col").fetchone())
        assert str(anki_export.MODEL_ID) in models
        names = [f["name"] for f in models[str(anki_export.MODEL_ID)]["flds"]]
        assert names == ["Front", "Back", "Quelle"]
        assert str(anki_export.deck_id("t04")) in decks
        assert decks[str(anki_export.deck_id("t04"))]["name"] == "DB1::t04 Platzhalter-Thema 4"
    finally:
        con.close()


def test_diagram_media_included(tmp_path):
    root = tmp_path / "root"
    shutil.copytree(FIXTURE, root)
    d = root / "content/de/topics/t04-er-modellierung/diagrams"
    d.mkdir()
    (d / "platzhalter-diagramm.svg").write_text("<svg xmlns='http://www.w3.org/2000/svg'/>")
    assert anki_export.main(["--root", str(root), "--out", str(tmp_path / "o")]) == 0
    with zipfile.ZipFile(tmp_path / "o" / "db1-de.apkg") as z:
        assert "platzhalter-diagramm.svg" in z.read("media").decode()


def test_import_into_empty_collection(tmp_path):
    from anki.collection import Collection, ImportAnkiPackageRequest

    _run(tmp_path)
    col = Collection(str(tmp_path / "test.anki2"))
    try:
        assert col.note_count() == 0
        col.import_anki_package(
            ImportAnkiPackageRequest(package_path=str(tmp_path / "db1-de.apkg"))
        )
        assert col.note_count() == _card_count()
        assert col.card_count() == _card_count()
        assert "DB1::t04 Platzhalter-Thema 4" in [d.name for d in col.decks.all_names_and_ids()]
    finally:
        col.close()
