import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Marketing Pipeline Automation API
 * 
 * GET  - Returns automation status & pipeline health summary
 * POST - Triggers automation actions:
 *   action: "lifecycle"    - Auto-advance campaigns based on dates/status
 *   action: "briefs"       - Auto-generate creative briefs for campaigns missing them
 *   action: "status-report" - Generate pipeline status report
 *   action: "full-cycle"   - Run all automations in sequence
 */

// Auto-advance campaign statuses based on dates
async function runLifecycleAutomation() {
  const now = new Date()
  const actions: string[] = []

  // Draft campaigns with start date in the past → assembling
  const draftsToActivate = await prisma.campaign.findMany({
    where: {
      status: 'draft',
      startDate: { lte: now },
    },
    include: { brandPod: true },
  })
  for (const c of draftsToActivate) {
    await prisma.campaign.update({
      where: { id: c.id },
      data: { status: 'assembling' },
    })
    actions.push(`Campaign "${c.name}" (${c.brandPod.brand}): draft → assembling`)
  }

  // Live campaigns past end date → completed
  const liveToComplete = await prisma.campaign.findMany({
    where: {
      status: 'live',
      endDate: { lte: now },
    },
    include: { brandPod: true },
  })
  for (const c of liveToComplete) {
    await prisma.campaign.update({
      where: { id: c.id },
      data: { status: 'completed' },
    })
    actions.push(`Campaign "${c.name}" (${c.brandPod.brand}): live → completed`)
  }

  // Approved campaigns with start date today or past → live
  const approvedToLive = await prisma.campaign.findMany({
    where: {
      status: 'approved',
      startDate: { lte: now },
    },
    include: { brandPod: true },
  })
  for (const c of approvedToLive) {
    await prisma.campaign.update({
      where: { id: c.id },
      data: { status: 'live' },
    })
    actions.push(`Campaign "${c.name}" (${c.brandPod.brand}): approved → live`)
  }

  return { transitioned: actions.length, actions }
}

// Auto-generate creative briefs for campaigns that don't have one
async function runBriefGeneration() {
  const generated: string[] = []

  // Find campaigns in assembling/approved status without a creative brief
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: { in: ['assembling', 'approved', 'live'] },
    },
    include: { brandPod: true },
  })

  for (const c of campaigns) {
    // Check if brief already exists for this campaign
    const existingBrief = await prisma.creativeBrief.findFirst({
      where: { campaignName: c.name, brand: c.brandPod.brand },
    })
    if (existingBrief) continue

    // Auto-generate brief from campaign data
    await prisma.creativeBrief.create({
      data: {
        brand: c.brandPod.brand,
        campaignName: c.name,
        campaignGoal: c.goal,
        targetAudience: c.targetAudience,
        messagingLane: c.messagingLane,
        keyMessage: `${c.brandPod.coreMessage} — ${c.goal} campaign targeting ${c.targetAudience}`,
        cta: c.goal === 'enrollment' ? 'Enroll Now' :
             c.goal === 'sign_up' ? 'Sign Up Free' :
             c.goal === 'lead_gen' ? 'Learn More' :
             c.goal === 'awareness' ? 'Discover More' : 'Get Started',
        assetsNeeded: JSON.parse(JSON.stringify(
          (c.channels as string[]).map((ch: string) => ({
            type: ch === 'email' ? 'email_template' :
                  ch === 'social' ? 'social_graphic' :
                  ch === 'video' ? 'video_ad' : 'banner',
            quantity: 1,
            platform: ch,
            requirements: `Auto-generated for ${c.name}`,
          }))
        )),
        priority: c.horizon === 'H1' ? 'urgent' : 'standard',
        deadline: c.startDate || undefined,
        status: 'submitted',
      },
    })
    generated.push(`Brief auto-generated for "${c.name}" (${c.brandPod.brand})`)
  }

  return { generated: generated.length, briefs: generated }
}

