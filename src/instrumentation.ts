/**
 * Next.js Instrumentation - Marketing Pipeline Scheduler
 *
 * Runs:
 * - Auto-advance every 2 minutes
 * - Email collection (Gmail scan) every hour
 * - Postiz/ContentHub intake polling every 5 minutes
 * - Legacy full cycle every 4 hours
 * - Subscriber sync every 6 hours
 * - Email analytics sync every 1 hour
 * - List hygiene weekly (every 168 hours)
 * - Subscriber snapshot daily (every 24 hours)
 */

let pipelineCycleRunning = false;
let autoAdvanceRunning = false;
let subscriberSyncRunning = false;
let analyticsSyncRunning = false;
let hygieneRunning = false;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const PORT = process.env.PORT || 3012;
    const BASE_URL = `http://localhost:${PORT}`;

    console.log("[pipeline-scheduler] Registered. Marketing pipeline automation active.");

    setTimeout(() => {
      // Auto-advance: every 2 minutes
      setInterval(async () => {
        if (autoAdvanceRunning) return;
        autoAdvanceRunning = true;
        try {
          const res = await fetch(`${BASE_URL}/api/marketing-pipeline/auto-advance`, {
            method: "POST",
            signal: AbortSignal.timeout(20000),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.advanced > 0) {
              console.log(`[auto-advance] Advanced ${data.advanced}/${data.checked} items`);
            }
          }
        } catch (err: unknown) {
          console.error("[auto-advance] Error:", err instanceof Error ? err.message : err);
        } finally {
          autoAdvanceRunning = false;
        }
      }, 2 * 60 * 1000);

      // Postiz + ContentHub intake: every 5 minutes
      setInterval(async () => {
        try {
          await fetch(`${BASE_URL}/api/marketing-pipeline/intake`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source: "postiz" }),
            signal: AbortSignal.timeout(15000),
          });
          await fetch(`${BASE_URL}/api/marketing-pipeline/intake`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source: "contenthub" }),
            signal: AbortSignal.timeout(15000),
          });
        } catch (err: unknown) {
          console.error("[intake-poll] Error:", err instanceof Error ? err.message : err);
        }
      }, 5 * 60 * 1000);

      // Gmail email collection: every hour
      setInterval(async () => {
        try {
          await fetch(`${BASE_URL}/api/email-collector/gmail-scan`, {
            method: "POST",
            signal: AbortSignal.timeout(20000),
          });
        } catch (err: unknown) {
          console.error("[gmail-scan] Error:", err instanceof Error ? err.message : err);
        }
      }, 60 * 60 * 1000);

      // Legacy full cycle: every 4 hours
      setInterval(async () => {
        if (pipelineCycleRunning) return;
        pipelineCycleRunning = true;
        try {
          const res = await fetch(`${BASE_URL}/api/cron/pipeline`, {
            method: "GET",
            signal: AbortSignal.timeout(30000),
          });
          if (res.ok) {
            const data = await res.json();
            console.log(`[legacy-cycle] Complete: duration=${data.durationMs}ms`);
          }
        } catch (err: unknown) {
          console.error("[legacy-cycle] Error:", err instanceof Error ? err.message : err);
        } finally {
          pipelineCycleRunning = false;
        }
      }, 4 * 60 * 60 * 1000);

      // Subscriber sync from Mautic: every 6 hours
      setInterval(async () => {
        if (subscriberSyncRunning) return;
        subscriberSyncRunning = true;
        try {
          const res = await fetch(`${BASE_URL}/api/subscribers/sync`, {
            method: "POST",
            signal: AbortSignal.timeout(60000),
          });
          if (res.ok) {
            const data = await res.json();
            console.log(`[subscriber-sync] Synced: ${data.upserts ?? 0} upserts, ${data.pages ?? 0} pages`);
          }
        } catch (err: unknown) {
          console.error("[subscriber-sync] Error:", err instanceof Error ? err.message : err);
        } finally {
          subscriberSyncRunning = false;
        }
      }, 6 * 60 * 60 * 1000);

      // Email analytics sync from Mautic: every 1 hour
      setInterval(async () => {
        if (analyticsSyncRunning) return;
        analyticsSyncRunning = true;
        try {
          const { syncEmailAnalytics, updateSubscriberScoresFromAnalytics } = await import("@/lib/email-analytics");
          await syncEmailAnalytics();
          await updateSubscriberScoresFromAnalytics();
          console.log("[analytics-sync] Complete");
        } catch (err: unknown) {
          console.error("[analytics-sync] Error:", err instanceof Error ? err.message : err);
        } finally {
          analyticsSyncRunning = false;
        }
      }, 60 * 60 * 1000);

      // List hygiene: weekly (168 hours)
      setInterval(async () => {
        if (hygieneRunning) return;
        hygieneRunning = true;
        try {
          const { runListHygiene } = await import("@/lib/list-hygiene");
          const result = await runListHygiene();
          console.log(`[list-hygiene] Complete: bounces=${result.bouncesCleaned}, inactive=${result.inactiveSuppressed}, unsubs=${result.unsubscribesSynced}`);
        } catch (err: unknown) {
          console.error("[list-hygiene] Error:", err instanceof Error ? err.message : err);
        } finally {
          hygieneRunning = false;
        }
      }, 168 * 60 * 60 * 1000);

      // Subscriber snapshot: daily (24 hours)
      setInterval(async () => {
        try {
          const { takeSubscriberSnapshot } = await import("@/lib/subscriber-engine");
          const brands = ["TBF", "RA1", "HoS", "ShotIQ", "Kevin", "Bookmark"];
          for (const brand of brands) {
            await takeSubscriberSnapshot(brand);
          }
          console.log("[subscriber-snapshot] Daily snapshots taken");
        } catch (err: unknown) {
          console.error("[subscriber-snapshot] Error:", err instanceof Error ? err.message : err);
        }
      }, 24 * 60 * 60 * 1000);

      // Scheduled batch sender: every 5 minutes
      setInterval(async () => {
        try {
          const { prisma } = await import("@/lib/prisma");
          const dueBatches = await prisma.contentBatch.findMany({
            where: { status: "scheduled", scheduledFor: { lte: new Date() } },
            select: { id: true },
          });
          for (const batch of dueBatches) {
            await fetch(`${BASE_URL}/api/content-distribution/approve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ batchId: batch.id, action: "send" }),
              signal: AbortSignal.timeout(30000),
            }).catch(() => {});
          }
          if (dueBatches.length > 0) console.log(`[batch-scheduler] Sent ${dueBatches.length} scheduled batches`);
        } catch (err: unknown) {
          console.error("[batch-scheduler] Error:", err instanceof Error ? err.message : err);
        }
      }, 5 * 60 * 1000);
      console.log("[pipeline-scheduler] All cron jobs scheduled (incl. subscriber sync, analytics, hygiene, snapshots).");
    }, 30000);
  }
}
