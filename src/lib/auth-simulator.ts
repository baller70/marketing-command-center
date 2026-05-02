import type { CommandRole } from "./opencli-registry";

export interface SimulatedAuth {
  userId: number;
  role: CommandRole;
  sessionId: string | null;
  cookieHeader: string;
}

export function simulateAuth(
  targetRole: CommandRole,
  _params: Record<string, unknown>,
): SimulatedAuth {
  return {
    userId: 0,
    role: targetRole,
    sessionId: null,
    cookieHeader: "",
  };
}

export function resolveApiUrl(apiRoute: string, params: Record<string, unknown>): string {
  let url = apiRoute;

  const queryParams: string[] = [];
  const skipKeys = new Set(["body", "dryRun", "_confirmed", "agentKey"]);
  for (const [key, value] of Object.entries(params)) {
    if (skipKeys.has(key)) continue;
    if (value !== undefined && value !== null && value !== "") {
      queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  if (params.dryRun) queryParams.push("dryRun=true");
  if (queryParams.length > 0) url += `?${queryParams.join("&")}`;

  return url;
}
