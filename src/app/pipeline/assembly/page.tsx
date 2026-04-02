"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { Layers, RefreshCw, CheckCircle, Clock, ArrowRight, Plus, ChevronDown, ChevronRight, Filter } from "lucide-react"

interface Assembly { id: string; campaignId: string; step: number; stepName: string; status: string; notes: string | null; completedAt: string | null; campaign: { name: string; brandPod: { brand: string } } }

const stepColors: Record<string, string> = { pending: "bg-[var(--bg-secondary)]", in_progress: "bg-[var(--text-primary)]", completed: "bg-[var(--bg-card)]0", blocked: "bg-[var(--bg-card)]0" }

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
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"><Layers className="w-6 h-6 text-[var(--text-primary)]" /> Stage 5: Assembly Line</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">7-step campaign assembly — Copy, Funnels, Ads, Emails, Social, Quality Gate</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none">
          <option value="__all__">All Brands</option>
          {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <span className="text-xs text-[var(--text-muted)] ml-auto">{Object.keys(grouped).length} campaigns</span>
      </div>

      {/* Assembly line legend */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--bg-secondary)]" /> Pending</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--text-primary)]" /> In Progress</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--bg-card)]0" /> Completed</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--bg-card)]0" /> Blocked</span>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-[var(--bg-primary)] animate-pulse" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-12 text-center">
          <Layers className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No assembly lines active</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Move a campaign to &quot;assembling&quot; status to create its assembly line</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([campaignKey, steps]) => (
            <div key={campaignKey} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{campaignKey}</h3>
              <div className="flex items-center gap-2">
                {steps.sort((a, b) => a.step - b.step).map((step, i) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-5 h-5 rounded-full ${stepColors[step.status]} flex items-center justify-center ${step.status === "pending" ? "text-[var(--text-primary)]" : "text-white"} text-[10px] font-bold`}>
                          {step.status === "completed" ? "✓" : step.step}
                        </div>
                        <span className="text-xs font-medium text-[var(--text-secondary)]">{step.stepName}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {step.status === "pending" && <button onClick={() => updateStep(step.id, "in_progress")} className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]">Start</button>}
                        {step.status === "in_progress" && <button onClick={() => updateStep(step.id, "completed")} className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]">Complete</button>}
                        {step.status === "in_progress" && <button onClick={() => updateStep(step.id, "blocked")} className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]">Block</button>}
                        {step.status === "blocked" && <button onClick={() => updateStep(step.id, "in_progress")} className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]">Unblock</button>}
                      </div>
                    </div>
                    {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-[var(--text-muted)] mx-1 flex-shrink-0" />}
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
