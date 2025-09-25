export interface Env {
  FEEDBACK?: KVNamespace;
  hooks?: KVNamespace;
}

export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) {
  try {
    const body = await request.json<any>();

    // Require explicit consent
    if (!body || body.consent !== true) {
      return new Response(
        JSON.stringify({ ok: false, error: "consent_required" }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    // Whitelist fields to avoid accidental PII
    const sanitize = (value: unknown, max = 400) => {
      if (typeof value !== "string") return "";
      return value.trim().slice(0, max);
    };

    const store = env.FEEDBACK || env.hooks;

    const safe = {
      ts: new Date().toISOString(),
      issue: sanitize(body.issue, 80),
      issueSuggestion: sanitize(body.issueSuggestion, 200),
      venue: String(body.venue || ""),
      target: String(body.target || ""),
      entityType: String(body.entityType || ""),
      knowledge: sanitize(body.knowledge, 40),
      thumb: {
        mission: sanitize(body.thumb?.mission, 40),
        competition: sanitize(body.thumb?.competition, 40),
        regulatory: sanitize(body.thumb?.regulatory, 40),
        preset: sanitize(body.thumb?.preset, 40),
      },
      objective: sanitize(body.objective, 80),
      use_case: sanitize(body.use_case, 80),
      outcome: sanitize(body.outcome, 40),
      // Truncate notes; strip leading/trailing whitespace
      notes: sanitize(body.notes, 2000),
      contentVersion: sanitize(body.content_version, 40),
      ua: sanitize(request.headers.get("user-agent"), 200),
      ref: sanitize(request.headers.get("referer"), 200),
      v: 1,
    };

    let stored = false;
    if (store && typeof store.put === "function") {
      const id = `fb:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
      await store.put(id, JSON.stringify(safe));
      stored = true;
    }

    return new Response(JSON.stringify({ ok: true, stored }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: "bad_request" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}
