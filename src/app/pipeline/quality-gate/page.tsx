"use client"

import { useEffect, useState } from "react"
import { useBrand } from "@/context/BrandContext"
import { CheckSquare, RefreshCw, Shield, CheckCircle, AlertTriangle, XCircle, ArrowUp } from "lucide-react"

interface Review {
  id: string
  reviewType: string
  decision: string
  brandCompliance: Record<string, boolean>
  messagingCheck: Record<string, boolean>
  funnelCheck: Record<string, boolean>
  adCompliance: Record<string, boolean>
  revisionNotes: string | null
  escalatedToJane: boolean
  escalationReason: string | null
  reviewedAt: string | null
  campaign: { id: string; name: string; brandPod: { brand: string } }
  createdAt: string
}

const decisionColors: Record<string, string> = {
  pending: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  pass: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  revise: "bg-[var(--bg-card)] text-[var(--text-primary)]",
  reject: "bg-[var(--bg-card)] text-[var(--text-primary)]",
}

const CHECKLIST_BRAND = [
  { key: "messagingLaneMatch", label: "Campaign matches correct brand messaging lane" },
  { key: "visualAssets", label: "Visual assets use correct brand colors, fonts, logo" },
  { key: "toneOfVoice", label: "Tone of voice matches brand personality" },
  { key: "noCrossBrand", label: "No cross-brand confusion" },
  { key: "contentApproved", label: "All assets produced/approved by Content Division" },
]
const CHECKLIST_MESSAGING = [
  { key: "keyMessageClear", label: "Key message clear in first 3 seconds / first line" },
  { key: "ctaSpecific", label: "CTA is specific and actionable" },
  { key: "offerAccurate", label: "Offer accurately represented, no over-promising" },
  { key: "audienceAlignment", label: "Language and examples match target audience" },
  { key: "socialProofCurrent", label: "Social proof is current and verified" },
]
const CHECKLIST_FUNNEL = [
  { key: "pageLoadSpeed", label: "Landing page loads in <3 seconds" },
  { key: "formsCapture", label: "Forms capture correct data fields" },
  { key: "emailSequences", label: "Email sequences fire correctly" },
  { key: "retargetingPixels", label: "Retargeting pixels are active" },
  { key: "utmParams", label: "UTM parameters correctly appended" },
  { key: "conversionTracking", label: "Conversion tracking is active" },
  { key: "mobileResponsive", label: "Mobile responsive (all pages, all emails)" },
  { key: "linksWork", label: "All links work (no 404s)" },
]
const CHECKLIST_AD = [
  { key: "charLimits", label: "Ad copy meets platform character limits" },
  { key: "creativeSpecs", label: "Creative meets platform size/format specs" },
  { key: "noPolicyViolation", label: "No platform policy violations" },
  { key: "audienceTargeting", label: "Audience targeting is correct" },
  { key: "budgetSchedule", label: "Budget and schedule are correct" },
  { key: "abTests", label: "A/B tests properly configured" },
]

export default function QualityGatePage() {
  const { activeBrand } = useBrand()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [decisionFilter, setDecisionFilter] = useState("__all__")
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [checkState, setCheckState] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (decisionFilter !== "__all__") params.set("decision", decisionFilter)
      if (brandFilter !== "__all__") params.set("brand", brandFilter)
      const res = await fetch(`/api/pipeline/quality-gate?${params}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [decisionFilter, brandFilter])

  async function updateDecision(id: string, decision: string) {
    const checks = checkState[id] || {}
    try {
      const res = await fetch("/api/pipeline/quality-gate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision, reviewedAt: new Date().toISOString(), brandCompliance: checks }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      await load()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
    }
  }

  function toggleCheck(reviewId: string, key: string) {
    setCheckState(prev => ({
      ...prev,
      [reviewId]: { ...(prev[reviewId] || {}), [key]: !(prev[reviewId]?.[key]) },
    }))
  }

  function renderChecklist(reviewId: string, title: string, items: { key: string; label: string }[]) {
    const checks = checkState[reviewId] || {}
    const done = items.filter(i => checks[i.key]).length
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{title}</h4>
          <span className="text-[10px] text-[var(--text-muted)]">{done}/{items.length}</span>
        </div>
        {items.map(item => (
          <label key={item.key} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-[var(--bg-card)]">
            <input type="checkbox" checked={!!checks[item.key]} onChange={() => toggleCheck(reviewId, item.key)} className="rounded border-[var(--border)]" />
            <span className={`text-xs ${checks[item.key] ? "text-[var(--text-primary)] line-through" : "text-[var(--text-secondary)]"}`}>{item.label}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[var(--text-primary)]" /> Stage 6: Quality Gate
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Brand compliance, messaging accuracy, funnel technical checks, ad platform compliance</p>
        </div>
        <button type="button" onClick={() => void load()} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none">
          <option value="__all__">All Brands</option>
          {["TBF", "RA1", "ShotIQ", "HoS", "Bookmark"].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {["__all__", "pending", "pass", "revise", "reject"].map(d => (
          <button type="button" key={d} onClick={() => setDecisionFilter(d)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${decisionFilter === d ? "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)]/30" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>
            {d === "__all__" ? "All" : d.toUpperCase()}
          </button>
        ))}
        <span className="text-xs text-[var(--text-muted)] ml-auto">{reviews.length} reviews</span>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-[var(--bg-primary)] animate-pulse" />)}</div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Retry</button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-12 text-center">
          <Shield className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No campaigns in Quality Gate</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Campaigns enter the gate after assembly is complete</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] overflow-hidden">
              <button type="button" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--bg-card)] transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[var(--text-primary)]" />
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{r.campaign?.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{r.campaign?.brandPod?.brand} · {r.reviewType.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${decisionColors[r.decision]}`}>{r.decision.toUpperCase()}</span>
                  {r.escalatedToJane && <span className="px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] text-[10px] flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Escalated</span>}
                </div>
              </button>
              {expandedId === r.id && (
                <div className="border-t border-[var(--border)] p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    {renderChecklist(r.id, "Brand Compliance", CHECKLIST_BRAND)}
                    {renderChecklist(r.id, "Messaging Accuracy", CHECKLIST_MESSAGING)}
                    {renderChecklist(r.id, "Funnel Technical Check", CHECKLIST_FUNNEL)}
                    {renderChecklist(r.id, "Ad Platform Compliance", CHECKLIST_AD)}
                  </div>
                  {r.decision === "pending" && (
                    <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                      <button type="button" onClick={() => void updateDecision(r.id, "pass")} className="px-4 py-2 rounded-lg bg-[var(--text-primary)] text-white text-sm font-medium hover:bg-[var(--bg-card)]0 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> PASS</button>
                      <button type="button" onClick={() => void updateDecision(r.id, "revise")} className="px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm font-medium hover:bg-[var(--bg-card)]0 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> REVISE</button>
                      <button type="button" onClick={() => void updateDecision(r.id, "reject")} className="px-4 py-2 rounded-lg bg-[var(--text-primary)] text-white text-sm font-medium hover:bg-[var(--bg-card)]0 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> REJECT</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
