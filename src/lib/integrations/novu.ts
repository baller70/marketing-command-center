const NOVU_API_URL = process.env.NOVU_API_URL || "http://localhost:8095"
const NOVU_API_KEY = process.env.NOVU_API_KEY || ""

async function novuFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${NOVU_API_URL}/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `ApiKey ${NOVU_API_KEY}`,
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Novu ${options.method || "GET"} ${path}: ${res.status} - ${body}`)
  }

  return res.json()
}

export type MarketingEventType =
  | "lead_qualified"
  | "campaign_launched"
  | "campaign_stale"
  | "social_post_scheduled"
  | "content_feedback_ready"
  | "mautic_email_sent"
  | "pipeline_health_warning"

async function trigger(workflowId: string, subscriberId: string, payload: Record<string, any>): Promise<void> {
  await novuFetch("/events/trigger", {
    method: "POST",
    body: JSON.stringify({
      name: workflowId,
      to: { subscriberId },
      payload,
    }),
  })
}

async function notify(
  eventType: MarketingEventType,
  data: { title: string; message: string; brand?: string; url?: string; details?: Record<string, any> }
): Promise<boolean> {
  try {
    if (!NOVU_API_KEY) return false
    await trigger("marketing-pipeline", "kevin-admin", {
      eventType,
      ...data,
      timestamp: new Date().toISOString(),
    })
    return true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[NOVU-MKT] Failed to send ${eventType}: ${msg}`)
    return false
  }
}

async function isHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${NOVU_API_URL}/v1/health-check`, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

export const novu = {
  trigger,
  notify,
  isHealthy,

  async notifyLeadQualified(opts: { email: string; brand: string; tier: string; score: number }) {
    return notify("lead_qualified", {
      title: `New qualified lead: ${opts.email}`,
      message: `${opts.tier} lead (score: ${opts.score}) for ${opts.brand}`,
      brand: opts.brand,
    })
  },

  async notifyCampaignLaunched(opts: { name: string; brand: string; channels: string[] }) {
    return notify("campaign_launched", {
      title: `Campaign launched: ${opts.name}`,
      message: `Channels: ${opts.channels.join(", ")}`,
      brand: opts.brand,
    })
  },

  async notifyStaleCampaign(opts: { name: string; brand: string; daysSinceUpdate: number }) {
    return notify("campaign_stale", {
      title: `Stale campaign: ${opts.name}`,
      message: `No updates in ${opts.daysSinceUpdate} days`,
      brand: opts.brand,
    })
  },

  async notifySocialScheduled(opts: { brand: string; platforms: string[]; postCount: number }) {
    return notify("social_post_scheduled", {
      title: `${opts.postCount} social posts scheduled for ${opts.brand}`,
      message: `Platforms: ${opts.platforms.join(", ")}`,
      brand: opts.brand,
    })
  },

  async notifyContentFeedback(opts: { brand: string; period: string; topChannel: string }) {
    return notify("content_feedback_ready", {
      title: `Content feedback ready for ${opts.brand}`,
      message: `Period: ${opts.period}. Top channel: ${opts.topChannel}`,
      brand: opts.brand,
    })
  },

  async notifyHealthWarning(opts: { service: string; message: string }) {
    return notify("pipeline_health_warning", {
      title: `Marketing health warning: ${opts.service}`,
      message: opts.message,
    })
  },
}
