"use client"

import { useBrand } from "@/context/BrandContext"
import { BellRing, AlertTriangle } from "lucide-react"

export default function ListmonkPage() {
  const { activeBrand, brandInfo } = useBrand()

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-600">
          <BellRing className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Listmonk</h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Newsletter & Mailing List Manager</p>
        </div>
      </div>

      <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Listmonk Not Installed</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Listmonk is not yet deployed on this server. Once installed, this dashboard will show subscriber lists, campaigns, and delivery analytics.
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          For now, use SendFox and Acumbamail via the Email Lists page for newsletter management.
        </p>
      </div>
    </div>
  )
}
