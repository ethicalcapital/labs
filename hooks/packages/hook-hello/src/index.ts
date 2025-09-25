import { buildHealthCheck } from "@ethicalcapital/hooks-shared";

export interface Env {
  SERVICE_NAME: string;
}

const handler = {
  async fetch(_request: Request, env: Env): Promise<Response> {
    const payload = buildHealthCheck(env.SERVICE_NAME ?? "hook-hello");
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  },
};

export default handler;
