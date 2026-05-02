import { prisma } from "@/lib/prisma";
import { mautic } from "@/lib/integrations/mautic";
import {
  recalculateEngagementScores,
  assignEngagementTiers,
} from "@/lib/subscriber-engine";

export async function syncEmailAnalytics(): Promise<{
  updated: number;
  failed: number;
}> {
  const rows = await prisma.emailAnalytics.findMany({
    where: { mauticEmailId: { not: null } },
  });
  let updated = 0;
  let failed = 0;
  const now = new Date();

  for (const row of rows) {
    if (row.mauticEmailId == null) continue;
    const stats = await mautic.getEmailStats(row.mauticEmailId).catch(() => null);
    if (!stats) {
      failed += 1;
      continue;
    }

    const sent = stats.sentCount ?? 0;
    const reads = stats.readCount ?? 0;
    const clicks = stats.clickCount ?? 0;
    const bounces = stats.bounceCount ?? 0;

    await prisma.emailAnalytics.update({
      where: { id: row.id },
      data: {
        totalSent: sent,
        totalOpens: reads,
        uniqueOpens: reads,
        totalClicks: clicks,
        uniqueClicks: clicks,
        bounces,
        openRate: sent > 0 ? reads / sent : null,
        clickRate: sent > 0 ? clicks / sent : null,
        lastSyncedAt: now,
      },
    });
    updated += 1;
  }

  return { updated, failed };
}

export async function updateSubscriberScoresFromAnalytics(): Promise<{
  scoresUpdated: number;
  tiersUpdated: number;
}> {
  const scores = await recalculateEngagementScores();
  const tiers = await assignEngagementTiers();
  return {
    scoresUpdated: scores.updated,
    tiersUpdated: tiers.updated,
  };
}
