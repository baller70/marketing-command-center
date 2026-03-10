"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { Calendar, RefreshCw, Plus, Filter, Sun, Snowflake, Leaf, TreePine } from "lucide-react"

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
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ brand: "TBF", observation: "", action: "", months: [] as number[] })

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (brandFilter !== "__all__") params.set("brand", brandFilter)
    const res = await fetch(`/api/pipeline/seasonal?${params}`)
    const data = await res.json()
    setPatterns(data.patterns || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [brandFilter])

  async function submit() {
    await fetch("/api/pipeline/seasonal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setShowForm(false)
    setForm({ brand: "TBF", observation: "", action: "", months: [] })
    load()
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600" /> Seasonal Patterns
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track how performance varies by season, events, and market conditions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-500">
            <Plus className="w-4 h-4" /> Add Pattern
          </button>
        </div>
      </div>

      {/* 12-month heatmap */}
      <div className="rounded-xl bg-white border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Annual Marketing Activity Heatmap</h2>
        <div className="grid grid-cols-12 gap-2">
          {MONTH_NAMES.map((name, i) => {
            const brands = monthHeat[i + 1] || []
            const intensity = brands.length
            const isCurrent = i + 1 === currentMonth
            return (
              <div key={name} className={`rounded-lg p-3 text-center border relative ${isCurrent ? "ring-2 ring-teal-500 ring-offset-1 ring-offset-white" : ""} ${intensity >= 3 ? "bg-red-50 border-red-500/30" : intensity >= 2 ? "bg-orange-50 border-orange-500/30" : intensity >= 1 ? "bg-yellow-50 border-yellow-500/30" : "bg-slate-50 border-slate-200"}`}>
                {isCurrent && <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0 rounded-full bg-teal-500 text-[8px] font-bold text-white uppercase tracking-wider">Now</span>}
                <p className="text-xs font-medium text-slate-700">{name}</p>
                <p className="text-lg font-bold text-slate-900">{intensity}</p>
                <p className="text-[9px] text-slate-400">{[...new Set(brands)].join(", ")}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Now Banner */}
      {activeNow.length > 0 && (
        <div className="rounded-xl bg-teal-50 border border-teal-500/30 p-5">
          <h2 className="text-sm font-semibold text-teal-600 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            Active This Month — {MONTH_NAMES[currentMonth - 1]}
          </h2>
          <div className="space-y-2">
            {activeNow.map(p => (
              <div key={p.id} className="flex items-start gap-3 rounded-lg bg-white p-3">
                <span className="px-2 py-0.5 rounded-full bg-slate-50 text-xs text-slate-600 flex-shrink-0 mt-0.5">{p.brand}</span>
                <div>
                  <p className="text-sm text-slate-700">{p.observation}</p>
                  <p className="text-xs text-teal-600 mt-0.5">→ {p.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl bg-white border border-teal-500/30 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">New Seasonal Pattern</h3>
          <div><label className="block text-xs text-slate-500 mb-1">Brand</label>
            <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none">
              {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b}>{b}</option>)}
            </select></div>
          <div><label className="block text-xs text-slate-500 mb-1">Observation</label>
            <textarea value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none resize-none" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Action</label>
            <textarea value={form.action} onChange={e => setForm({...form, action: e.target.value})} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none resize-none" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Affected Months</label>
            <div className="flex gap-2 flex-wrap">
              {MONTH_NAMES.map((name, i) => (
                <button key={i} onClick={() => toggleMonth(i + 1)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.months.includes(i + 1) ? "bg-teal-50 text-teal-600 border border-teal-500/30" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-50 text-slate-500 text-sm">Cancel</button>
            <button onClick={submit} disabled={!form.observation} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50">Save Pattern</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white animate-pulse" />)}</div>
      ) : patterns.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-100 mx-auto mb-3" />
          <p className="text-slate-400">No seasonal patterns tracked</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patterns.map(p => (
            <div key={p.id} className="rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-50 text-xs text-slate-500">{p.brand}</span>
                <div className="flex gap-1">
                  {(p.months as number[]).sort((a, b) => a - b).map(m => (
                    <span key={m} className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-600 text-[10px] font-medium">{MONTH_NAMES[m - 1]}</span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-700">📊 {p.observation}</p>
              <p className="text-xs text-slate-500 mt-1">→ {p.action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
