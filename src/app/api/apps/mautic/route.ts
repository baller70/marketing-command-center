import { NextResponse } from "next/server"

const MAUTIC_URL = process.env.MAUTIC_URL || "http://localhost:8088"

export async function GET() {
  try {
    const check = await fetch(MAUTIC_URL, { cache: "no-store", redirect: "manual" })
    const isUp = check.status < 500

    return NextResponse.json({
      online: isUp,
      message: isUp ? "Mautic is running. Open the full dashboard to manage campaigns and contacts." : "Mautic is offline.",
      contacts: null,
      emails: null,
      campaigns: null,
      localUrl: MAUTIC_URL,
      remoteUrl: "https://mautic.89-167-33-236.sslip.io",
    })
  } catch {
    return NextResponse.json({ online: false, contacts: null, emails: null, campaigns: null, message: "Cannot reach Mautic" })
  }
}