// Generate pipeline status report
async function generateStatusReport() {
  const [
    totalCampaigns,
    draftCount,
    assemblingCount,
    liveCount,
    completedCount,
    totalBriefs,
    pendingBriefs,
    totalPerf,
  ] = await Promise.all([
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: 'draft' } }),
    prisma.campaign.count({ where: { status: 'assembling' } }),
    prisma.campaign.count({ where: { status: 'live' } }),
    prisma.campaign.count({ where: { status: 'completed' } }),
    prisma.creativeBrief.count(),
    prisma.creativeBrief.count({ where: { status: { in: ['submitted', 'acknowledged'] } } }),
    prisma.performanceMetric.count(),
  ])

  // Get aggregate performance
  const perfData = await prisma.performanceMetric.aggregate({
    _sum: {
      impressions: true,
      clicks: true,
      leadsGenerated: true,
      enrollments: true,
      revenueGenerated: true,
      budgetSpent: true,
    },
  })

  const s = perfData._sum
  return {
    timestamp: new Date().toISOString(),
    pipeline: {
      total: totalCampaigns,
      draft: draftCount,
      assembling: assemblingCount,
      live: liveCount,
      completed: completedCount,
      other: totalCampaigns - draftCount - assemblingCount - liveCount - completedCount,
    },
    briefs: { total: totalBriefs, pending: pendingBriefs },
    performance: {
      dataPoints: totalPerf,
      totalImpressions: s.impressions || 0,
      totalClicks: s.clicks || 0,
      totalLeads: s.leadsGenerated || 0,
      totalEnrollments: s.enrollments || 0,
      totalRevenue: s.revenueGenerated || 0,
      totalSpent: s.budgetSpent || 0,
      ctr: (s.impressions || 0) > 0
        ? (((s.clicks || 0) / (s.impressions || 1)) * 100).toFixed(2) + '%'
        : 'N/A',
      roas: (s.budgetSpent || 0) > 0
        ? ((s.revenueGenerated || 0) / (s.budgetSpent || 1)).toFixed(2) + 'x'
        : 'N/A',
    },
  }
}

