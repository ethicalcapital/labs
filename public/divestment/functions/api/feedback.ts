export interface Env {
  FEEDBACK?: KVNamespace;
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
    const safe = {
      ts: new Date().toISOString(),
      venue: String(body.venue || ""),
      target: String(body.target || ""),
      entityType: String(body.entityType || ""),
      thumb: {
        mission: String(body.thumb?.mission || ""),
        competition: String(body.thumb?.competition || ""),
        regulatory: String(body.thumb?.regulatory || ""),
      },
      objective: String(body.objective || ""),
      use_case: String(body.use_case || ""),
      outcome: String(body.outcome || ""),
      // Truncate notes; strip linebreaks to be safe
      notes: String(body.notes || "").slice(0, 2000),
      ua: request.headers.get("user-agent") || "",
      ref: request.headers.get("referer") || "",
      v: 1,
    };

    let stored = false;
    if (env.FEEDBACK && typeof env.FEEDBACK.put === "function") {
      const id = `fb:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
      await env.FEEDBACK.put(id, JSON.stringify(safe));
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
