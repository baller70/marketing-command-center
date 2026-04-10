import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Campaign Generator
 * 
 * Automatically creates new campaigns from:
 * 1. Brand pod strategy + messaging lanes
 * 2. Intelligence insights (seasonal, performance gaps)
 * 3. Pipeline gaps (brands with no active campaigns)
 * 
 * Closes the loop: Intelligence → Campaign Creation → Assembly → ... → Performance → Optimization → Intelligence
 * 
 * GET  - Preview what campaigns would be created
 * POST - Create campaigns (set dryRun:true to preview)
 */

interface CampaignSuggestion {
  brand: string
  name: string
  messagingLane: string
  goal: string
  targetAudience: string
  offer: string
  channels: string[]
  budget: number
  horizon: string
  reason: string
  startDate: Date
  endDate: Date
}

async function generateCampaignSuggestions(): Promise<CampaignSuggestion[]> {
  const suggestions: CampaignSuggestion[] = []
  const now = new Date()
  const month = now.getMonth()
  const dateKey = now.toISOString().slice(0, 10)

  // Get all active brand pods with their messaging lanes
  const brands = await prisma.brandPod.findMany({
    where: { status: 'active' },
    include: { messagingLanes: { where: { status: 'active' } } },
  })

  // Get all active/recent campaigns to avoid duplicates
  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      status: { in: ['draft', 'assembling', 'quality_gate', 'approved', 'live'] },
    },
    include: { brandPod: true },
  })

  // Get recent intelligence for context
  const recentIntel = await prisma.intelligenceEntry.findMany({
    where: { status: 'new', actionable: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Get recent performance to identify best-performing channels
  const recentPerf = await prisma.performanceMetric.findMany({
    orderBy: { recordedAt: 'desc' },
    take: 100,
  })

  // Get active learning rules to inform campaign generation (closes feedback loop)
  const learningRules = await prisma.learningRule.findMany({
    where: { status: 'active' },
  })

  // Build learning context per brand: budget adjustments, channel preferences, insights
  const brandLearning = new Map<string, { budgetMultiplier: number; preferredChannels: string[]; avoidChannels: string[]; notes: string[] }>()
  for (const rule of learningRules) {
    const brand = rule.brand
    if (!brandLearning.has(brand)) {
      brandLearning.set(brand, { budgetMultiplier: 1.0, preferredChannels: [], avoidChannels: [], notes: [] })
    }
    const ctx = brandLearning.get(brand)!
    const ruleLower = rule.rule.toLowerCase()

    // Apply learning: strong ROAS → increase budget
    if (ruleLower.includes('increase budget') || ruleLower.includes('strong') || ruleLower.includes('excellent')) {
      ctx.budgetMultiplier = Math.min(ctx.budgetMultiplier * 1.2, 2.0)
      ctx.notes.push(`Budget +20%: ${rule.rule.slice(0, 60)}`)
    }
    // Apply learning: negative ROAS → decrease budget
    if (ruleLower.includes('negative') || ruleLower.includes('pause') || ruleLower.includes('underperform')) {
      ctx.budgetMultiplier = Math.max(ctx.budgetMultiplier * 0.8, 0.5)
      ctx.notes.push(`Budget -20%: ${rule.rule.slice(0, 60)}`)
    }
    // Apply learning: channel winners/losers
    const shiftMatch = rule.rule.match(/shift budget from (\w+) to (\w+)/i)
    if (shiftMatch) {
      ctx.avoidChannels.push(shiftMatch[1].toLowerCase())
      ctx.preferredChannels.push(shiftMatch[2].toLowerCase())
    }
  }

  // Build channel performance map per brand
  const brandChannelPerf = new Map<string, Map<string, { roas: number; leads: number }>>()
  for (const m of recentPerf) {
    if (!brandChannelPerf.has(m.brand)) brandChannelPerf.set(m.brand, new Map())
    const chMap = brandChannelPerf.get(m.brand)!
    if (!chMap.has(m.channel)) chMap.set(m.channel, { roas: 0, leads: 0 })
    const ch = chMap.get(m.channel)!
    ch.roas = m.budgetSpent > 0 ? m.revenueGenerated / m.budgetSpent : 0
    ch.leads += m.leadsGenerated
  }

  // Seasonal campaign goals
  const seasonalGoals: Record<number, { theme: string; goal: string; offer: string }> = {
    0: { theme: 'New Year Fresh Start', goal: 'enrollment', offer: 'New Year enrollment special' },
    1: { theme: 'February Growth', goal: 'lead_gen', offer: 'Free consultation' },
    2: { theme: 'Spring Launch', goal: 'awareness', offer: 'Spring program preview' },
    3: { theme: 'Q2 Kickoff', goal: 'lead_gen', offer: 'Free trial' },
    4: { theme: 'Summer Prep', goal: 'enrollment', offer: 'Early summer enrollment' },
    5: { theme: 'Summer Program', goal: 'enrollment', offer: 'Summer special pricing' },
    6: { theme: 'Mid-Year Push', goal: 'lead_gen', offer: 'Mid-year assessment' },
    7: { theme: 'Back to School', goal: 'enrollment', offer: 'Fall enrollment open' },
    8: { theme: 'Fall Campaign', goal: 'enrollment', offer: 'Fall season kickoff' },
    9: { theme: 'Q4 Drive', goal: 'lead_gen', offer: 'Year-end opportunity' },
    10: { theme: 'Holiday Special', goal: 'enrollment', offer: 'Holiday enrollment deal' },
    11: { theme: 'Year-End Close', goal: 'retention', offer: 'Loyalty renewal' },
  }

  const seasonal = seasonalGoals[month]
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() + 1) // Start tomorrow
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 30) // 30-day campaign

  for (const brand of brands) {
    // Count active campaigns for this brand
    const brandActiveCampaigns = activeCampaigns.filter(c => c.brandPodId === brand.id)

    // Skip if brand already has 3+ active campaigns
    if (brandActiveCampaigns.length >= 3) continue

    // Get best channels for this brand
    const chPerf = brandChannelPerf.get(brand.brand)
    let bestChannels: string[] = []
    if (chPerf && chPerf.size > 0) {
      bestChannels = Array.from(chPerf.entries())
        .sort((a, b) => b[1].roas - a[1].roas)
        .slice(0, 3)
        .map(([ch]) => ch)
    }

    // Apply learning rule channel preferences
    const learning = brandLearning.get(brand.brand) || brandLearning.get('ALL')
    if (learning) {
      // Prioritize preferred channels from learning rules
      if (learning.preferredChannels.length > 0) {
        const preferred = learning.preferredChannels.filter(ch => !bestChannels.includes(ch))
        bestChannels = [...preferred, ...bestChannels].slice(0, 4)
      }
      // Remove channels learning says to avoid
      if (learning.avoidChannels.length > 0) {
        bestChannels = bestChannels.filter(ch => !learning.avoidChannels.includes(ch))
      }
    }

    // Fallback channels from brand's channel mix
    if (bestChannels.length === 0) {
      const channelMix = brand.channelMix as Record<string, number>
      bestChannels = Object.keys(channelMix).slice(0, 3)
    }
    if (bestChannels.length === 0) {
      bestChannels = ['email', 'social', 'google']
    }

    // Get messaging lanes for this brand
    const lanes = brand.messagingLanes
    if (lanes.length === 0) continue

    // Pick a lane that's not currently in use by active campaigns
    const usedLanes = new Set(brandActiveCampaigns.map(c => c.messagingLane))
    const availableLane = lanes.find(l => !usedLanes.has(l.lane)) || lanes[0]

    // Check for high-priority intelligence suggesting action
    const brandIntel = recentIntel.filter(i => i.brand === brand.brand && i.priority === 'high')
    const hasUrgentIntel = brandIntel.length > 0

    // === Strategy 1: Gap-fill — brand has fewer than 3 active campaigns ===
    if (brandActiveCampaigns.length < 3) {
      const budgetBase = 500
      const budgetMultiplier = learning?.budgetMultiplier || 1.0
      const adjustedBudget = Math.round(budgetBase * budgetMultiplier)
      const learningNotes = learning?.notes?.length ? ` Learning applied: ${learning.notes.join('; ')}` : ''

      suggestions.push({
        brand: brand.brand,
        name: `${brand.brand} — ${seasonal.theme} ${dateKey}`,
        messagingLane: availableLane.lane,
        goal: seasonal.goal,
        targetAudience: brand.audience,
        offer: seasonal.offer,
        channels: bestChannels,
        budget: adjustedBudget,
        horizon: 'H2',
        reason: `Brand has only ${brandActiveCampaigns.length} active campaigns. Auto-generating seasonal ${seasonal.theme} campaign.${learningNotes}`,
        startDate,
        endDate,
      })
    }

    // === Strategy 2: Intel-driven — urgent insights need a campaign response ===
    if (hasUrgentIntel && brandActiveCampaigns.length < 3) {
      const topIntel = brandIntel[0]
      const intelGoal = topIntel.category === 'audience' ? 'lead_gen' 
        : topIntel.category === 'competitor' ? 'awareness'
        : topIntel.category === 'pricing' ? 'enrollment'
        : 'lead_gen'

      suggestions.push({
        brand: brand.brand,
        name: `${brand.brand} — Intel Response ${dateKey}`,
        messagingLane: availableLane.lane,
        goal: intelGoal,
        targetAudience: brand.audience,
        offer: topIntel.actionRecommended?.slice(0, 100) || seasonal.offer,
        channels: bestChannels,
        budget: 300,
        horizon: 'H1',
        reason: `High-priority intel: "${topIntel.insight.slice(0, 100)}..." — auto-creating response campaign.`,
        startDate,
        endDate,
      })
    }
  }

  return suggestions
}

