import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Brief Advancement Engine
 * 
 * Closes the creative brief bottleneck by auto-advancing brief statuses:
 * - submitted → acknowledged (immediate — auto-acknowledge all submitted briefs)
 * - acknowledged → in_production (if campaign is assembling or later)
 * - in_production → delivered (if campaign has content assets or assembly steps completed)
 * 
 * This was the missing link: briefs were auto-created but never auto-advanced,
 * creating a permanent bottleneck at "submitted" status.
 * 
 * ZERO COST — local data only.
 * 
 * GET  - Preview what briefs would be advanced
 * POST - Run auto-advancement cycle
 */

interface BriefAction {
  briefId: string
  brand: string
  campaignName: string
  fromStatus: string
  toStatus: string
  reason: string
}

async function runBriefAdvancement(commit: boolean): Promise<BriefAction[]> {
  const actions: BriefAction[] = []

  // 1. submitted → acknowledged (auto-acknowledge all submitted briefs)
  const submittedBriefs = await prisma.creativeBrief.findMany({
    where: { status: 'submitted' },
  })

  for (const brief of submittedBriefs) {
    actions.push({
      briefId: brief.id,
      brand: brief.brand,
      campaignName: brief.campaignName,
      fromStatus: 'submitted',
      toStatus: 'acknowledged',
      reason: 'Auto-acknowledged by pipeline automation',
    })
    if (commit) {
      await prisma.creativeBrief.update({
        where: { id: brief.id },
        data: { status: 'acknowledged' },
      })
    }
  }

  // 2. acknowledged → in_production (if matching campaign exists and is assembling+)
  const acknowledgedBriefs = await prisma.creativeBrief.findMany({
    where: { status: 'acknowledged' },
  })

  for (const brief of acknowledgedBriefs) {
    const campaign = await prisma.campaign.findFirst({
      where: {
        name: brief.campaignName,
        status: { in: ['assembling', 'quality_gate', 'approved', 'live'] },
      },
    })
    if (campaign) {
      actions.push({
        briefId: brief.id,
        brand: brief.brand,
        campaignName: brief.campaignName,
        fromStatus: 'acknowledged',
        toStatus: 'in_production',
        reason: `Campaign "${campaign.name}" is in ${campaign.status} — production can begin`,
      })
      if (commit) {
        await prisma.creativeBrief.update({
          where: { id: brief.id },
          data: { status: 'in_production' },
        })
      }
    }
  }

  // 3. in_production → delivered (if campaign is approved or live, meaning assets are ready)
  const inProductionBriefs = await prisma.creativeBrief.findMany({
    where: { status: 'in_production' },
  })

  for (const brief of inProductionBriefs) {
    const campaign = await prisma.campaign.findFirst({
      where: {
        name: brief.campaignName,
        status: { in: ['approved', 'live', 'completed'] },
      },
    })
    if (campaign) {
      actions.push({
        briefId: brief.id,
        brand: brief.brand,
        campaignName: brief.campaignName,
        fromStatus: 'in_production',
        toStatus: 'delivered',
        reason: `Campaign "${campaign.name}" is ${campaign.status} — marking brief as delivered`,
      })
      if (commit) {
        await prisma.creativeBrief.update({
          where: { id: brief.id },
          data: { status: 'delivered' },
        })
      }
    }
  }

  return actions
}

export async function GET(req: NextRequest) {
  try {
    const actions = await runBriefAdvancement(false)
    return NextResponse.json({
      success: true,
      dryRun: true,
      wouldAdvance: actions.length,
      actions,
    })
  } catch (error) {
    console.error('[auto-brief-advance] GET error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body.dryRun === true
    const actions = await runBriefAdvancement(!dryRun)
    return NextResponse.json({
      success: true,
      dryRun,
      advanced: actions.length,
      actions,
    })
  } catch (error) {
    console.error('[auto-brief-advance] POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
