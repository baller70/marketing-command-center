"use client"

import { ExternalLink, Mail, Share2, BarChart3, Mic, Zap, Megaphone, CheckCircle, AlertTriangle, Lock } from "lucide-react"
import { useBrand } from "@/context/BrandContext"

interface Tool {
  id: string
  name: string
  category: "email" | "social" | "analytics" | "podcast" | "automation" | "ads"
  description: string
  bestFor: string
  status: "active" | "needs-setup" | "oauth-required"
  url?: string
  localUrl?: string
  remoteUrl?: string
  docsUrl?: string
  apiAvailable: boolean
  credentials?: string
}

function getAppUrl(tool: Tool): string | undefined {
  if (typeof window === "undefined") return tool.localUrl || tool.url
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  if (isLocal && tool.localUrl) return tool.localUrl
  if (!isLocal && tool.remoteUrl) return tool.remoteUrl
  return tool.localUrl || tool.remoteUrl || tool.url
}

const tools: Tool[] = [
  // EMAIL MARKETING
  { id: "sendfox", name: "SendFox", category: "email", description: "Email marketing for content creators", bestFor: "Newsletters, nurture sequences, announcements", status: "active", url: "https://sendfox.com/", docsUrl: "https://sendfox.com/api", apiAvailable: true, credentials: "~/.config/clawdbot/email_marketing_tools.json" },
  { id: "acumbamail", name: "Acumbamail", category: "email", description: "Email, SMS, and landing pages", bestFor: "SMS campaigns, landing pages, EU compliance", status: "active", url: "https://acumbamail.com/", docsUrl: "https://acumbamail.com/en/apidoc/", apiAvailable: true, credentials: "~/.config/clawdbot/email_marketing_tools.json" },
  { id: "reachinbox", name: "ReachInbox", category: "email", description: "AI cold email outreach", bestFor: "Cold outreach to new leads, follow-up sequences", status: "active", url: "https://reachinbox.ai/", docsUrl: "https://reachinbox.ai/docs", apiAvailable: true, credentials: "~/.config/clawdbot/email_marketing_tools.json" },
  // SOCIAL MEDIA
  { id: "late-api", name: "Late (Content Hub)", category: "social", description: "Post to 9 platforms from Content Hub", bestFor: "Bulk posting, scheduling across all platforms", status: "active", localUrl: "http://localhost:3007", remoteUrl: "https://kevins-mac-mini.tailc5323b.ts.net:3007", docsUrl: "https://late.dev/docs", apiAvailable: true },
  { id: "mavic", name: "Mavic", category: "social", description: "AI social media scheduler", bestFor: "AI-generated captions, scheduling", status: "needs-setup", url: "https://mavic.app/", apiAvailable: false },
  { id: "unum", name: "UNUM", category: "social", description: "AI planner, feed preview, scheduling", bestFor: "Visual feed planning, Instagram grid", status: "needs-setup", url: "https://app.unum.la/", docsUrl: "https://www.unum.la/help", apiAvailable: false },
  { id: "followr", name: "Followr AI", category: "social", description: "AI content generation, automated posting", bestFor: "AI-generated content, growth automation", status: "needs-setup", url: "https://followr.ai/", docsUrl: "https://followr.ai/blog", apiAvailable: false },
  // ANALYTICS
  { id: "brave-search", name: "Brave Search API", category: "analytics", description: "Web search for research", bestFor: "Competitor research, market intelligence", status: "active", url: "https://api.search.brave.com/", docsUrl: "https://brave.com/search/api/", apiAvailable: true, credentials: "~/.config/clawdbot/brave_search.json" },
  { id: "umami", name: "Umami", category: "analytics", description: "Privacy-first web analytics", bestFor: "Pageviews, sessions, referrers, top pages across all brands", status: "active", url: "http://localhost:8083", docsUrl: "https://umami.is/docs", apiAvailable: true },
  // PODCAST
  { id: "podops", name: "PodOps", category: "podcast", description: "Podcast creation & distribution", bestFor: "Creating and hosting podcasts", status: "oauth-required", url: "https://www.mypodops.com/", docsUrl: "https://www.mypodops.com/help", apiAvailable: false },
  { id: "hubhopper", name: "Hubhopper", category: "podcast", description: "Podcast hosting platform", bestFor: "Podcast distribution to all platforms", status: "oauth-required", url: "https://hubhopper.com/", docsUrl: "https://hubhopper.com/help", apiAvailable: false },
  // AUTOMATION
  { id: "albato", name: "Albato", category: "automation", description: "Integration platform (like Zapier)", bestFor: "Connecting tools, automated workflows", status: "needs-setup", url: "https://albato.com/", docsUrl: "https://albato.com/docs", apiAvailable: true },
]

const categories = [
  { key: "email", label: "Email Marketing", icon: Mail, color: "text-[var(--text-primary)]" },
  { key: "social", label: "Social Media", icon: Share2, color: "text-pink-600" },
  { key: "analytics", label: "Analytics", icon: BarChart3, color: "text-[var(--text-primary)]" },
  { key: "podcast", label: "Podcast", icon: Mic, color: "text-[var(--text-primary)]" },
  { key: "automation", label: "Automation", icon: Zap, color: "text-[var(--text-primary)]" },
  { key: "ads", label: "Advertising", icon: Megaphone, color: "text-[var(--text-primary)]" },
]

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; bgColor: string; textColor: string }> = {
  active: { label: "Active", icon: CheckCircle, bgColor: "bg-[var(--bg-card)]", textColor: "text-[var(--text-primary)]" },
  "needs-setup": { label: "Needs Setup", icon: AlertTriangle, bgColor: "bg-[var(--bg-card)]", textColor: "text-[var(--text-primary)]" },
  "oauth-required": { label: "OAuth Required", icon: Lock, bgColor: "bg-[var(--bg-card)]", textColor: "text-[var(--text-primary)]" },
}

export default function ToolsPage() {
  const { activeBrand, brandInfo } = useBrand()
  const activeCount = tools.filter(t => t.status === "active").length
  const setupCount = tools.filter(t => t.status !== "active").length

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Zap className="w-6 h-6 text-[var(--text-primary)]" /> Marketing Tools
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">All tools and platforms used by the Marketing Division</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)]/20 text-[var(--text-primary)] text-xs font-medium">
            {activeCount} Active
          </span>
          <span className="px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)]/20 text-[var(--text-primary)] text-xs font-medium">
            {setupCount} Need Setup
          </span>
        </div>
      </div>

      {categories.map(cat => {
        const catTools = tools.filter(t => t.category === cat.key)
        if (catTools.length === 0) return null
        const Icon = cat.icon

        return (
          <div key={cat.key}>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Icon className={`w-5 h-5 ${cat.color}`} />
              {cat.label}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catTools.map(tool => {
                const sc = statusConfig[tool.status]
                const StatusIcon = sc.icon
                const url = getAppUrl(tool)

                return (
                  <div key={tool.id} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4 hover:border-[var(--border)] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-[var(--text-primary)]">{tool.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${sc.bgColor} ${sc.textColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">{tool.description}</p>
                    <p className="text-xs text-[var(--text-muted)] mb-3">Best for: {tool.bestFor}</p>
                    <div className="flex items-center gap-3">
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors">
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {tool.docsUrl && (
                        <a href={tool.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1 transition-colors">
                          Docs <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {tool.apiAvailable && (
                        <span className="text-xs text-[var(--text-primary)]">API ✓</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
