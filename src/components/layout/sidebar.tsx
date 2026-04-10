"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Brain, Building2, FileText, Layers, CheckSquare,
  Send, TrendingUp, Lightbulb, Tv, Package,
  Calendar, ChevronDown, ChevronRight,
  Target, LayoutDashboard, Wrench,
  Mail, Share2, BarChart2, ClipboardList, BellRing, Globe,
  Sun, Moon, Users, Workflow
} from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useBrand, ALL_BRANDS } from "@/context/BrandContext"
import { useTheme } from "@/components/ThemeProvider"

type NavItem = { label: string; href: string; icon: typeof Brain }

type NavSection = {
  title: string
  items: NavItem[]
  defaultCollapsed?: boolean
}

const sections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Pipeline",
    items: [
      { label: "Marketing Machine", href: "/pipeline", icon: Workflow },
      { label: "Brands", href: "/pipeline/brand-pods", icon: Building2 },
    ],
  },
  {
    title: "Contacts",
    items: [
      { label: "Leads & Contacts", href: "/leads", icon: Users },
      { label: "Email Lists", href: "/pipeline/email-config", icon: Mail },
    ],
  },
  {
    title: "Apps",
    defaultCollapsed: true,
    items: [
      { label: "Mautic", href: "/apps/mautic", icon: Mail },
      { label: "Postiz", href: "/apps/postiz", icon: Share2 },
      { label: "Listmonk", href: "/apps/listmonk", icon: BellRing },
      { label: "Formbricks", href: "/apps/formbricks", icon: ClipboardList },
      { label: "Cal.com", href: "/apps/calcom", icon: Calendar },
      { label: "Umami", href: "/apps/umami", icon: BarChart2 },
    ],
  },
  {
    title: "Settings",
    defaultCollapsed: true,
    items: [
      { label: "Intelligence", href: "/pipeline/intelligence", icon: Brain },
      { label: "Campaigns (Legacy)", href: "/pipeline/campaigns", icon: Target },
      { label: "Creative Briefs", href: "/pipeline/creative-briefs", icon: FileText },
      { label: "Assembly Line", href: "/pipeline/assembly", icon: Layers },
      { label: "Quality Gate", href: "/pipeline/quality-gate", icon: CheckSquare },
      { label: "Deployments", href: "/pipeline/deployments", icon: Send },
      { label: "Content Assets", href: "/pipeline/content-assets", icon: Package },
      { label: "Performance", href: "/pipeline/performance", icon: TrendingUp },
      { label: "Learning Engine", href: "/pipeline/learning", icon: Lightbulb },
      { label: "TV Shows", href: "/pipeline/tv-shows", icon: Tv },
      { label: "Seasonal", href: "/pipeline/seasonal", icon: Calendar },
      { label: "Division Files", href: "/files", icon: FileText },
      { label: "Tools", href: "/tools", icon: Wrench },
    ],
  },
]

function BrandSwitcher() {
  const { activeBrand, setActiveBrand, brandInfo } = useBrand()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open, close])

  const displayName = activeBrand === "__all__" ? "All Brands" : brandInfo?.name || activeBrand
  const displayColor = activeBrand === "__all__" ? "var(--text-secondary)" : brandInfo?.color || "var(--text-secondary)"

  return (
    <div className="mx-2 mb-2" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-theme bg-theme-secondary hover:bg-theme-card transition-colors text-sm"
      >
        <div
          className="w-3 h-3 rounded-full shrink-0 border border-theme"
          style={{ backgroundColor: displayColor }}
        />
        <span className="flex-1 text-left font-medium text-theme-primary truncate">{displayName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-theme-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-1 rounded-lg border border-theme bg-theme-primary shadow-lg overflow-hidden z-50 relative">
          <button
            type="button"
            onClick={() => { setActiveBrand("__all__"); setOpen(false) }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              activeBrand === "__all__" ? "font-medium" : "text-theme-secondary hover:bg-theme-secondary"
            }`}
            style={activeBrand === "__all__" ? { background: "var(--sidebar-active-bg)", color: "var(--sidebar-active-text)" } : undefined}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All Brands</span>
          </button>
          {ALL_BRANDS.map(brand => (
            <button
              key={brand.id}
              type="button"
              onClick={() => { setActiveBrand(brand.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                activeBrand === brand.id ? "font-medium" : "text-theme-secondary hover:bg-theme-secondary"
              }`}
              style={activeBrand === brand.id ? { background: "var(--sidebar-active-bg)", color: "var(--sidebar-active-text)" } : undefined}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0 border border-theme"
                style={{ backgroundColor: brand.color }}
              />
              <span className="truncate">{brand.name}</span>
              <span className="ml-auto text-[10px] text-theme-muted">{brand.shortName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  if (href === "/pipeline") return pathname === "/pipeline"
  return pathname === href || pathname.startsWith(href + "/")
}

function CollapsibleSection({ section, pathname }: { section: NavSection; pathname: string }) {
  const hasActiveChild = section.items.some(item => isRouteActive(pathname, item.href))
  const [collapsed, setCollapsed] = useState(section.defaultCollapsed && !hasActiveChild)

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2 text-[10px] uppercase tracking-widest text-theme-muted hover:text-theme-secondary transition-colors"
      >
        <span>{section.title}</span>
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {!collapsed && (
        <div className="space-y-0.5 px-2">
          {section.items.map(item => {
            const Icon = item.icon
            const active = isRouteActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  active ? "font-medium" : "hover:bg-theme-secondary"
                }`}
                style={
                  active
                    ? { background: "var(--sidebar-active-bg)", color: "var(--sidebar-active-text)" }
                    : { color: "var(--text-secondary)" }
                }
              >
                <Icon className="w-4 h-4 shrink-0 opacity-90" />
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
  const { theme, toggleTheme } = useTheme()
  const [kevinClawHref, setKevinClawHref] = useState("http://localhost:3100")

  useEffect(() => {
    setKevinClawHref(
      typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:3100"
        : "https://kevinclaw.89-167-33-236.sslip.io"
    )
  }, [])

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--border)" }}
    >
<a
        href={kevinClawHref}
        className="flex items-center gap-1 px-4 py-2 text-xs transition-colors hover:text-[var(--text-primary)]"
        style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
      >
        <span>&larr;</span> KevinClaw
      </a>
      <div className="p-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-theme-card border border-theme flex items-center justify-center">
            <Target className="w-5 h-5 text-theme-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-theme-primary tracking-tight">Marketing Engine</h1>
            <p className="text-[10px] text-theme-secondary uppercase tracking-widest">12-Stage Pipeline</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-theme-secondary">Derek — Marketing Agent</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <BrandSwitcher />
        {sections.map(section => (
          <CollapsibleSection key={section.title} section={section} pathname={pathname} />
        ))}
      </nav>

      <div className="px-3 py-2 mt-auto" style={{ borderTop: "1px solid var(--border)" }}>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-theme-secondary"
          style={{ color: "var(--text-secondary)" }}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>

      <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="text-[10px] text-theme-muted">
          <p>Marketing Engine v3.0</p>
          <p>6 Brands · 12 Stages · Pipeline</p>
        </div>
      </div>
    </aside>
  )
}
