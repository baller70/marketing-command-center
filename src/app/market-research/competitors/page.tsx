'use client'

import { useEffect, useState } from 'react'
import { Swords, Plus, X, Globe, MapPin } from 'lucide-react'
import { useBrand } from '@/components/brand-context'
import { BrandBadge } from '@/components/brand-badge'

interface Competitor {
  id: string; name: string; type: string; location: string | null; distanceMiles: number | null;
  website: string | null; strengths: string | null; weaknesses: string | null;
  recentChanges: string | null; lastScrapedAt: string | null;
}

const TYPES = ['__all__', 'rec_league', 'private_trainer', 'regional_facility', 'aau_program', 'online_training']

export default function CompetitorsPage() {
  const { brand, appendBrand } = useBrand()
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [typeFilter, setTypeFilter] = useState('__all__')
  const [form, setForm] = useState({
    name: '', type: 'regional_facility', location: '', distanceMiles: '', website: '',
    strengths: '', weaknesses: ''
  })

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter !== '__all__') params.set('type', typeFilter)
    const baseUrl = params.toString() ? `/api/market-research/competitors?${params}` : '/api/market-research/competitors'
    const res = await fetch(appendBrand(baseUrl))
    setCompetitors(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [brand, typeFilter])

  const addCompetitor = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(appendBrand('/api/market-research/competitors'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, distanceMiles: parseFloat(form.distanceMiles) || 0 }),
    })
    setShowForm(false)
    setForm({ name: '', type: 'regional_facility', location: '', distanceMiles: '', website: '', strengths: '', weaknesses: '' })
    load()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-russo text-[var(--text-primary)] flex items-center gap-2">
            <Swords className="w-6 h-6" /> Competitor Intelligence
            <BrandBadge />
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Track market competitors and identify opportunities</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Competitor'}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
              typeFilter === t ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            }`}>
            {t === '__all__' ? 'All' : t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={addCompetitor} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h3 className="text-lg font-russo text-[var(--text-primary)]">New Competitor</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none">
                {TYPES.filter(t => t !== '__all__').map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Location</label>
              <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Strengths</label>
              <input type="text" value={form.strengths} onChange={e => setForm(p => ({ ...p, strengths: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Weaknesses (Opportunity)</label>
              <input type="text" value={form.weaknesses} onChange={e => setForm(p => ({ ...p, weaknesses: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">Create Competitor</button>
        </form>
      )}

      {/* Competitor List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-[var(--bg-primary)] rounded-xl animate-pulse border border-[var(--border)]" />)}</div>
      ) : competitors.length === 0 ? (
        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-12 text-center">
          <Swords className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No competitors tracked yet. Add one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {competitors.map(comp => (
            <div key={comp.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-4 hover:border-[var(--border)] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[var(--text-primary)] font-semibold">{comp.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)]">{(comp.type || "unknown").replace(/_/g, ' ')}</span>
                    {comp.location && <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><MapPin className="w-3 h-3" />{comp.location}</span>}
                  </div>
                </div>
                {comp.website && <Globe className="w-4 h-4 text-[var(--text-secondary)]" />}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-3 rounded-lg">
                  <p className="text-[10px] text-[var(--text-primary)] uppercase font-bold mb-1">Strengths</p>
                  <p className="text-[var(--text-secondary)] text-xs">{comp.strengths || '—'}</p>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-3 rounded-lg">
                  <p className="text-[10px] text-green-600 uppercase font-bold mb-1">Opportunity</p>
                  <p className="text-[var(--text-secondary)] text-xs">{comp.weaknesses || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
