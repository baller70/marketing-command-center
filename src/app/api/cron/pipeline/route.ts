import { NextResponse } from 'next/server'

/**
 * Pipeline Cron Endpoint
 * 
 * Triggers a full automation cycle. Designed to be called by:
 * - External cron (system crontab, PM2 cron, committee hub)
 * - Internal scheduler (instrumentation.ts setInterval)
 * 
 * GET  - Run full cycle and return results
 * POST - Same, with optional config
 */

async function runFullCycle(baseUrl: string) {
  const start = Date.now()
  
  try {
    // Use auto-full-cycle orchestrator — has all 17 stages + retry logic
    const res = await fetch(`${baseUrl}/api/pipeline/auto-full-cycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(300000), // 5 min timeout for full cycle
    })
    const data = await res.json()
    
    return {
      success: true,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      cycle: data,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[cron/pipeline] runFullCycle:', msg, err)
    return {
      success: false,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      error: 'Internal error',
    }
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const baseUrl = `${url.protocol}//${url.host}`
  const result = await runFullCycle(baseUrl)
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const url = new URL(req.url)
  const baseUrl = `${url.protocol}//${url.host}`
  const result = await runFullCycle(baseUrl)
  return NextResponse.json(result)
}
