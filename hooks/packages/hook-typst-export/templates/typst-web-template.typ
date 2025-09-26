// ECIC Branded Typst Template - Ready for Typst Web
// Copy-paste this entire file into https://typst.app/

// Brand Color Definitions
#let ecic-purple = rgb("#581c87")
#let ecic-purple-light = rgb("#6b46c1")
#let ecic-teal = rgb("#14b8a6")
#let ecic-teal-light = rgb("#2dd4bf")
#let ecic-amber = rgb("#f59e0b")
#let ecic-red = rgb("#ef4444")
#let text-dark = rgb("#111827")
#let text-medium = rgb("#4b5563")
#let surface-light = rgb("#f9fafb")
#let border-gray = rgb("#e5e7eb")

// Custom Components
// Highlight Box Component
#let ecic-highlight(
  title: none,
  color: ecic-teal,
  body
) = {
  rect(
    width: 100%,
    radius: 6pt,
    stroke: 1pt + color,
    fill: color.lighten(95%),
    inset: 1em,
  )[
    #if title != none {
      text(font: "Libre Franklin", weight: 600, size: 11pt, fill: color)[
        #title
      ]
      v(0.5em)
    }
    #body
  ]
}

// Key-Value Display Component
#let kv-display(..items) = {
  let kvs = items.pos()
  grid(
    columns: (auto, 1fr),
    row-gutter: 0.5em,
    column-gutter: 1em,
    ..kvs.map(item => (
      text(weight: 600, fill: ecic-purple)[#item.at(0):],
      text(fill: text-dark)[#item.at(1)]
    )).flatten()
  )
}

// Warning/Alert Box
#let ecic-alert(
  type: "info",
  body
) = {
  let color = if type == "warning" { ecic-amber }
    else if type == "error" { ecic-red }
    else if type == "success" { ecic-teal-light }
    else { ecic-teal }

  let icon = if type == "warning" { "⚠" }
    else if type == "error" { "✕" }
    else if type == "success" { "✓" }
    else { "ℹ" }

  rect(
    width: 100%,
    radius: 4pt,
    stroke: 1pt + color,
    fill: color.lighten(90%),
    inset: 1em,
  )[
    #grid(
      columns: (auto, 1fr),
      column-gutter: 1em,
      text(size: 16pt, fill: color)[#icon],
      body
    )
  ]
}

// ECIC Template Function (simplified for web)
#set document(
  title: "Investment Brief",
  author: "Ethical Capital Investment Collaborative",
)

// Page setup with ECIC branding
#set page(
  paper: "us-letter",
  margin: (
    top: 3cm,
    bottom: 2.5cm,
    left: 2.5cm,
    right: 2.5cm,
  ),
  header: [
    #block(width: 100%, height: 0.5pt, fill: ecic-purple)
    #v(0.3em)
    #grid(
      columns: (1fr, 1fr, 1fr),
      align(left)[
        #text(font: "Libre Franklin", weight: 700, size: 10pt, fill: ecic-purple)[*ETHICAL CAPITAL*]
      ],
      align(center)[
        #text(size: 8pt, fill: text-medium)[Strategic Analysis • IB-2025-0001]
      ],
      align(right)[
        #text(size: 8pt, fill: text-medium)[Confidential]
      ]
    )
  ],
  footer: [
    #line(length: 100%, stroke: 0.5pt + border-gray)
    #v(0.5em)
    #grid(
      columns: (1fr, 1fr, 1fr),
      align(left)[
        #text(size: 8pt, fill: text-medium)[
          Invest Vegan LLC DBA Ethical Capital
        ]
      ],
      align(center)[
        #text(size: 9pt, fill: text-medium)[
          Page #counter(page).display("1 of 1", both: true)
        ]
      ],
      align(right)[
        #text(size: 8pt, fill: text-medium)[
          #datetime.today().display("[month repr:long] [day], [year]")
        ]
      ]
    )
  ],
)

// Typography settings
#set text(
  font: ("Libre Franklin", "Arial", "Helvetica"),
  size: 11pt,
  fill: text-dark,
  lang: "en",
)

// Heading styles with ECIC branding
#show heading.where(level: 1): it => {
  pagebreak(weak: true)
  block(width: 100%)[
    #v(0.5em)
    #text(font: "Libre Franklin", size: 24pt, weight: 700, fill: ecic-purple)[
      #it.body
    ]
    #v(0.3em)
    #line(length: 30%, stroke: 2pt + ecic-teal)
    #v(1em)
  ]
}

#show heading.where(level: 2): it => {
  block(width: 100%, above: 1.5em, below: 0.8em)[
    #text(font: "Libre Franklin", size: 18pt, weight: 600, fill: ecic-purple)[
      #it.body
    ]
  ]
}

#show heading.where(level: 3): it => {
  block(width: 100%, above: 1.2em, below: 0.6em)[
    #text(font: "Libre Franklin", size: 14pt, weight: 600, fill: ecic-purple-light)[
      #it.body
    ]
  ]
}

// Paragraph styling
#set par(
  justify: true,
  leading: 0.65em,
  spacing: 1em,
)

