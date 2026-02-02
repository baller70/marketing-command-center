"use client";

import { useState } from "react";
import {
  brands,
  emailLists,
  campaigns,
  tools,
  leadFunnel,
  workflows,
  handoffPoints,
  type Campaign,
  type Tool,
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
} from "lucide-react";

export default function MarketingCommandCenter() {
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  const sections = [
    { id: "overview", label: "Dashboard", icon: BarChart3 },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "lists", label: "Email Lists", icon: Mail },
    { id: "tools", label: "Tools", icon: Settings },
    { id: "workflows", label: "Workflows", icon: Zap },
    { id: "funnel", label: "Funnel", icon: TrendingUp },
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

  const filteredCampaigns = selectedBrand
    ? campaigns.filter((c) => c.brandId === selectedBrand)
    : campaigns;

  const totalSubscribers = emailLists.reduce((sum, list) => sum + list.subscribers, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const scheduledCampaigns = campaigns.filter((c) => c.status === "scheduled").length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Russo One, sans-serif' }}>
                  Marketing Command Center
                </h1>
                <p className="text-xs text-neutral-400">Campaigns • Email • Distribution</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-neutral-400">Total Subscribers</p>
                <p className="text-xl font-bold text-white">{totalSubscribers.toLocaleString()}</p>
              </div>
              <div className="w-px h-10 bg-neutral-700" />
              <div className="text-right">
                <p className="text-sm text-neutral-400">Active Campaigns</p>
                <p className="text-xl font-bold text-green-400">{activeCampaigns}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Navigation Tabs */}
        <nav className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
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

        {/* Brand Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedBrand(null)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              !selectedBrand
                ? "bg-white text-black"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            All Brands
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setSelectedBrand(brand.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedBrand === brand.id
                  ? "text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
              style={
                selectedBrand === brand.id
                  ? { backgroundColor: brand.color }
                  : {}
              }
            >
              {brand.shortName}
            </button>
          ))}
        </div>

        {/* OVERVIEW SECTION */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Email Lists</p>
                    <p className="text-2xl font-bold text-white">{emailLists.length}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Total Subscribers</p>
                    <p className="text-2xl font-bold text-white">{totalSubscribers}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Campaigns</p>
                    <p className="text-2xl font-bold text-white">{campaigns.length}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Tools</p>
                    <p className="text-2xl font-bold text-white">{tools.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/30">
                <h3 className="font-semibold text-white mb-2">Send Email Campaign</h3>
                <p className="text-sm text-neutral-300 mb-4">Create and send a new email to your lists</p>
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  New Campaign
                </button>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-orange-900/50 to-orange-800/30 border border-orange-700/30">
                <h3 className="font-semibold text-white mb-2">Post to Social</h3>
                <p className="text-sm text-neutral-300 mb-4">Distribute content across all platforms</p>
                <a 
                  href="http://localhost:3007"
                  target="_blank"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm inline-flex items-center gap-2"
                >
                  <Megaphone className="w-4 h-4" />
                  Open Content Hub
                </a>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/30">
                <h3 className="font-semibold text-white mb-2">Add Leads</h3>
                <p className="text-sm text-neutral-300 mb-4">Import new leads to nurture sequence</p>
                <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Import Leads
                </button>
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

        {/* CAMPAIGNS SECTION */}
        {activeSection === "campaigns" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Campaign Calendar</h2>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                New Campaign
              </button>
            </div>

            {/* Campaign Status Summary */}
            <div className="flex gap-3 flex-wrap">
              {['draft', 'scheduled', 'active', 'completed', 'paused'].map(status => {
                const count = campaigns.filter(c => c.status === status).length;
                const StatusIcon = campaignStatusIcons[status];
                return (
                  <div key={status} className={`px-4 py-2 rounded-lg border ${campaignStatusColors[status]} border-current/30`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" />
                      <span className="capitalize">{status}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Campaigns List */}
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => {
                const brand = brands.find(b => b.id === campaign.brandId);
                const StatusIcon = campaignStatusIcons[campaign.status];
                const isExpanded = expandedCampaign === campaign.id;
                
                return (
                  <div
                    key={campaign.id}
                    className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden"
                  >
                    <div 
                      className="p-5 cursor-pointer hover:bg-neutral-800/50 transition-colors"
                      onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-3 h-12 rounded-full"
                            style={{ backgroundColor: brand?.color }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white">{campaign.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded ${campaignStatusColors[campaign.status]}`}>
                                {campaign.status}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-400 mt-1">{campaign.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-neutral-500">{campaign.schedule}</p>
                            {campaign.frequency && (
                              <p className="text-sm text-neutral-300">{campaign.frequency}</p>
                            )}
                          </div>
                          <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-5 border-t border-neutral-800 bg-neutral-800/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-neutral-500">Type</p>
                            <p className="text-sm text-neutral-300 capitalize">{campaign.type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Brand</p>
                            <p className="text-sm text-neutral-300">{brand?.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Platforms</p>
                            <p className="text-sm text-neutral-300">{campaign.platforms.join(', ')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Schedule</p>
                            <p className="text-sm text-neutral-300">{campaign.frequency || campaign.schedule}</p>
                          </div>
                        </div>
                        {campaign.startDate && (
                          <div className="mt-4 pt-4 border-t border-neutral-700">
                            <p className="text-xs text-neutral-500">Campaign Period</p>
                            <p className="text-sm text-neutral-300">{campaign.startDate} → {campaign.endDate || 'Ongoing'}</p>
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          <button className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm">
                            {campaign.status === 'draft' ? 'Activate' : 'Edit'}
                          </button>
                          <button className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-sm">
                            View Analytics
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EMAIL LISTS SECTION */}
        {activeSection === "lists" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Email Lists</h2>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2">
                <Mail className="w-4 h-4" />
                New List
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emailLists.map((list) => {
                const brand = brands.find(b => b.id === list.brandId);
                return (
                  <div
                    key={list.id}
                    className="p-5 rounded-xl bg-neutral-900 border border-neutral-800"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-3 h-full min-h-[60px] rounded-full"
                        style={{ backgroundColor: brand?.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">{list.name}</h3>
                          <span className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded">
                            {list.platform}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-400 mt-1">{list.purpose}</p>
                        <div className="flex items-center justify-between mt-4">
                          <div>
                            <p className="text-2xl font-bold text-white">{list.subscribers.toLocaleString()}</p>
                            <p className="text-xs text-neutral-500">subscribers</p>
                          </div>
                          <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            Send Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TOOLS SECTION */}
        {activeSection === "tools" && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white">Marketing Tools</h2>

            {(["email", "social", "analytics", "podcast", "automation"] as const).map((category) => {
              const categoryTools = tools.filter((t) => t.category === category);
              if (categoryTools.length === 0) return null;
              const CategoryIcon = categoryIcons[category];

              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CategoryIcon className="w-5 h-5 text-orange-400" />
                    {categoryLabels[category]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="p-5 rounded-xl bg-neutral-900 border border-neutral-800"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white">{tool.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded border ${statusColors[tool.status]}`}>
                            {tool.status === 'active' ? 'Active' : tool.status === 'needs-setup' ? 'Setup Needed' : 'OAuth Required'}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-400 mb-3">{tool.description}</p>
                        <p className="text-xs text-neutral-500 mb-4">Best for: {tool.bestFor}</p>
                        <div className="flex gap-2">
                          {tool.url && (
                            <a
                              href={tool.url}
                              target="_blank"
                              className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-sm flex items-center gap-1"
                            >
                              Open
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {tool.docsUrl && (
                            <a
                              href={tool.docsUrl}
                              target="_blank"
                              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-sm flex items-center gap-1"
                            >
                              Docs
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {tool.apiAvailable && (
                          <p className="text-xs text-green-400 mt-3 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            API Available
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WORKFLOWS SECTION */}
        {activeSection === "workflows" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Marketing Workflows</h2>

            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-6 rounded-xl bg-neutral-900 border border-neutral-800"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{workflow.name}</h3>
                      <p className="text-xs text-neutral-400">Trigger: {workflow.trigger}</p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-400 mb-4">{workflow.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {workflow.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center justify-center">
                          {step.step}
                        </span>
                        <span className="text-sm text-neutral-300 bg-neutral-800 px-3 py-1 rounded">
                          {step.toolName}: {step.action}
                        </span>
                        {idx < workflow.steps.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-neutral-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FUNNEL SECTION */}
        {activeSection === "funnel" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Lead Funnel</h2>

            <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
              <div className="space-y-4">
                {leadFunnel.map((stage, idx) => {
                  const widthPercent = 100 - (idx * 15);
                  return (
                    <div key={stage.stage} className="relative">
                      <div 
                        className="h-16 bg-gradient-to-r from-orange-500/30 to-orange-600/10 rounded-lg flex items-center justify-between px-6"
                        style={{ width: `${widthPercent}%` }}
                      >
                        <span className="font-semibold text-white">{stage.stage}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-white">{stage.count}</span>
                          {stage.conversionRate !== undefined && (
                            <span className="text-sm text-neutral-400 ml-2">
                              ({stage.conversionRate}% conv.)
                            </span>
                          )}
                        </div>
                      </div>
                      {idx < leadFunnel.length - 1 && (
                        <div className="absolute left-8 -bottom-2 text-neutral-500">
                          <ArrowRight className="w-4 h-4 rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
              <h3 className="font-semibold text-white mb-4">Funnel Optimization Tips</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  Capture more leads with NJAC basketball content
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  Nurture with weekly training tips email
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  Offer free trial class to clicked leads
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  Follow up with personal call for trial attendees
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
