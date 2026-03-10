"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { FileText, Plus, RefreshCw, Filter, Clock, CheckCircle, Package, AlertTriangle, Send } from "lucide-react"

interface Brief {
  id: string
  brand: string
  campaignName: string
  campaignGoal: string
  targetAudience: string
  messagingLane: string
  keyMessage: string
  cta: string
  assetsNeeded: { type: string; quantity: number; platform: string; requirements: string }[]
  deadline: string | null
  priority: string
  status: string
  contentResponse: string | null
  submittedAt: string
}

const BRANDS = ["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"]
const GOALS = ["awareness", "lead_gen", "enrollment", "sign_up", "retention", "event_promotion"]
const ASSET_TYPES = ["short_video", "mid_video", "long_video", "carousel", "quote_graphic", "thumbnail", "email_asset", "ad_creative"]
const PLATFORMS = ["tiktok", "ig_reels", "ig_feed", "youtube_shorts", "youtube_long", "facebook", "twitter", "email", "meta_ads", "google_ads"]
const statusColors: Record<string, string> = { submitted: "bg-blue-50 text-blue-600", acknowledged: "bg-cyan-50 text-cyan-600", in_production: "bg-yellow-50 text-amber-600", delivered: "bg-green-50 text-emerald-600", cancelled: "bg-red-50 text-red-600" }

export default function CreativeBriefsPage() {
  const { activeBrand } = useBrand()
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [statusFilter, setStatusFilter] = useState("__all__")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    brand: "TBF", campaignName: "", campaignGoal: "awareness", targetAudience: "",
    messagingLane: "", keyMessage: "", cta: "", deadline: "", priority: "standard",
    assetsNeeded: [{ type: "short_video", quantity: 3, platform: "tiktok", requirements: "" }],
  })

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (brandFilter !== "__all__") params.set("brand", brandFilter)
    if (statusFilter !== "__all__") params.set("status", statusFilter)
    const res = await fetch(`/api/pipeline/creative-briefs?${params}`)
    const data = await res.json()
    setBriefs(data.briefs || [])
    setLoading(false)
  }

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])
  useEffect(() => { load() }, [brandFilter, statusFilter])

  async function submit() {
    const data = { ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined }
    await fetch("/api/pipeline/creative-briefs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    setShowForm(false)
    load()
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/pipeline/creative-briefs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
    load()
  }

  function addAsset() {
    setForm(prev => ({ ...prev, assetsNeeded: [...prev.assetsNeeded, { type: "short_video", quantity: 1, platform: "tiktok", requirements: "" }] }))
  }

  function updateAsset(idx: number, field: string, value: string | number) {
    setForm(prev => {
      const assets = [...prev.assetsNeeded]
      assets[idx] = { ...assets[idx], [field]: value }
      return { ...prev, assetsNeeded: assets }
    })
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-600" />
            Creative Briefs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Asset requests sent to the Content Division — the Marketing → Content handoff</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500">
            <Plus className="w-4 h-4" /> New Brief
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none">
          <option value="__all__">All Brands</option>
          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none">
          <option value="__all__">All Statuses</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{briefs.length} briefs</span>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white border border-cyan-500/30 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">New Creative Brief → Content Division</h3>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs text-slate-500 mb-1">Brand</label>
              <select value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none">
                {BRANDS.map(b => <option key={b}>{b}</option>)}
              </select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Campaign Name</label>
              <input value={form.campaignName} onChange={e => setForm({...form, campaignName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Goal</label>
              <select value={form.campaignGoal} onChange={e => setForm({...form, campaignGoal: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none">
                {GOALS.map(g => <option key={g} value={g}>{g.replace("_", " ")}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-slate-500 mb-1">Key Message</label>
              <textarea value={form.keyMessage} onChange={e => setForm({...form, keyMessage: e.target.value})} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none resize-none" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">CTA</label>
              <input value={form.cta} onChange={e => setForm({...form, cta: e.target.value})} placeholder="e.g., Book your free trial" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none placeholder:text-slate-400" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs text-slate-500 mb-1">Messaging Lane</label>
              <input value={form.messagingLane} onChange={e => setForm({...form, messagingLane: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Target Audience</label>
              <input value={form.targetAudience} onChange={e => setForm({...form, targetAudience: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none" /></div>
            <div className="flex gap-2">
              <div className="flex-1"><label className="block text-xs text-slate-500 mb-1">Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none" /></div>
              <div><label className="block text-xs text-slate-500 mb-1">Priority</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none">
                  {["urgent", "standard", "backlog"].map(p => <option key={p}>{p}</option>)}
                </select></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-500">Assets Needed</label>
              <button onClick={addAsset} className="text-xs text-cyan-600 hover:text-cyan-500">+ Add asset</button>
            </div>
            {form.assetsNeeded.map((asset, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                <select value={asset.type} onChange={e => updateAsset(idx, "type", e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 outline-none">
                  {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <input type="number" value={asset.quantity} onChange={e => updateAsset(idx, "quantity", parseInt(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 outline-none placeholder:text-slate-400" placeholder="Qty" />
                <select value={asset.platform} onChange={e => updateAsset(idx, "platform", e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 outline-none">
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
                <input value={asset.requirements} onChange={e => updateAsset(idx, "requirements", e.target.value)} placeholder="Specific requirements..." className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 outline-none placeholder:text-slate-400" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-50 text-slate-500 text-sm">Cancel</button>
            <button onClick={submit} disabled={!form.campaignName || !form.keyMessage} className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Submit Brief
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-white animate-pulse" />)}</div>
      ) : briefs.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-100 mx-auto mb-3" />
          <p className="text-slate-400">No creative briefs yet</p>
          <p className="text-xs text-slate-400 mt-1">Submit briefs to request assets from the Content Division</p>
        </div>
      ) : (
        <div className="space-y-3">
          {briefs.map(b => (
            <div key={b.id} className="rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">{b.campaignName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status]}`}>{b.status.replace("_", " ")}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-500">{b.brand}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-500">{b.priority}</span>
                  </div>
                  <p className="text-xs text-slate-600 italic mb-1">&ldquo;{b.keyMessage}&rdquo;</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>CTA: {b.cta}</span>
                    <span>Lane: {b.messagingLane}</span>
                    <span>Goal: {b.campaignGoal.replace("_", " ")}</span>
                    {b.deadline && <span>Due: {new Date(b.deadline).toLocaleDateString()}</span>}
                  </div>
                  {(b.assetsNeeded as Brief["assetsNeeded"])?.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {(b.assetsNeeded as Brief["assetsNeeded"]).map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-slate-50 text-[10px] text-slate-500 border border-slate-200">
                          {a.quantity}× {a.type} ({a.platform})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  {b.status === "submitted" && <button onClick={() => updateStatus(b.id, "acknowledged")} className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600" title="Acknowledge"><CheckCircle className="w-4 h-4" /></button>}
                  {b.status === "acknowledged" && <button onClick={() => updateStatus(b.id, "in_production")} className="p-1.5 rounded-lg hover:bg-yellow-50 text-slate-400 hover:text-amber-600" title="Mark in production"><Package className="w-4 h-4" /></button>}
                  {b.status === "in_production" && <button onClick={() => updateStatus(b.id, "delivered")} className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-emerald-600" title="Mark delivered"><CheckCircle className="w-4 h-4" /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
