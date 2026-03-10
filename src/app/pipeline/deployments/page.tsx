"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { Send, RefreshCw, Filter, Plus, Play, Pause, CheckCircle, ExternalLink } from "lucide-react"

interface Deployment {
  id: string
  channel: string
  platform: string | null
  budget: number
  budgetSpent: number
  status: string
  launchedAt: string | null
  campaign: { name: string; brandPod: { brand: string } }
  createdAt: string
}

const channelIcons: Record<string, string> = {
  instagram: "📸", tiktok: "🎵", facebook: "📘", youtube: "▶️", email: "📧",
  google_ads: "🔍", sms: "💬", twitter: "🐦", linkedin: "💼", in_app: "📱",
  local_partnerships: "🤝",
}
const statusColors: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-600", live: "bg-green-50 text-emerald-600",
  paused: "bg-orange-50 text-orange-600", completed: "bg-purple-50 text-violet-600",
}

export default function DeploymentsPage() {
  const { activeBrand } = useBrand()
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [channelFilter, setChannelFilter] = useState("__all__")
  const [statusFilter, setStatusFilter] = useState("__all__")

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (brandFilter !== "__all__") params.set("brand", brandFilter)
    if (channelFilter !== "__all__") params.set("channel", channelFilter)
    if (statusFilter !== "__all__") params.set("status", statusFilter)
    const res = await fetch(`/api/pipeline/deployments?${params}`)
    const data = await res.json()
    setDeployments(data.deployments || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [brandFilter, channelFilter, statusFilter])

  async function updateStatus(id: string, status: string) {
    await fetch("/api/pipeline/deployments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...(status === "live" ? { launchedAt: new Date().toISOString() } : {}) }),
    })
    load()
  }

  const channels = [...new Set(deployments.map(d => d.channel))]
  const liveCount = deployments.filter(d => d.status === "live").length
  const totalBudget = deployments.reduce((sum, d) => sum + d.budget, 0)
  const totalSpent = deployments.reduce((sum, d) => sum + d.budgetSpent, 0)

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-emerald-600" /> Stage 7: Channel Deployment
          </h1>
          <p className="text-sm text-slate-500 mt-1">Deploy campaigns to the right channels at the right time — organic + paid coordination</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-400">Total Deployments</p>
          <p className="text-2xl font-bold text-slate-900">{deployments.length}</p>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-400">Live Now</p>
          <p className="text-2xl font-bold text-emerald-600">{liveCount}</p>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-400">Total Budget</p>
          <p className="text-2xl font-bold text-slate-900">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-400">Total Spent</p>
          <p className="text-2xl font-bold text-orange-600">${totalSpent.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none">
          <option value="__all__">All Brands</option>
          {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none">
          <option value="__all__">All Channels</option>
          {Object.keys(channelIcons).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none">
          <option value="__all__">All Statuses</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white animate-pulse" />)}</div>
      ) : deployments.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-12 text-center">
          <Send className="w-12 h-12 text-slate-100 mx-auto mb-3" />
          <p className="text-slate-400">No channel deployments yet</p>
          <p className="text-xs text-slate-400 mt-1">Campaigns are deployed after passing the Quality Gate</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deployments.map(d => (
            <div key={d.id} className="rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-200 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{channelIcons[d.channel] || "📢"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 capitalize">{d.channel.replace("_", " ")}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status]}`}>{d.status}</span>
                      {d.platform && <span className="px-2 py-0.5 rounded-full bg-slate-50 text-xs text-slate-500">{d.platform}</span>}
                    </div>
                    <p className="text-xs text-slate-400">{d.campaign?.brandPod?.brand} — {d.campaign?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-900 font-medium">${d.budget.toLocaleString()}</p>
                    {d.budgetSpent > 0 && <p className="text-xs text-slate-400">Spent: ${d.budgetSpent.toLocaleString()}</p>}
                  </div>
                  <div className="flex gap-1">
                    {d.status === "scheduled" && <button onClick={() => updateStatus(d.id, "live")} className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-emerald-600"><Play className="w-4 h-4" /></button>}
                    {d.status === "live" && <button onClick={() => updateStatus(d.id, "paused")} className="p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-600"><Pause className="w-4 h-4" /></button>}
                    {d.status === "paused" && <button onClick={() => updateStatus(d.id, "live")} className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-emerald-600"><Play className="w-4 h-4" /></button>}
                    {["live", "paused"].includes(d.status) && <button onClick={() => updateStatus(d.id, "completed")} className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-violet-600"><CheckCircle className="w-4 h-4" /></button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
