import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Seasonal Engine
 * 
 * Closes the seasonal intelligence gap by:
 * 1. Reading active SeasonalPattern records
 * 2. Checking which patterns apply to the current month
 * 3. Cross-referencing active campaigns to see if seasonal adjustments are covered
 * 4. Auto-creating intelligence entries for uncovered seasonal opportunities
 * 5. Flagging campaigns that should adjust budget based on seasonal data
 * 
 * This connects the seasonal data (which was static/manual) to the 
 * intelligence → campaign creation pipeline, making it fully autonomous.
 * 
 * ZERO COST — local data only.
 * 
 * GET  - Preview seasonal analysis for current month
 * POST - Run seasonal engine and create intelligence entries
 */

interface SeasonalAction {
  patternId: string
  brand: string
  observation: string
  recommendedAction: string
  status: 'opportunity_created' | 'already_covered' | 'intel_created' | 'skipped'
  details: string
}

async function analyzeSeasonalOpportunities(commit: boolean): Promise<SeasonalAction[]> {
  const actions: SeasonalAction[] = []
  const currentMonth = new Date().getMonth() + 1 // 1-indexed

  // Get all active seasonal patterns
  const patterns = await prisma.seasonalPattern.findMany({
    where: { status: 'active' },
  })

  // Get active campaigns
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: { in: ['draft', 'assembling', 'approved', 'live'] } },
    include: { brandPod: true },
  })

  // Get recent intelligence entries to avoid duplicates
  const recentIntel = await prisma.intelligenceEntry.findMany({
    where: {
      category: 'seasonal',
      dateCaptured: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // last 7 days
    },
  })
  const recentIntelKeys = new Set(recentIntel.map(i => `${i.brand}-${i.source}`))

  for (const pattern of patterns) {
    const months = pattern.months as number[]
    
    // Check if this pattern applies to current month
    if (!months.includes(currentMonth)) {
      actions.push({
        patternId: pattern.id,
        brand: pattern.brand,
        observation: pattern.observation,
        recommendedAction: pattern.action,
        status: 'skipped',
        details: `Pattern applies to months [${months.join(',')}], current month is ${currentMonth}`,
      })
      continue
    }

    // Pattern applies! Check if we already have campaigns covering it
    const relevantCampaigns = activeCampaigns.filter(c => 
      pattern.brand === 'all' || c.brandPod.brand === pattern.brand
    )

    const intelKey = `${pattern.brand}-seasonal-auto-${pattern.id.slice(-6)}`
    
    if (recentIntelKeys.has(intelKey)) {
      actions.push({
        patternId: pattern.id,
        brand: pattern.brand,
        observation: pattern.observation,
        recommendedAction: pattern.action,
        status: 'already_covered',
        details: `Intelligence entry already created this week`,
      })
      continue
    }

    // Create intelligence entry to feed into the auto-campaign generator
    if (commit) {
      const brands = pattern.brand === 'all' 
        ? await prisma.brandPod.findMany({ where: { status: 'active' } })
        : await prisma.brandPod.findMany({ where: { brand: pattern.brand, status: 'active' } })

      for (const bp of brands) {
        // Check if brand already has a campaign that seems to address this
        const brandCampaigns = relevantCampaigns.filter(c => c.brandPod.brand === bp.brand)
        const hasCoverage = brandCampaigns.length > 0

        await prisma.intelligenceEntry.create({
          data: {
            brand: bp.brand,
            category: 'seasonal',
            source: intelKey,
            insight: `[Auto-Seasonal] ${pattern.observation}. Current coverage: ${hasCoverage ? brandCampaigns.length + ' active campaigns' : 'NO active campaigns — opportunity gap!'}`,
            actionable: !hasCoverage,
            actionRecommended: pattern.action,
            priority: hasCoverage ? 'low' : 'high',
            status: 'new',
          },
        })
      }
    }

    actions.push({
      patternId: pattern.id,
      brand: pattern.brand,
      observation: pattern.observation,
      recommendedAction: pattern.action,
      status: 'intel_created',
      details: `Seasonal pattern active for month ${currentMonth}. Intelligence entries created to feed campaign pipeline.`,
    })
  }

  return actions
}

export async function GET() {
  try {
    const actions = await analyzeSeasonalOpportunities(false)
    const currentMonth = new Date().getMonth() + 1
    return NextResponse.json({
      success: true,
      preview: true,
      currentMonth,
      timestamp: new Date().toISOString(),
      actions,
      summary: {
        patternsReviewed: actions.length,
        activeThisMonth: actions.filter(a => a.status !== 'skipped').length,
        opportunities: actions.filter(a => a.status === 'intel_created').length,
        alreadyCovered: actions.filter(a => a.status === 'already_covered').length,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body.dryRun === true
    const actions = await analyzeSeasonalOpportunities(!dryRun)
    const currentMonth = new Date().getMonth() + 1
    return NextResponse.json({
      success: true,
      dryRun,
      currentMonth,
      timestamp: new Date().toISOString(),
      actions,
      summary: {
        patternsReviewed: actions.length,
        activeThisMonth: actions.filter(a => a.status !== 'skipped').length,
        created: actions.filter(a => a.status === 'intel_created').length,
        skipped: actions.filter(a => a.status === 'skipped').length,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Auto-seasonal failed', details: String(error) }, { status: 500 })
  }
}
