"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { Lightbulb, RefreshCw, Plus, Filter, Brain, TrendingUp, MessageSquare, Calendar, Shield, Archive, Zap } from "lucide-react"

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
  { value: "campaign_pattern", label: "Campaign Patterns", icon: TrendingUp, color: "text-blue-600" },
  { value: "funnel_optimization", label: "Funnel Optimization", icon: Zap, color: "text-cyan-600" },
  { value: "content_feedback", label: "Content Feedback", icon: MessageSquare, color: "text-emerald-600" },
  { value: "seasonal", label: "Seasonal Timing", icon: Calendar, color: "text-orange-600" },
  { value: "competitive", label: "Competitive Response", icon: Shield, color: "text-red-600" },
]

const confidenceColors: Record<string, string> = { high: "bg-green-50 text-emerald-600", medium: "bg-yellow-50 text-amber-600", low: "bg-slate-50 text-slate-500" }
const statusColors: Record<string, string> = { active: "bg-green-50 text-emerald-600", testing: "bg-blue-50 text-blue-600", deprecated: "bg-slate-50 text-slate-500" }

export default function LearningPage() {
  const { activeBrand } = useBrand()
  const [rules, setRules] = useState<LearningRule[]>([])
  const [loading, setLoading] = useState(true)
  const [loopFilter, setLoopFilter] = useState("__all__")
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ brand: "TBF", dataSource: "", rule: "", confidence: "medium", appliesTo: "", loopType: "campaign_pattern" })

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (brandFilter !== "__all__") params.set("brand", brandFilter)
    if (loopFilter !== "__all__") params.set("loopType", loopFilter)
    const res = await fetch(`/api/pipeline/learning?${params}`)
    const data = await res.json()
    setRules(data.rules || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [loopFilter, brandFilter])

  async function submit() {
    await fetch("/api/pipeline/learning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setShowForm(false)
    setForm({ brand: "TBF", dataSource: "", rule: "", confidence: "medium", appliesTo: "", loopType: "campaign_pattern" })
    load()
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/pipeline/learning", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
    load()
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-pink-600" /> Stage 9: Learning Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">5 feedback loops that make campaigns smarter every cycle — the unfair advantage</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-medium hover:bg-pink-500">
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
            <button key={lt.value} onClick={() => setLoopFilter(loopFilter === lt.value ? "__all__" : lt.value)}
              className={`rounded-lg p-3 text-left transition-colors ${loopFilter === lt.value ? "bg-pink-50 border border-pink-500/30" : "bg-white border border-slate-200 hover:border-slate-200"}`}>
              <Icon className={`w-5 h-5 ${lt.color} mb-1`} />
              <p className="text-xs font-medium text-slate-700">{lt.label}</p>
              <p className="text-lg font-bold text-slate-900">{count}</p>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none">
          <option value="__all__">All Brands</option>
          {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b}>{b}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{rules.length} rules</span>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white border border-pink-500/30 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">New Learning Rule</h3>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs text-slate-500 mb-1">Brand</label>
              <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none">
                {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark", "all"].map(b => <option key={b}>{b}</option>)}
              </select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Loop Type</label>
              <select value={form.loopType} onChange={e => setForm({...form, loopType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none">
                {LOOP_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
              </select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Confidence</label>
              <select value={form.confidence} onChange={e => setForm({...form, confidence: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none">
                {["high", "medium", "low"].map(c => <option key={c}>{c}</option>)}
              </select></div>
          </div>
          <div><label className="block text-xs text-slate-500 mb-1">Rule (plain-language insight)</label>
            <textarea value={form.rule} onChange={e => setForm({...form, rule: e.target.value})} rows={2} placeholder='e.g., "TBF Facebook ads with before/after creative have 2.1x lower CPA than drill demo creative"' className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none resize-none placeholder:text-slate-400" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-slate-500 mb-1">Data Source (campaigns)</label>
              <input value={form.dataSource} onChange={e => setForm({...form, dataSource: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Applies To (stage)</label>
              <input value={form.appliesTo} onChange={e => setForm({...form, appliesTo: e.target.value})} placeholder="e.g., Stage 3 Assembly, Stage 5 Deployment" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none placeholder:text-slate-400" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-50 text-slate-500 text-sm">Cancel</button>
            <button onClick={submit} disabled={!form.rule} className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-medium disabled:opacity-50">Save Rule</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white animate-pulse" />)}</div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-12 text-center">
          <Brain className="w-12 h-12 text-slate-100 mx-auto mb-3" />
          <p className="text-slate-400">No learning rules yet</p>
          <p className="text-xs text-slate-400 mt-1">Rules are generated after 10+ campaigns per brand, or added manually from insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(r => {
            const lt = LOOP_TYPES.find(l => l.value === r.loopType)
            const Icon = lt?.icon || Lightbulb
            return (
              <div key={r.id} className="rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${lt?.color || "text-slate-500"}`} />
                    <div>
                      <p className="text-sm text-slate-700">{r.rule}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-50 text-xs text-slate-500">{r.brand}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${confidenceColors[r.confidence]}`}>{r.confidence}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span>
                        {r.appliesTo && <span className="text-[10px] text-slate-400">→ {r.appliesTo}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    {r.status === "active" && <button onClick={() => updateStatus(r.id, "deprecated")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Deprecate"><Archive className="w-4 h-4" /></button>}
                    {r.status === "testing" && <button onClick={() => updateStatus(r.id, "active")} className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-emerald-600" title="Activate"><Zap className="w-4 h-4" /></button>}
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
