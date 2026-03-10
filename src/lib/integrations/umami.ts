const UMAMI_URL = process.env.UMAMI_URL || "http://localhost:8083";
const UMAMI_TOKEN = process.env.UMAMI_API_TOKEN || "";

async function umamiRequest(endpoint: string, method = "GET", body?: any, timeout = 10000) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (UMAMI_TOKEN) headers["Authorization"] = `Bearer ${UMAMI_TOKEN}`;

  const res = await fetch(`${UMAMI_URL}/api${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Umami ${method} ${endpoint}: ${res.status} - ${errText}`);
  }
  return res.json();
}

export const umami = {
  async listWebsites() {
    return umamiRequest("/websites");
  },

  async getWebsiteStats(websiteId: string, startAt: number, endAt: number) {
    const params = new URLSearchParams({
      startAt: String(startAt),
      endAt: String(endAt),
    });
    return umamiRequest(`/websites/${websiteId}/stats?${params}`);
  },

  async getPageviews(websiteId: string, startAt: number, endAt: number, unit = "day") {
    const params = new URLSearchParams({
      startAt: String(startAt),
      endAt: String(endAt),
      unit,
    });
    return umamiRequest(`/websites/${websiteId}/pageviews?${params}`);
  },

  async getMetrics(websiteId: string, startAt: number, endAt: number, type: string) {
    const params = new URLSearchParams({
      startAt: String(startAt),
      endAt: String(endAt),
      type,
    });
    return umamiRequest(`/websites/${websiteId}/metrics?${params}`);
  },

  async getEvents(websiteId: string, startAt: number, endAt: number) {
    const params = new URLSearchParams({
      startAt: String(startAt),
      endAt: String(endAt),
    });
    return umamiRequest(`/websites/${websiteId}/events?${params}`);
  },

  async getReferrers(websiteId: string, startAt: number, endAt: number) {
    return umami.getMetrics(websiteId, startAt, endAt, "referrer");
  },

  async getTopPages(websiteId: string, startAt: number, endAt: number) {
    return umami.getMetrics(websiteId, startAt, endAt, "url");
  },
};
