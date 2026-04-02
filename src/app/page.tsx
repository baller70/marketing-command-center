"use client"

import { useEffect, useState } from "react"
import {
  Brain, Megaphone, CheckSquare, Send, TrendingUp, Lightbulb,
  Target, Building2, DollarSign, AlertTriangle,
  Calendar, Tv, Package, Layers, Zap, FileText,
  ArrowRight, Activity, Clock, CircleCheck, CircleAlert, CircleX,
  Mail, Share2, BellRing, ClipboardList, BarChart2
} from "lucide-react"
import Link from "next/link"

interface HealthCheck {
  name: string
  status: "green" | "yellow" | "red"
  message: string
  details?: Record<string, unknown>
}

interface HealthData {
  status: "green" | "yellow" | "red"
  checks: HealthCheck[]
  summary: { green: number; yellow: number; red: number }
}

interface PhaseData {
  intelligence: { total: number; recent24h: number }
  brandPods: { total: number }
  tvShows: { total: number; airing: number; planned: number }
  campaigns: { total: number; draft: number; live: number; completed: number }
  briefs: { total: number; pending: number; delivered: number }
  contentAssets: { total: number; received: number; assigned: number; deployed: number }
  assembly: { total: number; completed: number; inProgress: number }
  qualityGate: { pending: number; approved: number; rejected: number }
  deployments: { live: number; total: number }
  performance: { revenue: number; budgetSpent: number; roas: number }
  learning: { total: number; active: number }
}

const PHASE_CONFIG = [
  {
    phase: "Strategy", color: "purple", icon: Brain, stages: ["Intelligence", "Brand Pods", "TV Shows"],
    href: "/pipeline/intelligence",
  },
  {
    phase: "Planning", color: "blue", icon: Megaphone, stages: ["Campaigns", "Creative Briefs"],
    href: "/pipeline/campaigns",
  },
  {
    phase: "Production", color: "cyan", icon: Package, stages: ["Content Delivery", "Assembly Line"],
    href: "/pipeline/content-assets",
  },
  {
    phase: "Quality", color: "yellow", icon: CheckSquare, stages: ["Quality Gate"],
    href: "/pipeline/quality-gate",
  },
  {
    phase: "Execution", color: "green", icon: Zap, stages: ["Marketing Apps", "Deployments"],
    href: "/pipeline/deployments",
  },
  {
    phase: "Optimization", color: "orange", icon: TrendingUp, stages: ["Performance", "Learning Engine"],
    href: "/pipeline/performance",
  },
]

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string; gradient: string }> = {
  purple: { bg: "bg-[var(--text-primary)]", text: "text-purple-600", border: "border-[var(--border)]", light: "bg-[var(--bg-card)]", gradient: "from-purple-600 to-purple-700" },
  blue: { bg: "bg-[var(--text-primary)]", text: "text-[var(--text-primary)]", border: "border-[var(--border)]", light: "bg-[var(--bg-card)]", gradient: "from-blue-600 to-blue-700" },
  cyan: { bg: "bg-[var(--text-primary)]", text: "text-[var(--text-primary)]", border: "border-[var(--border)]", light: "bg-[var(--bg-card)]", gradient: "from-cyan-600 to-cyan-700" },
  yellow: { bg: "bg-[var(--bg-card)]0", text: "text-yellow-600", border: "border-yellow-200", light: "bg-[var(--bg-card)]", gradient: "from-yellow-600 to-yellow-700" },
  green: { bg: "bg-[var(--bg-card)]0", text: "text-green-600", border: "border-[var(--border)]", light: "bg-[var(--bg-card)]", gradient: "from-green-600 to-green-700" },
  orange: { bg: "bg-[var(--text-primary)]", text: "text-[var(--text-primary)]", border: "border-[var(--border)]", light: "bg-[var(--bg-card)]", gradient: "from-orange-600 to-orange-700" },
}

