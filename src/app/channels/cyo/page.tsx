'use client';

import { useEffect, useState } from 'react';
import { Church, Plus, X, MapPin, Users, Trash2, Calendar } from 'lucide-react';
import { useBrand, BRANDS } from '@/components/brand-context';
import { BrandBadge } from '@/components/brand-badge';

interface CYOProgram {
  id: string;
  name: string;
  parish: string | null;
  town: string | null;
  zone: number | null;
  ageGroups: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  partnershipType: string | null;
  status: string | null;
  brand: string | null;
  leadsGenerated: number | null;
  enrollments: number | null;
  seasonSchedule: string | null;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  prospect: 'bg-[var(--bg-card)] text-[var(--text-primary)]',
  partner: 'bg-[var(--bg-card)] text-green-600',
  inactive: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
};

const partnershipLabels: Record<string, string> = {
  skills_clinic: 'Skills Clinic',
  gym_rental: 'Gym Rental',
  flyers: 'Flyer Distribution',
  coach_referral: 'Coach Referral',
  sponsorship: 'Sponsorship',
  joint_event: 'Joint Event',
};

export default function CYOPage() {
  const { brand, appendBrand } = useBrand();
  const [programs, setPrograms] = useState<CYOProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', parish: '', town: '', zone: '1', ageGroups: '',
    contactName: '', contactEmail: '', contactPhone: '',
    partnershipType: 'skills_clinic', status: 'prospect', brand: 'TBF',
    seasonSchedule: '',
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch(appendBrand('/api/channels/cyo'));
    setPrograms(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [brand]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/channels/cyo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, zone: parseInt(form.zone) }),
    });
    setShowForm(false);
    setForm({ name: '', parish: '', town: '', zone: '1', ageGroups: '', contactName: '', contactEmail: '', contactPhone: '', partnershipType: 'skills_clinic', status: 'prospect', brand: 'TBF', seasonSchedule: '' });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/channels/cyo?id=${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-russo text-[var(--text-primary)] flex items-center gap-2">
              <Church className="w-6 h-6" /> CYO Programs
            </h1>
            <BrandBadge />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Track CYO league partnerships and family outreach opportunities</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add CYO Program'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h3 className="text-lg font-russo text-[var(--text-primary)]">New CYO Program</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Program Name</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Parish</label>
              <input type="text" value={form.parish} onChange={e => setForm(p => ({ ...p, parish: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Town</label>
              <input type="text" value={form.town} onChange={e => setForm(p => ({ ...p, town: e.target.value }))}
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
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Age Groups</label>
              <input type="text" placeholder="e.g. 3rd-8th" value={form.ageGroups} onChange={e => setForm(p => ({ ...p, ageGroups: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Partnership Type</label>
              <select value={form.partnershipType} onChange={e => setForm(p => ({ ...p, partnershipType: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none">
                {Object.entries(partnershipLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Contact Name</label>
              <input type="text" value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Brand</label>
              <select value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:border-[var(--border)] focus:outline-none">
                {BRANDS.filter(b => b.key !== 'all').map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">Create CYO Program</button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-[var(--bg-primary)] rounded-xl animate-pulse border border-[var(--border)]" />)}</div>
      ) : programs.length === 0 ? (
        <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-12 text-center">
          <Church className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No CYO programs tracked yet. Add one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {programs.map(prog => (
            <div key={prog.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-4 hover:border-[var(--border)] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
                    {prog.name}
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${statusColors[prog.status || ''] || 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                      {prog.status}
                    </span>
                  </h3>
                  {prog.parish && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{prog.parish}</p>}
                  <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {prog.town} {prog.zone ? `(Zone ${prog.zone})` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {prog.brand && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">{prog.brand}</span>
                  )}
                  <button onClick={() => remove(prog.id)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                {prog.ageGroups && <span className="text-xs px-2 py-0.5 bg-[var(--bg-card)] text-[var(--text-primary)] rounded">{prog.ageGroups}</span>}
                <span className="text-xs text-[var(--text-secondary)]">{partnershipLabels[prog.partnershipType || ''] || prog.partnershipType}</span>
                {prog.seasonSchedule && (
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {prog.seasonSchedule}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div className="text-center flex-1 border-r border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Leads</p>
                  <p className="text-sm text-[var(--text-primary)]">{prog.leadsGenerated || 0}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Enrollments</p>
                  <p className="text-sm text-[var(--text-primary)]">{prog.enrollments || 0}</p>
                </div>
              </div>

              {prog.contactName && (
                <p className="text-xs text-[var(--text-secondary)] mt-2 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {prog.contactName} {prog.contactEmail && `· ${prog.contactEmail}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
