// Cloudflare Pages Function for Workbench API integration
// This demonstrates the hybrid architecture approach

interface Env {
  // KV Namespaces
  hooks: KVNamespace;
  UI_SESSIONS: KVNamespace;

  // Environment Variables
  HOOKS_BASE_URL: string;
  CONTENT_SYNC_URL: string;

  // Secrets (from Doppler)
  SYNC_TOKEN: string;
  CONTENT_SYNC_TOKEN: string;
  BUTTONDOWN_API_KEY: string;
  LACRM_API_KEY: string;
  // WORKBENCH_API_TOKEN: string; // When available
}

interface WorkbenchRequest {
  action: string;
  data?: any;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { action, data }: WorkbenchRequest = await request.json();

    switch (action) {
      case 'sync-content':
        return await syncContent(data, env);

      case 'external-sync':
        return await externalSync(data, env);

      case 'health-check':
        return Response.json({
          ok: true,
          service: 'workbench-api-proxy',
          timestamp: new Date().toISOString(),
          environment: {
            hooksUrl: env.HOOKS_BASE_URL,
            syncUrl: env.CONTENT_SYNC_URL,
            hasTokens: {
              sync: !!env.SYNC_TOKEN,
              contentSync: !!env.CONTENT_SYNC_TOKEN,
              buttondown: !!env.BUTTONDOWN_API_KEY,
              lacrm: !!env.LACRM_API_KEY,
            }
          }
        });

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Workbench API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

async function syncContent(data: any, env: Env): Promise<Response> {
  // Example: Direct API call pattern (for future workbench-api integration)
  // When workbench-api is available, this would make direct calls

  // For now, demonstrate content sync through hooks
  const response = await fetch(env.CONTENT_SYNC_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CONTENT_SYNC_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project: data.project || 'labs',
      entries: data.entries || []
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Content sync failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();

  // Store sync result in KV for audit trail
  const auditKey = `sync:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  await env.hooks.put(auditKey, JSON.stringify({
    timestamp: new Date().toISOString(),
    action: 'content-sync',
    result: result,
    metadata: data.metadata || {}
  }));

  return Response.json(result);
}

async function externalSync(data: any, env: Env): Promise<Response> {
  // Example: Proxied call through hooks for external integrations
  // This demonstrates the hybrid approach where external services go through hooks

  const hooksResponse = await fetch(`${env.HOOKS_BASE_URL}/workbench/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SYNC_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!hooksResponse.ok) {
    const errorText = await hooksResponse.text();
    throw new Error(`Hooks sync failed: ${hooksResponse.status} ${errorText}`);
  }

  const result = await hooksResponse.json();
  return Response.json(result);
}

// Example client-side integration for React components
export const createWorkbenchClient = (baseUrl: string) => ({
  async syncContent(project: string, entries: any[]) {
    const response = await fetch(`${baseUrl}/api/workbench`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync-content',
        data: { project, entries }
      })
    });
    return response.json();
  },

  async healthCheck() {
    const response = await fetch(`${baseUrl}/api/workbench`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'health-check' })
    });
    return response.json();
  }
});