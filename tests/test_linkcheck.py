"""tools/linkcheck.py: internal href/src check with base path."""
import linkcheck

B = "/datenbanken-1-kurs/"
UP = ".." + "/"


def site(tmp_path, files):
    for rel, text in files.items():
        p = tmp_path / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
    return tmp_path


def test_ok(tmp_path):
    d = site(tmp_path, {
        "index.html": f'<a href="{B}themen/t04/">x</a><img src="{B}logo.svg"><a href="https://e.org/x">e</a>'
                      '<a href="#top">t</a><a href="mailto:a@b.c">m</a><a href="themen/t04/#a?x=1">r</a>',
        "themen/t04/index.html": f'<link href="{B}_astro/a.css"><a href="{UP}{UP}">home</a>',
        "logo.svg": "<svg/>", "_astro/a.css": "",
    })
    assert linkcheck.check(d, B) == []


def test_broken_and_outside_base(tmp_path):
    d = site(tmp_path, {"index.html": f'<a href="{B}missing/">a</a><a href="/other/x.html">b</a><a href="nope.html">c</a>'})
    errs = linkcheck.check(d, B)
    assert len(errs) == 3
    assert any("missing" in e for e in errs) and any("outside base" in e for e in errs)


def test_main_exit_codes(tmp_path):
    d = site(tmp_path / "bad", {"index.html": '<a href="/datenbanken-1-kurs/x/">a</a>'})
    assert linkcheck.main([str(d)]) == 1
    assert linkcheck.main([str(tmp_path / "nodir")]) == 1
    d2 = site(tmp_path / "ok", {"index.html": "<p>hi</p>"})
    assert linkcheck.main([str(d2)]) == 0
