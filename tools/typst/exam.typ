#import "common.typ": *
#let data = json("data.json")
#show: setup()

#align(center)[
  #v(25mm)
  #text(size: 22pt, weight: "bold")[#data.title]
  #v(4mm)
  #text(size: 13pt)[Bearbeitungszeit: #data.minutes Minuten]
  #v(10mm)
]

#block(width: 100%, stroke: 0.6pt, inset: 8pt)[
  *Hilfsmittel (angenommene Bedingungen, ohne Gewähr):* ein einseitig handbeschriebener Zettel 10 × 10 cm.
]

#v(6mm)
*Hinweis:* 1 Punkt ≈ 1 Minute. Insgesamt sind #data.total Punkte erreichbar.

#v(6mm)
#table(
  columns: (auto, 1fr, auto, auto),
  align: (left, left, right, right),
  table.header([*Aufgabe*], [*Thema*], [*Punkte*], [*erreicht*]),
  ..data.tasks.enumerate().map(((i, t)) => ([#(i + 1)], [#t.topic], [#t.points], [])).flatten(),
  [], [*Summe*], [*#data.total*], [],
)

#pagebreak()

#for (i, t) in data.tasks.enumerate() {
  block(breakable: true)[
    #task-head(t, i + 1)
    #md(t.prompt)
    #write-space(t.space)
  ]
  v(6mm)
}
