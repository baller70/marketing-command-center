export const MARKETING_STAGES = [
  { num: 1, name: "Intake", key: "intake" },
  { num: 2, name: "Intelligence", key: "intelligence" },
  { num: 3, name: "Brief", key: "brief" },
  { num: 4, name: "Content", key: "content" },
  { num: 5, name: "Assembly", key: "assembly" },
  { num: 6, name: "Quality Gate", key: "quality" },
  { num: 7, name: "Review", key: "review" },
  { num: 8, name: "Deploy", key: "deploy" },
  { num: 9, name: "Send", key: "send" },
  { num: 10, name: "Monitor", key: "monitor" },
  { num: 11, name: "Analyze", key: "analyze" },
  { num: 12, name: "Archive", key: "archive" },
] as const;

export type StageName = (typeof MARKETING_STAGES)[number]["name"];
export type StageKey = (typeof MARKETING_STAGES)[number]["key"];

export function getStageName(num: number): string {
  return MARKETING_STAGES.find(s => s.num === num)?.name ?? `Stage ${num}`;
}

export function getStageKey(num: number): string {
  return MARKETING_STAGES.find(s => s.num === num)?.key ?? "unknown";
}
