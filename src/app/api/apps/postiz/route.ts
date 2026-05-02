import { NextResponse } from "next/server"

const POSTIZ_URL = process.env.POSTIZ_BACKEND_URL || "http://localhost:8085"
const POSTIZ_TOKEN = process.env.POSTIZ_API_TOKEN || ""

async function postizFetch(path: string) {
  const res = await fetch(`${POSTIZ_URL}${path}`, {
    headers: {
      Cookie: `auth=${POSTIZ_TOKEN}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

export async function GET() {
  try {
    const now = new Date()
    const monthsAgo = new Date(now.getTime() - 120 * 86400000)
    const startDate = monthsAgo.toISOString()
    const endDate = now.toISOString()

    const postsRes = await postizFetch(`/api/posts?startDate=${startDate}&endDate=${endDate}`)
    const rawPosts = postsRes?.p || []

    const posts = Array.isArray(rawPosts) ? rawPosts.slice(0, 20).map((p: Record<string, unknown>) => ({
      id: p.i as string || "",
      content: p.c as string || "",
      state: p.s as string || "draft",
      publishDate: p.d as string || null,
      url: p.u as string || null,
    })) : []

    const stateCount: Record<string, number> = {}
    for (const p of rawPosts) {
      const s = (p as Record<string, unknown>).s as string || "unknown"
      stateCount[s] = (stateCount[s] || 0) + 1
    }

    return NextResponse.json({
      online: true,
      posts,
      totalPosts: rawPosts.length,
      stats: stateCount,
    })
  } catch {
    return NextResponse.json({ online: false, posts: [], totalPosts: 0, stats: {} })
  }
}
