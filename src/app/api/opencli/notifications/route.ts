import { NextRequest, NextResponse } from "next/server";
import { novu } from "@/lib/integrations/novu";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case "test-notification": {
        const ok = await novu.notify("pipeline_health_warning", {
          title: params.title || "Test notification from OpenCLI",
          message: params.message || "This is a test notification sent via OpenCLI.",
        });
        return NextResponse.json({ ok, message: ok ? "Notification sent" : "Failed to send" });
      }
      case "lead-qualified": {
        const ok = await novu.notifyLeadQualified({
          email: params.email,
          brand: params.brand || "tbf",
          tier: params.tier || "standard",
          score: params.score || 50,
        });
        return NextResponse.json({ ok });
      }
      case "campaign-launched": {
        const ok = await novu.notifyCampaignLaunched({
          name: params.name,
          brand: params.brand || "tbf",
          channels: params.channels || ["email"],
        });
        return NextResponse.json({ ok });
      }
      case "social-scheduled": {
        const ok = await novu.notifySocialScheduled({
          brand: params.brand || "tbf",
          platforms: params.platforms || [],
          postCount: params.postCount || 1,
        });
        return NextResponse.json({ ok });
      }
      case "health-warning": {
        const ok = await novu.notifyHealthWarning({
          service: params.service || "unknown",
          message: params.message || "Health warning from OpenCLI",
        });
        return NextResponse.json({ ok });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Notification failed" }, { status: 500 });
  }
}
