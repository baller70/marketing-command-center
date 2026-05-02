"use client"

import { useEffect, useState } from "react"
import {
  Activity, RefreshCw, Play, CheckCircle, XCircle, Clock,
  AlertTriangle, Zap, Database, Globe, Cpu, Shield,
  ChevronDown, ChevronRight, Loader2
} from "lucide-react"
import { useBrand } from "@/context/BrandContext"

interface StageDetail {
  name: string
  label: string
  autonomous: boolean
  reason: string
  dataSource: "api" | "internal" | "generated" | "manual"
}

interface AutonomyData {
  autonomyScore: number
  autonomyLabel: string
  stages: { total: number; autonomous: number; manual: number; details: StageDetail[] }
  dataSources: { api: number; internal: number; generated: number; manual: number }
  scheduler: { type: string; interval: string; status: string }
  cycleActivity: {
    intel24h: number; intelWeek: number; campaigns24h: number; campaignsTotal: number
    activeLearningRules: number; perfRecords24h: number; cycleActive: boolean
  }
  blockers: { stage: string; reason: string; recommendation: string }[]
  nextPriorities: string[]
}

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
  uptime: number
}

interface CycleResult {
  stage: string
  order: number
  status: "success" | "error" | "skipped"
  durationMs: number
  summary?: string
  error?: string
}

interface CycleResponse {
  totalDurationMs: number
  summary: { succeeded: number; failed: number; skipped: number }
  results: CycleResult[]
}

const DATA_SOURCE_ICONS: Record<string, typeof Globe> = {
  api: Globe,
  internal: Database,
  generated: Cpu,
  manual: Shield,
}

const DATA_SOURCE_COLORS: Record<string, string> = {
  api: "text-blue-400",
  internal: "text-emerald-400",
  generated: "text-purple-400",
  manual: "text-yellow-400",
}

