"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { Building2, RefreshCw, ChevronDown, ChevronRight, Filter } from "lucide-react"

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
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  async function load() {
    setLoading(true)
    const res = await fetch("/api/pipeline/brand-pods")
    const data = await res.json()
    setPods(data.pods || [])
    setLoading(false)
  }

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])
  useEffect(() => { load() }, [])

  const filteredPods = brandFilter === "__all__" ? pods : pods.filter(p => p.brand === brandFilter)

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Stage 2: Brand Pods
          </h1>
          <p className="text-sm text-slate-500 mt-1">5 brands, each with dedicated messaging lanes, channel mix, and KPIs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none">
          <option value="__all__">All Brands</option>
          {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{filteredPods.length} pods</span>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-white animate-pulse" />)}</div>
      ) : filteredPods.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-100 mx-auto mb-3" />
          <p className="text-slate-400">No brand pods configured</p>
          <p className="text-xs text-slate-400 mt-1">Create brand pods via the API to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPods.map(pod => (
            <div key={pod.id} className="rounded-xl bg-white border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
              <button onClick={() => toggle(pod.id)} className="w-full p-5 flex items-center justify-between text-left">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${BRAND_COLORS[pod.brand] || "from-slate-400 to-slate-500"} flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">{pod.brand.substring(0, 2)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{pod.name}</h3>
                    <p className="text-sm text-slate-500">{pod.audience}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-600">{pod.messagingLanes.length} lanes</p>
                    <p className="text-xs text-slate-400">{pod._count.campaigns} campaigns</p>
                  </div>
                  {expanded[pod.id] ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {expanded[pod.id] && (
                <div className="border-t border-slate-200 p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Core Offer</p>
                      <p className="text-sm text-slate-600">{pod.coreOffer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Core Message</p>
                      <p className="text-sm text-slate-600 italic">&ldquo;{pod.coreMessage}&rdquo;</p>
                    </div>
                  </div>

                  {/* Channel Mix */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Channel Budget Allocation</p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(pod.channelMix || {}).sort(([,a], [,b]) => (b as number) - (a as number)).map(([ch, pct]) => (
                        <div key={ch} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-xs text-slate-500 capitalize">{ch.replace("_", " ")}</span>
                          <span className="text-sm font-bold text-slate-900 ml-2">{pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Messaging Lanes */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Messaging Lanes</p>
                    <div className="space-y-2">
                      {pod.messagingLanes.map(lane => (
                        <div key={lane.id} className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-700">{lane.lane}</p>
                              <p className="text-xs text-slate-500 italic mt-0.5">&ldquo;{lane.message}&rdquo;</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] text-slate-400">Content: {lane.contentTypes}</span>
                                <span className="text-[10px] text-slate-400">Target: {lane.target}</span>
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
