"use client"

import { useEffect, useState, useCallback } from "react"
import { useBrand } from "@/context/BrandContext"
import { ClipboardList, RefreshCw, ExternalLink, Loader2, CheckCircle, XCircle } from "lucide-react"

export default function FormbricksPage() {
  const { activeBrand, brandInfo } = useBrand()
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(false)
  const [appUrl, setAppUrl] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/apps/formbricks")
      const data = await res.json()
      setOnline(data.online)
      setAppUrl(data.remoteUrl || "")
    } catch { setOnline(false) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    setAppUrl(isLocal ? "http://localhost:8086" : "https://formbricks.89-167-33-236.sslip.io")
    load()
  }, [load])

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-teal-500 to-green-600">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Formbricks</h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Surveys & User Feedback</p>
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
          <a href={appUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 transition-all">
            <ExternalLink className="w-4 h-4" /> Launch Formbricks
          </a>
        </div>
      </div>

      <div className="rounded-xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          {online ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{online ? "Formbricks is running" : "Formbricks is offline"}</span>
        </div>
        {online ? (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Create surveys, collect user feedback, and analyze responses. Embed surveys in brand websites or send them as standalone links.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "In-app Surveys", desc: "Collect feedback without leaving your site" },
                { label: "Link Surveys", desc: "Share surveys via links or email" },
                { label: "Response Analytics", desc: "Analyze feedback with built-in reports" },
                { label: "User Targeting", desc: "Show surveys to specific user segments" },
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
            Start the Formbricks service to create and manage surveys.
          </p>
        )}
      </div>
    </div>
  )
}
