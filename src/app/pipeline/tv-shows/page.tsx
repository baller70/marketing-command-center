"use client"

import { useEffect, useState } from "react"
import { useBrand, ALL_BRANDS } from "@/context/BrandContext"
import {
  Tv, RefreshCw, Plus, Play, Pause, XCircle, LayoutGrid, List, Clapperboard,
  Calendar, Clock, TrendingUp, ChevronLeft, ChevronRight, Radio, Film, Star, Mic2, Trophy, Eye
} from "lucide-react"

interface TVShow {
  id: string
  brand: string
  showName: string
  format: string
  cadence: string
  marketingRole: string
  episodes: number
  avgWatchDuration: number
  leadsPerEpisode: number
  status: string
  createdAt: string
}

type TabView = "shows" | "schedule" | "performance"

const BRAND_COLORS: Record<string, string> = {
  TBF: "#1E3A8A", RA1: "#CE1126", HoS: "#F59E0B", ShotIQ: "#8B5CF6", Kevin: "#059669", Bookmark: "#0EA5E9",
}

const SHOW_TYPE_INFO: Record<string, { label: string; icon: typeof Tv; gradient: string }> = {
  series: { label: "Series", icon: Tv, gradient: "from-indigo-500 to-indigo-700" },
  documentary: { label: "Documentary", icon: Clapperboard, gradient: "from-emerald-500 to-emerald-700" },
  special: { label: "Special", icon: Star, gradient: "from-rose-500 to-rose-700" },
  "talk-show": { label: "Talk Show", icon: Mic2, gradient: "from-teal-500 to-teal-700" },
  "highlight-reel": { label: "Highlights", icon: Trophy, gradient: "from-purple-500 to-purple-700" },
  movie: { label: "Movie", icon: Film, gradient: "from-amber-500 to-amber-700" },
}

const ACCENT_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#3b82f6"]

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function getAccentColor(show: { brand: string; id?: string }): string {
  const brandColor = BRAND_COLORS[show.brand]
  if (brandColor) return brandColor
  if (show.id) {
    const idx = show.id.charCodeAt(0) % ACCENT_COLORS.length
    return ACCENT_COLORS[idx]
  }
  return ACCENT_COLORS[0]
}

