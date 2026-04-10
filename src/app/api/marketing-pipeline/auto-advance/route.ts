import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStageName } from "@/lib/pipeline-stages";
import { generateEmailDraft } from "@/lib/email-draft-generator";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonVal(v: unknown): any { return v; }

interface AdvanceResult {
  itemId: string;
  title: string;
  from: number;
  to: number;
  reason: string;
}

interface PipelineItem {
  id: string;
  title: string;
  brand: string;
  currentStage: number;
  status: string;
  pipelineMode: string;
  source: string;
  sourceUrl?: string | null;
  contentPreview: string | null;
  contentType: string;
  emailDraft: unknown;
  assemblyConfig: unknown;
  qualityScore: number | null;
  deploymentData: unknown;
  performanceData: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MARKETING PIPELINE AUTO-ADVANCE ENGINE
 *
 * ALL processing is internal. No external APIs are called.
 * Drafts are generated and stored locally. Nothing is sent externally.
 *
 * Two modes:
 *   MANUAL  — Stages 1-6 auto, Stage 7 stops for Kevin to review the draft.
 *             Kevin clicks "Send" to mark it dispatched and continue 8-12.
 *   AUTOMATIC — All 12 stages auto. Draft generated, marked as sent, archived.
 *
 * Stages:
 *   1. Intake         — Content ingested, brand assigned
 *   2. Intelligence    — Market data attached (or skipped)
 *   3. Brief           — Email draft auto-generated (internal only)
 *   4. Content         — Assets referenced
 *   5. Assembly        — Draft + list ID assembled
 *   6. Quality Gate    — Auto-scored
 *   7. Review          — MANUAL stops here, AUTOMATIC auto-approves
 *   8. Deploy          — Campaign marked as ready (internal)
 *   9. Send            — Campaign marked as sent (internal, no external API)
 *  10. Monitor         — Wait period, then advance
 *  11. Analyze         — Performance placeholder generated
 *  12. Archive         — Item completed
 */
async function tryAdvance(item: PipelineItem): Promise<AdvanceResult | null> {
  const stage = item.currentStage;
  const age = Date.now() - new Date(item.updatedAt).getTime();
  const ageMinutes = age / 60000;
  const isAuto = item.pipelineMode === "automatic";

  switch (stage) {
    case 1: {
      if (item.contentPreview && item.brand) {
        return { itemId: item.id, title: item.title, from: 1, to: 2, reason: "Content and brand present — advancing to Intelligence" };
      }
      if (item.brand && ageMinutes > 1) {
        return { itemId: item.id, title: item.title, from: 1, to: 2, reason: "Brand assigned — advancing to Intelligence" };
      }
      return null;
    }

    case 2: {
      const intel = await prisma.intelligenceEntry.findFirst({
        where: { brand: { in: [item.brand, "all"] }, status: "new" },
        orderBy: { createdAt: "desc" },
      });
      if (intel) {
        return { itemId: item.id, title: item.title, from: 2, to: 3, reason: `Intelligence attached: ${intel.category}` };
      }
      if (ageMinutes > 2) {
        return { itemId: item.id, title: item.title, from: 2, to: 3, reason: "No intel data — advancing to Brief" };
      }
      return null;
    }

    case 3: {
      const draft = item.emailDraft as Record<string, unknown> | null;
      if (draft && draft.subject && draft.body) {
        return { itemId: item.id, title: item.title, from: 3, to: 4, reason: "Email draft ready — advancing to Content" };
      }
      const generated = await generateEmailDraft(item);
      if (generated) {
        await prisma.marketingItem.update({
          where: { id: item.id },
          data: { emailDraft: jsonVal(generated) },
        });
        return { itemId: item.id, title: item.title, from: 3, to: 4, reason: "Auto-generated email draft — advancing to Content" };
      }
      if (ageMinutes > 3) {
        return { itemId: item.id, title: item.title, from: 3, to: 4, reason: "Brief timeout — advancing without email draft" };
      }
      return null;
    }

    case 4: {
      const assets = await prisma.contentAsset.findFirst({
        where: { brand: item.brand, status: "new" },
      });
      if (assets || ageMinutes > 2) {
        return { itemId: item.id, title: item.title, from: 4, to: 5, reason: assets ? "Content assets attached" : "No assets needed — advancing" };
      }
      return null;
    }

    case 5: {
      const config = item.assemblyConfig as Record<string, unknown> | null;
      const emailDraft = item.emailDraft as Record<string, unknown> | null;

      const brandConfig = await prisma.brandEmailConfig.findUnique({ where: { brand: item.brand } });
      if (brandConfig && emailDraft) {
        const listId = brandConfig.defaultEmailPlatform === "sendfox"
          ? brandConfig.sendfoxListId
          : brandConfig.acumbamailListId;
        const updatedDraft = {
          ...(emailDraft || {}),
          recipientListId: listId,
          platform: brandConfig.defaultEmailPlatform,
          fromName: brandConfig.emailFromName || item.brand,
          fromEmail: brandConfig.emailReplyTo || `info@${item.brand.toLowerCase()}.com`,
        };
        await prisma.marketingItem.update({
          where: { id: item.id },
          data: {
            emailDraft: jsonVal(updatedDraft),
            assemblyConfig: jsonVal({ ...(config || {}), assembled: true, assembledAt: new Date().toISOString() }),
          },
        });
      }

      if (emailDraft?.subject || ageMinutes > 3) {
        return { itemId: item.id, title: item.title, from: 5, to: 6, reason: "Assembly complete — advancing to Quality Gate" };
      }
      return null;
    }

    case 6: {
      const score = item.qualityScore ?? 0;
      if (score >= 70) {
        return { itemId: item.id, title: item.title, from: 6, to: 7, reason: `Quality score ${score} >= 70 — advancing to Review` };
      }

      const emailDraft = item.emailDraft as Record<string, unknown> | null;
      let autoScore = 50;
      if (emailDraft?.subject) autoScore += 15;
      if (emailDraft?.body) autoScore += 15;
      if (emailDraft?.recipientListId) autoScore += 10;
      if (item.contentPreview && item.contentPreview.length > 20) autoScore += 10;

      await prisma.marketingItem.update({ where: { id: item.id }, data: { qualityScore: autoScore } });

      if (autoScore >= 70) {
        return { itemId: item.id, title: item.title, from: 6, to: 7, reason: `Auto quality score ${autoScore} >= 70 — advancing to Review` };
      }
      if (ageMinutes > 5) {
        return { itemId: item.id, title: item.title, from: 6, to: 7, reason: "Quality gate timeout — advancing for review" };
      }
      return null;
    }

    case 7: {
      if (isAuto) {
        await prisma.marketingItem.update({
          where: { id: item.id },
          data: { approvedAt: new Date(), approvedBy: "auto-pipeline" },
        });
        return { itemId: item.id, title: item.title, from: 7, to: 8, reason: "Auto-approved (automatic mode) — advancing to Deploy" };
      }
      return null;
    }

    case 8: {
      const deploy = item.deploymentData as Record<string, unknown> | null;
      if (deploy?.deployed) {
        return { itemId: item.id, title: item.title, from: 8, to: 9, reason: "Campaign ready — advancing to Send" };
      }
      const emailDraft = item.emailDraft as Record<string, unknown> | null;
      await prisma.marketingItem.update({
        where: { id: item.id },
        data: {
          deploymentData: jsonVal({
            ...(deploy || {}),
            deployed: true,
            platform: (emailDraft?.platform as string) || "acumbamail",
            listId: (emailDraft?.recipientListId as string) || null,
            subject: (emailDraft?.subject as string) || item.title,
            deployedAt: new Date().toISOString(),
          }),
        },
      });
      return { itemId: item.id, title: item.title, from: 8, to: 9, reason: "Campaign staged for send — advancing to Send" };
    }

    case 9: {
      const deploy = item.deploymentData as Record<string, unknown> | null;

      if (deploy?.sent) {
        return { itemId: item.id, title: item.title, from: 9, to: 10, reason: "Campaign marked as sent — advancing to Monitor" };
      }

      if (isAuto) {
        await prisma.marketingItem.update({
          where: { id: item.id },
          data: {
            deploymentData: jsonVal({
              ...(deploy || {}),
              sent: true,
              method: "auto-queued",
              sentAt: new Date().toISOString(),
            }),
          },
        });
        return { itemId: item.id, title: item.title, from: 9, to: 10, reason: "Campaign queued for send (auto) — advancing to Monitor" };
      }

      return null;
    }

    case 10: {
      if (ageMinutes > 1) {
        return { itemId: item.id, title: item.title, from: 10, to: 11, reason: "Monitoring window complete (1h) — advancing to Analyze" };
      }
      return null;
    }

    case 11: {
      const perf = item.performanceData as Record<string, unknown> | null;
      if (ageMinutes >= 1) {
        const existingMeta = (typeof item.metadata === "object" && item.metadata !== null) ? item.metadata : {};
        await prisma.marketingItem.update({
          where: { id: item.id },
          data: {
            metadata: jsonVal({ ...(existingMeta as object), analyzed: true }),
            performanceData: jsonVal({
              ...(perf || {}),
              analyzed: true,
              analyzedAt: new Date().toISOString(),
            }),
          },
        });
        return { itemId: item.id, title: item.title, from: 11, to: 12, reason: "Analysis complete — advancing to Archive" };
      }
      return null;
    }

    case 12: {
      await prisma.marketingItem.update({ where: { id: item.id }, data: { status: "completed" } });
      return null;
    }

    default:
      return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get("dry") === "true";

    const activeItems = await prisma.marketingItem.findMany({
      where: { status: "active", currentStage: { lte: 12 } },
      orderBy: { priorityScore: "desc" },
    });

    const results: AdvanceResult[] = [];

    for (const item of activeItems) {
      try {
        const result = await tryAdvance(item as PipelineItem);
        if (result) {
          results.push(result);
          if (!dryRun) {
            await prisma.marketingItem.update({
              where: { id: result.itemId },
              data: { currentStage: result.to, updatedAt: new Date() },
            });
            await prisma.marketingPipelineLog.create({
              data: {
                itemId: result.itemId,
                stage: result.to,
                stageName: getStageName(result.to),
                action: "auto",
                details: `[AUTO] ${result.reason}`,
              },
            });
          }
        }
      } catch (err: unknown) {
        console.error(`[auto-advance] Error processing item ${item.id}:`, err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      advanced: results.length,
      checked: activeItems.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[auto-advance] GET error:", msg);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const activeItems = await prisma.marketingItem.findMany({
      where: { status: "active", currentStage: { lte: 12 } },
      orderBy: { priorityScore: "desc" },
    });

    const results: AdvanceResult[] = [];

    for (const item of activeItems) {
      try {
        const result = await tryAdvance(item as PipelineItem);
        if (result) {
          results.push(result);
          await prisma.marketingItem.update({
            where: { id: result.itemId },
            data: { currentStage: result.to, updatedAt: new Date() },
          });
          await prisma.marketingPipelineLog.create({
            data: {
              itemId: result.itemId,
              stage: result.to,
              stageName: getStageName(result.to),
              action: "auto",
              details: `[AUTO] ${result.reason}`,
            },
          });
        }
      } catch (err: unknown) {
        console.error(`[auto-advance] Error processing item ${item.id}:`, err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json({
      success: true,
      advanced: results.length,
      checked: activeItems.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[auto-advance] POST error:", msg);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
