import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const MARKETING_APPS = [
  { id: "postiz", name: "Postiz", description: "Social media scheduling & publishing", port: 8085, autoLoginPath: "/auto-login" },
  { id: "mautic", name: "Mautic", description: "Marketing automation & email campaigns", port: 8088, autoLoginPath: "/auto-login" },
  { id: "formbricks", name: "Formbricks", description: "Surveys & user feedback collection", port: 8086, autoLoginPath: "/auto-login" },
  { id: "umami", name: "Umami Analytics", description: "Privacy-first web analytics", port: 8084, autoLoginPath: "/auto-login" },
  { id: "novu", name: "Novu", description: "Notification infrastructure", port: 4200, autoLoginPath: "/auto-login" },
]

async function checkApp(port: number): Promise<boolean> {
  try {
    const c = new AbortController()
    const t = setTimeout(() => c.abort(), 2000)
    const r = await fetch(`http://localhost:${port}/`, { signal: c.signal, redirect: "manual" })
    clearTimeout(t)
    return r.status < 500
  } catch {
    return false
  }
}

export async function GET() {
  const appStatuses = await Promise.all(
    MARKETING_APPS.map(async (app) => ({
      ...app,
      online: await checkApp(app.port),
      division: "marketing",
      ecosystem: "kevinclaw",
    }))
  )

  return NextResponse.json({
    division: "marketing",
    divisionLabel: "Marketing",
    agent: "Derek",
    emoji: "📣",
    ecosystem: "kevinclaw",
    apps: appStatuses,
    totalApps: appStatuses.length,
    onlineApps: appStatuses.filter((a) => a.online).length,
  })
}
