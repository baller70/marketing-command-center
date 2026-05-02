"use client"

import { useCallback, useEffect, useState, useRef, FormEvent } from "react"
import {
  Terminal, Search, Send, RefreshCw, Loader2, CheckCircle,
  XCircle, AlertTriangle, ChevronRight, Globe, Mail,
  BarChart2, Zap, ArrowRight, Copy, ExternalLink,
  Workflow, Clock, Play, Activity, Users, Target,
  Contact, Inbox, Filter, Download, Folder, Bell,
  Image, FileText, ChevronDown, Hash
} from "lucide-react"
import {
  OPENCLI_CATEGORIES,
  PIPELINE_ACTIONS,
  EMAIL_ACTIONS,
  MARKETING_OPS_ACTIONS,
  BRAND_PROFILES,
  CONTENT_TYPES,
  NOTIFICATION_ACTIONS,
  UMAMI_ACTIONS,
  FORMBRICKS_ACTIONS,
  type PlatformCommand,
  type Platform,
} from "@/lib/opencli-platforms"
import { useBrand } from "@/context/BrandContext"

type Tab = "browse" | "post" | "pipeline" | "analytics" | "ops" | "audit"

interface HealthStatus {
  postiz: { status: string; latencyMs: number }
  opencliRs: { status: string; latencyMs: number }
  mautic: { status: string; latencyMs: number }
  umami: { status: string; latencyMs: number }
  formbricks: { status: string; latencyMs: number }
  novu: { status: string; latencyMs: number }
}

interface Channel {
  id: string
  name?: string
  providerIdentifier?: string
  identifier?: string
  type?: string
  picture?: string
}

interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
}

const KEVINCLAW_URL = "https://kevinclaw.89-167-33-236.sslip.io"

function StatusDot({ status }: { status: string }) {
  const ok = status.startsWith("ok") || status === "connected"
  return <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} title={status} />
}

function HealthBar({ health }: { health: HealthStatus | null }) {
  if (!health) return null
  const services = [
    { name: "Postiz", ...health.postiz },
    { name: "CLI", ...health.opencliRs },
    { name: "Mautic", ...health.mautic },
    { name: "Umami", ...health.umami },
    { name: "Formbricks", ...health.formbricks },
    { name: "Novu", ...health.novu },
  ]
  return (
    <div className="flex flex-wrap items-center gap-3">
      {services.map((s) => (
        <div key={s.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <StatusDot status={s.status} />
          <span>{s.name}</span>
          <span className="opacity-60">{s.latencyMs}ms</span>
        </div>
      ))}
    </div>
  )
}

function JsonOutput({ data, label }: { data: string; label?: string }) {
  const copyOutput = () => navigator.clipboard.writeText(data)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label || "Output"}</span>
        <button onClick={copyOutput} className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: "var(--text-muted)" }}><Copy size={12} /> Copy</button>
      </div>
      <pre className="p-4 text-xs overflow-x-auto max-h-[300px] overflow-y-auto font-mono" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>{data}</pre>
    </div>
  )
}

