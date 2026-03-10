"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Brain, Building2, FileText, Layers, CheckSquare,
  Send, TrendingUp, Lightbulb, Tv, Package,
  Calendar, ChevronDown, ChevronRight,
  Target, Megaphone, LayoutDashboard, Wrench,
  Mail, Share2, BarChart2, ClipboardList, BellRing, Globe,
  Zap
} from "lucide-react"
import { useState } from "react"
import { useBrand, ALL_BRANDS } from "@/context/BrandContext"

type PipelineStage = {
  num: number
  label: string
  href: string
  icon: typeof Brain
  subItems?: { label: string; href: string; icon: typeof Brain }[]
}

type PipelinePhase = {
  phase: string
  color: string
  dotColor: string
  stages: PipelineStage[]
}

const pipelinePhases: PipelinePhase[] = [
  {
    phase: "Strategy",
    color: "text-purple-500",
    dotColor: "bg-purple-500",
    stages: [
      { num: 1, label: "Intelligence", href: "/pipeline/intelligence", icon: Brain },
      { num: 2, label: "Brand Pods", href: "/pipeline/brand-pods", icon: Building2 },
      { num: 3, label: "TV Shows", href: "/pipeline/tv-shows", icon: Tv },
    ],
  },
  {
    phase: "Planning",
    color: "text-blue-500",
    dotColor: "bg-blue-500",
    stages: [
      { num: 4, label: "Campaigns", href: "/pipeline/campaigns", icon: Megaphone },
      { num: 5, label: "Creative Briefs", href: "/pipeline/creative-briefs", icon: FileText },
    ],
  },
  {
    phase: "Production",
    color: "text-cyan-500",
    dotColor: "bg-cyan-500",
    stages: [
      { num: 6, label: "Content Delivery", href: "/pipeline/content-assets", icon: Package },
      { num: 7, label: "Assembly Line", href: "/pipeline/assembly", icon: Layers },
    ],
  },
  {
    phase: "Quality",
    color: "text-yellow-600",
    dotColor: "bg-yellow-500",
    stages: [
      { num: 8, label: "Quality Gate", href: "/pipeline/quality-gate", icon: CheckSquare },
    ],
  },
  {
    phase: "Execution",
    color: "text-green-500",
    dotColor: "bg-green-500",
    stages: [
      {
        num: 9,
        label: "Marketing Apps",
        href: "/apps/mautic",
        icon: Zap,
        subItems: [
          { label: "Mautic", href: "/apps/mautic", icon: Mail },
          { label: "Postiz", href: "/apps/postiz", icon: Share2 },
          { label: "Listmonk", href: "/apps/listmonk", icon: BellRing },
          { label: "Formbricks", href: "/apps/formbricks", icon: ClipboardList },
          { label: "Cal.com", href: "/apps/calcom", icon: Calendar },
          { label: "Umami", href: "/apps/umami", icon: BarChart2 },
        ],
      },
      { num: 10, label: "Deployments", href: "/pipeline/deployments", icon: Send },
    ],
  },
  {
    phase: "Optimization",
    color: "text-orange-500",
    dotColor: "bg-orange-500",
    stages: [
      { num: 11, label: "Performance", href: "/pipeline/performance", icon: TrendingUp },
      { num: 12, label: "Learning Engine", href: "/pipeline/learning", icon: Lightbulb },
    ],
  },
]

const topSections = [
  {
    title: "Division Files",
    items: [{ label: "Files", href: "/files", icon: FileText }],
  },
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
]

const bottomSections = [
  {
    title: "Resources",
    items: [{ label: "Tools", href: "/tools", icon: Wrench }],
  },
]

