"use client"

import {
  Activity,
  BarChart3,
  Mail,
  RefreshCw,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const BRANDS = ["TBF", "RA1", "HoS", "ShotIQ", "Kevin", "Bookmark"] as const
type BrandCode = (typeof BRANDS)[number] | "__all__"

interface EmailAnalyticsRow {
  id: string
  brand: string
  contentType: string
  subject: string
  totalSent: number
  totalOpens?: number
  uniqueOpens?: number
  totalClicks?: number
  uniqueClicks?: number
  bounces?: number
  openRate?: number | null
  clickRate?: number | null
  sentAt?: string | null
}

interface EmailAnalyticsPayload {
  analytics?: EmailAnalyticsRow[]
  summary?: {
    totalSent?: number
    avgOpenRate?: number
    avgClickRate?: number
    totalBounces?: number
  }
}

interface SubscriberRow {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  brand: string
  engagementTier: string
  engagementScore: number
  lastOpenedAt?: string | null
  suppressedAt?: string | null
}

interface SubscriberListPayload {
  subscribers: SubscriberRow[]
  total: number
  tiers: Record<string, number>
}

interface SyncPayload {
  success?: boolean
  fetched?: number
  upserts?: number
  skipped?: number
  pages?: number
  error?: string
}

function toPct(rate: number | null | undefined): number {
  if (rate == null || Number.isNaN(rate)) return 0
  return rate <= 1 ? rate * 100 : rate
}

function openRateHue(pct: number): string {
  if (pct >= 30) return "text-emerald-400"
  if (pct >= 15) return "text-amber-400"
  return "text-red-400"
}

function clickRateHue(pct: number): string {
  if (pct >= 5) return "text-emerald-400"
  if (pct >= 2) return "text-amber-400"
  return "text-red-400"
}

function tierStyles(tier: string) {
  const t = tier.toLowerCase()
  if (t === "hot") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  if (t === "warm") return "bg-amber-500/20 text-amber-400 border-amber-500/30"
  if (t === "cold") return "bg-sky-500/20 text-sky-400 border-sky-500/30"
  if (t === "inactive") return "bg-gray-500/20 text-[var(--text-secondary)] border-[var(--border)]"
  if (t === "new") return "bg-purple-500/20 text-purple-400 border-purple-500/30"
  return "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]"
}

function formatDate(iso?: string | null) {
  if (!iso) return "—"
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function subscriberName(s: SubscriberRow) {
  const n = [s.firstName, s.lastName].filter(Boolean).join(" ").trim()
  return n.length > 0 ? n : "—"
}

function emailsSentThisMonth(rows: EmailAnalyticsRow[]) {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  let n = 0
  for (const r of rows) {
    if (!r.sentAt) continue
    if (new Date(r.sentAt) >= start) n += r.totalSent ?? 0
  }
  return n
}

async function countSuppressedSubscribers(signal?: AbortSignal): Promise<number> {
  let offset = 0
  let total = Infinity
  let suppressed = 0
  let pages = 0
  const pageSize = 200
  while (offset < total && pages < 40) {
    const res = await fetch(`/api/subscribers?limit=${pageSize}&offset=${offset}`, { signal })
    if (!res.ok) break
    const data = (await res.json()) as SubscriberListPayload
    total = data.total ?? 0
    for (const s of data.subscribers) {
      if (s.suppressedAt) suppressed += 1
    }
    offset += data.subscribers.length
    pages += 1
    if (data.subscribers.length === 0) break
  }
  return suppressed
}

export default function EmailAnalyticsPage() {
  const [brandTab, setBrandTab] = useState<BrandCode>("__all__")
  const [engagementTab, setEngagementTab] = useState<BrandCode>("__all__")

  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [subscribersLoading, setSubscribersLoading] = useState(true)
  const [hygieneLoading, setHygieneLoading] = useState(false)

  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [subscribersError, setSubscribersError] = useState<string | null>(null)

  const [analyticsRows, setAnalyticsRows] = useState<EmailAnalyticsRow[]>([])
  const [summary, setSummary] = useState<EmailAnalyticsPayload["summary"]>({})

  const [subscriberTotal, setSubscriberTotal] = useState(0)
  const prevSubsRef = useRef<number | null>(null)
  const [growthDir, setGrowthDir] = useState<"up" | "down" | "flat" | null>(null)

  const [engagementTierMap, setEngagementTierMap] = useState<Record<string, number>>({
    hot: 0,
    warm: 0,
    cold: 0,
    inactive: 0,
    new: 0,
  })

  const [subscriberRows, setSubscriberRows] = useState<SubscriberRow[]>([])
  const [subscriberListTotal, setSubscriberListTotal] = useState(0)
  const [subscriberSearchDebounced, setSubscriberSearchDebounced] = useState("")
  const [subscriberSearchDraft, setSubscriberSearchDraft] = useState("")
  const [subscriberBrandFilter, setSubscriberBrandFilter] = useState<BrandCode | "">("__all__")
  const [subscriberTierFilter, setSubscriberTierFilter] = useState<string>("")
  const [subscriberOffset, setSubscriberOffset] = useState(0)
  const subscriberPageSize = 25

  const [totalSuppressions, setTotalSuppressions] = useState(0)
  const [hygieneSnap, setHygieneSnap] = useState<{ at: string; suppressedDelta: number; before: number; after: number } | null>(null)
  const [lastSync, setLastSync] = useState<{ at: string; body: SyncPayload } | null>(null)
  const [syncBusy, setSyncBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSubscriberSearchDebounced(subscriberSearchDraft.trim()), 320)
    return () => clearTimeout(t)
  }, [subscriberSearchDraft])

  useEffect(() => {
    setSubscriberBrandFilter(brandTab)
  }, [brandTab])

  useEffect(() => {
    prevSubsRef.current = null
    setGrowthDir(null)
  }, [brandTab])

  const analyticsQueryBrand = brandTab === "__all__" ? "" : brandTab

  const loadAnalytics = useCallback(async () => {
    setAnalyticsError(null)
    setAnalyticsLoading(true)
    try {
      const q = new URLSearchParams()
      if (analyticsQueryBrand) q.set("brand", analyticsQueryBrand)
      q.set("limit", "200")
      const res = await fetch(`/api/email-analytics?${q.toString()}`)
      if (!res.ok) throw new Error(`email-analytics ${res.status}`)
      const data = (await res.json()) as EmailAnalyticsPayload
      const list = data.analytics ?? []
      list.sort((a, b) => {
        const ta = a.sentAt ? new Date(a.sentAt).getTime() : 0
        const tb = b.sentAt ? new Date(b.sentAt).getTime() : 0
        return tb - ta
      })
      setAnalyticsRows(list)
      setSummary(data.summary ?? {})
      const tiersRes = await fetch(
        `/api/subscribers?${new URLSearchParams({
          ...(analyticsQueryBrand ? { brand: analyticsQueryBrand } : {}),
          limit: "1",
          offset: "0",
        })}`,
      )
      if (tiersRes.ok) {
        const tiersJson = (await tiersRes.json()) as SubscriberListPayload
        const cur = tiersJson.total ?? 0
        const prev = prevSubsRef.current
        if (prev === null) setGrowthDir(null)
        else if (cur > prev) setGrowthDir("up")
        else if (cur < prev) setGrowthDir("down")
        else setGrowthDir("flat")
        prevSubsRef.current = cur
        setSubscriberTotal(cur)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load analytics"
      setAnalyticsError(msg)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [analyticsQueryBrand])

  const loadEngagementTiers = useCallback(async () => {
    const b = engagementTab === "__all__" ? "" : engagementTab
    const q = new URLSearchParams({ limit: "1", offset: "0" })
    if (b) q.set("brand", b)
    try {
      const res = await fetch(`/api/subscribers?${q.toString()}`)
      if (!res.ok) throw new Error(String(res.status))
      const json = (await res.json()) as SubscriberListPayload
      const t = json.tiers ?? {}
      setEngagementTierMap({
        hot: t.hot ?? 0,
        warm: t.warm ?? 0,
        cold: t.cold ?? 0,
        inactive: t.inactive ?? 0,
        new: t.new ?? 0,
      })
    } catch {
      setEngagementTierMap({ hot: 0, warm: 0, cold: 0, inactive: 0, new: 0 })
    }
  }, [engagementTab])

  const loadSubscribersPage = useCallback(async () => {
    setSubscribersError(null)
    setSubscribersLoading(true)
    try {
      const q = new URLSearchParams({
        limit: String(subscriberPageSize),
        offset: String(subscriberOffset),
      })
      const b = subscriberBrandFilter && subscriberBrandFilter !== "__all__" ? subscriberBrandFilter : ""
      if (b) q.set("brand", b)
      if (subscriberTierFilter) q.set("tier", subscriberTierFilter)
      if (subscriberSearchDebounced) q.set("search", subscriberSearchDebounced)
      const res = await fetch(`/api/subscribers?${q.toString()}`)
      if (!res.ok) throw new Error(`subscribers ${res.status}`)
      const json = (await res.json()) as SubscriberListPayload
      setSubscriberRows(json.subscribers ?? [])
      setSubscriberListTotal(json.total ?? json.subscribers.length)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load subscribers"
      setSubscribersError(msg)
    } finally {
      setSubscribersLoading(false)
    }
  }, [subscriberBrandFilter, subscriberOffset, subscriberPageSize, subscriberSearchDebounced, subscriberTierFilter])

  const loadHygieneTotals = useCallback(async () => {
    setHygieneLoading(true)
    try {
      const n = await countSuppressedSubscribers()
      setTotalSuppressions(n)
    } catch {
      setTotalSuppressions(0)
    } finally {
      setHygieneLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  useEffect(() => {
    void loadEngagementTiers()
  }, [loadEngagementTiers])

  useEffect(() => {
    void loadSubscribersPage()
  }, [loadSubscribersPage])

  useEffect(() => {
    void loadHygieneTotals()
  }, [loadHygieneTotals])

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadAnalytics()
      void loadEngagementTiers()
      void loadSubscribersPage()
      void loadHygieneTotals()
    }, 60_000)
    return () => window.clearInterval(id)
  }, [loadAnalytics, loadEngagementTiers, loadHygieneTotals, loadSubscribersPage])

  const avgOpen = useMemo(() => toPct(summary?.avgOpenRate), [summary?.avgOpenRate])
  const avgClick = useMemo(() => toPct(summary?.avgClickRate), [summary?.avgClickRate])

  const monthSent = useMemo(() => emailsSentThisMonth(analyticsRows), [analyticsRows])
  const totalBounces = summary?.totalBounces ?? 0

  const engagementTotal = Object.values(engagementTierMap).reduce((a, c) => a + c, 0)

  const tierSegments = useMemo(
    () =>
      (["hot", "warm", "cold", "inactive", "new"] as const).map((k) => ({
        key: k,
        count: engagementTierMap[k] ?? 0,
        pct: engagementTotal > 0 ? ((engagementTierMap[k] ?? 0) / engagementTotal) * 100 : 0,
        color:
          k === "hot"
            ? "bg-emerald-500"
            : k === "warm"
              ? "bg-amber-400"
              : k === "cold"
                ? "bg-sky-500"
                : k === "inactive"
                  ? "bg-[var(--text-muted)]"
                  : "bg-purple-500",
      })),
    [engagementTierMap, engagementTotal],
  )

  const donutBackground = useMemo(() => {
    if (engagementTotal <= 0) return "conic-gradient(var(--border) 0% 100%)"
    let acc = 0
    const slices: string[] = []
    const colors: Record<(typeof tierSegments)[number]["key"], string> = {
      hot: "#10b981",
      warm: "#fbbf24",
      cold: "#38bdf8",
      inactive: "#6b7280",
      new: "#a855f7",
    }
    for (const seg of tierSegments) {
      if (seg.pct <= 0) continue
      const next = acc + seg.pct
      slices.push(`${colors[seg.key]} ${acc}% ${next}%`)
      acc = next
    }
    if (acc < 100) slices.push(`transparent ${acc}% 100%`)
    return `conic-gradient(${slices.join(", ")})`
  }, [engagementTotal, tierSegments])

  async function handleRunHygiene() {
    setSyncBusy(true)
    setHygieneLoading(true)
    const before = totalSuppressions
    try {
      const res = await fetch("/api/subscribers/sync", { method: "POST" })
      const body = (await res.json()) as SyncPayload
      const afterSup = await countSuppressedSubscribers()
      const now = new Date().toISOString()
      setLastSync({ at: now, body })
      setTotalSuppressions(afterSup)
      setHygieneSnap({
        at: now,
        suppressedDelta: afterSup - before,
        before,
        after: afterSup,
      })
      await loadAnalytics()
      await loadEngagementTiers()
      await loadSubscribersPage()
    } catch {
      setLastSync({
        at: new Date().toISOString(),
        body: { success: false, error: "Sync failed" },
      })
    } finally {
      setSyncBusy(false)
      setHygieneLoading(false)
    }
  }

  const tierLegend = tierSegments.map((seg) => (
    <span key={seg.key} className="inline-flex items-center gap-1 text-[var(--text-secondary)] capitalize">
      <span className={`h-2.5 w-2.5 rounded-full ${seg.color}`} /> {seg.key}{" "}
      <span className="font-mono text-[var(--text-muted)]">{seg.count}</span>
    </span>
  ))

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 text-[var(--text-primary)]">
      <div className="mx-auto max-w-[1400px] space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-russo text-2xl tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-emerald-400" />
              Email Analytics
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Send performance, tiers, subscriber health, hygiene — auto-refresh every 60 seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadAnalytics()
              void loadEngagementTiers()
              void loadSubscribersPage()
              void loadHygieneTotals()
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["__all__", ...BRANDS] as const).map((b) => {
            const active = brandTab === b
            const label = b === "__all__" ? "All" : b
            return (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setBrandTab(b)
                  setSubscriberOffset(0)
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {analyticsError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{analyticsError}</div>
        ) : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) =>
            analyticsLoading ? (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
              />
            ) : null,
          )}
          {!analyticsLoading ? (
            <>
              <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <span>Total Subscribers</span>
                  {growthDir === null ? (
                    <TrendingUp className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                  ) : growthDir === "up" ? (
                    <TrendingUp className="h-4 w-4 text-emerald-400" aria-hidden />
                  ) : growthDir === "down" ? (
                    <TrendingDown className="h-4 w-4 text-red-400" aria-hidden />
                  ) : (
                    <Activity className="h-4 w-4 text-amber-400" aria-hidden />
                  )}
                </div>
                <p className="mt-3 font-russo text-2xl text-[var(--text-primary)]">{subscriberTotal.toLocaleString()}</p>
              </article>
              <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <span>Avg Open Rate</span>
                  <Activity className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                </div>
                <p className={`mt-3 font-russo text-2xl ${openRateHue(avgOpen)}`}>{avgOpen.toFixed(1)}%</p>
              </article>
              <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <span>Avg Click Rate</span>
                  <Activity className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                </div>
                <p className={`mt-3 font-russo text-2xl ${clickRateHue(avgClick)}`}>{avgClick.toFixed(2)}%</p>
              </article>
              <article className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-red-400/90">
                  <span>Total Bounces</span>
                  <Mail className="h-4 w-4 text-red-400" aria-hidden />
                </div>
                <p className="mt-3 font-russo text-2xl text-red-400">{totalBounces.toLocaleString()}</p>
              </article>
              <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <span>Emails Sent This Month</span>
                  <Mail className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                </div>
                <p className="mt-3 font-russo text-2xl text-[var(--text-primary)]">{monthSent.toLocaleString()}</p>
              </article>
            </>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-russo text-lg text-[var(--text-primary)] flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" /> Engagement tiers
            </h2>
            <div className="flex flex-wrap gap-2">
              {(["__all__", ...BRANDS] as const).map((b) => {
                const active = engagementTab === b
                const label = b === "__all__" ? "All" : b
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setEngagementTab(b)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ${
                      active
                        ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                        : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="h-4 flex w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-secondary)]">
            {tierSegments.map((seg) =>
              seg.pct > 0 ? (
                <div
                  key={seg.key}
                  style={{ width: `${seg.pct}%` }}
                  title={`${seg.key}: ${seg.count}`}
                  className={`${seg.color} shrink-0 border-r border-[var(--bg-primary)]/40 last:border-r-0`}
                />
              ) : null,
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px]">{tierLegend}</div>

          <div className="mt-8 flex justify-center">
            <div
              title="Tier mix across selected audience"
              className="relative h-40 w-40 rounded-full border-4 border-[var(--border)]"
              style={{ backgroundImage: donutBackground }}
            >
              <div className="absolute inset-8 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex flex-col items-center justify-center text-center px-4">
                <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wide">Audience</span>
                <span className="font-russo text-2xl text-[var(--text-primary)]">{engagementTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 overflow-x-auto">
          <div className="flex items-center justify-between gap-3 pb-4">
            <h2 className="font-russo text-lg text-[var(--text-primary)] flex items-center gap-2 whitespace-nowrap">
              <Mail className="h-5 w-5 text-sky-400" /> Recent email performance
            </h2>
          </div>
          <table className="min-w-[960px] w-full border-collapse text-left text-sm">
            <thead className="text-[var(--text-secondary)] uppercase text-[11px] tracking-wide border-b border-[var(--border)]">
              <tr>
                <th className="py-2 pe-4">Subject</th>
                <th className="py-2 pe-4">Brand</th>
                <th className="py-2 pe-4">Type</th>
                <th className="py-2 pe-4 text-right">Sent</th>
                <th className="py-2 pe-4 text-right">Opens</th>
                <th className="py-2 pe-4 text-right">Clicks</th>
                <th className="py-2 pe-4 text-right">Bounces</th>
                <th className="py-2 pe-4 text-right">Open %</th>
                <th className="py-2 pe-4 text-right">Click %</th>
                <th className="py-2 pe-4 text-center">Status</th>
                <th className="py-2">Sent date</th>
              </tr>
            </thead>
            <tbody>
              {analyticsLoading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx}>
                      {Array.from({ length: 11 }).map((_, c) => (
                        <td key={c} className="py-2 pe-4">
                          <div className="h-7 animate-pulse rounded-md bg-[var(--bg-secondary)]" />
                        </td>
                      ))}
                    </tr>
                  ))
                : analyticsRows.slice(0, 75).map((row) => {
                    const opens = row.uniqueOpens ?? row.totalOpens ?? 0
                    const clicks = row.uniqueClicks ?? row.totalClicks ?? 0
                    const op = toPct(row.openRate)
                    const cl = toPct(row.clickRate)
                    const strongOpen = op > 30
                    return (
                      <tr key={row.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]/60">
                        <td className="py-3 pe-4 max-w-[280px]">
                          <div className="text-[var(--text-primary)] line-clamp-2">{row.subject}</div>
                        </td>
                        <td className="py-3 pe-4">
                          <span className="inline-flex rounded-md border border-[var(--border)] bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                            {row.brand}
                          </span>
                        </td>
                        <td className="py-3 pe-4 text-[var(--text-secondary)]">{row.contentType}</td>
                        <td className="py-3 pe-4 text-right font-mono">{row.totalSent ?? 0}</td>
                        <td className="py-3 pe-4 text-right font-mono">{opens}</td>
                        <td className="py-3 pe-4 text-right font-mono">{clicks}</td>
                        <td className="py-3 pe-4 text-right font-mono">{row.bounces ?? 0}</td>
                        <td className={`py-3 pe-4 text-right font-mono ${openRateHue(op)}`}>{op.toFixed(1)}%</td>
                        <td className={`py-3 pe-4 text-right font-mono ${clickRateHue(cl)}`}>{cl.toFixed(2)}%</td>
                        <td className="py-3 pe-4 text-center">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full border ${
                              strongOpen ? "border-emerald-500/40 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" : "border-amber-500/40 bg-amber-400/80"
                            }`}
                            title={strongOpen ? "Strong open rate" : "Below 30% open"}
                          />
                        </td>
                        <td className="py-3 text-[var(--text-secondary)] whitespace-nowrap">{formatDate(row.sentAt)}</td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h2 className="font-russo text-lg text-[var(--text-primary)] flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-400" /> Subscriber list
            </h2>
            <div className="flex flex-1 flex-wrap items-center gap-3 justify-end min-w-[240px]">
              <label className="relative flex flex-1 min-w-[200px] items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)] me-2" />
                <input
                  placeholder="Search email or name..."
                  value={subscriberSearchDraft}
                  onChange={(e) => {
                    setSubscriberSearchDraft(e.target.value)
                    setSubscriberOffset(0)
                  }}
                  className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                />
              </label>
              <select
                value={subscriberBrandFilter}
                onChange={(e) => {
                  const v = e.target.value as BrandCode
                  setSubscriberBrandFilter(v)
                  setSubscriberOffset(0)
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)] outline-none capitalize"
              >
                <option value="__all__">All brands</option>
                {[...BRANDS].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                value={subscriberTierFilter}
                onChange={(e) => {
                  setSubscriberTierFilter(e.target.value)
                  setSubscriberOffset(0)
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)] outline-none capitalize"
              >
                <option value="">All tiers</option>
                {["hot", "warm", "cold", "inactive", "new"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {subscribersError ? (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-400">{subscribersError}</div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full border-collapse text-left text-xs">
              <thead className="uppercase tracking-wide border-b border-[var(--border)] text-[var(--text-muted)]">
                <tr>
                  <th className="py-2 pe-4">Email</th>
                  <th className="py-2 pe-4">Name</th>
                  <th className="py-2 pe-4">Brand</th>
                  <th className="py-2 pe-4">Tier</th>
                  <th className="py-2 pe-8 min-w-[180px]">Score</th>
                  <th className="py-2 pe-4">Last opened</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-secondary)]">
                {subscribersLoading
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx}>
                        {[1, 2, 3, 4].map((c) => (
                          <td key={c} className="py-2 pe-4">
                            <div className="h-9 animate-pulse rounded-md bg-[var(--bg-secondary)]" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : subscriberRows.map((s) => {
                      const suppressed = !!s.suppressedAt
                      return (
                        <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]/60">
                          <td className="py-3 pe-4 font-mono text-[var(--text-primary)] break-all">{s.email}</td>
                          <td className="py-3 pe-4">{subscriberName(s)}</td>
                          <td className="py-3 pe-4 font-semibold text-[var(--text-primary)]">{s.brand}</td>
                          <td className="py-3 pe-4">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${tierStyles(s.engagementTier)}`}>
                              {s.engagementTier}
                            </span>
                          </td>
                          <td className="py-3 pe-8">
                            <div className="relative h-2 w-full rounded-full bg-[var(--bg-secondary)]">
                              <div
                                className="absolute inset-y-0 start-0 rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(100, Math.max(0, s.engagementScore ?? 0))}%` }}
                              />
                            </div>
                            <div className="mt-1 flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                              <span>0</span>
                              <span>{s.engagementScore}</span>
                              <span>100</span>
                            </div>
                          </td>
                          <td className="py-3 pe-4 whitespace-nowrap">{formatDate(s.lastOpenedAt)}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                suppressed
                                  ? "border-red-500/40 bg-red-500/15 text-red-400"
                                  : "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                              }`}
                            >
                              {suppressed ? "suppressed" : "active"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)] pt-2">
            <button
              type="button"
              disabled={subscriberOffset <= 0 || subscribersLoading}
              onClick={() => setSubscriberOffset(Math.max(0, subscriberOffset - subscriberPageSize))}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:border-[var(--border-hover)] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-[var(--text-secondary)]">
              Showing {subscriberListTotal === 0 ? "0" : subscriberOffset + 1} –
              {Math.min(subscriberOffset + subscriberRows.length, Math.max(subscriberListTotal, subscriberOffset + subscriberRows.length))}{" "}
              of {subscriberListTotal.toLocaleString()}
            </span>
            <button
              type="button"
              disabled={subscriberOffset + subscriberRows.length >= subscriberListTotal || subscribersLoading}
              onClick={() => setSubscriberOffset(subscriberOffset + subscriberPageSize)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:border-[var(--border-hover)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-russo text-lg text-[var(--text-primary)] flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" /> List hygiene status
            </h2>
            <button
              type="button"
              disabled={syncBusy}
              onClick={() => void handleRunHygiene()}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-300 hover:border-cyan-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncBusy ? "animate-spin" : ""}`} />
              Run hygiene now
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Suppressed this cycle</div>
              <p className="mt-2 font-russo text-xl text-[var(--text-primary)] tabular-nums">
                {hygieneSnap?.suppressedDelta != null ? signedDelta(hygieneSnap.suppressedDelta) : hygieneLoading ? "…" : "—"}
              </p>
              {hygieneSnap ? (
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">Last run · {formatDate(hygieneSnap.at)}</p>
              ) : null}
            </article>
            <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Bounces cleaned</div>
              <p className="mt-2 font-russo text-xl text-red-300 tabular-nums">{totalBounces.toLocaleString()}</p>
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">Recorded bounces (email analytics roll-up)</p>
            </article>
            <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Total suppressions</div>
              <p className="mt-2 font-russo text-xl text-red-400 tabular-nums">{hygieneLoading && !syncBusy ? "…" : totalSuppressions}</p>
            </article>
            <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Sync summary</div>
              <dl className="mt-3 space-y-1 text-[12px] text-[var(--text-secondary)] tabular-nums">
                <div className="flex justify-between gap-2">
                  <dt>Fetched</dt>
                  <dd className="text-[var(--text-primary)] font-mono">{lastSync?.body?.fetched ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Upserts</dt>
                  <dd className="text-[var(--text-primary)] font-mono">{lastSync?.body?.upserts ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Skipped</dt>
                  <dd className="text-[var(--text-primary)] font-mono">{lastSync?.body?.skipped ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Pages</dt>
                  <dd className="text-[var(--text-primary)] font-mono">{lastSync?.body?.pages ?? "—"}</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}

function signedDelta(delta: number) {
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta}`
}
