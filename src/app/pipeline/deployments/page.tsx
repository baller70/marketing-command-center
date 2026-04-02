"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { Send, RefreshCw, Filter, Plus, Play, Pause, CheckCircle, ExternalLink } from "lucide-react"

interface Deployment {
  id: string
  channel: string
  platform: string | null
  budget: number
  budgetSpent: number
  status: string
  launchedAt: string | null
  campaign: { name: string; brandPod: { brand: string } }
  createdAt: string
}

const channelIcons: Record<string, string> = {
  instagram: "📸", tiktok: "🎵", facebook: "📘", youtube: "▶️", email: "📧",
  google_ads: "🔍", sms: "💬", twitter: "🐦", linkedin: "💼", in_app: "📱",
  local_partnerships: "🤝",
}
const statusColors: Record<string, string> = {
  scheduled: "bg-[var(--bg-card)] text-[var(--text-primary)]", live: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  paused: "bg-[var(--bg-card)] text-[var(--text-primary)]", completed: "bg-[var(--bg-card)] text-[var(--text-primary)]",
}

export default function DeploymentsPage() {
  const { activeBrand } = useBrand()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [channelFilter, setChannelFilter] = useState("__all__")
  const [statusFilter, setStatusFilter] = useState("__all__")

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (brandFilter !== "__all__") params.set("brand", brandFilter)
    if (channelFilter !== "__all__") params.set("channel", channelFilter)
    if (statusFilter !== "__all__") params.set("status", statusFilter)
    const res = await fetch(`/api/pipeline/deployments?${params}`)
    const data = await res.json()
    setDeployments(data.deployments || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [brandFilter, channelFilter, statusFilter])

  async function updateStatus(id: string, status: string) {
    await fetch("/api/pipeline/deployments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...(status === "live" ? { launchedAt: new Date().toISOString() } : {}) }),
    })
    load()
  }

  const channels = [...new Set(deployments.map(d => d.channel))]
  const liveCount = deployments.filter(d => d.status === "live").length
  const totalBudget = deployments.reduce((sum, d) => sum + d.budget, 0)
  const totalSpent = deployments.reduce((sum, d) => sum + d.budgetSpent, 0)

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Send className="w-6 h-6 text-[var(--text-primary)]" /> Stage 7: Channel Deployment
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Deploy campaigns to the right channels at the right time — organic + paid coordination</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Total Deployments</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{deployments.length}</p>
        </div>
        <div className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Live Now</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{liveCount}</p>
        </div>
        <div className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Total Budget</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Total Spent</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">${totalSpent.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none">
          <option value="__all__">All Brands</option>
          {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none">
          <option value="__all__">All Channels</option>
          {Object.keys(channelIcons).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none">
          <option value="__all__">All Statuses</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-[var(--bg-primary)] animate-pulse" />)}</div>
      ) : deployments.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-12 text-center">
          <Send className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No channel deployments yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Campaigns are deployed after passing the Quality Gate</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deployments.map(d => (
            <div key={d.id} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4 hover:border-[var(--border)] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{channelIcons[d.channel] || "📢"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">{d.channel.replace("_", " ")}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status]}`}>{d.status}</span>
                      {d.platform && <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">{d.platform}</span>}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{d.campaign?.brandPod?.brand} — {d.campaign?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-[var(--text-primary)] font-medium">${d.budget.toLocaleString()}</p>
                    {d.budgetSpent > 0 && <p className="text-xs text-[var(--text-muted)]">Spent: ${d.budgetSpent.toLocaleString()}</p>}
                  </div>
                  <div className="flex gap-1">
                    {d.status === "scheduled" && <button onClick={() => updateStatus(d.id, "live")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Play className="w-4 h-4" /></button>}
                    {d.status === "live" && <button onClick={() => updateStatus(d.id, "paused")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Pause className="w-4 h-4" /></button>}
                    {d.status === "paused" && <button onClick={() => updateStatus(d.id, "live")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Play className="w-4 h-4" /></button>}
                    {["live", "paused"].includes(d.status) && <button onClick={() => updateStatus(d.id, "completed")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"><CheckCircle className="w-4 h-4" /></button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
