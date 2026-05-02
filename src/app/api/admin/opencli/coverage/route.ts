import { NextResponse } from "next/server";
import { commands, EXCLUDED_ROUTES } from "@/lib/opencli-registry";
import { execFileSync } from "child_process";
import path from "path";

export async function GET() {
  try {
    const appDir = path.resolve(process.cwd(), "src/app/api");

    let diskEndpoints: string[] = [];
    try {
      const files = execFileSync("find", [appDir, "-name", "route.ts"], {
        encoding: "utf-8",
        timeout: 10000,
      }).trim().split("\n").filter(Boolean).sort();

      for (const f of files) {
        const route = f.replace(appDir, "/api").replace(/\/route\.ts$/, "");
        try {
          const content = execFileSync("grep", ["-oE", "export (async )?function (GET|POST|PUT|PATCH|DELETE)", f], {
            encoding: "utf-8",
            timeout: 3000,
          });
          const methods = [...new Set(
            content.split("\n").filter(Boolean).map(l => {
              const m = l.match(/(GET|POST|PUT|PATCH|DELETE)/);
              return m ? m[1] : null;
            }).filter(Boolean) as string[]
          )];
          for (const method of methods) {
            diskEndpoints.push(`${method} ${route}`);
          }
        } catch {
          diskEndpoints.push(`GET ${route}`);
        }
      }
    } catch {
      diskEndpoints = [];
    }

    const registryEndpoints = new Set(commands.map(c => `${c.method} ${c.apiRoute}`));
    const registryRoutes = new Set(commands.map(c => c.apiRoute));
    const excludedSet = new Set(EXCLUDED_ROUTES as readonly string[]);

    const coveredEndpoints: string[] = [];
    const uncoveredEndpoints: string[] = [];
    const excludedEndpoints: string[] = [];

    for (const ep of diskEndpoints) {
      const route = ep.split(" ")[1];
      if (excludedSet.has(route) || route.includes("/admin/opencli/")) {
        excludedEndpoints.push(ep);
      } else if (registryEndpoints.has(ep)) {
        coveredEndpoints.push(ep);
      } else {
        uncoveredEndpoints.push(ep);
      }
    }

    const commandableEndpoints = diskEndpoints.length - excludedEndpoints.length;
    const coveragePercent = commandableEndpoints > 0
      ? Math.round((coveredEndpoints.length / commandableEndpoints) * 1000) / 10
      : 0;

    const diskRoutes = [...new Set(diskEndpoints.map(e => e.split(" ")[1]))];
    const commandableRoutes = diskRoutes.filter(r => !excludedSet.has(r) && !r.includes("/admin/opencli/"));

    return NextResponse.json({
      coverage: `${coveragePercent}%`,
      summary: {
        totalDiskEndpoints: diskEndpoints.length,
        coveredEndpoints: coveredEndpoints.length,
        uncoveredEndpoints: uncoveredEndpoints.length,
        excludedEndpoints: excludedEndpoints.length,
        commandableEndpoints,
        totalDiskRoutes: diskRoutes.length,
        commandableRoutes: commandableRoutes.length,
        coveredRoutes: registryRoutes.size,
      },
      byMethod: {
        GET: { covered: coveredEndpoints.filter(e => e.startsWith("GET")).length, uncovered: uncoveredEndpoints.filter(e => e.startsWith("GET")).length },
        POST: { covered: coveredEndpoints.filter(e => e.startsWith("POST")).length, uncovered: uncoveredEndpoints.filter(e => e.startsWith("POST")).length },
        PATCH: { covered: coveredEndpoints.filter(e => e.startsWith("PATCH")).length, uncovered: uncoveredEndpoints.filter(e => e.startsWith("PATCH")).length },
        DELETE: { covered: coveredEndpoints.filter(e => e.startsWith("DELETE")).length, uncovered: uncoveredEndpoints.filter(e => e.startsWith("DELETE")).length },
        PUT: { covered: coveredEndpoints.filter(e => e.startsWith("PUT")).length, uncovered: uncoveredEndpoints.filter(e => e.startsWith("PUT")).length },
      },
      uncovered: uncoveredEndpoints,
      registryCommandCount: commands.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Coverage scan failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
