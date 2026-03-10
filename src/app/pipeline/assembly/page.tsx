"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { Layers, RefreshCw, CheckCircle, Clock, ArrowRight, Plus, ChevronDown, ChevronRight, Filter } from "lucide-react"

interface Assembly { id: string; campaignId: string; step: number; stepName: string; status: string; notes: string | null; completedAt: string | null; campaign: { name: string; brandPod: { brand: string } } }

const stepColors: Record<string, string> = { pending: "bg-slate-100", in_progress: "bg-blue-500", completed: "bg-green-500", blocked: "bg-red-500" }

export default function AssemblyPage() {
  const { activeBrand } = useBrand()
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [loading, setLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState("__all__")

  async function load() {
    setLoading(true)
    const res = await fetch("/api/pipeline/assembly")
    const data = await res.json()
    setAssemblies(data.assemblies || [])
    setLoading(false)
  }

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])
  useEffect(() => { load() }, [])

  const filtered = brandFilter === "__all__" ? assemblies : assemblies.filter(a => a.campaign?.brandPod?.brand === brandFilter)
  const grouped = filtered.reduce<Record<string, Assembly[]>>((g, a) => {
    const key = `${a.campaign?.brandPod?.brand} — ${a.campaign?.name}`
    if (!g[key]) g[key] = []
    g[key].push(a)
    return g
  }, {})

  async function updateStep(id: string, status: string) {
    await fetch("/api/pipeline/assembly", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, completedAt: status === "completed" ? new Date().toISOString() : undefined }) })
    load()
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Layers className="w-6 h-6 text-cyan-600" /> Stage 5: Assembly Line</h1>
          <p className="text-sm text-slate-500 mt-1">7-step campaign assembly — Copy, Funnels, Ads, Emails, Social, Quality Gate</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none">
          <option value="__all__">All Brands</option>
          {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{Object.keys(grouped).length} campaigns</span>
      </div>

      {/* Assembly line legend */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-100" /> Pending</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /> In Progress</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /> Completed</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /> Blocked</span>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white animate-pulse" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-100 mx-auto mb-3" />
          <p className="text-slate-400">No assembly lines active</p>
          <p className="text-xs text-slate-400 mt-1">Move a campaign to &quot;assembling&quot; status to create its assembly line</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([campaignKey, steps]) => (
            <div key={campaignKey} className="rounded-xl bg-white border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">{campaignKey}</h3>
              <div className="flex items-center gap-2">
                {steps.sort((a, b) => a.step - b.step).map((step, i) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex-1 rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-5 h-5 rounded-full ${stepColors[step.status]} flex items-center justify-center ${step.status === "pending" ? "text-slate-700" : "text-white"} text-[10px] font-bold`}>
                          {step.status === "completed" ? "✓" : step.step}
                        </div>
                        <span className="text-xs font-medium text-slate-600">{step.stepName}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {step.status === "pending" && <button onClick={() => updateStep(step.id, "in_progress")} className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100">Start</button>}
                        {step.status === "in_progress" && <button onClick={() => updateStep(step.id, "completed")} className="px-2 py-0.5 rounded text-[10px] bg-green-50 text-emerald-600 hover:bg-green-100">Complete</button>}
                        {step.status === "in_progress" && <button onClick={() => updateStep(step.id, "blocked")} className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-600 hover:bg-red-100">Block</button>}
                        {step.status === "blocked" && <button onClick={() => updateStep(step.id, "in_progress")} className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100">Unblock</button>}
                      </div>
                    </div>
                    {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-slate-400 mx-1 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
