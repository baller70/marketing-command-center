"use client"

import { useBrand } from "@/components/brand-context"

export function BrandBadge() {
  const { brand } = useBrand()
  if (!brand || brand === "all") return null
  return (
    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)] uppercase tracking-wider">
      {brand}
    </span>
  )
}
