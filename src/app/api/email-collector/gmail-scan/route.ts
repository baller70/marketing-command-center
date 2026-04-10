import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    let collected = 0;
    let skipped = 0;

    // Use himalaya CLI to list starred/flagged emails
    const himalayaPath = "/usr/local/bin/himalaya";
    let emails: { from: string; subject: string }[] = [];

    try {
      const { stdout } = await execFileAsync(himalayaPath, [
        "list", "--folder", "INBOX", "--query", "is:starred", "--max-width", "1000",
      ], { timeout: 15000 });

      const lines = stdout.split("\n").filter(l => l.trim());
      for (const line of lines.slice(1)) {
        const parts = line.split(/\s{2,}/);
        if (parts.length >= 3) {
          const from = parts[1]?.trim() || "";
          const subject = parts[2]?.trim() || "";
          const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
          if (emailMatch) {
            emails.push({ from: emailMatch[1], subject });
          }
        }
      }
    } catch (err: unknown) {
      console.warn("[gmail-scan] himalaya not available or errored:", err instanceof Error ? err.message : err);
      return NextResponse.json({
        success: true,
        message: "Gmail scan skipped — himalaya CLI not available",
        collected: 0,
        skipped: 0,
      });
    }

    for (const email of emails) {
      const brand = detectBrandFromEmail(email.from, email.subject);

      const existing = await prisma.collectedContact.findFirst({
        where: { email: email.from.toLowerCase(), brand },
      });
      if (existing) {
        skipped++;
        continue;
      }

      await prisma.collectedContact.create({
        data: {
          email: email.from.toLowerCase(),
          name: null,
          brand,
          source: "gmail",
          sourceId: `gmail:starred:${email.subject.substring(0, 50)}`,
        },
      });

      // Sync to email platform
      const brandConfig = await prisma.brandEmailConfig.findUnique({ where: { brand } });
      if (brandConfig) {
        const synced = await syncContact(email.from.toLowerCase(), brandConfig);
        if (synced) {
          await prisma.collectedContact.updateMany({
            where: { email: email.from.toLowerCase(), brand },
            data: { synced: true, syncedTo: synced },
          });
        }
      }

      collected++;
    }

    return NextResponse.json({ success: true, collected, skipped, scanned: emails.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[gmail-scan] error:", msg);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

function detectBrandFromEmail(email: string, subject: string): string {
  const combined = `${email} ${subject}`.toLowerCase();
  if (combined.includes("basketball") || combined.includes("tbf") || combined.includes("basketballfactory")) return "TBF";
  if (combined.includes("riseasone") || combined.includes("ra1") || combined.includes("aau")) return "RA1";
  if (combined.includes("houseofsports") || combined.includes("hos")) return "HoS";
  if (combined.includes("shotiq")) return "ShotIQ";
  if (combined.includes("bookmark")) return "Bookmark";
  return "TBF";
}

async function syncContact(
  email: string,
  config: { defaultEmailPlatform: string; sendfoxListId: string | null; acumbamailListId: string | null }
): Promise<string | null> {
  if (config.defaultEmailPlatform === "sendfox" && config.sendfoxListId) {
    const token = process.env.SENDFOX_TOKEN;
    if (!token) return null;
    try {
      const res = await fetch("https://api.sendfox.com/contacts", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, lists: [parseInt(config.sendfoxListId)] }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return "sendfox";
    } catch { /* continue */ }
  }
  if (config.defaultEmailPlatform === "acumbamail" && config.acumbamailListId) {
    const token = process.env.ACUMBAMAIL_TOKEN;
    if (!token) return null;
    try {
      const res = await fetch("https://acumbamail.com/api/1/addSubscriber/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: token,
          list_id: config.acumbamailListId,
          merge_fields: { email },
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return "acumbamail";
    } catch { /* continue */ }
  }
  return null;
}
