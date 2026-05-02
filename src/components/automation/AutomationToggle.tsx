"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Power,
  XCircle,
} from "lucide-react"
import {
  AUTOMATION_FEATURE_ROWS,
  type AutomationFeatureCamel,
  type AutomationFeaturesState,
} from "@/lib/automation-config"

interface TogglePayload {
  master: boolean
  features: AutomationFeaturesState
  lastCronRun: string | null
  pendingApprovals: number
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

export default function AutomationToggle() {
  const [data, setData] = useState<TogglePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/automation/toggle")
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText)
      setData(await res.json())
      setError(null)
    } catch (e) {
      setError((e as Error).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const persist = async (partial: { master?: boolean; features?: Partial<Record<AutomationFeatureCamel, boolean>> }) => {
    setSaving(true)
    try {
      const res = await fetch("/api/automation/toggle", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(partial) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText)
      setData(await res.json())
      setError(null)
    } catch (e) { setError((e as Error).message) }
    finally { setSaving(false) }
  }

  const toggleMaster = () => { if (!data || saving) return; void persist({ master: !data.master }) }
  const toggleFeature = (camel: AutomationFeatureCamel) => { if (!data || saving || !data.master) return; void persist({ features: { ...data.features, [camel]: !data.features[camel] } }) }

  const cronLabel = data?.lastCronRun ? timeAgo(data.lastCronRun) : null

  return (
    <div className="rounded-xl p-6 shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Power className="h-6 w-6 shrink-0" style={{ color: "var(--text-muted)" }} />
          <h2 className="font-russo text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>Automation Control</h2>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10 gap-2" style={{ color: "var(--text-muted)" }}>
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex gap-2 items-start">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-5">
          <button type="button" onClick={toggleMaster} disabled={saving}
            className="w-full text-left rounded-xl p-4 transition-opacity border border-transparent hover:border-[var(--border-hover)] disabled:opacity-60"
            style={{ background: "var(--bg-secondary)" }}>
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`h-4 w-4 rounded-full shrink-0 ${data.master ? "bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.5)]" : "bg-red-500"}`} />
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Master</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {data.master ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                    <p className={`text-xl font-russo ${data.master ? "text-emerald-400" : "text-red-400"}`}>{data.master ? "AUTONOMOUS" : "MANUAL"}</p>
                  </div>
                </div>
              </div>
              <span role="switch" aria-checked={data.master}
                className={`relative inline-flex h-11 w-[4.5rem] shrink-0 cursor-pointer items-center rounded-full border px-1 transition-colors ${data.master ? "bg-emerald-500/30 border-emerald-500/40" : "bg-red-500/20 border-red-500/35"}`}>
                <span className={`pointer-events-none inline-block h-9 w-9 transform rounded-full shadow transition-transform ${data.master ? "translate-x-[2.15rem] bg-emerald-400" : "translate-x-0 bg-red-400"}`} />
              </span>
            </div>
          </button>

          <div>
            <button type="button" onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Feature automations
            </button>

            {expanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {AUTOMATION_FEATURE_ROWS.map((row) => {
                  const on = data.features[row.camel]
                  const disabledSub = saving || !data.master
                  return (
                    <button key={row.camel} type="button" disabled={disabledSub} onClick={() => toggleFeature(row.camel)}
                      className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors border disabled:opacity-50"
                      style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${on ? "bg-emerald-400" : "bg-red-400"}`} />
                        <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{row.label}</span>
                      </div>
                      <span className={`relative inline-flex h-7 w-11 shrink-0 items-center rounded-full border transition-colors ${on ? "bg-emerald-500/25 border-emerald-500/40" : "bg-red-500/15 border-red-500/35"}`}>
                        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow transition-transform ${on ? "translate-x-5 bg-emerald-400" : "translate-x-1 bg-red-400"}`} />
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 pt-2 border-t text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 opacity-70" />
              <span>Last cron: <span style={{ color: "var(--text-secondary)" }}>{cronLabel ?? "—"}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 opacity-70" />
              <span>Pending approvals: <span className="font-semibold text-emerald-400">{data.pendingApprovals}</span></span>
            </div>
          </div>
        </div>
      )}

      {!loading && !data && !error && <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data.</p>}
      {!data && !loading && error && <button type="button" className="mt-3 text-sm text-emerald-400 hover:underline" onClick={() => void load()}>Retry</button>}
    </div>
  )
}
