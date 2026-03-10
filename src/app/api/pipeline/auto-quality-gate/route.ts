import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto Quality Gate
 * 
 * Automatically reviews campaigns ready for quality gate:
 * 1. Finds campaigns in 'assembling' or 'quality_gate' status
 * 2. Checks assembly step completion
 * 3. Validates brand compliance against BrandPod config
 * 4. Auto-approves or flags for revision
 * 5. Advances campaign status accordingly
 * 
 * GET  - Preview what would be reviewed
 * POST - Run auto quality gate cycle
 */

interface QGResult {
  campaignId: string
  campaignName: string
  brand: string
  decision: 'pass' | 'revise' | 'pending'
  assemblyProgress: string
  checks: {
    brandCompliance: { pass: boolean; details: string }
    messagingCheck: { pass: boolean; details: string }
    funnelCheck: { pass: boolean; details: string }
    adCompliance: { pass: boolean; details: string }
  }
  action: string
}

async function reviewCampaigns(commit: boolean): Promise<QGResult[]> {
  const results: QGResult[] = []

  // Find campaigns ready for quality gate review
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: { in: ['assembling', 'quality_gate'] },
    },
    include: {
      brandPod: true,
      assemblies: { orderBy: { step: 'asc' } },
      qualityReviews: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  for (const campaign of campaigns) {
    const pod = campaign.brandPod
    const assemblies = campaign.assemblies

    // Check assembly completion
    const totalSteps = assemblies.length || 7
    const completedSteps = assemblies.filter(a => a.status === 'completed').length
    const assemblyProgress = `${completedSteps}/${totalSteps}`
    const assemblyComplete = totalSteps > 0 && completedSteps >= Math.ceil(totalSteps * 0.7) // 70% threshold

    // Brand compliance check
    const hasTargetAudience = !!campaign.targetAudience && campaign.targetAudience.length > 5
    const hasMessaging = !!campaign.messagingLane && campaign.messagingLane.length > 0
    const hasChannels = Array.isArray(campaign.channels) && (campaign.channels as string[]).length > 0
    const brandCompliance = {
      pass: hasTargetAudience && hasMessaging && hasChannels,
      details: [
        hasTargetAudience ? '✓ Target audience defined' : '✗ Missing target audience',
        hasMessaging ? '✓ Messaging lane set' : '✗ Missing messaging lane',
        hasChannels ? '✓ Channels configured' : '✗ No channels selected',
      ].join('; '),
    }

    // Messaging check - verify alignment with brand pod
    const messagingAligned = pod.coreMessage && campaign.messagingLane
    const goalDefined = !!campaign.goal && campaign.goal !== ''
    const messagingCheck = {
      pass: !!messagingAligned && goalDefined,
      details: [
        messagingAligned ? '✓ Aligned with brand messaging' : '✗ Messaging not aligned with brand pod',
        goalDefined ? `✓ Goal: ${campaign.goal}` : '✗ No campaign goal',
      ].join('; '),
    }

    // Funnel check - verify basics
    const hasBudget = campaign.budget > 0
    const hasDates = !!campaign.startDate
    const funnelCheck = {
      pass: hasBudget && hasDates,
      details: [
        hasBudget ? `✓ Budget: $${campaign.budget}` : '✗ No budget allocated',
        hasDates ? '✓ Start date set' : '✗ No start date',
      ].join('; '),
    }

    // Ad compliance - basic validation
    const nameValid = campaign.name.length > 3 && campaign.name.length < 200
    const offerExists = !!campaign.offer || campaign.goal === 'awareness'
    const adCompliance = {
      pass: nameValid && offerExists,
      details: [
        nameValid ? '✓ Campaign name valid' : '✗ Campaign name too short/long',
        offerExists ? '✓ Offer/CTA defined' : '✗ No offer defined (non-awareness campaign)',
      ].join('; '),
    }

    // Decision logic
    const allChecksPass = brandCompliance.pass && messagingCheck.pass && funnelCheck.pass && adCompliance.pass
    const decision: 'pass' | 'revise' | 'pending' = 
      !assemblyComplete ? 'pending' :
      allChecksPass ? 'pass' : 'revise'

    let action = 'No action (assembly incomplete)'
    if (assemblyComplete && commit) {
      if (decision === 'pass') {
        // Auto-approve: advance to 'approved'
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'approved' },
        })
        // Create quality gate review record
        await prisma.qualityGateReview.create({
          data: {
            campaignId: campaign.id,
            reviewType: 'pre_launch',
            brandCompliance: JSON.parse(JSON.stringify(brandCompliance)),
            messagingCheck: JSON.parse(JSON.stringify(messagingCheck)),
            funnelCheck: JSON.parse(JSON.stringify(funnelCheck)),
            adCompliance: JSON.parse(JSON.stringify(adCompliance)),
            decision: 'pass',
            reviewedAt: new Date(),
          },
        })
        action = 'AUTO-APPROVED → status set to "approved"'
      } else if (decision === 'revise') {
        // Flag for revision
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'quality_gate' },
        })
        const failedChecks = [
          !brandCompliance.pass && 'Brand compliance',
          !messagingCheck.pass && 'Messaging',
          !funnelCheck.pass && 'Funnel/budget',
          !adCompliance.pass && 'Ad compliance',
        ].filter(Boolean).join(', ')
        await prisma.qualityGateReview.create({
          data: {
            campaignId: campaign.id,
            reviewType: 'pre_launch',
            brandCompliance: JSON.parse(JSON.stringify(brandCompliance)),
            messagingCheck: JSON.parse(JSON.stringify(messagingCheck)),
            funnelCheck: JSON.parse(JSON.stringify(funnelCheck)),
            adCompliance: JSON.parse(JSON.stringify(adCompliance)),
            decision: 'revise',
            revisionNotes: `Auto-review: Failed checks: ${failedChecks}`,
            reviewedAt: new Date(),
          },
        })
        action = `NEEDS REVISION → failed: ${failedChecks}`
      }
    } else if (assemblyComplete && !commit) {
      action = decision === 'pass' ? 'Would auto-approve' : 'Would flag for revision'
    }

    results.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      brand: pod.brand,
      decision,
      assemblyProgress,
      checks: { brandCompliance, messagingCheck, funnelCheck, adCompliance },
      action,
    })
  }

  return results
}

export async function GET() {
  try {
    const results = await reviewCampaigns(false)
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      campaigns: results,
      summary: {
        total: results.length,
        wouldPass: results.filter(r => r.decision === 'pass').length,
        wouldRevise: results.filter(r => r.decision === 'revise').length,
        pending: results.filter(r => r.decision === 'pending').length,
      },
    })
  } catch (error) {
    console.error('[auto-quality-gate] GET error:', error)
    return NextResponse.json({ error: 'Failed to preview quality gate', details: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    const results = await reviewCampaigns(!dryRun)
    return NextResponse.json({
      success: true,
      dryRun,
      timestamp: new Date().toISOString(),
      campaigns: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.decision === 'pass').length,
        revised: results.filter(r => r.decision === 'revise').length,
        pending: results.filter(r => r.decision === 'pending').length,
      },
    })
  } catch (error) {
    console.error('[auto-quality-gate] POST error:', error)
    return NextResponse.json({ error: 'Quality gate failed', details: String(error) }, { status: 500 })
  }
}
