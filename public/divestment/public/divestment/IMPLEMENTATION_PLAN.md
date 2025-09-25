Implementation Plan

1) Scaffold UI (index.html)
- Inputs: Audience, Target, Investor Identity, Thumbprint (Mission/Ethics; Competition; Regulatory), Local Name, Objective.
- Outputs: Brief area (Opening, Points, Counters, Identity Guide + Recommended Approach, Resolution, Next Steps) and Sources.
- Print and Copy actions; keyboard shortcuts (B build, P print).

2) Compose logic (app.js)
- Load content JSON.
- Deterministically select 6 key points, 4 counters.
- Opening composed by Identity + Audience (fallback to generic).
- Build Identity Guide (Inputs/Enablers/Thumbprint); derive Recommended Approach from identity guide + thumbprint (Purity vs Pragmatism; competition/regulatory modifiers).
- Insert CIO/Consultant callout when target matches.
- Include Model Resolution when objective = resolution_support.
- Render Sources + Further Reading.

3) Content pack (content/bds_pack.json)
- identity_openers and identity_guides for 8 identities (incl. Government bond investors).
- key_points, counters, model_resolution, next_steps, sources, further_reading.

4) Validation
- Open in browser; generate briefs for several identities; verify print to PDF is clean.
- Check links and AFSC lookup behavior.

5) Future tasks
- Add static exclusions.json from AFSC sync (offline) for local lookup.
- Add appendix hooks for backtests when ready.