const STATUS_ICON = { green: CircleCheck, yellow: CircleAlert, red: CircleX }
const STATUS_COLOR = { green: "text-[var(--text-secondary)]", yellow: "text-yellow-500", red: "text-[var(--text-secondary)]" }

const PIPELINE_STAGES = [
  { num: 1, name: "Intelligence", href: "/pipeline/intelligence", icon: Brain, color: "purple" },
  { num: 2, name: "Brand Pods", href: "/pipeline/brand-pods", icon: Building2, color: "purple" },
  { num: 3, name: "TV Shows", href: "/pipeline/tv-shows", icon: Tv, color: "purple" },
  { num: 4, name: "Campaigns", href: "/pipeline/campaigns", icon: Megaphone, color: "blue" },
  { num: 5, name: "Creative Briefs", href: "/pipeline/creative-briefs", icon: FileText, color: "blue" },
  { num: 6, name: "Content Delivery", href: "/pipeline/content-assets", icon: Package, color: "cyan" },
  { num: 7, name: "Assembly Line", href: "/pipeline/assembly", icon: Layers, color: "cyan" },
  { num: 8, name: "Quality Gate", href: "/pipeline/quality-gate", icon: CheckSquare, color: "yellow" },
  { num: 9, name: "Marketing Apps", href: "/apps/mautic", icon: Zap, color: "green" },
  { num: 10, name: "Deployments", href: "/pipeline/deployments", icon: Send, color: "green" },
  { num: 11, name: "Performance", href: "/pipeline/performance", icon: TrendingUp, color: "orange" },
  { num: 12, name: "Learning Engine", href: "/pipeline/learning", icon: Lightbulb, color: "orange" },
]

