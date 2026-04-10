import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Intelligence Engine
 * 
 * Automatically generates market intelligence entries by:
 * 1. Analyzing current pipeline performance data for patterns
 * 2. Detecting seasonal/timing opportunities
 * 3. Cross-referencing brand performance to surface competitive insights
 * 4. Identifying audience behavior shifts from conversion data
 * 
 * No external APIs needed — derives intelligence from internal pipeline data.
 * 
 * GET  - Preview what intelligence would be generated
 * POST - Run auto-intelligence cycle and persist entries
 */

interface IntelEntry {
  brand: string
  category: string
  source: string
  insight: string
  actionable: boolean
  actionRecommended: string
  priority: string
}

async function generateIntelligence(): Promise<IntelEntry[]> {
  const entries: IntelEntry[] = []
  const today = new Date()
  const dayOfWeek = today.getDay()
  const month = today.getMonth()
  const dateKey = today.toISOString().slice(0, 10)

  // Get all brands
  const brands = await prisma.brandPod.findMany({ where: { status: 'active' } })
  
  // Get recent performance data
  const recentMetrics = await prisma.performanceMetric.findMany({
    orderBy: { recordedAt: 'desc' },
    take: 200,
    include: { campaign: { include: { brandPod: true } } },
  })

  // Get all campaigns
  const campaigns = await prisma.campaign.findMany({
    include: { brandPod: true, performance: { orderBy: { recordedAt: 'desc' }, take: 5 } },
  })

  // === 1. Performance Pattern Analysis ===
  // Group metrics by brand and detect trends
  const brandMetrics = new Map<string, { impressions: number; clicks: number; leads: number; revenue: number; spent: number; count: number }>()
  for (const m of recentMetrics) {
    const brand = m.brand
    if (!brandMetrics.has(brand)) brandMetrics.set(brand, { impressions: 0, clicks: 0, leads: 0, revenue: 0, spent: 0, count: 0 })
    const b = brandMetrics.get(brand)!
    b.impressions += m.impressions
    b.clicks += m.clicks
    b.leads += m.leadsGenerated
    b.revenue += m.revenueGenerated
    b.spent += m.budgetSpent
    b.count++
  }

  for (const [brand, data] of brandMetrics) {
    const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0
    const costPerLead = data.leads > 0 ? data.spent / data.leads : 0
    const roas = data.spent > 0 ? data.revenue / data.spent : 0

    // Audience insight from CTR patterns
    if (ctr > 2.5) {
      entries.push({
        brand,
        category: 'audience',
        source: `auto-intelligence:performance-analysis:${dateKey}`,
        insight: `${brand} achieving ${ctr.toFixed(1)}% CTR across ${data.count} data points — audience targeting is well-calibrated. Current creative resonates strongly.`,
        actionable: true,
        actionRecommended: `Scale budget for ${brand} campaigns maintaining this CTR. Test similar audience segments to expand reach.`,
        priority: 'medium',
      })
    } else if (ctr < 1.0 && data.impressions > 1000) {
      entries.push({
        brand,
        category: 'audience',
        source: `auto-intelligence:performance-analysis:${dateKey}`,
        insight: `${brand} CTR at ${ctr.toFixed(1)}% is below industry average. Audience may be fatigued or targeting too broad.`,
        actionable: true,
        actionRecommended: `Refresh ${brand} ad creatives. Narrow audience targeting. Test new messaging angles.`,
        priority: 'high',
      })
    }

    // Cost efficiency insight
    if (costPerLead > 0 && costPerLead < 30) {
      entries.push({
        brand,
        category: 'pricing',
        source: `auto-intelligence:cost-analysis:${dateKey}`,
        insight: `${brand} cost per lead is $${costPerLead.toFixed(2)} — efficient acquisition. Total ${data.leads} leads from $${data.spent} spend.`,
        actionable: true,
        actionRecommended: `Maintain current ${brand} channel mix. Consider increasing budget while CPL remains favorable.`,
        priority: 'medium',
      })
    } else if (costPerLead > 100) {
      entries.push({
        brand,
        category: 'pricing',
        source: `auto-intelligence:cost-analysis:${dateKey}`,
        insight: `${brand} CPL at $${costPerLead.toFixed(2)} is high. ${data.leads} leads from $${data.spent} spend needs optimization.`,
        actionable: true,
        actionRecommended: `Audit ${brand} underperforming channels. Shift budget to highest-converting channels. Test new landing pages.`,
        priority: 'high',
      })
    }

    // ROAS insight
    if (roas > 2.0) {
      entries.push({
        brand,
        category: 'industry',
        source: `auto-intelligence:roas-analysis:${dateKey}`,
        insight: `${brand} ROAS at ${roas.toFixed(2)}x indicates strong product-market fit in current channels. Revenue: $${data.revenue}, Spend: $${data.spent}.`,
        actionable: true,
        actionRecommended: `${brand} is a growth candidate. Increase budget allocation by 15-25% and monitor for diminishing returns.`,
        priority: 'medium',
      })
    }
  }

  // === 2. Seasonal/Timing Intelligence ===
  const seasonalInsights: Record<number, { season: string; insight: string; action: string }> = {
    0: { season: 'January', insight: 'New Year resolution period — peak for education, self-improvement, health programs.', action: 'Launch enrollment-focused campaigns. Emphasize fresh starts and transformation messaging.' },
    1: { season: 'February', insight: 'Post-resolution drop-off begins. Valentine\'s/community themes emerge.', action: 'Shift to community and belonging messaging. Retarget January leads who didn\'t convert.' },
    2: { season: 'March', insight: 'Spring planning period. Budgets renew for many organizations.', action: 'Push B2B and organizational enrollment campaigns. March Madness tie-ins for sports brands.' },
    3: { season: 'April', insight: 'Tax season ending. Consumers reassess spending. Spring energy.', action: 'Value-focused messaging. Highlight ROI and outcomes in all campaigns.' },
    4: { season: 'May', insight: 'End of academic year. Graduation season. Summer planning.', action: 'Promote summer programs and continuing education. Alumni re-engagement campaigns.' },
    5: { season: 'June', insight: 'Summer kickoff. Attention spans shift. Mobile usage increases.', action: 'Optimize for mobile. Shorter-form content. Video-first creative strategy.' },
    6: { season: 'July', insight: 'Mid-summer. Lower competition in many verticals. CPMs often drop.', action: 'Increase spend to capitalize on lower CPMs. Build audience for fall campaigns.' },
    7: { season: 'August', insight: 'Back-to-school energy. Planning for fall begins.', action: 'Launch fall enrollment campaigns early. Educational content performs well.' },
    8: { season: 'September', insight: 'Fall launch season. Highest engagement in many B2B verticals.', action: 'Full pipeline activation. Launch major campaigns. Content marketing push.' },
    9: { season: 'October', insight: 'Q4 budget decisions. Event season. High engagement period.', action: 'Urgency messaging. Limited-time offers. Event-driven campaigns.' },
    10: { season: 'November', insight: 'Black Friday/Cyber Monday. Highest ad competition. CPMs peak.', action: 'Be strategic with spend — focus on warm audiences. Retargeting over prospecting.' },
    11: { season: 'December', insight: 'Year-end. Reflection and planning. Gift-giving. Budget flush.', action: 'Year-in-review content. Early bird offers for next year. Gift/referral campaigns.' },
  }

  const seasonal = seasonalInsights[month]
  if (seasonal) {
    for (const brand of brands) {
      entries.push({
        brand: brand.brand,
        category: 'seasonal',
        source: `auto-intelligence:seasonal-calendar:${dateKey}`,
        insight: `${seasonal.season} seasonal context for ${brand.brand}: ${seasonal.insight}`,
        actionable: true,
        actionRecommended: `${brand.brand}: ${seasonal.action}`,
        priority: 'medium',
      })
    }
  }

  // === 3. Day-of-Week Timing Intelligence ===
  const dayInsights: Record<number, string> = {
    0: 'Sunday: Lower engagement typical. Good for content prep and scheduling.',
    1: 'Monday: Highest email open rates. Launch email campaigns early AM.',
    2: 'Tuesday: Peak B2B engagement day. Best for LinkedIn and professional content.',
    3: 'Wednesday: Mid-week — good for webinar promotions and educational content.',
    4: 'Thursday: Second-best day for email. Good for event reminders.',
    5: 'Friday: Lower B2B engagement but strong for lifestyle/consumer brands.',
    6: 'Saturday: Social media engagement peaks for consumer brands. Lowest B2B.',
  }

  entries.push({
    brand: 'all',
    category: 'platform',
    source: `auto-intelligence:timing-analysis:${dateKey}`,
    insight: dayInsights[dayOfWeek] || 'Standard engagement day.',
    actionable: true,
    actionRecommended: 'Align campaign deployments and content publishing with day-of-week engagement patterns.',
    priority: 'low',
  })

  // === 4. Pipeline Health Intelligence ===
  const draftCampaigns = campaigns.filter(c => c.status === 'draft')
  const liveCampaigns = campaigns.filter(c => c.status === 'live')
  const stuckCampaigns = campaigns.filter(c => 
    c.status === 'assembling' || c.status === 'quality_gate'
  )

  if (stuckCampaigns.length > 0) {
    entries.push({
      brand: 'all',
      category: 'industry',
      source: `auto-intelligence:pipeline-health:${dateKey}`,
      insight: `${stuckCampaigns.length} campaign(s) stuck in mid-pipeline (assembling/quality_gate): ${stuckCampaigns.map(c => `"${c.name}" (${c.brandPod.brand})`).join(', ')}. Pipeline velocity is reduced.`,
      actionable: true,
      actionRecommended: 'Review stuck campaigns. Check assembly step completion and quality gate failures. Run full-cycle automation to attempt auto-advance.',
      priority: 'high',
    })
  }

  if (draftCampaigns.length > 2) {
    entries.push({
      brand: 'all',
      category: 'industry',
      source: `auto-intelligence:pipeline-health:${dateKey}`,
      insight: `${draftCampaigns.length} campaigns in draft status. Pipeline has inventory ready to activate.`,
      actionable: true,
      actionRecommended: 'Review draft campaigns and set start dates to move them into the active pipeline.',
      priority: 'medium',
    })
  }

  // === 5. Cross-Brand Competitive Intelligence ===
  if (brandMetrics.size > 1) {
    const brandPerf = Array.from(brandMetrics.entries())
      .map(([brand, data]) => ({
        brand,
        roas: data.spent > 0 ? data.revenue / data.spent : 0,
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
        leads: data.leads,
      }))
      .sort((a, b) => b.roas - a.roas)

    const top = brandPerf[0]
    const bottom = brandPerf[brandPerf.length - 1]

    if (top && bottom && top.brand !== bottom.brand) {
      entries.push({
        brand: bottom.brand,
        category: 'competitor',
        source: `auto-intelligence:cross-brand:${dateKey}`,
        insight: `${bottom.brand} (ROAS ${bottom.roas.toFixed(2)}x, CTR ${bottom.ctr.toFixed(1)}%) underperforms vs ${top.brand} (ROAS ${top.roas.toFixed(2)}x, CTR ${top.ctr.toFixed(1)}%). Cross-brand learning opportunity.`,
        actionable: true,
        actionRecommended: `Study ${top.brand}'s channel mix and messaging for application to ${bottom.brand}. Replicate successful creative approaches.`,
        priority: 'high',
      })
    }
  }

  return entries
}

export async function GET() {
  try {
    const entries = await generateIntelligence()
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      entries,
      summary: {
        totalEntries: entries.length,
        byCategory: entries.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byPriority: entries.reduce((acc, e) => {
          acc[e.priority] = (acc[e.priority] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-intelligence] GET error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    const entries = await generateIntelligence()
    const created: string[] = []
    const skipped: string[] = []

    if (!dryRun) {
      const dateKey = new Date().toISOString().slice(0, 10)
      
      for (const entry of entries) {
        // Deduplicate: skip if same source exists today
        const existing = await prisma.intelligenceEntry.findFirst({
          where: { source: entry.source, brand: entry.brand },
        })
        if (existing) {
          skipped.push(`${entry.brand}:${entry.category} (already exists)`)
          continue
        }

        await prisma.intelligenceEntry.create({
          data: {
            ...entry,
            status: 'new',
          },
        })
        created.push(`${entry.brand}:${entry.category} — ${entry.insight.slice(0, 80)}...`)
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      timestamp: new Date().toISOString(),
      entries,
      persisted: { created: created.length, skipped: skipped.length, details: created },
      summary: {
        totalGenerated: entries.length,
        created: created.length,
        skipped: skipped.length,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-intelligence] POST error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
