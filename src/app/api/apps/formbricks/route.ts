import { NextResponse } from "next/server"

const FB_URL = "http://localhost:8086"

export async function GET() {
  try {
    const check = await fetch(FB_URL, { cache: "no-store", redirect: "manual" })
    const isUp = check.status < 500

    return NextResponse.json({
      online: isUp,
      message: isUp ? "Formbricks is running. Open the full dashboard to manage surveys." : "Formbricks is offline.",
      surveys: [],
      localUrl: FB_URL,
      remoteUrl: "https://formbricks.89-167-33-236.sslip.io",
    })
  } catch {
    return NextResponse.json({ online: false, surveys: [], message: "Cannot reach Formbricks" })
  }
}
