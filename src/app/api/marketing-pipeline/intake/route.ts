import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 10000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source } = body;

    if (source === "postiz") {
      return handlePostizIntake();
    }

    if (source === "contenthub") {
      return handleContentHubIntake();
    }

    return handleSingleItem(body);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[intake] error:", msg);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function handleSingleItem(body: Record<string, unknown>) {
  const { title, brand, source, sourceUrl, contentPreview, contentType } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ success: false, error: "title is required" }, { status: 400 });
  }
  if (!brand || typeof brand !== "string" || !brand.trim()) {
    return NextResponse.json({ success: false, error: "brand is required" }, { status: 400 });
  }

  const safeTitle = String(title).trim().substring(0, MAX_TITLE_LENGTH);
  const safeBrand = String(brand).trim();

  if (sourceUrl && typeof sourceUrl === "string") {
    const existing = await prisma.marketingItem.findFirst({
      where: { sourceUrl, status: { not: "completed" } },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "Duplicate: item with this sourceUrl already in pipeline", existingId: existing.id }, { status: 409 });
    }
  }

  const item = await prisma.marketingItem.create({
    data: {
      title: safeTitle,
      brand: safeBrand,
      source: typeof source === "string" ? source : "manual",
      sourceUrl: typeof sourceUrl === "string" ? sourceUrl.substring(0, 2000) : null,
      contentPreview: typeof contentPreview === "string" ? contentPreview.substring(0, MAX_CONTENT_LENGTH) : null,
      contentType: typeof contentType === "string" ? contentType : "social",
      currentStage: 1,
      status: "active",
      priorityScore: 50,
    },
  });

  await prisma.marketingPipelineLog.create({
    data: {
      itemId: item.id,
      stage: 1,
      stageName: "Intake",
      action: "created",
      details: `Ingested from ${source || "manual"} for brand ${safeBrand}`,
    },
  });

  return NextResponse.json({ success: true, item, source: source || "manual" });
}

async function handlePostizIntake() {
  const postizUrl = process.env.POSTIZ_URL || "https://postiz.89-167-33-236.sslip.io";
  let created = 0;
  let skipped = 0;

  try {
    const res = await fetch(`${postizUrl}/api/posts?status=published&limit=20`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Postiz returned ${res.status}`, source: "postiz" });
    }

    const data = await res.json();
    const posts = Array.isArray(data) ? data : data?.posts || [];

    for (const post of posts) {
      const sourceUrl = post.url || post.id || `postiz:${post.id}`;
      const existing = await prisma.marketingItem.findFirst({
        where: { sourceUrl, source: "postiz" },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const brand = detectBrand(post.content || post.title || "");

      const newItem = await prisma.marketingItem.create({
        data: {
          title: (post.title || post.content?.substring(0, 80) || "Postiz Post").substring(0, MAX_TITLE_LENGTH),
          brand,
          source: "postiz",
          sourceUrl,
          contentPreview: typeof post.content === "string" ? post.content.substring(0, MAX_CONTENT_LENGTH) : (post.description || null),
          contentType: "social",
          currentStage: 1,
          status: "active",
          priorityScore: 50,
        },
      });

      await prisma.marketingPipelineLog.create({
        data: {
          itemId: newItem.id,
          stage: 1,
          stageName: "Intake",
          action: "created",
          details: `Auto-ingested from Postiz: ${(post.title || "untitled").substring(0, 100)}`,
        },
      });
      created++;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Postiz unreachable";
    console.warn("[intake/postiz]", msg);
  }

  return NextResponse.json({ success: true, source: "postiz", created, skipped });
}

async function handleContentHubIntake() {
  const contenthubUrl = process.env.CONTENTHUB_URL || "https://contenthub.89-167-33-236.sslip.io";
  let created = 0;
  let skipped = 0;

  try {
    const res = await fetch(`${contenthubUrl}/api/content?status=published&limit=20`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `ContentHub returned ${res.status}`, source: "contenthub" });
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : data?.content || data?.items || [];

    for (const contentItem of items) {
      const sourceUrl = `contenthub:${contentItem.id}`;
      const existing = await prisma.marketingItem.findFirst({
        where: { sourceUrl, source: "contenthub" },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const newItem = await prisma.marketingItem.create({
        data: {
          title: (contentItem.title || "ContentHub Item").substring(0, MAX_TITLE_LENGTH),
          brand: typeof contentItem.brand === "string" ? contentItem.brand : detectBrand(contentItem.title || ""),
          source: "contenthub",
          sourceUrl,
          contentPreview: typeof contentItem.content === "string" ? contentItem.content.substring(0, MAX_CONTENT_LENGTH) : (contentItem.description || null),
          contentType: typeof contentItem.type === "string" ? contentItem.type : "social",
          currentStage: 1,
          status: "active",
          priorityScore: 55,
        },
      });
      created++;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "ContentHub unreachable";
    console.warn("[intake/contenthub]", msg);
  }

  return NextResponse.json({ success: true, source: "contenthub", created, skipped });
}

function detectBrand(text: string): string {
  const lower = (typeof text === "string" ? text : "").toLowerCase();
  if (lower.includes("basketball factory") || lower.includes("tbf")) return "TBF";
  if (lower.includes("rise as one") || lower.includes("ra1") || lower.includes("aau")) return "RA1";
  if (lower.includes("house of sports") || lower.includes("hos")) return "HoS";
  if (lower.includes("shotiq") || lower.includes("shot iq")) return "ShotIQ";
  if (lower.includes("bookmark") || lower.includes("bookmarkai")) return "Bookmark";
  if (lower.includes("kevin houston") || lower.includes("kevin")) return "Kevin";
  return "TBF";
}
