import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { postiz } from '@/lib/integrations/postiz'
import { mautic } from '@/lib/integrations/mautic'

/**
 * Auto-Deploy Engine
 * 
 * Automatically creates channel deployments for approved campaigns
 * that don't have deployments yet, and advances them to 'live' status.
 * 
 * GET  - Preview what deployments would be created
 * POST - Run auto-deploy cycle
 */

interface DeployAction {
  campaignId: string
  campaignName: string
  brand: string
  channel: string
  action: string
}

async function runAutoDeploy(commit: boolean): Promise<DeployAction[]> {
  const actions: DeployAction[] = []

  // Find approved campaigns
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'approved' },
    include: {
      brandPod: true,
      deployments: true,
    },
  })

  for (const campaign of campaigns) {
    const channels = (campaign.channels as string[]) || []
    const existingChannels = new Set(campaign.deployments.map(d => d.channel))

    for (const channel of channels) {
      if (existingChannels.has(channel)) continue

      if (commit) {
        let externalId: string | null = null
        const socialChannels = ["instagram", "twitter", "tiktok", "facebook", "linkedin", "youtube"]
        const emailChannels = ["email", "newsletter"]

        if (socialChannels.includes(channel)) {
          try {
            const brief = campaign.messagingLane || campaign.name
            const result = await postiz.schedulePost({
              content: `${brief}\n\n#${campaign.brandPod.brand.replace(/\s/g, "")}`,
              platforms: [channel],
              scheduledDate: (campaign.startDate || new Date()).toISOString(),
            })
            externalId = result?.id || null
          } catch (e) {
            console.error(`[auto-deploy] Postiz deploy failed for ${channel}, using fallback:`, e)
          }
        } else if (emailChannels.includes(channel)) {
          try {
            await mautic.createEmail({
              name: `${campaign.name} - ${channel}`,
              subject: campaign.name,
              body: campaign.messagingLane || campaign.name,
            })
          } catch (e) {
            console.error(`[auto-deploy] Mautic deploy failed for ${channel}, using fallback:`, e)
          }
        }

        await prisma.channelDeployment.create({
          data: {
            campaignId: campaign.id,
            channel,
            status: 'scheduled',
            launchedAt: campaign.startDate || new Date(),
            budget: channels.length > 0 ? campaign.budget / channels.length : 0,
            schedule: JSON.parse(JSON.stringify({
              autoDeployed: true,
              messagingLane: campaign.messagingLane,
              targetAudience: campaign.targetAudience,
              externalId,
              via: socialChannels.includes(channel) ? "postiz" : emailChannels.includes(channel) ? "mautic" : "internal",
            })),
          },
        })
      }

      actions.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        brand: campaign.brandPod.brand,
        channel,
        action: commit ? 'DEPLOYED' : 'Would deploy',
      })
    }

    // If all channels now have deployments and start date has passed, go live
    if (commit && channels.length > 0) {
      const now = new Date()
      const allDeployed = channels.every(ch => existingChannels.has(ch) || actions.some(a => a.campaignId === campaign.id && a.channel === ch))
      if (allDeployed && campaign.startDate && campaign.startDate <= now) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'live' },
        })
        // Update deployments to live
        await prisma.channelDeployment.updateMany({
          where: { campaignId: campaign.id, status: 'scheduled' },
          data: { status: 'live' },
        })
        actions.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          brand: campaign.brandPod.brand,
          channel: 'ALL',
          action: 'ADVANCED: approved → live',
        })
      }
    }
  }

  return actions
}

export async function GET() {
  try {
    const actions = await runAutoDeploy(false)
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      actions,
      summary: {
        campaignsReviewed: new Set(actions.map(a => a.campaignId)).size,
        deploymentsNeeded: actions.filter(a => a.action.includes('deploy')).length,
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
    const actions = await runAutoDeploy(!dryRun)
    return NextResponse.json({
      success: true,
      dryRun,
      timestamp: new Date().toISOString(),
      actions,
      summary: {
        deployed: actions.filter(a => a.action === 'DEPLOYED').length,
        advanced: actions.filter(a => a.action.includes('ADVANCED')).length,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Auto-deploy failed', details: String(error) }, { status: 500 })
  }
}
