"use client"

import { useEffect, useState, useCallback } from "react"
import { useBrand } from "@/context/BrandContext"
import { BarChart2, RefreshCw, ExternalLink, Loader2, CheckCircle, XCircle } from "lucide-react"

export default function UmamiPage() {
  const { activeBrand, brandInfo } = useBrand()
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(false)
  const [appUrl, setAppUrl] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/apps/umami")
      const data = await res.json()
      setOnline(data.online)
      setAppUrl(data.remoteUrl || "")
    } catch { setOnline(false) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    setAppUrl(isLocal ? "http://localhost:8084" : "https://umami-dash.89-167-33-236.sslip.io")
    load()
  }, [load])

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-sky-500 to-blue-600">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Umami Analytics</h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Privacy-first web analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeBrand && activeBrand !== "__all__" && (
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              {brandInfo?.name || activeBrand}
            </span>
          )}
          <button type="button" onClick={load} className="p-2 rounded-lg transition-colors" style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <a href={appUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transition-all">
            <ExternalLink className="w-4 h-4" /> Launch Umami
          </a>
        </div>
      </div>

      <div className="rounded-xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          {online ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{online ? "Umami is running" : "Umami is offline"}</span>
        </div>
        {online ? (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Track page views, visitor sessions, referrers, and more across all brand websites. Click &ldquo;Launch Umami&rdquo; to view your full analytics dashboard.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Real-time Visitors", desc: "See who's on your sites right now" },
                { label: "Page Analytics", desc: "Most visited pages and bounce rates" },
                { label: "Referrer Tracking", desc: "Where your traffic comes from" },
                { label: "Device & Browser", desc: "What devices visitors use" },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Start the Umami Docker container to enable web analytics tracking.
          </p>
        )}
      </div>
    </div>
  )
}
