export type CommandKind = "read" | "write" | "dangerous";
export type CommandRole = "admin" | "player" | "parent" | "any";

export interface CommandParam {
  name: string;
  type: "string" | "number" | "boolean" | "json";
  required: boolean;
  description: string;
}

export interface OpenCLICommand {
  id: string;
  group: string;
  label: string;
  description: string;
  apiRoute: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params: CommandParam[];
  sidebarTab: string;
  kind: CommandKind;
  supportsDryRun: boolean;
  requiresConfirmation: boolean;
  role: CommandRole;
}

export const EXCLUDED_ROUTES = [
  "/api/email-collector/webhook",
  "/api/admin/opencli/execute",
  "/api/admin/opencli/batch",
  "/api/admin/opencli/health",
  "/api/admin/opencli/gstack",
  "/api/admin/opencli/ralph",
  "/api/admin/opencli/coverage",
  "/api/admin/opencli/history",
  "/api/admin/opencli/agent-auth",
] as const;

export const COMMAND_GROUPS = ["analytics", "automation-cron", "campaigns", "contacts-leads", "content", "email", "funnel", "integrations", "opencli-tools", "pipeline-automation", "pipeline-stages", "social", "subscribers", "system"] as const;

export type CommandGroup = typeof COMMAND_GROUPS[number];

function p(name: string, type: CommandParam["type"], required: boolean, description: string): CommandParam {
  return { name, type, required, description };
}

const pId = p("id", "number", false, "Record ID");
const pBody = p("body", "json", false, "Request body JSON");
const pQuery = p("query", "string", false, "Search query");

