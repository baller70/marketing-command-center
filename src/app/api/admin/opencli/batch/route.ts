import { NextRequest, NextResponse } from "next/server";
import { getCommandById } from "@/lib/opencli-registry";
import { simulateAuth, resolveApiUrl } from "@/lib/auth-simulator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { commands: cmds } = await req.json();
    if (!Array.isArray(cmds) || cmds.length === 0) {
      return NextResponse.json({ error: "commands array required" }, { status: 400 });
    }
    if (cmds.length > 20) {
      return NextResponse.json({ error: "Max 20 commands per batch" }, { status: 400 });
    }

    const results = await Promise.all(
      cmds.map(async (item: { commandId: string; params?: Record<string, unknown> }) => {
        const cmd = getCommandById(item.commandId);
        if (!cmd) return { commandId: item.commandId, status: "error", error: "Unknown command" };

        const params = item.params ?? {};
        const auth = simulateAuth(cmd.role, params);
        const resolvedUrl = resolveApiUrl(cmd.apiRoute, params);
        const internalUrl = `http://localhost:3012${resolvedUrl}`;

        const fetchHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "X-OpenCLI": "true",
        };
        if (auth.cookieHeader) fetchHeaders["Cookie"] = auth.cookieHeader;

        const fetchOptions: RequestInit = {
          method: cmd.method,
          headers: fetchHeaders,
        };
        if (cmd.method !== "GET" && cmd.method !== "DELETE") {
          fetchOptions.body = JSON.stringify(params.body ?? params);
        }

        try {
          const startMs = Date.now();
          const res = await fetch(internalUrl, fetchOptions);
          const elapsedMs = Date.now() - startMs;
          const contentType = res.headers.get("content-type") || "";
          let data: unknown;
          if (contentType.includes("application/json")) {
            data = await res.json();
          } else {
            data = { text: await res.text() };
          }
          return { commandId: cmd.id, status: res.ok ? "success" : "error", httpStatus: res.status, data, elapsedMs };
        } catch (err) {
          return { commandId: cmd.id, status: "error", error: err instanceof Error ? err.message : "fetch failed" };
        }
      })
    );

    return NextResponse.json({ results, total: results.length, succeeded: results.filter(r => r.status === "success").length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "batch failed" }, { status: 500 });
  }
}
