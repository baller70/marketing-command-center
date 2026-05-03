'use client'

import { useEffect, useState, useCallback } from 'react'
import { Globe, Plus, X, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'

interface LeadSource {
  id: string; name: string; category: string; type: string; brand: string;
  config: unknown; schedule: string | null; totalLeads: number; qualifiedRate: number;
  enrollmentRate: number; costPerLead: number; costPerEnrollment: number;
  verdict: string; status: string; lastRunAt: string | null;
}

const CATEGORIES = ['__all__', 'outbound_scraper', 'social_scraper', 'community', 'inbound', 'referral', 'walk_in']

const verdictColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  scale: { bg: 'bg-[var(--bg-card)]', text: 'text-green-600', icon: TrendingUp },
  maintain: { bg: 'bg-[var(--bg-card)]', text: 'text-[var(--text-primary)]', icon: Minus },
  optimize: { bg: 'bg-[var(--bg-card)]', text: 'text-[var(--text-primary)]', icon: Zap },
  kill: { bg: 'bg-[var(--bg-card)]', text: 'text-[var(--text-primary)]', icon: TrendingDown },
}

const catColors: Record<string, string> = {
  outbound_scraper: 'border-[var(--border)]/30',
  social_scraper: 'border-[var(--border)]/30',
  community: 'border-[var(--border)]/30',
  inbound: 'border-[var(--border)]/30',
  referral: 'border-pink-500/30',
  walk_in: 'border-[var(--border)]/30',
}

export default function LeadSourcesPage() {
  const [sources, setSources] = useState<LeadSource[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('__all__')

  const loadSources = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (catFilter !== '__all__') params.set('category', catFilter)
    const res = await fetch(`/api/market-research/lead-sources?${params}`)
    setSources(await res.json())
    setLoading(false)
  }, [catFilter])

  useEffect(() => { loadSources() }, [loadSources])

  const grouped = sources.reduce<Record<string, LeadSource[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-russo text-[var(--text-primary)] flex items-center gap-2">
            <Globe className="w-6 h-6" /> Lead Sources
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Performance tracking for all acquisition channels</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${catFilter === c ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}>
            {c === '__all__' ? 'All' : c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-[var(--bg-primary)] rounded-xl animate-pulse border border-[var(--border)]" />)}</div>
      ) : sources.length === 0 ? (
        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-12 text-center">
          <Globe className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No lead sources configured yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catSources]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                {category.replace(/_/g, ' ')} ({catSources.length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {catSources.map(src => {
                  const v = verdictColors[src.verdict] || verdictColors.maintain
                  const VIcon = v.icon
                  return (
                    <div key={src.id} className={`bg-[var(--bg-primary)] rounded-xl border ${catColors[src.category] || 'border-[var(--border)]'} p-4 hover:border-[var(--border)] transition-colors`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[var(--text-primary)] font-semibold">{src.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[var(--text-secondary)]">{(src.type || "unknown").replace(/_/g, ' ')}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)]">{src.brand}</span>
                              {src.schedule && <span className="text-xs text-[var(--text-secondary)]">{src.schedule}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-russo text-[var(--text-primary)]">{src.totalLeads}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">Leads</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-russo text-[var(--text-primary)]">{src.qualifiedRate}%</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">Qualified</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-russo text-green-600">{src.enrollmentRate}%</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">Enrolled</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-russo text-[var(--text-primary)]">${src.costPerLead}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">CPL</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-russo text-[var(--text-primary)]">${src.costPerEnrollment}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">CPE</p>
                          </div>
                          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${v.bg} ${v.text} text-xs font-bold uppercase`}>
                            <VIcon className="w-3 h-3" />
                            {src.verdict}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
