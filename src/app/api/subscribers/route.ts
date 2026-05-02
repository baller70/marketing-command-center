export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TIERS = ["hot", "warm", "cold", "inactive", "new"] as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get("brand")?.trim();
    const tier = searchParams.get("tier")?.trim();
    const search = searchParams.get("search")?.trim();
    const limitRaw = searchParams.get("limit");
    const offsetRaw = searchParams.get("offset");
    const limit = Math.min(
      Math.max(Number.parseInt(limitRaw || "50", 10) || 50, 1),
      200
    );
    const offset = Math.max(Number.parseInt(offsetRaw || "0", 10) || 0, 0);

    const baseWhere: Record<string, unknown> = {};
    if (brand) baseWhere.brand = brand;
    if (tier && TIERS.includes(tier as (typeof TIERS)[number])) {
      baseWhere.engagementTier = tier;
    }

    const searchFilter =
      search && search.length > 0
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

    const listWhere = { ...baseWhere, ...searchFilter };

    const [subscribers, total, tierGroups] = await Promise.all([
      prisma.subscriber.findMany({
        where: listWhere,
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.subscriber.count({ where: listWhere }),
      prisma.subscriber.groupBy({
        by: ["engagementTier"],
        where: baseWhere,
        _count: true,
      }),
    ]);

    const tiers: Record<string, number> = {
      hot: 0,
      warm: 0,
      cold: 0,
      inactive: 0,
      new: 0,
    };
    for (const g of tierGroups) {
      if (g.engagementTier in tiers) {
        tiers[g.engagementTier] = g._count;
      }
    }

    return NextResponse.json({ subscribers, total, tiers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[subscribers] GET:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
