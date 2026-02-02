// Marketing Command Center - Complete Data Model

// ============================================================
// INTERFACES
// ============================================================

export interface EmailList {
  id: string;
  name: string;
  platform: 'sendfox' | 'acumbamail' | 'reachinbox';
  subscribers: number;
  brandId: string;
  purpose: string;
  lastUpdated: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'sms' | 'podcast' | 'ads';
  brandId: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  schedule: 'one-time' | 'weekly' | 'monthly' | 'automated';
  frequency?: string; // e.g., "Every Monday 9am"
  description: string;
  platforms: string[];
  startDate?: string;
  endDate?: string;
  metrics?: CampaignMetrics;
}

export interface CampaignMetrics {
  sent?: number;
  opened?: number;
  clicked?: number;
  converted?: number;
  openRate?: number;
  clickRate?: number;
  views?: number;
  engagement?: number;
}

export interface Tool {
  id: string;
  name: string;
  category: 'email' | 'social' | 'analytics' | 'podcast' | 'automation' | 'ads';
  description: string;
  bestFor: string;
  status: 'active' | 'needs-setup' | 'oauth-required';
  url?: string;
  docsUrl?: string;
  apiAvailable: boolean;
  credentials?: string;
}

export interface LeadFunnel {
  stage: string;
  count: number;
  conversionRate?: number;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  description: string;
  steps: {
    step: number;
    toolId: string;
    toolName: string;
    action: string;
  }[];
}

// ============================================================
// THE 6 BRANDS (Same as Content)
// ============================================================

export const brands = [
  { id: 'tbf', name: 'The Basketball Factory', shortName: 'TBF', color: '#1E3A8A' },
  { id: 'ra1', name: 'Rise As One AAU', shortName: 'RA1', color: '#CE1126' },
  { id: 'hos', name: 'House of Sports', shortName: 'HOS', color: '#F59E0B' },
  { id: 'shotiq', name: 'ShotIQ', shortName: 'SHOTIQ', color: '#8B5CF6' },
  { id: 'kevin', name: 'Kevin Houston', shortName: 'KEVIN', color: '#059669' },
  { id: 'bookmarkai', name: 'BookmarkAI Hub', shortName: 'BOOKMARKAI', color: '#0EA5E9' },
];

// ============================================================
// EMAIL LISTS
// ============================================================

export const emailLists: EmailList[] = [
  {
    id: 'tbf-parents',
    name: 'TBF Parents Newsletter',
    platform: 'sendfox',
    subscribers: 0,
    brandId: 'tbf',
    purpose: 'Training updates, tips, enrollment info',
    lastUpdated: '2026-02-02'
  },
  {
    id: 'ra1-team-parents',
    name: 'RA1 Team Parents',
    platform: 'sendfox',
    subscribers: 0,
    brandId: 'ra1',
    purpose: 'Tournament updates, schedules, team news',
    lastUpdated: '2026-02-02'
  },
  {
    id: 'hos-community',
    name: 'HOS Community',
    platform: 'acumbamail',
    subscribers: 0,
    brandId: 'hos',
    purpose: 'Facility events, rentals, community news',
    lastUpdated: '2026-02-02'
  },
  {
    id: 'shotiq-waitlist',
    name: 'ShotIQ Waitlist',
    platform: 'sendfox',
    subscribers: 0,
    brandId: 'shotiq',
    purpose: 'App updates, beta access, launch news',
    lastUpdated: '2026-02-02'
  },
  {
    id: 'cold-outreach',
    name: 'Cold Outreach Prospects',
    platform: 'reachinbox',
    subscribers: 0,
    brandId: 'tbf',
    purpose: 'New parent lead outreach (from Acquisition)',
    lastUpdated: '2026-02-02'
  },
];

// ============================================================
// CAMPAIGNS (Like TV Shows for Content)
// ============================================================

