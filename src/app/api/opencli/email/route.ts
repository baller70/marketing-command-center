import { NextRequest, NextResponse } from "next/server";
import { mautic } from "@/lib/integrations/mautic";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case "list-campaigns": {
        const data = await mautic.listCampaigns(params.limit || 30);
        return NextResponse.json({ ok: true, data });
      }
      case "list-emails": {
        const data = await mautic.listEmails(params.limit || 30);
        return NextResponse.json({ ok: true, data });
      }
      case "list-segments": {
        const data = await mautic.listSegments(params.limit || 30);
        return NextResponse.json({ ok: true, data });
      }
      case "list-contacts": {
        const data = await mautic.listContacts(params.search, params.limit || 30);
        return NextResponse.json({ ok: true, data });
      }
      case "email-stats": {
        if (!params.emailId) return NextResponse.json({ error: "emailId required" }, { status: 400 });
        const data = await mautic.getEmailStats(params.emailId);
        return NextResponse.json({ ok: true, data });
      }
      case "aggregate-stats": {
        const data = await mautic.getAggregateEmailStats();
        return NextResponse.json({ ok: true, data });
      }
      case "campaign-stats": {
        if (!params.campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });
        const data = await mautic.getCampaignStats(params.campaignId);
        return NextResponse.json({ ok: true, data });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email operation failed" },
      { status: 500 }
    );
  }
}
