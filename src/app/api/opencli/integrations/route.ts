import { NextResponse } from "next/server";
import { postiz } from "@/lib/integrations/postiz";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channels = await postiz.getChannels();
    return NextResponse.json({ ok: true, channels });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch integrations" },
      { status: 502 }
    );
  }
}
