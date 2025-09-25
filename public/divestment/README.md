Dryvestment — Identity-First Brief Builder
=========================================

Tagline
-------

- Dryvestment: Where values and valuations meet — translating activist conviction into institutional language and recasting moral imperatives as material risk.

Overview
--------

- Dryvestment helps organizers build printable, role-aware briefs that frame divestment arguments through the lens of institutional mandates.
- Every experience is deterministic and client-side: no data collection, no personalization, just transparent assumptions you can share and inspect.

Workflow
--------

1. Open `/divestment/` (legacy `/public/divestment/` redirects).
2. Select the briefing context: venue, decision maker, investor identity, and knowledge level.
3. Tune the thumbprint sliders (mission, competition, regulatory) or pick a preset.
4. Add local names, objectives, and optional fields, then click `Build Brief`.
5. Export with `Copy Text`, `Download Brief`, or `Print` for a one-page PDF.

Brief Composition
-----------------

- **Opening & Framing:** Introduces the identity, thumbprint, and venue.
- **Key Points:** Evidence-backed talking points tuned to the chosen investor identity.
- **Counterarguments:** Flashcard-style claims paired with institutional responses.
- **Identity Guide:** Summarizes inputs, enablers, thumbprint, and the recommended approach.
- **Model Resolution & Next Steps:** Optional section surfaced when the objective requests it.
- **Sources & Further Reading:** Pulled from `content/bds_pack.json`, linked openly.

Identity Model
--------------

- Supports CFA-style identities: Individual, Sovereign Wealth Fund, Public Pension, Corporate Pension, Endowment, Foundation, Insurance General Account, Central Bank/Official Institution, and Government investor.
- Thumbprint sliders express mission emphasis (Purity ↔ Pragmatism), competitive pressure (Low/Medium/High), and regulatory constraints (Low/Medium/High).
- Presets provide fast setup; `Custom` re-enables individual sliders for manual control.

Content Architecture
--------------------

- `content/bds_pack.json` houses the narrative components (openers, guides, counters, resolutions, next steps, sources).
- `app.js` loads the content pack, applies deterministic selection logic, and assembles the brief.
- `divestment.css` layers Dryvestment-specific styling on top of shared Labs tokens in `public/assets/css/labs.css`.

Design Principles
-----------------

- Identity-first framing keeps the brief grounded in the recipient’s fiduciary context.
- Language balances conviction and compliance, recasting moral imperatives as material risk considerations.
- Visual hierarchy follows Ethical Capital’s shared Labs system for consistency between experiments.

Technical Notes
---------------

- Pure client-side implementation; calculations happen in-browser and can be audited.
- No analytics, tracking, or data persistence beyond optional user exports.
- Deterministic outputs mean a given input set always produces the same brief, simplifying review and versioning.

Extending Dryvestment
---------------------

- To add or revise talking points, update `content/bds_pack.json` and ensure new entries include citations.
- When introducing new UI patterns, extend `public/assets/css/labs.css` so future experiments inherit shared tokens.
- Keep documentation, PRD, and public landing content synchronized with updated language and disclaimers.

Disclaimer
----------

> Educational prototype only. Dryvestment illustrates hypothetical scenarios, makes simplifying assumptions, and does not provide investment advice. Encourage users to consult qualified professionals before acting.