export async function GET() {
  try {
    const suggestions = await generateCampaignSuggestions()
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      suggestions,
      summary: {
        total: suggestions.length,
        byBrand: suggestions.reduce((acc, s) => {
          acc[s.brand] = (acc[s.brand] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-campaigns] GET error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    const suggestions = await generateCampaignSuggestions()
    const created: string[] = []
    const skipped: string[] = []

    if (!dryRun) {
      for (const s of suggestions) {
        // Check for duplicate name
        const existing = await prisma.campaign.findFirst({
          where: { name: s.name },
        })
        if (existing) {
          skipped.push(`"${s.name}" already exists`)
          continue
        }

        // Find brand pod
        const brandPod = await prisma.brandPod.findUnique({
          where: { brand: s.brand },
        })
        if (!brandPod) {
          skipped.push(`Brand pod "${s.brand}" not found`)
          continue
        }

        await prisma.campaign.create({
          data: {
            brandPodId: brandPod.id,
            name: s.name,
            messagingLane: s.messagingLane,
            goal: s.goal,
            targetAudience: s.targetAudience,
            offer: s.offer,
            channels: s.channels,
            budget: s.budget,
            horizon: s.horizon,
            status: 'draft',
            startDate: s.startDate,
            endDate: s.endDate,
          },
        })
        created.push(`"${s.name}" (${s.brand}) — ${s.reason.slice(0, 80)}`)
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      timestamp: new Date().toISOString(),
      suggestions,
      persisted: { created: created.length, skipped: skipped.length, details: created },
      summary: {
        totalSuggested: suggestions.length,
        created: created.length,
        skipped: skipped.length,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-campaigns] POST error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
