const MAUTIC_URL = process.env.MAUTIC_URL || "http://localhost:8088";
const MAUTIC_USER = process.env.MAUTIC_API_USER || "";
const MAUTIC_PASS = process.env.MAUTIC_API_PASS || "";

function authHeader(): string {
  if (!MAUTIC_USER) return "";
  return `Basic ${Buffer.from(`${MAUTIC_USER}:${MAUTIC_PASS}`).toString("base64")}`;
}

async function mauticRequest(
  endpoint: string,
  method = "GET",
  body?: any,
  timeout = 15000
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = authHeader();
  if (auth) headers["Authorization"] = auth;

  const res = await fetch(`${MAUTIC_URL}/api${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Mautic ${method} ${endpoint}: ${res.status} - ${errText}`);
  }
  return res.json();
}

export const mautic = {
  async createContact(data: { firstname?: string; lastname?: string; email: string; tags?: string[] }) {
    return mauticRequest("/contacts/new", "POST", data);
  },

  async listContacts(search?: string, limit = 30) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (search) params.set("search", search);
    return mauticRequest(`/contacts?${params}`);
  },

  async addContactToSegment(contactId: number, segmentId: number) {
    return mauticRequest(`/segments/${segmentId}/contact/${contactId}/add`, "POST");
  },

  async createCampaign(data: { name: string; description?: string }) {
    return mauticRequest("/campaigns/new", "POST", { campaign: data });
  },

  async listCampaigns(limit = 30) {
    return mauticRequest(`/campaigns?limit=${limit}`);
  },

  async createEmail(data: { name: string; subject: string; body: string; emailType?: string }) {
    return mauticRequest("/emails/new", "POST", {
      name: data.name,
      subject: data.subject,
      customHtml: data.body,
      emailType: data.emailType || "template",
    });
  },

  async sendEmail(emailId: number, contactId: number) {
    return mauticRequest(`/emails/${emailId}/contact/${contactId}/send`, "POST");
  },

  async listEmails(limit = 30) {
    return mauticRequest(`/emails?limit=${limit}`);
  },

  async listSegments(limit = 30) {
    return mauticRequest(`/segments?limit=${limit}`);
  },

  async getContactActivity(contactId: number) {
    return mauticRequest(`/contacts/${contactId}/activity`);
  },

  async getCampaignStats(campaignId: number) {
    return mauticRequest(`/campaigns/${campaignId}`);
  },

  /** Get email stats (sent, read, clicked, bounced) for a specific email */
  async getEmailStats(emailId: number): Promise<{ sentCount: number; readCount: number; clickCount: number; bounceCount: number } | null> {
    try {
      const data = await mauticRequest(`/emails/${emailId}`);
      const email = data?.email;
      if (!email) return null;
      return {
        sentCount: email.sentCount ?? 0,
        readCount: email.readCount ?? 0,
        clickCount: email.clickCount ?? 0,
        bounceCount: email.bounceCount ?? 0,
      };
    } catch {
      return null;
    }
  },

  /** Get aggregate email stats across all emails (for pipeline-wide metrics) */
  async getAggregateEmailStats(): Promise<{ totalSent: number; totalRead: number; totalClicked: number; totalBounced: number; emailCount: number } | null> {
    try {
      const data = await mauticRequest('/emails?limit=100&orderBy=id&orderByDir=DESC');
      const emails = data?.emails ? Object.values(data.emails) as Array<{ sentCount?: number; readCount?: number; clickCount?: number; bounceCount?: number }> : [];
      if (emails.length === 0) return null;
      return {
        totalSent: emails.reduce((sum, e) => sum + (e.sentCount ?? 0), 0),
        totalRead: emails.reduce((sum, e) => sum + (e.readCount ?? 0), 0),
        totalClicked: emails.reduce((sum, e) => sum + (e.clickCount ?? 0), 0),
        totalBounced: emails.reduce((sum, e) => sum + (e.bounceCount ?? 0), 0),
        emailCount: emails.length,
      };
    } catch {
      return null;
    }
  },

  /** Check if Mautic is reachable (lightweight — avoids slow API calls) */
  async isHealthy(): Promise<boolean> {
    try {
      // Use a short-timeout HEAD-style check against the root URL
      // instead of a full API call that may hang under load
      const res = await fetch(`${MAUTIC_URL}/api`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      // Any response (even 401/403) means Mautic is alive
      return res.status > 0;
    } catch {
      // If that fails, try a raw TCP-level check via a minimal fetch
      try {
        const res = await fetch(MAUTIC_URL, {
          method: 'HEAD',
          signal: AbortSignal.timeout(2000),
        });
        return res.status > 0;
      } catch {
        return false;
      }
    }
  },
};
