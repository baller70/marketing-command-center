"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { TrendingUp, RefreshCw, Filter, BarChart3, DollarSign, Users, MousePointerClick, Eye, Target } from "lucide-react"

interface Metric {
  id: string
  brand: string
  channel: string
  dateRange: string
  impressions: number
  reach: number
  clicks: number
  ctr: number
  engagementRate: number
  leadsGenerated: number
  costPerLead: number
  enrollments: number
  costPerEnrollment: number
  revenueGenerated: number
  roas: number
  budgetSpent: number
  openRate: number
  clickRate: number
  campaign: { name: string; brandPod: { brand: string } }
}

interface Totals {
  impressions: number
  clicks: number
  leadsGenerated: number
  enrollments: number
  revenueGenerated: number
  budgetSpent: number
}

const BRANDS = ["__all__", "TBF", "RA1", "ShotIQ", "HoS", "Bookmark"]

export default function PerformancePage() {
  const { activeBrand } = useBrand()
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [totals, setTotals] = useState<Totals>({ impressions: 0, clicks: 0, leadsGenerated: 0, enrollments: 0, revenueGenerated: 0, budgetSpent: 0 })
  const [loading, setLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState("__all__")

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (brandFilter !== "__all__") params.set("brand", brandFilter)
    const res = await fetch(`/api/pipeline/performance?${params}`)
    const data = await res.json()
    setMetrics(data.metrics || [])
    setTotals(data.totals || { impressions: 0, clicks: 0, leadsGenerated: 0, enrollments: 0, revenueGenerated: 0, budgetSpent: 0 })
    setLoading(false)
  }

  useEffect(() => { load() }, [brandFilter])

  const overallROAS = totals.budgetSpent > 0 ? (totals.revenueGenerated / totals.budgetSpent).toFixed(1) : "—"
  const overallCPL = totals.leadsGenerated > 0 ? (totals.budgetSpent / totals.leadsGenerated).toFixed(2) : "—"
  const overallCTR = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "—"

  const statCards = [
    { label: "Impressions", value: totals.impressions.toLocaleString(), icon: Eye, color: "text-blue-600" },
    { label: "Clicks", value: totals.clicks.toLocaleString(), icon: MousePointerClick, color: "text-cyan-600" },
    { label: "CTR", value: `${overallCTR}%`, icon: Target, color: "text-violet-600" },
    { label: "Leads", value: totals.leadsGenerated.toLocaleString(), icon: Users, color: "text-emerald-600" },
    { label: "CPL", value: `$${overallCPL}`, icon: DollarSign, color: "text-amber-600" },
    { label: "Enrollments", value: totals.enrollments.toLocaleString(), icon: CheckCircle, color: "text-emerald-600" },
    { label: "Revenue", value: `$${totals.revenueGenerated.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600" },
    { label: "ROAS", value: `${overallROAS}x`, icon: TrendingUp, color: totals.revenueGenerated > totals.budgetSpent ? "text-emerald-600" : "text-red-600" },
  ]

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-600" /> Stage 8: Performance Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-1">Campaign performance metrics + revenue attribution — every dollar traceable</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 outline-none">
          {BRANDS.map(b => <option key={b} value={b}>{b === "__all__" ? "All Brands" : b}</option>)}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-lg bg-white border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{card.label}</p>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Actual vs Target Progress */}
      <div className="rounded-xl bg-white border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Actual vs Target (Month 3 KPIs)</h2>
        <div className="space-y-4">
          {(() => {
            const targets = [
              { brand: "TBF", leadsTarget: 30, revTarget: 5000, enrollTarget: 5 },
              { brand: "RA1", leadsTarget: 50, revTarget: 20000, enrollTarget: 0 },
              { brand: "ShotIQ", leadsTarget: 200, revTarget: 2000, enrollTarget: 10 },
              { brand: "HoS", leadsTarget: 100, revTarget: 10000, enrollTarget: 0 },
              { brand: "Bookmark", leadsTarget: 500, revTarget: 1000, enrollTarget: 15 },
            ]
            // Aggregate actuals from metrics by brand
            const actuals: Record<string, { leads: number; rev: number; enroll: number }> = {}
            metrics.forEach(m => {
              if (!actuals[m.brand]) actuals[m.brand] = { leads: 0, rev: 0, enroll: 0 }
              actuals[m.brand].leads += m.leadsGenerated
              actuals[m.brand].rev += m.revenueGenerated
              actuals[m.brand].enroll += m.enrollments
            })

            const pct = (actual: number, target: number) => target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0
            const barColor = (p: number) => p >= 80 ? "bg-green-500" : p >= 50 ? "bg-yellow-500" : "bg-red-500"

            return targets.map(t => {
              const a = actuals[t.brand] || { leads: 0, rev: 0, enroll: 0 }
              const leadsPct = pct(a.leads, t.leadsTarget)
              const revPct = pct(a.rev, t.revTarget)
              const enrollPct = t.enrollTarget > 0 ? pct(a.enroll, t.enrollTarget) : -1

              return (
                <div key={t.brand} className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-slate-900">{t.brand}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Leads */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 uppercase">Leads</span>
                        <span className="text-xs text-slate-500">{a.leads}/{t.leadsTarget}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(leadsPct)} transition-all`} style={{ width: `${leadsPct}%` }} />
                      </div>
                      <p className={`text-[10px] mt-0.5 ${leadsPct >= 80 ? "text-emerald-600" : leadsPct >= 50 ? "text-amber-600" : "text-red-600"}`}>{leadsPct}%</p>
                    </div>
                    {/* Revenue */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 uppercase">Revenue</span>
                        <span className="text-xs text-slate-500">${a.rev.toLocaleString()}/${t.revTarget >= 1000 ? `$${(t.revTarget/1000)}K` : `$${t.revTarget}`}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(revPct)} transition-all`} style={{ width: `${revPct}%` }} />
                      </div>
                      <p className={`text-[10px] mt-0.5 ${revPct >= 80 ? "text-emerald-600" : revPct >= 50 ? "text-amber-600" : "text-red-600"}`}>{revPct}%</p>
                    </div>
                    {/* Enrollments */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 uppercase">Enrollments</span>
                        <span className="text-xs text-slate-500">{enrollPct >= 0 ? `${a.enroll}/${t.enrollTarget}` : "N/A"}</span>
                      </div>
                      {enrollPct >= 0 ? (
                        <>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor(enrollPct)} transition-all`} style={{ width: `${enrollPct}%` }} />
                          </div>
                          <p className={`text-[10px] mt-0.5 ${enrollPct >= 80 ? "text-emerald-600" : enrollPct >= 50 ? "text-amber-600" : "text-red-600"}`}>{enrollPct}%</p>
                        </>
                      ) : (
                        <div className="h-2 rounded-full bg-slate-50" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          })()}
        </div>
      </div>

      {/* Per-campaign metrics */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white animate-pulse" />)}</div>
      ) : metrics.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-100 mx-auto mb-3" />
          <p className="text-slate-400">No performance data yet</p>
          <p className="text-xs text-slate-400 mt-1">Metrics are recorded as campaigns run and generate data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {metrics.map(m => (
            <div key={m.id} className="rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-200 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">{m.campaign?.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-50 text-xs text-slate-500">{m.brand}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-50 text-xs text-slate-500">{m.channel}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-4 mt-2">
                    <div><p className="text-[10px] text-slate-400">Impressions</p><p className="text-sm text-slate-600">{m.impressions.toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-slate-400">Clicks</p><p className="text-sm text-slate-600">{m.clicks.toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-slate-400">Leads</p><p className="text-sm text-slate-600">{m.leadsGenerated}</p></div>
                    <div><p className="text-[10px] text-slate-400">CPL</p><p className="text-sm text-slate-600">${m.costPerLead.toFixed(2)}</p></div>
                    <div><p className="text-[10px] text-slate-400">Revenue</p><p className="text-sm text-emerald-600">${m.revenueGenerated.toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-slate-400">ROAS</p><p className={`text-sm ${m.roas >= 3 ? "text-emerald-600" : m.roas >= 1 ? "text-amber-600" : "text-red-600"}`}>{m.roas.toFixed(1)}x</p></div>
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

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
}