export default function PipelineControlPage() {
  const { activeBrand, brandInfo } = useBrand()
  const [autonomy, setAutonomy] = useState<AutonomyData | null>(null)
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [cycleResults, setCycleResults] = useState<CycleResponse | null>(null)
  const [healthExpanded, setHealthExpanded] = useState(false)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [autoRes, healthRes] = await Promise.all([
        fetch("/api/pipeline/autonomy-score"),
        fetch("/api/pipeline/health"),
      ])
      if (!autoRes.ok && !healthRes.ok) {
        setError("Failed to reach pipeline APIs. Check that the backend is running.")
        return
      }
      const autoData = await autoRes.json()
      const healthData = await healthRes.json()
      if (autoData.success) setAutonomy(autoData)
      if (healthData.success) setHealth(healthData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to load pipeline data: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  async function runFullCycle() {
    setRunning(true)
    setCycleResults(null)
    try {
      const res = await fetch("/api/pipeline/auto-full-cycle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      const data = await res.json()
      if (data.success) setCycleResults(data)
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      console.error("Cycle failed:", msg)
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const healthColor = (s: string) => s === "green" ? "text-emerald-400" : s === "yellow" ? "text-yellow-400" : "text-red-400"
  const healthBg = (s: string) => s === "green" ? "bg-emerald-500/20" : s === "yellow" ? "bg-yellow-500/20" : "bg-red-500/20"

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--text-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error && !autonomy && !health) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-4">{error}</p>
          <button type="button" onClick={loadData} className="px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pipeline Automation</h1>
          <p className="text-sm text-[var(--text-secondary)]">17-stage autonomous marketing pipeline cockpit</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={loadData} className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={runFullCycle}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? "Running Cycle…" : "Run Full Cycle"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Autonomy Score */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Autonomy Score</span>
            <Activity className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-400">{autonomy?.autonomyScore ?? 0}%</span>
            <span className="text-sm text-[var(--text-secondary)]">{autonomy?.autonomyLabel}</span>
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-[var(--bg-secondary)]">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${autonomy?.autonomyScore ?? 0}%` }} />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            {autonomy?.stages.autonomous}/{autonomy?.stages.total} stages autonomous
          </p>
        </div>

        {/* Pipeline Health */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Pipeline Health</span>
            <Shield className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${healthBg(health?.status || "red")} flex items-center justify-center`}>
              {health?.status === "green" ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : health?.status === "yellow" ? <AlertTriangle className="w-6 h-6 text-yellow-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
            </div>
            <div>
              <span className={`text-lg font-bold capitalize ${healthColor(health?.status || "red")}`}>{health?.status || "Unknown"}</span>
              <p className="text-xs text-[var(--text-muted)]">
                {health?.summary.green} OK · {health?.summary.yellow} Warn · {health?.summary.red} Fail
              </p>
            </div>
          </div>
        </div>

        {/* Cycle Activity */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Cycle Activity (24h)</span>
            <Zap className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${autonomy?.cycleActivity.cycleActive ? "bg-emerald-500/20" : "bg-yellow-500/20"} flex items-center justify-center`}>
              {autonomy?.cycleActivity.cycleActive ? <Zap className="w-6 h-6 text-emerald-400" /> : <Clock className="w-6 h-6 text-yellow-400" />}
            </div>
            <div>
              <span className={`text-lg font-bold ${autonomy?.cycleActivity.cycleActive ? "text-emerald-400" : "text-yellow-400"}`}>
                {autonomy?.cycleActivity.cycleActive ? "Active" : "Idle"}
              </span>
              <p className="text-xs text-[var(--text-muted)]">Runs every {autonomy?.scheduler.interval}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="text-center p-2 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
              <p className="text-lg font-bold text-[var(--text-primary)]">{autonomy?.cycleActivity.intel24h ?? 0}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Intel today</p>
            </div>
            <div className="text-center p-2 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
              <p className="text-lg font-bold text-[var(--text-primary)]">{autonomy?.cycleActivity.campaigns24h ?? 0}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Campaigns today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Checks (expandable) */}
      {health && (
        <div className="rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => setHealthExpanded(!healthExpanded)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Health Checks ({health.checks.length})</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${healthBg(health.status)} ${healthColor(health.status)}`}>
                {health.summary.green} pass
              </span>
            </div>
            {healthExpanded ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>
          {healthExpanded && (
            <div className="px-4 pb-4 space-y-2">
              {health.checks.map(check => (
                <div key={check.name} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                  <div className={`w-2.5 h-2.5 rounded-full ${check.status === "green" ? "bg-emerald-500" : check.status === "yellow" ? "bg-yellow-500" : "bg-red-500"}`} />
                  <span className="text-sm text-[var(--text-primary)] capitalize font-medium w-40 shrink-0">{check.name.replace(/_/g, " ")}</span>
                  <span className="text-xs text-[var(--text-secondary)] flex-1">{check.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stage Status Grid */}
      {autonomy && (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Automation Stages ({autonomy.stages.total})</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Data sources: {autonomy.dataSources.api} API · {autonomy.dataSources.internal} Internal · {autonomy.dataSources.generated} Generated
            </p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {autonomy.stages.details.map((stage, i) => {
              const SourceIcon = DATA_SOURCE_ICONS[stage.dataSource] || Database
              const cycleResult = cycleResults?.results.find(r => r.stage === stage.label)
              return (
                <div key={stage.name} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-secondary)] transition-colors">
                  <span className="w-6 text-xs text-[var(--text-muted)] text-right shrink-0">{i + 1}</span>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${stage.autonomous ? "bg-emerald-500" : "bg-yellow-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{stage.label}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{stage.reason}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <SourceIcon className={`w-3.5 h-3.5 ${DATA_SOURCE_COLORS[stage.dataSource]}`} />
                    <span className="text-[10px] text-[var(--text-muted)] capitalize">{stage.dataSource}</span>
                  </div>
                  {cycleResult && (
                    <div className="flex items-center gap-1 shrink-0">
                      {cycleResult.status === "success" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : cycleResult.status === "error" ? <XCircle className="w-3.5 h-3.5 text-red-400" /> : <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                      <span className="text-[10px] text-[var(--text-muted)]">{(cycleResult.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Cycle Results */}
      {cycleResults && (
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Last Cycle Results</h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs text-[var(--text-muted)]">Duration: {(cycleResults.totalDurationMs / 1000).toFixed(1)}s</span>
            <span className="text-xs text-emerald-400">{cycleResults.summary.succeeded} succeeded</span>
            {cycleResults.summary.failed > 0 && <span className="text-xs text-red-400">{cycleResults.summary.failed} failed</span>}
            {cycleResults.summary.skipped > 0 && <span className="text-xs text-[var(--text-muted)]">{cycleResults.summary.skipped} skipped</span>}
          </div>
          <div className="space-y-1.5">
            {cycleResults.results.map(r => (
              <div key={r.order} className="flex items-center gap-2 text-xs">
                {r.status === "success" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : r.status === "error" ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />}
                <span className="text-[var(--text-primary)] w-52 truncate shrink-0">{r.stage}</span>
                <span className="text-[var(--text-muted)]">{(r.durationMs / 1000).toFixed(1)}s</span>
                {r.summary && <span className="text-[var(--text-secondary)] truncate flex-1">{r.summary}</span>}
                {r.error && <span className="text-red-400 truncate flex-1">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priorities */}
      {autonomy?.nextPriorities && autonomy.nextPriorities.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Improvement Priorities</h2>
          <div className="space-y-2">
            {autonomy.nextPriorities.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs text-[var(--text-muted)] w-5 shrink-0">{i + 1}.</span>
                <span className="text-sm text-[var(--text-secondary)]">{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
