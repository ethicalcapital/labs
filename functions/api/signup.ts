export interface Env {
  hooks?: KVNamespace;
  BUTTONDOWN_API_KEY?: string;
  LACRM_API_TOKEN?: string;
  LACRM_USER_CODE?: string;
  LACRM_PIPELINE_ID?: string;
  LACRM_STEP_ID?: string;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toHex(hash);
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
    const email = typeof body?.email === "string" ? body.email : null;
    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_email" }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
    const hashedEmail = email ? await hashEmail(email) : null;

    const payload = {
      ts: new Date().toISOString(),
      email_hash: hashedEmail,
      list: String(body?.listId || ""),
      tags: String(body?.tags || ""),
      source: String(body?.source || ""),
      status: String(body?.status || ""),
      userAgent: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || "",
      v: 1,
    };

    let stored = false;
    if (env.hooks && typeof env.hooks.put === "function") {
      const key = `signup:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
      console.log("hooks.put", key, payload);
      await env.hooks.put(key, JSON.stringify(payload));
      stored = true;
    }

    const tags = (payload.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const buttondownResult = await subscribeToButtondown({
      email,
      tags,
      metadata: {
        source: payload.source,
        list: payload.list,
        status: payload.status,
      },
      env,
    });

    const lacrmResult = await upsertLacrmContact({
      email,
      source: payload.source,
      list: payload.list,
      tags,
      env,
    });

    return new Response(
      JSON.stringify({ ok: true, stored, buttondown: buttondownResult, lacrm: lacrmResult }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: "bad_request" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}

interface ButtondownPayload {
  email: string;
  tags: string[];
  metadata: Record<string, string>;
  env: Env;
}

async function subscribeToButtondown({
  email,
  tags,
  metadata,
  env,
}: ButtondownPayload): Promise<{ status: string }> {
  const apiKey = env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    console.warn("Buttondown subscription skipped: missing BUTTONDOWN_API_KEY");
    return { status: "skipped" };
  }

  try {
    const response = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        tags,
        metadata,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Buttondown subscription failed", response.status, text);
      return { status: "error" };
    }

    return { status: "ok" };
  } catch (error) {
    console.error("Buttondown subscription error", error);
    return { status: "error" };
  }
}

interface LacrmPayload {
  email: string;
  source: string;
  list: string;
  tags: string[];
  env: Env;
}

async function upsertLacrmContact({
  email,
  source,
  list,
  tags,
  env,
}: LacrmPayload): Promise<{ status: string }> {
  const token = env.LACRM_API_TOKEN;
  const userCode = env.LACRM_USER_CODE;
  if (!token || !userCode) {
    console.warn("LACRM upsert skipped: missing credentials");
    return { status: "skipped" };
  }

  try {
    const payload = {
      UserCode: userCode,
      ApiToken: token,
      Function: "CreateOrUpdateContact",
      Parameters: {
        contact: {
          name: email,
          emails: [{ address: email, type: "Work" }],
          customFields: [
            {
              id: "source",
              value: source || "labs",
            },
          ],
        },
        overwrite: false,
      },
    };

    const response = await fetch("https://api.lessannoyingcrm.com/v2/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("LACRM contact upsert failed", response.status, text);
      return { status: "error" };
    }

    const json = await response.json<any>();
    const contactId = json?.contact?.id;

    if (!contactId) {
      console.warn("LACRM contact upsert returned no contact id", json);
      return { status: "ok" };
    }

    if (env.LACRM_PIPELINE_ID && env.LACRM_STEP_ID) {
      await addContactToPipeline({
        contactId,
        source,
        list,
        tags,
        env,
      });
    }

    await appendContactNote({ contactId, source, list, tags, env });

    return { status: "ok" };
  } catch (error) {
    console.error("LACRM contact upsert error", error);
    return { status: "error" };
  }
}

async function addContactToPipeline({
  contactId,
  source,
  list,
  tags,
  env,
}: {
  contactId: string;
  source: string;
  list: string;
  tags: string[];
  env: Env;
}) {
  if (!env.LACRM_PIPELINE_ID || !env.LACRM_STEP_ID) return;

  const payload = {
    UserCode: env.LACRM_USER_CODE,
    ApiToken: env.LACRM_API_TOKEN,
    Function: "AddContactToPipeline",
    Parameters: {
      contactId,
      pipelineId: env.LACRM_PIPELINE_ID,
      stageId: env.LACRM_STEP_ID,
      note: `Labs signup via ${source || "unknown"} (list: ${list || "default"}, tags: ${
        tags.join(", ") || "none"
      })`,
    },
  };

  try {
    const response = await fetch("https://api.lessannoyingcrm.com/v2/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("LACRM pipeline assignment failed", response.status, text);
    }
  } catch (error) {
    console.error("LACRM pipeline assignment error", error);
  }
}

async function appendContactNote({
  contactId,
  source,
  list,
  tags,
  env,
}: {
  contactId: string;
  source: string;
  list: string;
  tags: string[];
  env: Env;
}) {
  const payload = {
    UserCode: env.LACRM_USER_CODE,
    ApiToken: env.LACRM_API_TOKEN,
    Function: "AddNote",
    Parameters: {
      contactId,
      note: `Signed up for Labs updates. Source: ${source || "unknown"}. List: ${
        list || "default"
      }. Tags: ${tags.join(", ") || "none"}.`,
    },
  };

  try {
    const response = await fetch("https://api.lessannoyingcrm.com/v2/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("LACRM note append failed", response.status, text);
    }
  } catch (error) {
    console.error("LACRM note append error", error);
  }
}
