import { NextResponse } from "next/server"
import { postiz } from "@/lib/integrations/postiz"

const BRAND_SOCIAL_PROFILES: Record<
  string,
  { name: string; platforms: Record<string, string> }
> = {
  tbf: {
    name: "The Basketball Factory",
    platforms: {
      instagram: "thebasketballfactorynj",
      tiktok: "thebasketballfactorynj",
      facebook: "thebasketballfactorynj",
      twitter: "tbfnj",
      youtube: "@thebasketballfactorynj",
    },
  },
  ra1: {
    name: "Rise As One AAU",
    platforms: {
      instagram: "riseasone_aau",
      tiktok: "riseasone_aau",
      facebook: "riseasoneaau",
      twitter: "riseasone_aau",
    },
  },
  hos: {
    name: "House of Sports",
    platforms: { instagram: "houseofsportsnj", facebook: "houseofsportsnj" },
  },
  shotiq: {
    name: "ShotIQ",
    platforms: { instagram: "shotiqai", tiktok: "shotiqai", twitter: "shotiqai" },
  },
  kevin: {
    name: "Kevin Houston",
    platforms: {
      instagram: "kevinhouston_hoops",
      tiktok: "kevinhouston_hoops",
      twitter: "kevinhouston",
      linkedin: "kevinhouston",
    },
  },
  bookmarkai: {
    name: "BookmarkAI Hub",
    platforms: { twitter: "bookmarkaihub" },
  },
}

function generateAnnouncementText(
  brand: string,
  contentType: string,
  headline: string,
  description?: string
): string {
  const brandName = BRAND_SOCIAL_PROFILES[brand]?.name || brand.toUpperCase()
  const desc = description ? `\n\n${description}` : ""

  const templates: Record<string, string[]> = {
    newsletter: [
      `NEW ${brandName} Newsletter just dropped! ${headline}${desc}\n\nLink in bio!`,
      `Fresh update from ${brandName}! ${headline}${desc}\n\n#basketball #training`,
    ],
    announcement: [
      `ANNOUNCEMENT from ${brandName}!\n\n${headline}${desc}\n\nLink in bio for details!`,
      `Big news! ${headline}${desc}\n\n#${brand.toLowerCase()} #basketball`,
    ],
    "tryout-promo": [
      `TRYOUTS COMING! ${headline}${desc}\n\nDon't miss your chance! Link in bio\n\n#basketball #tryouts #aau`,
      `Ready to ball? ${brandName} tryouts are here!\n\n${headline}${desc}\n\n#hoops #basketball`,
    ],
    "player-spotlight": [
      `PLAYER SPOTLIGHT\n\n${headline}${desc}\n\nProud of our athletes!\n\n#playerofthemonth #basketball`,
      `Shoutout to this baller!\n\n${headline}${desc}\n\n#${brand.toLowerCase()} #basketballplayer`,
    ],
    "training-tips": [
      `TRAINING TIP\n\n${headline}${desc}\n\nLevel up your game!\n\n#basketballtips #training`,
      `Get better every day!\n\n${headline}${desc}\n\n#workout #basketball #skills`,
    ],
    "event-reminder": [
      `REMINDER: ${headline}${desc}\n\nSee you there!`,
      `Don't forget! ${headline}${desc}\n\n#${brand.toLowerCase()}`,
    ],
    "game-results": [
      `GAME RECAP!\n\n${headline}${desc}\n\nGreat effort team!\n\n#gameday #basketball`,
      `Final score is in! ${headline}${desc}\n\n#hoops #${brand.toLowerCase()}`,
    ],
    default: [`${brandName} Update!\n\n${headline}${desc}\n\n#basketball #${brand.toLowerCase()}`],
  }

  const pool = templates[contentType] || templates.default
  return pool[Math.floor(Math.random() * pool.length)]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get("brand")

  if (brand) {
    return NextResponse.json({
      success: true,
      brand,
      profiles: BRAND_SOCIAL_PROFILES[brand] || null,
    })
  }

  return NextResponse.json({ success: true, brands: BRAND_SOCIAL_PROFILES })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { brand, contentType, headline, description, mediaUrl, scheduledTime, platforms, customText } = body

    if (!brand || !headline) {
      return NextResponse.json({ success: false, error: "Brand and headline required" }, { status: 400 })
    }

    const announcementText = customText || generateAnnouncementText(brand, contentType || "default", headline, description)

    const brandProfiles = BRAND_SOCIAL_PROFILES[brand]
    const targetPlatforms = platforms || Object.keys(brandProfiles?.platforms || {})

    const result = await postiz.schedulePost({
      content: announcementText,
      platforms: targetPlatforms,
      scheduledDate: scheduledTime,
      mediaUrls: mediaUrl ? [mediaUrl] : [],
    })

    return NextResponse.json({
      success: true,
      announcement: {
        brand,
        contentType,
        text: announcementText,
        platforms: targetPlatforms,
        scheduledTime: scheduledTime || "queued",
      },
      postizResponse: result,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[social-post] Failed:", msg, err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