export const campaigns: Campaign[] = [
  // RECURRING CAMPAIGNS
  {
    id: 'tbf-weekly-tips',
    name: 'TBF Training Tips',
    type: 'email',
    brandId: 'tbf',
    status: 'draft',
    schedule: 'weekly',
    frequency: 'Every Tuesday 9am',
    description: 'Weekly basketball training tips and drills for parents/players',
    platforms: ['sendfox'],
  },
  {
    id: 'ra1-game-recap',
    name: 'RA1 Game Recap',
    type: 'email',
    brandId: 'ra1',
    status: 'draft',
    schedule: 'weekly',
    frequency: 'Every Monday 6pm',
    description: 'Weekend game results, highlights, next week schedule',
    platforms: ['sendfox'],
  },
  {
    id: 'tbf-social-daily',
    name: 'TBF Daily Social',
    type: 'social',
    brandId: 'tbf',
    status: 'draft',
    schedule: 'automated',
    frequency: '8 posts/day via Late',
    description: 'Daily training clips, tips, quotes across all platforms',
    platforms: ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook'],
  },
  {
    id: 'ra1-social-daily',
    name: 'RA1 Daily Social',
    type: 'social',
    brandId: 'ra1',
    status: 'draft',
    schedule: 'automated',
    frequency: '8 posts/day via Late',
    description: 'Game highlights, player spotlights, team content',
    platforms: ['instagram', 'tiktok', 'youtube', 'twitter'],
  },
  {
    id: 'monthly-newsletter',
    name: 'HOS Monthly Newsletter',
    type: 'email',
    brandId: 'hos',
    status: 'draft',
    schedule: 'monthly',
    frequency: '1st of every month',
    description: 'Monthly facility updates, events, community highlights',
    platforms: ['acumbamail'],
  },
  // ONE-TIME CAMPAIGNS
  {
    id: 'spring-enrollment',
    name: 'Spring Training Enrollment',
    type: 'email',
    brandId: 'tbf',
    status: 'draft',
    schedule: 'one-time',
    description: 'Spring program enrollment push',
    platforms: ['sendfox', 'reachinbox'],
    startDate: '2026-02-15',
    endDate: '2026-03-01',
  },
  {
    id: 'ra1-tryouts',
    name: 'RA1 Spring Tryouts',
    type: 'email',
    brandId: 'ra1',
    status: 'draft',
    schedule: 'one-time',
    description: 'AAU tryout announcement and registration',
    platforms: ['sendfox'],
    startDate: '2026-02-20',
    endDate: '2026-03-10',
  },
  {
    id: 'shotiq-launch',
    name: 'ShotIQ Beta Launch',
    type: 'email',
    brandId: 'shotiq',
    status: 'draft',
    schedule: 'one-time',
    description: 'Beta app launch announcement to waitlist',
    platforms: ['sendfox'],
  },
];

// ============================================================
// MARKETING TOOLS
// ============================================================

