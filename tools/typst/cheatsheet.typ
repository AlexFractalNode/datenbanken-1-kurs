// Cheatsheet skeleton: A4, exactly two pages. Page 1 topics, page 2 terms and notes.
#import "common.typ": *
#let data = json("data.json")
#show: setup(margin: 12mm, size: 8.5pt)

#text(size: 15pt, weight: "bold")[Cheatsheet Datenbanken 1]
#v(2mm)
#columns(2, gutter: 8mm)[
  #for t in data.topics [
    #text(weight: "bold", size: 10pt)[#t.id #t.title]
    #if t.subtopics.len() > 0 [
      #list(..t.subtopics.map(s => [#s]))
    ]
    #v(3mm)
  ]
]

#pagebreak()

#text(size: 12pt, weight: "bold")[Begriffe]
#v(2mm)
#columns(2, gutter: 8mm)[
  #for g in data.glossary [
    *#g.term*: #g.definition \
  ]
]
#v(1fr)
#rect(width: 100%, height: 60mm, stroke: 0.5pt + luma(120))[
  #align(top + left)[#pad(4pt)[#text(size: 8pt, fill: luma(120))[Eigene Notizen]]]
]