// List styling with brand colors
#set list(
  indent: 1em,
  marker: text(fill: ecic-teal)[•],
  spacing: 0.8em,
)

// Quote/callout styling
#show quote: it => {
  block(
    width: 100%,
    inset: 1em,
    stroke: (left: 3pt + ecic-purple),
    fill: surface-light,
  )[
    #text(style: "italic", size: 10.5pt)[#it]
  ]
}

// DOCUMENT CONTENT STARTS HERE
// ==============================

// Title Page
#align(center + horizon)[
  #v(2em)
  #rect(
    width: 100%,
    fill: gradient.linear(
      ecic-teal,
      ecic-purple,
      angle: 135deg,
    ),
    radius: 8pt,
    inset: 0pt,
  )[
    #pad(y: 3em, x: 2em)[
      #text(font: "Libre Franklin", size: 36pt, weight: 800, fill: white)[
        Sustainable Technology Investment Analysis
      ]
      #v(0.5em)
      #text(font: "Libre Franklin", size: 20pt, weight: 400, fill: white)[
        Investment Brief
      ]
    ]
  ]

  #v(3em)

  #text(size: 14pt, fill: text-medium)[
    Portfolio Strategy Team
  ]

  #v(0.5em)
  #text(size: 12pt, fill: text-medium)[Investment Strategy Division]

  #v(2em)

  #text(size: 11pt, fill: text-medium)[
    #datetime.today().display("[month repr:long] [day], [year]")
  ]

  #v(4em)

  // Brand tagline
  #block(width: 80%)[
    #rect(
      width: 100%,
      fill: surface-light,
      radius: 6pt,
      inset: 1.5em,
      stroke: 1pt + border-gray,
    )[
      #text(font: "Libre Franklin", size: 12pt, weight: 500, fill: ecic-purple)[
        Concentrated ethical portfolios for investors who refuse to compromise
      ]
      #v(0.5em)
      #text(size: 10pt, fill: text-medium)[
        Growth • Income • Diversification
      ]
    ]
  ]
]

#pagebreak()

// Main Content
= Executive Summary

This investment brief provides strategic analysis and recommendations for the Investment Committee, prepared for review by the Board of Trustees.

#ecic-highlight(title: "Strategic Context")[
  This analysis applies Ethical Capital's rigorous screening methodology to translate values-based investment criteria into institutional decision-making frameworks.
]

= Investment Thesis

This analysis evaluates opportunities in sustainable technology companies that align with our ethical screening criteria while offering compelling risk-adjusted returns.

== Key Investment Themes

*Clean Energy Infrastructure*
- Solar and wind technology leaders
- Energy storage innovations
- Grid modernization solutions

*Sustainable Transportation*
- Electric vehicle manufacturers
- Battery technology developers
- Public transit infrastructure

== Risk Assessment

The sustainable technology sector presents several key considerations:

- Regulatory tailwinds supporting clean energy adoption
- Declining technology costs improving competitiveness
- Growing institutional demand for ESG-aligned investments

#quote[Companies solving humanity's greatest challenges while generating sustainable returns represent the future of institutional investing.]

== Screening Results

Our ethical screening process identified the following considerations:

+ *Product Screening*: Focus on solutions addressing climate change
+ *Conduct Screening*: Strong governance and labor practices
+ *Values Alignment*: Mission-driven leadership teams

== Implementation Recommendations

- *Allocation Range*: 15-25% of growth-oriented portfolios
- *Risk Management*: Diversification across subsectors and stages
- *Monitoring Framework*: Quarterly ESG impact assessment

= Implementation Context

#kv-display(
  ("Venue", "Investment Committee"),
  ("Decision Maker", "Board of Trustees"),
  ("Generated", datetime.today().display("[month repr:long] [day], [year]")),
  ("Framework", "ECIC Ethical Screening"),
  ("Classification", "Confidential Analysis")
)

= Conclusion

Sustainable technology investments offer compelling opportunities to align capital with values while pursuing competitive returns in a rapidly evolving sector.

#ecic-alert(type: "warning")[
  *Educational Use Only:* This brief illustrates hypothetical scenarios and institutional framing but does not constitute individualized investment advice, performance guarantees, or recommendations to buy or sell securities. Consult qualified professionals before acting on any analysis contained herein.
]

= Methodology Notes

This analysis employs Ethical Capital's proprietary screening framework that combines:

- Product-based exclusions for categorical harms
- Conduct-based screening for risk mitigation
- Values alignment with institutional mission
- Material ESG factor integration

The brief format is designed to translate activist conviction into institutional language while maintaining transparency about underlying ethical commitments.

#pagebreak(weak: true)
#v(2em)
#align(center)[
  #line(length: 50%, stroke: 1pt + border-gray)
  #v(1em)
  #text(font: "Libre Franklin", size: 10pt, fill: text-medium)[
    *Ethical Capital Investment Collaborative* \
    90 N 400 E, Provo, UT 84606 \
    hello\@ethicic.com • https://ethicic.com
  ]
]