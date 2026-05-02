import { NextRequest, NextResponse } from "next/server";
import { getCommandById } from "@/lib/opencli-registry";
import { simulateAuth, resolveApiUrl } from "@/lib/auth-simulator";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit("opencli-execute", "global", 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(rateLimitResponse(rl.retryAfterMs), { status: 429 });
    }

    const body = await req.json();
    const { commandId, params = {}, dryRun = false, confirmed = false } = body;

    const cmd = getCommandById(commandId);
    if (!cmd) {
      return NextResponse.json({ error: `Unknown command: ${commandId}` }, { status: 404 });
    }

    if (cmd.requiresConfirmation && !confirmed && !dryRun) {
      return NextResponse.json({
        status: "confirmation_required",
        message: `This ${cmd.kind} operation requires confirmation. Send confirmed: true to proceed.`,
        command: cmd,
      });
    }

    if (dryRun) {
      return NextResponse.json({
        status: "dry_run",
        message: `Would execute ${cmd.method} ${cmd.apiRoute}`,
        command: { id: cmd.id, method: cmd.method, apiRoute: cmd.apiRoute, kind: cmd.kind },
        resolvedUrl: resolveApiUrl(cmd.apiRoute, params),
      });
    }

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

    return NextResponse.json({
      status: res.ok ? "success" : "error",
      httpStatus: res.status,
      data,
      meta: {
        commandId: cmd.id,
        method: cmd.method,
        resolvedUrl,
        elapsedMs,
        role: cmd.role,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "execute failed" },
      { status: 500 }
    );
  }
}
