import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStageName } from "@/lib/pipeline-stages";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonVal(v: unknown): any { return v; }

const VALID_ACTIONS = new Set(["advance", "reject", "approve", "send", "pause", "resume", "recycle"]);
const VALID_MODES = new Set(["manual", "automatic"]);
const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 10000;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get("brand");
    const status = searchParams.get("status");
    const stageStr = searchParams.get("stage");
    const limitStr = searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitStr || "100") || 100, 1), 500);
    const stage = stageStr ? parseInt(stageStr) : null;

    const where: Record<string, unknown> = {};
    if (brand && brand !== "__all__") where.brand = brand;
    if (status) where.status = status;
    if (stage && !isNaN(stage) && stage >= 1 && stage <= 12) where.currentStage = stage;

    const items = await prisma.marketingItem.findMany({
      where,
      orderBy: [{ currentStage: "asc" }, { priorityScore: "desc" }, { updatedAt: "desc" }],
      take: limit,
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    const counts = await prisma.marketingItem.groupBy({
      by: ["currentStage"],
      where: { status: { in: ["active", "paused"] } },
      _count: true,
    });

    const brandCounts = await prisma.marketingItem.groupBy({
      by: ["brand"],
      where: { status: { in: ["active", "paused"] } },
      _count: true,
    });

    const reviewCount = await prisma.marketingItem.count({
      where: { currentStage: 7, status: "active", pipelineMode: "manual" },
    });

    return NextResponse.json({
      success: true,
      items,
      stageCounts: Object.fromEntries(counts.map(c => [c.currentStage, c._count])),
      brandCounts: Object.fromEntries(brandCounts.map(c => [c.brand, c._count])),
      reviewCount,
      total: items.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[marketing-pipeline] GET error:", msg);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, brand, source, sourceUrl, contentPreview, contentType, priorityScore, mode } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ success: false, error: "title is required and must be a non-empty string" }, { status: 400 });
    }
    if (!brand || typeof brand !== "string" || !brand.trim()) {
      return NextResponse.json({ success: false, error: "brand is required and must be a non-empty string" }, { status: 400 });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json({ success: false, error: `title must be ${MAX_TITLE_LENGTH} characters or less` }, { status: 400 });
    }
    if (contentPreview && typeof contentPreview === "string" && contentPreview.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ success: false, error: `contentPreview must be ${MAX_CONTENT_LENGTH} characters or less` }, { status: 400 });
    }

    const safeTitle = title.trim().substring(0, MAX_TITLE_LENGTH);
    const safeBrand = String(brand).trim();
    const safePriority = typeof priorityScore === "number" ? Math.min(Math.max(Math.round(priorityScore), 0), 100) : 50;
    const safeMode = typeof mode === "string" && VALID_MODES.has(mode) ? mode : "manual";

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
        pipelineMode: safeMode,
        priorityScore: safePriority,
      },
    });

    await prisma.marketingPipelineLog.create({
      data: {
        itemId: item.id,
        stage: 1,
        stageName: "Intake",
        action: "created",
        details: `Item created (${safeMode} mode) from ${source || "manual"} for brand ${safeBrand}`,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[marketing-pipeline] POST error:", msg);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, reason, targetStage } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }
    if (!action || typeof action !== "string" || !VALID_ACTIONS.has(action)) {
      return NextResponse.json({ success: false, error: `action must be one of: ${[...VALID_ACTIONS].join(", ")}` }, { status: 400 });
    }

    const item = await prisma.marketingItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    if (action === "advance") {
      const nextStage = typeof targetStage === "number" ? targetStage : item.currentStage + 1;
      if (nextStage < 1 || nextStage > 13) {
        return NextResponse.json({ success: false, error: "Invalid target stage" }, { status: 400 });
      }
      if (nextStage > 12) {
        await prisma.marketingItem.update({
          where: { id },
          data: { status: "completed", updatedAt: new Date() },
        });
        await prisma.marketingPipelineLog.create({
          data: { itemId: id, stage: 12, stageName: "Archive", action: "completed", details: "Pipeline complete" },
        });
        return NextResponse.json({ success: true, action: "completed" });
      }

      await prisma.marketingItem.update({
        where: { id },
        data: { currentStage: nextStage, updatedAt: new Date() },
      });
      await prisma.marketingPipelineLog.create({
        data: {
          itemId: id,
          stage: nextStage,
          stageName: getStageName(nextStage),
          action: "advanced",
          details: `Advanced from stage ${item.currentStage} to ${nextStage}`,
        },
      });
      return NextResponse.json({ success: true, action: "advanced", stage: nextStage });
    }

    if (action === "reject") {
      const safeReason = typeof reason === "string" ? reason.substring(0, 1000) : "Rejected at review";
      await prisma.marketingItem.update({
        where: { id },
        data: {
          currentStage: 3,
          status: "active",
          rejectionReason: safeReason,
          updatedAt: new Date(),
        },
      });
      await prisma.marketingPipelineLog.create({
        data: {
          itemId: id,
          stage: item.currentStage,
          stageName: getStageName(item.currentStage),
          action: "rejected",
          details: safeReason,
        },
      });
      return NextResponse.json({ success: true, action: "rejected" });
    }

    if (action === "approve") {
      if (item.currentStage !== 7) {
        return NextResponse.json({ success: false, error: "Item must be at Stage 7 (Review) to approve" }, { status: 400 });
      }
      await prisma.marketingItem.update({
        where: { id },
        data: {
          currentStage: 8,
          approvedAt: new Date(),
          approvedBy: "kevin",
          updatedAt: new Date(),
        },
      });
      await prisma.marketingPipelineLog.create({
        data: { itemId: id, stage: 8, stageName: "Deploy", action: "approved", details: "Approved by Kevin — advancing to Deploy" },
      });
      return NextResponse.json({ success: true, action: "approved" });
    }

    // SEND: Kevin reviews draft at Stage 7 and clicks Send.
    // Marks the item as sent internally. No external APIs called.
    // The auto-advance engine will carry it through 8→9→10→...→12.
    if (action === "send") {
      if (item.currentStage !== 7) {
        return NextResponse.json({ success: false, error: "Item must be at Stage 7 (Review) to send" }, { status: 400 });
      }

      const emailDraft = item.emailDraft as Record<string, unknown> | null;

      await prisma.marketingItem.update({
        where: { id },
        data: {
          currentStage: 9,
          approvedAt: new Date(),
          approvedBy: "kevin",
          deploymentData: jsonVal({
            deployed: true,
            sent: true,
            method: "manual-send",
            platform: (emailDraft?.platform as string) || "acumbamail",
            listId: (emailDraft?.recipientListId as string) || null,
            subject: (emailDraft?.subject as string) || item.title,
            deployedAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
          }),
          updatedAt: new Date(),
        },
      });

      await prisma.marketingPipelineLog.create({
        data: { itemId: id, stage: 8, stageName: "Deploy", action: "manual", details: "Kevin approved — campaign staged" },
      });
      await prisma.marketingPipelineLog.create({
        data: { itemId: id, stage: 9, stageName: "Send", action: "manual", details: "Kevin sent — campaign queued for delivery" },
      });

      return NextResponse.json({ success: true, action: "sent" });
    }

    if (action === "pause") {
      await prisma.marketingItem.update({
        where: { id },
        data: { status: "paused", updatedAt: new Date() },
      });
      return NextResponse.json({ success: true, action: "paused" });
    }

    if (action === "resume") {
      await prisma.marketingItem.update({
        where: { id },
        data: { status: "active", updatedAt: new Date() },
      });
      return NextResponse.json({ success: true, action: "resumed" });
    }

    if (action === "recycle") {
      if (item.status !== "completed") {
        return NextResponse.json({ success: false, error: "Only completed items can be recycled" }, { status: 400 });
      }
      const recycled = await prisma.marketingItem.create({
        data: {
          title: `[Recycled] ${item.title}`.substring(0, MAX_TITLE_LENGTH),
          brand: typeof body.targetBrand === "string" ? body.targetBrand : item.brand,
          source: "recycled",
          sourceUrl: item.sourceUrl,
          contentPreview: item.contentPreview,
          contentType: item.contentType,
          currentStage: 1,
          status: "active",
          pipelineMode: item.pipelineMode,
          priorityScore: Math.min(item.priorityScore + 10, 100),
          recycledFromId: item.id,
          emailDraft: jsonVal(item.emailDraft),
          metadata: jsonVal({ originalId: item.id, recycleReason: typeof reason === "string" ? reason.substring(0, 500) : "High performer" }),
        },
      });
      await prisma.marketingPipelineLog.create({
        data: {
          itemId: recycled.id,
          stage: 1,
          stageName: "Intake",
          action: "recycled",
          details: `Recycled from item ${item.id} (${item.title.substring(0, 100)})`,
        },
      });
      return NextResponse.json({ success: true, action: "recycled", newItem: recycled });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[marketing-pipeline] PATCH error:", msg);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
