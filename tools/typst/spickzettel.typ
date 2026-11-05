// Template for the hand-written aid sheet: a 100 mm x 100 mm frame on A4 with cut lines.
#import "common.typ": *
#let box-size = 100mm
#show: setup()

#align(center)[
  #text(size: 14pt, weight: "bold")[Spickzettel-Vorlage]
  #v(1mm)
  #text(size: 9pt)[Ausschneiden entlang der gestrichelten Linie. Format 10 × 10 cm, einseitig handbeschrieben.]
]
#v(8mm)
#align(center)[
  #rect(
    width: box-size, height: box-size,
    stroke: (paint: black, thickness: 0.8pt, dash: "dashed"),
  )[
    #align(top + left)[#text(size: 7pt, fill: luma(150))[ Schnitt ]]
  ]
]
