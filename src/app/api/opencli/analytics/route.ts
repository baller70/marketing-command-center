import { NextRequest, NextResponse } from "next/server";
import { umami } from "@/lib/integrations/umami";
import { formbricks } from "@/lib/integrations/formbricks";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case "umami-websites": {
        const data = await umami.listWebsites();
        return NextResponse.json({ ok: true, data });
      }
      case "umami-stats": {
        if (!params.websiteId) return NextResponse.json({ error: "websiteId required" }, { status: 400 });
        const now = Date.now();
        const startAt = params.startAt || now - 30 * 24 * 60 * 60 * 1000;
        const endAt = params.endAt || now;
        const data = await umami.getWebsiteStats(params.websiteId, startAt, endAt);
        return NextResponse.json({ ok: true, data });
      }
      case "umami-pageviews": {
        if (!params.websiteId) return NextResponse.json({ error: "websiteId required" }, { status: 400 });
        const now = Date.now();
        const startAt = params.startAt || now - 30 * 24 * 60 * 60 * 1000;
        const endAt = params.endAt || now;
        const data = await umami.getPageviews(params.websiteId, startAt, endAt, params.unit || "day");
        return NextResponse.json({ ok: true, data });
      }
      case "umami-top-pages": {
        if (!params.websiteId) return NextResponse.json({ error: "websiteId required" }, { status: 400 });
        const now = Date.now();
        const startAt = params.startAt || now - 30 * 24 * 60 * 60 * 1000;
        const endAt = params.endAt || now;
        const data = await umami.getTopPages(params.websiteId, startAt, endAt);
        return NextResponse.json({ ok: true, data });
      }
      case "umami-referrers": {
        if (!params.websiteId) return NextResponse.json({ error: "websiteId required" }, { status: 400 });
        const now = Date.now();
        const startAt = params.startAt || now - 30 * 24 * 60 * 60 * 1000;
        const endAt = params.endAt || now;
        const data = await umami.getReferrers(params.websiteId, startAt, endAt);
        return NextResponse.json({ ok: true, data });
      }
      case "umami-events": {
        if (!params.websiteId) return NextResponse.json({ error: "websiteId required" }, { status: 400 });
        const now = Date.now();
        const startAt = params.startAt || now - 7 * 24 * 60 * 60 * 1000;
        const endAt = params.endAt || now;
        const data = await umami.getEvents(params.websiteId, startAt, endAt);
        return NextResponse.json({ ok: true, data });
      }
      case "formbricks-surveys": {
        if (!params.environmentId) return NextResponse.json({ error: "environmentId required" }, { status: 400 });
        const data = await formbricks.listSurveys(params.environmentId);
        return NextResponse.json({ ok: true, data });
      }
      case "formbricks-responses": {
        if (!params.surveyId) return NextResponse.json({ error: "surveyId required" }, { status: 400 });
        const data = await formbricks.getSurveyResponses(params.surveyId, params.limit || 50);
        return NextResponse.json({ ok: true, data });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Analytics query failed" }, { status: 500 });
  }
}
