"use client"

import { useBrand as useMarketingBrand, ALL_BRANDS } from "@/context/BrandContext"

export type BrandKey = "all" | "TBF" | "RA1" | "ShotIQ" | "HoS" | "Bookmark"

export const BRANDS: { key: BrandKey; label: string; color: string; bg: string }[] = [
  { key: "all", label: "All Brands", color: "#888", bg: "#333" },
  ...ALL_BRANDS.map(b => ({ key: b.id as BrandKey, label: b.name, color: b.color, bg: b.color + "22" }))
]

export function useBrand() {
  const { activeBrand } = useMarketingBrand()
  const brand = activeBrand === "__all__" ? "all" : activeBrand
  const appendBrand = (url: string) => {
    if (brand === "all" || !brand) return url
    const sep = url.includes("?") ? "&" : "?"
    return `${url}${sep}brand=${brand}`
  }
  return { brand, appendBrand }
}
