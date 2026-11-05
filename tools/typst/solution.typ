#import "common.typ": *
#let data = json("data.json")
#show: setup()

#align(center)[
  #text(size: 20pt, weight: "bold")[#data.title – Lösung]
  #v(2mm)
  #text(size: 11pt)[Insgesamt #data.total Punkte]
]
#v(6mm)

#for (i, t) in data.tasks.enumerate() {
  block(breakable: false)[
    #task-head(t, i + 1)
    #text(weight: "bold")[Lösung]
    #md(t.solution)
    #v(2mm)
    #table(
      columns: (1fr, auto),
      align: (left, right),
      table.header([*Bewertungsraster*], [*Punkte*]),
      ..t.rubric.map(r => ([#md(r.criterion)], [#r.points])).flatten(),
      [*Summe*], [*#t.points*],
    )
  ]
  v(6mm)
}
