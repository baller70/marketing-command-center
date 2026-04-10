import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 200;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, brand, source, sourceId } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length > MAX_EMAIL_LENGTH || !isValidEmail(trimmedEmail)) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
    }

    const assignedBrand = typeof brand === "string" && brand.trim() ? brand.trim() : "TBF";
    const safeName = typeof name === "string" ? name.trim().substring(0, MAX_NAME_LENGTH) : null;
    const safeSource = typeof source === "string" ? source.substring(0, 50) : "webhook";
    const safeSourceId = typeof sourceId === "string" ? sourceId.substring(0, 200) : null;

    const existing = await prisma.collectedContact.findFirst({
      where: { email: trimmedEmail, brand: assignedBrand },
    });
    if (existing) {
      return NextResponse.json({ success: true, action: "duplicate", contact: existing });
    }

    const contact = await prisma.collectedContact.create({
      data: {
        email: trimmedEmail,
        name: safeName || null,
        brand: assignedBrand,
        source: safeSource,
        sourceId: safeSourceId,
      },
    });

    const synced = await syncToEmailPlatform(contact);

    if (synced) {
      await prisma.collectedContact.update({
        where: { id: contact.id },
        data: { synced: true, syncedTo: synced },
      });
    }

    return NextResponse.json({ success: true, action: "created", contact, synced: !!synced });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[email-collector/webhook] error:", msg);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function syncToEmailPlatform(contact: { email: string; name: string | null; brand: string | null }): Promise<string | null> {
  const brandConfig = contact.brand
    ? await prisma.brandEmailConfig.findUnique({ where: { brand: contact.brand } })
    : null;

  if (!brandConfig) return null;

  if (brandConfig.defaultEmailPlatform === "sendfox" && brandConfig.sendfoxListId) {
    const token = process.env.SENDFOX_TOKEN;
    if (!token) return null;
    try {
      const nameParts = (contact.name || "").split(" ");
      const res = await fetch("https://api.sendfox.com/contacts", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contact.email,
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || "",
          lists: [parseInt(brandConfig.sendfoxListId)],
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return "sendfox";
    } catch {
      // SendFox not available
    }
  }

  if (brandConfig.defaultEmailPlatform === "acumbamail" && brandConfig.acumbamailListId) {
    const token = process.env.ACUMBAMAIL_TOKEN;
    if (!token) return null;
    try {
      const res = await fetch("https://acumbamail.com/api/1/addSubscriber/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          list_id: brandConfig.acumbamailListId,
          merge_fields: { email: contact.email, name: contact.name || "" },
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return "acumbamail";
    } catch {
      // Acumbamail not available
    }
  }

  return null;
}

function isValidEmail(email: string): boolean {
  if (email.length < 3 || email.length > MAX_EMAIL_LENGTH) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
