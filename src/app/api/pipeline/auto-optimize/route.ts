import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Optimization Engine
 * 
 * Analyzes performance data across all campaigns and brands,
 * identifies patterns, and auto-generates learning rules.
 * 
 * GET  - Preview what optimizations would be generated
 * POST - Run optimization cycle and persist learning rules
 */

interface OptimizationInsight {
  brand: string
  type: string
  insight: string
  rule: string
  confidence: 'high' | 'medium' | 'low'
  appliesTo: string
  loopType: string
}

async function analyzePerformance(): Promise<OptimizationInsight[]> {
  const insights: OptimizationInsight[] = []

  // Get all performance metrics grouped by campaign
  const metrics = await prisma.performanceMetric.findMany({
    include: { campaign: { include: { brandPod: true } } },
    orderBy: { recordedAt: 'desc' },
  })

  if (metrics.length === 0) {
    return [{
      brand: 'ALL',
      type: 'data_gap',
      insight: 'No performance data exists yet. Pipeline needs live campaigns generating metrics.',
      rule: 'Priority: Launch at least one campaign per brand to begin collecting performance data for optimization.',
      confidence: 'high',
      appliesTo: 'campaigns,deployments',
      loopType: 'campaign_pattern',
    }]
  }

  // Group by brand
  const byBrand = new Map<string, typeof metrics>()
  for (const m of metrics) {
    const brand = m.campaign?.brandPod?.brand || 'unknown'
    if (!byBrand.has(brand)) byBrand.set(brand, [])
    byBrand.get(brand)!.push(m)
  }

  for (const [brand, brandMetrics] of byBrand) {
    const totalImpressions = brandMetrics.reduce((s, m) => s + m.impressions, 0)
    const totalClicks = brandMetrics.reduce((s, m) => s + m.clicks, 0)
    const totalLeads = brandMetrics.reduce((s, m) => s + m.leadsGenerated, 0)
    const totalEnrollments = brandMetrics.reduce((s, m) => s + m.enrollments, 0)
    const totalRevenue = brandMetrics.reduce((s, m) => s + m.revenueGenerated, 0)
    const totalSpent = brandMetrics.reduce((s, m) => s + m.budgetSpent, 0)

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const conversionRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0
    const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0

    // CTR analysis
    if (ctr < 1.0 && totalImpressions > 100) {
      insights.push({
        brand, type: 'low_ctr',
        insight: `${brand} CTR is ${ctr.toFixed(2)}% — below 1% threshold. Creative or targeting needs improvement.`,
        rule: `${brand}: Test new ad creatives and refine audience targeting. Current CTR ${ctr.toFixed(2)}% is underperforming. A/B test headlines and images.`,
        confidence: 'high', appliesTo: 'assembly,campaigns', loopType: 'campaign_pattern',
      })
    } else if (ctr > 3.0) {
      insights.push({
        brand, type: 'high_ctr',
        insight: `${brand} CTR is ${ctr.toFixed(2)}% — strong performance. Replicate this creative approach.`,
        rule: `${brand}: Current creative approach achieving ${ctr.toFixed(2)}% CTR. Document and replicate across other campaigns.`,
        confidence: 'high', appliesTo: 'assembly,creative-briefs', loopType: 'campaign_pattern',
      })
    }

    // Conversion analysis
    if (conversionRate < 2.0 && totalClicks > 50) {
      insights.push({
        brand, type: 'low_conversion',
        insight: `${brand} click-to-lead conversion is ${conversionRate.toFixed(1)}%. Landing pages or offer need optimization.`,
        rule: `${brand}: Optimize landing pages and CTAs. ${conversionRate.toFixed(1)}% conversion rate suggests messaging mismatch between ad and landing page.`,
        confidence: 'medium', appliesTo: 'assembly,deployments', loopType: 'funnel_optimization',
      })
    }

    // ROAS analysis
    if (totalSpent > 0) {
      if (roas < 1.0) {
        insights.push({
          brand, type: 'negative_roas',
          insight: `${brand} ROAS is ${roas.toFixed(2)}x — spending more than earning. Pause underperforming channels.`,
          rule: `${brand}: ROAS ${roas.toFixed(2)}x is negative. Audit channel spend, pause lowest performers, reallocate budget to top channels.`,
          confidence: 'high', appliesTo: 'deployments,campaigns', loopType: 'campaign_pattern',
        })
      } else if (roas > 3.0) {
        insights.push({
          brand, type: 'strong_roas',
          insight: `${brand} ROAS is ${roas.toFixed(2)}x — excellent. Consider increasing budget.`,
          rule: `${brand}: ROAS ${roas.toFixed(2)}x is strong. Increase budget allocation by 20% and monitor for diminishing returns.`,
          confidence: 'high', appliesTo: 'campaigns', loopType: 'campaign_pattern',
        })
      }
    }

    // Channel analysis
    const byChannel = new Map<string, { impressions: number; clicks: number; leads: number; revenue: number; spent: number }>()
    for (const m of brandMetrics) {
      const ch = m.channel
      if (!byChannel.has(ch)) byChannel.set(ch, { impressions: 0, clicks: 0, leads: 0, revenue: 0, spent: 0 })
      const c = byChannel.get(ch)!
      c.impressions += m.impressions
      c.clicks += m.clicks
      c.leads += m.leadsGenerated
      c.revenue += m.revenueGenerated
      c.spent += m.budgetSpent
    }

    // Find best and worst channels
    let bestChannel = '', bestChannelROAS = 0
    let worstChannel = '', worstChannelROAS = Infinity
    for (const [ch, data] of byChannel) {
      const chROAS = data.spent > 0 ? data.revenue / data.spent : 0
      if (chROAS > bestChannelROAS) { bestChannel = ch; bestChannelROAS = chROAS }
      if (data.spent > 0 && chROAS < worstChannelROAS) { worstChannel = ch; worstChannelROAS = chROAS }
    }

    if (bestChannel && byChannel.size > 1) {
      insights.push({
        brand, type: 'channel_winner',
        insight: `${brand} best channel: ${bestChannel} (${bestChannelROAS.toFixed(2)}x ROAS). Worst: ${worstChannel} (${worstChannelROAS.toFixed(2)}x).`,
        rule: `${brand}: Shift budget from ${worstChannel} to ${bestChannel}. ${bestChannel} outperforms by ${((bestChannelROAS / (worstChannelROAS || 1)) * 100 - 100).toFixed(0)}%.`,
        confidence: 'medium', appliesTo: 'deployments', loopType: 'campaign_pattern',
      })
    }

    // Enrollment efficiency
    if (totalLeads > 0 && totalEnrollments > 0) {
      const enrollRate = (totalEnrollments / totalLeads) * 100
      if (enrollRate < 10) {
        insights.push({
          brand, type: 'low_enrollment_rate',
          insight: `${brand} lead-to-enrollment rate is ${enrollRate.toFixed(1)}%. Nurture sequences need improvement.`,
          rule: `${brand}: Only ${enrollRate.toFixed(1)}% of leads convert to enrollment. Strengthen email nurture sequence and add SMS follow-ups.`,
          confidence: 'medium', appliesTo: 'campaigns,assembly', loopType: 'funnel_optimization',
        })
      }
    }
  }

  // Cross-brand insights
  if (byBrand.size > 1) {
    const brandPerformance = Array.from(byBrand.entries()).map(([brand, m]) => ({
      brand,
      revenue: m.reduce((s, x) => s + x.revenueGenerated, 0),
      spent: m.reduce((s, x) => s + x.budgetSpent, 0),
    }))
    const topBrand = brandPerformance.sort((a, b) => {
      const roasA = a.spent > 0 ? a.revenue / a.spent : 0
      const roasB = b.spent > 0 ? b.revenue / b.spent : 0
      return roasB - roasA
    })[0]

    if (topBrand && topBrand.spent > 0) {
      insights.push({
        brand: 'ALL', type: 'cross_brand',
        insight: `${topBrand.brand} is the top-performing brand by ROAS. Study its approach for other brands.`,
        rule: `Cross-brand learning: ${topBrand.brand}'s marketing approach should be analyzed and adapted for underperforming brands.`,
        confidence: 'medium', appliesTo: 'intelligence,campaigns', loopType: 'campaign_pattern',
      })
    }
  }

  return insights
}

