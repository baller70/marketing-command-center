"use client"

import { useState, useEffect, useCallback } from "react"
import { Save, RefreshCw, Mail, Loader2 } from "lucide-react"
import { ALL_BRANDS } from "@/context/BrandContext"
import { useBrand } from "@/context/BrandContext"

interface BrandEmailConfig {
  id: string
  brand: string
  sendfoxListId: string | null
  acumbamailListId: string | null
  defaultEmailPlatform: string
  emailTemplateId: string | null
  emailFromName: string | null
  emailReplyTo: string | null
  brandColor: string | null
  ctaUrl: string | null
}

export default function EmailConfigPage() {
  const { activeBrand, brandInfo } = useBrand()
  const [configs, setConfigs] = useState<BrandEmailConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch("/api/brand-email-config")
      const data = await res.json()
      if (data.success) {
        setConfigs(data.configs)
      }
    } catch {
      setError("Failed to load configs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (config: BrandEmailConfig) => {
    setSaving(config.brand)
    try {
      const res = await fetch("/api/brand-email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        load()
      }
    } catch {
      setError("Failed to save")
    } finally {
      setSaving(null)
    }
  }

  const updateConfig = (brand: string, field: string, value: string) => {
    setConfigs(prev => prev.map(c =>
      c.brand === brand ? { ...c, [field]: value || null } : c
    ))
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-russo text-2xl" style={{ color: "var(--text-primary)" }}>Email List Configuration</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Map each brand to its email platform and subscriber list
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--bg-card)] transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {ALL_BRANDS.filter(b => activeBrand === '__all__' || b.id === activeBrand).map(brand => {
          const config = configs.find(c => c.brand === brand.id) || {
            id: "",
            brand: brand.id,
            sendfoxListId: null,
            acumbamailListId: null,
            defaultEmailPlatform: "sendfox",
            emailTemplateId: null,
            emailFromName: null,
            emailReplyTo: null,
            brandColor: brand.color,
            ctaUrl: null,
          }

          return (
            <div
              key={brand.id}
              className="rounded-xl p-4 space-y-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: brand.color }} />
                  <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>{brand.name}</h3>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{brand.shortName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave(config)}
                  disabled={saving === brand.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {saving === brand.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                    Default Platform
                  </label>
                  <select
                    value={config.defaultEmailPlatform}
                    onChange={e => updateConfig(brand.id, "defaultEmailPlatform", e.target.value)}
                    className="w-full px-2 py-1.5 rounded text-xs outline-none"
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  >
                    <option value="sendfox">SendFox</option>
                    <option value="acumbamail">Acumbamail</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                    SendFox List ID
                  </label>
                  <input
                    value={config.sendfoxListId || ""}
                    onChange={e => updateConfig(brand.id, "sendfoxListId", e.target.value)}
                    placeholder="e.g., 12345"
                    className="w-full px-2 py-1.5 rounded text-xs outline-none"
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                    Acumbamail List ID
                  </label>
                  <input
                    value={config.acumbamailListId || ""}
                    onChange={e => updateConfig(brand.id, "acumbamailListId", e.target.value)}
                    placeholder="e.g., 67890"
                    className="w-full px-2 py-1.5 rounded text-xs outline-none"
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                    From Name
                  </label>
                  <input
                    value={config.emailFromName || ""}
                    onChange={e => updateConfig(brand.id, "emailFromName", e.target.value)}
                    placeholder={brand.name}
                    className="w-full px-2 py-1.5 rounded text-xs outline-none"
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                    Reply-To Email
                  </label>
                  <input
                    value={config.emailReplyTo || ""}
                    onChange={e => updateConfig(brand.id, "emailReplyTo", e.target.value)}
                    placeholder="info@example.com"
                    className="w-full px-2 py-1.5 rounded text-xs outline-none"
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium block mb-1" style={{ color: "var(--text-muted)" }}>
                    CTA URL
                  </label>
                  <input
                    value={config.ctaUrl || ""}
                    onChange={e => updateConfig(brand.id, "ctaUrl", e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2 py-1.5 rounded text-xs outline-none"
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