export default function OpenCLIPage() {
  const { activeBrand, brandInfo } = useBrand()
  const [activeTab, setActiveTab] = useState<Tab>("browse")
  const [health, setHealth] = useState<HealthStatus | null>(null)

  useEffect(() => {
    fetch("/api/opencli/health").then(r => r.json()).then(setHealth).catch(() => {})
  }, [])

  const tabs: { id: Tab; label: string; icon: typeof Terminal }[] = [
    { id: "browse", label: "Browse & Research", icon: Globe },
    { id: "post", label: "Post & Schedule", icon: Send },
    { id: "pipeline", label: "Pipeline CLI", icon: Workflow },
    { id: "analytics", label: "Analytics & Surveys", icon: BarChart2 },
    { id: "ops", label: "Marketing Ops", icon: Zap },
    { id: "audit", label: "Audit & Queue", icon: FileText },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Terminal size={22} className="text-amber-400" />
            </div>
            <div>
              <h1 className="font-russo text-2xl" style={{ color: "var(--text-primary)" }}>OpenCLI</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Marketing command line &mdash; browse, post, pipeline, analytics, operations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`${KEVINCLAW_URL}/skills`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              <ExternalLink size={12} /> Full CLI (KevinClaw)
            </a>
          </div>
        </div>
        <HealthBar health={health} />
      </div>

      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--bg-secondary)" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${active ? "shadow-sm" : "hover:opacity-80"}`}
              style={active ? { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" } : { color: "var(--text-muted)" }}
            >
              <Icon size={16} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === "browse" && <BrowseTab />}
      {activeTab === "post" && <PostTab />}
      {activeTab === "pipeline" && <PipelineTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
      {activeTab === "ops" && <OpsTab />}
      {activeTab === "audit" && <AuditTab />}
    </div>
  )
}

/* ─── Browse & Research Tab ─── */
function BrowseTab() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedCommand, setSelectedCommand] = useState<PlatformCommand | null>(null)
  const [params, setParams] = useState<Record<string, string>>({})
  const [output, setOutput] = useState("")
  const [running, setRunning] = useState(false)

  const runCommand = async () => {
    if (!selectedPlatform || !selectedCommand) return
    setRunning(true); setOutput("")
    const parts = ["opencli-rs", selectedPlatform.cmd, selectedCommand.cmd]
    for (const p of selectedCommand.params) { const val = params[p.name]; if (val) parts.push(`--${p.name}`, `"${val}"`) }
    parts.push("--format", "json")
    try {
      const res = await fetch("/api/opencli/exec", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: parts.join(" ") }) })
      const data: ExecResult = await res.json()
      setOutput(data.stdout || data.stderr || "(no output)")
    } catch (err) { setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`) }
    finally { setRunning(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        {OPENCLI_CATEGORIES.map((cat) => (
          <div key={cat.category}>
            <h3 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{cat.category}</h3>
            <div className="space-y-1">
              {cat.platforms.map((plat) => {
                const active = selectedPlatform?.cmd === plat.cmd
                return (
                  <button key={plat.cmd} onClick={() => { setSelectedPlatform(plat); setSelectedCommand(null); setParams({}); setOutput("") }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all"
                    style={active ? { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" } : { color: "var(--text-secondary)" }}>
                    <ChevronRight size={14} className={active ? "text-amber-400" : ""} />{plat.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-2 space-y-4">
        {selectedPlatform ? (
          <>
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>{selectedPlatform.name} Commands</h3>
              <div className="flex flex-wrap gap-2">
                {selectedPlatform.commands.map((cmd) => {
                  const active = selectedCommand?.cmd === cmd.cmd
                  return (
                    <button key={cmd.cmd} onClick={() => { setSelectedCommand(cmd); setParams({}); setOutput("") }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${active ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : ""}`}
                      style={!active ? { background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border)" } : undefined}>
                      {cmd.kind === "action" ? <Send size={12} className="inline mr-1.5" /> : <Search size={12} className="inline mr-1.5" />}{cmd.name}
                    </button>
                  )
                })}
              </div>
            </div>
            {selectedCommand && selectedCommand.params.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="flex flex-wrap gap-3">
                  {selectedCommand.params.map((p) => (
                    <div key={p.name} className="flex-1 min-w-[200px]">
                      <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>{p.name} {p.required && <span className="text-red-400">*</span>}</label>
                      <input type="text" placeholder={p.placeholder} value={params[p.name] || ""} onChange={(e) => setParams((prev) => ({ ...prev, [p.name]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && runCommand()}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedCommand && (
              <button onClick={runCommand} disabled={running} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-50">
                {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}{running ? "Running..." : `Run ${selectedCommand.name}`}
              </button>
            )}
            {output && <JsonOutput data={output} />}
          </>
        ) : (
          <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <Globe size={48} className="mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Select a platform to browse or research</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Post & Schedule Tab ─── */
function PostTab() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [content, setContent] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [posting, setPosting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState("")
  const [contentType, setContentType] = useState("")
  const [headline, setHeadline] = useState("")
  const [useTemplate, setUseTemplate] = useState(false)
  const [templateResult, setTemplateResult] = useState<{ ok: boolean; text?: string } | null>(null)

  useEffect(() => {
    fetch("/api/opencli/integrations").then(r => r.json()).then(data => {
      if (data.ok && Array.isArray(data.channels)) setChannels(data.channels)
    }).catch(() => {}).finally(() => setLoadingChannels(false))
  }, [])

  const toggleChannel = (id: string) => setSelectedChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const generateFromTemplate = async () => {
    if (!selectedBrand || !headline) return
    try {
      const res = await fetch("/api/opencli/marketing-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "social-post-branded", brand: selectedBrand, contentType: contentType || "default", headline, description: "" }),
      })
      const data = await res.json()
      if (data.ok && data.data?.announcement?.text) {
        setContent(data.data.announcement.text)
        setTemplateResult({ ok: true, text: "Template applied!" })
      } else {
        setTemplateResult({ ok: false, text: data.error || "Template generation failed" })
      }
    } catch (err) {
      setTemplateResult({ ok: false, text: err instanceof Error ? err.message : "Failed" })
    }
  }

  const handlePost = async (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim() || selectedChannels.length === 0) return
    setPosting(true); setResult(null)
    try {
      const body: Record<string, unknown> = { content, postizIds: selectedChannels, brand: selectedBrand || "marketing" }
      if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString()
      if (mediaUrl) body.mediaUrl = mediaUrl
      const res = await fetch("/api/opencli/unified-post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.status === 409) { const data = await res.json(); setResult({ ok: false, message: `Duplicate detected — similar content posted on ${data.match?.date || "recently"}` }); return }
      const data = await res.json()
      if (data.hasFailure && !data.hasSuccess) setResult({ ok: false, message: "All posts failed — queued for retry" })
      else if (data.hasFailure) setResult({ ok: true, message: "Partial success — some posts queued for retry" })
      else { setResult({ ok: true, message: "Posted successfully!" }); setContent(""); setSelectedChannels([]); setScheduledAt(""); setMediaUrl("") }
    } catch (err) { setResult({ ok: false, message: err instanceof Error ? err.message : "Post failed" }) }
    finally { setPosting(false) }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Brand Selector */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Brand Profile</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(BRAND_PROFILES).map(([key, brand]) => {
            const active = selectedBrand === key
            return (
              <button key={key} onClick={() => setSelectedBrand(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${active ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : ""}`}
                style={!active ? { background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border)" } : undefined}>
                <span>{brand.emoji}</span> {brand.name}
                {active && <CheckCircle size={14} />}
              </button>
            )
          })}
        </div>
        {selectedBrand && BRAND_PROFILES[selectedBrand] && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(BRAND_PROFILES[selectedBrand].platforms).map(([platform, handle]) => (
              <span key={platform} className="text-xs px-2 py-1 rounded" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                {platform}: @{handle}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Template */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Content Template</h3>
          <button onClick={() => setUseTemplate(!useTemplate)} className="text-xs px-2 py-1 rounded transition-all"
            style={useTemplate ? { background: "rgba(245,158,11,0.2)", color: "#f59e0b" } : { color: "var(--text-muted)" }}>
            {useTemplate ? "Template ON" : "Use Template"}
          </button>
        </div>
        {useTemplate && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={contentType} onChange={e => setContentType(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                <option value="">Content Type</option>
                {CONTENT_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
              <input type="text" placeholder="Headline" value={headline} onChange={e => setHeadline(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            </div>
            <button onClick={generateFromTemplate} disabled={!selectedBrand || !headline}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50">
              <Zap size={12} /> Generate from Template
            </button>
            {templateResult && (
              <p className={`text-xs ${templateResult.ok ? "text-emerald-400" : "text-red-400"}`}>{templateResult.text}</p>
            )}
          </div>
        )}
      </div>

      {/* Channel Picker */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Select Channels</h3>
        {loadingChannels ? (
          <div className="flex items-center gap-2 py-4" style={{ color: "var(--text-muted)" }}><Loader2 size={16} className="animate-spin" /> Loading channels...</div>
        ) : channels.length === 0 ? (
          <p className="text-sm py-2" style={{ color: "var(--text-muted)" }}>No Postiz channels found. Connect accounts in Postiz first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {channels.map(ch => {
              const active = selectedChannels.includes(ch.id)
              return (
                <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : ""}`}
                  style={!active ? { background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border)" } : undefined}>
                  {ch.picture && <img src={ch.picture} alt="" className="w-5 h-5 rounded-full" />}
                  <span>{ch.name || ch.identifier || ch.providerIdentifier || ch.id}</span>
                  {active && <CheckCircle size={14} />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Compose */}
      <form onSubmit={handlePost} className="space-y-4">
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your post content..." rows={5}
            className="w-full resize-none outline-none text-sm" style={{ background: "transparent", color: "var(--text-primary)" }} />
          <div className="flex flex-col gap-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <Image size={14} style={{ color: "var(--text-muted)" }} />
              <input type="text" placeholder="Media URL (optional)" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{content.length} chars</span>
                {content.length > 280 && <span className="text-yellow-400">Over 280</span>}
              </div>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                className="text-xs px-2 py-1 rounded" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-secondary)" }} />
            </div>
          </div>
        </div>
        {result && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${result.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {result.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}{result.message}
          </div>
        )}
        <button type="submit" disabled={posting || !content.trim() || selectedChannels.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50">
          {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {scheduledAt ? "Schedule Post" : "Post Now"}
          {selectedChannels.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{selectedChannels.length}</span>}
        </button>
      </form>
    </div>
  )
}

/* ─── Pipeline CLI Tab ─── */
function PipelineTab() {
  const [output, setOutput] = useState<Record<string, string>>({})
  const [running, setRunning] = useState<Record<string, boolean>>({})

  const runAction = async (action: typeof PIPELINE_ACTIONS[number]) => {
    setRunning(prev => ({ ...prev, [action.action]: true })); setOutput(prev => ({ ...prev, [action.action]: "" }))
    try {
      const res = await fetch(action.endpoint, { method: action.method, headers: { "Content-Type": "application/json" } })
      const data = await res.json()
      setOutput(prev => ({ ...prev, [action.action]: JSON.stringify(data, null, 2) }))
    } catch (err) { setOutput(prev => ({ ...prev, [action.action]: `Error: ${err instanceof Error ? err.message : String(err)}` })) }
    finally { setRunning(prev => ({ ...prev, [action.action]: false })) }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {PIPELINE_ACTIONS.map(action => (
        <div key={action.action} className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div>
            <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{action.name}</h3>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{action.description}</p>
          </div>
          <button onClick={() => runAction(action)} disabled={running[action.action]}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50">
            {running[action.action] ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}{action.method === "GET" ? "Fetch" : "Execute"}
          </button>
          {output[action.action] && <JsonOutput data={output[action.action]} />}
        </div>
      ))}
    </div>
  )
}

/* ─── Analytics & Surveys Tab ─── */
function AnalyticsTab() {
  const [output, setOutput] = useState<Record<string, string>>({})
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [websiteId, setWebsiteId] = useState("")
  const [environmentId, setEnvironmentId] = useState("")
  const [surveyId, setSurveyId] = useState("")

  const runAnalytics = async (action: string, extra?: Record<string, unknown>) => {
    setRunning(prev => ({ ...prev, [action]: true })); setOutput(prev => ({ ...prev, [action]: "" }))
    try {
      const body: Record<string, unknown> = { action, ...extra }
      const res = await fetch("/api/opencli/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      setOutput(prev => ({ ...prev, [action]: JSON.stringify(data, null, 2) }))
    } catch (err) { setOutput(prev => ({ ...prev, [action]: `Error: ${err instanceof Error ? err.message : String(err)}` })) }
    finally { setRunning(prev => ({ ...prev, [action]: false })) }
  }

  const runNotification = async (action: string, extra?: Record<string, unknown>) => {
    setRunning(prev => ({ ...prev, [action]: true })); setOutput(prev => ({ ...prev, [action]: "" }))
    try {
      const body: Record<string, unknown> = { action, ...extra }
      const res = await fetch("/api/opencli/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      setOutput(prev => ({ ...prev, [action]: JSON.stringify(data, null, 2) }))
    } catch (err) { setOutput(prev => ({ ...prev, [action]: `Error: ${err instanceof Error ? err.message : String(err)}` })) }
    finally { setRunning(prev => ({ ...prev, [action]: false })) }
  }

  return (
    <div className="space-y-8">
      {/* Umami */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}><Activity size={16} className="text-blue-400" /> Umami Analytics</h3>
        <div className="mb-3">
          <input type="text" placeholder="Website ID (run List Websites first)" value={websiteId} onChange={e => setWebsiteId(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none w-full max-w-md" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {UMAMI_ACTIONS.map(ua => (
            <div key={ua.action} className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div><h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{ua.name}</h4><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{ua.description}</p></div>
              <button onClick={() => runAnalytics(ua.action, ua.needsWebsiteId ? { websiteId } : undefined)}
                disabled={running[ua.action] || (ua.needsWebsiteId && !websiteId)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50">
                {running[ua.action] ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />} Run
              </button>
              {output[ua.action] && <JsonOutput data={output[ua.action]} />}
            </div>
          ))}
        </div>
      </div>

      {/* Formbricks */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}><FileText size={16} className="text-green-400" /> Formbricks Surveys</h3>
        <div className="flex gap-3 mb-3">
          <input type="text" placeholder="Environment ID" value={environmentId} onChange={e => setEnvironmentId(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none flex-1 max-w-xs" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          <input type="text" placeholder="Survey ID" value={surveyId} onChange={e => setSurveyId(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none flex-1 max-w-xs" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FORMBRICKS_ACTIONS.map(fa => (
            <div key={fa.action} className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div><h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{fa.name}</h4><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{fa.description}</p></div>
              <button onClick={() => runAnalytics(fa.action, fa.needsEnvironmentId ? { environmentId } : fa.needsSurveyId ? { surveyId } : undefined)}
                disabled={running[fa.action] || (fa.needsEnvironmentId && !environmentId) || (fa.needsSurveyId && !surveyId)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50">
                {running[fa.action] ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />} Run
              </button>
              {output[fa.action] && <JsonOutput data={output[fa.action]} />}
            </div>
          ))}
        </div>
      </div>

      {/* Novu Notifications */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}><Bell size={16} className="text-purple-400" /> Novu Notifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NOTIFICATION_ACTIONS.map(na => (
            <div key={na.action} className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div><h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{na.name}</h4><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{na.description}</p></div>
              <button onClick={() => runNotification(na.action)}
                disabled={running[na.action]}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50">
                {running[na.action] ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />} Send
              </button>
              {output[na.action] && <JsonOutput data={output[na.action]} />}
            </div>
          ))}
        </div>
      </div>

      {/* External Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="https://umami.89-167-33-236.sslip.io" target="_blank" rel="noopener noreferrer"
          className="rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Activity size={20} className="text-blue-400" /></div>
          <div className="flex-1 min-w-0"><h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Open Umami</h4><p className="text-xs" style={{ color: "var(--text-muted)" }}>Full analytics dashboard</p></div>
          <ExternalLink size={16} style={{ color: "var(--text-muted)" }} />
        </a>
        <a href="https://formbricks.89-167-33-236.sslip.io" target="_blank" rel="noopener noreferrer"
          className="rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center"><BarChart2 size={20} className="text-green-400" /></div>
          <div className="flex-1 min-w-0"><h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Open Formbricks</h4><p className="text-xs" style={{ color: "var(--text-muted)" }}>Surveys and form analytics</p></div>
          <ExternalLink size={16} style={{ color: "var(--text-muted)" }} />
        </a>
      </div>
    </div>
  )
}

/* ─── Marketing Ops Tab ─── */
function OpsTab() {
  const [output, setOutput] = useState<Record<string, string>>({})
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")

  const ICON_MAP: Record<string, typeof Users> = {
    users: Users, target: Target, contact: Contact, inbox: Inbox,
    filter: Filter, zap: Zap, mail: Mail, "bar-chart": BarChart2,
    download: Download, clock: Clock, folder: Folder,
  }

  const runOp = async (action: string, extra?: Record<string, unknown>) => {
    setRunning(prev => ({ ...prev, [action]: true })); setOutput(prev => ({ ...prev, [action]: "" }))
    try {
      const body: Record<string, unknown> = { action, ...extra }
      const res = await fetch("/api/opencli/marketing-ops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      setOutput(prev => ({ ...prev, [action]: JSON.stringify(data, null, 2) }))
    } catch (err) { setOutput(prev => ({ ...prev, [action]: `Error: ${err instanceof Error ? err.message : String(err)}` })) }
    finally { setRunning(prev => ({ ...prev, [action]: false })) }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Search (for contacts/leads)</h3>
        <input type="text" placeholder="Search term..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MARKETING_OPS_ACTIONS.map(op => {
          const Icon = ICON_MAP[op.icon] || Zap
          return (
            <div key={op.action} className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-cyan-400" /></div>
                <div><h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{op.name}</h4><p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{op.description}</p></div>
              </div>
              <button onClick={() => runOp(op.action, (op.action === "list-contacts" || op.action === "list-leads") && searchTerm ? { search: searchTerm } : undefined)}
                disabled={running[op.action]}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50">
                {running[op.action] ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />} Fetch
              </button>
              {output[op.action] && <JsonOutput data={output[op.action]} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Audit & Queue Tab ─── */
function AuditTab() {
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [queueData, setQueueData] = useState<any>(null)
  const [loadingLog, setLoadingLog] = useState(false)
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [logDays, setLogDays] = useState("30")
  const [logBrand, setLogBrand] = useState("")

  const loadAuditLog = async () => {
    setLoadingLog(true)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (logDays) params.set("days", logDays)
      if (logBrand) params.set("brand", logBrand)
      const res = await fetch(`/api/opencli/audit-log?${params}`)
      const data = await res.json()
      if (data.ok) setAuditLog(data.entries || [])
    } catch {} finally { setLoadingLog(false) }
  }

  const loadQueue = async () => {
    setLoadingQueue(true)
    try {
      const res = await fetch("/api/opencli/retry-queue?view=all")
      const data = await res.json()
      if (data.ok) setQueueData(data)
    } catch {} finally { setLoadingQueue(false) }
  }

  const processRetries = async () => {
    setProcessing(true)
    try {
      await fetch("/api/opencli/retry-queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "process" }) })
      await loadQueue()
    } catch {} finally { setProcessing(false) }
  }

  useEffect(() => { loadAuditLog(); loadQueue() }, [])

  return (
    <div className="space-y-8">
      {/* Audit Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}><FileText size={16} className="text-amber-400" /> Post Audit Log</h3>
          <div className="flex items-center gap-2">
            <select value={logDays} onChange={e => setLogDays(e.target.value)}
              className="text-xs px-2 py-1 rounded outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option>
            </select>
            <select value={logBrand} onChange={e => setLogBrand(e.target.value)}
              className="text-xs px-2 py-1 rounded outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <option value="">All brands</option>
              {Object.entries(BRAND_PROFILES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
            <button onClick={loadAuditLog} disabled={loadingLog}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all" style={{ color: "var(--text-muted)" }}>
              {loadingLog ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Refresh
            </button>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Time</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Brand</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Platforms</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Content</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center" style={{ color: "var(--text-muted)" }}>No audit entries found</td></tr>
                ) : auditLog.map((entry, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="px-4 py-2 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>{entry.brand}</td>
                    <td className="px-4 py-2"><div className="flex gap-1">{(entry.platforms || []).map((p: string, j: number) => <span key={j} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--bg-input)" }}>{p}</span>)}</div></td>
                    <td className="px-4 py-2 max-w-[300px] truncate" style={{ color: "var(--text-secondary)" }}>{entry.contentPreview}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === "success" ? "bg-emerald-500/20 text-emerald-400" :
                        entry.status === "failed" ? "bg-red-500/20 text-red-400" :
                        entry.status === "duplicate" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>{entry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Retry Queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}><RefreshCw size={16} className="text-blue-400" /> Retry Queue</h3>
          <div className="flex items-center gap-2">
            <button onClick={processRetries} disabled={processing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50">
              {processing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Process Retries
            </button>
            <button onClick={loadQueue} disabled={loadingQueue}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all" style={{ color: "var(--text-muted)" }}>
              {loadingQueue ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Refresh
            </button>
          </div>
        </div>
        {queueData && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-2xl font-russo" style={{ color: "var(--text-primary)" }}>{queueData.counts?.pending || 0}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pending</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-2xl font-russo text-emerald-400">{queueData.counts?.completed || 0}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Completed</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-2xl font-russo text-red-400">{queueData.counts?.deadLetter || 0}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Dead Letter</p>
            </div>
          </div>
        )}
        {queueData?.pending?.length > 0 && (
          <div className="rounded-xl p-4 space-y-3 mb-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h4 className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Pending Retries</h4>
            {queueData.pending.map((p: any) => (
              <div key={p.id} className="p-3 rounded-lg text-xs space-y-1" style={{ background: "var(--bg-input)" }}>
                <div className="flex justify-between"><span style={{ color: "var(--text-primary)" }}>{p.content?.slice(0, 100)}...</span><span className="text-yellow-400">retry {p.retryCount}/{p.maxRetries}</span></div>
                <div style={{ color: "var(--text-muted)" }}>Next: {new Date(p.nextRetryAt).toLocaleString()} &bull; Error: {p.lastError?.slice(0, 80)}</div>
              </div>
            ))}
          </div>
        )}
        {queueData?.deadLetter?.length > 0 && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h4 className="text-xs font-medium uppercase tracking-wider text-red-400">Dead Letter (Failed)</h4>
            {queueData.deadLetter.map((p: any) => (
              <div key={p.id} className="p-3 rounded-lg text-xs space-y-1" style={{ background: "var(--bg-input)" }}>
                <div style={{ color: "var(--text-primary)" }}>{p.content?.slice(0, 120)}...</div>
                <div style={{ color: "var(--text-muted)" }}>Brand: {p.brand} &bull; Error: {p.lastError?.slice(0, 100)}</div>
              </div>
            ))}
          </div>
        )}
        {(!queueData?.pending?.length && !queueData?.deadLetter?.length) && (
          <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Queue is clean — no pending or failed posts</p>
          </div>
        )}
      </div>
    </div>
  )
}
