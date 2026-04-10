"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { AlertTriangle, Building2, ChevronDown, ChevronRight, RefreshCw, Filter } from "lucide-react"

interface MessagingLane {
  id: string
  lane: string
  message: string
  contentTypes: string
  target: string
  status: string
}

interface BrandPod {
  id: string
  brand: string
  name: string
  audience: string
  coreOffer: string
  coreMessage: string
  channelMix: Record<string, number>
  kpiTargets: Record<string, unknown>
  status: string
  messagingLanes: MessagingLane[]
  _count: { campaigns: number }
}

const BRAND_COLORS: Record<string, string> = {
  TBF: "from-orange-600 to-orange-700",
  RA1: "from-red-600 to-red-700",
  ShotIQ: "from-blue-600 to-blue-700",
  HoS: "from-green-600 to-green-700",
  Bookmark: "from-purple-600 to-purple-700",
}


export default function BrandPodsPage() {
  const { activeBrand } = useBrand()
  const [pods, setPods] = useState<BrandPod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  async function load() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/pipeline/brand-pods")
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setPods(data.pods || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])
  useEffect(() => { void load() }, [])

  const filteredPods = brandFilter === "__all__" ? pods : pods.filter(p => p.brand === brandFilter)

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[var(--text-primary)]" />
            Stage 2: Brand Pods
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">5 brands, each with dedicated messaging lanes, channel mix, and KPIs</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none">
          <option value="__all__">All Brands</option>
          {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <span className="text-xs text-[var(--text-muted)] ml-auto">{filteredPods.length} pods</span>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-[var(--bg-primary)] animate-pulse" />)}</div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Retry</button>
        </div>
      ) : filteredPods.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-12 text-center">
          <Building2 className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No brand pods configured</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Create brand pods via the API to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPods.map(pod => (
            <div key={pod.id} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] overflow-hidden hover:border-[var(--border)] transition-colors">
              <button type="button" onClick={() => toggle(pod.id)} className="w-full p-5 flex items-center justify-between text-left">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${BRAND_COLORS[pod.brand] || "from-slate-400 to-slate-500"} flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">{pod.brand.substring(0, 2)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{pod.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{pod.audience}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-[var(--text-secondary)]">{pod.messagingLanes.length} lanes</p>
                    <p className="text-xs text-[var(--text-muted)]">{pod._count.campaigns} campaigns</p>
                  </div>
                  {expanded[pod.id] ? <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />}
                </div>
              </button>

              {expanded[pod.id] && (
                <div className="border-t border-[var(--border)] p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Core Offer</p>
                      <p className="text-sm text-[var(--text-secondary)]">{pod.coreOffer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Core Message</p>
                      <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{pod.coreMessage}&rdquo;</p>
                    </div>
                  </div>

                  {/* Channel Mix */}
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-2">Channel Budget Allocation</p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(pod.channelMix || {}).sort(([,a], [,b]) => (b as number) - (a as number)).map(([ch, pct]) => (
                        <div key={ch} className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                          <span className="text-xs text-[var(--text-secondary)] capitalize">{ch.replace("_", " ")}</span>
                          <span className="text-sm font-bold text-[var(--text-primary)] ml-2">{pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Messaging Lanes */}
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-2">Messaging Lanes</p>
                    <div className="space-y-2">
                      {pod.messagingLanes.map(lane => (
                        <div key={lane.id} className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)]">{lane.lane}</p>
                              <p className="text-xs text-[var(--text-secondary)] italic mt-0.5">&ldquo;{lane.message}&rdquo;</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] text-[var(--text-muted)]">Content: {lane.contentTypes}</span>
                                <span className="text-[10px] text-[var(--text-muted)]">Target: {lane.target}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
