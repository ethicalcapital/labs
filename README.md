# Ethical Capital Labs

Static Cloudflare Pages project for Ethical Capital’s experimental tools.

## Project structure

- `public/index.html` – landing page for Labs
- `public/simulator/index.html` – portfolio strategy simulator
- `PortfolioSimulator.jsx` – extracted JSX source used for linting
automation

## Development

```bash
npm install
npm run lint
npm run build
```

`npm run build` copies everything from `public/` into `dist/`, matching the
Cloudflare Pages configuration (build command `npm run build`, output directory
`dist`).

## Deployment notes

Cloudflare Pages does not need a deploy command for this repository. Leave the
Deploy command field empty—Pages will take the contents of `dist/` produced by
the build step and publish them automatically.
