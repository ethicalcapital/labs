import { buildHealthCheck } from "@ethicalcapital/hooks-shared";

type Primitive = string | number | boolean | null;
type SupportedEncoding = "utf-8" | "base64" | "base64url";

declare global {
  function atob(data: string): string;
}

interface SyncEntry {
  key: string;
  url?: string;
  content?: string;
  encoding?: SupportedEncoding;
  contentType?: string;
  checksum?: string;
  checksumAlgorithm?: string;
  metadata?: Record<string, Primitive>;
}

interface SyncRequest {
  project: string;
  entries: SyncEntry[];
  metadata?: Record<string, Primitive>;
}

interface SyncResult {
  key: string;
  status: "stored" | "skipped" | "failed";
  bytes?: number;
  contentType?: string;
  error?: string;
}

export interface Env {
  RAWLS_BUCKET: R2Bucket;
  SERVICE_NAME: string;
  SYNC_TOKEN?: string;
  ALLOWED_PROJECTS?: string;
  MAX_ENTRIES?: string;
}

const DEFAULT_ALLOWED = new Set(["labs", "site", "docs"]);
const DEFAULT_MAX_ENTRIES = 100;

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "GET") {
      return json(buildHealthCheck(env.SERVICE_NAME ?? "hook-content-sync"));
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const auth = validateAuth(request, env);
    if (auth) {
      return auth;
    }

    let payload: SyncRequest;
    try {
      payload = (await request.json()) as SyncRequest;
    } catch (error) {
      console.error("content-sync: invalid JSON", error);
      return json({ error: "Invalid JSON body" }, 400);
    }

    const allowed = buildAllowedProjectSet(env.ALLOWED_PROJECTS);
    const project = payload.project?.trim();

    if (!project) {
      return json({ error: "Missing project" }, 400);
    }

    if (!allowed.has(project)) {
      return json({ error: `Project '${project}' is not permitted` }, 403);
    }

    if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
      return json({ error: "No entries provided" }, 400);
    }

    const limit = parseMaxEntries(env.MAX_ENTRIES);
    if (payload.entries.length > limit) {
      return json({ error: `Too many entries (${payload.entries.length}); limit is ${limit}` }, 400);
    }

    const batchMetadata = sanitizeMetadata("batch", payload.metadata);
    const results: SyncResult[] = [];
    let failureCount = 0;
    let successCount = 0;

    for (const entry of payload.entries) {
      try {
        const result = await processEntry(entry, env, project, batchMetadata);
        results.push(result);
        if (result.status === "stored") {
          successCount += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("content-sync: entry failure", { project, key: entry.key, error: message });
        results.push({ key: entry.key ?? "", status: "failed", error: message });
        failureCount += 1;
      }
    }

    const status = failureCount > 0 ? 207 : 200;
    return json({ project, successCount, failureCount, results }, status);
  },
};

export default handler;

function validateAuth(request: Request, env: Env): Response | null {
  const expected = env.SYNC_TOKEN;
  if (!expected) {
    console.warn("content-sync: SYNC_TOKEN not configured");
    return json({ error: "SYNC_TOKEN is not configured" }, 500);
  }

  const header = request.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Missing bearer token" }, 401);
  }

  const token = header.slice(7).trim();
  if (token !== expected) {
    return json({ error: "Invalid bearer token" }, 401);
  }

  return null;
}

function buildAllowedProjectSet(value: string | undefined): Set<string> {
  if (!value) {
    return new Set(DEFAULT_ALLOWED);
  }

  const entries = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return entries.length ? new Set(entries) : new Set(DEFAULT_ALLOWED);
}

function parseMaxEntries(value: string | undefined): number {
  if (!value) {
    return DEFAULT_MAX_ENTRIES;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_MAX_ENTRIES;
  }

  return parsed;
}

async function processEntry(
  entry: SyncEntry,
  env: Env,
  project: string,
  batchMetadata: Record<string, string>,
): Promise<SyncResult> {
  if (!entry.key) {
    throw new Error("Entry key is required");
  }

  const targetKey = buildObjectKey(project, entry.key);
  const resolution = await resolveContent(entry);

  if (!resolution) {
    return { key: targetKey, status: "skipped", error: "No content or URL provided" };
  }

  const { body, bytes, contentType, sourceMetadata } = resolution;

  const metadata: Record<string, string> = {
    project,
    ...batchMetadata,
    ...sourceMetadata,
    ...sanitizeMetadata("entry", entry.metadata),
  };

  const checksum = normalizeChecksum(entry.checksum, entry.checksumAlgorithm);
  if (checksum) {
    metadata.entry_checksum = checksum.value;
    metadata.entry_checksum_alg = checksum.algorithm;
  }

  await env.RAWLS_BUCKET.put(targetKey, body, {
    httpMetadata: {
      contentType,
      cacheControl: "no-cache",
    },
    customMetadata: metadata,
  });

  console.log("content-sync: stored", { project, key: targetKey, bytes, contentType });

  return { key: targetKey, status: "stored", bytes, contentType };
}

