"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, RefreshCw, Filter, Check, X, ChevronDown, ChevronUp,
  Clock, AlertTriangle, Send, Eye, RotateCcw, Pause, Play,
  CheckCircle, Package, Target, ArrowRight, Loader2, Mail
} from "lucide-react"
import { useBrand, ALL_BRANDS } from "@/context/BrandContext"
import StageProgress from "@/components/pipeline/StageProgress"
import { MARKETING_STAGES } from "@/lib/pipeline-stages"

interface PipelineItem {
  id: string
  title: string
  brand: string
  source: string
  sourceUrl: string | null
  contentPreview: string | null
  contentType: string
  currentStage: number
  status: string
  pipelineMode: string
  priorityScore: number
  emailDraft: Record<string, unknown> | null
  qualityScore: number | null
  approvedAt: string | null
  rejectionReason: string | null
  recycledFromId: string | null
  deploymentData: Record<string, unknown> | null
  performanceData: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  logs: { stage: number; stageName: string; action: string; details: string | null; createdAt: string }[]
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

function BrandBadge({ brand }: { brand: string }) {
  const info = ALL_BRANDS.find(b => b.id === brand)
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: (info?.color || "#666") + "22", color: info?.color || "#999" }}
    >
      {info?.shortName || brand}
    </span>
  )
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    postiz: "bg-purple-500/20 text-purple-400",
    contenthub: "bg-blue-500/20 text-blue-400",
    manual: "bg-gray-500/20 text-gray-400",
    recycled: "bg-amber-500/20 text-amber-400",
    email: "bg-cyan-500/20 text-cyan-400",
    blog: "bg-green-500/20 text-green-400",
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[source] || colors.manual}`}>
      {source}
    </span>
  )
}

export default function PipelinePage() {
  const { activeBrand } = useBrand()
  const [items, setItems] = useState<PipelineItem[]>([])
  const [stageCounts, setStageCounts] = useState<Record<number, number>>({})
  const [brandCounts, setBrandCounts] = useState<Record<string, number>>({})
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showReviewQueue, setShowReviewQueue] = useState(false)
  const [brandFilter, setBrandFilter] = useState<string>("__all__")
  const [stageFilter, setStageFilter] = useState<number | null>(null)
  const [autoAdvancing, setAutoAdvancing] = useState(false)
  const [selectedApprovals, setSelectedApprovals] = useState<Set<string>>(new Set())

  // New item form
  const [newTitle, setNewTitle] = useState("")
  const [newBrand, setNewBrand] = useState("TBF")
  const [newSource, setNewSource] = useState("manual")
  const [newContent, setNewContent] = useState("")
  const [newType, setNewType] = useState("social")
  const [newMode, setNewMode] = useState<"manual" | "automatic">("manual")

  const load = useCallback(async () => {
    setError(null)
    try {
      const params = new URLSearchParams()
      const brand = brandFilter !== "__all__" ? brandFilter : activeBrand !== "__all__" ? activeBrand : null
      if (brand && brand !== "__all__") params.set("brand", brand)
      if (stageFilter) params.set("stage", String(stageFilter))

      const res = await fetch(`/api/marketing-pipeline?${params}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.items)
        setStageCounts(data.stageCounts || {})
        setBrandCounts(data.brandCounts || {})
        setReviewCount(data.reviewCount ?? data.approvalCount ?? 0)
      } else {
        setError(data.error || "Failed to load pipeline")
      }
    } catch (err: unknown) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }, [brandFilter, stageFilter, activeBrand])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    try {
      const res = await fetch("/api/marketing-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          brand: newBrand,
          source: newSource,
          contentPreview: newContent || null,
          contentType: newType,
          mode: newMode,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowNewForm(false)
        setNewTitle("")
        setNewContent("")
        load()
      } else {
        setError(data.error || "Failed to create pipeline item")
      }
    } catch {
      setError("Network error while creating item")
    }
  }

  const handleAction = async (id: string, action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/marketing-pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || `Failed to ${action} item`)
      }
      load()
    } catch {
      setError(`Network error during ${action}`)
    }
  }

  const handleBatchApprove = async () => {
    for (const id of selectedApprovals) {
      await handleAction(id, "send")
    }
    setSelectedApprovals(new Set())
    setShowReviewQueue(false)
  }

  const handleAutoAdvance = async () => {
    setAutoAdvancing(true)
    try {
      await fetch("/api/marketing-pipeline/auto-advance", { method: "POST" })
      load()
    } finally {
      setAutoAdvancing(false)
    }
  }

  const reviewItems = items.filter(i => i.currentStage === 7 && i.status === "active" && i.pipelineMode === "manual")
  const activeItems = items.filter(i => i.status === "active" && !(i.currentStage === 7 && i.pipelineMode === "manual"))
  const completedItems = items.filter(i => i.status === "completed")

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-russo text-2xl" style={{ color: "var(--text-primary)" }}>Marketing Pipeline</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            12-stage automated marketing engine — {items.length} items in pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoAdvance}
            disabled={autoAdvancing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            {autoAdvancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Auto-Advance
          </button>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-card)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Start Pipeline
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Brand Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ALL_BRANDS.map(brand => {
          const count = brandCounts[brand.id] || 0
          const isActive = brandFilter === brand.id
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => setBrandFilter(isActive ? "__all__" : brand.id)}
              className={`rounded-xl p-3 text-left transition-all ${
                isActive ? "ring-2" : "hover:scale-[1.02]"
              }`}
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${isActive ? brand.color : "var(--border)"}`,
                boxShadow: isActive ? `0 0 0 2px ${brand.color}40` : undefined,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brand.color }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {brand.shortName}
                </span>
              </div>
              <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{count}</span>
              <span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>in pipeline</span>
            </button>
          )
        })}
      </div>

      {/* Stage Filter Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStageFilter(null)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !stageFilter ? "bg-emerald-500/20 text-emerald-400" : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
          }`}
        >
          All Stages
        </button>
        {MARKETING_STAGES.map(stage => {
          const count = stageCounts[stage.num] || 0
          const active = stageFilter === stage.num
          return (
            <button
              key={stage.num}
              type="button"
              onClick={() => setStageFilter(active ? null : stage.num)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active ? "bg-blue-500/20 text-blue-400" : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
              }`}
            >
              {stage.num}. {stage.name}
              {count > 0 && (
                <span className="ml-1 text-[10px] opacity-70">({count})</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Review Queue Banner */}
      {reviewCount > 0 && (
        <button
          type="button"
          onClick={() => setShowReviewQueue(!showReviewQueue)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="font-medium text-amber-400">
              {reviewCount} draft{reviewCount > 1 ? "s" : ""} ready for review
            </span>
          </div>
          <span className="text-xs text-amber-400/70">Click to review & send</span>
        </button>
      )}

      {/* Review & Send Queue */}
      {showReviewQueue && reviewItems.length > 0 && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-russo text-lg" style={{ color: "var(--text-primary)" }}>Review & Send</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedApprovals(new Set(reviewItems.map(i => i.id)))
                }}
                className="text-xs px-3 py-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleBatchApprove}
                disabled={selectedApprovals.size === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Send ({selectedApprovals.size})
              </button>
            </div>
          </div>

          {reviewItems.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              <input
                type="checkbox"
                checked={selectedApprovals.has(item.id)}
                onChange={() => {
                  const next = new Set(selectedApprovals)
                  next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                  setSelectedApprovals(next)
                }}
                className="mt-1 rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.title}
                  </span>
                  <BrandBadge brand={item.brand} />
                  <SourceBadge source={item.source} />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    {item.pipelineMode === "automatic" ? "Auto" : "Manual"}
                  </span>
                </div>
                {item.emailDraft && !!(item.emailDraft as Record<string, unknown>).subject && (
                  <div className="mt-1 p-2 rounded text-xs space-y-1" style={{ background: "var(--bg-primary)" }}>
                    <p style={{ color: "var(--text-primary)" }}>
                      <strong>Subject:</strong> {String((item.emailDraft as Record<string, unknown>).subject)}
                    </p>
                    {!!(item.emailDraft as Record<string, unknown>).recipientListId && (
                      <p style={{ color: "var(--text-muted)" }}>
                        List: {String((item.emailDraft as Record<string, unknown>).recipientListId)} via {String((item.emailDraft as Record<string, unknown>).platform || "unknown")}
                      </p>
                    )}
                  </div>
                )}
                {item.contentPreview && (
                  <p className="text-xs mt-1 truncate" style={{ color: "var(--text-muted)" }}>
                    {item.contentPreview.substring(0, 120)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAction(item.id, "send")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  <Send className="w-3 h-3" /> Send
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(item.id, "reject", { reason: "Rejected at review" })}
                  className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Items Grid */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Active ({activeItems.length})
        </h3>
        {activeItems.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <Package className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No active pipeline items</p>
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="mt-3 px-4 py-2 rounded-lg text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              Start Pipeline
            </button>
          </div>
        ) : (
          <div className="grid gap-2">
            {activeItems.map(item => {
              const isExpanded = expandedId === item.id
              const stageName = MARKETING_STAGES.find(s => s.num === item.currentStage)?.name || `Stage ${item.currentStage}`
              return (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {item.title}
                        </span>
                        <BrandBadge brand={item.brand} />
                        <SourceBadge source={item.source} />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.pipelineMode === "automatic" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {item.pipelineMode === "automatic" ? "Auto" : "Manual"}
                        </span>
                        {item.recycledFromId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Recycled</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Stage {item.currentStage}: {stageName}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {timeAgo(item.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <StageProgress currentStage={item.currentStage} status={item.status} compact />
                    {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                        <div>
                          <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Stage Progress</h4>
                          <StageProgress currentStage={item.currentStage} status={item.status} logs={item.logs} />
                        </div>
                        <div className="space-y-3">
                          {item.contentPreview && (
                            <div>
                              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Content Preview</h4>
                              <p className="text-xs p-2 rounded" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                                {item.contentPreview.substring(0, 300)}
                              </p>
                            </div>
                          )}
                          {item.emailDraft && !!(item.emailDraft as Record<string, unknown>).subject && (
                            <div>
                              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email Draft</h4>
                              <div className="text-xs p-2 rounded space-y-1" style={{ background: "var(--bg-secondary)" }}>
                                <p style={{ color: "var(--text-primary)" }}>
                                  <strong>Subject:</strong> {String((item.emailDraft as Record<string, unknown>).subject)}
                                </p>
                                {!!(item.emailDraft as Record<string, unknown>).recipientListId && (
                                  <p style={{ color: "var(--text-muted)" }}>
                                    List: {String((item.emailDraft as Record<string, unknown>).recipientListId)} ({String((item.emailDraft as Record<string, unknown>).platform || "unknown")})
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Campaign Result (if deployed) */}
                          {item.deploymentData && !!(item.deploymentData as Record<string, unknown>).deployed && (
                            <div>
                              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Campaign Result</h4>
                              <div className="text-xs p-2 rounded space-y-1" style={{ background: "var(--bg-secondary)" }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${(item.deploymentData as Record<string, unknown>).sent ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                                    {(item.deploymentData as Record<string, unknown>).sent ? "Sent" : "Staged"}
                                  </span>
                                  <span style={{ color: "var(--text-muted)" }}>
                                    via {String((item.deploymentData as Record<string, unknown>).platform || "unknown")}
                                  </span>
                                </div>
                                {!!(item.deploymentData as Record<string, unknown>).listId && (
                                  <p style={{ color: "var(--text-primary)" }}>
                                    <strong>List:</strong> {String((item.deploymentData as Record<string, unknown>).listId)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Email Preview (if body exists) */}
                          {item.emailDraft && !!(item.emailDraft as Record<string, unknown>).body && (
                            <div>
                              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email Preview</h4>
                              <div
                                className="rounded border overflow-hidden"
                                style={{ border: "1px solid var(--border)", maxHeight: "400px", overflowY: "auto" }}
                              >
                                <iframe
                                  srcDoc={String((item.emailDraft as Record<string, unknown>).body)}
                                  title="Email preview"
                                  className="w-full"
                                  style={{ height: "350px", border: "none", background: "#ffffff" }}
                                  sandbox=""
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            {item.currentStage === 7 && item.pipelineMode === "manual" ? (
                              <button
                                type="button"
                                onClick={() => handleAction(item.id, "send")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                              >
                                <Send className="w-3 h-3" /> Review & Send
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAction(item.id, "advance")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                              >
                                <ArrowRight className="w-3 h-3" /> Advance
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAction(item.id, "pause")}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                            >
                              <Pause className="w-3 h-3" /> Pause
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(item.id, "reject", { reason: "Manual rejection" })}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Completed ({completedItems.length})
          </h3>
          <div className="grid gap-2">
            {completedItems.slice(0, 20).map(item => {
              const isExpanded = expandedId === item.id
              return (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {item.title}
                        </span>
                        <BrandBadge brand={item.brand} />
                        <SourceBadge source={item.source} />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.pipelineMode === "automatic" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {item.pipelineMode === "automatic" ? "Auto" : "Manual"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          All 12 stages complete
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {timeAgo(item.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <StageProgress currentStage={item.currentStage} status={item.status} compact />
                    {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                        <div>
                          <h4 className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Stage Progress</h4>
                          <StageProgress currentStage={item.currentStage} status={item.status} logs={item.logs} />
                        </div>
                        <div className="space-y-3">
                          {item.contentPreview && (
                            <div>
                              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Content Preview</h4>
                              <p className="text-xs p-2 rounded" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                                {item.contentPreview.substring(0, 300)}
                              </p>
                            </div>
                          )}
                          {item.emailDraft && !!(item.emailDraft as Record<string, unknown>).subject && (
                            <div>
                              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email Draft</h4>
                              <div className="text-xs p-2 rounded space-y-1" style={{ background: "var(--bg-secondary)" }}>
                                <p style={{ color: "var(--text-primary)" }}>
                                  <strong>Subject:</strong> {String((item.emailDraft as Record<string, unknown>).subject)}
                                </p>
                                {!!(item.emailDraft as Record<string, unknown>).recipientListId && (
                                  <p style={{ color: "var(--text-muted)" }}>
                                    List: {String((item.emailDraft as Record<string, unknown>).recipientListId)} ({String((item.emailDraft as Record<string, unknown>).platform || "unknown")})
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Campaign Result */}
                          {item.deploymentData && (
                            <div>
                              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Campaign Result</h4>
                              <div className="text-xs p-2 rounded space-y-1" style={{ background: "var(--bg-secondary)" }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                                    <CheckCircle className="w-3 h-3" /> {(item.deploymentData as Record<string, unknown>).sent ? "Sent" : "Deployed"}
                                  </span>
                                  <span style={{ color: "var(--text-muted)" }}>
                                    via {String((item.deploymentData as Record<string, unknown>).platform || "unknown")}
                                  </span>
                                </div>
                                {!!(item.deploymentData as Record<string, unknown>).listId && (
                                  <p style={{ color: "var(--text-primary)" }}>
                                    <strong>Recipient List:</strong> {String((item.deploymentData as Record<string, unknown>).listId)}
                                  </p>
                                )}
                                {!!(item.deploymentData as Record<string, unknown>).sentAt && (
                                  <p style={{ color: "var(--text-muted)" }}>
                                    Sent at: {new Date(String((item.deploymentData as Record<string, unknown>).sentAt)).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Email Preview */}
                          {item.emailDraft && !!(item.emailDraft as Record<string, unknown>).body && (
                            <div>
                              <h4 className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email Preview</h4>
                              <div
                                className="rounded border overflow-hidden"
                                style={{ border: "1px solid var(--border)", maxHeight: "400px", overflowY: "auto" }}
                              >
                                <iframe
                                  srcDoc={String((item.emailDraft as Record<string, unknown>).body)}
                                  title="Email preview"
                                  className="w-full"
                                  style={{ height: "350px", border: "none", background: "#ffffff" }}
                                  sandbox=""
                                />
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAction(item.id, "recycle")}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" /> Recycle
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Start Pipeline Modal */}
      {showNewForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Start Campaign Pipeline"
          onClick={() => setShowNewForm(false)}
          onKeyDown={e => { if (e.key === "Escape") setShowNewForm(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 space-y-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-russo text-lg" style={{ color: "var(--text-primary)" }}>Start Campaign Pipeline</h2>
              <button type="button" onClick={() => setShowNewForm(false)} aria-label="Close modal">
                <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Campaign title..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>Brand</label>
                  <select
                    value={newBrand}
                    onChange={e => setNewBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  >
                    {ALL_BRANDS.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>Source</label>
                  <select
                    value={newSource}
                    onChange={e => setNewSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  >
                    <option value="manual">Manual</option>
                    <option value="postiz">Postiz Post</option>
                    <option value="contenthub">ContentHub</option>
                    <option value="email">Email</option>
                    <option value="blog">Blog Post</option>
                    <option value="external-app">External App</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>Content Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                >
                  <option value="social">Social Post</option>
                  <option value="email">Email Campaign</option>
                  <option value="blog">Blog Post</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="ad">Ad</option>
                  <option value="campaign">Full Campaign</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>Pipeline Mode</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMode("manual")}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newMode === "manual"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                    }`}
                    style={newMode !== "manual" ? { border: "1px solid var(--border)" } : {}}
                  >
                    <div className="font-medium">Manual</div>
                    <div className="text-[10px] mt-0.5 opacity-70">Creates draft for you to review & send</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMode("automatic")}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newMode === "automatic"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                    }`}
                    style={newMode !== "automatic" ? { border: "1px solid var(--border)" } : {}}
                  >
                    <div className="font-medium">Automatic</div>
                    <div className="text-[10px] mt-0.5 opacity-70">Generates & sends campaign automatically</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>Content / Description</label>
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Content or description..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 rounded-lg text-sm" style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                Start Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
