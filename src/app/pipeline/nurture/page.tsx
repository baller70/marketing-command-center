'use client';

import { useEffect, useState } from 'react';
import { Mail, Plus, X } from 'lucide-react';
import { useBrand, BRANDS } from '@/components/brand-context';
import { BrandBadge } from '@/components/brand-badge';

interface NurtureSequence {
  id: string;
  name: string;
  brand: 'TBF' | 'RA1' | 'ShotIQ' | 'HoS' | 'Bookmark';
}

const NurturePage = () => {
  const { brand, appendBrand } = useBrand();
  const [sequences, setSequences] = useState<NurtureSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    brand: 'TBF' as 'TBF' | 'RA1' | 'ShotIQ' | 'HoS' | 'Bookmark',
  });

  const loadSequences = async () => {
    setLoading(true);
    const res = await fetch(appendBrand('/api/pipeline/nurture-sequences'));
    setSequences(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    loadSequences();
  }, [brand]);

  const addSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/pipeline/nurture-sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: '', brand: 'TBF' });
    loadSequences();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6" /> Nurture
            </h1>
            <BrandBadge />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage nurture sequences for all brands.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Sequence'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addSequence} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h3 className="text-lg font-bold">New Nurture Sequence</h3>
          <input
            type="text"
            placeholder="Sequence Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            required
          />
          <select
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value as 'TBF' | 'RA1' | 'ShotIQ' | 'HoS' | 'Bookmark' })}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          >
            {BRANDS.filter(b => b.key !== 'all').map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>
          <button type="submit" className="px-6 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">
            Create Sequence
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {sequences.map((sequence) => (
            <div key={sequence.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-4">
              <p className="font-semibold">{sequence.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">{sequence.brand}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NurturePage;