export async function GET() {
  try {
    const report = await generateStatusReport()
    return NextResponse.json({
      success: true,
      automation: {
        available: ['rss-intel', 'seasonal', 'intelligence', 'campaigns', 'lifecycle', 'briefs', 'brief-advance', 'content-assets', 'assembly', 'quality-gate', 'deploy', 'optimize', 'learning', 'report-committee', 'status-report', 'full-cycle'],
        description: 'POST with { "action": "<name>" } to trigger automation',
      },
      ...report,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[automation] GET error:', msg, err)
    return NextResponse.json({ error: 'Failed to get automation status' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = body.action as string

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    const results: Record<string, unknown> = { action, timestamp: new Date().toISOString() }

    switch (action) {
      case 'lifecycle': {
        results.lifecycle = await runLifecycleAutomation()
        break
      }
      case 'briefs': {
        results.briefs = await runBriefGeneration()
        break
      }
      case 'status-report': {
        results.report = await generateStatusReport()
        break
      }
      case 'brief-advance': {
        const baRes = await fetch(new URL('/api/pipeline/auto-brief-advance', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.briefAdvance = await baRes.json()
        break
      }
      case 'quality-gate': {
        // Trigger auto quality gate via internal fetch
        const qgRes = await fetch(new URL('/api/pipeline/auto-quality-gate', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.qualityGate = await qgRes.json()
        break
      }
      case 'content-assets': {
        const caRes = await fetch(new URL('/api/pipeline/auto-content-assets', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.contentAssets = await caRes.json()
        break
      }
      case 'assembly': {
        const asmRes = await fetch(new URL('/api/pipeline/auto-assembly', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.assembly = await asmRes.json()
        break
      }
      case 'optimize': {
        const optRes = await fetch(new URL('/api/pipeline/auto-optimize', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.optimize = await optRes.json()
        break
      }
      case 'deploy': {
        const depRes = await fetch(new URL('/api/pipeline/auto-deploy', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.deploy = await depRes.json()
        break
      }
      case 'intelligence': {
        const intelRes = await fetch(new URL('/api/pipeline/auto-intelligence', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.intelligence = await intelRes.json()
        break
      }
      case 'campaigns': {
        const campRes = await fetch(new URL('/api/pipeline/auto-campaigns', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.campaigns = await campRes.json()
        break
      }
      case 'rss-intel': {
        const rssRes = await fetch(new URL('/api/pipeline/auto-rss-intel', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.rssIntel = await rssRes.json()
        break
      }
      case 'learning': {
        const learnRes = await fetch(new URL('/api/pipeline/auto-learning', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.learning = await learnRes.json()
        break
      }
      case 'report-committee': {
        const repRes = await fetch(new URL('/api/pipeline/auto-report-committee', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cycleContext: 'manual' }),
        })
        results.reportCommittee = await repRes.json()
        break
      }
      case 'seasonal': {
        const seasRes = await fetch(new URL('/api/pipeline/auto-seasonal', req.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        results.seasonal = await seasRes.json()
        break
      }
      case 'full-cycle': {
        // Helper: run a pipeline step with error resilience
        const safeStep = async (name: string, fn: () => Promise<unknown>) => {
          try {
            results[name] = await fn()
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error'
            console.error(`[full-cycle] Step "${name}" failed:`, msg, err)
            results[name] = { error: 'Internal server error', skipped: true }
          }
        }
        const safePost = async (path: string, body: Record<string, unknown> = {}) => {
          const res = await fetch(new URL(path, req.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(30000),
          })
          return res.json()
        }

        // Phase 0: Lifecycle cleanup (archive expired, advance statuses)
        await safeStep('autoLifecycle', () => safePost('/api/pipeline/auto-lifecycle'))

        // Phase 1: Intelligence gathering (real external data + internal analysis)
        await safeStep('rssIntel', () => safePost('/api/pipeline/auto-rss-intel'))
        await safeStep('seasonal', () => safePost('/api/pipeline/auto-seasonal'))
        await safeStep('intelligence', () => safePost('/api/pipeline/auto-intelligence'))

        // Phase 2: Campaign creation & lifecycle
        await safeStep('campaigns', () => safePost('/api/pipeline/auto-campaigns'))
        await safeStep('lifecycle', () => runLifecycleAutomation())
        await safeStep('briefs', () => runBriefGeneration())

        // Phase 3: Content production pipeline
        await safeStep('briefAdvance', () => safePost('/api/pipeline/auto-brief-advance'))
        await safeStep('contentAssets', () => safePost('/api/pipeline/auto-content-assets'))
        await safeStep('assembly', () => safePost('/api/pipeline/auto-assembly'))
        await safeStep('qualityGate', () => safePost('/api/pipeline/auto-quality-gate'))
        await safeStep('deploy', () => safePost('/api/pipeline/auto-deploy'))

        // Phase 4: Performance & optimization loop
        await safeStep('optimize', () => safePost('/api/pipeline/auto-optimize'))
        await safeStep('learning', () => safePost('/api/pipeline/auto-learning'))
        await safeStep('pruneLearning', () => safePost('/api/pipeline/auto-prune-learning'))

        // Phase 5: Reporting
        await safeStep('report', () => generateStatusReport())
        await safeStep('reportCommittee', () => safePost('/api/pipeline/auto-report-committee', { cycleContext: 'full-cycle' }))

        // Count successes vs failures
        const stepNames = ['autoLifecycle', 'rssIntel', 'seasonal', 'intelligence', 'campaigns', 'lifecycle', 'briefs', 'briefAdvance', 'contentAssets', 'assembly', 'qualityGate', 'deploy', 'optimize', 'learning', 'pruneLearning', 'report', 'reportCommittee']
        const failed = stepNames.filter(n => results[n] && typeof results[n] === 'object' && (results[n] as Record<string, unknown>).skipped === true)
        results.cycleSummary = {
          totalSteps: stepNames.length,
          succeeded: stepNames.length - failed.length,
          failed: failed.length,
          failedSteps: failed,
        }
        break
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, ...results })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[automation] POST error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
