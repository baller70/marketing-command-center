/**
 * Next.js Instrumentation - Marketing Pipeline Scheduler
 *
 * Runs:
 * - Auto-advance every 2 minutes
 * - Email collection (Gmail scan) every hour
 * - Postiz/ContentHub intake polling every 5 minutes
 * - Legacy full cycle every 4 hours
 */

let pipelineCycleRunning = false;
let autoAdvanceRunning = false;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const PORT = process.env.PORT || 3012;
    const BASE_URL = `http://localhost:${PORT}`;

    console.log("[pipeline-scheduler] Registered. Marketing pipeline automation active.");

    // Wait 30s for server to fully initialize
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

      console.log("[pipeline-scheduler] All cron jobs scheduled.");
    }, 30000);
  }
}