// Check campaign lifecycle and auto-advance
async function runLifecycleCheck() {
  const now = new Date()
  const actions: string[] = []

  // Auto-advance campaigns with expired schedules
  const expiredLive = await prisma.campaign.findMany({
    where: { status: 'live', endDate: { lt: now } },
    include: { brandPod: true },
  })
  for (const c of expiredLive) {
    await prisma.campaign.update({ where: { id: c.id }, data: { status: 'completed' } })
    actions.push(`${c.brandPod.brand}: "${c.name}" live → completed (end date passed)`)
  }

  // Approved campaigns ready to go live
  const readyToLaunch = await prisma.campaign.findMany({
    where: { status: 'approved', startDate: { lte: now } },
    include: { brandPod: true },
  })
  for (const c of readyToLaunch) {
    await prisma.campaign.update({ where: { id: c.id }, data: { status: 'live' } })
    actions.push(`${c.brandPod.brand}: "${c.name}" approved → live (start date reached)`)
  }

  return actions
}

export async function GET() {
  try {
    const insights = await analyzePerformance()
    const lifecycleActions = await runLifecycleCheck()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      insights,
      lifecycleActions,
      summary: {
        totalInsights: insights.length,
        highConfidence: insights.filter(i => i.confidence === 'high').length,
        mediumConfidence: insights.filter(i => i.confidence === 'medium').length,
        campaignsAdvanced: lifecycleActions.length,
      },
    })
  } catch (error) {
    console.error('[auto-optimize] GET error:', error)
    return NextResponse.json({ error: 'Failed to analyze', details: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const dryRun = body.dryRun === true

    const insights = await analyzePerformance()
    const lifecycleActions = await runLifecycleCheck()

    const createdRules: string[] = []

    if (!dryRun) {
      // Persist insights as learning rules (skip duplicates)
      for (const insight of insights) {
        // Check for existing similar rule
        const existing = await prisma.learningRule.findFirst({
          where: {
            brand: insight.brand,
            loopType: insight.loopType,
            rule: { contains: insight.type },
          },
        })
        if (!existing) {
          await prisma.learningRule.create({
            data: {
              brand: insight.brand,
              dataSource: `auto-optimize: ${insight.type}`,
              rule: insight.rule,
              confidence: insight.confidence,
              appliesTo: insight.appliesTo,
              loopType: insight.loopType,
              status: 'active',
            },
          })
          createdRules.push(insight.rule)
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dryRun,
      insights,
      lifecycleActions,
      rulesCreated: createdRules.length,
      rules: createdRules,
      summary: {
        totalInsights: insights.length,
        newRulesCreated: createdRules.length,
        campaignsAdvanced: lifecycleActions.length,
      },
    })
  } catch (error) {
    console.error('[auto-optimize] POST error:', error)
    return NextResponse.json({ error: 'Optimization failed', details: String(error) }, { status: 500 })
  }
}
