import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Assembly Engine
 * 
 * Automatically completes assembly steps for campaigns in 'assembling' status.
 * Uses brand pod config, campaign data, and creative briefs to fill in assembly steps.
 * 
 * GET  - Preview what assemblies would be auto-completed
 * POST - Run auto-assembly cycle (set dryRun:true to preview)
 */

interface AssemblyAction {
  campaignId: string
  campaignName: string
  brand: string
  step: number
  stepName: string
  action: string
  reason: string
}

async function runAutoAssembly(commit: boolean): Promise<AssemblyAction[]> {
  const actions: AssemblyAction[] = []

  // Find campaigns in assembling status
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'assembling' },
    include: {
      brandPod: true,
      assemblies: { orderBy: { step: 'asc' } },
    },
  })

  for (const campaign of campaigns) {
    const pod = campaign.brandPod
    let assemblies = campaign.assemblies

    // If no assembly steps exist, create them first
    if (assemblies.length === 0 && commit) {
      const steps = [
        { step: 1, stepName: 'Campaign Brief Creation' },
        { step: 2, stepName: 'Copy Creation' },
        { step: 3, stepName: 'Funnel Construction' },
        { step: 4, stepName: 'Ad Assembly' },
        { step: 5, stepName: 'Email Sequence Assembly' },
        { step: 6, stepName: 'Social Media Packaging' },
        { step: 7, stepName: 'Submit to Quality Gate' },
      ]
      assemblies = await prisma.$transaction(
        steps.map(s => prisma.campaignAssembly.create({
          data: { campaignId: campaign.id, ...s },
        }))
      )
      actions.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        brand: pod.brand,
        step: 0,
        stepName: 'Initialize',
        action: 'Created 7 assembly steps',
        reason: 'No assembly steps existed',
      })
    } else if (assemblies.length === 0) {
      actions.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        brand: pod.brand,
        step: 0,
        stepName: 'Initialize',
        action: 'Would create 7 assembly steps',
        reason: 'No assembly steps exist',
      })
      continue
    }

    // Check if creative brief exists
    const brief = await prisma.creativeBrief.findFirst({
      where: { campaignName: campaign.name, brand: pod.brand },
    })

    for (const assembly of assemblies) {
      if (assembly.status === 'completed') continue

      let canAutoComplete = false
      let reason = ''
      let output = ''

      switch (assembly.step) {
        case 1: // Campaign Brief Creation
          canAutoComplete = !!brief || (!!campaign.goal && !!campaign.targetAudience)
          reason = brief ? 'Creative brief exists' : 'Campaign has goal and target audience defined'
          output = brief
            ? `Brief: ${brief.keyMessage || pod.coreMessage}. Goal: ${campaign.goal}. Audience: ${campaign.targetAudience}.`
            : `Goal: ${campaign.goal}. Audience: ${campaign.targetAudience}. Message: ${pod.coreMessage}.`
          break

        case 2: // Copy Creation
          canAutoComplete = !!pod.coreMessage && !!campaign.messagingLane
          reason = 'Brand pod core message and messaging lane available'
          output = `Headline: ${pod.coreMessage}. Lane: ${campaign.messagingLane}. CTA: ${campaign.offer || 'Learn More'}.`
          break

        case 3: // Funnel Construction
          canAutoComplete = !!campaign.goal && (campaign.channels as string[]).length > 0
          reason = 'Campaign goal and channels defined'
          output = `Funnel: ${(campaign.channels as string[]).join(' → ')} → ${campaign.goal}. Budget: $${campaign.budget}.`
          break

        case 4: // Ad Assembly
          canAutoComplete = !!campaign.messagingLane && (campaign.channels as string[]).length > 0
          reason = 'Messaging lane and channels configured'
          output = `Ad specs auto-generated for channels: ${(campaign.channels as string[]).join(', ')}. Messaging: ${campaign.messagingLane}.`
          break

        case 5: // Email Sequence Assembly
          canAutoComplete = (campaign.channels as string[]).includes('email') ? !!campaign.offer : true
          reason = (campaign.channels as string[]).includes('email')
            ? 'Email channel active with offer defined'
            : 'Email not in campaign channels (auto-skip)'
          output = (campaign.channels as string[]).includes('email')
            ? `Email sequence: Welcome → Value → Offer (${campaign.offer}) → Follow-up. Audience: ${campaign.targetAudience}.`
            : 'N/A — Email not used in this campaign.'
          break

        case 6: // Social Media Packaging
          canAutoComplete = (campaign.channels as string[]).some(c => ['social', 'facebook', 'instagram', 'linkedin', 'twitter'].includes(c))
            ? !!pod.coreMessage
            : true
          reason = 'Social channels configured with brand messaging'
          output = `Social package: ${pod.coreMessage}. Platforms: ${(campaign.channels as string[]).filter(c => ['social', 'facebook', 'instagram', 'linkedin', 'twitter'].includes(c)).join(', ') || 'N/A'}.`
          break

        case 7: // Submit to Quality Gate
          // Only auto-complete if all previous steps are done
          const previousSteps = assemblies.filter(a => a.step < 7)
          const allPreviousDone = previousSteps.every(a => a.status === 'completed')
          canAutoComplete = allPreviousDone
          reason = allPreviousDone ? 'All previous steps completed' : 'Waiting for previous steps'
          output = allPreviousDone ? 'Auto-submitted to quality gate.' : ''
          break
      }

      if (canAutoComplete) {
        if (commit) {
          await prisma.campaignAssembly.update({
            where: { id: assembly.id },
            data: {
              status: 'completed',
              notes: output || undefined,
              completedAt: new Date(),
            },
          })
        }
        actions.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          brand: pod.brand,
          step: assembly.step,
          stepName: assembly.stepName,
          action: commit ? 'AUTO-COMPLETED' : 'Would auto-complete',
          reason,
        })
      } else {
        actions.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          brand: pod.brand,
          step: assembly.step,
          stepName: assembly.stepName,
          action: 'BLOCKED',
          reason: reason || 'Insufficient data to auto-complete',
        })
      }
    }

    // If all steps completed and we committed, advance campaign to quality_gate
    if (commit) {
      const updatedAssemblies = await prisma.campaignAssembly.findMany({
        where: { campaignId: campaign.id },
      })
      const allDone = updatedAssemblies.every(a => a.status === 'completed')
      if (allDone) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'quality_gate' },
        })
        actions.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          brand: pod.brand,
          step: 99,
          stepName: 'Pipeline Advance',
          action: 'ADVANCED: assembling → quality_gate',
          reason: 'All 7 assembly steps completed',
        })
      }
    }
  }

  return actions
}

export async function GET() {
  try {
    const actions = await runAutoAssembly(false)
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      actions,
      summary: {
        campaignsReviewed: new Set(actions.map(a => a.campaignId)).size,
        wouldComplete: actions.filter(a => a.action.includes('auto-complete')).length,
        blocked: actions.filter(a => a.action === 'BLOCKED').length,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-assembly] GET error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    const actions = await runAutoAssembly(!dryRun)
    return NextResponse.json({
      success: true,
      dryRun,
      timestamp: new Date().toISOString(),
      actions,
      summary: {
        campaignsReviewed: new Set(actions.map(a => a.campaignId)).size,
        stepsCompleted: actions.filter(a => a.action === 'AUTO-COMPLETED').length,
        blocked: actions.filter(a => a.action === 'BLOCKED').length,
        advanced: actions.filter(a => a.action.includes('ADVANCED')).length,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-assembly] POST error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
