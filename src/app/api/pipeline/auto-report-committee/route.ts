import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Report to Committee Hub
 * 
 * After a pipeline cycle runs, this endpoint:
 * 1. Gathers pipeline status summary
 * 2. Posts an optimization log to the committee hub
 * 3. Posts a chat message with cycle results
 * 
 * Closes the cross-division communication gap — marketing pipeline
 * now self-reports its status to the committee hub automatically.
 * 
 * ZERO COST — just HTTP calls to local committee hub.
 * 
 * GET  - Preview what would be reported
 * POST - Send report to committee hub
 */

const COMMITTEE_HUB_URL = process.env.COMMITTEE_URL || process.env.COMMITTEE_HUB_URL || 'http://localhost:3019'

interface PipelineReport {
  pipeline: { total: number; draft: number; assembling: number; live: number; completed: number }
  performance: { impressions: number; clicks: number; leads: number; revenue: number; spent: number; roas: string; ctr: string }
  intelligence: { total: number; newToday: number }
  learningRules: { total: number; active: number }
  briefs: { total: number; pending: number }
}

async function gatherReport(): Promise<PipelineReport> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalCampaigns, draftCount, assemblingCount, liveCount, completedCount,
    totalBriefs, pendingBriefs,
    totalIntel, newIntelToday,
    totalRules, activeRules,
  ] = await Promise.all([
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: 'draft' } }),
    prisma.campaign.count({ where: { status: 'assembling' } }),
    prisma.campaign.count({ where: { status: 'live' } }),
    prisma.campaign.count({ where: { status: 'completed' } }),
    prisma.creativeBrief.count(),
    prisma.creativeBrief.count({ where: { status: { in: ['submitted', 'acknowledged'] } } }),
    prisma.intelligenceEntry.count(),
    prisma.intelligenceEntry.count({ where: { createdAt: { gte: today } } }),
    prisma.learningRule.count(),
    prisma.learningRule.count({ where: { status: 'active' } }),
  ])

  const perfData = await prisma.performanceMetric.aggregate({
    _sum: {
      impressions: true,
      clicks: true,
      leadsGenerated: true,
      revenueGenerated: true,
      budgetSpent: true,
    },
  })

  const s = perfData._sum
  const impressions = s.impressions || 0
  const clicks = s.clicks || 0
  const leads = s.leadsGenerated || 0
  const revenue = s.revenueGenerated || 0
  const spent = s.budgetSpent || 0

  return {
    pipeline: { total: totalCampaigns, draft: draftCount, assembling: assemblingCount, live: liveCount, completed: completedCount },
    performance: {
      impressions, clicks, leads, revenue, spent,
      roas: spent > 0 ? (revenue / spent).toFixed(2) + 'x' : 'N/A',
      ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : 'N/A',
    },
    intelligence: { total: totalIntel, newToday: newIntelToday },
    learningRules: { total: totalRules, active: activeRules },
    briefs: { total: totalBriefs, pending: pendingBriefs },
  }
}

async function postToCommittee(endpoint: string, body: Record<string, unknown>): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const res = await fetch(`${COMMITTEE_HUB_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    // Handle empty responses gracefully (some endpoints return empty body on error)
    const text = await res.text()
    if (!text) {
      return { ok: false, error: `Empty response from ${endpoint} (HTTP ${res.status})` }
    }
    try {
      const data = JSON.parse(text)
      return { ok: res.ok, data }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[auto-report-committee] JSON parse ${endpoint}:`, msg, err)
      return { ok: false, error: 'Invalid response from committee hub' }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-report-committee] fetchJSON:', msg, err)
    return { ok: false, error: 'Request failed' }
  }
}

export async function GET() {
  try {
    const report = await gatherReport()
    return NextResponse.json({ success: true, preview: true, report })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-report-committee] GET:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const cycleContext = body.cycleContext || 'scheduled'
    const report = await gatherReport()

    // 1. Post optimization log
    const optimizationResult = await postToCommittee('optimization', {
      division_id: 'marketing',
      agent: 'Derek',
      cycle_type: 'auto-pipeline-cycle',
      pipeline_review: `Pipeline: ${report.pipeline.live} live, ${report.pipeline.draft} draft, ${report.pipeline.assembling} assembling, ${report.pipeline.completed} completed (${report.pipeline.total} total). Performance: ${report.performance.ctr} CTR, ${report.performance.roas} ROAS, ${report.performance.leads} leads. Intelligence: ${report.intelligence.newToday} new today (${report.intelligence.total} total). Learning rules: ${report.learningRules.active} active.`,
      pipeline_actions: [
        `Full cycle executed (${cycleContext})`,
        `${report.pipeline.live} campaigns live`,
        `${report.intelligence.newToday} new intelligence entries`,
        `${report.learningRules.active} active learning rules`,
      ],
      process_review: `Autonomous pipeline running. ${report.briefs.pending} briefs pending review. ${report.pipeline.assembling} campaigns in assembly.`,
      improvements_identified: report.intelligence.newToday,
      improvements_implemented: report.learningRules.active,
      next_priorities: [
        report.pipeline.assembling > 0 ? 'Advance assembling campaigns' : 'Monitor live campaigns',
        report.briefs.pending > 0 ? `Review ${report.briefs.pending} pending briefs` : 'Briefs up to date',
      ],
    })

    // 2. If optimization failed, post a fallback summary via chat so data isn't lost
    let optimizationFallback = null
    if (!optimizationResult.ok) {
      optimizationFallback = await postToCommittee('chat', {
        agent: 'Derek',
        division_id: 'marketing',
        message: `[Optimization Report Fallback] Pipeline: ${report.pipeline.live} live/${report.pipeline.total} total campaigns. Perf: ${report.performance.ctr} CTR, ${report.performance.roas} ROAS, ${report.performance.leads} leads. Intel: ${report.intelligence.newToday} new today. Learning: ${report.learningRules.active} active rules. (Optimization endpoint unavailable: ${optimizationResult.error})`,
      })
    }

    // 3. Post chat message
    const chatResult = await postToCommittee('chat', {
      agent: 'Derek',
      division_id: 'marketing',
      message: `Auto-cycle complete — ${report.pipeline.live} live campaigns, ${report.performance.roas} ROAS, ${report.performance.leads} leads, ${report.intelligence.newToday} new intel entries. Pipeline healthy.`,
    })

    // 4. Also try posting a learning entry about this cycle
    const learningResult = await postToCommittee('learning', {
      division_id: 'marketing',
      agent: 'Derek',
      entry_type: 'metric',
      title: `Pipeline cycle stats — ${new Date().toISOString().split('T')[0]}`,
      description: `Campaigns: ${report.pipeline.live} live, ${report.pipeline.total} total. ROAS: ${report.performance.roas}. CTR: ${report.performance.ctr}. Leads: ${report.performance.leads}. Intel: ${report.intelligence.newToday} new. Learning rules: ${report.learningRules.active} active.`,
      lesson: `Pipeline running autonomously with ${report.pipeline.live} live campaigns and ${report.performance.roas} ROAS.`,
      tags: ['auto-cycle', 'metrics', 'pipeline'],
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      report,
      committeeHub: {
        optimization: optimizationResult,
        optimizationFallback,
        chat: chatResult,
        learning: learningResult,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-report-committee] POST:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
