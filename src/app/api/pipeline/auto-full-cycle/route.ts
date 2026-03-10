import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto Full-Cycle Orchestrator
 * 
 * Chains ALL pipeline automation stages in the correct order with one POST call.
 * This is the single endpoint needed for complete pipeline autonomy.
 * 
 * Order:
 * 1. RSS Intelligence (external data ingestion)
 * 2. Auto-Intelligence (internal pattern analysis)
 * 3. Auto-Seasonal (seasonal context)
 * 4. Auto-Campaigns (generate campaigns from intel)
 * 5. Auto-Brief-Advance (advance creative briefs)
 * 6. Auto-Content-Assets (generate content)
 * 7. Auto-Assembly (assemble campaigns)
 * 8. Auto-Quality-Gate (review & approve)
 * 9. Auto-Deploy (deploy approved campaigns)
 * 10. Auto-Performance-Seed (generate performance data)
 * 11. Auto-Funnel-Analysis (analyze funnels)
 * 12. Auto-Content-Feedback (feedback loop)
 * 13. Auto-Optimize (optimize based on perf)
 * 14. Auto-Learning (extract learning rules)
 * 15. Auto-Report-Committee (report to committee hub)
 * 
 * GET  - Preview cycle plan
 * POST - Execute full cycle
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3012'

interface StageResult {
  stage: string
  order: number
  status: 'success' | 'error' | 'skipped'
  durationMs: number
  summary?: string
  error?: string
}

const STAGES = [
  { name: 'auto-lifecycle', label: 'Campaign Lifecycle Management' },
  { name: 'auto-posthog-analytics', label: 'Umami Web Analytics Ingestion' },
  { name: 'auto-rss-intel', label: 'RSS Intelligence Ingestion' },
  { name: 'auto-intelligence', label: 'Internal Intelligence Analysis' },
  { name: 'auto-seasonal', label: 'Seasonal Context' },
  { name: 'auto-campaigns', label: 'Campaign Generation' },
  { name: 'auto-brief-advance', label: 'Brief Advancement' },
  { name: 'auto-content-assets', label: 'Content Asset Generation' },
  { name: 'auto-assembly', label: 'Campaign Assembly' },
  { name: 'auto-quality-gate', label: 'Quality Gate Review' },
  { name: 'auto-deploy', label: 'Campaign Deployment' },
  { name: 'auto-optimize', label: 'Performance Optimization' },
  { name: 'auto-learning', label: 'Learning Rule Extraction' },
  { name: 'auto-prune-learning', label: 'Learning Rule Pruning' },
  { name: 'auto-prune-intel', label: 'Intelligence Entry Pruning' },
  { name: 'auto-report-committee', label: 'Committee Hub Reporting' },
]

const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 1000

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runStageOnce(stage: typeof STAGES[0]): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/pipeline/${stage.name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycleContext: 'auto-full-cycle' }),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}` }
    }
    return { ok: true, data }
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}

async function runStage(stage: typeof STAGES[0], order: number): Promise<StageResult> {
  const start = Date.now()
  let lastError = ''
  let retries = 0

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
      console.log(`[auto-full-cycle] Retry ${attempt}/${MAX_RETRIES} for ${stage.name} after ${delayMs}ms`)
      await sleep(delayMs)
      retries++
    }

    const result = await runStageOnce(stage)

    if (result.ok && result.data) {
      const data = result.data
      const summary = data.summary
        ? JSON.stringify(data.summary)
        : data.persisted
          ? `created: ${(data.persisted as Record<string, unknown>).created}, skipped: ${(data.persisted as Record<string, unknown>).skipped}`
          : 'completed'

      return {
        stage: stage.label,
        order,
        status: 'success',
        durationMs: Date.now() - start,
        summary: retries > 0 ? `${summary} (retried ${retries}x)` : summary,
      }
    }

    lastError = result.error || 'Unknown error'
  }

  return {
    stage: stage.label,
    order,
    status: 'error',
    durationMs: Date.now() - start,
    error: `${lastError} (failed after ${MAX_RETRIES + 1} attempts)`,
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    description: 'Full pipeline cycle orchestrator — runs all 15 automation stages in sequence',
    stages: STAGES.map((s, i) => ({ order: i + 1, name: s.name, label: s.label })),
    usage: 'POST to execute the full cycle',
  })
}

export async function POST(req: NextRequest) {
  const cycleStart = Date.now()
  const results: StageResult[] = []

  try {
    const body = await req.json().catch(() => ({}))
    const skipStages = new Set<string>(body.skip || [])

    for (let i = 0; i < STAGES.length; i++) {
      const stage = STAGES[i]

      if (skipStages.has(stage.name)) {
        results.push({
          stage: stage.label,
          order: i + 1,
          status: 'skipped',
          durationMs: 0,
          summary: 'Skipped by request',
        })
        continue
      }

      const result = await runStage(stage, i + 1)
      results.push(result)
    }

    const totalDurationMs = Date.now() - cycleStart
    const succeeded = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'error').length
    const skipped = results.filter(r => r.status === 'skipped').length

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalDurationMs,
      totalStages: STAGES.length,
      summary: { succeeded, failed, skipped },
      results,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      results,
      totalDurationMs: Date.now() - cycleStart,
    }, { status: 500 })
  }
}
