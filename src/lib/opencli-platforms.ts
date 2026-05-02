export interface PlatformCommand {
  name: string;
  cmd: string;
  kind: "browse" | "action";
  params: { name: string; placeholder: string; required?: boolean }[];
}

export interface Platform {
  name: string;
  cmd: string;
  commands: PlatformCommand[];
}

export interface PlatformCategory {
  category: string;
  platforms: Platform[];
}

export const OPENCLI_CATEGORIES: PlatformCategory[] = [
  {
    category: "Social",
    platforms: [
      {
        name: "Twitter / X", cmd: "twitter",
        commands: [
          { name: "Timeline", cmd: "timeline", kind: "browse", params: [{ name: "count", placeholder: "20" }] },
          { name: "Trending", cmd: "trending", kind: "browse", params: [] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
          { name: "Post", cmd: "post", kind: "action", params: [{ name: "text", placeholder: "Tweet text", required: true }] },
        ],
      },
      {
        name: "Instagram", cmd: "instagram",
        commands: [
          { name: "Feed", cmd: "feed", kind: "browse", params: [{ name: "count", placeholder: "20" }] },
          { name: "Trending", cmd: "trending", kind: "browse", params: [] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
        ],
      },
      {
        name: "TikTok", cmd: "tiktok",
        commands: [
          { name: "Trending", cmd: "trending", kind: "browse", params: [] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
        ],
      },
      {
        name: "Facebook", cmd: "facebook",
        commands: [
          { name: "Feed", cmd: "feed", kind: "browse", params: [] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
        ],
      },
      {
        name: "LinkedIn", cmd: "linkedin",
        commands: [
          { name: "Feed", cmd: "feed", kind: "browse", params: [] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
          { name: "Post", cmd: "post", kind: "action", params: [{ name: "text", placeholder: "Post text", required: true }] },
        ],
      },
      {
        name: "Reddit", cmd: "reddit",
        commands: [
          { name: "Hot", cmd: "hot", kind: "browse", params: [{ name: "subreddit", placeholder: "all" }] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
        ],
      },
    ],
  },
  {
    category: "Research",
    platforms: [
      {
        name: "Google", cmd: "google",
        commands: [
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search query", required: true }] },
          { name: "News", cmd: "news", kind: "browse", params: [{ name: "query", placeholder: "News topic", required: true }] },
        ],
      },
      {
        name: "Bloomberg", cmd: "bloomberg",
        commands: [
          { name: "Headlines", cmd: "headlines", kind: "browse", params: [] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
        ],
      },
      {
        name: "Yahoo Finance", cmd: "yahoo-finance",
        commands: [
          { name: "Market", cmd: "market", kind: "browse", params: [] },
          { name: "Quote", cmd: "quote", kind: "browse", params: [{ name: "symbol", placeholder: "AAPL", required: true }] },
        ],
      },
      {
        name: "Reuters", cmd: "reuters",
        commands: [
          { name: "Headlines", cmd: "headlines", kind: "browse", params: [] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
        ],
      },
    ],
  },
  {
    category: "Content",
    platforms: [
      {
        name: "YouTube", cmd: "youtube",
        commands: [
          { name: "Trending", cmd: "trending", kind: "browse", params: [] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
        ],
      },
      {
        name: "Medium", cmd: "medium",
        commands: [
          { name: "Trending", cmd: "trending", kind: "browse", params: [] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search topic", required: true }] },
        ],
      },
      {
        name: "Substack", cmd: "substack",
        commands: [
          { name: "Trending", cmd: "trending", kind: "browse", params: [] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
        ],
      },
      {
        name: "Hacker News", cmd: "hackernews",
        commands: [
          { name: "Top Stories", cmd: "top", kind: "browse", params: [{ name: "count", placeholder: "20" }] },
          { name: "Search", cmd: "search", kind: "browse", params: [{ name: "query", placeholder: "Search term", required: true }] },
        ],
      },
    ],
  },
];

export const PIPELINE_ACTIONS = [
  { name: "Intake New Item", action: "intake", description: "Add a new item to the pipeline", method: "POST", endpoint: "/api/marketing-pipeline/intake" },
  { name: "Auto-Advance", action: "auto-advance", description: "Advance all eligible items", method: "POST", endpoint: "/api/marketing-pipeline/auto-advance" },
  { name: "Quality Gate", action: "quality-gate", description: "Run quality checks", method: "POST", endpoint: "/api/pipeline/quality-gate" },
  { name: "Pipeline Health", action: "health", description: "Check pipeline status", method: "GET", endpoint: "/api/pipeline/health" },
  { name: "Full Cycle", action: "full-cycle", description: "Run complete pipeline cycle", method: "POST", endpoint: "/api/pipeline/auto-full-cycle" },
  { name: "Pipeline Status", action: "status", description: "View current stage distribution", method: "GET", endpoint: "/api/marketing-pipeline" },
];

export const EMAIL_ACTIONS = [
  { name: "List Campaigns", action: "list-campaigns", description: "View all Mautic campaigns" },
  { name: "List Emails", action: "list-emails", description: "View all email templates" },
  { name: "List Segments", action: "list-segments", description: "View audience segments" },
  { name: "List Contacts", action: "list-contacts", description: "Search contacts" },
  { name: "Aggregate Stats", action: "aggregate-stats", description: "Email performance overview" },
];

export const MARKETING_OPS_ACTIONS = [
  { name: "Leads", action: "list-leads", description: "View marketing leads", icon: "users" },
  { name: "Campaigns", action: "list-campaigns", description: "View campaigns", icon: "target" },
  { name: "Contacts", action: "list-contacts", description: "Search CRM contacts", icon: "contact" },
  { name: "Inboxes", action: "list-inboxes", description: "View email inboxes", icon: "inbox" },
  { name: "Funnels", action: "list-funnels", description: "View marketing funnels", icon: "filter" },
  { name: "Automations", action: "list-automations", description: "View automation rules", icon: "zap" },
  { name: "Gmail", action: "gmail-status", description: "Gmail integration status", icon: "mail" },
  { name: "Analytics", action: "analytics-overview", description: "Marketing analytics overview", icon: "bar-chart" },
  { name: "Email Collectors", action: "email-collectors", description: "View email collectors", icon: "download" },
  { name: "Email Filters", action: "email-filters", description: "View email filter rules", icon: "filter" },
  { name: "Cron Jobs", action: "cron-status", description: "View scheduled jobs", icon: "clock" },
  { name: "Files", action: "file-list", description: "View uploaded files", icon: "folder" },
];

export const BRAND_PROFILES: Record<string, { name: string; emoji: string; platforms: Record<string, string> }> = {
  tbf: { name: "The Basketball Factory", emoji: "🏀", platforms: { instagram: "thebasketballfactorynj", tiktok: "thebasketballfactorynj", facebook: "thebasketballfactorynj", twitter: "tbfnj", youtube: "@thebasketballfactorynj" } },
  ra1: { name: "Rise As One AAU", emoji: "🏆", platforms: { instagram: "riseasone_aau", tiktok: "riseasone_aau", facebook: "riseasoneaau", twitter: "riseasone_aau" } },
  hos: { name: "House of Sports", emoji: "🏢", platforms: { instagram: "houseofsportsnj", facebook: "houseofsportsnj" } },
  shotiq: { name: "ShotIQ", emoji: "🎯", platforms: { instagram: "shotiqai", tiktok: "shotiqai", twitter: "shotiqai" } },
  kevin: { name: "Kevin Houston", emoji: "👤", platforms: { instagram: "kevinhouston_hoops", tiktok: "kevinhouston_hoops", twitter: "kevinhouston", linkedin: "kevinhouston" } },
  bookmarkai: { name: "BookmarkAI Hub", emoji: "📚", platforms: { twitter: "bookmarkaihub" } },
};

export const CONTENT_TYPES = [
  { value: "newsletter", label: "Newsletter" },
  { value: "announcement", label: "Announcement" },
  { value: "tryout-promo", label: "Tryout Promo" },
  { value: "player-spotlight", label: "Player Spotlight" },
  { value: "training-tips", label: "Training Tips" },
  { value: "event-reminder", label: "Event Reminder" },
  { value: "game-results", label: "Game Results" },
];

export const NOTIFICATION_ACTIONS = [
  { name: "Test Notification", action: "test-notification", description: "Send a test push notification" },
  { name: "Lead Qualified", action: "lead-qualified", description: "Notify about a new qualified lead" },
  { name: "Campaign Launched", action: "campaign-launched", description: "Notify about a campaign launch" },
  { name: "Social Scheduled", action: "social-scheduled", description: "Notify about scheduled social posts" },
  { name: "Health Warning", action: "health-warning", description: "Send a health warning alert" },
];

export const UMAMI_ACTIONS = [
  { name: "List Websites", action: "umami-websites", description: "View all tracked websites" },
  { name: "Website Stats", action: "umami-stats", description: "Get stats for a website (30d)", needsWebsiteId: true },
  { name: "Top Pages", action: "umami-top-pages", description: "Top visited pages (30d)", needsWebsiteId: true },
  { name: "Referrers", action: "umami-referrers", description: "Traffic referral sources (30d)", needsWebsiteId: true },
  { name: "Events", action: "umami-events", description: "Custom events (7d)", needsWebsiteId: true },
  { name: "Page Views", action: "umami-pageviews", description: "Daily page view trends (30d)", needsWebsiteId: true },
];

export const FORMBRICKS_ACTIONS = [
  { name: "List Surveys", action: "formbricks-surveys", description: "View all surveys", needsEnvironmentId: true },
  { name: "Survey Responses", action: "formbricks-responses", description: "View survey responses", needsSurveyId: true },
];
