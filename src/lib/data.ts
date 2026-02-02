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

// ============================================================
// MARKET DOMINATION: TERRITORY DATA
// ============================================================

export interface Territory {
  id: string;
  name: string;
  county: string;
  state: string;
  population?: number;
  youthPopulation?: number;
  currentStudents: number;
  marketShare: number;
  status: 'dominated' | 'strong' | 'growing' | 'untapped' | 'competitor-heavy';
  competitors: string[];
  distanceFromHQ: number; // miles from Sparta
  zipCodes: string[];
}

export const territories: Territory[] = [
  // SUSSEX COUNTY (Home Base)
  { id: 'sparta', name: 'Sparta', county: 'Sussex', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'growing', competitors: [], distanceFromHQ: 0, zipCodes: ['07871'] },
  { id: 'newton', name: 'Newton', county: 'Sussex', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 8, zipCodes: ['07860'] },
  { id: 'hopatcong', name: 'Hopatcong', county: 'Sussex', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 12, zipCodes: ['07843'] },
  { id: 'vernon', name: 'Vernon', county: 'Sussex', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 15, zipCodes: ['07462'] },
  { id: 'frankford', name: 'Frankford', county: 'Sussex', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 18, zipCodes: ['07826'] },
  { id: 'highpoint', name: 'High Point', county: 'Sussex', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 22, zipCodes: ['07461'] },
  
  // WARREN COUNTY
  { id: 'hackettstown', name: 'Hackettstown', county: 'Warren', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 15, zipCodes: ['07840'] },
  { id: 'washington-twp', name: 'Washington Township', county: 'Warren', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 18, zipCodes: ['07882'] },
  { id: 'phillipsburg', name: 'Phillipsburg', county: 'Warren', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 25, zipCodes: ['08865'] },
  { id: 'blairstown', name: 'Blairstown', county: 'Warren', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 20, zipCodes: ['07825'] },
  
  // MORRIS COUNTY
  { id: 'dover', name: 'Dover', county: 'Morris', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'competitor-heavy', competitors: ['Elite Basketball Academy'], distanceFromHQ: 18, zipCodes: ['07801'] },
  { id: 'randolph', name: 'Randolph', county: 'Morris', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'competitor-heavy', competitors: [], distanceFromHQ: 20, zipCodes: ['07869'] },
  { id: 'rockaway', name: 'Rockaway', county: 'Morris', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 15, zipCodes: ['07866'] },
  { id: 'denville', name: 'Denville', county: 'Morris', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 22, zipCodes: ['07834'] },
  { id: 'morristown', name: 'Morristown', county: 'Morris', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'competitor-heavy', competitors: ['Morristown Basketball'], distanceFromHQ: 28, zipCodes: ['07960'] },
  { id: 'parsippany', name: 'Parsippany', county: 'Morris', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 25, zipCodes: ['07054'] },
  
  // PASSAIC COUNTY
  { id: 'west-milford', name: 'West Milford', county: 'Passaic', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'untapped', competitors: [], distanceFromHQ: 20, zipCodes: ['07480'] },
  { id: 'wayne', name: 'Wayne', county: 'Passaic', state: 'NJ', currentStudents: 0, marketShare: 0, status: 'competitor-heavy', competitors: [], distanceFromHQ: 30, zipCodes: ['07470'] },
];

// ============================================================
// MARKET DOMINATION: COMPETITORS
// ============================================================

export interface Competitor {
  id: string;
  name: string;
  type: 'training' | 'aau' | 'school' | 'rec-league' | 'private-coach';
  location: string;
  territory: string;
  website?: string;
  instagram?: string;
  pricing?: string;
  programs?: string[];
  strengths?: string[];
  weaknesses?: string[];
  reviews?: { rating: number; count: number };
  coaches?: string[];
  estimatedStudents?: number;
  threatLevel: 'high' | 'medium' | 'low';
  notes?: string;
}

export const competitors: Competitor[] = [
  {
    id: 'comp-1',
    name: 'Elite Basketball Academy',
    type: 'training',
    location: 'Dover, NJ',
    territory: 'dover',
    pricing: '$200/month',
    programs: ['Youth Training', 'High School Prep'],
    strengths: ['Established brand', 'Good facility'],
    weaknesses: ['Limited AAU connection', 'Generic training'],
    threatLevel: 'medium',
    notes: 'Main competitor in Morris County'
  },
  {
    id: 'comp-2',
    name: 'NJ Bulldogs AAU',
    type: 'aau',
    location: 'Hackettstown, NJ',
    territory: 'hackettstown',
    programs: ['AAU Teams 10U-17U'],
    strengths: ['Tournament presence'],
    weaknesses: ['No facility', 'No training program'],
    threatLevel: 'low',
    notes: 'Potential partnership or conquest target'
  },
  {
    id: 'comp-3',
    name: 'Sparta Recreation Basketball',
    type: 'rec-league',
    location: 'Sparta, NJ',
    territory: 'sparta',
    programs: ['Rec League 4th-8th grade'],
    strengths: ['Low cost', 'Community trust'],
    weaknesses: ['No skill development', 'Volunteer coaches'],
    threatLevel: 'low',
    notes: 'Feeder program - partner dont compete'
  },
];

