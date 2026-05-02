export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { novu } from "@/lib/integrations/novu";
import type { Prisma } from "@prisma/client";

const DEFAULT_SIZE: Record<string, number> = {
  blog: 1,
  newsletter: 1,
  repurposed: 4,
  graphic: 4,
  game_result: 6,
  workflow: 4,
};

async function resolveTargetSize(contentType: string, brand: string): Promise<number> {
  const t = contentType.toLowerCase().trim();
  const b = brand.trim();

  const keyBrand = `batch-size-${t}-${b}`;
  const rows = await prisma.setting.findMany({
    where: { key: { in: [`batch-size-${t}`, keyBrand] } },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<
    string,
    string
  >;

  const parse = (v?: string): number | null => {
    if (!v?.trim()) return null;
    const n = Number.parseInt(v.trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  return (
    parse(byKey[keyBrand]) ??
    parse(byKey[`batch-size-${t}`]) ??
    DEFAULT_SIZE[t] ??
    4
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = typeof body.type === "string" ? body.type.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const brand = typeof body.brand === "string" ? body.brand.trim() : "";
    const sourceId =
      typeof body.sourceId === "string" ? body.sourceId.trim() : "";
    const sourceUrl =
      typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : undefined;
    const thumbnail =
      typeof body.thumbnail === "string" ? body.thumbnail.trim() : undefined;
    const contentBody =
      typeof body.contentBody === "string" ? body.contentBody : undefined;
    const metadata =
      body.metadata && typeof body.metadata === "object"
        ? (body.metadata as Prisma.InputJsonValue)
        : undefined;

    if (!type || !title || !brand || !sourceId) {
      return NextResponse.json(
        { error: "type, title, brand, and sourceId are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.contentBuffer.findUnique({
      where: { sourceId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Duplicate sourceId", sourceId },
        { status: 409 }
      );
    }

    const targetSize = await resolveTargetSize(type, brand);

    const result = await prisma.$transaction(async (tx) => {
      let batch = await tx.contentBatch.findFirst({
        where: { contentType: type, brand, status: "filling" },
        orderBy: { createdAt: "asc" },
      });

      if (!batch) {
        batch = await tx.contentBatch.create({
          data: {
            contentType: type,
            brand,
            targetSize,
            status: "filling",
            batchSize: 0,
          },
        });
      } else if (batch.targetSize !== targetSize) {
        await tx.contentBatch.update({
          where: { id: batch.id },
          data: { targetSize },
        });
        batch = { ...batch, targetSize };
      }

      await tx.contentBuffer.create({
        data: {
          contentType: type,
          title,
          brand,
          sourceId,
          sourceUrl: sourceUrl || null,
          thumbnail: thumbnail || null,
          contentBody: contentBody ?? null,
          metadata: metadata ?? {},
          batchId: batch.id,
          status: "buffered",
        },
      });

      const count = await tx.contentBuffer.count({
        where: { batchId: batch.id },
      });

      let batchStatus = batch.status;
      if (count >= targetSize) {
        await tx.contentBatch.update({
          where: { id: batch.id },
          data: { batchSize: count, status: "ready" },
        });
        batchStatus = "ready";
      } else {
        await tx.contentBatch.update({
          where: { id: batch.id },
          data: { batchSize: count },
        });
      }

      return {
        batchId: batch.id,
        batchStatus,
        current: count,
        target: targetSize,
      };
    });

    if (result.batchStatus === "ready") {
      await novu.notify("content_feedback_ready", {
        title: `${brand} ${type} batch ready (${result.current} items)`,
        message: "Approve to send via email distribution",
        brand,
      });
    }

    return NextResponse.json({
      success: true,
      buffered: true,
      batchProgress: `${result.current}/${result.target}`,
      batchId: result.batchId,
      batchStatus: result.batchStatus,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[content-intake] POST:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const bufferRows = await prisma.contentBuffer.groupBy({
      by: ["brand", "contentType", "status"],
      _count: { _all: true },
    });

    const batches = await prisma.contentBatch.findMany({
      where: { status: { notIn: ["sent"] } },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
      },
      take: 500,
    });

    type Group = {
      brand: string;
      contentType: string;
      byStatus: Record<string, number>;
      activeBatches: Array<{
        id: string;
        status: string;
        batchSize: number;
        targetSize: number;
        createdAt: Date;
        scheduledFor: Date | null;
        sentAt: Date | null;
        mauticEmailId: number | null;
      }>;
    };

    const map = new Map<string, Group>();

    for (const row of bufferRows) {
      const key = `${row.brand}\0${row.contentType}`;
      const g = map.get(key) ?? {
        brand: row.brand,
        contentType: row.contentType,
        byStatus: {},
        activeBatches: [],
      };
      g.byStatus[row.status] = row._count._all;
      map.set(key, g);
    }

    for (const b of batches) {
      const key = `${b.brand}\0${b.contentType}`;
      const g =
        map.get(key) ??
        ({
          brand: b.brand,
          contentType: b.contentType,
          byStatus: {},
          activeBatches: [],
        } as Group);
      g.activeBatches.push({
        id: b.id,
        status: b.status,
        batchSize: b.batchSize,
        targetSize: b.targetSize,
        createdAt: b.createdAt,
        scheduledFor: b.scheduledFor,
        sentAt: b.sentAt,
        mauticEmailId: b.mauticEmailId,
      });
      map.set(key, g);
    }

    return NextResponse.json({
      grouped: [...map.values()].sort((a, b) =>
        a.brand === b.brand
          ? a.contentType.localeCompare(b.contentType)
          : a.brand.localeCompare(b.brand)
      ),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[content-intake] GET:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
