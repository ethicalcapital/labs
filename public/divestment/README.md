Divestment Brief Builder — Identity‑First

Purpose
- Build a concise, printable brief that translates activist goals to decision‑makers using an investor identity model — with language tuned for constructive, role‑aware dialogue. Client‑side only, educational.

Use
- Folder is served at /divestment/ on the site (legacy /public/divestment/ redirects).
- Choose Venue, Target decision maker, Investor Identity, Knowledge Level, Thumbprint, Local Name, and Objective.
- Click “Build Brief” → “Download Markdown” (Plain or Nerd) or “Copy All”.

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
