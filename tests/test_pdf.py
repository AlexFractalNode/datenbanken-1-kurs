import re
from pathlib import Path

import pdf
import pytest
from content import load_all
from pypdf import PdfReader

FIXTURE = Path(__file__).parent / "fixtures" / "content_ok"
GLYPHS = "σπ⋈⋉⋊∪∩−ρ×"


def _text(path: Path) -> str:
    raw = " ".join(p.extract_text() for p in PdfReader(path).pages)
    return re.sub(r"\s+", " ", raw)


@pytest.fixture(scope="module")
def out(tmp_path_factory):
    d = tmp_path_factory.mktemp("pdf")
    assert pdf.main(["--root", str(FIXTURE), "--out", str(d)]) == 0
    return d


def test_exam_pdf_has_cover_and_points(out):
    text = _text(out / "exam-01.pdf")
    assert "90 Minuten" in text
    assert "angenommene Bedingungen, ohne Gewähr" in text
    assert "10 × 10 cm" in text
    assert "1 Punkt ≈ 1 Minute" in text
    assert "Inoffizieller Lernkurs – CC BY-SA 4.0" in text
    assert "90" in re.findall(r"\d+", text)  # point sum 45 + 45
    assert "Platzhalter-Klausuraufgabe 2" in text


def test_solution_separate(out):
    exam = _text(out / "exam-01.pdf")
    sol = _text(out / "exam-01-loesung.pdf")
    assert "Platzhalter-Lösung 1" not in exam
    assert "Platzhalter-Lösung 1" in sol
    assert "Platzhalter-Kriterium B" in sol


def test_spickzettel_frame_100mm(out):
    src = (Path(pdf.__file__).parent / "typst" / "spickzettel.typ").read_text(encoding="utf-8")
    assert re.search(r"box-size\s*=\s*100mm", src)
    assert re.search(r"width:\s*box-size,\s*height:\s*box-size", src)
    assert len(PdfReader(out / "spickzettel-vorlage.pdf").pages) == 1


def test_cheatsheet_two_pages(out):
    assert len(PdfReader(out / "cheatsheet.pdf").pages) == 2


def test_topic_sheets(out):
    assert "Platzhalter-Aufgabe 1" in _text(out / "aufgaben-t04.pdf")
    assert "Platzhalter-Lösung 1" not in _text(out / "aufgaben-t04.pdf")
    assert "Platzhalter-Lösung 1" in _text(out / "loesung-t04.pdf")


def test_glyphs_and_markdown(tmp_path):
    md = "Operatoren: σ π ⋈ ⋉ ⋊ ∪ ∩ − ρ ×\n\n```sql\nSELECT 1;\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |\n"
    content = load_all(FIXTURE)
    content.exams["e01"]["tasks"][0]["prompt"] = md
    pdf.build_exam(content, "e01", tmp_path)
    text = _text(tmp_path / "exam-01.pdf")
    for ch in GLYPHS:
        assert ch in text, ch
    assert "SELECT 1;" in text


def test_write_space_parse():
    assert pdf.parse_space("lines:4") == ("lines", 4)
    assert pdf.parse_space("box:12") == ("box", 12)
    with pytest.raises(ValueError):
        pdf.parse_space("grid:3")


def _exam_tasks(content, tasks):
    content.exams["e01"]["tasks"] = tasks
    return content


def _task(i, points, **kw):
    t = {
        "id": f"e01-p{i:03d}", "topic": "t04", "points": points, "prompt": f"Aufgabe {i}",
        "solution": f"Loesung {i}", "rubric": [{"criterion": "K", "points": points}],
        "space": "lines:2",
    }
    t.update(kw)
    return t


def test_point_sum_custom_fixture(tmp_path):
    content = _exam_tasks(load_all(FIXTURE), [_task(1, 40), _task(2, 30), _task(3, 17)])
    pdf.build_exam(content, "e01", tmp_path)
    text = _text(tmp_path / "exam-01.pdf")
    assert "87 Punkte" in text
    assert "90 Punkte" not in text


