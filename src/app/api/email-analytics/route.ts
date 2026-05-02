export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get("brand")?.trim();
    const limitRaw = searchParams.get("limit");
    const limit = Math.min(
      Math.max(Number.parseInt(limitRaw || "50", 10) || 50, 1),
      200
    );

    const where =
      brand && brand.length > 0
        ? { brand }
        : {};

    const [analyticsList, forSummary, aggregates] = await Promise.all([
      prisma.emailAnalytics.findMany({
        where,
        orderBy: { sentAt: "desc" },
        take: limit,
      }),
      prisma.emailAnalytics.findMany({
        where,
        select: {
          totalSent: true,
          openRate: true,
          clickRate: true,
          bounces: true,
        },
      }),
      prisma.emailAnalytics.aggregate({
        where,
        _sum: {
          totalSent: true,
          bounces: true,
        },
      }),
    ]);

    let wOpen = 0;
    let wClick = 0;
    let weight = 0;
    for (const r of forSummary) {
      const w = r.totalSent ?? 0;
      if (w <= 0) continue;
      weight += w;
      if (r.openRate != null) wOpen += r.openRate * w;
      if (r.clickRate != null) wClick += r.clickRate * w;
    }

    const totalSentAgg = aggregates._sum.totalSent ?? 0;

    return NextResponse.json({
      analytics: analyticsList,
      summary: {
        totalSent: totalSentAgg,
        avgOpenRate: weight > 0 ? wOpen / weight : 0,
        avgClickRate: weight > 0 ? wClick / weight : 0,
        totalBounces: aggregates._sum.bounces ?? 0,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[email-analytics] GET:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
