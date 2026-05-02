import { NextRequest, NextResponse } from "next/server";
import { queryLog } from "@/lib/social-post-log";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get("brand") || undefined;
    const days = searchParams.get("days") ? parseInt(searchParams.get("days")!) : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

    const entries = await queryLog({ brand, days, limit });
    return NextResponse.json({ ok: true, entries, count: entries.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to read audit log" }, { status: 500 });
  }
}
