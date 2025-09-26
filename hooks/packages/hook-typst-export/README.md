# hook-typst-export

Cloudflare Worker that accepts Markdown payloads from Dryvestment (or other Labs tools), applies Ethical
Capital branding, and returns a PDF with the company disclaimer.

## API

`POST /` with JSON:

```json
{
  "title": "Dryvestment Brief",
  "markdown": "# Heading\nContent...",
  "author": "Ethical Capital Labs",
  "metadata": {
    "Venue": "Committee hearing"
  }
}
```

- Response body is the binary PDF with `Content-Type: application/pdf`.
- `GET /` returns a JSON health payload.

## Implementation Notes

- Markdown is parsed with `marked` and rendered into a PDF using `pdf-lib` (Helvetica, brand colors, and
  the Labs disclaimer at the end).
- The layout fits US Letter (8.5" × 11"), reflowing text automatically and adding pages when needed.
- Extend the `sanitizeFilename`, `tokenizeMarkdown`, or typographic settings in `src/index.ts` to adjust
  styling or add sections.

## Local testing

```bash
cd hooks
npm install
npm run dev --workspace @ethicalcapital/hook-typst-export
```

Then:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"title":"Example","markdown":"# Hello\nExample body"}' \
  http://127.0.0.1:8787 > example.pdf
```

## Environment

The worker only needs the default `SERVICE_NAME` variable; no external bindings are required.
