"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Users, RefreshCw, Search, Mail,
  CheckCircle, XCircle, AlertTriangle, List, BarChart3
} from "lucide-react"

type Tab = "contacts" | "lists" | "funnels"

interface Contact {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  sources: string[]
  isReal: boolean
  engagement: {
    lastOpened?: string
    lastClicked?: string
    confirmed: boolean
    unsubscribed: boolean
    bounced: boolean
  }
  lists: string[]
  createdAt: string
  note?: string
}

interface ContactStats {
  total: number
  fromSendFox: number
  fromAcumbamail: number
  inBothPlatforms: number
  engaged: number
  confirmed: number
  withNotes: number
}

interface EmailList {
  id: string
  name: string
  platform: string
  subscribers: number
  createdAt?: string
}

interface ListsData {
  summary: { totalLists: number; totalSubscribers: number; reachinboxCampaigns: number }
  platforms: Record<string, { connected: boolean; lists?: EmailList[]; totalSubscribers?: number; campaigns?: number; account?: unknown }>
}

interface FunnelStage {
  id: string
  name: string
  listId: number | null
  platform: string
}

const TAB_CONFIG: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "lists", label: "Email Lists", icon: List },
  { id: "funnels", label: "Funnels", icon: BarChart3 },
]

export default function LeadsPage() {
  const [tab, setTab] = useState<Tab>("contacts")

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Leads & Contacts</h1>
        <p className="text-sm text-[var(--text-secondary)]">Unified view across SendFox, Acumbamail, SendMails, and ReachInbox</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
        {TAB_CONFIG.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${active ? "" : "hover:bg-[var(--bg-card)]"}`}
              style={active ? { background: "var(--bg-card)", color: "var(--text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "var(--text-secondary)" }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === "contacts" && <ContactsTab />}
      {tab === "lists" && <EmailListsTab />}
      {tab === "funnels" && <FunnelsTab />}
    </div>
  )
}

function ContactsTab() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<ContactStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterMode, setFilterMode] = useState<"real" | "engaged" | "all">("real")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ filter: filterMode, limit: "200" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/contacts?${params}`)
      if (!res.ok) { setError(`API returned ${res.status}`); return }
      const data = await res.json()
      if (data.success) {
        setContacts(data.contacts || [])
        setStats(data.stats || null)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [filterMode, search])

  useEffect(() => { load() }, [filterMode])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    load()
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Contacts" value={stats.total} />
          <StatCard label="From SendFox" value={stats.fromSendFox} />
          <StatCard label="From Acumbamail" value={stats.fromAcumbamail} />
          <StatCard label="Engaged" value={stats.engaged} />
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </form>
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
          {(["real", "engaged", "all"] as const).map(f => (
            <button
              type="button"
              key={f}
              onClick={() => setFilterMode(f)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize"
              style={filterMode === f ? { background: "var(--bg-card)", color: "var(--text-primary)" } : { color: "var(--text-secondary)" }}
            >
              {f}
            </button>
          ))}
        </div>
        <button type="button" onClick={load} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-[var(--text-primary)] border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <button type="button" onClick={load} className="mt-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Retry</button>
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)] text-sm">No contacts found</div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">Contact</th>
                  <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">Sources</th>
                  <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">Lists</th>
                  <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {contacts.map(c => (
                  <tr key={c.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[var(--text-primary)] font-medium">{c.fullName || "—"}</p>
                      <p className="text-xs text-[var(--text-muted)]">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.sources.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.lists.slice(0, 2).map(l => (
                          <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] truncate max-w-[120px]">{l}</span>
                        ))}
                        {c.lists.length > 2 && <span className="text-[10px] text-[var(--text-muted)]">+{c.lists.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {c.engagement.confirmed && <span title="Confirmed"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /></span>}
                        {c.engagement.unsubscribed && <span title="Unsubscribed"><XCircle className="w-3.5 h-3.5 text-red-400" /></span>}
                        {c.engagement.bounced && <span title="Bounced"><AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /></span>}
                        {c.engagement.lastOpened && <span title="Has opened"><Mail className="w-3.5 h-3.5 text-blue-400" /></span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.note ? <span className="text-xs text-[var(--text-secondary)] truncate block max-w-[200px]">{c.note}</span> : <span className="text-xs text-[var(--text-muted)]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function EmailListsTab() {
  const [data, setData] = useState<ListsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/email/lists")
      if (!res.ok) { setError(`API returned ${res.status}`); return }
      const json = await res.json()
      if (json.success) setData(json)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-[var(--text-primary)] border-t-transparent rounded-full" /></div>
  }

  if (error || !data) return (
    <div className="text-center py-12">
      <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
      <p className="text-sm text-[var(--text-muted)]">{error || "Failed to load email lists"}</p>
      <button type="button" onClick={load} className="mt-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Retry</button>
    </div>
  )

  const allLists: EmailList[] = []
  for (const [, platform] of Object.entries(data.platforms)) {
    if (platform.lists) allLists.push(...platform.lists)
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total Lists" value={data.summary.totalLists} />
        <StatCard label="Total Subscribers" value={data.summary.totalSubscribers.toLocaleString()} />
        <StatCard label="ReachInbox Campaigns" value={data.summary.reachinboxCampaigns} />
      </div>

      {/* Platform Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(data.platforms).map(([name, platform]) => (
          <div key={name} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${platform.connected ? "bg-emerald-500" : "bg-red-500"}`} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{name}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {platform.lists ? `${platform.lists.length} lists` : platform.campaigns ? `${platform.campaigns} campaigns` : "Connected"}
                {platform.totalSubscribers ? ` · ${platform.totalSubscribers.toLocaleString()} subs` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* All Lists */}
      {allLists.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">List Name</th>
                  <th className="text-left px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">Platform</th>
                  <th className="text-right px-4 py-3 text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">Subscribers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {allLists.map(list => (
                  <tr key={list.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3 text-[var(--text-primary)]">{list.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] capitalize">{list.platform}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-primary)] font-medium">{list.subscribers.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function FunnelsTab() {
  const [stages, setStages] = useState<FunnelStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/funnel")
      if (!res.ok) { setError(`API returned ${res.status}`); return }
      const data = await res.json()
      if (data.success) setStages(data.stages || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-[var(--text-primary)] border-t-transparent rounded-full" /></div>
  }

  if (error) return (
    <div className="text-center py-12">
      <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
      <p className="text-sm text-[var(--text-muted)]">{error}</p>
      <button type="button" onClick={load} className="mt-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Retry</button>
    </div>
  )

  const mainFunnel = stages.filter(s => ["new-lead", "interested", "trial-booked", "active-customer"].includes(s.id))
  const programLists = stages.filter(s => ["tbf-training", "ra1-aau", "summer-camp"].includes(s.id))
  const otherLists = stages.filter(s => !["new-lead", "interested", "trial-booked", "active-customer", "tbf-training", "ra1-aau", "summer-camp"].includes(s.id))

  return (
    <div className="space-y-6">
      {/* Main Funnel Visualization */}
      <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">Lead Funnel</h2>
        <div className="space-y-2">
          {mainFunnel.map((stage, i) => {
            const widthPercent = 100 - (i * 20)
            const configured = !!stage.listId
            return (
              <div key={stage.id} className="flex items-center gap-3">
                <div
                  className="h-12 rounded-lg flex items-center px-4 transition-all"
                  style={{
                    width: `${widthPercent}%`,
                    background: configured ? `linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))` : "var(--bg-secondary)",
                    border: `1px solid ${configured ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{stage.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-muted)] capitalize">{stage.platform}</span>
                      {configured ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Program Lists */}
      {programLists.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Program Interest Lists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {programLists.map(stage => (
              <div key={stage.id} className="rounded-lg p-4" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-sm font-medium text-[var(--text-primary)]">{stage.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-[var(--text-muted)] capitalize">{stage.platform}</span>
                  {stage.listId ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                  <span className="text-xs text-[var(--text-muted)]">{stage.listId ? "Configured" : "Not configured"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Lists */}
      {otherLists.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Other Lists</h2>
          <div className="space-y-2">
            {otherLists.map(stage => (
              <div key={stage.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                <span className="text-sm text-[var(--text-primary)]">{stage.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] capitalize">{stage.platform}</span>
                  {stage.listId ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
    </div>
  )
}
