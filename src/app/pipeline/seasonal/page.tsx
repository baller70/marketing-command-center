"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { AlertTriangle, Calendar, RefreshCw, Plus } from "lucide-react"

interface SeasonalPattern {
  id: string
  brand: string
  observation: string
  action: string
  months: number[]
  status: string
  createdAt: string
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default function SeasonalPage() {
  const { activeBrand } = useBrand()
  const [patterns, setPatterns] = useState<SeasonalPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ brand: "TBF", observation: "", action: "", months: [] as number[] })

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (brandFilter !== "__all__") params.set("brand", brandFilter)
      const res = await fetch(`/api/pipeline/seasonal?${params}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setPatterns(data.patterns || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [brandFilter])

  async function submit() {
    try {
      const res = await fetch("/api/pipeline/seasonal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      setShowForm(false)
      setForm({ brand: "TBF", observation: "", action: "", months: [] })
      await load()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    }
  }

  function toggleMonth(m: number) {
    setForm(prev => ({
      ...prev,
      months: prev.months.includes(m) ? prev.months.filter(x => x !== m) : [...prev.months, m],
    }))
  }

  // Build a 12-month heatmap from all patterns
  const currentMonth = new Date().getMonth() + 1 // 1-indexed
  const monthHeat: Record<number, string[]> = {}
  MONTH_NAMES.forEach((_, i) => { monthHeat[i + 1] = [] })
  patterns.forEach(p => {
    (p.months as number[]).forEach(m => {
      if (monthHeat[m]) monthHeat[m].push(p.brand)
    })
  })

  // Patterns relevant to the current month
  const activeNow = patterns.filter(p => p.months.includes(currentMonth))

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[var(--text-primary)]" /> Seasonal Patterns
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Track how performance varies by season, events, and market conditions</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><RefreshCw className="w-4 h-4" /></button>
          <button type="button" onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-500">
            <Plus className="w-4 h-4" /> Add Pattern
          </button>
        </div>
      </div>

      {/* 12-month heatmap */}
      <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Annual Marketing Activity Heatmap</h2>
        <div className="grid grid-cols-12 gap-2">
          {MONTH_NAMES.map((name, i) => {
            const brands = monthHeat[i + 1] || []
            const intensity = brands.length
            const isCurrent = i + 1 === currentMonth
            return (
              <div key={name} className={`rounded-lg p-3 text-center border relative ${isCurrent ? "ring-2 ring-teal-500 ring-offset-1 ring-offset-white" : ""} ${intensity >= 3 ? "bg-[var(--bg-card)] border-[var(--border)]/30" : intensity >= 2 ? "bg-[var(--bg-card)] border-[var(--border)]/30" : intensity >= 1 ? "bg-[var(--bg-card)] border-[var(--border)]/30" : "bg-[var(--bg-secondary)] border-[var(--border)]"}`}>
                {isCurrent && <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0 rounded-full bg-teal-500 text-[8px] font-bold text-white uppercase tracking-wider">Now</span>}
                <p className="text-xs font-medium text-[var(--text-primary)]">{name}</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{intensity}</p>
                <p className="text-[9px] text-[var(--text-muted)]">{[...new Set(brands)].join(", ")}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Now Banner */}
      {activeNow.length > 0 && (
        <div className="rounded-xl bg-teal-50 border border-teal-500/30 p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            Active This Month — {MONTH_NAMES[currentMonth - 1]}
          </h2>
          <div className="space-y-2">
            {activeNow.map(p => (
              <div key={p.id} className="flex items-start gap-3 rounded-lg bg-[var(--bg-primary)] p-3">
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] flex-shrink-0 mt-0.5">{p.brand}</span>
                <div>
                  <p className="text-sm text-[var(--text-primary)]">{p.observation}</p>
                  <p className="text-xs text-[var(--text-primary)] mt-0.5">→ {p.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-teal-500/30 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Seasonal Pattern</h3>
          <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Brand</label>
            <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none">
              {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b}>{b}</option>)}
            </select></div>
          <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Observation</label>
            <textarea value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} rows={2} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none resize-none" /></div>
          <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Action</label>
            <textarea value={form.action} onChange={e => setForm({...form, action: e.target.value})} rows={2} className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none resize-none" /></div>
          <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Affected Months</label>
            <div className="flex gap-2 flex-wrap">
              {MONTH_NAMES.map((name, i) => (
                <button type="button" key={i} onClick={() => toggleMonth(i + 1)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.months.includes(i + 1) ? "bg-teal-50 text-[var(--text-primary)] border border-teal-500/30" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm">Cancel</button>
            <button type="button" onClick={() => void submit()} disabled={!form.observation} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50">Save Pattern</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-[var(--bg-primary)] animate-pulse" />)}</div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Retry</button>
        </div>
      ) : patterns.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-12 text-center">
          <Calendar className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No seasonal patterns tracked</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patterns.map(p => (
            <div key={p.id} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4 hover:border-[var(--border)] transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">{p.brand}</span>
                <div className="flex gap-1">
                  {(p.months as number[]).sort((a, b) => a - b).map(m => (
                    <span key={m} className="px-1.5 py-0.5 rounded bg-teal-50 text-[var(--text-primary)] text-[10px] font-medium">{MONTH_NAMES[m - 1]}</span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-[var(--text-primary)]">📊 {p.observation}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">→ {p.action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
