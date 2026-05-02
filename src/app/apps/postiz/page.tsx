"use client"

import { useEffect, useState, useCallback } from "react"
import { useBrand } from "@/context/BrandContext"
import { Share2, RefreshCw, ExternalLink, Loader2, Calendar, Send, AlertCircle, FileText, CheckCircle, XCircle } from "lucide-react"

interface Post {
  id: string
  content: string
  state: string
  publishDate: string | null
  url: string | null
}

export default function PostizPage() {
  const { activeBrand, brandInfo } = useBrand()
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [appUrl, setAppUrl] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/apps/postiz")
      const data = await res.json()
      setOnline(data.online)
      setPosts(Array.isArray(data.posts) ? data.posts : [])
      setTotalPosts(data.totalPosts || 0)
      setStats(data.stats || {})
    } catch { setOnline(false) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    setAppUrl(isLocal ? "http://localhost:8085" : "https://postiz.89-167-33-236.sslip.io")
    load()
  }, [load])

  const stateColor = (s: string) => {
    switch (s.toUpperCase()) {
      case "PUBLISHED": return "bg-emerald-500"
      case "QUEUE": case "SCHEDULED": return "bg-blue-500"
      case "DRAFT": return "bg-gray-400"
      case "ERROR": return "bg-red-500"
      default: return "bg-gray-400"
    }
  }

  const stateIcon = (s: string) => {
    switch (s.toUpperCase()) {
      case "PUBLISHED": return <Send className="w-3.5 h-3.5 text-emerald-400" />
      case "QUEUE": case "SCHEDULED": return <Calendar className="w-3.5 h-3.5 text-blue-400" />
      case "DRAFT": return <FileText className="w-3.5 h-3.5 text-gray-400" />
      case "ERROR": return <AlertCircle className="w-3.5 h-3.5 text-red-400" />
      default: return <FileText className="w-3.5 h-3.5 text-gray-400" />
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} /></div>
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Postiz</h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Social Media Scheduling & Management</p>
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
          <a href={appUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all">
            <ExternalLink className="w-4 h-4" /> Launch Postiz
          </a>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {online ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>{online ? "Connected — live data from Postiz" : "Postiz is offline"}</span>
      </div>

      {online && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2"><Send className="w-4 h-4 text-emerald-400" /><span className="text-xs" style={{ color: "var(--text-muted)" }}>Published</span></div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats.PUBLISHED || 0}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-blue-400" /><span className="text-xs" style={{ color: "var(--text-muted)" }}>In Queue</span></div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats.QUEUE || stats.SCHEDULED || 0}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-gray-400" /><span className="text-xs" style={{ color: "var(--text-muted)" }}>Drafts</span></div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats.DRAFT || 0}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-red-400" /><span className="text-xs" style={{ color: "var(--text-muted)" }}>Errors</span></div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats.ERROR || 0}</p>
            </div>
          </div>

          {posts.length > 0 && (
            <div className="rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Posts</h2>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{totalPosts} total</span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {posts.map((post) => (
                  <div key={post.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="mt-1 shrink-0">{stateIcon(post.state)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                        {post.content.length > 150 ? post.content.slice(0, 150) + "..." : post.content || "No content"}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded text-white ${stateColor(post.state)}`}>
                          {post.state}
                        </span>
                        {post.publishDate && (
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            {new Date(post.publishDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                        {post.url && (
                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline" style={{ color: "var(--text-muted)" }}>
                            View →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
