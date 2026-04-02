"use client"

import { useEffect, useState } from "react"
import { useBrand, ALL_BRANDS } from "@/context/BrandContext"
import {
  Package, RefreshCw, Film, Image, FileText, Mail, Megaphone,
  Video, LayoutGrid, Layers, Clock, CheckCircle, Archive,
  ArrowRight, Inbox, Timer, Zap, Eye, Grid3X3, List,
  MonitorPlay, Smartphone, Square, PenTool, ImageIcon, Tv
} from "lucide-react"

interface ContentAsset {
  id: string
  assetId: string
  brand: string
  messagingLane: string | null
  skillPillar: string | null
  format: string
  platformOptimized: string
  dimensions: string | null
  duration: number | null
  campaignId: string | null
  tvShow: string | null
  captionText: string | null
  status: string
  deliveredAt: string
}

type ViewMode = "grid" | "list"

const BRAND_COLORS: Record<string, string> = {
  TBF: "#1E3A8A", RA1: "#CE1126", HoS: "#F59E0B", ShotIQ: "#8B5CF6", Kevin: "#059669", Bookmark: "#0EA5E9",
}

const FORMAT_CONFIG: Record<string, { icon: typeof Film; label: string; color: string; bgLight: string }> = {
  short_video:   { icon: Smartphone,  label: "Short Video",    color: "#ec4899", bgLight: "bg-pink-50" },
  mid_video:     { icon: MonitorPlay, label: "Mid Video",      color: "#8b5cf6", bgLight: "bg-violet-50" },
  long_video:    { icon: Film,        label: "Long Video",     color: "#6366f1", bgLight: "bg-indigo-50" },
  carousel:      { icon: Layers,      label: "Carousel",       color: "#0ea5e9", bgLight: "bg-sky-50" },
  quote_graphic: { icon: PenTool,     label: "Quote Graphic",  color: "#14b8a6", bgLight: "bg-teal-50" },
  thumbnail:     { icon: ImageIcon,   label: "Thumbnail",      color: "#f97316", bgLight: "bg-[var(--bg-card)]" },
  email_asset:   { icon: Mail,        label: "Email Asset",    color: "#22c55e", bgLight: "bg-[var(--bg-card)]" },
  ad_creative:   { icon: Megaphone,   label: "Ad Creative",    color: "#ef4444", bgLight: "bg-[var(--bg-card)]" },
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  new:                  { label: "Received",   icon: Inbox,       color: "text-[var(--text-primary)]",    bg: "bg-[var(--bg-card)] border-[var(--border)]" },
  assigned_to_campaign: { label: "Assigned",   icon: ArrowRight,  color: "text-[var(--text-primary)]",   bg: "bg-amber-50 border-amber-200" },
  deployed:             { label: "Deployed",   icon: CheckCircle, color: "text-[var(--text-primary)]", bg: "bg-[var(--bg-card)] border-[var(--border)]" },
  archived:             { label: "Archived",   icon: Archive,     color: "text-[var(--text-secondary)]",   bg: "bg-[var(--bg-secondary)] border-[var(--border)]" },
}

const PLATFORM_CONFIG: Record<string, { icon: typeof Tv; label: string }> = {
  tiktok:       { icon: Smartphone, label: "TikTok" },
  ig_reels:     { icon: Smartphone, label: "IG Reels" },
  ig_feed:      { icon: Grid3X3,    label: "IG Feed" },
  youtube_shorts: { icon: Smartphone, label: "YT Shorts" },
  youtube_long: { icon: MonitorPlay, label: "YouTube" },
  facebook:     { icon: Square,     label: "Facebook" },
  twitter:      { icon: Square,     label: "Twitter" },
  email:        { icon: Mail,       label: "Email" },
  meta_ads:     { icon: Megaphone,  label: "Meta Ads" },
  google_ads:   { icon: Megaphone,  label: "Google Ads" },
}

