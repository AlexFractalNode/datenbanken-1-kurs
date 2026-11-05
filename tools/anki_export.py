"""Export the cards as Anki decks (``.apkg``).

Usage: anki_export.py [--out dist/anki] [--root .] [--lang de] [--per-topic]

* ``db1-<lang>.apkg``: one deck per topic, named ``DB1::tNN <Title>``.
* ``--per-topic``: additionally ``db1-<lang>-tNN.apkg`` with just that topic.
* Note type with fields Front / Back / Quelle; the note GUID is
  ``genanki.guid_for(card id)`` so re-imports update instead of duplicating.
* Markdown is converted to HTML with the ``markdown`` package. A card's
  ``diagram`` value (a simple name) is looked up as ``<--diagrams>/<tNN>/<name>.svg``
  (default ``dist/diagrams``), then ``<topic dir>/diagrams/<name>.svg``, and shipped
  as media ``<tNN>-<name>.svg``; a missing file is a warning and skipped.
* Raw HTML in the Markdown is escaped.
"""

from __future__ import annotations

import argparse
import html
import re
import shutil
import sys
import tempfile
from pathlib import Path

import genanki
import markdown
from content import Content, load_all

# Fixed IDs (never change: Anki identifies the note type and decks by them).
MODEL_ID = 1607392319
DECK_ID_BASE = 1607392400  # + topic number (1..13)

MODEL = genanki.Model(
    MODEL_ID,
    "DB1 Front/Back/Quelle",
    fields=[{"name": "Front"}, {"name": "Back"}, {"name": "Quelle"}],
    templates=[
        {
            "name": "Karte 1",
            "qfmt": "{{Front}}",
            "afmt": '{{FrontSide}}<hr id="answer">{{Back}}<div class="src">{{Quelle}}</div>',
        }
    ],
    css=(
        ".card { font-family: sans-serif; font-size: 18px; text-align: left; }"
        " .src { margin-top: 1em; font-size: 12px; color: #666; }"
        " pre, code { font-family: monospace; }"
        " table { border-collapse: collapse; } td, th { border: 1px solid #999; padding: 2px 6px; }"
        " img { max-width: 100%; }"
    ),
)

_MD_EXT = ["extra", "sane_lists"]
DIAGRAM_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)*$")


def md_to_html(text: str) -> str:
    """Markdown -> HTML; raw HTML in the source is escaped, not passed through."""
    md = markdown.Markdown(extensions=_MD_EXT)
    md.preprocessors.deregister("html_block")
    md.inlinePatterns.deregister("html")
    return md.convert(text)


def deck_id(tid: str) -> int:
    return DECK_ID_BASE + int(tid[1:])


def _topic_title(c: Content, tid: str) -> str:
    return next((t["title"] for t in c.topics if t["id"] == tid), tid)


def _source_text(c: Content, card: dict) -> str:
    titles = {s["id"]: s.get("title", s["id"]) for s in c.sources}
    parts = []
    for s in card.get("sources", []) or []:
        parts.append(html.escape(f'{titles.get(s["id"], s["id"])}, {s["ref"]}'))
    return "; ".join(parts)


def _find_svg(c: Content, tid: str, name: str, diagrams: Path | None) -> Path | None:
    candidates = []
    if diagrams is not None:
        candidates.append(diagrams / tid / f"{name}.svg")
    if tid in c.topic_dirs:
        candidates.append(c.topic_dirs[tid] / "diagrams" / f"{name}.svg")
    return next((p for p in candidates if p.is_file()), None)


def build_deck(
    c: Content, tid: str, media: list[str], stage: Path, diagrams: Path | None = None
) -> genanki.Deck:
    deck = genanki.Deck(deck_id(tid), f"DB1::{tid} {_topic_title(c, tid)}")
    for card in c.cards.get(tid, []):
        back = md_to_html(card["back"])
        name = card.get("diagram")
        if name is not None:
            if not isinstance(name, str) or not DIAGRAM_NAME_RE.match(name):
                raise ValueError(f"{card['id']}: diagram must be a simple name, got {name!r}")
            svg = _find_svg(c, tid, name, diagrams)
            if svg is None:
                print(f"warning: {card['id']}: diagram {name}.svg not found", file=sys.stderr)
            else:
                target = stage / f"{tid}-{name}.svg"
                if not target.exists():
                    shutil.copyfile(svg, target)
                if str(target) not in media:
                    media.append(str(target))
                back += f'<img src="{target.name}">'
        note = genanki.Note(
            model=MODEL,
            fields=[md_to_html(card["front"]), back, _source_text(c, card)],
            guid=genanki.guid_for(card["id"]),
            tags=[str(t).replace(" ", "_") for t in card.get("tags", []) or []],
        )
        deck.add_note(note)
    return deck


def export(
    c: Content, out: Path, per_topic: bool = False, diagrams: Path | None = None
) -> list[Path]:
    out.mkdir(parents=True, exist_ok=True)
    tids = sorted(t for t in c.cards if c.cards[t])
    written = []
    with tempfile.TemporaryDirectory() as tmp:
        stage = Path(tmp)
        decks, media_by_topic = {}, {}
        for tid in tids:
            media_by_topic[tid] = []
            decks[tid] = build_deck(c, tid, media_by_topic[tid], stage, diagrams)

        def write(name: str, selected: list[str]) -> None:
            media = [m for t in selected for m in media_by_topic[t]]
            pkg = genanki.Package([decks[t] for t in selected], media_files=media)
            path = out / name
            pkg.write_to_file(str(path))
            written.append(path)

        write(f"db1-{c.lang}.apkg", tids)
        if per_topic:
            for tid in tids:
                write(f"db1-{c.lang}-{tid}.apkg", [tid])
    return written


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default="dist/anki")
    ap.add_argument("--root", default=".")
    ap.add_argument("--lang", default="de")
    ap.add_argument("--per-topic", action="store_true")
    ap.add_argument("--diagrams", default="dist/diagrams", help="rendered SVGs: <dir>/<tNN>/<name>.svg")
    args = ap.parse_args(argv)
    c = load_all(Path(args.root), args.lang)
    if c.errors:
        for e in c.errors:
            print(f"error: {e}", file=sys.stderr)
        return 1
    try:
        export(c, Path(args.out), args.per_topic, Path(args.diagrams))
    except (OSError, KeyError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
