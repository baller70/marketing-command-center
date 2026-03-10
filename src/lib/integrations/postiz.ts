const POSTIZ_BACKEND_URL = process.env.POSTIZ_BACKEND_URL || "http://localhost:8085";
const POSTIZ_TOKEN = process.env.POSTIZ_API_TOKEN || "";

async function postizRequest(endpoint: string, method = "GET", body?: any, timeout = 30000) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (POSTIZ_TOKEN) headers["Authorization"] = POSTIZ_TOKEN;

  const res = await fetch(`${POSTIZ_BACKEND_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Postiz ${method} ${endpoint}: ${res.status} - ${errText}`);
  }
  return res.json();
}

export const postiz = {
  async schedulePost(data: {
    content: string;
    platforms: string[];
    scheduledDate?: string;
    mediaUrls?: string[];
  }) {
    return postizRequest("/public/v1/posts", "POST", {
      content: data.content,
      platforms: data.platforms,
      scheduledDate: data.scheduledDate || new Date().toISOString(),
      media: data.mediaUrls || [],
    });
  },

  async publishNow(data: { content: string; platforms: string[] }) {
    return postizRequest("/public/v1/posts", "POST", {
      content: data.content,
      platforms: data.platforms,
      publishNow: true,
    });
  },

  async listPosts(filters?: { status?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    const now = new Date();
    params.set("startDate", filters?.startDate || new Date(now.getFullYear(), 0, 1).toISOString());
    params.set("endDate", filters?.endDate || new Date(now.getFullYear(), 11, 31).toISOString());
    return postizRequest(`/public/v1/posts?${params}`);
  },

  async getAnalytics(params?: { integration?: string }) {
    if (params?.integration) {
      return postizRequest(`/public/v1/analytics/${params.integration}`);
    }
    return postizRequest("/public/v1/integrations");
  },

  async getChannels() {
    return postizRequest("/public/v1/integrations");
  },

  async isConnected() {
    return postizRequest("/public/v1/is-connected");
  },
};
