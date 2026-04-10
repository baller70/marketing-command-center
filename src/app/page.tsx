"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Zap, RefreshCw, ArrowRight, Clock, CheckCircle,
  Package, Target, Mail, Eye, Plus, TrendingUp,
  Loader2, BarChart2, Send, Pause, AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useBrand, ALL_BRANDS } from "@/context/BrandContext"
import { MARKETING_STAGES } from "@/lib/pipeline-stages"

interface DashboardItem {
  id: string
  title: string
  brand: string
  currentStage: number
  status: string
  pipelineMode: string
  contentType: string
  source: string
  updatedAt: string
  createdAt: string
}

interface DashboardData {
  items: DashboardItem[]
  stageCounts: Record<number, number>
  brandCounts: Record<string, number>
  reviewCount: number
  total: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function DashboardPage() {
  const { activeBrand } = useBrand()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "200" })
      const brand = activeBrand
      if (brand && brand !== "__all__") params.set("brand", brand)
      const res = await fetch(`/api/marketing-pipeline?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }, [activeBrand])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const interval = setInterval(() => load(), 30000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  const items = data?.items || []
  const activeItems = items.filter(i => i.status === "active")
  const pausedItems = items.filter(i => i.status === "paused")
  const completedItems = items.filter(i => i.status === "completed")
  const reviewItems = activeItems.filter(i => i.currentStage === 7 && i.pipelineMode === "manual")

  const totalActive = activeItems.length
  const totalCompleted = completedItems.length
  const totalInPipeline = totalActive + pausedItems.length
  const stageCounts = data?.stageCounts || {}
  const brandCounts = data?.brandCounts || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-russo text-2xl" style={{ color: "var(--text-primary)" }}>Marketing Command Center</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Pipeline overview across {Object.keys(brandCounts).length} brand{Object.keys(brandCounts).length !== 1 ? "s" : ""}
            {lastRefresh && (
              <span style={{ color: "var(--text-muted)" }}> · Updated {timeAgo(lastRefresh.toISOString())}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link
            href="/pipeline"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            <Zap className="w-4 h-4" /> Open Pipeline
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="In Pipeline"
          value={totalInPipeline}
          sub={`${totalActive} active · ${pausedItems.length} paused`}
          icon={Package}
          color="var(--text-primary)"
        />
        <MetricCard
          label="Completed"
          value={totalCompleted}
          sub="Campaigns finished"
          icon={CheckCircle}
          color="#10B981"
        />
        <MetricCard
          label="Awaiting Review"
          value={reviewItems.length}
          sub="Manual items at Stage 7"
          icon={Eye}
          color={reviewItems.length > 0 ? "#F59E0B" : "var(--text-muted)"}
          href={reviewItems.length > 0 ? "/pipeline" : undefined}
        />
        <MetricCard
          label="Brands Active"
          value={Object.keys(brandCounts).length}
          sub={Object.keys(brandCounts).join(", ") || "None"}
          icon={Target}
          color="#8B5CF6"
        />
      </div>

      {/* Review Alert */}
      {reviewItems.length > 0 && (
        <Link
          href="/pipeline"
          className="flex items-center gap-3 p-4 rounded-xl transition-colors hover:opacity-90"
          style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)" }}
        >
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-400">
              {reviewItems.length} campaign{reviewItems.length !== 1 ? "s" : ""} awaiting your review
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {reviewItems.map(i => i.title).slice(0, 3).join(", ")}{reviewItems.length > 3 ? ` +${reviewItems.length - 3} more` : ""}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-yellow-500 shrink-0" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Distribution */}
        <div
          className="lg:col-span-2 rounded-xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Stage Distribution</h2>
            <Link href="/pipeline" className="text-xs text-emerald-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {MARKETING_STAGES.map(stage => {
              const count = stageCounts[stage.num] || 0
              const maxCount = Math.max(...Object.values(stageCounts), 1)
              const pct = (count / maxCount) * 100
              return (
                <div key={stage.num} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono w-4 text-right" style={{ color: "var(--text-muted)" }}>{stage.num}</span>
                  <span className="text-xs w-24 truncate" style={{ color: count > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {stage.name}
                  </span>
                  <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
                    {count > 0 && (
                      <div
                        className="h-full rounded-md flex items-center px-2 transition-all"
                        style={{
                          width: `${Math.max(pct, 8)}%`,
                          background: stage.num <= 3 ? "rgba(139, 92, 246, 0.3)" :
                                     stage.num <= 6 ? "rgba(59, 130, 246, 0.3)" :
                                     stage.num <= 9 ? "rgba(16, 185, 129, 0.3)" :
                                     "rgba(245, 158, 11, 0.3)",
                        }}
                      >
                        <span className="text-[10px] font-medium" style={{ color: "var(--text-primary)" }}>{count}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Brand Breakdown */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>By Brand</h2>
          {Object.keys(brandCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(brandCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([brand, count]) => {
                  const info = ALL_BRANDS.find(b => b.id === brand)
                  return (
                    <div key={brand} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ background: info?.color || "#666" }}
                      >
                        {(info?.shortName || brand).substring(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {info?.name || brand}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {count} item{count !== 1 ? "s" : ""} in pipeline
                        </p>
                      </div>
                      <span className="text-lg font-bold" style={{ color: info?.color || "var(--text-primary)" }}>
                        {count}
                      </span>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No items in pipeline</p>
              <Link
                href="/pipeline"
                className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-400 hover:underline"
              >
                <Plus className="w-3 h-3" /> Start a campaign
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Pipeline Activity</h2>
          <Link href="/pipeline" className="text-xs text-emerald-400 hover:underline">View pipeline</Link>
        </div>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.slice(0, 8).map(item => {
              const stageName = MARKETING_STAGES.find(s => s.num === item.currentStage)?.name || `Stage ${item.currentStage}`
              const brandInfo = ALL_BRANDS.find(b => b.id === item.brand)
              return (
                <Link
                  key={item.id}
                  href="/pipeline"
                  className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--bg-card-hover)]"
                >
                  {item.status === "completed" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : item.status === "paused" ? (
                    <Pause className="w-4 h-4 text-yellow-400 shrink-0" />
                  ) : item.currentStage === 7 && item.pipelineMode === "manual" ? (
                    <Eye className="w-4 h-4 text-yellow-400 shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{item.title}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: (brandInfo?.color || "#666") + "22", color: brandInfo?.color || "#999" }}
                      >
                        {brandInfo?.shortName || item.brand}
                      </span>
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {item.status === "completed" ? "Completed" : `Stage ${item.currentStage}: ${stageName}`}
                      {" · "}{item.pipelineMode === "automatic" ? "Auto" : "Manual"}
                      {" · "}{timeAgo(item.updatedAt)}
                    </p>
                  </div>
                  {/* Stage dots */}
                  <div className="hidden md:flex items-center gap-0.5 shrink-0">
                    {MARKETING_STAGES.map(s => (
                      <div
                        key={s.num}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: s.num < item.currentStage || item.status === "completed"
                            ? "#10B981"
                            : s.num === item.currentStage && item.status !== "completed"
                            ? "#3B82F6"
                            : "var(--bg-secondary)",
                        }}
                      />
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <Zap className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No campaigns yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Start your first campaign in the Marketing Machine</p>
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" /> Start Campaign
            </Link>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Marketing Machine", href: "/pipeline", icon: Zap, desc: "12-stage pipeline" },
          { label: "Brands", href: "/pipeline/brand-pods", icon: Target, desc: "Brand management" },
          { label: "Email Config", href: "/pipeline/email-config", icon: Mail, desc: "Lists & templates" },
          { label: "Performance", href: "/pipeline/performance", icon: TrendingUp, desc: "Analytics & ROAS" },
        ].map(link => (
          <Link
            key={link.label}
            href={link.href}
            className="flex items-center gap-3 p-4 rounded-xl transition-colors hover:bg-[var(--bg-card-hover)]"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <link.icon className="w-5 h-5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{link.label}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, icon: Icon, color, href }: {
  label: string; value: number; sub: string; icon: typeof Package; color: string; href?: string
}) {
  const inner = (
    <div
      className="rounded-xl p-4 transition-colors"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[11px] mt-1 truncate" style={{ color: "var(--text-muted)" }}>{sub}</p>
    </div>
  )
  if (href) return <Link href={href} className="hover:opacity-90">{inner}</Link>
  return inner
}
