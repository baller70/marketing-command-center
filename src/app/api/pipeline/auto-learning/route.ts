import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Learning Engine
 * 
 * Closes the learning feedback loop by mining performance data
 * and generating actionable LearningRules automatically.
 * 
 * For each active brand pod:
 * 1. Analyze completed campaign performance patterns
 * 2. Identify top-performing channels, audiences, goals
 * 3. Detect underperforming patterns to avoid
 * 4. Generate LearningRules with confidence levels
 * 5. Deprecate stale rules that no longer hold
 * 
 * ZERO COST — uses only local data, no external APIs.
 */

export async function POST(req: NextRequest) {
  try {
    const brands = await prisma.brandPod.findMany({ where: { status: 'active' } })
    const created: Array<{ brand: string; rule: string; loopType: string; confidence: string }> = []
    const deprecated: string[] = []

    for (const bp of brands) {
      // Get campaigns with performance data
      const campaigns = await prisma.campaign.findMany({
        where: { brandPodId: bp.id, status: { in: ['live', 'completed'] } },
        include: { performance: true },
      })

      if (campaigns.length === 0) continue

      // Check if we already generated learning rules this month
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const existingThisMonth = await prisma.learningRule.findFirst({
        where: {
          brand: bp.brand,
          loopType: 'campaign_pattern',
          createdAt: { gte: monthStart },
        },
      })
      if (existingThisMonth) continue

      // Aggregate performance by channel
      const channelPerf: Record<string, { impressions: number; clicks: number; leads: number; spend: number; revenue: number; count: number }> = {}
      // Aggregate by goal
      const goalPerf: Record<string, { campaigns: number; totalLeads: number; totalRevenue: number; totalSpend: number }> = {}

      for (const c of campaigns) {
        // Goal aggregation
        const goal = c.goal || 'unknown'
        if (!goalPerf[goal]) goalPerf[goal] = { campaigns: 0, totalLeads: 0, totalRevenue: 0, totalSpend: 0 }
        goalPerf[goal].campaigns++

        for (const pm of c.performance) {
          // Channel aggregation
          if (!channelPerf[pm.channel]) {
            channelPerf[pm.channel] = { impressions: 0, clicks: 0, leads: 0, spend: 0, revenue: 0, count: 0 }
          }
          channelPerf[pm.channel].impressions += pm.impressions
          channelPerf[pm.channel].clicks += pm.clicks
          channelPerf[pm.channel].leads += pm.leadsGenerated
          channelPerf[pm.channel].spend += pm.budgetSpent || 0
          channelPerf[pm.channel].revenue += pm.revenueGenerated || 0
          channelPerf[pm.channel].count++

          goalPerf[goal].totalLeads += pm.leadsGenerated
          goalPerf[goal].totalRevenue += pm.revenueGenerated || 0
          goalPerf[goal].totalSpend += pm.budgetSpent || 0
        }
      }

      // Rule 1: Best performing channel by CTR
      const channelEntries = Object.entries(channelPerf).filter(([, v]) => v.impressions > 0)
      if (channelEntries.length > 1) {
        const sorted = channelEntries.sort((a, b) => {
          const ctrA = a[1].impressions > 0 ? a[1].clicks / a[1].impressions : 0
          const ctrB = b[1].impressions > 0 ? b[1].clicks / b[1].impressions : 0
          return ctrB - ctrA
        })
        const best = sorted[0]
        const bestCtr = ((best[1].clicks / best[1].impressions) * 100).toFixed(2)
        const confidence = best[1].count >= 5 ? 'high' : best[1].count >= 2 ? 'medium' : 'low'

        const rule = `${best[0]} is the top channel for ${bp.brand} with ${bestCtr}% CTR across ${best[1].count} data points. Prioritize ${best[0]} for engagement campaigns.`
        await prisma.learningRule.create({
          data: {
            brand: bp.brand,
            dataSource: `${campaigns.length} campaigns, ${channelEntries.reduce((s, [, v]) => s + v.count, 0)} performance records`,
            rule,
            confidence,
            appliesTo: 'campaigns,creative-briefs',
            loopType: 'campaign_pattern',
            status: 'active',
          },
        })
        created.push({ brand: bp.brand, rule, loopType: 'campaign_pattern', confidence })
      }

      // Rule 2: Best goal type by ROAS
      const goalEntries = Object.entries(goalPerf).filter(([, v]) => v.totalSpend > 0)
      if (goalEntries.length > 1) {
        const sorted = goalEntries.sort((a, b) => {
          const roasA = a[1].totalSpend > 0 ? a[1].totalRevenue / a[1].totalSpend : 0
          const roasB = b[1].totalSpend > 0 ? b[1].totalRevenue / b[1].totalSpend : 0
          return roasB - roasA
        })
        const best = sorted[0]
        const bestRoas = (best[1].totalRevenue / best[1].totalSpend).toFixed(2)
        const confidence = best[1].campaigns >= 3 ? 'high' : 'medium'

        const rule = `${best[0]} campaigns yield best ROAS (${bestRoas}x) for ${bp.brand}. Consider increasing allocation to ${best[0]} goals.`
        await prisma.learningRule.create({
          data: {
            brand: bp.brand,
            dataSource: `${best[1].campaigns} ${best[0]} campaigns`,
            rule,
            confidence,
            appliesTo: 'campaigns,funnels',
            loopType: 'funnel_optimization',
            status: 'active',
          },
        })
        created.push({ brand: bp.brand, rule, loopType: 'funnel_optimization', confidence })
      }

      // Rule 3: Identify underperforming channels to flag
      if (channelEntries.length > 1) {
        const sorted = channelEntries.sort((a, b) => {
          const ctrA = a[1].impressions > 0 ? a[1].clicks / a[1].impressions : 0
          const ctrB = b[1].impressions > 0 ? b[1].clicks / b[1].impressions : 0
          return ctrA - ctrB
        })
        const worst = sorted[0]
        const worstCtr = ((worst[1].clicks / Math.max(worst[1].impressions, 1)) * 100).toFixed(2)

        if (parseFloat(worstCtr) < 1.0 && worst[1].count >= 2) {
          const rule = `${worst[0]} underperforms for ${bp.brand} (${worstCtr}% CTR). Review creative or consider reallocation.`
          await prisma.learningRule.create({
            data: {
              brand: bp.brand,
              dataSource: `${worst[1].count} ${worst[0]} performance records`,
              rule,
              confidence: worst[1].count >= 4 ? 'high' : 'medium',
              appliesTo: 'campaigns,content-assets',
              loopType: 'content_feedback',
              status: 'active',
            },
          })
          created.push({ brand: bp.brand, rule, loopType: 'content_feedback', confidence: worst[1].count >= 4 ? 'high' : 'medium' })
        }
      }
    }

    // Deprecate old rules (>90 days) that have low confidence and no recent data
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const staleRules = await prisma.learningRule.findMany({
      where: {
        status: 'active',
        confidence: 'low',
        updatedAt: { lt: ninetyDaysAgo },
      },
    })
    for (const sr of staleRules) {
      await prisma.learningRule.update({
        where: { id: sr.id },
        data: { status: 'deprecated' },
      })
      deprecated.push(`${sr.brand}: ${sr.rule.substring(0, 60)}...`)
    }

    return NextResponse.json({
      success: true,
      summary: {
        brandsAnalyzed: brands.length,
        rulesCreated: created.length,
        rulesDeprecated: deprecated.length,
      },
      created,
      deprecated,
    })
  } catch (error) {
    console.error('[auto-learning] error:', error)
    return NextResponse.json({ error: 'Auto-learning failed', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    stage: 'auto-learning',
    description: 'Mines performance data to auto-generate learning rules',
    method: 'POST to trigger',
  })
}
