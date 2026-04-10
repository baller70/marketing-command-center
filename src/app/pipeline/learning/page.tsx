"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { AlertTriangle, Lightbulb, RefreshCw, Plus, Filter, Brain, TrendingUp, MessageSquare, Calendar, Shield, Archive, Zap } from "lucide-react"

interface LearningRule {
  id: string
  brand: string
  dataSource: string
  rule: string
  confidence: string
  appliesTo: string
  loopType: string
  status: string
  createdAt: string
}

const LOOP_TYPES = [
  { value: "campaign_pattern", label: "Campaign Patterns", icon: TrendingUp, color: "text-[var(--text-primary)]" },
  { value: "funnel_optimization", label: "Funnel Optimization", icon: Zap, color: "text-[var(--text-primary)]" },
  { value: "content_feedback", label: "Content Feedback", icon: MessageSquare, color: "text-[var(--text-primary)]" },
  { value: "seasonal", label: "Seasonal Timing", icon: Calendar, color: "text-[var(--text-primary)]" },
  { value: "competitive", label: "Competitive Response", icon: Shield, color: "text-[var(--text-primary)]" },
]

const confidenceColors: Record<string, string> = { high: "bg-[var(--bg-card)] text-[var(--text-primary)]", medium: "bg-[var(--bg-card)] text-[var(--text-primary)]", low: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]" }
const statusColors: Record<string, string> = { active: "bg-[var(--bg-card)] text-[var(--text-primary)]", testing: "bg-[var(--bg-card)] text-[var(--text-primary)]", deprecated: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]" }

export default function LearningPage() {
  const { activeBrand } = useBrand()
  const [rules, setRules] = useState<LearningRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loopFilter, setLoopFilter] = useState("__all__")
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ brand: "TBF", dataSource: "", rule: "", confidence: "medium", appliesTo: "", loopType: "campaign_pattern" })

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (brandFilter !== "__all__") params.set("brand", brandFilter)
      if (loopFilter !== "__all__") params.set("loopType", loopFilter)
      const res = await fetch(`/api/pipeline/learning?${params}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setRules(data.rules || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [loopFilter, brandFilter])

  async function submit() {
    try {
      const res = await fetch("/api/pipeline/learning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      setShowForm(false)
      setForm({ brand: "TBF", dataSource: "", rule: "", confidence: "medium", appliesTo: "", loopType: "campaign_pattern" })
      await load()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch("/api/pipeline/learning", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      await load()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    }
  }

  // Group by loop type
  const grouped: Record<string, LearningRule[]> = {}
  rules.forEach(r => {
    if (!grouped[r.loopType]) grouped[r.loopType] = []
    grouped[r.loopType].push(r)
  })

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-pink-600" /> Stage 9: Learning Engine
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">5 feedback loops that make campaigns smarter every cycle — the unfair advantage</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><RefreshCw className="w-4 h-4" /></button>
          <button type="button" onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-medium hover:bg-[var(--text-primary)]">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>
      </div>

      {/* 5 Loop types overview */}
      <div className="grid grid-cols-5 gap-3">
        {LOOP_TYPES.map(lt => {
          const Icon = lt.icon
          const count = grouped[lt.value]?.length || 0
          return (
            <button type="button" key={lt.value} onClick={() => setLoopFilter(loopFilter === lt.value ? "__all__" : lt.value)}
              className={`rounded-lg p-3 text-left transition-colors ${loopFilter === lt.value ? "bg-pink-50 border border-pink-500/30" : "bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--border)]"}`}>
              <Icon className={`w-5 h-5 ${lt.color} mb-1`} />
              <p className="text-xs font-medium text-[var(--text-primary)]">{lt.label}</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{count}</p>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none">
          <option value="__all__">All Brands</option>
          {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b}>{b}</option>)}
        </select>
        <span className="text-xs text-[var(--text-muted)] ml-auto">{rules.length} rules</span>
      </div>

      {showForm && (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-pink-500/30 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Learning Rule</h3>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Brand</label>
              <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none">
                {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark", "all"].map(b => <option key={b}>{b}</option>)}
              </select></div>
            <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Loop Type</label>
              <select value={form.loopType} onChange={e => setForm({...form, loopType: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none">
                {LOOP_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
              </select></div>
            <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Confidence</label>
              <select value={form.confidence} onChange={e => setForm({...form, confidence: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none">
                {["high", "medium", "low"].map(c => <option key={c}>{c}</option>)}
              </select></div>
          </div>
          <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Rule (plain-language insight)</label>
            <textarea value={form.rule} onChange={e => setForm({...form, rule: e.target.value})} rows={2} placeholder='e.g., "TBF Facebook ads with before/after creative have 2.1x lower CPA than drill demo creative"' className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none resize-none placeholder:text-[var(--text-muted)]" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Data Source (campaigns)</label>
              <input value={form.dataSource} onChange={e => setForm({...form, dataSource: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none" /></div>
            <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Applies To (stage)</label>
              <input value={form.appliesTo} onChange={e => setForm({...form, appliesTo: e.target.value})} placeholder="e.g., Stage 3 Assembly, Stage 5 Deployment" className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm">Cancel</button>
            <button type="button" onClick={() => void submit()} disabled={!form.rule} className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-medium disabled:opacity-50">Save Rule</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-[var(--bg-primary)] animate-pulse" />)}</div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Retry</button>
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-12 text-center">
          <Brain className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No learning rules yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Rules are generated after 10+ campaigns per brand, or added manually from insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(r => {
            const lt = LOOP_TYPES.find(l => l.value === r.loopType)
            const Icon = lt?.icon || Lightbulb
            return (
              <div key={r.id} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4 hover:border-[var(--border)] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${lt?.color || "text-[var(--text-secondary)]"}`} />
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">{r.rule}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">{r.brand}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${confidenceColors[r.confidence]}`}>{r.confidence}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span>
                        {r.appliesTo && <span className="text-[10px] text-[var(--text-muted)]">→ {r.appliesTo}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    {r.status === "active" && <button type="button" onClick={() => void updateStatus(r.id, "deprecated")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]" title="Deprecate"><Archive className="w-4 h-4" /></button>}
                    {r.status === "testing" && <button type="button" onClick={() => void updateStatus(r.id, "active")} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]" title="Activate"><Zap className="w-4 h-4" /></button>}
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