export const tools: Tool[] = [
  // EMAIL MARKETING
  {
    id: 'sendfox',
    name: 'SendFox',
    category: 'email',
    description: 'Email marketing for content creators',
    bestFor: 'Newsletters, nurture sequences, announcements',
    status: 'active',
    url: 'https://sendfox.com/',
    docsUrl: 'https://sendfox.com/api',
    apiAvailable: true,
    credentials: '~/.config/clawdbot/email_marketing_tools.json'
  },
  {
    id: 'acumbamail',
    name: 'Acumbamail',
    category: 'email',
    description: 'Email, SMS, and landing pages',
    bestFor: 'SMS campaigns, landing pages, EU compliance',
    status: 'active',
    url: 'https://acumbamail.com/',
    docsUrl: 'https://acumbamail.com/en/apidoc/',
    apiAvailable: true,
    credentials: '~/.config/clawdbot/email_marketing_tools.json'
  },
  {
    id: 'reachinbox',
    name: 'ReachInbox',
    category: 'email',
    description: 'AI cold email outreach',
    bestFor: 'Cold outreach to new leads, follow-up sequences',
    status: 'active',
    url: 'https://reachinbox.ai/',
    docsUrl: 'https://reachinbox.ai/docs',
    apiAvailable: true,
    credentials: '~/.config/clawdbot/email_marketing_tools.json'
  },
  // SOCIAL MEDIA
  {
    id: 'late-api',
    name: 'Late (Content Hub)',
    category: 'social',
    description: 'Post to 9 platforms from Content Hub',
    bestFor: 'Bulk posting, scheduling across all platforms',
    status: 'active',
    url: 'http://localhost:3007',
    docsUrl: 'https://late.dev/docs',
    apiAvailable: true,
  },
  {
    id: 'mavic',
    name: 'Mavic',
    category: 'social',
    description: 'AI social media scheduler',
    bestFor: 'AI-generated captions, scheduling',
    status: 'needs-setup',
    url: 'https://mavic.app/',
    apiAvailable: false,
  },
  {
    id: 'unum',
    name: 'UNUM',
    category: 'social',
    description: 'AI planner, feed preview, scheduling',
    bestFor: 'Visual feed planning, Instagram grid',
    status: 'needs-setup',
    url: 'https://app.unum.la/',
    docsUrl: 'https://www.unum.la/help',
    apiAvailable: false,
  },
  {
    id: 'followr',
    name: 'Followr AI',
    category: 'social',
    description: 'AI content generation, automated posting',
    bestFor: 'AI-generated content, growth automation',
    status: 'needs-setup',
    url: 'https://followr.ai/',
    docsUrl: 'https://followr.ai/blog',
    apiAvailable: false,
  },
  // ANALYTICS
  {
    id: 'brave-search',
    name: 'Brave Search API',
    category: 'analytics',
    description: 'Web search for research',
    bestFor: 'Competitor research, market intelligence',
    status: 'active',
    url: 'https://api.search.brave.com/',
    docsUrl: 'https://brave.com/search/api/',
    apiAvailable: true,
    credentials: '~/.config/clawdbot/brave_search.json'
  },
  {
    id: 'posthog',
    name: 'PostHog',
    category: 'analytics',
    description: 'Website/app analytics',
    bestFor: 'Tracking conversions, user behavior, funnels',
    status: 'needs-setup',
    url: 'https://posthog.com/',
    docsUrl: 'https://posthog.com/docs',
    apiAvailable: true,
  },
  // PODCAST
  {
    id: 'podops',
    name: 'PodOps',
    category: 'podcast',
    description: 'Podcast creation & distribution',
    bestFor: 'Creating and hosting podcasts',
    status: 'oauth-required',
    url: 'https://www.mypodops.com/',
    docsUrl: 'https://www.mypodops.com/help',
    apiAvailable: false,
  },
  {
    id: 'hubhopper',
    name: 'Hubhopper',
    category: 'podcast',
    description: 'Podcast hosting platform',
    bestFor: 'Podcast distribution to all platforms',
    status: 'oauth-required',
    url: 'https://hubhopper.com/',
    docsUrl: 'https://hubhopper.com/help',
    apiAvailable: false,
  },
  // AUTOMATION
  {
    id: 'albato',
    name: 'Albato',
    category: 'automation',
    description: 'Integration platform (like Zapier)',
    bestFor: 'Connecting tools, automated workflows',
    status: 'needs-setup',
    url: 'https://albato.com/',
    docsUrl: 'https://albato.com/docs',
    apiAvailable: true,
  },
];

// ============================================================
// LEAD FUNNEL
// ============================================================

export const leadFunnel: LeadFunnel[] = [
  { stage: 'Visitors', count: 0 },
  { stage: 'Leads Captured', count: 0, conversionRate: 0 },
  { stage: 'Emails Opened', count: 0, conversionRate: 0 },
  { stage: 'Clicked/Engaged', count: 0, conversionRate: 0 },
  { stage: 'Trial/Visit', count: 0, conversionRate: 0 },
  { stage: 'Enrolled', count: 0, conversionRate: 0 },
];

