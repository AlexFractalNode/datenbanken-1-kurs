import json
import shutil
import sqlite3
import zipfile
from pathlib import Path

import anki_export
import genanki
import pytest
import yaml
from test_anki import FIXTURE, _extract_db


def _fields(apkg: Path) -> list[list[str]]:
    con = sqlite3.connect(_extract_db(apkg))
    try:
        return [r[0].split("\x1f") for r in con.execute("select flds from notes order by id")]
    finally:
        con.close()


def _root_with(tmp_path, cards=None, diagram_svg=None):
    root = tmp_path / "root"
    shutil.copytree(FIXTURE, root)
    tdir = root / "content/de/topics/t04-er-modellierung"
    if cards is not None:
        (tdir / "cards.yml").write_text(yaml.safe_dump(cards, allow_unicode=True), encoding="utf-8")
    if diagram_svg is not None:
        (tdir / "diagrams").mkdir()
        (tdir / "diagrams" / "d.svg").write_text(diagram_svg)
    return root


def _card(i, **kw):
    c = {"id": f"t04-c{i:03d}", "status": "draft", "reviews": [], "front": "F", "back": "B"}
    c.update(kw)
    return c


def _run(root, out, *extra):
    return anki_export.main(["--root", str(root), "--out", str(out), *extra])


def test_raw_html_is_escaped(tmp_path):
    root = _root_with(
        tmp_path,
        [_card(1, front="<script>alert(1)</script>", back="Tag <kunde> und `code` und **fett**")],
    )
    assert _run(root, tmp_path / "o") == 0
    front, back, _ = _fields(tmp_path / "o" / "db1-de.apkg")[0]
    assert "<script" not in front and "&lt;script&gt;" in front
    assert "<kunde>" not in back and "&lt;kunde&gt;" in back
    assert "<code>code</code>" in back and "<strong>fett</strong>" in back


def test_source_text_is_escaped(tmp_path):
    root = _root_with(
        tmp_path, [_card(1, sources=[{"id": "placeholder-oer", "ref": "<b>Kap</b> & 2"}])]
    )
    assert _run(root, tmp_path / "o") == 0
    quelle = _fields(tmp_path / "o" / "db1-de.apkg")[0][2]
    assert "<b>" not in quelle and "&lt;b&gt;Kap" in quelle and "&amp; 2" in quelle


def test_media_prefixed_and_deduplicated(tmp_path):
    root = _root_with(
        tmp_path, [_card(1, diagram="d"), _card(2, diagram="d")], diagram_svg="<svg/>"
    )
    assert _run(root, tmp_path / "o") == 0
    apkg = tmp_path / "o" / "db1-de.apkg"
    with zipfile.ZipFile(apkg) as z:
        media = json.loads(z.read("media"))
    assert list(media.values()) == ["t04-d.svg"]
    assert all('src="t04-d.svg"' in f[1] for f in _fields(apkg))


def test_diagrams_dir_takes_precedence(tmp_path):
    root = _root_with(tmp_path, [_card(1, diagram="d")], diagram_svg="<svg>topic</svg>")
    dd = tmp_path / "dd" / "t04"
    dd.mkdir(parents=True)
    (dd / "d.svg").write_text("<svg>rendered</svg>")
    assert _run(root, tmp_path / "o", "--diagrams", str(tmp_path / "dd")) == 0
    with zipfile.ZipFile(tmp_path / "o" / "db1-de.apkg") as z:
        assert z.read("0") == b"<svg>rendered</svg>"


def test_diagram_falls_back_to_topic_dir(tmp_path):
    root = _root_with(tmp_path, [_card(1, diagram="d")], diagram_svg="<svg>topic</svg>")
    assert _run(root, tmp_path / "o", "--diagrams", str(tmp_path / "none")) == 0
    with zipfile.ZipFile(tmp_path / "o" / "db1-de.apkg") as z:
        assert z.read("0") == b"<svg>topic</svg>"


@pytest.mark.parametrize(
    "name", ["../x", "a/b", "a\\b", "..", "a" + ".." + "b/c", ".hidden", ""]
)
def test_diagram_name_must_be_simple(tmp_path, name, capsys):
    root = _root_with(tmp_path, [_card(1, diagram=name)])
    assert _run(root, tmp_path / "o") == 1
    assert "diagram" in capsys.readouterr().err


def test_import_checks_tags_and_fields(tmp_path):
    from anki.collection import Collection, ImportAnkiPackageRequest

    root = _root_with(tmp_path, [_card(1, front="Frage *eins*", back="Antwort", tags=["a", "b"])])
    assert _run(root, tmp_path / "o") == 0
    col = Collection(str(tmp_path / "t.anki2"))
    try:
        col.import_anki_package(
            ImportAnkiPackageRequest(package_path=str(tmp_path / "o" / "db1-de.apkg"))
        )
        note = col.get_note(col.find_notes("")[0])
        assert note.keys() == ["Front", "Back", "Quelle"]
        assert note["Front"] == "<p>Frage <em>eins</em></p>"
        assert note.tags == ["a", "b"]
        assert note.guid == genanki.guid_for("t04-c001")
    finally:
        col.close()
