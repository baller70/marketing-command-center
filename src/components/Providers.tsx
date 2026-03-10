"use client"

import { BrandProvider } from "@/context/BrandContext"

export default function Providers({ children }: { children: React.ReactNode }) {
  return <BrandProvider>{children}</BrandProvider>
}