function AssetCard({ asset, onUpdateStatus }: { asset: ContentAsset; onUpdateStatus: (id: string, status: string) => void }) {
  const fmt = FORMAT_CONFIG[asset.format] || { icon: Package, label: asset.format, color: "#64748b", bgLight: "bg-[var(--bg-secondary)]" }
  const FormatIcon = fmt.icon
  const status = STATUS_CONFIG[asset.status] || STATUS_CONFIG.new
  const StatusIcon = status.icon
  const brandColor = BRAND_COLORS[asset.brand] || "#64748b"
  const platform = PLATFORM_CONFIG[asset.platformOptimized]
  const PlatformIcon = platform?.icon || Square

  const deliveredDate = new Date(asset.deliveredAt)
  const isRecent = Date.now() - deliveredDate.getTime() < 24 * 60 * 60 * 1000

  return (
    <div className="group rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] overflow-hidden hover:border-[var(--border)] hover:shadow-md transition-all">
      {/* Visual header */}
      <div className="h-24 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${fmt.color}18, ${fmt.color}08)` }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.08]">
          <FormatIcon className="w-20 h-20" style={{ color: fmt.color }} />
        </div>

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: fmt.color + "dd" }}>
            <FormatIcon className="w-3 h-3" />
            {fmt.label}
          </span>
          {isRecent && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[var(--text-primary)] text-white">
              <Zap className="w-2.5 h-2.5" /> NEW
            </span>
          )}
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-mono text-[var(--text-secondary)]/80">{asset.assetId}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <PlatformIcon className="w-3 h-3 text-[var(--text-muted)]" />
            <span className="text-[10px] text-[var(--text-secondary)]">{platform?.label || asset.platformOptimized}</span>
          </div>
        </div>
      </div>

      {/* Content body */}
      <div className="p-3.5 space-y-2.5">
        {/* Brand + Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }} />
            <span className="text-xs font-bold" style={{ color: brandColor }}>{asset.brand}</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.bg} ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        {/* Meta details */}
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          {asset.dimensions && (
            <span className="flex items-center gap-1">
              <Grid3X3 className="w-3 h-3" /> {asset.dimensions}
            </span>
          )}
          {asset.duration && (
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3" /> {asset.duration}s
            </span>
          )}
          {asset.messagingLane && (
            <span className="truncate">{asset.messagingLane}</span>
          )}
        </div>

        {/* Caption */}
        {asset.captionText && (
          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{asset.captionText}</p>
        )}

        {/* Delivery time */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {deliveredDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {deliveredDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>

          {/* Quick actions */}
          {asset.status === "new" && (
            <button
              onClick={() => onUpdateStatus(asset.id, "assigned_to_campaign")}
              className="text-[10px] font-medium text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center gap-0.5"
            >
              Assign <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {asset.status === "assigned_to_campaign" && (
            <button
              onClick={() => onUpdateStatus(asset.id, "deployed")}
              className="text-[10px] font-medium text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center gap-0.5"
            >
              Deploy <CheckCircle className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AssetRow({ asset, onUpdateStatus }: { asset: ContentAsset; onUpdateStatus: (id: string, status: string) => void }) {
  const fmt = FORMAT_CONFIG[asset.format] || { icon: Package, label: asset.format, color: "#64748b", bgLight: "bg-[var(--bg-secondary)]" }
  const FormatIcon = fmt.icon
  const status = STATUS_CONFIG[asset.status] || STATUS_CONFIG.new
  const StatusIcon = status.icon
  const brandColor = BRAND_COLORS[asset.brand] || "#64748b"
  const deliveredDate = new Date(asset.deliveredAt)

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg hover:border-[var(--border)] transition-colors">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: fmt.color + "15" }}>
        <FormatIcon className="w-4 h-4" style={{ color: fmt.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-secondary)]">{asset.assetId}</span>
          <span className="text-[10px] font-bold" style={{ color: brandColor }}>{asset.brand}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">{fmt.label}</span>
          <span className="text-[10px] text-[var(--text-muted)]">{asset.platformOptimized}</span>
          {asset.dimensions && <span className="text-[10px] text-[var(--text-muted)]">{asset.dimensions}</span>}
          {asset.duration && <span className="text-[10px] text-[var(--text-muted)]">{asset.duration}s</span>}
        </div>
      </div>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${status.bg} ${status.color}`}>
        <StatusIcon className="w-3 h-3" /> {status.label}
      </span>
      <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-20 text-right">
        {deliveredDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
      <div className="shrink-0 w-16 text-right">
        {asset.status === "new" && (
          <button onClick={() => onUpdateStatus(asset.id, "assigned_to_campaign")} className="text-[10px] font-medium text-[var(--text-primary)] hover:text-[var(--text-primary)]">Assign</button>
        )}
        {asset.status === "assigned_to_campaign" && (
          <button onClick={() => onUpdateStatus(asset.id, "deployed")} className="text-[10px] font-medium text-[var(--text-primary)] hover:text-[var(--text-primary)]">Deploy</button>
        )}
      </div>
    </div>
  )
}

export default function ContentAssetsPage() {
  const { activeBrand } = useBrand()
  const [assets, setAssets] = useState<ContentAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState("__all__")
  const [formatFilter, setFormatFilter] = useState("__all__")
  const [statusFilter, setStatusFilter] = useState("__all__")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  useEffect(() => { setBrandFilter(activeBrand) }, [activeBrand])

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (brandFilter !== "__all__") params.set("brand", brandFilter)
    if (formatFilter !== "__all__") params.set("format", formatFilter)
    const res = await fetch(`/api/pipeline/content-assets?${params}`)
    const data = await res.json()
    setAssets(data.assets || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [brandFilter, formatFilter])

  async function updateStatus(id: string, status: string) {
    await fetch("/api/pipeline/content-assets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) })
    load()
  }

  const filtered = statusFilter === "__all__" ? assets : assets.filter(a => a.status === statusFilter)
  const newCount = assets.filter(a => a.status === "new").length
  const assignedCount = assets.filter(a => a.status === "assigned_to_campaign").length
  const deployedCount = assets.filter(a => a.status === "deployed").length
  const archivedCount = assets.filter(a => a.status === "archived").length

  const formatCounts: Record<string, number> = {}
  assets.forEach(a => { formatCounts[a.format] = (formatCounts[a.format] || 0) + 1 })

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-primary)] px-6 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl from-indigo-500 to-violet-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">Content Delivery Hub</h1>
              <p className="text-[11px] text-[var(--text-muted)]">Assets received from Content Division</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--bg-secondary)] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={load} className={`p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors`}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Status pipeline + Filters */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/60 px-6 py-2.5 shrink-0">
        <div className="flex items-center justify-between">
          {/* Status pipeline tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter("__all__")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "__all__" ? "bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)] border border-[var(--border)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <Eye className="w-3 h-3" /> All
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[10px] font-bold text-[var(--text-secondary)]">{assets.length}</span>
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {([
              { key: "new", label: "Received", count: newCount, icon: Inbox, activeColor: "bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]" },
              { key: "assigned_to_campaign", label: "Assigned", count: assignedCount, icon: ArrowRight, activeColor: "bg-amber-50 text-amber-700 border-amber-200" },
              { key: "deployed", label: "Deployed", count: deployedCount, icon: CheckCircle, activeColor: "bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]" },
              { key: "archived", label: "Archived", count: archivedCount, icon: Archive, activeColor: "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]" },
            ] as const).map((s, i, arr) => (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => setStatusFilter(statusFilter === s.key ? "__all__" : s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === s.key ? `${s.activeColor} border shadow-sm` : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  <s.icon className="w-3 h-3" />
                  {s.label}
                  {s.count > 0 && <span className="ml-0.5 text-[10px] font-bold">{s.count}</span>}
                </button>
                {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 mx-0.5" />}
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="bg-[var(--bg-primary)] border border-dashed border-[var(--border)] rounded-lg px-3 py-1 text-xs text-[var(--text-secondary)] outline-none"
            >
              <option value="__all__">All Brands</option>
              {ALL_BRANDS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select
              value={formatFilter}
              onChange={e => setFormatFilter(e.target.value)}
              className="bg-[var(--bg-primary)] border border-dashed border-[var(--border)] rounded-lg px-3 py-1 text-xs text-[var(--text-secondary)] outline-none"
            >
              <option value="__all__">All Formats</option>
              {Object.entries(FORMAT_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Format breakdown bar */}
      {assets.length > 0 && Object.keys(formatCounts).length > 0 && (
        <div className="border-b border-[var(--border)] bg-[var(--bg-primary)] px-6 py-2 shrink-0">
          <div className="flex items-center gap-3">
            {Object.entries(formatCounts).sort((a, b) => b[1] - a[1]).map(([fmt, count]) => {
              const cfg = FORMAT_CONFIG[fmt] || { icon: Package, label: fmt, color: "#64748b" }
              const FmtIcon = cfg.icon
              return (
                <button
                  key={fmt}
                  onClick={() => setFormatFilter(formatFilter === fmt ? "__all__" : fmt)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-all ${
                    formatFilter === fmt
                      ? "bg-slate-900 text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
                  }`}
                >
                  <FmtIcon className="w-3 h-3" />
                  <span className="font-medium">{cfg.label}</span>
                  <span className={`font-bold ${formatFilter === fmt ? "text-white/70" : "text-[var(--text-muted)]"}`}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading assets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-2xl from-indigo-100 to-violet-100 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-indigo-300" />
            </div>
            <p className="text-lg font-medium text-[var(--text-secondary)]">No assets {statusFilter !== "__all__" ? `with "${STATUS_CONFIG[statusFilter]?.label}" status` : "in the hub"}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Assets are delivered here when the Content Division completes creative briefs</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(a => (
              <AssetCard key={a.id} asset={a} onUpdateStatus={updateStatus} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(a => (
              <AssetRow key={a.id} asset={a} onUpdateStatus={updateStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
