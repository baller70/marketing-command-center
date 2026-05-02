import { NextResponse } from "next/server"

const UMAMI_URL = process.env.UMAMI_URL || "http://localhost:8084"

export async function GET() {
  try {
    const check = await fetch(`${UMAMI_URL}/api/heartbeat`, { cache: "no-store" })
    const isUp = check.ok || check.status === 200

    return NextResponse.json({
      online: isUp,
      message: isUp ? "Umami is running. Open the full dashboard to view analytics." : "Umami is offline.",
      websites: [],
      totalSites: 0,
      localUrl: UMAMI_URL,
      remoteUrl: "https://umami-dash.89-167-33-236.sslip.io",
    })
  } catch {
    return NextResponse.json({ online: false, websites: [], totalSites: 0, message: "Cannot reach Umami" })
  }
}
