"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface Brand {
  id: string
  name: string
  shortName: string
  color: string
}

export const ALL_BRANDS: Brand[] = [
  { id: "TBF", name: "The Basketball Factory", shortName: "TBF", color: "#1E3A8A" },
  { id: "RA1", name: "Rise As One AAU", shortName: "RA1", color: "#CE1126" },
  { id: "HoS", name: "House of Sports", shortName: "HoS", color: "#F59E0B" },
  { id: "ShotIQ", name: "ShotIQ", shortName: "ShotIQ", color: "#8B5CF6" },
  { id: "Kevin", name: "Kevin Houston", shortName: "Kevin", color: "#059669" },
  { id: "Bookmark", name: "BookmarkAI Hub", shortName: "Bookmark", color: "#0EA5E9" },
]

interface BrandContextValue {
  activeBrand: string
  setActiveBrand: (id: string) => void
  brandInfo: Brand | null
}

const BrandContext = createContext<BrandContextValue>({
  activeBrand: "__all__",
  setActiveBrand: () => {},
  brandInfo: null,
})

export function BrandProvider({ children }: { children: ReactNode }) {
  const [activeBrand, setActiveBrandState] = useState("__all__")

  useEffect(() => {
    const saved = localStorage.getItem("marketing-active-brand")
    if (saved) setActiveBrandState(saved)
  }, [])

  const setActiveBrand = (id: string) => {
    setActiveBrandState(id)
    localStorage.setItem("marketing-active-brand", id)
  }

  const brandInfo = activeBrand === "__all__"
    ? null
    : ALL_BRANDS.find(b => b.id === activeBrand) || null

  return (
    <BrandContext.Provider value={{ activeBrand, setActiveBrand, brandInfo }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  return useContext(BrandContext)
}
