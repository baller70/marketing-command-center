"use client";

import { useState, useEffect } from "react";
import {
  brands,
  emailLists,
  campaigns,
  tools,
  leadFunnel,
  workflows,
  handoffPoints,
  territories,
  competitors,
  schools,
  njacPlayerRankings,
  referrals,
  referralProgram,
  localEvents,
  partnerships,
  marketShareGoals,
  expansionPhases,
  type Campaign,
  type Tool,
  type Territory,
  type Competitor,
  type School,
} from "@/lib/data";
import {
  BarChart3,
  Mail,
  Calendar,
  Users,
  Settings,
  TrendingUp,
  Target,
  Megaphone,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Send,
  Podcast,
  Bot,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Pause,
  FileText,
  RefreshCw,
  Map,
  Eye,
  School as SchoolIcon,
  Trophy,
  Gift,
  CalendarDays,
  Handshake,
  PieChart,
  Rocket,
  MapPin,
  Building,
  GraduationCap,
  Star,
  AlertTriangle,
  Plus,
  Phone,
  AtSign,
  Sparkles,
  X,
} from "lucide-react";

interface LiveEmailData {
  totalLists: number;
  totalSubscribers: number;
  reachinboxCampaigns: number;
  platforms: {
    sendfox: { connected: boolean; lists: any[]; totalSubscribers: number };
    acumbamail: { connected: boolean; lists: any[]; totalSubscribers: number };
    reachinbox: { connected: boolean; account: any; campaigns: number };
  };
}