function BrandSwitcher() {
  const { activeBrand, setActiveBrand, brandInfo } = useBrand()
  const [open, setOpen] = useState(false)

  const displayName = activeBrand === "__all__" ? "All Brands" : brandInfo?.name || activeBrand
  const displayColor = activeBrand === "__all__" ? "#f97316" : brandInfo?.color || "#f97316"

  return (
    <div className="mx-2 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-sm"
      >
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: displayColor }}
        />
        <span className="flex-1 text-left font-medium text-slate-700 truncate">{displayName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-1 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden z-50 relative">
          <button
            onClick={() => { setActiveBrand("__all__"); setOpen(false) }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              activeBrand === "__all__"
                ? "bg-orange-50 text-orange-600 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All Brands</span>
          </button>
          {ALL_BRANDS.map(brand => (
            <button
              key={brand.id}
              onClick={() => { setActiveBrand(brand.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                activeBrand === brand.id
                  ? "bg-orange-50 text-orange-600 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: brand.color }}
              />
              <span className="truncate">{brand.name}</span>
              <span className="ml-auto text-[10px] text-slate-400">{brand.shortName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NavSection({ title, items, pathname }: { title: string; items: { label: string; href: string; icon: typeof Brain }[]; pathname: string }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="mb-1">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2 text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
      >
        <span>{title}</span>
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {!collapsed && (
        <div className="space-y-0.5 px-2">
          {items.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-orange-50 text-orange-600 font-medium"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-orange-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [pipelineCollapsed, setPipelineCollapsed] = useState(false)
  const [appsExpanded, setAppsExpanded] = useState(false)

  const appPaths = ["/apps/mautic", "/apps/postiz", "/apps/listmonk", "/apps/formbricks", "/apps/calcom", "/apps/umami"]
  const isOnAppPage = appPaths.includes(pathname)

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Marketing Engine</h1>
            <p className="text-[10px] text-orange-600 uppercase tracking-widest">Autonomous Pipeline</p>
          </div>
        </div>
      </div>

      {/* Agent badge */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-500">Derek — Marketing Agent</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Top sections */}
        {topSections.map(section => (
          <NavSection key={section.title} title={section.title} items={section.items} pathname={pathname} />
        ))}

        {/* Pipeline */}
        <div className="mb-1">
          <button
            onClick={() => setPipelineCollapsed(!pipelineCollapsed)}
            className="w-full flex items-center justify-between px-4 py-2 text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span>Pipeline</span>
            {pipelineCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {!pipelineCollapsed && (
            <>
              <BrandSwitcher />

              <div className="px-2">
                {pipelinePhases.map((phase) => (
                  <div key={phase.phase} className="mb-1">
                    {/* Phase header */}
                    <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${phase.dotColor}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${phase.color}`}>{phase.phase}</span>
                    </div>

                    {/* Stages */}
                    <div className="space-y-0.5">
                      {phase.stages.map(stage => {
                        const Icon = stage.icon
                        const active = pathname === stage.href || (stage.subItems && stage.subItems.some(si => pathname === si.href))
                        const hasSubItems = stage.subItems && stage.subItems.length > 0
                        const showSubs = hasSubItems && (appsExpanded || isOnAppPage)

                        return (
                          <div key={stage.num}>
                            {hasSubItems ? (
                              <button
                                onClick={() => setAppsExpanded(!appsExpanded)}
                                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                                  active
                                    ? "bg-orange-50 text-orange-600 font-medium"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                              >
                                <span className="w-4 text-[10px] font-bold text-slate-300 text-right shrink-0">{stage.num}</span>
                                <Icon className={`w-3.5 h-3.5 ${active ? "text-orange-600" : "text-slate-400"}`} />
                                <span className="flex-1 text-left">{stage.label}</span>
                                {showSubs
                                  ? <ChevronDown className="w-3 h-3 text-slate-400" />
                                  : <ChevronRight className="w-3 h-3 text-slate-400" />
                                }
                              </button>
                            ) : (
                              <Link
                                href={stage.href}
                                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                                  active
                                    ? "bg-orange-50 text-orange-600 font-medium"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                              >
                                <span className="w-4 text-[10px] font-bold text-slate-300 text-right shrink-0">{stage.num}</span>
                                <Icon className={`w-3.5 h-3.5 ${active ? "text-orange-600" : "text-slate-400"}`} />
                                <span>{stage.label}</span>
                              </Link>
                            )}

                            {/* Sub-items for Marketing Apps */}
                            {showSubs && stage.subItems && (
                              <div className="ml-7 mt-0.5 space-y-0.5 border-l-2 border-green-200 pl-2">
                                {stage.subItems.map(sub => {
                                  const SubIcon = sub.icon
                                  const subActive = pathname === sub.href
                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all ${
                                        subActive
                                          ? "bg-green-50 text-green-700 font-medium"
                                          : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                                      }`}
                                    >
                                      <SubIcon className={`w-3.5 h-3.5 ${subActive ? "text-green-600" : "text-slate-300"}`} />
                                      <span>{sub.label}</span>
                                    </Link>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom sections */}
        {bottomSections.map(section => (
          <NavSection key={section.title} title={section.title} items={section.items} pathname={pathname} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="text-[10px] text-slate-400">
          <p>Marketing Engine v2.0</p>
          <p>6 Brands · 12 Stages · Autonomous</p>
        </div>
      </div>
    </aside>
  )
}
