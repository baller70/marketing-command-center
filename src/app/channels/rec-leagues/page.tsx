'use client'

import { useEffect, useState } from 'react'
import { Trophy, Plus, X, MapPin, DollarSign, Users } from 'lucide-react'
import { useBrand, BRANDS } from '@/components/brand-context'
import { BrandBadge } from '@/components/brand-badge'

interface RecLeague {
  id: string; leagueName: string; town: string; zone: number;
  contactName: string | null; contactEmail: string | null;
  partnershipType: string; sponsorshipCost: number;
  seasonsPartnered: number; leadsPerSeason: number; enrollments: number;
  status: string; notes: string | null;
}

const statusColors: Record<string, string> = {
  prospect: 'bg-[var(--bg-card)] text-[var(--text-primary)]',
  partner: 'bg-[var(--bg-card)] text-green-600',
  inactive: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
}

type FormBrand = Exclude<import('@/components/brand-context').BrandKey, 'all'>;

export default function RecLeaguesPage() {
  const { brand, appendBrand } = useBrand()
  const [leagues, setLeagues] = useState<RecLeague[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    leagueName: '', town: '', zone: '1', contactName: '', contactEmail: '',
    partnershipType: 'skills_night', sponsorshipCost: '0', status: 'prospect',
    brand: 'TBF' as FormBrand,
  })

  const load = async () => {
    setLoading(true)
    const res = await fetch(appendBrand('/api/channels/rec-leagues'))
    setLeagues(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [brand])

  const addLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(appendBrand('/api/channels/rec-leagues'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, zone: parseInt(form.zone), sponsorshipCost: parseFloat(form.sponsorshipCost) }),
    })
    setShowForm(false)
    setForm({ leagueName: '', town: '', zone: '1', contactName: '', contactEmail: '', partnershipType: 'skills_night', sponsorshipCost: '0', status: 'prospect', brand: 'TBF' as FormBrand })
    load()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-russo text-[var(--text-primary)] flex items-center gap-2">
            <Trophy className="w-6 h-6" /> Rec League Partnerships
            <BrandBadge />
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage sponsorships and partnerships with town rec leagues</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add League'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={addLeague} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h3 className="text-lg font-russo text-[var(--text-primary)]">New League Partnership</h3>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Brand</label>
            <select value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value as FormBrand }))}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none">
              {BRANDS.filter(b => b.key !== 'all').map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">League Name</label>
              <input type="text" value={form.leagueName} onChange={e => setForm(p => ({ ...p, leagueName: e.target.value }))} required
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Town</label>
              <input type="text" value={form.town} onChange={e => setForm(p => ({ ...p, town: e.target.value }))} required
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Zone</label>
              <select value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none">
                {[1, 2, 3, 4].map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Partnership Type</label>
              <select value={form.partnershipType} onChange={e => setForm(p => ({ ...p, partnershipType: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none">
                {['sponsorship', 'skills_night', 'post_season', 'coach_referral'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Cost ($)</label>
              <input type="number" value={form.sponsorshipCost} onChange={e => setForm(p => ({ ...p, sponsorshipCost: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">Create League</button>
        </form>
      )}

      {/* Leagues List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-[var(--bg-primary)] rounded-xl animate-pulse border border-[var(--border)]" />)}</div>
      ) : leagues.length === 0 ? (
        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-12 text-center">
          <Trophy className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No leagues found yet. Add one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {leagues.map(league => (
            <div key={league.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-4 hover:border-[var(--border)] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                    {league.leagueName}
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${statusColors[league.status] || 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>{league.status}</span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3" /> {league.town} (Zone {league.zone})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-secondary)]">{(league.partnershipType || "other").replace(/_/g, ' ')}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center justify-end gap-1">
                    <DollarSign className="w-3 h-3" /> {league.sponsorshipCost} cost
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div className="text-center flex-1 border-r border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Seasons</p>
                  <p className="text-sm text-[var(--text-primary)]">{league.seasonsPartnered}</p>
                </div>
                <div className="text-center flex-1 border-r border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Avg Leads</p>
                  <p className="text-sm text-[var(--text-primary)]">{league.leadsPerSeason}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Enrollments</p>
                  <p className="text-sm text-[var(--text-primary)]">{league.enrollments}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