// ============================================================
// MARKET DOMINATION: SCHOOLS DATABASE
// ============================================================

export interface School {
  id: string;
  name: string;
  type: 'high-school' | 'middle-school' | 'elementary';
  territory: string;
  address?: string;
  athleticDirector?: { name: string; email?: string; phone?: string };
  basketballCoach?: { name: string; email?: string; phone?: string };
  conference?: string;
  teamRecord?: string;
  topPlayers?: string[];
  partnershipStatus: 'active' | 'contacted' | 'not-contacted' | 'declined';
  notes?: string;
}

export const schools: School[] = [
  // SUSSEX COUNTY HIGH SCHOOLS
  { id: 'sparta-hs', name: 'Sparta High School', type: 'high-school', territory: 'sparta', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'newton-hs', name: 'Newton High School', type: 'high-school', territory: 'newton', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'kittatinny-hs', name: 'Kittatinny Regional High School', type: 'high-school', territory: 'frankford', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'hopatcong-hs', name: 'Hopatcong High School', type: 'high-school', territory: 'hopatcong', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'vernon-hs', name: 'Vernon Township High School', type: 'high-school', territory: 'vernon', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'highpoint-hs', name: 'High Point Regional High School', type: 'high-school', territory: 'highpoint', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  
  // WARREN COUNTY HIGH SCHOOLS
  { id: 'hackettstown-hs', name: 'Hackettstown High School', type: 'high-school', territory: 'hackettstown', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'warren-hills-hs', name: 'Warren Hills Regional High School', type: 'high-school', territory: 'washington-twp', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'phillipsburg-hs', name: 'Phillipsburg High School', type: 'high-school', territory: 'phillipsburg', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'north-warren-hs', name: 'North Warren Regional High School', type: 'high-school', territory: 'blairstown', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  
  // MORRIS COUNTY HIGH SCHOOLS
  { id: 'dover-hs', name: 'Dover High School', type: 'high-school', territory: 'dover', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'randolph-hs', name: 'Randolph High School', type: 'high-school', territory: 'randolph', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'rockaway-hs', name: 'Morris Hills High School', type: 'high-school', territory: 'rockaway', conference: 'NJAC', partnershipStatus: 'not-contacted' },
  { id: 'morristown-hs', name: 'Morristown High School', type: 'high-school', territory: 'morristown', conference: 'NJAC', topPlayers: ['Nawel Ibazatene Lefebvre'], partnershipStatus: 'not-contacted', notes: 'Star player: Nawel (938 career pts)' },
];

// ============================================================
// MARKET DOMINATION: NJAC COVERAGE
// ============================================================

export interface NJACGame {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
  covered: boolean;
  contentCreated?: string[];
  topPerformers?: { player: string; stats: string }[];
}

export interface PlayerRanking {
  rank: number;
  name: string;
  school: string;
  grade: string;
  position: string;
  stats?: string;
  notes?: string;
}

export const njacPlayerRankings: PlayerRanking[] = [
  { rank: 1, name: 'Nawel Ibazatene Lefebvre', school: 'Morristown', grade: 'So.', position: 'G', stats: '938 career pts', notes: 'Top scorer in NJAC' },
  { rank: 2, name: 'Ryder Broking', school: 'Hackettstown', grade: 'So.', position: 'F', stats: '3 double-doubles', notes: 'Rising star' },
  { rank: 3, name: 'Lila Schoenfeld', school: 'Mendham', grade: 'Sr.', position: 'G', stats: 'Team leader', notes: 'Senior leader' },
];

// ============================================================
// MARKET DOMINATION: REFERRAL ENGINE
// ============================================================

export interface Referral {
  id: string;
  referrerName: string;
  referrerEmail?: string;
  referredName: string;
  referredEmail?: string;
  status: 'pending' | 'enrolled' | 'not-converted';
  dateReferred: string;
  rewardStatus: 'pending' | 'paid' | 'not-applicable';
  rewardAmount?: number;
  program?: string;
  notes?: string;
}

export interface ReferralLeader {
  name: string;
  totalReferrals: number;
  enrolledReferrals: number;
  totalRewardsEarned: number;
}

export const referralProgram = {
  rewardPerEnrollment: 50, // $50 per successful referral
  rewardType: 'credit', // credit toward training
  active: true,
};

export const referrals: Referral[] = [];
export const referralLeaders: ReferralLeader[] = [];

// ============================================================
// MARKET DOMINATION: EVENTS CALENDAR
// ============================================================

export interface LocalEvent {
  id: string;
  name: string;
  type: 'tournament' | 'school-game' | 'rec-game' | 'camp' | 'showcase' | 'clinic' | 'community';
  date: string;
  endDate?: string;
  location: string;
  territory?: string;
  estimatedAttendance?: number;
  targetAudience: string;
  ourPresence: {
    attending: boolean;
    booth: boolean;
    sponsoring: boolean;
    flyersDistributed?: number;
    leadsCollected?: number;
    notes?: string;
  };
}

export const localEvents: LocalEvent[] = [
  {
    id: 'evt-1',
    name: 'Sparta Youth Basketball Championships',
    type: 'rec-game',
    date: '2026-03-15',
    location: 'Sparta Middle School',
    territory: 'sparta',
    estimatedAttendance: 200,
    targetAudience: 'Youth players and parents',
    ourPresence: { attending: false, booth: false, sponsoring: false }
  },
  {
    id: 'evt-2',
    name: 'NJAC Winter Tournament',
    type: 'tournament',
    date: '2026-02-20',
    endDate: '2026-02-22',
    location: 'Various NJAC Schools',
    estimatedAttendance: 500,
    targetAudience: 'High school players, college scouts, parents',
    ourPresence: { attending: false, booth: false, sponsoring: false }
  },
  {
    id: 'evt-3',
    name: 'House of Sports Open House',
    type: 'community',
    date: '2026-03-01',
    location: 'House of Sports, Sparta',
    territory: 'sparta',
    estimatedAttendance: 100,
    targetAudience: 'Local families',
    ourPresence: { attending: true, booth: true, sponsoring: true }
  },
];

// ============================================================
// MARKET DOMINATION: PARTNERSHIPS CRM
// ============================================================

export interface Partnership {
  id: string;
  name: string;
  type: 'school-coach' | 'rec-director' | 'tournament-org' | 'business-sponsor' | 'media' | 'other';
  organization?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  territory?: string;
  status: 'active' | 'negotiating' | 'contacted' | 'cold' | 'declined';
  value?: string; // What they provide or potential value
  lastContact?: string;
  nextAction?: string;
  notes?: string;
}

export const partnerships: Partnership[] = [
  {
    id: 'partner-1',
    name: 'Sparta Rec Basketball',
    type: 'rec-director',
    organization: 'Sparta Recreation Department',
    status: 'cold',
    value: 'Referrals from rec league players wanting more training',
    nextAction: 'Reach out to propose partnership'
  },
];

// ============================================================
// MARKET DOMINATION: MARKET SHARE TRACKING
// ============================================================

export interface MarketShareGoal {
  id: string;
  territory: string;
  ageGroup: 'all' | '8-10' | '11-13' | '14-18';
  programType: 'all' | 'training' | 'aau';
  currentShare: number;
  targetShare: number;
  deadline: string;
  status: 'on-track' | 'behind' | 'achieved';
}

export const marketShareGoals: MarketShareGoal[] = [
  { id: 'goal-1', territory: 'sparta', ageGroup: 'all', programType: 'all', currentShare: 0, targetShare: 40, deadline: '2026-06-01', status: 'behind' },
  { id: 'goal-2', territory: 'newton', ageGroup: 'all', programType: 'all', currentShare: 0, targetShare: 20, deadline: '2026-06-01', status: 'behind' },
  { id: 'goal-3', territory: 'hackettstown', ageGroup: 'all', programType: 'all', currentShare: 0, targetShare: 15, deadline: '2026-06-01', status: 'behind' },
];

// ============================================================
// MARKET DOMINATION: EXPANSION PHASES
// ============================================================

export const expansionPhases = [
  {
    phase: 1,
    name: 'Dominate Northern NJ',
    territories: ['Sussex County', 'Warren County', 'Northern Morris County'],
    targetDate: '2026-12-31',
    status: 'active',
    milestones: [
      { name: '40% market share in Sparta', completed: false },
      { name: '20% market share in 5 surrounding towns', completed: false },
      { name: 'Partnership with 10 local schools', completed: false },
      { name: '500 email subscribers', completed: false },
      { name: 'NJAC coverage established', completed: false },
    ]
  },
  {
    phase: 2,
    name: 'Dominate All of New Jersey',
    territories: ['All NJ Counties'],
    targetDate: '2028-12-31',
    status: 'planned',
    milestones: [
      { name: 'Presence in all 21 counties', completed: false },
      { name: '5,000 email subscribers', completed: false },
      { name: 'Recognized state-wide brand', completed: false },
    ]
  },
  {
    phase: 3,
    name: 'Dominate USA',
    territories: ['National'],
    targetDate: '2030-12-31',
    status: 'planned',
    milestones: [
      { name: 'ShotIQ app national launch', completed: false },
      { name: 'Franchise/licensing model', completed: false },
      { name: 'National AAU presence', completed: false },
    ]
  },
];
