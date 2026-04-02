"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { Brain, Plus, Filter, RefreshCw, AlertTriangle, CheckCircle, Archive, Zap } from "lucide-react"

interface IntelEntry {
  id: string
  dateCaptured: string
  brand: string
  category: string
  source: string
  insight: string
  actionable: boolean
  actionRecommended: string | null
  priority: string
  status: string
  connectedCampaign: string | null
}

const BRANDS = ["__all__", "TBF", "RA1", "ShotIQ", "HoS", "Bookmark", "all"]
const CATEGORIES = ["__all__", "audience", "competitor", "platform", "local_market", "industry", "pricing", "seasonal"]
const PRIORITIES = ["__all__", "high", "medium", "low"]
const STATUSES = ["__all__", "new", "actioned", "archived"]

export default function IntelligencePage() {
  const { activeBrand } = useBrand()
  const [entries, setEntries] = useState<IntelEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState("__all__")
  const [category, setCategory] = useState("__all__")
  const [priority, setPriority] = useState("__all__")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ brand: "TBF", category: "audience", source: "", insight: "", actionable: false, actionRecommended: "", priority: "medium" })

  useEffect(() => { setBrand(activeBrand) }, [activeBrand])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (brand !== "__all__") params.set("brand", brand)
    if (category !== "__all__") params.set("category", category)
    if (priority !== "__all__") params.set("priority", priority)
    const res = await fetch(`/api/pipeline/intelligence?${params}`)
    const data = await res.json()
    setEntries(data.entries || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [brand, category, priority])

  async function submit() {
    await fetch("/api/pipeline/intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ brand: "TBF", category: "audience", source: "", insight: "", actionable: false, actionRecommended: "", priority: "medium" })
    load()
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/pipeline/intelligence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  const priorityColors: Record<string, string> = { high: "bg-[var(--bg-card)] text-[var(--text-primary)]", medium: "bg-[var(--bg-card)] text-[var(--text-primary)]", low: "bg-[var(--bg-card)] text-[var(--text-primary)]" }
  const statusIcons: Record<string, typeof CheckCircle> = { new: Zap, actioned: CheckCircle, archived: Archive }
  const categoryColors: Record<string, string> = {
    audience: "bg-[var(--bg-card)] text-[var(--text-primary)]", competitor: "bg-[var(--bg-card)] text-[var(--text-primary)]",
    platform: "bg-[var(--bg-card)] text-[var(--text-primary)]", local_market: "bg-[var(--bg-card)] text-[var(--text-primary)]",
    industry: "bg-[var(--bg-card)] text-[var(--text-primary)]", pricing: "bg-[var(--bg-card)] text-[var(--text-primary)]",
    seasonal: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Brain className="w-6 h-6 text-[var(--text-primary)]" />
            Stage 1: Market Intelligence
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Monitor audience behavior, competitors, platform changes, and local market conditions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--text-primary)] text-white text-sm font-medium hover:bg-[var(--text-primary)] transition-colors">
            <Plus className="w-4 h-4" /> Add Intel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">Filters:</span>
        </div>
        <select value={brand} onChange={e => setBrand(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] outline-none">
          {BRANDS.map(b => <option key={b} value={b}>{b === "__all__" ? "All Brands" : b}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] outline-none">
          {CATEGORIES.map(c => <option key={c} value={c}>{c === "__all__" ? "All Categories" : c.replace("_", " ")}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] outline-none">
          {PRIORITIES.map(p => <option key={p} value={p}>{p === "__all__" ? "All Priorities" : p}</option>)}
        </select>
        <span className="text-xs text-[var(--text-muted)] ml-auto">{entries.length} entries</span>
      </div>

      {/* New entry form */}
      {showForm && (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]/30 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Intelligence Entry</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Brand</label>
              <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none">
                {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark", "all"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none">
                {CATEGORIES.filter(c => c !== "__all__").map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none">
                {["high", "medium", "low"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Source</label>
            <input value={form.source} onChange={e => setForm({...form, source: e.target.value})} placeholder="e.g., Meta Ad Library, TikTok Creative Center, customer DM" className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Insight</label>
            <textarea value={form.insight} onChange={e => setForm({...form, insight: e.target.value})} rows={3} placeholder="What did you discover?" className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none resize-none placeholder:text-[var(--text-muted)]" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={form.actionable} onChange={e => setForm({...form, actionable: e.target.checked})} className="rounded" />
              Actionable
            </label>
          </div>
          {form.actionable && (
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Recommended Action</label>
              <textarea value={form.actionRecommended} onChange={e => setForm({...form, actionRecommended: e.target.value})} rows={2} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none resize-none" />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition-colors">Cancel</button>
            <button onClick={submit} disabled={!form.insight || !form.source} className="px-4 py-2 rounded-lg bg-[var(--text-primary)] text-white text-sm font-medium hover:bg-[var(--text-primary)] transition-colors disabled:opacity-50">Save Entry</button>
          </div>
        </div>
      )}

      {/* Entries */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-[var(--bg-primary)] animate-pulse" />)}</div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-12 text-center">
          <Brain className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No intelligence entries yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Add market insights, competitor observations, and audience signals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const StatusIcon = statusIcons[entry.status] || Zap
            return (
              <div key={entry.id} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4 hover:border-[var(--border)] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] font-medium">{entry.brand}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[entry.category] || "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"}`}>
                        {entry.category.replace("_", " ")}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[entry.priority]}`}>
                        {entry.priority}
                      </span>
                      {entry.actionable && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] text-xs font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Actionable
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-primary)] mb-1">{entry.insight}</p>
                    {entry.actionRecommended && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">→ {entry.actionRecommended}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] text-[var(--text-muted)]">Source: {entry.source}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{new Date(entry.dateCaptured).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {entry.status !== "actioned" && (
                      <button onClick={() => updateStatus(entry.id, "actioned")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title="Mark actioned">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {entry.status !== "archived" && (
                      <button onClick={() => updateStatus(entry.id, "archived")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors" title="Archive">
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
