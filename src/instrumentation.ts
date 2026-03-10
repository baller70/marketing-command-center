/**
 * Next.js Instrumentation - Auto Pipeline Scheduler
 * 
 * Runs the full marketing pipeline cycle every 4 hours automatically.
 * No external cron needed — the pipeline is self-driving.
 */

export async function register() {
  // Only run on the server (not edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const CYCLE_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 hours
    const PORT = process.env.PORT || 3012
    const BASE_URL = `http://localhost:${PORT}`

    console.log('[pipeline-scheduler] Registered. Will auto-run full cycle every 4 hours.')

    // Wait 30s after startup before first run (let server fully initialize)
    setTimeout(async () => {
      console.log('[pipeline-scheduler] Running initial pipeline cycle...')
      await triggerCycle(BASE_URL)

      // Then schedule recurring runs
      setInterval(async () => {
        console.log('[pipeline-scheduler] Running scheduled pipeline cycle...')
        await triggerCycle(BASE_URL)
      }, CYCLE_INTERVAL_MS)
    }, 30_000)
  }
}

async function triggerCycle(baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/api/cron/pipeline`, { method: 'GET' })
    const data = await res.json()
    console.log(`[pipeline-scheduler] Cycle complete: success=${data.success}, duration=${data.durationMs}ms`)
    
    // Log summary if available
    if (data.cycle?.report?.pipeline) {
      const p = data.cycle.report.pipeline
      console.log(`[pipeline-scheduler] Pipeline: ${p.total} campaigns (${p.draft} draft, ${p.assembling} assembling, ${p.live} live, ${p.completed} completed)`)
    }
  } catch (error) {
    console.error('[pipeline-scheduler] Cycle failed:', error)
  }
}