// Inbox Badge Component
function InboxBadge({ 
  name, 
  email, 
  color, 
  isActive,
  onClick 
}: { 
  name: string; 
  email: string; 
  color: string; 
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-left transition-all ${
        isActive 
          ? 'border-white/30 bg-white/5' 
          : 'border-neutral-700 hover:border-neutral-600'
      }`}
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
    >
      <p className="text-sm font-medium text-white">{name}</p>
      <p className="text-xs text-neutral-400 truncate max-w-[200px]">{email}</p>
    </button>
  );
}

export default function MarketingCommandCenter() {
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [liveEmailData, setLiveEmailData] = useState<LiveEmailData | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [inboxEmails, setInboxEmails] = useState<any[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [connectedInboxes, setConnectedInboxes] = useState<any[]>([]);
  const [selectedInbox, setSelectedInbox] = useState<string | null>(null);

  // Fetch connected inboxes
  const fetchInboxes = async () => {
    try {
      const res = await fetch('/api/inboxes');
      const data = await res.json();
      if (data.success) {
        setConnectedInboxes(data.inboxes);
      }
    } catch (error) {
      console.error('Failed to fetch inboxes:', error);
    }
  };

  // Fetch inbox emails
  const fetchInbox = async () => {
    setLoadingInbox(true);
    try {
      const res = await fetch('/api/gmail?limit=30');
      const data = await res.json();
      if (data.success) {
        setInboxEmails(data.emails);
      }
    } catch (error) {
      console.error('Failed to fetch inbox:', error);
    } finally {
      setLoadingInbox(false);
    }
  };

  // Add email to marketing funnel
  const addToFunnel = async (email: any) => {
    // Add to SendFox list
    try {
      const res = await fetch('/api/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'sendfox',
          action: 'add_contact',
          data: {
            email: email.from,
            firstName: email.fromName?.split(' ')[0] || '',
            lastName: email.fromName?.split(' ').slice(1).join(' ') || '',
            listId: 534537 // TBF Skillz Training Product list
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(`Added ${email.from} to funnel!`);
      }
    } catch (error) {
      console.error('Failed to add to funnel:', error);
      alert('Failed to add to funnel');
    }
  };

  // Fetch live email data
  useEffect(() => {
    async function fetchEmailData() {
      try {
        const res = await fetch('/api/email/lists');
        const data = await res.json();
        if (data.success) {
          setLiveEmailData({
            totalLists: data.summary.totalLists,
            totalSubscribers: data.summary.totalSubscribers,
            reachinboxCampaigns: data.summary.reachinboxCampaigns,
            platforms: data.platforms
          });
        }
      } catch (error) {
        console.error('Failed to fetch email data:', error);
      } finally {
        setLoadingEmail(false);
      }
    }
    fetchEmailData();
    fetchInboxes();
  }, []);

  // Contacts state
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactFilter, setContactFilter] = useState('real');
  const [contactSearch, setContactSearch] = useState('');
  const [contactStats, setContactStats] = useState<any>(null);

  // Fetch unified contacts
  const fetchContacts = async (filter = 'real', search = '') => {
    setContactsLoading(true);
    try {
      const params = new URLSearchParams({ filter, limit: '100' });
      if (search) params.append('search', search);
      const res = await fetch(`/api/contacts?${params}`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
        setContactStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const sections = [
    { id: "overview", label: "Dashboard", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "funnels", label: "Funnels", icon: Target },
    { id: "inbox", label: "Inbox", icon: Mail },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "platforms", label: "Platforms", icon: Zap },
    { id: "newsletter", label: "Newsletter", icon: FileText },
    { id: "podcast", label: "Podcast", icon: Podcast },
    { id: "territory", label: "Territory", icon: Map },
    { id: "competitors", label: "Intel", icon: Eye },
    { id: "schools", label: "Schools", icon: SchoolIcon },
    { id: "njac", label: "NJAC", icon: Trophy },
    { id: "referrals", label: "Referrals", icon: Gift },
    { id: "events", label: "Events", icon: CalendarDays },
    { id: "partnerships", label: "Partners", icon: Handshake },
    { id: "marketshare", label: "Share", icon: PieChart },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "lists", label: "Lists", icon: Mail },
    { id: "tools", label: "Tools", icon: Settings },
  ];

  const categoryLabels: Record<string, string> = {
    email: "Email Marketing",
    social: "Social Media",
    analytics: "Analytics",
    podcast: "Podcast",
    automation: "Automation",
    ads: "Advertising",
  };

  const categoryIcons: Record<string, typeof Mail> = {
    email: Mail,
    social: Megaphone,
    analytics: BarChart3,
    podcast: Podcast,
    automation: Bot,
    ads: Target,
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    "needs-setup": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "oauth-required": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  const territoryStatusColors: Record<string, string> = {
    dominated: "bg-green-500",
    strong: "bg-blue-500",
    growing: "bg-yellow-500",
    untapped: "bg-neutral-500",
    "competitor-heavy": "bg-red-500",
  };

  const threatColors: Record<string, string> = {
    high: "bg-red-500/20 text-red-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-green-500/20 text-green-400",
  };

  const campaignStatusColors: Record<string, string> = {
    draft: "bg-neutral-500/20 text-neutral-400",
    scheduled: "bg-blue-500/20 text-blue-400",
    active: "bg-green-500/20 text-green-400",
    completed: "bg-purple-500/20 text-purple-400",
    paused: "bg-yellow-500/20 text-yellow-400",
  };

  const campaignStatusIcons: Record<string, typeof Clock> = {
    draft: FileText,
    scheduled: Clock,
    active: Play,
    completed: CheckCircle,
    paused: Pause,
  };

  const counties = [...new Set(territories.map(t => t.county))];
  const filteredTerritories = selectedCounty 
    ? territories.filter(t => t.county === selectedCounty)
    : territories;

  const totalStudents = territories.reduce((sum, t) => sum + t.currentStudents, 0);
  const dominatedTerritories = territories.filter(t => t.status === 'dominated').length;
  const totalSchools = schools.length;
  const activePartnerships = partnerships.filter(p => p.status === 'active').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Russo One, sans-serif' }}>
                  Market Domination Center
                </h1>
                <p className="text-xs text-neutral-400">Northern NJ → NJ → USA</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-neutral-500">Email Subscribers</p>
                <p className="text-xl font-bold text-green-400">
                  {loadingEmail ? '...' : (liveEmailData?.totalSubscribers.toLocaleString() || '0')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Territories</p>
                <p className="text-xl font-bold text-blue-400">{dominatedTerritories}/{territories.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Schools</p>
                <p className="text-xl font-bold text-purple-400">{totalSchools}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Campaigns</p>
                <p className="text-xl font-bold text-orange-400">
                  {loadingEmail ? '...' : (liveEmailData?.reachinboxCampaigns || '0')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Navigation Tabs */}
        <nav className="flex gap-1 mb-6 overflow-x-auto pb-2 flex-wrap">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                  activeSection === section.id
                    ? "bg-orange-500 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </nav>

        {/* OVERVIEW / DASHBOARD */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Expansion Phases */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {expansionPhases.map((phase) => (
                <div 
                  key={phase.phase}
                  className={`p-5 rounded-xl border ${
                    phase.status === 'active' 
                      ? 'bg-gradient-to-br from-orange-900/30 to-red-900/20 border-orange-500/30' 
                      : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Rocket className={`w-5 h-5 ${phase.status === 'active' ? 'text-orange-400' : 'text-neutral-500'}`} />
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      phase.status === 'active' ? 'bg-orange-500/20 text-orange-400' : 'bg-neutral-700 text-neutral-400'
                    }`}>
                      Phase {phase.phase}
                    </span>
                  </div>
                  <h3 className="font-bold text-white mb-1">{phase.name}</h3>
                  <p className="text-xs text-neutral-400 mb-3">Target: {phase.targetDate}</p>
                  <div className="space-y-1">
                    {phase.milestones.slice(0, 3).map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {m.completed ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-neutral-600" />
                        )}
                        <span className={m.completed ? 'text-neutral-400 line-through' : 'text-neutral-300'}>
                          {m.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <Map className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-2xl font-bold text-white">{territories.length}</p>
                <p className="text-xs text-neutral-400">Target Territories</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <Eye className="w-5 h-5 text-red-400 mb-2" />
                <p className="text-2xl font-bold text-white">{competitors.length}</p>
                <p className="text-xs text-neutral-400">Tracked Competitors</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <SchoolIcon className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-2xl font-bold text-white">{schools.length}</p>
                <p className="text-xs text-neutral-400">Schools in Database</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <CalendarDays className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-white">{localEvents.length}</p>
                <p className="text-xs text-neutral-400">Upcoming Events</p>
              </div>
            </div>

            {/* Agent Handoff Points */}
            <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-orange-400" />
                Agent Handoff Points
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {handoffPoints.map((handoff, idx) => (
                  <div key={idx} className="p-4 bg-neutral-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-blue-400">{handoff.from}</span>
                      <ArrowRight className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm text-green-400">{handoff.to}</span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-1">Trigger: {handoff.trigger}</p>
                    <p className="text-sm text-neutral-300">{handoff.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeSection === "analytics" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Campaign Analytics</h2>
              <div className="flex gap-2">
                <select className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm">
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>

            {/* Platform Summary Cards */}
            <div className="grid grid-cols-3 gap-6">
              {/* SendFox Stats */}
              <div className="p-6 bg-neutral-900 rounded-xl border border-blue-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white">SendFox</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-white">4,113</p>
                    <p className="text-xs text-neutral-500">Total Contacts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">22.5%</p>
                    <p className="text-xs text-neutral-500">Avg Open Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">3.2%</p>
                    <p className="text-xs text-neutral-500">Avg Click Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">10</p>
                    <p className="text-xs text-neutral-500">Active Lists</p>
                  </div>
                </div>
              </div>

              {/* Acumbamail Stats */}
              <div className="p-6 bg-neutral-900 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="font-bold text-white">Acumbamail</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-white">3,432</p>
                    <p className="text-xs text-neutral-500">Subscribers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">28.1%</p>
                    <p className="text-xs text-neutral-500">Email Open Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">90%+</p>
                    <p className="text-xs text-neutral-500">SMS Open Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-xs text-neutral-500">Campaigns</p>
                  </div>
                </div>
              </div>

              {/* ReachInbox Stats */}
              <div className="p-6 bg-neutral-900 rounded-xl border border-orange-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="font-bold text-white">ReachInbox</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-white">14</p>
                    <p className="text-xs text-neutral-500">Campaigns</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">58%</p>
                    <p className="text-xs text-neutral-500">Open Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-400">14%</p>
                    <p className="text-xs text-neutral-500">Reply Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">Tier4</p>
                    <p className="text-xs text-neutral-500">Plan Level</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Performance Matrix */}
            <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
              <h3 className="font-bold text-white mb-4">Campaign Performance Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-500 border-b border-neutral-800">
                      <th className="pb-3 pr-4">Campaign</th>
                      <th className="pb-3 pr-4">Platform</th>
                      <th className="pb-3 pr-4">Sent</th>
                      <th className="pb-3 pr-4">Opens</th>
                      <th className="pb-3 pr-4">Open %</th>
                      <th className="pb-3 pr-4">Clicks</th>
                      <th className="pb-3 pr-4">Click %</th>
                      <th className="pb-3 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-300">
                    <tr className="border-b border-neutral-800/50">
                      <td className="py-3 pr-4 font-medium">2025 Spring Skills Programs</td>
                      <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Acumbamail</span></td>
                      <td className="py-3 pr-4">2,450</td>
                      <td className="py-3 pr-4">756</td>
                      <td className="py-3 pr-4 text-green-400">30.9%</td>
                      <td className="py-3 pr-4">198</td>
                      <td className="py-3 pr-4 text-blue-400">8.1%</td>
                      <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Completed</span></td>
                    </tr>
                    <tr className="border-b border-neutral-800/50">
                      <td className="py-3 pr-4 font-medium">Summer AAU Tryouts</td>
                      <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Acumbamail</span></td>
                      <td className="py-3 pr-4">1,890</td>
                      <td className="py-3 pr-4">612</td>
                      <td className="py-3 pr-4 text-green-400">32.4%</td>
                      <td className="py-3 pr-4">145</td>
                      <td className="py-3 pr-4 text-blue-400">7.7%</td>
                      <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Completed</span></td>
                    </tr>
                    <tr className="border-b border-neutral-800/50">
                      <td className="py-3 pr-4 font-medium">Sparta Youth Parents</td>
                      <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">ReachInbox</span></td>
                      <td className="py-3 pr-4">250</td>
                      <td className="py-3 pr-4">145</td>
                      <td className="py-3 pr-4 text-green-400">58.0%</td>
                      <td className="py-3 pr-4">89</td>
                      <td className="py-3 pr-4 text-blue-400">35.6%</td>
                      <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PostHog Integration */}
            <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">PostHog Analytics</h3>
                    <p className="text-xs text-neutral-500">Website & App Tracking</p>
                  </div>
                </div>
                <a href="https://us.posthog.com/project/297549" target="_blank" className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 text-sm">
                  Open PostHog
                </a>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">297549</p>
                  <p className="text-xs text-neutral-500">Project ID</p>
                </div>
                <div className="p-4 bg-neutral-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">1M</p>
                  <p className="text-xs text-neutral-500">Free Events/Mo</p>
                </div>
                <div className="p-4 bg-neutral-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-400">5K</p>
                  <p className="text-xs text-neutral-500">Session Recordings</p>
                </div>
                <div className="p-4 bg-neutral-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-400">Active</p>
                  <p className="text-xs text-neutral-500">Status</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USER JOURNEY / FUNNELS TAB */}
        {activeSection === "funnels" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">User Journey & Funnels</h2>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Funnel
              </button>
            </div>

            {/* Main Enrollment Funnel */}
            <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
              <h3 className="font-bold text-white mb-6">House of Sports Enrollment Funnel</h3>
              
              {/* Funnel Visualization */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="text-center">
                  <div className="w-48 h-20 bg-gradient-to-b from-orange-500/30 to-orange-500/10 rounded-t-lg flex items-center justify-center border border-orange-500/30">
                    <div>
                      <p className="text-2xl font-bold text-white">7,500+</p>
                      <p className="text-xs text-orange-400">AWARENESS</p>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-neutral-600" />
                <div className="text-center">
                  <div className="w-40 h-20 bg-gradient-to-b from-yellow-500/30 to-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/30">
                    <div>
                      <p className="text-2xl font-bold text-white">4,113</p>
                      <p className="text-xs text-yellow-400">SUBSCRIBERS</p>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-neutral-600" />
                <div className="text-center">
                  <div className="w-32 h-20 bg-gradient-to-b from-blue-500/30 to-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/30">
                    <div>
                      <p className="text-2xl font-bold text-white">892</p>
                      <p className="text-xs text-blue-400">ENGAGED</p>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-neutral-600" />
                <div className="text-center">
                  <div className="w-28 h-20 bg-gradient-to-b from-purple-500/30 to-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/30">
                    <div>
                      <p className="text-2xl font-bold text-white">156</p>
                      <p className="text-xs text-purple-400">TRIALS</p>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-neutral-600" />
                <div className="text-center">
                  <div className="w-24 h-20 bg-gradient-to-b from-green-500/30 to-green-500/10 rounded-b-lg flex items-center justify-center border border-green-500/30">
                    <div>
                      <p className="text-2xl font-bold text-white">45</p>
                      <p className="text-xs text-green-400">ENROLLED</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Rates */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-800 rounded-lg text-center">
                  <p className="text-xl font-bold text-orange-400">54.8%</p>
                  <p className="text-xs text-neutral-500">Awareness → Subscriber</p>
                </div>
                <div className="p-4 bg-neutral-800 rounded-lg text-center">
                  <p className="text-xl font-bold text-yellow-400">21.7%</p>
                  <p className="text-xs text-neutral-500">Subscriber → Engaged</p>
                </div>
                <div className="p-4 bg-neutral-800 rounded-lg text-center">
                  <p className="text-xl font-bold text-blue-400">17.5%</p>
                  <p className="text-xs text-neutral-500">Engaged → Trial</p>
                </div>
                <div className="p-4 bg-neutral-800 rounded-lg text-center">
                  <p className="text-xl font-bold text-green-400">28.8%</p>
                  <p className="text-xs text-neutral-500">Trial → Enrolled</p>
                </div>
              </div>
            </div>

            {/* Journey Stages */}
            <div className="grid grid-cols-5 gap-4">
              <div className="p-4 bg-neutral-900 rounded-xl border border-orange-500/20">
                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-orange-400 font-bold">1</span>
                </div>
                <h4 className="font-bold text-white mb-2">Awareness</h4>
                <p className="text-xs text-neutral-400 mb-3">First touchpoint - social, ads, word of mouth</p>
                <p className="text-xs text-neutral-500">Tools: ReachInbox, Social Media</p>
              </div>
              <div className="p-4 bg-neutral-900 rounded-xl border border-yellow-500/20">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-yellow-400 font-bold">2</span>
                </div>
                <h4 className="font-bold text-white mb-2">Subscriber</h4>
                <p className="text-xs text-neutral-400 mb-3">Joins email list - interested but not committed</p>
                <p className="text-xs text-neutral-500">Tools: SendFox forms</p>
              </div>
              <div className="p-4 bg-neutral-900 rounded-xl border border-blue-500/20">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-blue-400 font-bold">3</span>
                </div>
                <h4 className="font-bold text-white mb-2">Engaged</h4>
                <p className="text-xs text-neutral-400 mb-3">Opens emails, clicks links, visits site</p>
                <p className="text-xs text-neutral-500">Tools: SendFox automation</p>
              </div>
              <div className="p-4 bg-neutral-900 rounded-xl border border-purple-500/20">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-purple-400 font-bold">4</span>
                </div>
                <h4 className="font-bold text-white mb-2">Trial</h4>
                <p className="text-xs text-neutral-400 mb-3">Books free session, attends tryout</p>
                <p className="text-xs text-neutral-500">Tools: Acumbamail SMS</p>
              </div>
              <div className="p-4 bg-neutral-900 rounded-xl border border-green-500/20">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                  <span className="text-green-400 font-bold">5</span>
                </div>
                <h4 className="font-bold text-white mb-2">Enrolled</h4>
                <p className="text-xs text-neutral-400 mb-3">Pays for program - active customer</p>
                <p className="text-xs text-neutral-500">Tools: All platforms</p>
              </div>
            </div>

            {/* Automation Sequences */}
            <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
              <h3 className="font-bold text-white mb-4">Active Automation Sequences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Welcome Sequence</p>
                      <p className="text-xs text-neutral-400">4 emails over 7 days • SendFox</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">Setup Required</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Tryout Reminder Sequence</p>
                      <p className="text-xs text-neutral-400">Email + 2 SMS • Acumbamail</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">Setup Required</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Cold → Warm Transition</p>
                      <p className="text-xs text-neutral-400">Reply detected → Move to SendFox • ReachInbox</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">Setup Required</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMAIL INBOX */}
        {activeSection === "inbox" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Smart Email Inbox</h2>
                <p className="text-sm text-neutral-400">AI learns from your actions • Marketing filtered out</p>
              </div>
              <div className="flex gap-2">
                <select 
                  className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                  onChange={(e) => {
                    const filter = e.target.value;
                    fetch(`/api/gmail?filter=${filter}&limit=30`)
                      .then(r => r.json())
                      .then(data => {
                        if (data.success) setInboxEmails(data.emails);
                      });
                  }}
                >
                  <option value="real">Real People Only</option>
                  <option value="all">Show All (incl. Marketing)</option>
                </select>
                <button
                  onClick={fetchInbox}
                  disabled={loadingInbox}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-700 text-white rounded-lg flex items-center gap-2 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingInbox ? 'animate-spin' : ''}`} />
                  {loadingInbox ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Connected Inboxes Section */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Connected Inboxes
                </h3>
                <button
                  onClick={() => {
                    const name = prompt('Inbox name (e.g., "RA1 Inbox"):');
                    const email = prompt('Email address:');
                    const brand = prompt('Brand (tbf/ra1/hos/shotiq/kevin/bookmarkai):');
                    if (name && email) {
                      fetch('/api/inboxes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          action: 'add', 
                          name, 
                          email, 
                          brand,
                          color: brand === 'tbf' ? '#1E3A8A' : brand === 'ra1' ? '#CE1126' : brand === 'hos' ? '#16A34A' : '#6B7280'
                        })
                      }).then(() => {
                        alert('Inbox added! Refresh page to see changes.');
                        window.location.reload();
                      });
                    }
                  }}
                  className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Inbox
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {connectedInboxes.length === 0 ? (
                  <InboxBadge 
                    name="TBF Main" 
                    email="khouston@thebasketballfactorynj.com" 
                    color="#1E3A8A" 
                    isActive={selectedInbox === null || selectedInbox === 'main'}
                    onClick={() => setSelectedInbox(null)}
                  />
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedInbox(null)}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        selectedInbox === null 
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400' 
                          : 'border-neutral-700 text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      All Inboxes
                    </button>
                    {connectedInboxes.map((inbox: any) => (
                      <InboxBadge 
                        key={inbox.id}
                        name={inbox.name} 
                        email={inbox.email} 
                        color={inbox.color} 
                        isActive={selectedInbox === inbox.id}
                        onClick={() => setSelectedInbox(inbox.id)}
                      />
                    ))}
                  </>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                Click "Add Inbox" to connect more email accounts. Each inbox can be associated with a brand for filtering.
              </p>
            </div>

            {/* Learning Info Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Smart Filter Learning</p>
                  <p className="text-xs text-neutral-400">Click ✓ to trust a sender (always show), ✗ to block (never show). The filter learns from your choices.</p>
                </div>
              </div>
            </div>

            {/* Action Legend */}
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-400"><Plus className="w-3 h-3" /> Add to Funnel (+ trust sender)</span>
              <span className="flex items-center gap-1 text-blue-400"><CheckCircle className="w-3 h-3" /> Trust Sender</span>
              <span className="flex items-center gap-1 text-red-400"><X className="w-3 h-3" /> Block Sender</span>
            </div>

            {inboxEmails.length === 0 && !loadingInbox && (
              <div className="p-12 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <Mail className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Emails Loaded</h3>
                <p className="text-sm text-neutral-400 mb-4">Click Refresh to load your smart-filtered inbox</p>
                <button
                  onClick={fetchInbox}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm"
                >
                  Load Inbox
                </button>
              </div>
            )}

            {inboxEmails.length > 0 && (
              <div className="space-y-2">
                {inboxEmails.map((email: any) => (
                  <div
                    key={email.id}
                    className={`p-4 rounded-xl bg-neutral-900 border transition-colors ${
                      email.category === 'trusted'
                        ? 'border-purple-500/30 bg-purple-500/5'
                        : email.category === 'parent' 
                          ? 'border-green-500/30 bg-green-500/5' 
                          : email.category === 'business'
                            ? 'border-blue-500/30 bg-blue-500/5'
                            : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {email.category === 'trusted' && (
                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px]">⭐ TRUSTED</span>
                          )}
                          {email.category === 'parent' && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">PARENT</span>
                          )}
                          {email.category === 'business' && (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px]">BUSINESS</span>
                          )}
                          {email.category === 'marketing' && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px]">MARKETING</span>
                          )}
                          <span className="font-medium text-white truncate">
                            {email.fromName || email.from}
                          </span>
                          <span className="text-xs text-neutral-500 shrink-0">
                            {new Date(email.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-400 truncate">{email.subject}</p>
                        <p className="text-xs text-neutral-500 mt-1">{email.from}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {/* Add to Funnel (also trusts sender) */}
                        <button
                          onClick={async () => {
                            // Add to funnel
                            const funnelRes = await fetch('/api/funnel', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: email.from, name: email.fromName, stage: 'new-lead' })
                            });
                            // Also trust the sender
                            await fetch('/api/email-filter', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'trust-sender', email: email.from })
                            });
                            const data = await funnelRes.json();
                            if (data.success) {
                              alert(`✅ Added to funnel + sender trusted!`);
                              fetchInbox();
                            }
                          }}
                          className="px-2 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs"
                          title="Add to Funnel + Trust"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        
                        {/* Trust Sender */}
                        {email.category !== 'trusted' && (
                          <button
                            onClick={async () => {
                              await fetch('/api/email-filter', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'trust-sender', email: email.from })
                              });
                              alert(`✅ ${email.from} is now trusted`);
                              fetchInbox();
                            }}
                            className="px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs"
                            title="Trust this sender"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                        )}
                        
                        {/* Block Sender */}
                        <button
                          onClick={async () => {
                            await fetch('/api/email-filter', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'block-sender', email: email.from })
                            });
                            alert(`🚫 ${email.from} is now blocked`);
                            fetchInbox();
                          }}
                          className="px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs"
                          title="Block this sender"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        
                        {/* Funnel dropdown */}
                        <select
                          onChange={async (e) => {
                            if (!e.target.value) return;
                            const res = await fetch('/api/funnel', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: email.from, name: email.fromName, stage: e.target.value })
                            });
                            // Trust the sender
                            await fetch('/api/email-filter', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'trust-sender', email: email.from })
                            });
                            const data = await res.json();
                            if (data.success) {
                              alert(`✅ Added to ${data.added.stage} + sender trusted!`);
                              fetchInbox();
                            }
                            e.target.value = '';
                          }}
                          className="px-2 py-1.5 bg-neutral-800 text-neutral-300 rounded text-xs border-0"
                        >
                          <option value="">Add to...</option>
                          <option value="new-lead">New Lead</option>
                          <option value="interested">Interested Parent</option>
                          <option value="tbf-training">TBF Training</option>
                          <option value="ra1-aau">RA1 AAU Interest</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-5 gap-4">
              <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
                <p className="text-2xl font-bold text-white">{inboxEmails.length}</p>
                <p className="text-xs text-neutral-400">Shown</p>
              </div>
              <div className="p-4 bg-neutral-900 rounded-xl border border-purple-500/20 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {inboxEmails.filter((e: any) => e.category === 'trusted').length}
                </p>
                <p className="text-xs text-neutral-400">Trusted</p>
              </div>
              <div className="p-4 bg-neutral-900 rounded-xl border border-green-500/20 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {inboxEmails.filter((e: any) => e.category === 'parent').length}
                </p>
                <p className="text-xs text-neutral-400">Parents</p>
              </div>
              <div className="p-4 bg-neutral-900 rounded-xl border border-blue-500/20 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {inboxEmails.filter((e: any) => e.category === 'business').length}
                </p>
                <p className="text-xs text-neutral-400">Business</p>
              </div>
              <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
                <p className="text-2xl font-bold text-neutral-400">
                  {inboxEmails.filter((e: any) => e.category === 'unknown').length}
                </p>
                <p className="text-xs text-neutral-400">Other</p>
              </div>
            </div>
          </div>
        )}

        {/* UNIFIED CONTACTS */}
        {activeSection === "contacts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Unified Contacts</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => { setContactFilter('real'); fetchContacts('real', contactSearch); }}
                  className={`px-3 py-1.5 rounded-lg text-sm ${contactFilter === 'real' ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                >
                  Real People
                </button>
                <button
                  onClick={() => { setContactFilter('engaged'); fetchContacts('engaged', contactSearch); }}
                  className={`px-3 py-1.5 rounded-lg text-sm ${contactFilter === 'engaged' ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                >
                  Engaged
                </button>
                <button
                  onClick={() => { setContactFilter('all'); fetchContacts('all', contactSearch); }}
                  className={`px-3 py-1.5 rounded-lg text-sm ${contactFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                >
                  All
                </button>
                <button
                  onClick={() => fetchContacts(contactFilter, contactSearch)}
                  className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700"
                >
                  <RefreshCw className={`w-4 h-4 ${contactsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search by email, name, or note..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchContacts(contactFilter, contactSearch)}
                className="flex-1 px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500"
              />
              <button
                onClick={() => fetchContacts(contactFilter, contactSearch)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Search
              </button>
            </div>

            {/* Stats Cards */}
            {contactStats && (
              <div className="grid grid-cols-6 gap-4">
                <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                  <p className="text-3xl font-bold text-white">{contactStats.total}</p>
                  <p className="text-xs text-neutral-400">Total Shown</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                  <p className="text-3xl font-bold text-blue-400">{contactStats.fromSendFox}</p>
                  <p className="text-xs text-neutral-400">From SendFox</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                  <p className="text-3xl font-bold text-purple-400">{contactStats.fromAcumbamail}</p>
                  <p className="text-xs text-neutral-400">From Acumbamail</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                  <p className="text-3xl font-bold text-green-400">{contactStats.inBothPlatforms}</p>
                  <p className="text-xs text-neutral-400">In Both</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                  <p className="text-3xl font-bold text-yellow-400">{contactStats.engaged}</p>
                  <p className="text-xs text-neutral-400">Engaged</p>
                </div>
                <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                  <p className="text-3xl font-bold text-emerald-400">{contactStats.confirmed}</p>
                  <p className="text-xs text-neutral-400">Confirmed</p>
                </div>
              </div>
            )}

            {/* Initial Load Button */}
            {contacts.length === 0 && !contactsLoading && (
              <div className="p-8 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
                <Users className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 mb-4">Click to load contacts from SendFox & Acumbamail</p>
                <button
                  onClick={() => fetchContacts('real')}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Load Unified Contacts
                </button>
              </div>
            )}

            {/* Loading State */}
            {contactsLoading && (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                <p className="text-neutral-400">Loading contacts from all platforms...</p>
              </div>
            )}

            {/* Contacts List */}
            {contacts.length > 0 && !contactsLoading && (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">
                            {contact.fullName || contact.email.split('@')[0]}
                          </span>
                          {contact.engagement.confirmed && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          {contact.sources.map((src: string) => (
                            <span
                              key={src}
                              className={`text-xs px-2 py-0.5 rounded ${
                                src === 'SendFox' 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-neutral-400">{contact.email}</p>
                        {contact.note && (
                          <p className="text-sm text-neutral-500 mt-2 italic">"{contact.note}"</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                          {contact.engagement.lastOpened && (
                            <span>Opened: {new Date(contact.engagement.lastOpened).toLocaleDateString()}</span>
                          )}
                          {contact.engagement.lastClicked && (
                            <span>Clicked: {new Date(contact.engagement.lastClicked).toLocaleDateString()}</span>
                          )}
                          {contact.lists.length > 0 && (
                            <span>Lists: {contact.lists.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                          className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(contact.email);
                            alert('Email copied!');
                          }}
                          className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white"
                          title="Copy Email"
                        >
                          <AtSign className="w-4 h-4" />
                        </button>
                        {contact.note?.includes('call') && (
                          <button
                            className="p-2 bg-green-500/20 rounded-lg hover:bg-green-500/30 text-green-400"
                            title="Requested Call"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {contacts.length > 0 && (
              <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                <p className="text-sm text-neutral-400">
                  Showing {contacts.length} contacts. Data merged from SendFox and Acumbamail, deduplicated by email address.
                  Use filters to find engaged subscribers or search for specific contacts.
                </p>
              </div>
            )}
          </div>
        )}

        {/* MARKETING PLATFORMS */}
        {activeSection === "platforms" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Marketing Platforms</h2>
            <p className="text-neutral-400">Your 3-platform marketing engine. Each platform serves a specific purpose - together they create a complete system.</p>
            
            {/* Platform Cards */}
            <div className="grid grid-cols-3 gap-6">
              {/* SendFox */}
              <div className="p-6 bg-neutral-900 rounded-xl border border-blue-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">SendFox</h3>
                    <span className="text-xs text-green-400">Connected</span>
                  </div>
                </div>
                <p className="text-sm text-neutral-400 mb-4">Newsletter & Nurture Sequences</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-neutral-500">Contacts:</span><span className="text-white">4,113</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Lists:</span><span className="text-white">10</span></div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 font-medium mb-2">UNIQUE FEATURES:</p>
                  <ul className="text-xs text-neutral-400 space-y-1">
                    <li>• Welcome sequences</li>
                    <li>• Drip campaigns</li>
                    <li>• Delay automation</li>
                    <li>• Segmentation triggers</li>
                    <li>• Resend to non-opens</li>
                  </ul>
                </div>
                <a href="https://sendfox.com/dashboard" target="_blank" className="mt-4 block text-center py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30">
                  Open Dashboard
                </a>
              </div>

              {/* Acumbamail */}
              <div className="p-6 bg-neutral-900 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Acumbamail</h3>
                    <span className="text-xs text-green-400">Connected</span>
                  </div>
                </div>
                <p className="text-sm text-neutral-400 mb-4">Email + SMS Marketing</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-neutral-500">Subscribers:</span><span className="text-white">3,432</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Campaigns:</span><span className="text-white">12</span></div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 font-medium mb-2">UNIQUE FEATURES:</p>
                  <ul className="text-xs text-neutral-400 space-y-1">
                    <li>• SMS marketing built-in</li>
                    <li>• Email + SMS combo</li>
                    <li>• Click heatmaps</li>
                    <li>• Geolocation analytics</li>
                    <li>• A/B testing</li>
                  </ul>
                </div>
                <a href="https://acumbamail.com/dashboard" target="_blank" className="mt-4 block text-center py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30">
                  Open Dashboard
                </a>
              </div>

              {/* ReachInbox */}
              <div className="p-6 bg-neutral-900 rounded-xl border border-orange-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">ReachInbox</h3>
                    <span className="text-xs text-green-400">Connected (Tier4)</span>
                  </div>
                </div>
                <p className="text-sm text-neutral-400 mb-4">Cold Email Outreach</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-neutral-500">Campaigns:</span><span className="text-white">14</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Plan Expires:</span><span className="text-white">2027</span></div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 font-medium mb-2">UNIQUE FEATURES:</p>
                  <ul className="text-xs text-neutral-400 space-y-1">
                    <li>• Unified Inbox (Onebox)</li>
                    <li>• Auto-categorization</li>
                    <li>• A/Z testing</li>
                    <li>• Email warmup</li>
                    <li>• Provider matching</li>
                  </ul>
                </div>
                <a href="https://app.reachinbox.ai" target="_blank" className="mt-4 block text-center py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30">
                  Open Dashboard
                </a>
              </div>
            </div>

            {/* Integration Flow */}
            <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
              <h3 className="font-bold text-white mb-4">The Marketing Flow</h3>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <Target className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-white font-medium">ReachInbox</p>
                  <p className="text-xs text-neutral-500">Cold Prospects</p>
                </div>
                <ArrowRight className="w-6 h-6 text-neutral-600" />
                <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Mail className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-white font-medium">SendFox</p>
                  <p className="text-xs text-neutral-500">Nurture & Newsletter</p>
                </div>
                <ArrowRight className="w-6 h-6 text-neutral-600" />
                <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <Phone className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Acumbamail</p>
                  <p className="text-xs text-neutral-500">SMS & Reminders</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEWSLETTER */}
        {activeSection === "newsletter" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Newsletter</h2>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Newsletter
              </button>
            </div>

            {/* Kevin Houston Weekly */}
            <div className="p-6 bg-neutral-900 rounded-xl border border-green-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded mb-2 inline-block">PLANNED</span>
                  <h3 className="text-xl font-bold text-white">Kevin Houston Weekly</h3>
                  <p className="text-neutral-400">Personal newsletter with basketball tips, stories, and behind-the-scenes</p>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Kevin Brand</span>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-xs text-neutral-500">Subscribers</p>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">Weekly</p>
                  <p className="text-xs text-neutral-500">Frequency</p>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">SendFox</p>
                  <p className="text-xs text-neutral-500">Platform</p>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">Sunday PM</p>
                  <p className="text-xs text-neutral-500">Send Time</p>
                </div>
              </div>
              <div className="border-t border-neutral-800 pt-4">
                <h4 className="text-sm font-medium text-neutral-400 mb-2">CONTENT PILLARS:</h4>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-sm">Training Tips</span>
                  <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-sm">Behind the Scenes</span>
                  <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-sm">Player Stories</span>
                  <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full text-sm">Q&A</span>
                </div>
              </div>
            </div>

            {/* TBF Training Tips */}
            <div className="p-6 bg-neutral-900 rounded-xl border border-blue-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded mb-2 inline-block">PLANNED</span>
                  <h3 className="text-xl font-bold text-white">TBF Training Tips</h3>
                  <p className="text-neutral-400">Weekly training tips and program updates for parents</p>
                </div>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">TBF Brand</span>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">3,922</p>
                  <p className="text-xs text-neutral-500">Existing List</p>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">Weekly</p>
                  <p className="text-xs text-neutral-500">Frequency</p>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">SendFox</p>
                  <p className="text-xs text-neutral-500">Platform</p>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">522601</p>
                  <p className="text-xs text-neutral-500">List ID</p>
                </div>
              </div>
            </div>

            {/* Action Plan */}
            <div className="p-6 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20">
              <h3 className="font-bold text-white mb-4">Launch Plan: Kevin Houston Weekly</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-900/50 rounded-lg">
                  <p className="text-xs text-orange-400 font-medium">STEP 1</p>
                  <p className="text-white font-medium">Create SendFox List</p>
                  <p className="text-xs text-neutral-400">"Kevin Houston Newsletter"</p>
                </div>
                <div className="p-4 bg-neutral-900/50 rounded-lg">
                  <p className="text-xs text-orange-400 font-medium">STEP 2</p>
                  <p className="text-white font-medium">Welcome Automation</p>
                  <p className="text-xs text-neutral-400">4-email welcome sequence</p>
                </div>
                <div className="p-4 bg-neutral-900/50 rounded-lg">
                  <p className="text-xs text-orange-400 font-medium">STEP 3</p>
                  <p className="text-white font-medium">Create Sign-up Form</p>
                  <p className="text-xs text-neutral-400">Embed on websites</p>
                </div>
                <div className="p-4 bg-neutral-900/50 rounded-lg">
                  <p className="text-xs text-orange-400 font-medium">STEP 4</p>
                  <p className="text-white font-medium">First Newsletter</p>
                  <p className="text-xs text-neutral-400">Send Sunday evening</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PODCAST */}
        {activeSection === "podcast" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Podcast</h2>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Plan New Show
              </button>
            </div>

            {/* Kevin Houston Hoops Talk */}
            <div className="p-6 bg-neutral-900 rounded-xl border border-green-500/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded mb-2 inline-block">PLANNED</span>
                  <h3 className="text-xl font-bold text-white">Kevin Houston Hoops Talk</h3>
                  <p className="text-neutral-400">Basketball insights, training tips, player development, and interviews with coaches</p>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Kevin Brand</span>
              </div>
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-xs text-neutral-500">Episodes</p>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">Weekly</p>
                  <p className="text-xs text-neutral-500">Frequency</p>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-white">Thursday</p>
                  <p className="text-xs text-neutral-500">Release Day</p>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-purple-400">20-30 min</p>
                  <p className="text-xs text-neutral-500">Target Length</p>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">Audio</p>
                  <p className="text-xs text-neutral-500">Format</p>
                </div>
              </div>

              {/* Distribution */}
              <div className="border-t border-neutral-800 pt-4 mb-4">
                <h4 className="text-sm font-medium text-neutral-400 mb-2">DISTRIBUTION PLATFORMS:</h4>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Spotify</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">Apple Podcasts</span>
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">YouTube</span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">HubHopper</span>
                </div>
              </div>

              {/* Content Ideas */}
              <div className="border-t border-neutral-800 pt-4">
                <h4 className="text-sm font-medium text-neutral-400 mb-2">EPISODE IDEAS:</h4>
                <ul className="text-sm text-neutral-300 space-y-2">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-neutral-600" /> Why Most Youth Basketball Training Is Wrong</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-neutral-600" /> The 3 Drills Every Player Should Do Daily</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-neutral-600" /> Interview: What College Coaches Look For</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-neutral-600" /> Parent Q&A: How to Support Your Young Athlete</li>
                </ul>
              </div>
            </div>

            {/* Launch Plan */}
            <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <h3 className="font-bold text-white mb-4">Launch Plan: Kevin Houston Hoops Talk</h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="p-4 bg-neutral-900/50 rounded-lg">
                  <p className="text-xs text-purple-400 font-medium">STEP 1</p>
                  <p className="text-white font-medium">Setup</p>
                  <p className="text-xs text-neutral-400">HubHopper or Anchor</p>
                </div>
                <div className="p-4 bg-neutral-900/50 rounded-lg">
                  <p className="text-xs text-purple-400 font-medium">STEP 2</p>
                  <p className="text-white font-medium">Record 3 Eps</p>
                  <p className="text-xs text-neutral-400">Bank episodes first</p>
                </div>
                <div className="p-4 bg-neutral-900/50 rounded-lg">
                  <p className="text-xs text-purple-400 font-medium">STEP 3</p>
                  <p className="text-white font-medium">Submit RSS</p>
                  <p className="text-xs text-neutral-400">Spotify, Apple, etc.</p>
                </div>
                <div className="p-4 bg-neutral-900/50 rounded-lg">
                  <p className="text-xs text-purple-400 font-medium">STEP 4</p>
                  <p className="text-white font-medium">Launch Week</p>
                  <p className="text-xs text-neutral-400">3 episodes at once</p>
                </div>
                <div className="p-4 bg-neutral-900/50 rounded-lg">
                  <p className="text-xs text-purple-400 font-medium">STEP 5</p>
                  <p className="text-white font-medium">Promote</p>
                  <p className="text-xs text-neutral-400">Newsletter + social</p>
                </div>
              </div>
            </div>

            {/* Tools */}
            <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
              <h3 className="font-bold text-white mb-4">Podcast Tools Available</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-neutral-800 rounded-lg">
                  <p className="font-medium text-white">HubHopper</p>
                  <p className="text-xs text-neutral-400">Free podcast hosting, distribution to all platforms</p>
                  <p className="text-xs text-green-400 mt-2">Skill Available</p>
                </div>
                <div className="p-4 bg-neutral-800 rounded-lg">
                  <p className="font-medium text-white">PodOps</p>
                  <p className="text-xs text-neutral-400">Podcast creation and management</p>
                  <p className="text-xs text-green-400 mt-2">Skill Available</p>
                </div>
                <div className="p-4 bg-neutral-800 rounded-lg">
                  <p className="font-medium text-white">Taja.ai</p>
                  <p className="text-xs text-neutral-400">AI-powered clips, titles, descriptions</p>
                  <p className="text-xs text-green-400 mt-2">Tool Available</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TERRITORY MAP */}
        {activeSection === "territory" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Territory Map</h2>
              <div className="flex gap-2">
                {['All', ...counties].map((county) => (
                  <button
                    key={county}
                    onClick={() => setSelectedCounty(county === 'All' ? null : county)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      (county === 'All' && !selectedCounty) || selectedCounty === county
                        ? 'bg-orange-500 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {county}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Legend */}
            <div className="flex gap-4 flex-wrap">
              {Object.entries(territoryStatusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-xs text-neutral-400 capitalize">{status.replace('-', ' ')}</span>
                </div>
              ))}
            </div>

            {/* Territory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTerritories.map((territory) => (
                <div
                  key={territory.id}
                  className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${territoryStatusColors[territory.status]}`} />
                        <h3 className="font-semibold text-white">{territory.name}</h3>
                      </div>
                      <p className="text-xs text-neutral-500">{territory.county} County • {territory.distanceFromHQ} mi</p>
                    </div>
                    <MapPin className="w-4 h-4 text-neutral-500" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-neutral-500">Students</p>
                      <p className="text-lg font-bold text-white">{territory.currentStudents}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Market Share</p>
                      <p className="text-lg font-bold text-white">{territory.marketShare}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded capitalize ${
                      territory.status === 'dominated' ? 'bg-green-500/20 text-green-400' :
                      territory.status === 'competitor-heavy' ? 'bg-red-500/20 text-red-400' :
                      'bg-neutral-700 text-neutral-400'
                    }`}>
                      {territory.status.replace('-', ' ')}
                    </span>
                    {territory.competitors.length > 0 && (
                      <span className="text-xs text-red-400">{territory.competitors.length} competitors</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPETITOR INTELLIGENCE */}
        {activeSection === "competitors" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Competitor Intelligence</h2>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Add Competitor
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {competitors.map((comp) => (
                <div
                  key={comp.id}
                  className="p-5 rounded-xl bg-neutral-900 border border-neutral-800"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{comp.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${threatColors[comp.threatLevel]}`}>
                          {comp.threatLevel} threat
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400">{comp.location}</p>
                      <p className="text-xs text-neutral-500 capitalize">{comp.type.replace('-', ' ')}</p>
                    </div>
                    <Eye className="w-5 h-5 text-neutral-500" />
                  </div>

                  {comp.pricing && (
                    <div className="mb-3">
                      <p className="text-xs text-neutral-500">Pricing</p>
                      <p className="text-sm text-white">{comp.pricing}</p>
                    </div>
                  )}

                  {comp.programs && comp.programs.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-neutral-500 mb-1">Programs</p>
                      <div className="flex flex-wrap gap-1">
                        {comp.programs.map((prog, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-neutral-800 rounded">{prog}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {comp.strengths && comp.strengths.length > 0 && (
                      <div>
                        <p className="text-xs text-green-400 mb-1">Strengths</p>
                        <ul className="text-xs text-neutral-400 space-y-1">
                          {comp.strengths.map((s, idx) => (
                            <li key={idx}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {comp.weaknesses && comp.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs text-red-400 mb-1">Weaknesses</p>
                        <ul className="text-xs text-neutral-400 space-y-1">
                          {comp.weaknesses.map((w, idx) => (
                            <li key={idx}>• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {comp.notes && (
                    <p className="text-xs text-neutral-500 italic">{comp.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCHOOLS DATABASE */}
        {activeSection === "schools" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">School Database</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-neutral-400">
                  <span className="text-green-400 font-bold">{schools.filter(s => s.partnershipStatus === 'active').length}</span> partnered •
                  <span className="text-yellow-400 font-bold ml-1">{schools.filter(s => s.partnershipStatus === 'contacted').length}</span> contacted •
                  <span className="text-neutral-400 font-bold ml-1">{schools.filter(s => s.partnershipStatus === 'not-contacted').length}</span> not contacted
                </div>
                <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" />
                  Add School
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-3 px-4 text-sm text-neutral-400 font-medium">School</th>
                    <th className="text-left py-3 px-4 text-sm text-neutral-400 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-sm text-neutral-400 font-medium">Territory</th>
                    <th className="text-left py-3 px-4 text-sm text-neutral-400 font-medium">Conference</th>
                    <th className="text-left py-3 px-4 text-sm text-neutral-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-sm text-neutral-400 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school) => {
                    const territory = territories.find(t => t.id === school.territory);
                    return (
                      <tr key={school.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-neutral-500" />
                            <span className="text-white font-medium">{school.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-400 capitalize">{school.type.replace('-', ' ')}</td>
                        <td className="py-3 px-4 text-sm text-neutral-400">{territory?.name || school.territory}</td>
                        <td className="py-3 px-4 text-sm text-neutral-400">{school.conference || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded ${
                            school.partnershipStatus === 'active' ? 'bg-green-500/20 text-green-400' :
                            school.partnershipStatus === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                            school.partnershipStatus === 'declined' ? 'bg-red-500/20 text-red-400' :
                            'bg-neutral-700 text-neutral-400'
                          }`}>
                            {school.partnershipStatus.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-neutral-500">{school.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NJAC COVERAGE */}
        {activeSection === "njac" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">NJAC Coverage Hub</h2>
                <p className="text-sm text-neutral-400">Own the local basketball narrative</p>
              </div>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4" />
                Add Game Recap
              </button>
            </div>

            {/* Player Rankings */}
            <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                NJAC Player Power Rankings
              </h3>
              <div className="space-y-3">
                {njacPlayerRankings.map((player) => (
                  <div key={player.rank} className="flex items-center gap-4 p-3 bg-neutral-800 rounded-lg">
                    <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                      {player.rank}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{player.name}</span>
                        <span className="text-xs text-neutral-500">{player.position}</span>
                      </div>
                      <p className="text-sm text-neutral-400">{player.school} • {player.grade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{player.stats}</p>
                      {player.notes && <p className="text-xs text-neutral-500">{player.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Strategy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/30">
                <h3 className="font-semibold text-white mb-3">Game Recaps</h3>
                <p className="text-sm text-neutral-300 mb-3">Cover NJAC games, post results before anyone else</p>
                <ul className="text-xs text-neutral-400 space-y-1">
                  <li>• Post within 2 hours of game end</li>
                  <li>• Tag schools and players</li>
                  <li>• Include box scores</li>
                </ul>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/30">
                <h3 className="font-semibold text-white mb-3">Player Spotlights</h3>
                <p className="text-sm text-neutral-300 mb-3">Feature local players, parents share like crazy</p>
                <ul className="text-xs text-neutral-400 space-y-1">
                  <li>• Weekly spotlight on rising players</li>
                  <li>• Highlight videos with TBF branding</li>
                  <li>• College recruitment visibility</li>
                </ul>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/30">
                <h3 className="font-semibold text-white mb-3">Power Rankings</h3>
                <p className="text-sm text-neutral-300 mb-3">Create controversy, drive engagement</p>
                <ul className="text-xs text-neutral-400 space-y-1">
                  <li>• Weekly team rankings</li>
                  <li>• Player rankings by position</li>
                  <li>• Predictions (be bold)</li>
                </ul>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-700/30">
                <h3 className="font-semibold text-white mb-3">Stats Tracking</h3>
                <p className="text-sm text-neutral-300 mb-3">Become the stat authority</p>
                <ul className="text-xs text-neutral-400 space-y-1">
                  <li>• Scoring leaders</li>
                  <li>• Team standings</li>
                  <li>• Historical comparisons</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* REFERRAL ENGINE */}
        {activeSection === "referrals" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Referral Engine</h2>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Log Referral
              </button>
            </div>

            {/* Referral Program Info */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white mb-1">Referral Program</h3>
                  <p className="text-sm text-neutral-300">
                    ${referralProgram.rewardPerEnrollment} {referralProgram.rewardType} per successful referral
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  referralProgram.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {referralProgram.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <p className="text-3xl font-bold text-white">{referrals.length}</p>
                <p className="text-xs text-neutral-400">Total Referrals</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <p className="text-3xl font-bold text-green-400">{referrals.filter(r => r.status === 'enrolled').length}</p>
                <p className="text-xs text-neutral-400">Enrolled</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <p className="text-3xl font-bold text-yellow-400">{referrals.filter(r => r.status === 'pending').length}</p>
                <p className="text-xs text-neutral-400">Pending</p>
              </div>
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <p className="text-3xl font-bold text-white">$0</p>
                <p className="text-xs text-neutral-400">Rewards Paid</p>
              </div>
            </div>

            {referrals.length === 0 ? (
              <div className="p-12 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
                <Gift className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Referrals Yet</h3>
                <p className="text-sm text-neutral-400 mb-4">Start tracking referrals to see who your best advocates are</p>
                <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm">
                  Log First Referral
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map((ref) => (
                  <div key={ref.id} className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
                    <span>{ref.referrerName} → {ref.referredName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EVENTS CALENDAR */}
        {activeSection === "events" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Event Calendar + Presence</h2>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </div>

            <div className="space-y-4">
              {localEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-5 rounded-xl bg-neutral-900 border border-neutral-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-neutral-400">{event.date}</span>
                        <span className="text-xs px-2 py-0.5 bg-neutral-800 rounded capitalize">{event.type.replace('-', ' ')}</span>
                      </div>
                      <h3 className="font-semibold text-white mb-1">{event.name}</h3>
                      <p className="text-sm text-neutral-400">{event.location}</p>
                      {event.estimatedAttendance && (
                        <p className="text-xs text-neutral-500 mt-1">Est. {event.estimatedAttendance} attendees • {event.targetAudience}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-neutral-500 mb-2">Our Presence</p>
                      <div className="flex gap-2 justify-end">
                        <span className={`text-xs px-2 py-1 rounded ${event.ourPresence.attending ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-500'}`}>
                          Attending
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${event.ourPresence.booth ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-500'}`}>
                          Booth
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${event.ourPresence.sponsoring ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-500'}`}>
                          Sponsor
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PARTNERSHIPS CRM */}
        {activeSection === "partnerships" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Partnership CRM</h2>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Add Partner
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {partnerships.map((partner) => (
                <div
                  key={partner.id}
                  className="p-5 rounded-xl bg-neutral-900 border border-neutral-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{partner.name}</h3>
                      {partner.organization && (
                        <p className="text-sm text-neutral-400">{partner.organization}</p>
                      )}
                      <p className="text-xs text-neutral-500 capitalize">{partner.type.replace('-', ' ')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      partner.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      partner.status === 'negotiating' ? 'bg-yellow-500/20 text-yellow-400' :
                      partner.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-neutral-700 text-neutral-400'
                    }`}>
                      {partner.status}
                    </span>
                  </div>

                  {partner.value && (
                    <div className="mb-3">
                      <p className="text-xs text-neutral-500">Potential Value</p>
                      <p className="text-sm text-neutral-300">{partner.value}</p>
                    </div>
                  )}

                  {partner.nextAction && (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-xs text-orange-400">Next Action</p>
                      <p className="text-sm text-white">{partner.nextAction}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MARKET SHARE */}
        {activeSection === "marketshare" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Market Share Dashboard</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Goals */}
              <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  Market Share Goals
                </h3>
                <div className="space-y-4">
                  {marketShareGoals.map((goal) => {
                    const territory = territories.find(t => t.id === goal.territory);
                    return (
                      <div key={goal.id} className="p-4 bg-neutral-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{territory?.name || goal.territory}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            goal.status === 'achieved' ? 'bg-green-500/20 text-green-400' :
                            goal.status === 'on-track' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {goal.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${(goal.currentShare / goal.targetShare) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-white font-bold">
                            {goal.currentShare}% / {goal.targetShare}%
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Deadline: {goal.deadline}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <div className="p-6 rounded-xl bg-gradient-to-br from-orange-900/30 to-red-900/20 border border-orange-700/30">
                  <h3 className="font-semibold text-white mb-4">Overall Northern NJ</h3>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white mb-2">0%</p>
                    <p className="text-sm text-neutral-400">Current Market Share</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-orange-700/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Target (Phase 1)</span>
                      <span className="text-white font-bold">40%</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
                  <h3 className="font-semibold text-white mb-3">What Gets Measured...</h3>
                  <ul className="space-y-2 text-sm text-neutral-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      Track students by town of residence
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      Estimate total youth basketball players per town
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      Calculate market share = your students / total players
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      Set aggressive goals and track weekly
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAMPAIGNS - Original section */}
        {activeSection === "campaigns" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Campaigns</h2>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            </div>

            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const brand = brands.find(b => b.id === campaign.brandId);
                return (
                  <div key={campaign.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-10 rounded-full" style={{ backgroundColor: brand?.color }} />
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{campaign.name}</h3>
                        <p className="text-sm text-neutral-400">{campaign.description}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${campaignStatusColors[campaign.status]}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EMAIL LISTS - Original section */}
        {activeSection === "lists" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Email Lists</h2>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                New List
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emailLists.map((list) => {
                const brand = brands.find(b => b.id === list.brandId);
                return (
                  <div key={list.id} className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-full min-h-[50px] rounded-full" style={{ backgroundColor: brand?.color }} />
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{list.name}</h3>
                        <p className="text-sm text-neutral-400">{list.purpose}</p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-2xl font-bold text-white">{list.subscribers}</p>
                          <span className="text-xs text-neutral-500">{list.platform}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TOOLS - Original section */}
        {activeSection === "tools" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Marketing Tools</h2>

            {(["email", "social", "analytics", "podcast", "automation"] as const).map((category) => {
              const categoryTools = tools.filter((t) => t.category === category);
              if (categoryTools.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-white mb-3 capitalize">{categoryLabels[category]}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTools.map((tool) => (
                      <div key={tool.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{tool.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded border ${statusColors[tool.status]}`}>
                            {tool.status === 'active' ? 'Active' : 'Setup'}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-400 mb-3">{tool.description}</p>
                        {tool.url && (
                          <a href={tool.url} target="_blank" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
