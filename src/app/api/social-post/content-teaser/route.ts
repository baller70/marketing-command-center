import { NextRequest, NextResponse } from "next/server"
import { postiz } from "@/lib/integrations/postiz"

export const dynamic = "force-dynamic"

interface ContentTeaserEvent {
  source: string
  event: string
  brand: string
  brandName: string
  contentType: string
  title: string
  url?: string
  postsScheduled: number
  timestamp: string
}

const recentTeasers: ContentTeaserEvent[] = []
const MAX_HISTORY = 50

/**
 * POST /api/social-post/content-teaser — Receive notification from Content Hub
 * when social teaser posts are auto-scheduled for a blog or newsletter.
 *
 * Marketing division tracks these for campaign alignment and performance monitoring.
 */
export async function POST(req: NextRequest) {
  try {
    const body: ContentTeaserEvent = await req.json()

    recentTeasers.unshift(body)
    if (recentTeasers.length > MAX_HISTORY) recentTeasers.pop()

    console.log(
      `[social-teaser] ${body.brandName} ${body.contentType} promoted — ${body.postsScheduled} posts scheduled for "${body.title}"`
    )

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * GET /api/social-post/content-teaser — View recent auto-generated social teasers
 * and current Postiz scheduled posts for marketing oversight.
 */
export async function GET() {
  let scheduledPosts: any = null
  try {
    scheduledPosts = await postiz.listPosts({ status: "scheduled" })
  } catch {}

  return NextResponse.json({
    recentTeasers,
    scheduledPostsInPostiz: scheduledPosts,
  })
}
