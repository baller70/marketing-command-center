"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { Megaphone, Plus, RefreshCw, Filter, Play, Pause, Square, CheckCircle, Clock, AlertTriangle, Trash2, ArrowRight } from "lucide-react"

interface Campaign {
  id: string
  name: string
  messagingLane: string
  goal: string
  targetAudience: string
  offer: string | null
  channels: string[]
  budget: number
  budgetSpent: number
  horizon: string
  status: string
  startDate: string | null
  endDate: string | null
  brandPod: { brand: string; name: string }
  _count: { assemblies: number; qualityReviews: number; deployments: number; performance: number }
  createdAt: string
}

interface BrandPod { id: string; brand: string; name: string }

const GOALS = ["awareness", "lead_gen", "enrollment", "sign_up", "retention", "event_promotion"]
const HORIZONS = ["H1", "H2", "H3"]
const STATUSES = ["draft", "assembling", "quality_gate", "approved", "live", "paused", "completed", "killed"]
const CHANNELS = ["instagram", "tiktok", "facebook", "youtube", "email", "google_ads", "sms", "twitter", "linkedin", "in_app", "local_partnerships"]

const statusColors: Record<string, string> = {
  draft: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
  assembling: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  quality_gate: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  approved: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  live: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  paused: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  completed: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  killed: "bg-[var(--bg-card)] text-[var(--text-primary)]",
}

export default function CampaignsPage() {
  const { activeBrand } = useBrand()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [pods, setPods] = useState<BrandPod[]>([])
  const [loading, setLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [statusFilter, setStatusFilter] = useState("__all__")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    brandPodId: "", name: "", messagingLane: "", goal: "awareness",
    targetAudience: "", offer: "", channels: [] as string[], budget: 0, horizon: "H2",
  })

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (brandFilter !== "__all__") params.set("brand", brandFilter)
    if (statusFilter !== "__all__") params.set("status", statusFilter)
    const [cRes, pRes] = await Promise.all([
      fetch(`/api/pipeline/campaigns?${params}`),
      fetch("/api/pipeline/brand-pods"),
    ])
    const cData = await cRes.json()
    const pData = await pRes.json()
    setCampaigns(cData.campaigns || [])
    setPods(pData.pods || [])
    setLoading(false)
  }

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])
  useEffect(() => { load() }, [brandFilter, statusFilter])

  async function submit() {
    const data = { ...form, channels: form.channels }
    await fetch("/api/pipeline/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    setShowForm(false)
    load()
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/pipeline/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  const toggleChannel = (ch: string) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(ch) ? prev.channels.filter(c => c !== ch) : [...prev.channels, ch],
    }))
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[var(--text-primary)]" />
            Stage 3: Campaigns
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Campaign strategy, planning, and lifecycle management across all 5 brands</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--text-primary)] text-white text-sm font-medium hover:bg-[var(--text-primary)] transition-colors">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3">
        {["draft", "assembling", "quality_gate", "live", "completed"].map(s => {
          const count = campaigns.filter(c => c.status === s).length
          return (
            <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s]}`}>{s.replace("_", " ")}</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{count}</span>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none">
          <option value="__all__">All Brands</option>
          {pods.map(p => <option key={p.brand} value={p.brand}>{p.brand}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none">
          <option value="__all__">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <span className="text-xs text-[var(--text-muted)] ml-auto">{campaigns.length} campaigns</span>
      </div>

      {/* New campaign form */}
      {showForm && (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]/30 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Campaign</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Brand Pod</label>
              <select value={form.brandPodId} onChange={e => setForm({...form, brandPodId: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none">
                <option value="">Select brand...</option>
                {pods.map(p => <option key={p.id} value={p.id}>{p.brand} — {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Campaign Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Messaging Lane</label>
              <input value={form.messagingLane} onChange={e => setForm({...form, messagingLane: e.target.value})} placeholder="e.g., Fundamentals, Free Trial" className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Goal</label>
              <select value={form.goal} onChange={e => setForm({...form, goal: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none">
                {GOALS.map(g => <option key={g} value={g}>{g.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Horizon</label>
              <select value={form.horizon} onChange={e => setForm({...form, horizon: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none">
                {HORIZONS.map(h => <option key={h} value={h}>{h} — {h === "H1" ? "This Week (Locked)" : h === "H2" ? "Next 2 Weeks" : "Next Month"}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Budget ($)</label>
              <input type="number" value={form.budget} onChange={e => setForm({...form, budget: Number(e.target.value)})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Target Audience</label>
            <input value={form.targetAudience} onChange={e => setForm({...form, targetAudience: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Channels</label>
            <div className="flex gap-2 flex-wrap">
              {CHANNELS.map(ch => (
                <button key={ch} onClick={() => toggleChannel(ch)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.channels.includes(ch) ? "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)]/30" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border)]"}`}>
                  {ch.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm">Cancel</button>
            <button onClick={submit} disabled={!form.brandPodId || !form.name} className="px-4 py-2 rounded-lg bg-[var(--text-primary)] text-white text-sm font-medium hover:bg-[var(--text-primary)] disabled:opacity-50">Create Campaign</button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-[var(--bg-primary)] animate-pulse" />)}</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-12 text-center">
          <Megaphone className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No campaigns yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Create a campaign to start the assembly line</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4 hover:border-[var(--border)] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{c.status.replace("_", " ")}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">{c.brandPod?.brand}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">{c.horizon}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span>Lane: {c.messagingLane}</span>
                    <span>Goal: {c.goal.replace("_", " ")}</span>
                    <span>Budget: ${c.budget.toLocaleString()}{c.budgetSpent > 0 ? ` (spent: $${c.budgetSpent.toLocaleString()})` : ""}</span>
                    <span>{(c.channels as string[]).length} channels</span>
                  </div>
                  {c.targetAudience && <p className="text-xs text-[var(--text-muted)] mt-1">Audience: {c.targetAudience}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-[var(--text-muted)]">Assembly: {c._count.assemblies}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">QG: {c._count.qualityReviews}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Deployments: {c._count.deployments}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Metrics: {c._count.performance}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  {c.status === "draft" && <button onClick={() => updateStatus(c.id, "assembling")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Start assembly"><ArrowRight className="w-4 h-4" /></button>}
                  {c.status === "approved" && <button onClick={() => updateStatus(c.id, "live")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Go live"><Play className="w-4 h-4" /></button>}
                  {c.status === "live" && <button onClick={() => updateStatus(c.id, "paused")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Pause"><Pause className="w-4 h-4" /></button>}
                  {c.status === "paused" && <button onClick={() => updateStatus(c.id, "live")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Resume"><Play className="w-4 h-4" /></button>}
                  {["draft", "paused"].includes(c.status) && <button onClick={() => updateStatus(c.id, "killed")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Kill"><Square className="w-4 h-4" /></button>}
                  {c.status === "live" && <button onClick={() => updateStatus(c.id, "completed")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Complete"><CheckCircle className="w-4 h-4" /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
