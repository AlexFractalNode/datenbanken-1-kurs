// Worksheet (tasks only) or solution sheet for one topic.
#import "common.typ": *
#let data = json("data.json")
#show: setup()

#text(size: 18pt, weight: "bold")[#data.title]

#for (i, t) in data.tasks.enumerate() {
  block(breakable: false)[
    #task-head(t, i + 1)
    #md(t.prompt)
    #if data.solutions {
      text(weight: "bold")[Lösung]
      md(t.solution)
    } else {
      write-space(t.space)
    }
  ]
  v(6mm)
}