def test_raw_typst_disabled(tmp_path):
    content = _exam_tasks(
        load_all(FIXTURE), [_task(1, 10, prompt='Vorher <!--raw-typst #panic("x") --> Nachher')]
    )
    pdf.build_exam(content, "e01", tmp_path)
    text = _text(tmp_path / "exam-01.pdf")
    assert "Vorher" in text and "Nachher" in text
    assert "panic" not in text


def test_long_solution_breaks_across_pages(tmp_path):
    words = " ".join(f"wort{i:04d}" for i in range(3000))
    content = _exam_tasks(load_all(FIXTURE), [_task(1, 10, solution=words)])
    pdf.build_exam(content, "e01", tmp_path)
    sol = tmp_path / "exam-01-loesung.pdf"
    assert len(PdfReader(sol).pages) >= 3
    text = _text(sol)
    assert "wort0000" in text and "wort2999" in text


def test_special_characters_prompt(tmp_path):
    special = '# $ @ < \ " * _ ` [ ] ( ) ' + chr(126)
    content = _exam_tasks(load_all(FIXTURE), [_task(1, 10, prompt=f"Zeichen: {special} Ende")])
    pdf.build_exam(content, "e01", tmp_path)
    text = _text(tmp_path / "exam-01.pdf")
    assert "Ende" in text
    for ch in "#$@<":
        assert ch in text
    assert any(q in text for q in '"“”„')


@pytest.mark.parametrize("spec", ["lines:0", "lines:41", "box:9", "box:251", "lines:x", "", "box:-3"])
def test_parse_space_range(spec):
    with pytest.raises(ValueError):
        pdf.parse_space(spec)


def test_parse_space_bounds_ok():
    assert pdf.parse_space("lines:1") == ("lines", 1)
    assert pdf.parse_space("lines:40") == ("lines", 40)
    assert pdf.parse_space("box:10") == ("box", 10)
    assert pdf.parse_space("box:250") == ("box", 250)


def test_typst_warning_aborts(tmp_path, monkeypatch):
    tdir = tmp_path / "tpl"
    tdir.mkdir()
    for f in (Path(pdf.__file__).parent / "typst").glob("*.typ"):
        (tdir / f.name).write_text(f.read_text(encoding="utf-8"), encoding="utf-8")
    sp = tdir / "spickzettel.typ"
    sp.write_text(sp.read_text(encoding="utf-8") + '\n#text(font: "NoSuchFontXYZ")[x]\n', encoding="utf-8")
    monkeypatch.setattr(pdf, "TEMPLATE_DIR", tdir)
    with pytest.raises(pdf.PdfError, match="warning"):
        pdf.build_spickzettel(tmp_path / "o")


def test_main_reports_pdf_error(tmp_path, monkeypatch, capsys):
    def boom(*a, **k):
        raise RuntimeError("kaputt")

    monkeypatch.setattr(pdf.typst, "compile_with_warnings", boom)
    assert pdf.main(["--root", str(FIXTURE), "--out", str(tmp_path)]) == 1
    assert "kaputt" in capsys.readouterr().err


def test_cheatsheet_truncates_long_glossary(tmp_path):
    content = load_all(FIXTURE)
    content.glossary = [
        {"id": f"g-x{i}", "de": f"Begriff{i}", "def_de": "Eine recht lange Definition. " * 6}
        for i in range(400)
    ]
    path = pdf.build_cheatsheet(content, tmp_path)
    assert len(PdfReader(path).pages) == 2
    assert "vollständig im Web-Glossar" in _text(path)


def test_task_data_replaces_local_images_with_placeholder():
    import pdf

    t = {
        "id": "t06-p001",
        "points": 3,
        "prompt": "Siehe ![Schema der Vorlage](diagrams/x.dot) oben.",
        "solution": "![](diagrams/y.dot)",
    }
    d = pdf._task_data(t)
    assert "diagrams/" not in d["prompt"] and "Schema der Vorlage" in d["prompt"]
    assert "diagrams/" not in d["solution"]
