'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, X, Trash2, Zap, Clock, CheckCircle } from 'lucide-react';
import { useBrand, BRANDS } from '@/components/brand-context';
import { BrandBadge } from '@/components/brand-badge';

interface CommunityEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  brand: string | null;
  eventType: string | null;
  startDate: string | null;
  endDate: string | null;
}

type ViewTab = 'events' | 'seasonal';
type EventStatus = 'active' | 'upcoming' | 'past';

function getSeasonalStatus(start: string, end: string): EventStatus {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now >= s && now <= e) return 'active';
  if (now < s) return 'upcoming';
  return 'past';
}

const statusConfig: Record<EventStatus, { label: string; className: string; icon: React.ElementType }> = {
  active: { label: 'Active', className: 'text-green-600 bg-[var(--bg-card)] border-[var(--border)]', icon: Zap },
  upcoming: { label: 'Upcoming', className: 'text-[var(--text-primary)] bg-[var(--bg-card)] border-[var(--border)]', icon: Clock },
  past: { label: 'Past', className: 'text-[var(--text-secondary)] bg-[var(--bg-secondary)] border-[var(--border)]', icon: CheckCircle },
};

function daysLabel(start: string, end: string): string {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  const ms = 86400000;
  const status = getSeasonalStatus(start, end);
  if (status === 'active') {
    const d = Math.ceil((e.getTime() - now.getTime()) / ms);
    return `${d} day${d !== 1 ? 's' : ''} remaining`;
  }
  if (status === 'upcoming') {
    const d = Math.ceil((s.getTime() - now.getTime()) / ms);
    return `Starts in ${d} day${d !== 1 ? 's' : ''}`;
  }
  const d = Math.floor((now.getTime() - e.getTime()) / ms);
  return `Ended ${d} day${d !== 1 ? 's' : ''} ago`;
}

