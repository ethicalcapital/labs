# Labs API Reference

Canonical documentation for Edge Functions and Workers that power Ethical Capital Labs.

## Signup Function

- **Endpoint**: Cloudflare Pages Function `/api/signup` (deployed with the Labs site)
- **Purpose**: Capture newsletter signups, store anonymized telemetry, and sync to Buttondown / LACRM
- **Request**: `POST` JSON `{ "email": "person@example.com", "consent": true, ... }`
- **Response**: `200 OK` with JSON confirmation
- **Secrets**: `BUTTONDOWN_API_KEY`, `LACRM_API_TOKEN`, `LACRM_USER_CODE`, optional `LACRM_PIPELINE_ID`, `LACRM_STEP_ID`
- **Storage**: Shared `hooks` KV namespace (prefixes `signup:*`)

See `functions/api/docs/README.md` for full payload fields.

## hook-content-sync

- **Endpoint**: `https://hooks.ethicic.com` (Bearer auth)
- **Purpose**: Copy built static assets (Labs/site/docs) into the `rawls` R2 bucket for AI indexing
- **Request**: JSON payload from `hooks/scripts/build-content-payload.mjs`
- **Response**: JSON summary (HTTP 200 or 207)
- **Bindings**: `RAWLS_BUCKET` (R2), shared `hooks` KV (if telemetry desired)

## hook-typst-export

- **Endpoint**: `https://hook-typst-export.<account>.workers.dev` (add custom domain as needed)
- **Purpose**: Convert Dryvestment Markdown into Ethical Capital–branded PDFs with disclaimer
- **Request**:
  ```json
  {
    "title": "Dryvestment Brief",
    "markdown": "# Overview\n...",
    "author": "Ethical Capital Labs",
    "metadata": { "Venue": "Committee hearing" }
  }
  ```
- **Response**: PDF (streams inline)
- **Implementation**: Uses `marked` for parsing and `pdf-lib` for layout/styling

## Contributing

1. Document new workers/functions here.
2. Use Doppler project `rawls`, config `dev` for secrets.
3. Bind the shared `hooks` KV namespace when storing telemetry/data.
4. Prefer helper `json()` responses with `cache-control: no-store` unless caching is required.
