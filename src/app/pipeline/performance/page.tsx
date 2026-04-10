"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { AlertTriangle, CheckCircle, TrendingUp, RefreshCw, Filter, BarChart3, DollarSign, Users, MousePointerClick, Eye, Target } from "lucide-react"

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
  const [error, setError] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState("__all__")

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (brandFilter !== "__all__") params.set("brand", brandFilter)
      const res = await fetch(`/api/pipeline/performance?${params}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setMetrics(data.metrics || [])
      setTotals(data.totals || { impressions: 0, clicks: 0, leadsGenerated: 0, enrollments: 0, revenueGenerated: 0, budgetSpent: 0 })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [brandFilter])

  const overallROAS = totals.budgetSpent > 0 ? (totals.revenueGenerated / totals.budgetSpent).toFixed(1) : "—"
  const overallCPL = totals.leadsGenerated > 0 ? (totals.budgetSpent / totals.leadsGenerated).toFixed(2) : "—"
  const overallCTR = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "—"

  const statCards = [
    { label: "Impressions", value: totals.impressions.toLocaleString(), icon: Eye, color: "text-[var(--text-primary)]" },
    { label: "Clicks", value: totals.clicks.toLocaleString(), icon: MousePointerClick, color: "text-[var(--text-primary)]" },
    { label: "CTR", value: `${overallCTR}%`, icon: Target, color: "text-[var(--text-primary)]" },
    { label: "Leads", value: totals.leadsGenerated.toLocaleString(), icon: Users, color: "text-[var(--text-primary)]" },
    { label: "CPL", value: `$${overallCPL}`, icon: DollarSign, color: "text-[var(--text-primary)]" },
    { label: "Enrollments", value: totals.enrollments.toLocaleString(), icon: CheckCircle, color: "text-[var(--text-primary)]" },
    { label: "Revenue", value: `$${totals.revenueGenerated.toLocaleString()}`, icon: DollarSign, color: "text-[var(--text-primary)]" },
    { label: "ROAS", value: `${overallROAS}x`, icon: TrendingUp, color: totals.revenueGenerated > totals.budgetSpent ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]" },
  ]

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[var(--text-primary)]" /> Stage 8: Performance Tracking
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Campaign performance metrics + revenue attribution — every dollar traceable</p>
        </div>
        <button type="button" onClick={() => void load()} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none">
          {BRANDS.map(b => <option key={b} value={b}>{b === "__all__" ? "All Brands" : b}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-[var(--bg-primary)] animate-pulse" />)}</div>
          <div className="h-48 rounded-xl bg-[var(--bg-primary)] animate-pulse" />
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-[var(--bg-primary)] animate-pulse" />)}</div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Retry</button>
        </div>
      ) : (
        <>
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{card.label}</p>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Actual vs Target Progress */}
      <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Actual vs Target (Month 3 KPIs)</h2>
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
            const barColor = (p: number) => p >= 80 ? "bg-[var(--bg-card)]0" : p >= 50 ? "bg-[var(--bg-card)]0" : "bg-[var(--bg-card)]0"

            return targets.map(t => {
              const a = actuals[t.brand] || { leads: 0, rev: 0, enroll: 0 }
              const leadsPct = pct(a.leads, t.leadsTarget)
              const revPct = pct(a.rev, t.revTarget)
              const enrollPct = t.enrollTarget > 0 ? pct(a.enroll, t.enrollTarget) : -1

              return (
                <div key={t.brand} className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-[var(--text-primary)]">{t.brand}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Leads */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">Leads</span>
                        <span className="text-xs text-[var(--text-secondary)]">{a.leads}/{t.leadsTarget}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(leadsPct)} transition-all`} style={{ width: `${leadsPct}%` }} />
                      </div>
                      <p className={`text-[10px] mt-0.5 ${leadsPct >= 80 ? "text-[var(--text-primary)]" : leadsPct >= 50 ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>{leadsPct}%</p>
                    </div>
                    {/* Revenue */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">Revenue</span>
                        <span className="text-xs text-[var(--text-secondary)]">${a.rev.toLocaleString()}/${t.revTarget >= 1000 ? `$${(t.revTarget/1000)}K` : `$${t.revTarget}`}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(revPct)} transition-all`} style={{ width: `${revPct}%` }} />
                      </div>
                      <p className={`text-[10px] mt-0.5 ${revPct >= 80 ? "text-[var(--text-primary)]" : revPct >= 50 ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>{revPct}%</p>
                    </div>
                    {/* Enrollments */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">Enrollments</span>
                        <span className="text-xs text-[var(--text-secondary)]">{enrollPct >= 0 ? `${a.enroll}/${t.enrollTarget}` : "N/A"}</span>
                      </div>
                      {enrollPct >= 0 ? (
                        <>
                          <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div className={`h-full rounded-full ${barColor(enrollPct)} transition-all`} style={{ width: `${enrollPct}%` }} />
                          </div>
                          <p className={`text-[10px] mt-0.5 ${enrollPct >= 80 ? "text-[var(--text-primary)]" : enrollPct >= 50 ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>{enrollPct}%</p>
                        </>
                      ) : (
                        <div className="h-2 rounded-full bg-[var(--bg-secondary)]" />
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
      {metrics.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-12 text-center">
          <BarChart3 className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No performance data yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Metrics are recorded as campaigns run and generate data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {metrics.map(m => (
            <div key={m.id} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4 hover:border-[var(--border)] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{m.campaign?.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">{m.brand}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">{m.channel}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-4 mt-2">
                    <div><p className="text-[10px] text-[var(--text-muted)]">Impressions</p><p className="text-sm text-[var(--text-secondary)]">{m.impressions.toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-[var(--text-muted)]">Clicks</p><p className="text-sm text-[var(--text-secondary)]">{m.clicks.toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-[var(--text-muted)]">Leads</p><p className="text-sm text-[var(--text-secondary)]">{m.leadsGenerated}</p></div>
                    <div><p className="text-[10px] text-[var(--text-muted)]">CPL</p><p className="text-sm text-[var(--text-secondary)]">${m.costPerLead.toFixed(2)}</p></div>
                    <div><p className="text-[10px] text-[var(--text-muted)]">Revenue</p><p className="text-sm text-[var(--text-primary)]">${m.revenueGenerated.toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-[var(--text-muted)]">ROAS</p><p className={`text-sm ${m.roas >= 3 ? "text-[var(--text-primary)]" : m.roas >= 1 ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>{m.roas.toFixed(1)}x</p></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  )
}
