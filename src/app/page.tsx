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

export default function MarketingCommandCenter() {
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [liveEmailData, setLiveEmailData] = useState<LiveEmailData | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(true);

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
  }, []);

  const sections = [
    { id: "overview", label: "Dashboard", icon: BarChart3 },
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