export const commands: OpenCLICommand[] = [
  { id: "analytics:get", group: "analytics", label: "Get Analytics", description: "GET /api/analytics", apiRoute: "/api/analytics", method: "GET", params: [pQuery], sidebarTab: "Analytics", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "app-health:get", group: "system", label: "Get App Health", description: "GET /api/app-health", apiRoute: "/api/app-health", method: "GET", params: [pQuery], sidebarTab: "Dashboard", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "apps-formbricks:get", group: "integrations", label: "Get Apps Formbricks", description: "GET /api/apps/formbricks", apiRoute: "/api/apps/formbricks", method: "GET", params: [pQuery], sidebarTab: "Integrations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "apps-mautic:get", group: "integrations", label: "Get Apps Mautic", description: "GET /api/apps/mautic", apiRoute: "/api/apps/mautic", method: "GET", params: [pQuery], sidebarTab: "Integrations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "apps-postiz:get", group: "integrations", label: "Get Apps Postiz", description: "GET /api/apps/postiz", apiRoute: "/api/apps/postiz", method: "GET", params: [pQuery], sidebarTab: "Integrations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "apps-umami:get", group: "integrations", label: "Get Apps Umami", description: "GET /api/apps/umami", apiRoute: "/api/apps/umami", method: "GET", params: [pQuery], sidebarTab: "Integrations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "automation:get", group: "automation-cron", label: "Get Automation", description: "GET /api/automation", apiRoute: "/api/automation", method: "GET", params: [pQuery], sidebarTab: "Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "automation:post", group: "automation-cron", label: "Create Automation", description: "POST /api/automation", apiRoute: "/api/automation", method: "POST", params: [pBody], sidebarTab: "Automations", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "automation-toggle:get", group: "automation-cron", label: "Get Automation Toggle", description: "GET /api/automation/toggle", apiRoute: "/api/automation/toggle", method: "GET", params: [pQuery], sidebarTab: "Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "automation-toggle:put", group: "automation-cron", label: "Replace Automation Toggle", description: "PUT /api/automation/toggle", apiRoute: "/api/automation/toggle", method: "PUT", params: [pBody], sidebarTab: "Automations", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "brand-email-config:get", group: "email", label: "Get Brand Email Config", description: "GET /api/brand-email-config", apiRoute: "/api/brand-email-config", method: "GET", params: [pQuery], sidebarTab: "Email", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "brand-email-config:post", group: "email", label: "Create Brand Email Config", description: "POST /api/brand-email-config", apiRoute: "/api/brand-email-config", method: "POST", params: [pBody], sidebarTab: "Email", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "campaign:get", group: "campaigns", label: "Get Campaign", description: "GET /api/campaign", apiRoute: "/api/campaign", method: "GET", params: [pQuery], sidebarTab: "Campaigns", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "campaign:post", group: "campaigns", label: "Create Campaign", description: "POST /api/campaign", apiRoute: "/api/campaign", method: "POST", params: [pBody], sidebarTab: "Campaigns", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "contacts:get", group: "contacts-leads", label: "Get Contacts", description: "GET /api/contacts", apiRoute: "/api/contacts", method: "GET", params: [pQuery], sidebarTab: "Contacts", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "content-distribution-approve:post", group: "content", label: "Create Content Distribution Approve", description: "POST /api/content-distribution/approve", apiRoute: "/api/content-distribution/approve", method: "POST", params: [pBody], sidebarTab: "Content", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "content-distribution-config:get", group: "content", label: "Get Content Distribution Config", description: "GET /api/content-distribution/config", apiRoute: "/api/content-distribution/config", method: "GET", params: [pQuery], sidebarTab: "Content", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "content-distribution-config:put", group: "content", label: "Replace Content Distribution Config", description: "PUT /api/content-distribution/config", apiRoute: "/api/content-distribution/config", method: "PUT", params: [pBody], sidebarTab: "Content", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "content-distribution-send:post", group: "content", label: "Create Content Distribution Send", description: "POST /api/content-distribution/send", apiRoute: "/api/content-distribution/send", method: "POST", params: [pBody], sidebarTab: "Content", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "content-intake:get", group: "content", label: "Get Content Intake", description: "GET /api/content-intake", apiRoute: "/api/content-intake", method: "GET", params: [pQuery], sidebarTab: "Content", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "content-intake:post", group: "content", label: "Create Content Intake", description: "POST /api/content-intake", apiRoute: "/api/content-intake", method: "POST", params: [pBody], sidebarTab: "Content", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "cron-marketing-pipeline:get", group: "automation-cron", label: "Get Cron Marketing Pipeline", description: "GET /api/cron/marketing-pipeline", apiRoute: "/api/cron/marketing-pipeline", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "cron-pipeline:get", group: "automation-cron", label: "Get Cron Pipeline", description: "GET /api/cron/pipeline", apiRoute: "/api/cron/pipeline", method: "GET", params: [pQuery], sidebarTab: "Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "cron-pipeline:post", group: "automation-cron", label: "Create Cron Pipeline", description: "POST /api/cron/pipeline", apiRoute: "/api/cron/pipeline", method: "POST", params: [pBody], sidebarTab: "Automations", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "dashboard:get", group: "system", label: "Get Dashboard", description: "GET /api/dashboard", apiRoute: "/api/dashboard", method: "GET", params: [pQuery], sidebarTab: "Dashboard", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "email-analytics:get", group: "email", label: "Get Email Analytics", description: "GET /api/email-analytics", apiRoute: "/api/email-analytics", method: "GET", params: [pQuery], sidebarTab: "Email", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "email-collector-gmail-scan:post", group: "email", label: "Create Email Collector Gmail Scan", description: "POST /api/email-collector/gmail-scan", apiRoute: "/api/email-collector/gmail-scan", method: "POST", params: [pBody], sidebarTab: "Email", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "email-filter:get", group: "email", label: "Get Email Filter", description: "GET /api/email-filter", apiRoute: "/api/email-filter", method: "GET", params: [pQuery], sidebarTab: "Email", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "email-filter:post", group: "email", label: "Create Email Filter", description: "POST /api/email-filter", apiRoute: "/api/email-filter", method: "POST", params: [pBody], sidebarTab: "Email", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "email-lists:get", group: "email", label: "Get Email Lists", description: "GET /api/email/lists", apiRoute: "/api/email/lists", method: "GET", params: [pQuery], sidebarTab: "Email", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "email-sync:post", group: "email", label: "Create Email Sync", description: "POST /api/email/sync", apiRoute: "/api/email/sync", method: "POST", params: [pBody], sidebarTab: "Email", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "files:get", group: "content", label: "Get Files", description: "GET /api/files", apiRoute: "/api/files", method: "GET", params: [pQuery], sidebarTab: "Content", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "funnel:get", group: "funnel", label: "Get Funnel", description: "GET /api/funnel", apiRoute: "/api/funnel", method: "GET", params: [pQuery], sidebarTab: "Funnels", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "funnel:post", group: "funnel", label: "Create Funnel", description: "POST /api/funnel", apiRoute: "/api/funnel", method: "POST", params: [pBody], sidebarTab: "Funnels", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "gmail:get", group: "email", label: "Get Gmail", description: "GET /api/gmail", apiRoute: "/api/gmail", method: "GET", params: [pQuery], sidebarTab: "Email", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "health:get", group: "system", label: "Get Health", description: "GET /api/health", apiRoute: "/api/health", method: "GET", params: [pQuery], sidebarTab: "Dashboard", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "identity:get", group: "system", label: "Get Identity", description: "GET /api/identity", apiRoute: "/api/identity", method: "GET", params: [pQuery], sidebarTab: "Dashboard", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "inboxes:get", group: "email", label: "Get Inboxes", description: "GET /api/inboxes", apiRoute: "/api/inboxes", method: "GET", params: [pQuery], sidebarTab: "Email", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "inboxes:post", group: "email", label: "Create Inboxes", description: "POST /api/inboxes", apiRoute: "/api/inboxes", method: "POST", params: [pBody], sidebarTab: "Email", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "leads-ingest:post", group: "contacts-leads", label: "Create Leads Ingest", description: "POST /api/leads/ingest", apiRoute: "/api/leads/ingest", method: "POST", params: [pBody], sidebarTab: "Contacts", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "marketing-pipeline-auto-advance:get", group: "pipeline-automation", label: "Get Marketing Pipeline Auto Advance", description: "GET /api/marketing-pipeline/auto-advance", apiRoute: "/api/marketing-pipeline/auto-advance", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "marketing-pipeline-auto-advance:post", group: "pipeline-automation", label: "Create Marketing Pipeline Auto Advance", description: "POST /api/marketing-pipeline/auto-advance", apiRoute: "/api/marketing-pipeline/auto-advance", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "marketing-pipeline-intake:post", group: "pipeline-stages", label: "Create Marketing Pipeline Intake", description: "POST /api/marketing-pipeline/intake", apiRoute: "/api/marketing-pipeline/intake", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "marketing-pipeline:get", group: "pipeline-stages", label: "Get Marketing Pipeline", description: "GET /api/marketing-pipeline", apiRoute: "/api/marketing-pipeline", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "marketing-pipeline:patch", group: "pipeline-stages", label: "Update Marketing Pipeline", description: "PATCH /api/marketing-pipeline", apiRoute: "/api/marketing-pipeline", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "marketing-pipeline:post", group: "pipeline-stages", label: "Create Marketing Pipeline", description: "POST /api/marketing-pipeline", apiRoute: "/api/marketing-pipeline", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-analytics:post", group: "analytics", label: "Create Opencli Analytics", description: "POST /api/opencli/analytics", apiRoute: "/api/opencli/analytics", method: "POST", params: [pBody], sidebarTab: "Analytics", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-audit-log:get", group: "opencli-tools", label: "Get Opencli Audit Log", description: "GET /api/opencli/audit-log", apiRoute: "/api/opencli/audit-log", method: "GET", params: [pQuery], sidebarTab: "OpenCLI Tools", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-email:post", group: "opencli-tools", label: "Create Opencli Email", description: "POST /api/opencli/email", apiRoute: "/api/opencli/email", method: "POST", params: [pBody], sidebarTab: "Email", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-exec:post", group: "opencli-tools", label: "Create Opencli Exec", description: "POST /api/opencli/exec", apiRoute: "/api/opencli/exec", method: "POST", params: [pBody], sidebarTab: "OpenCLI Tools", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-health:get", group: "opencli-tools", label: "Get Opencli Health", description: "GET /api/opencli/health", apiRoute: "/api/opencli/health", method: "GET", params: [pQuery], sidebarTab: "Integrations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-integrations:get", group: "opencli-tools", label: "Get Opencli Integrations", description: "GET /api/opencli/integrations", apiRoute: "/api/opencli/integrations", method: "GET", params: [pQuery], sidebarTab: "Integrations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-marketing-ops:post", group: "opencli-tools", label: "Create Opencli Marketing Ops", description: "POST /api/opencli/marketing-ops", apiRoute: "/api/opencli/marketing-ops", method: "POST", params: [pBody], sidebarTab: "OpenCLI Tools", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-notifications:post", group: "opencli-tools", label: "Create Opencli Notifications", description: "POST /api/opencli/notifications", apiRoute: "/api/opencli/notifications", method: "POST", params: [pBody], sidebarTab: "OpenCLI Tools", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-retry-queue:get", group: "opencli-tools", label: "Get Opencli Retry Queue", description: "GET /api/opencli/retry-queue", apiRoute: "/api/opencli/retry-queue", method: "GET", params: [pQuery], sidebarTab: "OpenCLI Tools", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-retry-queue:post", group: "opencli-tools", label: "Create Opencli Retry Queue", description: "POST /api/opencli/retry-queue", apiRoute: "/api/opencli/retry-queue", method: "POST", params: [pBody], sidebarTab: "OpenCLI Tools", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "opencli-unified-post:post", group: "social", label: "Create Opencli Unified Post", description: "POST /api/opencli/unified-post", apiRoute: "/api/opencli/unified-post", method: "POST", params: [pBody], sidebarTab: "Social", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-assembly:get", group: "pipeline-stages", label: "Get Pipeline Assembly", description: "GET /api/pipeline/assembly", apiRoute: "/api/pipeline/assembly", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-assembly:patch", group: "pipeline-stages", label: "Update Pipeline Assembly", description: "PATCH /api/pipeline/assembly", apiRoute: "/api/pipeline/assembly", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-assembly:post", group: "pipeline-stages", label: "Create Pipeline Assembly", description: "POST /api/pipeline/assembly", apiRoute: "/api/pipeline/assembly", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-assembly:get", group: "pipeline-automation", label: "Get Pipeline Auto Assembly", description: "GET /api/pipeline/auto-assembly", apiRoute: "/api/pipeline/auto-assembly", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-assembly:post", group: "pipeline-automation", label: "Create Pipeline Auto Assembly", description: "POST /api/pipeline/auto-assembly", apiRoute: "/api/pipeline/auto-assembly", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-brief-advance:get", group: "pipeline-automation", label: "Get Pipeline Auto Brief Advance", description: "GET /api/pipeline/auto-brief-advance", apiRoute: "/api/pipeline/auto-brief-advance", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-brief-advance:post", group: "pipeline-automation", label: "Create Pipeline Auto Brief Advance", description: "POST /api/pipeline/auto-brief-advance", apiRoute: "/api/pipeline/auto-brief-advance", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-campaigns:get", group: "pipeline-automation", label: "Get Pipeline Auto Campaigns", description: "GET /api/pipeline/auto-campaigns", apiRoute: "/api/pipeline/auto-campaigns", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-campaigns:post", group: "pipeline-automation", label: "Create Pipeline Auto Campaigns", description: "POST /api/pipeline/auto-campaigns", apiRoute: "/api/pipeline/auto-campaigns", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-content-assets:get", group: "pipeline-automation", label: "Get Pipeline Auto Content Assets", description: "GET /api/pipeline/auto-content-assets", apiRoute: "/api/pipeline/auto-content-assets", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-content-assets:post", group: "pipeline-automation", label: "Create Pipeline Auto Content Assets", description: "POST /api/pipeline/auto-content-assets", apiRoute: "/api/pipeline/auto-content-assets", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-deploy:get", group: "pipeline-automation", label: "Get Pipeline Auto Deploy", description: "GET /api/pipeline/auto-deploy", apiRoute: "/api/pipeline/auto-deploy", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-deploy:post", group: "pipeline-automation", label: "Create Pipeline Auto Deploy", description: "POST /api/pipeline/auto-deploy", apiRoute: "/api/pipeline/auto-deploy", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "dangerous", supportsDryRun: true, requiresConfirmation: true, role: "admin" },
  { id: "pipeline-auto-full-cycle:get", group: "pipeline-automation", label: "Get Pipeline Auto Full Cycle", description: "GET /api/pipeline/auto-full-cycle", apiRoute: "/api/pipeline/auto-full-cycle", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-full-cycle:post", group: "pipeline-automation", label: "Create Pipeline Auto Full Cycle", description: "POST /api/pipeline/auto-full-cycle", apiRoute: "/api/pipeline/auto-full-cycle", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "dangerous", supportsDryRun: true, requiresConfirmation: true, role: "admin" },
  { id: "pipeline-auto-intelligence:get", group: "pipeline-automation", label: "Get Pipeline Auto Intelligence", description: "GET /api/pipeline/auto-intelligence", apiRoute: "/api/pipeline/auto-intelligence", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-intelligence:post", group: "pipeline-automation", label: "Create Pipeline Auto Intelligence", description: "POST /api/pipeline/auto-intelligence", apiRoute: "/api/pipeline/auto-intelligence", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-learning:get", group: "pipeline-automation", label: "Get Pipeline Auto Learning", description: "GET /api/pipeline/auto-learning", apiRoute: "/api/pipeline/auto-learning", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-learning:post", group: "pipeline-automation", label: "Create Pipeline Auto Learning", description: "POST /api/pipeline/auto-learning", apiRoute: "/api/pipeline/auto-learning", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-lifecycle:get", group: "pipeline-automation", label: "Get Pipeline Auto Lifecycle", description: "GET /api/pipeline/auto-lifecycle", apiRoute: "/api/pipeline/auto-lifecycle", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-lifecycle:post", group: "pipeline-automation", label: "Create Pipeline Auto Lifecycle", description: "POST /api/pipeline/auto-lifecycle", apiRoute: "/api/pipeline/auto-lifecycle", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-autonomy-score:get", group: "pipeline-stages", label: "Get Pipeline Autonomy Score", description: "GET /api/pipeline/autonomy-score", apiRoute: "/api/pipeline/autonomy-score", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-optimize:get", group: "pipeline-automation", label: "Get Pipeline Auto Optimize", description: "GET /api/pipeline/auto-optimize", apiRoute: "/api/pipeline/auto-optimize", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-optimize:post", group: "pipeline-automation", label: "Create Pipeline Auto Optimize", description: "POST /api/pipeline/auto-optimize", apiRoute: "/api/pipeline/auto-optimize", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-posthog-analytics:get", group: "pipeline-automation", label: "Get Pipeline Auto Posthog Analytics", description: "GET /api/pipeline/auto-posthog-analytics", apiRoute: "/api/pipeline/auto-posthog-analytics", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-posthog-analytics:post", group: "pipeline-automation", label: "Create Pipeline Auto Posthog Analytics", description: "POST /api/pipeline/auto-posthog-analytics", apiRoute: "/api/pipeline/auto-posthog-analytics", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-prune-intel:get", group: "pipeline-automation", label: "Get Pipeline Auto Prune Intel", description: "GET /api/pipeline/auto-prune-intel", apiRoute: "/api/pipeline/auto-prune-intel", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-prune-intel:post", group: "pipeline-automation", label: "Create Pipeline Auto Prune Intel", description: "POST /api/pipeline/auto-prune-intel", apiRoute: "/api/pipeline/auto-prune-intel", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "dangerous", supportsDryRun: true, requiresConfirmation: true, role: "admin" },
  { id: "pipeline-auto-prune-learning:get", group: "pipeline-automation", label: "Get Pipeline Auto Prune Learning", description: "GET /api/pipeline/auto-prune-learning", apiRoute: "/api/pipeline/auto-prune-learning", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-prune-learning:post", group: "pipeline-automation", label: "Create Pipeline Auto Prune Learning", description: "POST /api/pipeline/auto-prune-learning", apiRoute: "/api/pipeline/auto-prune-learning", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "dangerous", supportsDryRun: true, requiresConfirmation: true, role: "admin" },
  { id: "pipeline-auto-quality-gate:get", group: "pipeline-automation", label: "Get Pipeline Auto Quality Gate", description: "GET /api/pipeline/auto-quality-gate", apiRoute: "/api/pipeline/auto-quality-gate", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-quality-gate:post", group: "pipeline-automation", label: "Create Pipeline Auto Quality Gate", description: "POST /api/pipeline/auto-quality-gate", apiRoute: "/api/pipeline/auto-quality-gate", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-report-committee:get", group: "pipeline-automation", label: "Get Pipeline Auto Report Committee", description: "GET /api/pipeline/auto-report-committee", apiRoute: "/api/pipeline/auto-report-committee", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-report-committee:post", group: "pipeline-automation", label: "Create Pipeline Auto Report Committee", description: "POST /api/pipeline/auto-report-committee", apiRoute: "/api/pipeline/auto-report-committee", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-rss-intel:get", group: "pipeline-automation", label: "Get Pipeline Auto Rss Intel", description: "GET /api/pipeline/auto-rss-intel", apiRoute: "/api/pipeline/auto-rss-intel", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-rss-intel:post", group: "pipeline-automation", label: "Create Pipeline Auto Rss Intel", description: "POST /api/pipeline/auto-rss-intel", apiRoute: "/api/pipeline/auto-rss-intel", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-seasonal:get", group: "pipeline-automation", label: "Get Pipeline Auto Seasonal", description: "GET /api/pipeline/auto-seasonal", apiRoute: "/api/pipeline/auto-seasonal", method: "GET", params: [pQuery], sidebarTab: "Pipeline Automations", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-auto-seasonal:post", group: "pipeline-automation", label: "Create Pipeline Auto Seasonal", description: "POST /api/pipeline/auto-seasonal", apiRoute: "/api/pipeline/auto-seasonal", method: "POST", params: [pBody], sidebarTab: "Pipeline Automations", kind: "write", supportsDryRun: true, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-brand-pods:get", group: "pipeline-stages", label: "Get Pipeline Brand Pods", description: "GET /api/pipeline/brand-pods", apiRoute: "/api/pipeline/brand-pods", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-brand-pods:patch", group: "pipeline-stages", label: "Update Pipeline Brand Pods", description: "PATCH /api/pipeline/brand-pods", apiRoute: "/api/pipeline/brand-pods", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-brand-pods:post", group: "pipeline-stages", label: "Create Pipeline Brand Pods", description: "POST /api/pipeline/brand-pods", apiRoute: "/api/pipeline/brand-pods", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-campaigns:delete", group: "pipeline-stages", label: "Delete Pipeline Campaigns", description: "DELETE /api/pipeline/campaigns", apiRoute: "/api/pipeline/campaigns", method: "DELETE", params: [], sidebarTab: "Pipeline Stages", kind: "dangerous", supportsDryRun: false, requiresConfirmation: true, role: "admin" },
  { id: "pipeline-campaigns:get", group: "pipeline-stages", label: "Get Pipeline Campaigns", description: "GET /api/pipeline/campaigns", apiRoute: "/api/pipeline/campaigns", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-campaigns:patch", group: "pipeline-stages", label: "Update Pipeline Campaigns", description: "PATCH /api/pipeline/campaigns", apiRoute: "/api/pipeline/campaigns", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-campaigns:post", group: "pipeline-stages", label: "Create Pipeline Campaigns", description: "POST /api/pipeline/campaigns", apiRoute: "/api/pipeline/campaigns", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-content-assets:get", group: "pipeline-stages", label: "Get Pipeline Content Assets", description: "GET /api/pipeline/content-assets", apiRoute: "/api/pipeline/content-assets", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-content-assets:patch", group: "pipeline-stages", label: "Update Pipeline Content Assets", description: "PATCH /api/pipeline/content-assets", apiRoute: "/api/pipeline/content-assets", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-content-assets:post", group: "pipeline-stages", label: "Create Pipeline Content Assets", description: "POST /api/pipeline/content-assets", apiRoute: "/api/pipeline/content-assets", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-creative-briefs:delete", group: "pipeline-stages", label: "Delete Pipeline Creative Briefs", description: "DELETE /api/pipeline/creative-briefs", apiRoute: "/api/pipeline/creative-briefs", method: "DELETE", params: [], sidebarTab: "Pipeline Stages", kind: "dangerous", supportsDryRun: false, requiresConfirmation: true, role: "admin" },
  { id: "pipeline-creative-briefs:get", group: "pipeline-stages", label: "Get Pipeline Creative Briefs", description: "GET /api/pipeline/creative-briefs", apiRoute: "/api/pipeline/creative-briefs", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-creative-briefs:patch", group: "pipeline-stages", label: "Update Pipeline Creative Briefs", description: "PATCH /api/pipeline/creative-briefs", apiRoute: "/api/pipeline/creative-briefs", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-creative-briefs:post", group: "pipeline-stages", label: "Create Pipeline Creative Briefs", description: "POST /api/pipeline/creative-briefs", apiRoute: "/api/pipeline/creative-briefs", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-deployments:delete", group: "pipeline-stages", label: "Delete Pipeline Deployments", description: "DELETE /api/pipeline/deployments", apiRoute: "/api/pipeline/deployments", method: "DELETE", params: [], sidebarTab: "Pipeline Stages", kind: "dangerous", supportsDryRun: false, requiresConfirmation: true, role: "admin" },
  { id: "pipeline-deployments:get", group: "pipeline-stages", label: "Get Pipeline Deployments", description: "GET /api/pipeline/deployments", apiRoute: "/api/pipeline/deployments", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-deployments:patch", group: "pipeline-stages", label: "Update Pipeline Deployments", description: "PATCH /api/pipeline/deployments", apiRoute: "/api/pipeline/deployments", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-deployments:post", group: "pipeline-stages", label: "Create Pipeline Deployments", description: "POST /api/pipeline/deployments", apiRoute: "/api/pipeline/deployments", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-health:get", group: "pipeline-stages", label: "Get Pipeline Health", description: "GET /api/pipeline/health", apiRoute: "/api/pipeline/health", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-intelligence:delete", group: "pipeline-stages", label: "Delete Pipeline Intelligence", description: "DELETE /api/pipeline/intelligence", apiRoute: "/api/pipeline/intelligence", method: "DELETE", params: [], sidebarTab: "Pipeline Stages", kind: "dangerous", supportsDryRun: false, requiresConfirmation: true, role: "admin" },
  { id: "pipeline-intelligence:get", group: "pipeline-stages", label: "Get Pipeline Intelligence", description: "GET /api/pipeline/intelligence", apiRoute: "/api/pipeline/intelligence", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-intelligence:patch", group: "pipeline-stages", label: "Update Pipeline Intelligence", description: "PATCH /api/pipeline/intelligence", apiRoute: "/api/pipeline/intelligence", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-intelligence:post", group: "pipeline-stages", label: "Create Pipeline Intelligence", description: "POST /api/pipeline/intelligence", apiRoute: "/api/pipeline/intelligence", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-learning:delete", group: "pipeline-stages", label: "Delete Pipeline Learning", description: "DELETE /api/pipeline/learning", apiRoute: "/api/pipeline/learning", method: "DELETE", params: [], sidebarTab: "Pipeline Stages", kind: "dangerous", supportsDryRun: false, requiresConfirmation: true, role: "admin" },
  { id: "pipeline-learning:get", group: "pipeline-stages", label: "Get Pipeline Learning", description: "GET /api/pipeline/learning", apiRoute: "/api/pipeline/learning", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-learning:patch", group: "pipeline-stages", label: "Update Pipeline Learning", description: "PATCH /api/pipeline/learning", apiRoute: "/api/pipeline/learning", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-learning:post", group: "pipeline-stages", label: "Create Pipeline Learning", description: "POST /api/pipeline/learning", apiRoute: "/api/pipeline/learning", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-performance:get", group: "pipeline-stages", label: "Get Pipeline Performance", description: "GET /api/pipeline/performance", apiRoute: "/api/pipeline/performance", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-performance:patch", group: "pipeline-stages", label: "Update Pipeline Performance", description: "PATCH /api/pipeline/performance", apiRoute: "/api/pipeline/performance", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-performance:post", group: "pipeline-stages", label: "Create Pipeline Performance", description: "POST /api/pipeline/performance", apiRoute: "/api/pipeline/performance", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-quality-gate:get", group: "pipeline-stages", label: "Get Pipeline Quality Gate", description: "GET /api/pipeline/quality-gate", apiRoute: "/api/pipeline/quality-gate", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-quality-gate:patch", group: "pipeline-stages", label: "Update Pipeline Quality Gate", description: "PATCH /api/pipeline/quality-gate", apiRoute: "/api/pipeline/quality-gate", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-quality-gate:post", group: "pipeline-stages", label: "Create Pipeline Quality Gate", description: "POST /api/pipeline/quality-gate", apiRoute: "/api/pipeline/quality-gate", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-seasonal:get", group: "pipeline-stages", label: "Get Pipeline Seasonal", description: "GET /api/pipeline/seasonal", apiRoute: "/api/pipeline/seasonal", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-seasonal:patch", group: "pipeline-stages", label: "Update Pipeline Seasonal", description: "PATCH /api/pipeline/seasonal", apiRoute: "/api/pipeline/seasonal", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-seasonal:post", group: "pipeline-stages", label: "Create Pipeline Seasonal", description: "POST /api/pipeline/seasonal", apiRoute: "/api/pipeline/seasonal", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-tv-shows:delete", group: "pipeline-stages", label: "Delete Pipeline Tv Shows", description: "DELETE /api/pipeline/tv-shows", apiRoute: "/api/pipeline/tv-shows", method: "DELETE", params: [], sidebarTab: "Pipeline Stages", kind: "dangerous", supportsDryRun: false, requiresConfirmation: true, role: "admin" },
  { id: "pipeline-tv-shows:get", group: "pipeline-stages", label: "Get Pipeline Tv Shows", description: "GET /api/pipeline/tv-shows", apiRoute: "/api/pipeline/tv-shows", method: "GET", params: [pQuery], sidebarTab: "Pipeline Stages", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-tv-shows:patch", group: "pipeline-stages", label: "Update Pipeline Tv Shows", description: "PATCH /api/pipeline/tv-shows", apiRoute: "/api/pipeline/tv-shows", method: "PATCH", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "pipeline-tv-shows:post", group: "pipeline-stages", label: "Create Pipeline Tv Shows", description: "POST /api/pipeline/tv-shows", apiRoute: "/api/pipeline/tv-shows", method: "POST", params: [pBody], sidebarTab: "Pipeline Stages", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "sendmails:get", group: "email", label: "Get Sendmails", description: "GET /api/sendmails", apiRoute: "/api/sendmails", method: "GET", params: [pQuery], sidebarTab: "Email", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "sendmails:post", group: "email", label: "Create Sendmails", description: "POST /api/sendmails", apiRoute: "/api/sendmails", method: "POST", params: [pBody], sidebarTab: "Email", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "social-post-content-teaser:get", group: "social", label: "Get Social Post Content Teaser", description: "GET /api/social-post/content-teaser", apiRoute: "/api/social-post/content-teaser", method: "GET", params: [pQuery], sidebarTab: "Social", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "social-post-content-teaser:post", group: "social", label: "Create Social Post Content Teaser", description: "POST /api/social-post/content-teaser", apiRoute: "/api/social-post/content-teaser", method: "POST", params: [pBody], sidebarTab: "Social", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "social-post:get", group: "social", label: "Get Social Post", description: "GET /api/social-post", apiRoute: "/api/social-post", method: "GET", params: [pQuery], sidebarTab: "Social", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "social-post:post", group: "social", label: "Create Social Post", description: "POST /api/social-post", apiRoute: "/api/social-post", method: "POST", params: [pBody], sidebarTab: "Social", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "subscribers:get", group: "subscribers", label: "Get Subscribers", description: "GET /api/subscribers", apiRoute: "/api/subscribers", method: "GET", params: [pQuery], sidebarTab: "Subscribers", kind: "read", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "subscribers-sync:post", group: "subscribers", label: "Create Subscribers Sync", description: "POST /api/subscribers/sync", apiRoute: "/api/subscribers/sync", method: "POST", params: [pBody], sidebarTab: "Subscribers", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
  { id: "wizard:post", group: "system", label: "Create Wizard", description: "POST /api/wizard", apiRoute: "/api/wizard", method: "POST", params: [pBody], sidebarTab: "Dashboard", kind: "write", supportsDryRun: false, requiresConfirmation: false, role: "admin" },
];

export function getCommandsByGroup(group: CommandGroup): OpenCLICommand[] {
  return commands.filter(c => c.group === group);
}

export function getCommandById(id: string): OpenCLICommand | undefined {
  return commands.find(c => c.id === id);
}

export function searchCommands(query: string): OpenCLICommand[] {
  const q = query.toLowerCase();
  return commands.filter(c =>
    c.id.toLowerCase().includes(q) ||
    c.label.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q) ||
    c.group.toLowerCase().includes(q) ||
    c.apiRoute.toLowerCase().includes(q)
  );
}

export function getAllMappedRoutes(): string[] {
  return [...new Set(commands.map(c => c.apiRoute))];
}

export function getAllMappedEndpoints(): string[] {
  return commands.map(c => `${c.method} ${c.apiRoute}`);
}

export function getCoverageStats() {
  const mappedRoutes = new Set(commands.map(c => c.apiRoute));
  const mappedEndpoints = new Set(commands.map(c => `${c.method} ${c.apiRoute}`));
  const excluded = new Set(EXCLUDED_ROUTES as readonly string[]);
  return {
    totalCommands: commands.length,
    totalGroups: COMMAND_GROUPS.length,
    mappedRoutes: mappedRoutes.size,
    mappedEndpoints: mappedEndpoints.size,
    excludedRoutes: excluded.size,
    byGroup: COMMAND_GROUPS.map(g => ({
      group: g,
      count: commands.filter(c => c.group === g).length,
    })),
    byKind: {
      read: commands.filter(c => c.kind === "read").length,
      write: commands.filter(c => c.kind === "write").length,
      dangerous: commands.filter(c => c.kind === "dangerous").length,
    },
    byMethod: {
      GET: commands.filter(c => c.method === "GET").length,
      POST: commands.filter(c => c.method === "POST").length,
      PATCH: commands.filter(c => c.method === "PATCH").length,
      PUT: commands.filter(c => c.method === "PUT").length,
      DELETE: commands.filter(c => c.method === "DELETE").length,
    },
    byRole: {
      admin: commands.filter(c => c.role === "admin").length,
      player: commands.filter(c => c.role === "player").length,
      parent: commands.filter(c => c.role === "parent").length,
      any: commands.filter(c => c.role === "any").length,
    },
  };
}