const APP_STATUS_MAP: Record<string, { label: string; icon: typeof Mail }> = {
  mautic: { label: "Mautic", icon: Mail },
  formbricks: { label: "Formbricks", icon: ClipboardList },
}

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [
          healthRes, intelRes, podsRes, showsRes, campaignsRes,
          briefsRes, assetsRes, assemblyRes, qgRes, deploysRes,
          perfRes, learningRes,
        ] = await Promise.all([
          fetch("/api/pipeline/health").then(r => r.json()).catch(() => null),
          fetch("/api/pipeline/intelligence").then(r => r.json()).catch(() => ({ entries: [] })),
          fetch("/api/pipeline/brand-pods").then(r => r.json()).catch(() => ({ pods: [] })),
          fetch("/api/pipeline/tv-shows").then(r => r.json()).catch(() => ({ shows: [] })),
          fetch("/api/pipeline/campaigns").then(r => r.json()).catch(() => ({ campaigns: [] })),
          fetch("/api/pipeline/creative-briefs").then(r => r.json()).catch(() => ({ briefs: [] })),
          fetch("/api/pipeline/content-assets").then(r => r.json()).catch(() => ({ assets: [] })),
          fetch("/api/pipeline/assembly").then(r => r.json()).catch(() => ({ assemblies: [] })),
          fetch("/api/pipeline/quality-gate").then(r => r.json()).catch(() => ({ reviews: [] })),
          fetch("/api/pipeline/deployments").then(r => r.json()).catch(() => ({ deployments: [] })),
          fetch("/api/pipeline/performance").then(r => r.json()).catch(() => ({ totals: {} })),
          fetch("/api/pipeline/learning").then(r => r.json()).catch(() => ({ rules: [] })),
        ])

        if (healthRes?.checks) setHealth(healthRes)

        const allCampaigns = campaignsRes.campaigns || []
        const allBriefs = briefsRes.briefs || []
        const allAssets = assetsRes.assets || []
        const allAssemblies = assemblyRes.assemblies || []
        const allReviews = qgRes.reviews || []
        const allDeploys = deploysRes.deployments || []
        const allRules = learningRes.rules || []
        const allShows = showsRes.shows || []
        const totals = perfRes.totals || {}

        const oneDayAgo = Date.now() - 86400000
        const recentIntel = (intelRes.entries || []).filter((e: { createdAt: string }) =>
          new Date(e.createdAt).getTime() > oneDayAgo
        ).length

        setPhaseData({
          intelligence: { total: intelRes.entries?.length || 0, recent24h: recentIntel },
          brandPods: { total: podsRes.pods?.length || 0 },
          tvShows: {
            total: allShows.length,
            airing: allShows.filter((s: { status: string }) => s.status === "airing").length,
            planned: allShows.filter((s: { status: string }) => s.status === "planned").length,
          },
          campaigns: {
            total: allCampaigns.length,
            draft: allCampaigns.filter((c: { status: string }) => c.status === "draft").length,
            live: allCampaigns.filter((c: { status: string }) => c.status === "live").length,
            completed: allCampaigns.filter((c: { status: string }) => c.status === "completed").length,
          },
          briefs: {
            total: allBriefs.length,
            pending: allBriefs.filter((b: { status: string }) => b.status === "pending" || b.status === "draft").length,
            delivered: allBriefs.filter((b: { status: string }) => b.status === "delivered").length,
          },
          contentAssets: {
            total: allAssets.length,
            received: allAssets.filter((a: { status: string }) => a.status === "received").length,
            assigned: allAssets.filter((a: { status: string }) => a.status === "assigned").length,
            deployed: allAssets.filter((a: { status: string }) => a.status === "deployed").length,
          },
          assembly: {
            total: allAssemblies.length,
            completed: allAssemblies.filter((a: { status: string }) => a.status === "done").length,
            inProgress: allAssemblies.filter((a: { status: string }) => a.status === "in_progress").length,
          },
          qualityGate: {
            pending: allReviews.filter((r: { decision: string }) => r.decision === "pending").length,
            approved: allReviews.filter((r: { decision: string }) => r.decision === "approved").length,
            rejected: allReviews.filter((r: { decision: string }) => r.decision === "rejected").length,
          },
          deployments: {
            live: allDeploys.filter((d: { status: string }) => d.status === "live").length,
            total: allDeploys.length,
          },
          performance: {
            revenue: totals.revenueGenerated || 0,
            budgetSpent: totals.budgetSpent || 0,
            roas: totals.budgetSpent > 0 ? totals.revenueGenerated / totals.budgetSpent : 0,
          },
          learning: {
            total: allRules.length,
            active: allRules.filter((r: { status: string }) => r.status === "active").length,
          },
        })

        setLastUpdated(new Date())
      } catch (e) {
        console.error("Dashboard load error:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <div className="h-16 rounded-xl bg-[var(--bg-primary)] animate-pulse" />
        <div className="h-20 rounded-xl bg-[var(--bg-primary)] animate-pulse" />
        <div className="grid grid-cols-12 gap-3">
          {[...Array(12)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-[var(--bg-primary)] animate-pulse" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-xl bg-[var(--bg-primary)] animate-pulse" />)}
        </div>
      </div>
    )
  }

  const d = phaseData

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Marketing Engine</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">12-Stage Autonomous Pipeline Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {health && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
              health.status === "green" ? "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]" :
              health.status === "yellow" ? "bg-[var(--bg-card)] border border-yellow-200 text-yellow-700" :
              "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]"
            }`}>
              <Activity className="w-3.5 h-3.5" />
              {health.summary.green}/{health.checks.length} Systems Healthy
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Health Strip */}
      {health && (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pipeline Health</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {health.checks.map(check => {
              const Icon = STATUS_ICON[check.status]
              return (
                <div key={check.name} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <Icon className={`w-3.5 h-3.5 ${STATUS_COLOR[check.status]}`} />
                  <span className="text-[11px] text-[var(--text-secondary)] capitalize">{check.name.replace(/_/g, " ")}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pipeline Flow - Phase-level overview */}
      <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pipeline Flow</span>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {PHASE_CONFIG.map((phase, pi) => {
            const colors = COLOR_MAP[phase.color]
            const Icon = phase.icon
            const stages = PIPELINE_STAGES.filter(s => s.color === phase.color)
            return (
              <Link key={phase.phase} href={phase.href} className={`rounded-lg ${colors.light} border ${colors.border} p-3 hover:shadow-md transition-all group relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-full h-1 ${colors.bg}`} />
                <div className="flex items-center gap-2 mb-2 mt-1">
                  <div className={`w-6 h-6 rounded-md ${colors.gradient} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className={`text-[11px] font-bold ${colors.text} uppercase tracking-wider`}>{phase.phase}</span>
                </div>
                <div className="space-y-1">
                  {stages.map(s => {
                    const StageIcon = s.icon
                    return (
                      <div key={s.num} className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold ${colors.text} w-3 text-right`}>{s.num}</span>
                        <StageIcon className="w-3 h-3 text-[var(--text-muted)]" />
                        <span className="text-[11px] text-[var(--text-secondary)] truncate">{s.name}</span>
                      </div>
                    )
                  })}
                </div>
                {pi < PHASE_CONFIG.length - 1 && (
                  <ArrowRight className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 ${colors.text} opacity-50 z-10 hidden lg:block`} />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Phase Panels - 3x2 grid */}
      {d && (
        <div className="grid grid-cols-3 gap-4">
          {/* Strategy Phase */}
          <PhasePanel phase={PHASE_CONFIG[0]} color="purple">
            <MetricRow icon={Brain} label="Intelligence" value={d.intelligence.total} sub={`${d.intelligence.recent24h} in last 24h`} href="/pipeline/intelligence" />
            <MetricRow icon={Building2} label="Brand Pods" value={d.brandPods.total} sub="Active brands" href="/pipeline/brand-pods" />
            <MetricRow icon={Tv} label="TV Shows" value={d.tvShows.total} sub={`${d.tvShows.airing} airing, ${d.tvShows.planned} planned`} href="/pipeline/tv-shows" />
          </PhasePanel>

          {/* Planning Phase */}
          <PhasePanel phase={PHASE_CONFIG[1]} color="blue">
            <MetricRow icon={Megaphone} label="Campaigns" value={d.campaigns.total} sub={`${d.campaigns.live} live, ${d.campaigns.draft} drafts`} href="/pipeline/campaigns" />
            <MetricRow icon={FileText} label="Creative Briefs" value={d.briefs.total} sub={`${d.briefs.pending} pending, ${d.briefs.delivered} delivered`} href="/pipeline/creative-briefs" />
            <div className="mt-2 pt-2 border-t border-[var(--border)]">
              <div className="flex gap-2">
                <StatusPill label="Draft" count={d.campaigns.draft} color="bg-slate-200 text-[var(--text-secondary)]" />
                <StatusPill label="Live" count={d.campaigns.live} color="bg-[var(--bg-card)] text-[var(--text-primary)]" />
                <StatusPill label="Done" count={d.campaigns.completed} color="bg-[var(--bg-card)] text-[var(--text-primary)]" />
              </div>
            </div>
          </PhasePanel>

          {/* Production Phase */}
          <PhasePanel phase={PHASE_CONFIG[2]} color="cyan">
            <MetricRow icon={Package} label="Content Delivery" value={d.contentAssets.total} sub={`${d.contentAssets.received} received, ${d.contentAssets.deployed} deployed`} href="/pipeline/content-assets" />
            <MetricRow icon={Layers} label="Assembly Line" value={d.assembly.total} sub={`${d.assembly.completed} done, ${d.assembly.inProgress} in progress`} href="/pipeline/assembly" />
            {d.contentAssets.total > 0 && (
              <div className="mt-2 pt-2 border-t border-[var(--border)]">
                <ProgressBar segments={[
                  { value: d.contentAssets.received, color: "bg-cyan-400", label: "Received" },
                  { value: d.contentAssets.assigned, color: "bg-[var(--text-primary)]", label: "Assigned" },
                  { value: d.contentAssets.deployed, color: "bg-cyan-700", label: "Deployed" },
                ]} total={d.contentAssets.total} />
              </div>
            )}
          </PhasePanel>

          {/* Quality Phase */}
          <PhasePanel phase={PHASE_CONFIG[3]} color="yellow">
            <MetricRow icon={CheckSquare} label="Quality Gate" value={d.qualityGate.pending} sub="Pending review" href="/pipeline/quality-gate" />
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <StatusPill label="Pending" count={d.qualityGate.pending} color="bg-yellow-100 text-yellow-700" />
                <StatusPill label="Approved" count={d.qualityGate.approved} color="bg-[var(--bg-card)] text-[var(--text-primary)]" />
                <StatusPill label="Rejected" count={d.qualityGate.rejected} color="bg-[var(--bg-card)] text-[var(--text-primary)]" />
              </div>
              {(d.qualityGate.approved + d.qualityGate.rejected) > 0 && (
                <div className="text-[11px] text-[var(--text-muted)]">
                  Approval rate: <span className="font-semibold text-[var(--text-secondary)]">
                    {Math.round((d.qualityGate.approved / (d.qualityGate.approved + d.qualityGate.rejected)) * 100)}%
                  </span>
                </div>
              )}
            </div>
            {d.qualityGate.pending > 0 && (
              <Link href="/pipeline/quality-gate" className="mt-3 flex items-center gap-1 text-[11px] text-yellow-600 hover:text-yellow-700 font-medium">
                <AlertTriangle className="w-3 h-3" />
                {d.qualityGate.pending} item{d.qualityGate.pending !== 1 ? "s" : ""} awaiting review
              </Link>
            )}
          </PhasePanel>

          {/* Execution Phase */}
          <PhasePanel phase={PHASE_CONFIG[4]} color="green">
            <MetricRow icon={Send} label="Deployments" value={d.deployments.live} sub={`${d.deployments.total} total, ${d.deployments.live} live`} href="/pipeline/deployments" />
            <div className="mt-2 pt-2 border-t border-[var(--border)]">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Marketing Apps</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "Mautic", icon: Mail, href: "/apps/mautic" },
                  { label: "Postiz", icon: Share2, href: "/apps/postiz" },
                  { label: "Listmonk", icon: BellRing, href: "/apps/listmonk" },
                  { label: "Formbricks", icon: ClipboardList, href: "/apps/formbricks" },
                  { label: "Cal.com", icon: Calendar, href: "/apps/calcom" },
                  { label: "Umami", icon: BarChart2, href: "/apps/umami" },
                ].map(app => {
                  const AppIcon = app.icon
                  const healthCheck = health?.checks.find(c => c.name === app.label.toLowerCase())
                  const appStatus = healthCheck?.status || "green"
                  return (
                    <Link key={app.label} href={app.href} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-[var(--bg-card)]/50 border border-green-100 hover:bg-[var(--bg-card)] transition-colors">
                      <AppIcon className="w-3 h-3 text-green-600" />
                      <span className="text-[10px] text-[var(--text-secondary)] truncate">{app.label}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ml-auto shrink-0 ${
                        appStatus === "green" ? "bg-green-400" : appStatus === "yellow" ? "bg-yellow-400" : "bg-[var(--text-muted)]"
                      }`} />
                    </Link>
                  )
                })}
              </div>
            </div>
          </PhasePanel>

          {/* Optimization Phase */}
          <PhasePanel phase={PHASE_CONFIG[5]} color="orange">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[var(--text-primary)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Revenue</span>
                </div>
                <span className="text-lg font-bold text-[var(--text-primary)]">${d.performance.revenue.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[var(--bg-card)]/50 border border-orange-100 p-2.5">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">ROAS</p>
                  <p className={`text-xl font-bold mt-0.5 ${d.performance.roas >= 1 ? "text-green-600" : "text-[var(--text-primary)]"}`}>
                    {d.performance.roas > 0 ? `${d.performance.roas.toFixed(1)}x` : "---"}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--bg-card)]/50 border border-orange-100 p-2.5">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Spent</p>
                  <p className="text-xl font-bold text-[var(--text-primary)] mt-0.5">${d.performance.budgetSpent.toLocaleString()}</p>
                </div>
              </div>
              <MetricRow icon={Lightbulb} label="Learning Rules" value={d.learning.total} sub={`${d.learning.active} active`} href="/pipeline/learning" />
            </div>
          </PhasePanel>
        </div>
      )}

      {/* Pipeline Throughput Summary */}
      {d && (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Pipeline Throughput</span>
          </div>
          <div className="grid grid-cols-6 gap-3">
            {[
              { label: "Intel Signals", value: d.intelligence.total, sub: `+${d.intelligence.recent24h} today`, color: "purple" },
              { label: "Active Campaigns", value: d.campaigns.live, sub: `of ${d.campaigns.total} total`, color: "blue" },
              { label: "Assets In Pipeline", value: d.contentAssets.received + d.contentAssets.assigned, sub: `${d.contentAssets.deployed} deployed`, color: "cyan" },
              { label: "Pending QA", value: d.qualityGate.pending, sub: `${d.qualityGate.approved} approved`, color: "yellow" },
              { label: "Live Channels", value: d.deployments.live, sub: "Active deployments", color: "green" },
              { label: "Learning Rules", value: d.learning.active, sub: `of ${d.learning.total} total`, color: "orange" },
            ].map(item => {
              const colors = COLOR_MAP[item.color]
              return (
                <div key={item.label} className={`rounded-lg ${colors.light} border ${colors.border} p-3`}>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{item.label}</p>
                  <p className={`text-2xl font-bold ${colors.text} mt-1`}>{item.value}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.sub}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PhasePanel({ phase, color, children }: { phase: typeof PHASE_CONFIG[0]; color: string; children: React.ReactNode }) {
  const colors = COLOR_MAP[color]
  const Icon = phase.icon
  return (
    <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-2.5 ${colors.light} border-b ${colors.border}`}>
        <div className={`w-6 h-6 rounded-md ${colors.gradient} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-bold ${colors.text} uppercase tracking-wider`}>{phase.phase}</span>
          <p className="text-[10px] text-[var(--text-muted)] truncate">{phase.stages.join(" / ")}</p>
        </div>
        <Link href={phase.href} className={`text-[10px] ${colors.text} hover:underline font-medium`}>View</Link>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

function MetricRow({ icon: Icon, label, value, sub, href }: { icon: typeof Brain; label: string; value: number; sub: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 py-1.5 group">
      <Icon className="w-4 h-4 text-slate-300 group-hover:text-[var(--text-secondary)] transition-colors shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--text-primary)] font-medium">{label}</span>
        <p className="text-[11px] text-[var(--text-muted)] truncate">{sub}</p>
      </div>
      <span className="text-lg font-bold text-[var(--text-primary)]">{value}</span>
    </Link>
  )
}

function StatusPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${color}`}>
      <span>{count}</span>
      <span>{label}</span>
    </div>
  )
}

function ProgressBar({ segments, total }: { segments: { value: number; color: string; label: string }[]; total: number }) {
  if (total === 0) return null
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
        {segments.map(seg => (
          seg.value > 0 ? (
            <div key={seg.label} className={`${seg.color} transition-all`} style={{ width: `${(seg.value / total) * 100}%` }} />
          ) : null
        ))}
      </div>
      <div className="flex gap-3 mt-1.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${seg.color}`} />
            <span className="text-[10px] text-[var(--text-muted)]">{seg.label} ({seg.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