function ShowCard({ show, onClick }: { show: TVShow; onClick: () => void }) {
  const accentColor = getAccentColor(show)
  const showType = (show as any).showType || "series"
  const typeInfo = SHOW_TYPE_INFO[showType] || SHOW_TYPE_INFO.series
  const TypeIcon = typeInfo.icon
  const platforms: string[] = (show as any).platforms || []

  return (
    <button onClick={onClick} className="group relative rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden transition-all hover:border-[var(--border)] hover:shadow-lg hover:-translate-y-0.5 text-left w-full">
      <div className="h-32 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: accentColor + "cc" }}>
            <TypeIcon className="w-3 h-3" /> {typeInfo.label}
          </span>
        </div>
        {show.status === "active" && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-card)]0/90 text-white">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
            </span>
          </div>
        )}
        <div className="absolute bottom-2.5 left-3 right-3">
          <h3 className="text-white font-bold text-sm leading-tight drop-shadow-md truncate">{show.showName}</h3>
          <p className="text-white/70 text-[10px] mt-0.5">Season 1 · {show.episodes} episodes</p>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: BRAND_COLORS[show.brand] || "#64748b" }}>{show.brand}</span>
          <span className="text-[10px] text-[var(--text-muted)]">{show.cadence}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{show.format}</p>
        {((show as any).scheduleDay || (show as any).scheduleTime) && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
            <span className="text-[10px] text-[var(--text-muted)]">{(show as any).scheduleDay || "TBD"} @ {(show as any).scheduleTime || "TBD"}</span>
          </div>
        )}
        {platforms.length > 0 && (
          <div className="flex gap-1">
            {platforms.map((p: string) => (
              <span key={p} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] capitalize">{p}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function ScheduleGrid({ shows }: { shows: TVShow[] }) {
  const hours = ["6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"]

  const showSlots = shows.map(show => ({
    ...show,
    day: (show as any).scheduleDay || "Mon",
    time: (show as any).scheduleTime || "9:00 AM",
    accentColor: getAccentColor(show),
  }))

  function timeToRow(timeStr: string): number {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!match) return 0
    let h = parseInt(match[1])
    const ampm = match[3].toUpperCase()
    if (ampm === "PM" && h !== 12) h += 12
    if (ampm === "AM" && h === 12) h = 0
    return h - 6
  }

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-primary)]">
      <div className="grid" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
        <div className="bg-[var(--bg-secondary)] border-b border-r border-[var(--border)] p-2 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Time</span>
        </div>
        {DAYS.map(day => (
          <div key={day} className="bg-[var(--bg-secondary)] border-b border-r last:border-r-0 border-[var(--border)] p-2 text-center">
            <span className="text-xs font-bold text-[var(--text-secondary)]">{day}</span>
          </div>
        ))}
      </div>

      <div className="relative grid" style={{ gridTemplateColumns: "80px repeat(7, 1fr)", gridTemplateRows: `repeat(${hours.length}, 48px)` }}>
        {hours.map((hour, i) => (
          <div key={hour} className="border-b border-r border-[var(--border)] px-2 py-1 flex items-start" style={{ gridRow: i + 1, gridColumn: 1 }}>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">{hour}</span>
          </div>
        ))}

        {DAYS.map((_, colIdx) => (
          hours.map((_, rowIdx) => (
            <div key={`${colIdx}-${rowIdx}`} className="border-b border-r last:border-r-0 border-[var(--border)]" style={{ gridRow: rowIdx + 1, gridColumn: colIdx + 2 }} />
          ))
        ))}

        {showSlots.map(slot => {
          const dayIdx = DAYS.indexOf(slot.day)
          if (dayIdx === -1) return null
          const row = timeToRow(slot.time)
          if (row < 0 || row >= hours.length) return null
          return (
            <div
              key={slot.id}
              className="absolute rounded-md px-2 py-1 text-white text-[10px] font-medium overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
              style={{
                backgroundColor: slot.accentColor,
                gridColumn: dayIdx + 2,
                gridRow: row + 1,
                top: `${row * 48 + 2}px`,
                left: `calc(80px + ${dayIdx} * ((100% - 80px) / 7) + 3px)`,
                width: `calc((100% - 80px) / 7 - 6px)`,
                height: "44px",
              }}
              title={`${slot.showName} - ${slot.brand}`}
            >
              <div className="flex items-center gap-1">
                <Radio className="w-2 h-2 shrink-0" />
                <span className="truncate font-semibold">{slot.showName}</span>
              </div>
              <span className="text-white/70 text-[9px] truncate block">{slot.brand} · {slot.time}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PerformanceView({ shows }: { shows: TVShow[] }) {
  function getDecision(show: TVShow): { label: string; color: string; bg: string } {
    const goodWatch = show.avgWatchDuration >= 40
    const goodLeads = show.leadsPerEpisode >= 2
    if (goodWatch && goodLeads) return { label: "RENEW", color: "text-[var(--text-primary)]", bg: "bg-[var(--bg-card)] border-[var(--border)]" }
    if (goodWatch && !goodLeads) return { label: "KEEP — Fix CTAs", color: "text-[var(--text-primary)]", bg: "bg-[var(--bg-card)] border-[var(--border)]" }
    if (!goodWatch && goodLeads) return { label: "OPTIMIZE", color: "text-[var(--text-primary)]", bg: "bg-amber-50 border-amber-200" }
    return { label: "REVIEW", color: "text-[var(--text-primary)]", bg: "bg-[var(--bg-card)] border-[var(--border)]" }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4">
        <p className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Renewal Decision Matrix (after 4+ episodes)</p>
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] font-medium">
            <Eye className="w-3.5 h-3.5 mb-1" /> Watch ↑ + Leads ↑ = <b>RENEW</b>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] font-medium">
            <Eye className="w-3.5 h-3.5 mb-1" /> Watch ↑ + Leads ↓ = <b>KEEP</b>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mb-1" /> Watch ↓ + Leads ↑ = <b>OPTIMIZE</b>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] font-medium">
            <XCircle className="w-3.5 h-3.5 mb-1" /> Watch ↓ + Leads ↓ = <b>CANCEL</b>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {shows.map(s => {
          const decision = s.episodes >= 4 ? getDecision(s) : null
          const accentColor = getAccentColor(s)

          return (
            <div key={s.id} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] overflow-hidden hover:border-[var(--border)] transition-all">
              <div className="flex">
                <div className="w-1.5 shrink-0" style={{ backgroundColor: accentColor }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{s.showName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: accentColor + "18", color: accentColor }}>{s.brand}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.status === "active" ? "bg-[var(--bg-card)] text-[var(--text-primary)]" : s.status === "cancelled" ? "bg-[var(--bg-card)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"}`}>{s.status}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{s.format}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">{s.marketingRole}</p>

                      <div className="flex items-center gap-6 mt-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-[var(--text-primary)]">{s.episodes}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">Episodes</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-lg font-bold ${s.avgWatchDuration >= 40 ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{s.avgWatchDuration}%</p>
                          <p className="text-[10px] text-[var(--text-muted)]">Avg Watch</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-lg font-bold ${s.leadsPerEpisode >= 2 ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{s.leadsPerEpisode}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">Leads/Ep</p>
                        </div>
                        {decision && (
                          <div className={`ml-4 px-3 py-1.5 rounded-lg border text-xs font-bold ${decision.bg} ${decision.color}`}>
                            {decision.label}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 ml-4">
                      {s.status !== "cancelled" && (
                        <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title="Cancel Show">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {s.status === "cancelled" && (
                        <button className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title="Reactivate">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TVShowsPage() {
  const { activeBrand } = useBrand()
  const [shows, setShows] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [tab, setTab] = useState<TabView>("shows")
  const [selectedShow, setSelectedShow] = useState<TVShow | null>(null)

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (brandFilter !== "__all__") params.set("brand", brandFilter)
    const res = await fetch(`/api/pipeline/tv-shows?${params}`)
    const data = await res.json()
    setShows(data.shows || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [brandFilter])

  async function updateStatus(id: string, status: string) {
    await fetch("/api/pipeline/tv-shows", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
    load()
  }

  const activeShows = shows.filter(s => s.status === "active").length
  const totalEps = shows.reduce((sum, s) => sum + s.episodes, 0)

  const grouped: Record<string, TVShow[]> = {}
  for (const show of shows) {
    const key = show.brand
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(show)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Row 1: Title bar */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-primary)] px-6 py-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-indigo-600" />
            <h1 className="text-lg font-bold text-[var(--text-primary)]">TV Guide</h1>
            {activeShows > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-[var(--border)] text-green-600">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> {activeShows} Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={load} className={`p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors`}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Tabs + Filters + Stats */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/60 px-6 py-1.5 shrink-0 flex items-center justify-between">
        <div className="flex bg-[var(--bg-secondary)] rounded-lg p-0.5">
          {([
            { key: "shows" as TabView, label: "Shows", icon: Clapperboard },
            { key: "schedule" as TabView, label: "Schedule", icon: Calendar },
            { key: "performance" as TabView, label: "Performance", icon: TrendingUp },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === t.key
                  ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <t.icon className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="bg-[var(--bg-primary)] border border-dashed border-[var(--border)] rounded-lg px-3 py-1 text-xs text-[var(--text-secondary)] outline-none"
          >
            <option value="__all__">All Brands</option>
            {ALL_BRANDS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
            <span><strong className="text-[var(--text-primary)]">{shows.length}</strong> shows</span>
            <span><strong className="text-[var(--text-primary)]">{totalEps}</strong> episodes</span>
            <span><strong className="text-[var(--text-primary)]">{activeShows}</strong> active</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading programming...
          </div>
        ) : shows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
            <Tv className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium text-[var(--text-secondary)]">No shows yet</p>
            <p className="text-sm mt-1">Seed the 9 shows to start programming your content marketing</p>
          </div>
        ) : (
          <>
            {tab === "shows" && (
              <div className="space-y-8">
                {Object.entries(grouped).map(([brand, brandShows]) => (
                  <div key={brand}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[brand] || "#64748b" }} />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">{brand}</h3>
                      <span className="text-[10px] text-[var(--text-muted)]">{brandShows.length} shows</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {brandShows.map(show => (
                        <ShowCard key={show.id} show={show} onClick={() => setSelectedShow(show)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "schedule" && <ScheduleGrid shows={shows} />}
            {tab === "performance" && <PerformanceView shows={shows} />}
          </>
        )}
      </div>

      {/* Show detail slide-out */}
      {selectedShow && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-[var(--bg-primary)] border-l border-[var(--border)] shadow-xl z-50 flex flex-col">
          {(() => {
            const accentColor = getAccentColor(selectedShow)
            const platforms: string[] = (selectedShow as any).platforms || []
            return (
              <>
                <div className="h-28 relative overflow-hidden shrink-0" style={{ background: `linear-gradient(135deg, ${accentColor}60, ${accentColor}20)` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <button onClick={() => setSelectedShow(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">{selectedShow.brand}</p>
                    <h3 className="text-white font-bold text-sm leading-tight mt-0.5">{selectedShow.showName}</h3>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${selectedShow.status === "active" ? "bg-[var(--bg-card)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"}`}>{selectedShow.status}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{selectedShow.cadence}</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Format</span><span className="font-medium text-[var(--text-primary)] text-right max-w-[60%]">{selectedShow.format}</span></div>
                    {((selectedShow as any).scheduleDay || (selectedShow as any).scheduleTime) && (
                      <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Schedule</span><span className="font-medium text-[var(--text-primary)]">{(selectedShow as any).scheduleDay || "TBD"} @ {(selectedShow as any).scheduleTime || "TBD"}</span></div>
                    )}
                    <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Episodes</span><span className="font-medium text-[var(--text-primary)]">{selectedShow.episodes}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Avg Watch</span><span className={`font-medium ${selectedShow.avgWatchDuration >= 40 ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{selectedShow.avgWatchDuration}%</span></div>
                    <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Leads/Episode</span><span className={`font-medium ${selectedShow.leadsPerEpisode >= 2 ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{selectedShow.leadsPerEpisode}</span></div>
                  </div>

                  <div className="border-t border-[var(--border)] pt-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1">Marketing Role</p>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{selectedShow.marketingRole}</p>
                  </div>

                  {platforms.length > 0 && (
                    <div className="border-t border-[var(--border)] pt-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">Platforms</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {platforms.map((p: string) => (
                          <span key={p} className="px-2 py-1 rounded-md text-[10px] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] capitalize">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-[var(--border)] pt-3 space-y-2">
                    {selectedShow.status !== "cancelled" ? (
                      <button onClick={() => { updateStatus(selectedShow.id, "cancelled"); setSelectedShow(null) }} className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--bg-card)] transition-colors">
                        <Pause className="w-3.5 h-3.5" /> Cancel Show
                      </button>
                    ) : (
                      <button onClick={() => { updateStatus(selectedShow.id, "active"); setSelectedShow(null) }} className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border)] text-green-600 text-xs font-medium hover:bg-[var(--bg-card)] transition-colors">
                        <Play className="w-3.5 h-3.5" /> Reactivate Show
                      </button>
                    )}
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
