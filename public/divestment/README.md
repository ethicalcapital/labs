Dryvestment — Identity‑First Brief Builder

Tagline

- Dryvestment: Where values and valuations meet — translating activist conviction into institutional language and recasting moral imperatives as material risk.

Purpose

- Dryvestment builds a concise, printable brief that translates activist goals to decision‑makers using an investor identity model — with language tuned for constructive, role‑aware dialogue. Client‑side only, educational.

Use

- Folder is served at /divestment/ on the site (legacy /public/divestment/ redirects).
- Choose Venue, Target decision maker, Investor Identity, Knowledge Level, Thumbprint, Local Name, and Objective.
- Click “Build Brief” → “Download Brief”, “Copy Text”, or “Print”.

Structure

- index.html: UI + print styles.
- app.js: logic to compose the brief from identity + thumbprint.
- content/bds_pack.json: openers, identity guides, key points, counters, model resolution, next steps, sources/further reading.

Identity & Thumbprint

- Identities supported: Individual, Sovereign wealth fund, Public pension plan, Corporate pension plan, Endowment, Foundation, Insurance general account, Central bank/official institution, Government investor.
- Presets capture typical “what matters to them?” profiles; choose Custom to fine-tune mission emphasis, competitive pressure, and regulatory constraints.
- Mission slider treats left as Purity (values-first) and right as Pragmatism (conduct-first).

Notes

- Educational only; not investment advice. No data collection.
- Deterministic selection of points to keep outputs stable.
