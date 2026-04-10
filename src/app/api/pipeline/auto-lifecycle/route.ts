import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Lifecycle Manager
 * 
 * Handles campaign lifecycle transitions that previously required manual intervention:
 * 1. Completes campaigns past their end date
 * 2. Archives completed campaigns older than 90 days
 * 3. Frees up campaign slots so auto-campaigns can generate new ones
 * 
 * This closes a critical gap: without lifecycle management, brands hit the 
 * 3-campaign cap and no new campaigns get created, stalling the pipeline.
 * 
 * GET  - Preview lifecycle actions
 * POST - Execute lifecycle transitions
 */

interface LifecycleAction {
  campaignId: string
  campaignName: string
  brand: string
  action: 'complete' | 'archive'
  reason: string
}

async function identifyLifecycleActions(): Promise<LifecycleAction[]> {
  const actions: LifecycleAction[] = []
  const now = new Date()
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // 1. Campaigns past their end date that are still live → complete them
  const expiredLive = await prisma.campaign.findMany({
    where: {
      status: 'live',
      endDate: { lte: now },
    },
    include: { brandPod: true },
  })

  for (const c of expiredLive) {
    actions.push({
      campaignId: c.id,
      campaignName: c.name,
      brand: c.brandPod?.brand || 'unknown',
      action: 'complete',
      reason: `Campaign ended ${c.endDate?.toISOString().slice(0, 10)} — auto-completing`,
    })
  }

  // 1b. Live campaigns >80% through duration with poor performance → complete early
  const liveCampaigns = await prisma.campaign.findMany({
    where: {
      status: 'live',
      startDate: { not: null },
      endDate: { gt: now },
    },
    include: { brandPod: true },
  })

  for (const c of liveCampaigns) {
    if (!c.startDate || !c.endDate) continue
    const totalDuration = c.endDate.getTime() - c.startDate.getTime()
    const elapsed = now.getTime() - c.startDate.getTime()
    const pctComplete = totalDuration > 0 ? elapsed / totalDuration : 0

    if (pctComplete < 0.8) continue // Only consider campaigns >80% through

    // Check recent performance
    const recentPerf = await prisma.performanceMetric.findMany({
      where: {
        campaignId: c.id,
        recordedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    })

    if (recentPerf.length === 0) {
      // No performance data after 80% duration — stale campaign, complete it
      actions.push({
        campaignId: c.id,
        campaignName: c.name,
        brand: c.brandPod?.brand || 'unknown',
        action: 'complete',
        reason: `Campaign ${Math.round(pctComplete * 100)}% through duration with no recent performance data — auto-completing to free slot`,
      })
    } else {
      // Check if performance is poor (low engagement)
      const avgLeads = recentPerf.reduce((sum, p) => sum + p.leadsGenerated, 0) / recentPerf.length
      if (avgLeads < 1 && pctComplete > 0.9) {
        actions.push({
          campaignId: c.id,
          campaignName: c.name,
          brand: c.brandPod?.brand || 'unknown',
          action: 'complete',
          reason: `Campaign ${Math.round(pctComplete * 100)}% through with avg ${avgLeads.toFixed(1)} leads/period — auto-completing underperformer`,
        })
      }
    }
  }

  // 2. Completed campaigns older than 90 days → archive
  const oldCompleted = await prisma.campaign.findMany({
    where: {
      status: 'completed',
      updatedAt: { lte: ninetyDaysAgo },
    },
    include: { brandPod: true },
  })

  for (const c of oldCompleted) {
    actions.push({
      campaignId: c.id,
      campaignName: c.name,
      brand: c.brandPod?.brand || 'unknown',
      action: 'archive',
      reason: `Completed 90+ days ago — auto-archiving`,
    })
  }

  return actions
}

export async function GET() {
  try {
    const actions = await identifyLifecycleActions()
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      actions,
      summary: {
        total: actions.length,
        complete: actions.filter(a => a.action === 'complete').length,
        archive: actions.filter(a => a.action === 'archive').length,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-lifecycle] GET:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    const actions = await identifyLifecycleActions()
    const executed: string[] = []
    const errors: string[] = []

    if (!dryRun) {
      for (const action of actions) {
        try {
          if (action.action === 'complete') {
            await prisma.campaign.update({
              where: { id: action.campaignId },
              data: { status: 'completed' },
            })
          } else if (action.action === 'archive') {
            await prisma.campaign.update({
              where: { id: action.campaignId },
              data: { status: 'archived' },
            })
          }
          executed.push(`${action.action}: "${action.campaignName}" — ${action.reason}`)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          console.error('[auto-lifecycle] action:', msg, err)
          errors.push(`Failed to ${action.action} "${action.campaignName}"`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      timestamp: new Date().toISOString(),
      actions,
      executed: executed.length,
      errors: errors.length,
      details: { executed, errors },
      summary: `Lifecycle: ${executed.length} actions executed, ${errors.length} errors`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-lifecycle] POST:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