interface ResolvedContent {
  body: ArrayBuffer | ArrayBufferView | ReadableStream | string;
  bytes: number;
  contentType: string;
  sourceMetadata: Record<string, string>;
}

async function resolveContent(entry: SyncEntry): Promise<ResolvedContent | null> {
  if (entry.content) {
    return decodeContent(entry);
  }

  if (entry.url) {
    return fetchContent(entry);
  }

  return null;
}

async function decodeContent(entry: SyncEntry): Promise<ResolvedContent> {
  const encoding = entry.encoding ?? "utf-8";
  const metadata: Record<string, string> = {};

  let buffer: Uint8Array;
  if (encoding === "utf-8") {
    buffer = new TextEncoder().encode(entry.content ?? "");
  } else if (encoding === "base64" || encoding === "base64url") {
    const normalized = encoding === "base64url" ? base64UrlToBase64(entry.content ?? "") : entry.content ?? "";
    buffer = base64ToUint8Array(normalized);
  } else {
    throw new Error(`Unsupported encoding: ${encoding}`);
  }

  metadata.source = "inline";
  metadata.encoding = encoding;

  const contentType = entry.contentType ?? inferContentType(entry.key);

  return {
    body: buffer,
    bytes: buffer.byteLength,
    contentType,
    sourceMetadata: metadata,
  };
}

async function fetchContent(entry: SyncEntry): Promise<ResolvedContent> {
  const response = await fetch(entry.url!, {
    headers: { "user-agent": "hook-content-sync/1.0" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch '${entry.url}': ${response.status} ${response.statusText} - ${truncate(text, 200)}`);
  }

  const body = await response.arrayBuffer();
  const contentType = entry.contentType ?? response.headers.get("content-type") ?? inferContentType(entry.key);

  const metadata: Record<string, string> = {
    source: entry.url ?? "",
  };

  const lastModified = response.headers.get("last-modified");
  if (lastModified) {
    metadata.last_modified = lastModified;
  }

  const etag = response.headers.get("etag");
  if (etag) {
    metadata.etag = etag;
  }

  return {
    body,
    bytes: body.byteLength,
    contentType,
    sourceMetadata: metadata,
  };
}

function buildObjectKey(project: string, key: string): string {
  const sanitized = key.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!sanitized) {
    throw new Error("Entry key cannot be empty");
  }
  if (sanitized.includes("..")) {
    throw new Error("Entry key cannot contain '..'");
  }
  return `${project}/${sanitized}`;
}

function sanitizeMetadata(scope: "batch" | "entry", metadata?: Record<string, Primitive>): Record<string, string> {
  if (!metadata) {
    return {};
  }

  const output: Record<string, string> = {};
  for (const [rawKey, value] of Object.entries(metadata)) {
    if (value === undefined) {
      continue;
    }
    const key = `${scope}_${rawKey}`
      .trim()
      .replace(/[^a-zA-Z0-9_.-]+/g, "_")
      .slice(0, 64);
    if (!key) {
      continue;
    }
    output[key] = String(value).slice(0, 1024);
  }
  return output;
}

function normalizeChecksum(value?: string, algorithm?: string): { value: string; algorithm: string } | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalizedValue = trimmed.toLowerCase();
  if (!/^[a-f0-9]{32,128}$/.test(normalizedValue)) {
    throw new Error("Checksum must be a hex string between 32 and 128 characters");
  }

  const normalizedAlgorithm = (algorithm ?? "sha256").trim().toLowerCase();
  if (!/^[a-z0-9-]{2,32}$/.test(normalizedAlgorithm)) {
    throw new Error("Checksum algorithm must be an alphanumeric identifier");
  }

  return { value: normalizedValue, algorithm: normalizedAlgorithm };
}

function base64UrlToBase64(input: string): string {
  return input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
}

function base64ToUint8Array(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function inferContentType(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=utf-8";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (lower.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (lower.endsWith(".css")) return "text/css; charset=utf-8";
  if (lower.endsWith(".js")) return "application/javascript";
  if (lower.endsWith(".xml")) return "application/xml";
  if (lower.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit)}…`;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
