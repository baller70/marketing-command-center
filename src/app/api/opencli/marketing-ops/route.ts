import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const INTERNAL_BASE = process.env.INTERNAL_BASE_URL || "http://localhost:3012";

async function proxyGet(endpoint: string, searchParams?: URLSearchParams): Promise<any> {
  const url = searchParams ? `${INTERNAL_BASE}${endpoint}?${searchParams}` : `${INTERNAL_BASE}${endpoint}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${endpoint}: ${res.status}`);
  return res.json();
}

async function proxyPost(endpoint: string, body?: any): Promise<any> {
  const res = await fetch(`${INTERNAL_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`${endpoint}: ${res.status}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case "list-leads": {
        const sp = new URLSearchParams();
        if (params.limit) sp.set("limit", String(params.limit));
        if (params.status) sp.set("status", params.status);
        if (params.brand) sp.set("brand", params.brand);
        const data = await proxyGet("/api/leads", sp);
        return NextResponse.json({ ok: true, data });
      }
      case "list-campaigns": {
        const sp = new URLSearchParams();
        if (params.limit) sp.set("limit", String(params.limit));
        if (params.brand) sp.set("brand", params.brand);
        const data = await proxyGet("/api/campaign", sp);
        return NextResponse.json({ ok: true, data });
      }
      case "list-contacts": {
        const sp = new URLSearchParams();
        if (params.limit) sp.set("limit", String(params.limit));
        if (params.search) sp.set("search", params.search);
        const data = await proxyGet("/api/contacts", sp);
        return NextResponse.json({ ok: true, data });
      }
      case "list-inboxes": {
        const data = await proxyGet("/api/inboxes");
        return NextResponse.json({ ok: true, data });
      }
      case "list-funnels": {
        const data = await proxyGet("/api/funnel");
        return NextResponse.json({ ok: true, data });
      }
      case "list-automations": {
        const data = await proxyGet("/api/automation");
        return NextResponse.json({ ok: true, data });
      }
      case "gmail-status": {
        const data = await proxyGet("/api/gmail");
        return NextResponse.json({ ok: true, data });
      }
      case "analytics-overview": {
        const data = await proxyGet("/api/analytics");
        return NextResponse.json({ ok: true, data });
      }
      case "email-collectors": {
        const data = await proxyGet("/api/email-collector");
        return NextResponse.json({ ok: true, data });
      }
      case "email-filters": {
        const data = await proxyGet("/api/email-filter");
        return NextResponse.json({ ok: true, data });
      }
      case "cron-status": {
        const data = await proxyGet("/api/cron");
        return NextResponse.json({ ok: true, data });
      }
      case "file-list": {
        const data = await proxyGet("/api/files");
        return NextResponse.json({ ok: true, data });
      }
      case "social-brands": {
        const data = await proxyGet("/api/social-post");
        return NextResponse.json({ ok: true, data });
      }
      case "social-post-branded": {
        const data = await proxyPost("/api/social-post", params);
        return NextResponse.json({ ok: true, data });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Marketing ops failed" }, { status: 500 });
  }
}
