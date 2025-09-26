// ECIC Typst Template Integration
// Converts markdown investment briefs to Typst format using the ECIC template

interface BriefContent {
  title: string;
  markdown: string;
  author?: string;
  metadata?: Record<string, string>;
}

export function generateTypstDocument(content: BriefContent): string {
  const { title, markdown, author, metadata } = content;

  // Extract venue and decision maker from metadata
  const venue = metadata?.venue || "Investment Committee";
  const decisionMaker = metadata?.decision_maker || "Board of Trustees";
  const generatedAt = metadata?.generated_at || new Date().toISOString();

  // Convert markdown to Typst content
  const typstContent = convertMarkdownToTypst(markdown);

  return `#import "ecic-template.typ": *

// Document using ECIC template
#ecic-template(
  title: "${escapeTypst(title)}",
  subtitle: "Investment Brief",
  doc-type: "Strategic Analysis",
  doc-number: "IB-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}",
  author: "${escapeTypst(author || 'Ethical Capital Investment Collaborative')}",
  department: "Investment Strategy Division",
  classification: "Confidential",
  show-toc: false,
  show-logo: true,
)[

  // Executive Summary
  = Executive Summary

  This investment brief provides strategic analysis and recommendations for the ${escapeTypst(venue)}, prepared for review by the ${escapeTypst(decisionMaker)}.

  #ecic-highlight(title: "Strategic Context")[
    This analysis applies Ethical Capital's rigorous screening methodology to translate values-based investment criteria into institutional decision-making frameworks.
  ]

  // Main content from markdown
  ${typstContent}

  // Context section
  = Implementation Context

  #kv-display(
    ("Venue", "${escapeTypst(venue)}"),
    ("Decision Maker", "${escapeTypst(decisionMaker)}"),
    ("Generated", "${formatDate(generatedAt)}"),
    ("Framework", "ECIC Ethical Screening"),
    ("Classification", "Confidential Analysis")
  )

  // Compliance disclaimer
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

]`;
}

function convertMarkdownToTypst(markdown: string): string {
  let typst = markdown;

  // Convert headings (## -> ==, ### -> ===, etc.)
  typst = typst.replace(/^####\s+(.+)$/gm, '==== $1');
  typst = typst.replace(/^###\s+(.+)$/gm, '=== $1');
  typst = typst.replace(/^##\s+(.+)$/gm, '== $1');
  typst = typst.replace(/^#\s+(.+)$/gm, '= $1');

  // Convert bold text (**text** -> *text*)
  typst = typst.replace(/\*\*(.+?)\*\*/g, '*$1*');

  // Convert italic text (*text* -> _text_)
  typst = typst.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '_$1_');

  // Convert unordered lists
  typst = typst.replace(/^- (.+)$/gm, '- $1');

  // Convert ordered lists (1. -> 1.)
  typst = typst.replace(/^\d+\.\s+(.+)$/gm, '+ $1');

  // Convert links [text](url) -> #link("url")[text]
  typst = typst.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '#link("$2")[$1]');

  // Convert blockquotes (> text -> quote block)
  typst = typst.replace(/^>\s+(.+)$/gm, '#quote[$1]');

  // Convert code blocks (```lang -> #raw block)
  typst = typst.replace(/```(\w+)?\n([\s\S]*?)```/g, '#raw(block: true, lang: "$1")[\n$2\n]');

  // Convert inline code (`code` -> `code`)
  typst = typst.replace(/`([^`]+)`/g, '`$1`');

  // Handle special sections that should be highlighted
  typst = typst.replace(/^(Key Points?:|Executive Summary:|Recommendation:|Conclusion:)(.+)$/gmi,
    '#ecic-highlight(title: "$1")[$2]');

  return typst;
}

function escapeTypst(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/@/g, '\\@');
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// Generate example brief for testing
export function generateExampleBrief(): string {
  return generateTypstDocument({
    title: "Sustainable Technology Investment Analysis",
    author: "Portfolio Strategy Team",
    markdown: `## Investment Thesis

This analysis evaluates opportunities in sustainable technology companies that align with our ethical screening criteria while offering compelling risk-adjusted returns.

### Key Investment Themes

**Clean Energy Infrastructure**
- Solar and wind technology leaders
- Energy storage innovations
- Grid modernization solutions

**Sustainable Transportation**
- Electric vehicle manufacturers
- Battery technology developers
- Public transit infrastructure

### Risk Assessment

The sustainable technology sector presents several key considerations:

- Regulatory tailwinds supporting clean energy adoption
- Declining technology costs improving competitiveness
- Growing institutional demand for ESG-aligned investments

> "Companies solving humanity's greatest challenges while generating sustainable returns represent the future of institutional investing."

### Screening Results

Our ethical screening process identified the following considerations:

1. **Product Screening**: Focus on solutions addressing climate change
2. **Conduct Screening**: Strong governance and labor practices
3. **Values Alignment**: Mission-driven leadership teams

### Implementation Recommendations

- **Allocation Range**: 15-25% of growth-oriented portfolios
- **Risk Management**: Diversification across subsectors and stages
- **Monitoring Framework**: Quarterly ESG impact assessment

## Conclusion

Sustainable technology investments offer compelling opportunities to align capital with values while pursuing competitive returns in a rapidly evolving sector.`,
    metadata: {
      venue: "Investment Committee",
      decision_maker: "Board of Trustees",
      generated_at: new Date().toISOString()
    }
  });
}