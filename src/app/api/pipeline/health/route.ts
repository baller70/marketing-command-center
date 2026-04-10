import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { mautic } from '@/lib/integrations/mautic'
import { formbricks } from '@/lib/integrations/formbricks'

/**
 * Pipeline Health Monitor
 * 
 * Provides a comprehensive health check for the marketing pipeline.
 * Designed to be called by:
 * - Committee hub health checks
 * - External monitoring
 * - Internal instrumentation
 * 
 * Checks:
 * 1. Database connectivity
 * 2. Pipeline stage counts and flow rates
 * 3. Stale campaign detection (stuck in a stage too long)
 * 4. Intelligence freshness (are RSS feeds still flowing?)
 * 5. Learning rule health (are rules being generated?)
 * 6. Performance data recency
 * 7. Committee hub connectivity
 * 
 * Returns a traffic-light status: green / yellow / red
 */

const COMMITTEE_HUB_URL = process.env.COMMITTEE_URL || process.env.COMMITTEE_HUB_URL || 'http://localhost:3019'

interface HealthCheck {
  name: string
  status: 'green' | 'yellow' | 'red'
  message: string
  details?: Record<string, unknown>
}

async function checkDatabaseConnectivity(): Promise<HealthCheck> {
  try {
    await prisma.campaign.count()
    return { name: 'database', status: 'green', message: 'Database connected' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[health] database check:', msg, err)
    return { name: 'database', status: 'red', message: 'Database error' }
  }
}

async function checkPipelineFlow(): Promise<HealthCheck> {
  const counts = await Promise.all([
    prisma.campaign.count({ where: { status: 'draft' } }),
    prisma.campaign.count({ where: { status: 'assembling' } }),
    prisma.campaign.count({ where: { status: 'live' } }),
    prisma.campaign.count({ where: { status: 'completed' } }),
    prisma.campaign.count(),
  ])
  const [draft, assembling, live, completed, total] = counts

  if (total === 0) {
    return { name: 'pipeline_flow', status: 'red', message: 'No campaigns in pipeline', details: { draft, assembling, live, completed, total } }
  }
  if (live === 0 && total > 0) {
    return { name: 'pipeline_flow', status: 'yellow', message: 'No live campaigns — pipeline may be stalled', details: { draft, assembling, live, completed, total } }
  }
  return { name: 'pipeline_flow', status: 'green', message: `${live} live, ${total} total campaigns`, details: { draft, assembling, live, completed, total } }
}

async function checkStaleCampaigns(): Promise<HealthCheck> {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const stale = await prisma.campaign.findMany({
    where: {
      status: { in: ['assembling', 'quality_gate'] },
      updatedAt: { lte: threeDaysAgo },
    },
    select: { name: true, status: true, updatedAt: true },
  })

  if (stale.length > 3) {
    return { name: 'stale_campaigns', status: 'red', message: `${stale.length} campaigns stuck for 3+ days`, details: { stale: stale.map(c => `${c.name} (${c.status})`) } }
  }
  if (stale.length > 0) {
    return { name: 'stale_campaigns', status: 'yellow', message: `${stale.length} campaign(s) stuck for 3+ days`, details: { stale: stale.map(c => `${c.name} (${c.status})`) } }
  }
  return { name: 'stale_campaigns', status: 'green', message: 'No stale campaigns' }
}

async function checkIntelligenceFreshness(): Promise<HealthCheck> {
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const recentIntel = await prisma.intelligenceEntry.count({
    where: { createdAt: { gte: oneDayAgo } },
  })
  const totalIntel = await prisma.intelligenceEntry.count()

  if (totalIntel === 0) {
    return { name: 'intelligence', status: 'red', message: 'No intelligence entries at all', details: { recent24h: recentIntel, total: totalIntel } }
  }
  if (recentIntel === 0) {
    return { name: 'intelligence', status: 'yellow', message: 'No new intelligence in 24h — RSS feeds may be stale', details: { recent24h: recentIntel, total: totalIntel } }
  }
  return { name: 'intelligence', status: 'green', message: `${recentIntel} new intel entries in 24h`, details: { recent24h: recentIntel, total: totalIntel } }
}

async function checkLearningRules(): Promise<HealthCheck> {
  const [total, active] = await Promise.all([
    prisma.learningRule.count(),
    prisma.learningRule.count({ where: { status: 'active' } }),
  ])

  if (total === 0) {
    return { name: 'learning', status: 'yellow', message: 'No learning rules generated yet', details: { total, active } }
  }
  if (active === 0) {
    return { name: 'learning', status: 'yellow', message: 'No active learning rules', details: { total, active } }
  }
  return { name: 'learning', status: 'green', message: `${active} active learning rules`, details: { total, active } }
}

async function checkPerformanceData(): Promise<HealthCheck> {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const [total, recent] = await Promise.all([
    prisma.performanceMetric.count(),
    prisma.performanceMetric.count({ where: { recordedAt: { gte: threeDaysAgo } } }),
  ])

  if (total === 0) {
    return { name: 'performance_data', status: 'red', message: 'No performance data', details: { total, recent3d: recent } }
  }
  if (recent === 0) {
    return { name: 'performance_data', status: 'yellow', message: 'No performance data in 3 days', details: { total, recent3d: recent } }
  }
  return { name: 'performance_data', status: 'green', message: `${recent} perf records in last 3 days`, details: { total, recent3d: recent } }
}

async function checkCommitteeHubConnectivity(): Promise<HealthCheck> {
  try {
    const res = await fetch(`${COMMITTEE_HUB_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      return { name: 'committee_hub', status: 'green', message: 'Committee hub reachable' }
    }
    // External dependency — degraded, not critical to marketing operations
    return { name: 'committee_hub', status: 'yellow', message: `Committee hub returned ${res.status} (external dependency — marketing pipeline unaffected)` }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[health] committee_hub:', msg, err)
    return { name: 'committee_hub', status: 'yellow', message: 'Committee hub unreachable (external dependency — marketing pipeline unaffected)' }
  }
}

async function checkCampaignLifecycle(): Promise<HealthCheck> {
  // Check for campaigns that have been live for 30+ days with no end date management
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const expiredCampaigns = await prisma.campaign.findMany({
    where: {
      status: 'live',
      endDate: { lte: new Date() },
    },
    select: { id: true, name: true, endDate: true },
  })

  const longRunning = await prisma.campaign.count({
    where: {
      status: 'live',
      startDate: { lte: thirtyDaysAgo },
      endDate: { gt: new Date() },
    },
  })

  if (expiredCampaigns.length > 0) {
    return {
      name: 'campaign_lifecycle',
      status: 'yellow',
      message: `${expiredCampaigns.length} campaign(s) past end date but still live`,
      details: { expired: expiredCampaigns.map(c => c.name), longRunning },
    }
  }
  return {
    name: 'campaign_lifecycle',
    status: 'green',
    message: `All live campaigns within date range. ${longRunning} running 30+ days.`,
    details: { expired: 0, longRunning },
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

async function checkMautic(): Promise<HealthCheck> {
  return withTimeout(
    (async () => {
      try {
        const segments = await mautic.listSegments()
        return { name: 'mautic' as const, status: 'green' as const, message: `Mautic connected — ${segments?.total || 0} segments` }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[health] mautic:', msg, err)
        return { name: 'mautic' as const, status: 'yellow' as const, message: 'Mautic unreachable' }
      }
    })(),
    3000,
    { name: 'mautic', status: 'yellow' as const, message: 'Mautic health check timed out (3s)' }
  )
}

async function checkFormbricks(): Promise<HealthCheck> {
  return withTimeout(
    (async () => {
      try {
        const ok = await formbricks.isHealthy()
        return ok
          ? { name: 'formbricks' as const, status: 'green' as const, message: 'Formbricks connected' }
          : { name: 'formbricks' as const, status: 'yellow' as const, message: 'Formbricks not configured' }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[health] formbricks:', msg, err)
        return { name: 'formbricks' as const, status: 'yellow' as const, message: 'Formbricks unreachable' }
      }
    })(),
    3000,
    { name: 'formbricks', status: 'yellow' as const, message: 'Formbricks health check timed out (3s)' }
  )
}

export async function GET() {
  try {
    const checks = await Promise.all([
      checkDatabaseConnectivity(),
      checkPipelineFlow(),
      checkStaleCampaigns(),
      checkIntelligenceFreshness(),
      checkLearningRules(),
      checkPerformanceData(),
      checkCampaignLifecycle(),
      checkCommitteeHubConnectivity(),
      checkMautic(),
      checkFormbricks(),
    ])

    const redCount = checks.filter(c => c.status === 'red').length
    const yellowCount = checks.filter(c => c.status === 'yellow').length

    const overallStatus = redCount > 0 ? 'red' : yellowCount > 2 ? 'yellow' : yellowCount > 0 ? 'yellow' : 'green'

    return NextResponse.json({
      success: true,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      summary: {
        green: checks.filter(c => c.status === 'green').length,
        yellow: yellowCount,
        red: redCount,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[health] GET:', msg, err)
    return NextResponse.json(
      {
        success: false,
        status: 'red',
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
