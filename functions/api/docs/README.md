# Functions API

`functions/api/signup.ts` captures newsletter signups:
- Persists anonymized telemetry in the `hooks` KV namespace.
- Subscribes the email to Buttondown when `BUTTONDOWN_API_KEY` is set.
- Upserts/annotates the contact in Less Annoying CRM when `LACRM_*` secrets are available.

### Required secrets (managed via Doppler → wrangler secret bulk)
- `BUTTONDOWN_API_KEY`
- `LACRM_API_TOKEN`
- `LACRM_USER_CODE`
- Optional `LACRM_PIPELINE_ID`, `LACRM_STEP_ID`

### KV bindings
- `hooks` (KV namespace configured via `wrangler.toml`; check Cloudflare dashboard for the active ID)

Keep this doc updated as new Functions ship.
