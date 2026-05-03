'use client';

import { useEffect, useState } from 'react';
import { Gift, Plus, X } from 'lucide-react';
import { useBrand, BRANDS } from '@/components/brand-context';
import { BrandBadge } from '@/components/brand-badge';

interface ReferralEngine {
  id: string;
  referrerName: string;
  referredName: string;
  status: string;
}

const ReferralsPage = () => {
  const { brand, appendBrand } = useBrand();
  const [referrals, setReferrals] = useState<ReferralEngine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    referrerName: '',
    referredName: '',
    status: 'pending',
    brand: 'TBF' as string,
  });

  const loadReferrals = async () => {
    setLoading(true);
    const res = await fetch(appendBrand('/api/channels/referrals'));
    setReferrals(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    loadReferrals();
  }, [brand]);

  const addReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/channels/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ referrerName: '', referredName: '', status: 'pending', brand: 'TBF' });
    loadReferrals();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="w-6 h-6" /> Referral Engine
            </h1>
            <BrandBadge />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage referrals.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Referral'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addReferral} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h3 className="text-lg font-bold">New Referral</h3>
          <select
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          >
            {BRANDS.filter(b => b.key !== 'all').map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
          </select>
          <input
            type="text"
            placeholder="Referrer Name"
            value={form.referrerName}
            onChange={(e) => setForm({ ...form, referrerName: e.target.value })}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Referred Name"
            value={form.referredName}
            onChange={(e) => setForm({ ...form, referredName: e.target.value })}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
            required
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
          <button type="submit" className="px-6 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">
            Create Referral
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {referrals.map((referral) => (
            <div key={referral.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-4">
              <p className="font-semibold">Referrer: {referral.referrerName}</p>
              <p className="font-semibold">Referred: {referral.referredName}</p>
              <p className="text-sm text-[var(--text-secondary)]">Status: {referral.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferralsPage;
