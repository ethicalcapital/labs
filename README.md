# Ethical Capital Labs

Experiments for values-aligned finance education, published as static web applications on Cloudflare Pages.
Each tool stays transparent about its assumptions and is clearly labeled as educational rather than
advisory.

## Active experiments

- **Dryvestment** (`/divestment/`): *Dryvestment: Where values and valuations meet.* Builds printable, identity-first briefs that translate activist conviction into institutional language and recast moral imperatives as material risk.
- **Portfolio Time Travel** (`/simulator/`): Monte Carlo withdrawal simulator with accumulation/decumulation phases, tax-aware toggles, and deterministic scenario presets for reproducible exploration. Shoutout to [druce/swr](https://github.com/druce/swr) for inspiring the safe-withdrawal-rate framing.

## Repository layout

- `public/` – static assets for Cloudflare Pages (landing page, experiments, shared CSS/JS)
- `public/divestment/` – Dryvestment UI, content pack, and docs
- `public/simulator/` – portfolio simulator UI and compiled script
- `PortfolioSimulator.jsx` – source for the simulator; transpiled during build
- `functions/` / `hooks/` / `public/assets/js/` – Cloudflare Pages Functions, KV helpers, and shared browser scripts

## Development workflow

```bash
npm install
npm run lint
npm run build
```

- `npm run lint` runs ESLint/Prettier on the simulator source.
- `npm run build` transpiles `PortfolioSimulator.jsx` to `public/simulator/app.js` and copies `public/` into `dist/` for Cloudflare Pages.

Serve `public/` locally with any static server (`npx serve public`) to preview experiments; no backend is required.

## Deployment

Cloudflare Pages expects the build command `npm run build` and publishes the contents of `dist/`. Leave the deploy command empty. `wrangler.toml` exists solely to set `pages_build_output_dir` and declare KV bindings.

## Shared design system

- **Tailwind + DaisyUI**: Tailwind loads a custom `labs` DaisyUI theme. Set `data-theme="labs"` on each experiment’s `<html>` tag. Use DaisyUI primitives (`btn`, `input input-bordered`, `select select-bordered`, etc.) and extend tokens in `public/assets/css/labs.css` when introducing new patterns.
- **Labs CSS tokens**: Colors, spacing, and typography live in `public/assets/css/labs.css`. Avoid ad-hoc styling; expand the token file so future experiments inherit consistent vocabulary.
- **Email signup widget**: Drop a container with `data-email-signup` and include `/assets/js/email-signup.js`. Configure via `data-signup-*` attributes (list, tags, source, success/error messages). Examples live on `public/index.html`.

## Telemetry & storage

- **Buttondown + LACRM signup logging**: `functions/api/signup.ts` hashes captured emails and writes telemetry to the `hooks` KV namespace. Bind `hooks` in Cloudflare Pages → Functions → KV namespaces. The function will:
  - Call Buttondown’s subscriber API when `BUTTONDOWN_API_KEY` is present.
  - Upsert the contact in LACRM when `LACRM_API_TOKEN` and `LACRM_USER_CODE` are provided (optional `LACRM_PIPELINE_ID` / `LACRM_STEP_ID` attach pipeline stages).
  - Persist anonymized metrics to KV regardless of downstream availability.
  Configure secrets through Doppler-sourced GitHub Actions so deployments stay reproducible.

## Contributing

1. Keep content deterministic and document any new data capture. Do not introduce server dependencies or
   analytics without compliance review.
2. Update accompanying docs (`public/divestment/README.md`, `public/divestment/PRD.md`, etc.) when experiments change copy or behavior.
3. Match Ethical Capital’s disclaimers and navigation so Labs feels seamless with the main site.
4. Open a GitHub discussion for new experiment proposals or substantial architectural changes.
