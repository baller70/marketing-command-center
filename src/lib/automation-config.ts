export const AUTOMATION_MASTER_KEY = "automation-master"

export const AUTOMATION_FEATURE_ROWS = [
  { camel: "lifecycle", dbSuffix: "lifecycle", label: "Campaign Lifecycle" },
  { camel: "briefs", dbSuffix: "briefs", label: "Brief Generation" },
  { camel: "intelligence", dbSuffix: "intelligence", label: "Intelligence Gathering" },
  { camel: "rssIntel", dbSuffix: "rss-intel", label: "RSS Intel Feed" },
  { camel: "seasonal", dbSuffix: "seasonal", label: "Seasonal Campaigns" },
  { camel: "campaigns", dbSuffix: "campaigns", label: "Auto Campaigns" },
  { camel: "contentAssets", dbSuffix: "content-assets", label: "Content Assets" },
  { camel: "assembly", dbSuffix: "assembly", label: "Assembly" },
  { camel: "qualityGate", dbSuffix: "quality-gate", label: "Quality Gate" },
  { camel: "deploy", dbSuffix: "deploy", label: "Deploy" },
  { camel: "optimize", dbSuffix: "optimize", label: "Optimize & Learn" },
  { camel: "socialPosting", dbSuffix: "social-posting", label: "Social Posting" },
  { camel: "emailMarketing", dbSuffix: "email-marketing", label: "Email Marketing" },
  { camel: "reporting", dbSuffix: "reporting", label: "Reporting" },
  { camel: "contentDistribution", dbSuffix: "content-distribution", label: "Content Distribution" },
] as const

export type AutomationFeatureCamel = (typeof AUTOMATION_FEATURE_ROWS)[number]["camel"]
export type AutomationFeaturesState = Record<AutomationFeatureCamel, boolean>

export function automationDbKey(dbSuffix: string): string {
  return `automation-${dbSuffix}`
}
