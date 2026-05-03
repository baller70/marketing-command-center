'use client';

import { useEffect, useState } from 'react';
import { School, Plus, X } from 'lucide-react';
import { useBrand, BRANDS } from '@/components/brand-context';
import { BrandBadge } from '@/components/brand-badge';

interface SchoolPartnership {
  id: string;
  schoolName: string;
  contactName: string | null;
}

type FormBrand = Exclude<import('@/components/brand-context').BrandKey, 'all'>;

const SchoolsPage = () => {
  const { brand, appendBrand } = useBrand();
  const [partnerships, setPartnerships] = useState<SchoolPartnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    schoolName: '',
    contactName: '',
    brand: 'TBF' as FormBrand,
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch(appendBrand('/api/channels/schools'));
    setPartnerships(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, [brand]);

  const addPartnership = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(appendBrand('/api/channels/schools'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ schoolName: '', contactName: '', brand: 'TBF' });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <School className="w-6 h-6" /> School Partnerships
            <BrandBadge />
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage school partnerships.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Partnership'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addPartnership} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h3 className="text-lg font-bold">New School Partnership</h3>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Brand</label>
            <select
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value as typeof form.brand })}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            >
              {BRANDS.filter(b => b.key !== 'all').map(b => (
                <option key={b.key} value={b.key}>{b.label}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="School Name"
            value={form.schoolName}
            onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Contact Name"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          />
          <button type="submit" className="px-6 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">
            Create Partnership
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {partnerships.map((partnership) => (
            <div key={partnership.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-4">
              <p className="font-semibold">{partnership.schoolName}</p>
              <p className="text-sm text-[var(--text-secondary)]">{partnership.contactName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchoolsPage;
