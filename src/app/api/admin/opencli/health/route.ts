import { NextResponse } from "next/server";
import { commands, EXCLUDED_ROUTES, COMMAND_GROUPS, getCoverageStats } from "@/lib/opencli-registry";

export async function GET() {
  const stats = getCoverageStats();

  return NextResponse.json({
    status: "healthy",
    version: "1.0.0",
    registry: {
      totalCommands: stats.totalCommands,
      totalGroups: stats.totalGroups,
      mappedRoutes: stats.mappedRoutes,
      excludedRoutes: stats.excludedRoutes,
      groups: COMMAND_GROUPS,
    },
    breakdown: stats.byGroup,
    byKind: stats.byKind,
    byRole: stats.byRole,
    excludedRoutesList: [...EXCLUDED_ROUTES],
    sampleCommands: commands.slice(0, 5).map(c => ({ id: c.id, label: c.label, route: c.apiRoute })),
    timestamp: new Date().toISOString(),
  });
}
