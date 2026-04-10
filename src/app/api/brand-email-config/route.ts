import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_FIELD_LENGTH = 500;

export async function GET() {
  try {
    const configs = await prisma.brandEmailConfig.findMany({
      orderBy: { brand: "asc" },
    });
    return NextResponse.json({ success: true, configs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[brand-email-config] GET error:", msg);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brand,
      sendfoxListId,
      acumbamailListId,
      defaultEmailPlatform,
      emailTemplateId,
      emailFromName,
      emailReplyTo,
      brandColor,
      ctaUrl,
    } = body;

    if (!brand || typeof brand !== "string" || !brand.trim()) {
      return NextResponse.json({ success: false, error: "brand is required" }, { status: 400 });
    }

    const safeBrand = brand.trim().substring(0, 100);

    const validPlatforms = ["sendfox", "acumbamail"];
    const safePlatform = typeof defaultEmailPlatform === "string" && validPlatforms.includes(defaultEmailPlatform)
      ? defaultEmailPlatform
      : "sendfox";

    const safeColor = sanitizeColorValue(brandColor);

    const safeStr = (val: unknown, maxLen = MAX_FIELD_LENGTH): string | null => {
      if (typeof val !== "string" || !val.trim()) return null;
      return val.trim().substring(0, maxLen);
    };

    if (emailReplyTo && typeof emailReplyTo === "string" && emailReplyTo.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailReplyTo.trim())) {
        return NextResponse.json({ success: false, error: "emailReplyTo must be a valid email address" }, { status: 400 });
      }
    }

    const config = await prisma.brandEmailConfig.upsert({
      where: { brand: safeBrand },
      update: {
        sendfoxListId: safeStr(sendfoxListId),
        acumbamailListId: safeStr(acumbamailListId),
        defaultEmailPlatform: safePlatform,
        emailTemplateId: safeStr(emailTemplateId),
        emailFromName: safeStr(emailFromName),
        emailReplyTo: safeStr(emailReplyTo),
        brandColor: safeColor,
        ctaUrl: safeStr(ctaUrl, 2000),
      },
      create: {
        brand: safeBrand,
        sendfoxListId: safeStr(sendfoxListId),
        acumbamailListId: safeStr(acumbamailListId),
        defaultEmailPlatform: safePlatform,
        emailTemplateId: safeStr(emailTemplateId),
        emailFromName: safeStr(emailFromName),
        emailReplyTo: safeStr(emailReplyTo),
        brandColor: safeColor,
        ctaUrl: safeStr(ctaUrl, 2000),
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[brand-email-config] POST error:", msg);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

function sanitizeColorValue(color: unknown): string | null {
  if (typeof color !== "string" || !color.trim()) return null;
  const hex = /^#[0-9A-Fa-f]{3,8}$/;
  const rgb = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
  if (hex.test(color.trim()) || rgb.test(color.trim())) return color.trim();
  return null;
}
