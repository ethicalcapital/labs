Divestment Brief Builder — Identity‑First

Purpose
- Build a concise, printable brief that translates activist goals to decision‑makers using an investor identity model. Client‑side only, educational.

Use
- Open this folder as /public/divestment in your site.
- Choose Audience, Target decision maker, Investor Identity, Thumbprint, Local Name, and Objective.
- Click “Build Brief” → “Print / Save PDF” or “Copy All”.
- Use the AFSC Investigate lookup for company research.

Structure
- index.html: UI + print styles.
- app.js: logic to compose the brief from identity + thumbprint.
- content/bds_pack.json: openers, identity guides, key points, counters, model resolution, next steps, sources/further reading.

Identity & Thumbprint
- Identities (CFA Institute): SWF, Public pension, Corporate pension, Endowment, Foundation, Insurance GA, Central bank/official, Government (bond portfolios).
- Thumbprint: Mission/Ethics (Purity vs Pragmatism), Competition pressure, Regulatory constraints.
- Mapping: Purity → product (absolute) screens; Pragmatism → conduct/norms screens.

Notes
- Educational only; not investment advice. No data collection.
- Deterministic selection of points to keep outputs stable.

