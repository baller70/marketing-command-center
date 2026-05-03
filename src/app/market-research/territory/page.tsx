'use client'

import { useEffect, useState } from 'react'
import { MapPin, Plus, X, Users, Clock, Navigation } from 'lucide-react'
import { useBrand } from '@/components/brand-context'
import { BrandBadge } from '@/components/brand-badge'

interface TerritoryZone {
  id: string; zone: number; name: string; towns: string[];
  population: number; driveTime: string; priority: string;
}

const priorityColors: Record<string, string> = {
  MAXIMUM: 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]/30',
  HIGH: 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]/30',
  'MEDIUM-HIGH': 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]/30',
  MEDIUM: 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]/30',
}

export default function TerritoryPage() {
  const { brand, appendBrand } = useBrand()
  const [zones, setZones] = useState<TerritoryZone[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch(appendBrand('/api/market-research/territory'))
    setZones(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [brand])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-russo text-[var(--text-primary)] flex items-center gap-2">
            <MapPin className="w-6 h-6" /> Territory Map
            <BrandBadge />
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Geographic targeting zones and priorities</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-[var(--bg-primary)] rounded-xl animate-pulse border border-[var(--border)]" />)}</div>
      ) : zones.length === 0 ? (
        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-12 text-center">
          <MapPin className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No territory zones defined yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {zones.map(zone => {
            const towns = Array.isArray(zone.towns) ? zone.towns : []
            return (
              <div key={zone.id} className={`bg-[var(--bg-primary)] rounded-xl border p-6 relative overflow-hidden ${priorityColors[zone.priority].replace('text', 'border')}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="text-9xl font-russo font-bold">{zone.zone}</span>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-russo text-[var(--text-primary)]">{zone.name}</h3>
                    <span className={`px-3 py-1 rounded text-xs font-bold ${priorityColors[zone.priority]}`}>
                      {zone.priority} PRIORITY
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase flex items-center gap-1">
                        <Users className="w-3 h-3" /> Population
                      </p>
                      <p className="text-lg font-mono text-[var(--text-primary)]">{(zone.population || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                      <p className="text-[10px] text-[var(--text-secondary)] uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Drive Time
                      </p>
                      <p className="text-lg font-mono text-[var(--text-primary)]">{zone.driveTime}</p>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase mb-2 flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> Key Towns
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {towns.map(town => (
                        <span key={town} className="text-xs px-2 py-1 bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)]">
                          {town}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
