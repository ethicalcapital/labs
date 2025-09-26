// ECIC Branded Typst Template
// Ethical Capital Investment Collaborative
// ===========================================

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

// Main Template Function
#let ecic-template(
  // Document metadata
  title: "Document Title",
  subtitle: none,
  doc-type: "Report",
  doc-number: none,
  date: datetime.today(),
  author: "Ethical Capital Investment Collaborative",
  department: none,
  classification: "Internal - Restricted",

  // Feature toggles
  show-logo: true,
  show-header: true,
  show-footer: true,
  show-page-numbers: true,
  show-toc: false,

  // Document content
  body
) = {
  // Document setup
  set document(
    title: title,
    author: author,
  )

  // Page setup with ECIC branding
  set page(
    paper: "us-letter",
    margin: (
      top: if show-header { 3cm } else { 2.5cm },
      bottom: if show-footer { 2.5cm } else { 2cm },
      left: 2.5cm,
      right: 2.5cm,
    ),
    header: if show-header {
      align(center)[
        #block(width: 100%, height: 0.5pt, fill: ecic-purple)
        #v(0.3em)
        #grid(
          columns: (1fr, 1fr, 1fr),
          align(left)[
            #if show-logo {
              // Note: Replace with image("path/to/ecic-logo.png") when you have the logo file
              text(font: "Outfit", weight: 700, size: 10pt, fill: ecic-purple)[*ETHICAL CAPITAL*]
            }
          ],
          align(center)[
            #text(size: 8pt, fill: text-medium)[#doc-type #if doc-number != none [• #doc-number]]
          ],
          align(right)[
            #text(size: 8pt, fill: text-medium)[#classification]
          ]
        )
      ]
    },
    footer: if show-footer {
      align(center)[
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
            #if show-page-numbers {
              text(size: 9pt, fill: text-medium)[
                Page #counter(page).display("1 of 1", both: true)
              ]
            }
          ],
          align(right)[
            #text(size: 8pt, fill: text-medium)[
              #date.display("[month repr:long] [day], [year]")
            ]
          ]
        )
      ]
    },
    header-ascent: 20%,
    footer-descent: 20%,
  )

  // Typography settings - Outfit for headings, body text in serif for readability
  set text(
    font: ("Raleway", "Segoe UI", "Arial"),
    size: 11pt,
    fill: text-dark,
    lang: "en",
  )

  // Heading styles with ECIC branding
  show heading.where(level: 1): it => {
    pagebreak(weak: true)
    block(width: 100%)[
      #v(0.5em)
      #text(font: "Outfit", size: 24pt, weight: 700, fill: ecic-purple)[
        #it.body
      ]
      #v(0.3em)
      #line(length: 30%, stroke: 2pt + ecic-teal)
      #v(1em)
    ]
  }

  show heading.where(level: 2): it => {
    block(width: 100%, above: 1.5em, below: 0.8em)[
      #text(font: "Outfit", size: 18pt, weight: 600, fill: ecic-purple)[
        #it.body
      ]
    ]
  }

  show heading.where(level: 3): it => {
    block(width: 100%, above: 1.2em, below: 0.6em)[
      #text(font: "Outfit", size: 14pt, weight: 600, fill: ecic-purple-light)[
        #it.body
      ]
    ]
  }

  show heading.where(level: 4): it => {
    block(width: 100%, above: 1em, below: 0.5em)[
      #text(font: "Outfit", size: 12pt, weight: 500, fill: text-dark, style: "italic")[
        #it.body
      ]
    ]
  }

  // Paragraph styling
  set par(
    justify: true,
    leading: 0.65em,
    spacing: 1em,
  )

  // List styling with brand colors
  set list(
    indent: 1em,
    marker: text(fill: ecic-teal)[•],
    spacing: 0.8em,
  )

  set enum(
    indent: 1em,
    spacing: 0.8em,
  )

  // Link styling
  show link: it => {
    text(fill: ecic-teal, weight: 500)[#underline(it)]
  }

  // Quote/callout styling
  show quote: it => {
    block(
      width: 100%,
      inset: 1em,
      stroke: (left: 3pt + ecic-purple),
      fill: surface-light,
    )[
      #text(style: "italic", size: 10.5pt)[#it]
    ]
  }

  // Table styling
  set table(
    stroke: 0.5pt + border-gray,
    inset: 8pt,
  )

  show table.cell.where(y: 0): it => {
    text(weight: 600, fill: white)[
      #block(fill: ecic-purple, inset: 8pt)[#it]
    ]
  }

  // Title Page
  align(center + horizon)[
    // Logo placeholder - replace with actual logo
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
        #text(font: "Outfit", size: 36pt, weight: 800, fill: white)[
          #title
        ]
        #if subtitle != none {
          v(0.5em)
          text(font: "Outfit", size: 20pt, weight: 400, fill: white)[
            #subtitle
          ]
        }
      ]
    ]

    #v(3em)

    #text(size: 14pt, fill: text-medium)[
      #author
    ]

    #if department != none {
      v(0.5em)
      text(size: 12pt, fill: text-medium)[#department]
    }

    #v(2em)

    #text(size: 11pt, fill: text-medium)[
      #date.display("[month repr:long] [day], [year]")
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
        #text(font: "Outfit", size: 12pt, weight: 500, fill: ecic-purple)[
          Concentrated ethical portfolios for investors who refuse to compromise
        ]
        #v(0.5em)
        #text(size: 10pt, fill: text-medium)[
          Growth • Income • Diversification
        ]
      ]
    ]
  ]

  pagebreak()

  // Table of Contents (if enabled)
  if show-toc {
    block(width: 100%)[
      #text(font: "Outfit", size: 20pt, weight: 700, fill: ecic-purple)[
        Table of Contents
      ]
      #v(0.5em)
      #line(length: 100%, stroke: 0.5pt + border-gray)
      #v(1em)
      #outline(
        indent: 1em,
        fill: text(fill: border-gray)[
          #repeat[.]
        ],
      )
    ]
    pagebreak()
  }

  // Main content
  body

  // End matter - Contact block
  pagebreak(weak: true)
  v(2em)
  align(center)[
    #line(length: 50%, stroke: 1pt + border-gray)
    #v(1em)
    #text(font: "Outfit", size: 10pt, fill: text-medium)[
      *Ethical Capital Investment Collaborative* \
      90 N 400 E, Provo, UT 84606 \
      hello\@ethicic.com • https://ethicic.com
    ]
  ]
}

// Custom Components
// ==================

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
      text(font: "Outfit", weight: 600, size: 11pt, fill: color)[
        #title
      ]
      v(0.5em)
    }
    #body
  ]
}

// Strategy Card Component
#let strategy-card(
  title: "",
  description: "",
  metrics: (),
) = {
  rect(
    width: 100%,
    radius: 8pt,
    fill: gradient.linear(
      ecic-purple,
      ecic-purple-light,
      angle: 135deg,
    ),
    inset: 1.5em,
  )[
    #text(font: "Outfit", size: 14pt, weight: 700, fill: white)[
      #title
    ]
    #v(0.5em)
    #text(size: 10pt, fill: white.darken(10%))[
      #description
    ]
    #if metrics.len() > 0 {
      v(0.8em)
      grid(
        columns: metrics.len(),
        gutter: 1em,
        ..metrics.map(m => [
          #text(size: 9pt, fill: ecic-teal-light, weight: 600)[
            #m
          ]
        ])
      )
    }
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