// ============================================================
// MARKETING WORKFLOWS
// ============================================================

export const workflows: Workflow[] = [
  {
    id: 'new-lead-nurture',
    name: 'New Lead Nurture Sequence',
    trigger: 'New email captured by Acquisition Agent',
    description: 'Automated email sequence to convert leads to enrollments',
    steps: [
      { step: 1, toolId: 'sendfox', toolName: 'SendFox', action: 'Add to nurture list' },
      { step: 2, toolId: 'sendfox', toolName: 'SendFox', action: 'Send welcome email (Day 0)' },
      { step: 3, toolId: 'sendfox', toolName: 'SendFox', action: 'Send value email #1 (Day 2)' },
      { step: 4, toolId: 'sendfox', toolName: 'SendFox', action: 'Send value email #2 (Day 5)' },
      { step: 5, toolId: 'sendfox', toolName: 'SendFox', action: 'Send offer/CTA email (Day 7)' },
    ]
  },
  {
    id: 'content-to-social',
    name: 'Content → Social Distribution',
    trigger: 'Content Agent completes new content',
    description: 'Distribute content across all social platforms',
    steps: [
      { step: 1, toolId: 'late-api', toolName: 'Late (Content Hub)', action: 'Receive content from Content Agent' },
      { step: 2, toolId: 'late-api', toolName: 'Late (Content Hub)', action: 'Schedule to all 9 platforms' },
      { step: 3, toolId: 'unum', toolName: 'UNUM', action: 'Preview feed grid (optional)' },
      { step: 4, toolId: 'posthog', toolName: 'PostHog', action: 'Track engagement metrics' },
    ]
  },
  {
    id: 'weekly-newsletter',
    name: 'Weekly Newsletter Send',
    trigger: 'Every Tuesday 9am',
    description: 'Send weekly training tips newsletter',
    steps: [
      { step: 1, toolId: 'sendfox', toolName: 'SendFox', action: 'Pull content from Content Agent' },
      { step: 2, toolId: 'sendfox', toolName: 'SendFox', action: 'Build email with template' },
      { step: 3, toolId: 'sendfox', toolName: 'SendFox', action: 'Schedule send for Tuesday 9am' },
      { step: 4, toolId: 'sendfox', toolName: 'SendFox', action: 'Track opens/clicks' },
    ]
  },
  {
    id: 'cold-outreach',
    name: 'Cold Outreach Campaign',
    trigger: 'New lead list from Acquisition Agent',
    description: 'Reach out to cold prospects in target area',
    steps: [
      { step: 1, toolId: 'reachinbox', toolName: 'ReachInbox', action: 'Import lead list' },
      { step: 2, toolId: 'reachinbox', toolName: 'ReachInbox', action: 'Set up personalized sequence' },
      { step: 3, toolId: 'reachinbox', toolName: 'ReachInbox', action: 'Launch campaign' },
      { step: 4, toolId: 'reachinbox', toolName: 'ReachInbox', action: 'Monitor replies, add responders to SendFox' },
    ]
  },
];

// ============================================================
// CONTENT-MARKETING HANDOFF POINTS
// ============================================================

export const handoffPoints = [
  {
    from: 'Content Agent',
    to: 'Marketing Agent',
    trigger: 'New content created',
    action: 'Distribute via Late API to all platforms',
  },
  {
    from: 'Acquisition Agent',
    to: 'Marketing Agent',
    trigger: 'New lead captured',
    action: 'Add to nurture sequence in SendFox',
  },
  {
    from: 'Marketing Agent',
    to: 'Parent Comm Agent',
    trigger: 'Lead converts to customer',
    action: 'Hand off to ongoing parent communication',
  },
  {
    from: 'Marketing Agent',
    to: 'TBF Agent',
    trigger: 'Enrollment inquiry',
    action: 'Route to TBF for enrollment processing',
  },
];
