export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { startsWith: "batch-size-" } },
      orderBy: { key: "asc" },
    });
    return NextResponse.json({ configs: rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[content-distribution/config] GET:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const contentType =
      typeof body.contentType === "string" ? body.contentType.trim() : "";
    const brand =
      typeof body.brand === "string" ? body.brand.trim() : undefined;
    const sizeRaw = body.size;

    if (!contentType) {
      return NextResponse.json(
        { error: "contentType is required" },
        { status: 400 }
      );
    }

    const size =
      typeof sizeRaw === "number"
        ? sizeRaw
        : Number.parseInt(String(sizeRaw ?? ""), 10);
    if (!Number.isFinite(size) || size < 1) {
      return NextResponse.json({ error: "size must be a positive integer" }, { status: 400 });
    }

    const t = contentType.toLowerCase().trim();
    const key =
      brand && brand.length > 0
        ? `batch-size-${t}-${brand}`
        : `batch-size-${t}`;

    const setting = await prisma.setting.upsert({
      where: { key },
      create: { key, value: String(size) },
      update: { value: String(size) },
    });

    return NextResponse.json({ success: true, setting });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[content-distribution/config] PUT:", msg);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
