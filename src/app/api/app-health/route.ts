import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const port = req.nextUrl.searchParams.get("port")
  if (!port || isNaN(Number(port))) {
    return NextResponse.json({ online: false, error: "Missing port param" }, { status: 400 })
  }

  const allowed = [8083, 8084, 8085, 8086, 8088, 8095, 9000]
  if (!allowed.includes(Number(port))) {
    return NextResponse.json({ online: false, error: "Port not allowed" }, { status: 403 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`http://localhost:${port}/`, {
      signal: controller.signal,
      redirect: "manual",
    })
    clearTimeout(timeout)
    return NextResponse.json({ online: true, status: res.status })
  } catch {
    return NextResponse.json({ online: false })
  }
}