export default function CommunityPage() {
  const { brand, appendBrand } = useBrand();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [seasonals, setSeasonals] = useState<{ id: string; eventName: string; startDate: string; endDate: string; brand: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<ViewTab>('events');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [form, setForm] = useState({ name: '', date: '', location: '', brand: 'TBF', eventType: 'clinic' });
  const [seasonalForm, setSeasonalForm] = useState({ eventName: '', startDate: '', endDate: '', brand: 'TBF' });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const [evRes, seRes] = await Promise.all([
      fetch(appendBrand('/api/channels/community-events')),
      fetch(appendBrand('/api/channels/seasonal')),
    ]);
    setEvents(await evRes.json());
    setSeasonals(await seRes.json());
    setLoading(false);
  }, [brand]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/channels/community-events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, date: new Date(form.date) }),
    });
    setShowForm(false);
    setForm({ name: '', date: '', location: '', brand: 'TBF', eventType: 'clinic' });
    loadEvents();
  };

  const addSeasonal = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/channels/seasonal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...seasonalForm, startDate: new Date(seasonalForm.startDate), endDate: new Date(seasonalForm.endDate) }),
    });
    setShowForm(false);
    setSeasonalForm({ eventName: '', startDate: '', endDate: '', brand: 'TBF' });
    loadEvents();
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/channels/community-events?id=${id}`, { method: 'DELETE' });
    loadEvents();
  };

  const deleteSeasonal = async (id: string) => {
    await fetch(`/api/channels/seasonal?id=${id}`, { method: 'DELETE' });
    loadEvents();
  };

  const eventTypes: Record<string, string> = {
    clinic: 'Clinic', camp: 'Camp', open_gym: 'Open Gym', showcase: 'Showcase', fundraiser: 'Fundraiser', other: 'Other',
  };

  const filteredSeasonals = statusFilter === 'all'
    ? seasonals
    : seasonals.filter(s => getSeasonalStatus(s.startDate, s.endDate) === statusFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-russo text-[var(--text-primary)] flex items-center gap-2">
              <Calendar className="w-6 h-6" /> Community Events
            </h1>
            <BrandBadge />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Clinics, camps, open gyms, showcases, and seasonal campaigns</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add'}
        </button>
      </div>

      <div className="flex gap-2">
        {(['events', 'seasonal'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'
            }`}>
            {t === 'events' ? `Events (${events.length})` : `Seasonal (${seasonals.length})`}
          </button>
        ))}
      </div>

      {showForm && tab === 'events' && (
        <form onSubmit={addEvent} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h3 className="text-lg font-russo text-[var(--text-primary)]">New Community Event</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Event Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
            <input type="text" placeholder="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
            <select value={form.eventType} onChange={e => setForm(p => ({ ...p, eventType: e.target.value }))}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
              {Object.entries(eventTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
              {BRANDS.filter(b => b.key !== 'all').map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
          <button type="submit" className="px-6 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">Create Event</button>
        </form>
      )}

      {showForm && tab === 'seasonal' && (
        <form onSubmit={addSeasonal} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h3 className="text-lg font-russo text-[var(--text-primary)]">New Seasonal Campaign</h3>
          <input type="text" placeholder="Campaign Name" value={seasonalForm.eventName} onChange={e => setSeasonalForm(p => ({ ...p, eventName: e.target.value }))} required
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Start</label>
              <input type="date" value={seasonalForm.startDate} onChange={e => setSeasonalForm(p => ({ ...p, startDate: e.target.value }))} required
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">End</label>
              <input type="date" value={seasonalForm.endDate} onChange={e => setSeasonalForm(p => ({ ...p, endDate: e.target.value }))} required
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">Brand</label>
              <select value={seasonalForm.brand} onChange={e => setSeasonalForm(p => ({ ...p, brand: e.target.value }))}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
                {BRANDS.filter(b => b.key !== 'all').map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] rounded-lg text-sm font-semibold transition-colors">Create Campaign</button>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] animate-pulse" />)}</div>
      ) : tab === 'events' ? (
        events.length === 0 ? (
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-secondary)]">No community events yet.</div>
        ) : (
          <div className="space-y-2">
            {events.map(event => (
              <div key={event.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{event.name}</p>
                    {event.eventType && <span className="text-[10px] px-2 py-0.5 bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)] uppercase">{event.eventType}</span>}
                    {event.brand && <span className="text-[10px] px-2 py-0.5 bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)]">{event.brand}</span>}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{new Date(event.date).toLocaleDateString()} · {event.location}</p>
                </div>
                <button onClick={() => deleteEvent(event.id)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {seasonals.length > 0 && (
            <div className="flex gap-2">
              {(['all', 'active', 'upcoming', 'past'] as const).map(key => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === key ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'
                  }`}>
                  {key === 'all' ? `All ${seasonals.length}` : `${key.charAt(0).toUpperCase() + key.slice(1)} ${seasonals.filter(s => getSeasonalStatus(s.startDate, s.endDate) === key).length}`}
                </button>
              ))}
            </div>
          )}
          {filteredSeasonals.length === 0 ? (
            <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-secondary)]">
              {seasonals.length === 0 ? 'No seasonal campaigns yet.' : 'No campaigns match this filter.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSeasonals.map(event => {
                const status = getSeasonalStatus(event.startDate, event.endDate);
                const config = statusConfig[status];
                const StatusIcon = config.icon;
                return (
                  <div key={event.id} className={`bg-[var(--bg-primary)] rounded-xl border p-4 flex items-center justify-between ${status === 'active' ? 'border-[var(--border)]' : 'border-[var(--border)]'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${status === 'past' ? 'text-[var(--text-secondary)]' : ''}`}>{event.eventName}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.className}`}>
                          <StatusIcon className="w-3 h-3" /> {config.label}
                        </span>
                        {event.brand && <span className="text-[10px] px-2 py-0.5 bg-[var(--bg-secondary)] rounded text-[var(--text-secondary)]">{event.brand}</span>}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {new Date(event.startDate).toLocaleDateString()} – {new Date(event.endDate).toLocaleDateString()}
                        <span className="text-[var(--text-secondary)] ml-2">· {daysLabel(event.startDate, event.endDate)}</span>
                      </p>
                    </div>
                    <button onClick={() => deleteSeasonal(event.id)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}


