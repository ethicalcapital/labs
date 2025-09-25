# Agents Overview

... existing content ...

## Cloudflare Workers & Pages Runtime

### Bindings
- `hooks` KV: namespace configured in `wrangler.toml` (see Cloudflare dashboard for IDs). Accessible inside functions as `env.hooks`.

### Secrets & Doppler
- Secrets live in Doppler; GitHub Action runs `doppler secrets download … | wrangler secret bulk` before deploy.
- Required keys for signup function:
  - `BUTTONDOWN_API_KEY`
  - `LACRM_API_TOKEN`
  - `LACRM_USER_CODE`
  - Optional `LACRM_PIPELINE_ID`, `LACRM_STEP_ID`

### Deployment Workflow
- `.github/workflows/deploy.yml` handles build + wrangler deploy on push to `main`.
- Use `npx wrangler pages deploy dist --commit-dirty=true --project-name labs` for manual deploys.

### Cloudflare API token scopes
When generating the CI token (account-owned): grant only the minimal permissions:
- **Account.Cloudflare Workers Scripts** → Edit
- **Account.Cloudflare Workers KV Storage** → Edit
- **Account.Cloudflare Pages** → Edit
- (Optional) **Account.Account Settings** → Read (handy for wrangler discovery)
Add extra permissions (Secrets Store, Durable Objects, Containers, etc.) only when the hooks platform grows to need them.

... rest of content ...
