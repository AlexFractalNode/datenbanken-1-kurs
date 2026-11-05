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
