export interface LACRMClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export class LACRMClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: LACRMClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://api.lessannoyingcrm.com/v2";
  }

  async post<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LACRM request failed (${response.status}): ${text}`);
    }

    return (await response.json()) as T;
  }
}

export interface HealthCheckResult {
  ok: boolean;
  service: string;
  timestamp: string;
}

export function buildHealthCheck(service: string): HealthCheckResult {
  return {
    ok: true,
    service,
    timestamp: new Date().toISOString(),
  };
}
