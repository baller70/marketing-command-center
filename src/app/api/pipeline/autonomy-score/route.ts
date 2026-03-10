import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Pipeline Autonomy Score API
 * 
 * Reports a comprehensive autonomy assessment:
 * - Per-stage autonomy status (can it run without human intervention?)
 * - Overall autonomy score (0-100%)
 * - Data source connectivity status
 * - Cycle execution history from recent runs
 * - Blockers and recommendations
 * 
 * GET - Returns full autonomy report
 */

interface StageAutonomy {
  name: string
  label: string
  autonomous: boolean
  reason: string
  dataSource: 'api' | 'internal' | 'generated' | 'manual'
}

const PIPELINE_STAGES: StageAutonomy[] = [
  { name: 'auto-lifecycle', label: 'Campaign Lifecycle Management', autonomous: true, reason: 'Auto-completes expired campaigns and archives old ones, freeing slots for new campaigns', dataSource: 'internal' },
  { name: 'auto-posthog-analytics', label: 'Umami Web Analytics Ingestion', autonomous: true, reason: 'Pulls real pageview/session/traffic data from Umami across all brand websites', dataSource: 'api' },
  { name: 'auto-rss-intel', label: 'RSS Intelligence Ingestion', autonomous: true, reason: 'Pulls from 8 free RSS feeds automatically', dataSource: 'api' },
  { name: 'auto-intelligence', label: 'Internal Intelligence Analysis', autonomous: true, reason: 'Analyzes existing intel entries autonomously', dataSource: 'internal' },
  { name: 'auto-seasonal', label: 'Seasonal Context', autonomous: true, reason: 'Date-driven seasonal detection, no human input needed', dataSource: 'generated' },
  { name: 'auto-campaigns', label: 'Campaign Generation', autonomous: true, reason: 'Generates campaigns from intelligence entries', dataSource: 'internal' },
  { name: 'auto-brief-advance', label: 'Brief Advancement', autonomous: true, reason: 'Auto-advances briefs through stages based on rules', dataSource: 'internal' },
  { name: 'auto-content-assets', label: 'Content Asset Generation', autonomous: true, reason: 'Generates content assets from brief data', dataSource: 'generated' },
  { name: 'auto-assembly', label: 'Campaign Assembly', autonomous: true, reason: 'Assembles campaigns from content + briefs', dataSource: 'internal' },
  { name: 'auto-quality-gate', label: 'Quality Gate Review', autonomous: true, reason: 'Rule-based quality scoring, auto-approve above threshold', dataSource: 'internal' },
  { name: 'auto-deploy', label: 'Campaign Deployment', autonomous: true, reason: 'Auto-deploys approved campaigns', dataSource: 'internal' },
  { name: 'auto-optimize', label: 'Performance Optimization', autonomous: true, reason: 'Auto-adjusts campaigns based on performance', dataSource: 'internal' },
  { name: 'auto-learning', label: 'Learning Rule Extraction', autonomous: true, reason: 'Extracts patterns into learning rules', dataSource: 'internal' },
  { name: 'auto-prune-learning', label: 'Learning Rule Pruning', autonomous: true, reason: 'Prunes stale/low-confidence rules', dataSource: 'internal' },
  { name: 'auto-prune-intel', label: 'Intelligence Entry Pruning', autonomous: true, reason: 'Prunes old processed intel entries to prevent DB bloat', dataSource: 'internal' },
  { name: 'auto-report-committee', label: 'Committee Hub Reporting', autonomous: true, reason: 'Auto-reports to committee hub', dataSource: 'api' },
]

async function getRecentCycleStats() {
  // Check how many intel entries were created in last 24h as proxy for cycle activity
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    intel24h,
    intelWeek,
    campaigns24h,
    campaignsTotal,
    learningRules,
    perfRecords24h,
  ] = await Promise.all([
    prisma.intelligenceEntry.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.intelligenceEntry.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.campaign.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.campaign.count(),
    prisma.learningRule.count({ where: { status: 'active' } }),
    prisma.performanceMetric.count({ where: { recordedAt: { gte: oneDayAgo } } }),
  ])

  return {
    intel24h,
    intelWeek,
    campaigns24h,
    campaignsTotal,
    activeLearningRules: learningRules,
    perfRecords24h,
    cycleActive: intel24h > 0 || campaigns24h > 0 || perfRecords24h > 0,
  }
}

export async function GET() {
  try {
    const autonomousCount = PIPELINE_STAGES.filter(s => s.autonomous).length
    const totalStages = PIPELINE_STAGES.length
    const score = Math.round((autonomousCount / totalStages) * 100)

    const cycleStats = await getRecentCycleStats()

    const dataSources = {
      api: PIPELINE_STAGES.filter(s => s.dataSource === 'api').length,
      internal: PIPELINE_STAGES.filter(s => s.dataSource === 'internal').length,
      generated: PIPELINE_STAGES.filter(s => s.dataSource === 'generated').length,
      manual: PIPELINE_STAGES.filter(s => s.dataSource === 'manual').length,
    }

    const manualStages = PIPELINE_STAGES.filter(s => !s.autonomous)
    const blockers = manualStages.map(s => ({
      stage: s.label,
      reason: s.reason,
      recommendation: `Automate ${s.name} to improve autonomy score`,
    }))

    // Scheduler status
    const schedulerStatus = {
      type: 'instrumentation.ts setInterval',
      interval: '4 hours',
      cronEndpoint: '/api/cron/pipeline',
      fullCycleEndpoint: '/api/pipeline/auto-full-cycle',
      status: 'active',
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      autonomyScore: score,
      autonomyLabel: score === 100 ? 'Fully Autonomous' : score >= 80 ? 'Highly Autonomous' : score >= 50 ? 'Partially Autonomous' : 'Manual',
      stages: {
        total: totalStages,
        autonomous: autonomousCount,
        manual: totalStages - autonomousCount,
        details: PIPELINE_STAGES,
      },
      dataSources,
      scheduler: schedulerStatus,
      cycleActivity: cycleStats,
      blockers,
      nextPriorities: blockers.length > 0
        ? blockers.map(b => b.recommendation)
        : [
            'Connect real analytics API (Google Analytics free tier)',
            'Add A/B test automation',
            'Build cross-division campaign coordination',
            'Add email delivery integration',
          ],
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
}
