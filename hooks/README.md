# Ethical Capital Hooks

Serverless workers and automation scripts that support the Labs properties. Each worker lives under
`hooks/packages/<name>` and can be deployed independently with Wrangler.

## Available Workers

### hook-content-sync
- **Purpose**: Mirror built static assets (Labs, site, docs) into the `rawls` R2 bucket so downstream AI
  indexing stays current.
- **Endpoint**: `https://hooks.ethicic.com` (bearer token required).
- **Calling pattern**: POST JSON payload produced by `hooks/scripts/build-content-payload.mjs` right after
  your build step (see `.github/workflows/deploy.yml` for an example). The worker copies the files into
  `project/<key>` paths in R2.

### hook-typst-export
- **Purpose**: Convert Dryvestment (or other Labs) Markdown briefs into Ethical-Capital–branded PDFs that
  always include the company disclaimer.
- **Endpoint**: deploy with `wrangler deploy` to get an URL such as
  `https://hook-typst-export.<account>.workers.dev` (add a custom domain if desired).
- **Request**:
  ```http
  POST / HTTP/1.1
  Content-Type: application/json

  {
    "title": "Dryvestment Brief",
    "markdown": "# Overview\n...",
    "author": "Ethical Capital Labs",
    "metadata": {
      "Venue": "Committee hearing",
      "Decision maker": "Trustees"
    }
  }
  ```
- **Response**: `200 OK` with `Content-Type: application/pdf` and the PDF body inline. The layout is
  letter-sized, uses the Labs palette, and appends the standard disclaimer.
- **Local test**:
  ```bash
  cd hooks
  npm install
  npm run dev --workspace @ethicalcapital/hook-typst-export

  curl -X POST \
    -H "Content-Type: application/json" \
    --data '{"title":"Example","markdown":"# Hello\nThis is a test."}' \
    http://127.0.0.1:8787 > example.pdf
  ```

## Utility Scripts

- `hooks/scripts/build-content-payload.mjs`: Walks a directory (default `dist/`), base64-encodes each file,
  and emits the JSON contract expected by `hook-content-sync`. Used by CI before deploying Pages.

## Environment Defaults

- Secrets are managed in Doppler (`rawls` project, `dev` config). CI uses `doppler run` so that workers share
  the same credentials locally and in production.
- All workers bind the shared `hooks` KV namespace for logging or telemetry (see `wrangler.toml` in the
  root of the repo).

Deploy any worker with:
```bash
cd hooks/packages/<worker>
doppler run --project rawls --config dev -- npx wrangler deploy
```
