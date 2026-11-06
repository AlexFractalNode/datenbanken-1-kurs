// Shared helpers. Documents read their data from "data.json" (written by pdf.py).
#import "@preview/cmarker:0.1.10"

#let body-font = ("Libertinus Serif", "New Computer Modern Math")
#let footer-text = "Inoffizieller Lernkurs – CC BY-SA 4.0"

#let setup(margin: 20mm, columns: 1, size: 10.5pt) = body => {
  set page(
    paper: "a4",
    margin: margin,
    footer: context [
      #set text(size: 8pt, fill: luma(90))
      #footer-text #h(1fr) #counter(page).display("1 / 1", both: true)
    ],
  )
  set text(font: body-font, size: size, lang: "de")
  set par(justify: false)
  show raw: set text(font: ("DejaVu Sans Mono", "New Computer Modern Math"), size: 0.9em)
  show raw.where(block: true): it => block(
    fill: luma(245), inset: 6pt, radius: 2pt, width: 100%, it,
  )
  show table: set text(size: 0.95em)
  set table(stroke: 0.5pt + luma(120), inset: 4pt)
  body
}

// Render a Markdown string.
#let md(s) = cmarker.render(s, scope: (image: (source, alt: none, format: auto) => block(breakable: false, image(source, alt: alt, width: 80%, format: format))), raw-typst: false)

// Write space below a task: "lines:N" -> N ruled lines of 8 mm, "box:H" -> framed box of H mm.
#let write-space(spec) = {
  if spec == none or spec == "" { return }
  let parts = spec.split(":")
  let kind = parts.at(0)
  let n = float(parts.at(1))
  if kind == "lines" {
    let count = int(n)
    v(2mm)
    for _ in range(count) {
      block(height: 8mm, width: 100%, stroke: (bottom: 0.4pt + luma(150)))[]
    }
  } else if kind == "box" {
    v(2mm)
    rect(width: 100%, height: n * 1mm, stroke: 0.6pt + luma(60))[]
  }
}

// Sticky: the heading stays together with the content that follows.
#let task-head(t, no) = block(sticky: true, width: 100%)[
  #text(weight: "bold")[Aufgabe #no] #h(1fr) #text(weight: "bold")[#t.points Punkte]
  #v(-2pt)
  #line(length: 100%, stroke: 0.5pt)
]
