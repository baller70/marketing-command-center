import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Content-Assets Engine
 * 
 * Closes the gap between Creative Briefs and Content Assets:
 * - Reads delivered creative briefs with assetsNeeded specs
 * - Auto-generates ContentAsset records for each asset specified
 * - Links assets to campaigns when campaignId is available
 * - Deduplicates by checking existing assets for the same brief/brand
 * 
 * This is the missing link: briefs were auto-advanced to "delivered"
 * but content assets were never auto-created from them.
 * 
 * ZERO COST — derives everything from existing brief data.
 * 
 * GET  - Preview what assets would be created
 * POST - Create content asset records
 */

interface AssetAction {
  briefId: string
  brand: string
  campaignName: string
  assetId: string
  format: string
  platform: string
  action: string
}

// Map brief asset types to ContentAsset formats
function mapFormat(type: string): string {
  const formatMap: Record<string, string> = {
    email_template: 'email_template',
    social_graphic: 'carousel',
    video_ad: 'short_video',
    banner: 'display_banner',
    social_post: 'carousel',
    landing_page: 'landing_page',
    blog_post: 'long_form_content',
    infographic: 'infographic',
  }
  return formatMap[type] || type || 'general'
}

// Map platform to optimized platform string
function mapPlatform(platform: string): string {
  const platformMap: Record<string, string> = {
    email: 'email',
    social: 'ig_feed',
    video: 'youtube_shorts',
    display: 'google_display',
    search: 'google_search',
    linkedin: 'linkedin',
    facebook: 'facebook',
    instagram: 'ig_feed',
    tiktok: 'tiktok',
    youtube: 'youtube',
  }
  return platformMap[platform] || platform || 'multi_platform'
}

// Map format to typical dimensions
function getDimensions(format: string): string {
  const dimMap: Record<string, string> = {
    short_video: '9:16',
    carousel: '1:1',
    display_banner: '16:9',
    email_template: '600px',
    landing_page: 'responsive',
    long_form_content: 'responsive',
    infographic: '1:3',
  }
  return dimMap[format] || '1:1'
}

// Map format to typical duration (seconds, null for non-video)
function getDuration(format: string): number | null {
  if (format.includes('video')) return format === 'short_video' ? 30 : 60
  return null
}

async function generateContentAssets(commit: boolean): Promise<AssetAction[]> {
  const actions: AssetAction[] = []
  const dateKey = new Date().toISOString().slice(0, 10)

  // Find delivered briefs
  const deliveredBriefs = await prisma.creativeBrief.findMany({
    where: { status: 'delivered' },
  })

  for (const brief of deliveredBriefs) {
    // Parse assetsNeeded
    let assetsNeeded: Array<{ type?: string; quantity?: number; platform?: string; requirements?: string }> = []
    try {
      const raw = brief.assetsNeeded
      if (Array.isArray(raw)) assetsNeeded = raw as typeof assetsNeeded
      else if (typeof raw === 'string') assetsNeeded = JSON.parse(raw)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[auto-content-assets] parse assetsNeeded:', msg, err)
      continue
    }

    if (assetsNeeded.length === 0) continue

    // Find campaign for linking
    const campaign = await prisma.campaign.findFirst({
      where: { name: brief.campaignName },
      include: { brandPod: true },
    })

    for (let i = 0; i < assetsNeeded.length; i++) {
      const spec = assetsNeeded[i]
      const quantity = spec.quantity || 1

      for (let q = 0; q < quantity; q++) {
        const assetIdStr = `auto-${brief.brand}-${brief.campaignName}-${spec.type || 'asset'}-${i}-${q}-${dateKey}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()

        // Check if already exists
        const existing = await prisma.contentAsset.findFirst({
          where: { assetId: assetIdStr },
        })
        if (existing) {
          actions.push({
            briefId: brief.id,
            brand: brief.brand,
            campaignName: brief.campaignName,
            assetId: assetIdStr,
            format: mapFormat(spec.type || ''),
            platform: mapPlatform(spec.platform || ''),
            action: 'skipped (already exists)',
          })
          continue
        }

        const format = mapFormat(spec.type || '')
        const platform = mapPlatform(spec.platform || '')

        if (commit) {
          await prisma.contentAsset.create({
            data: {
              assetId: assetIdStr,
              brand: brief.brand,
              messagingLane: brief.messagingLane,
              format,
              platformOptimized: platform,
              dimensions: getDimensions(format),
              duration: getDuration(format),
              campaignId: campaign?.id || null,
              captionText: `${brief.keyMessage} — ${brief.cta}`,
              ctaText: brief.cta,
              status: 'new',
            },
          })
        }

        actions.push({
          briefId: brief.id,
          brand: brief.brand,
          campaignName: brief.campaignName,
          assetId: assetIdStr,
          format,
          platform,
          action: commit ? 'created' : 'would create',
        })
      }
    }
  }

  return actions
}

export async function GET() {
  try {
    const actions = await generateContentAssets(false)
    const created = actions.filter(a => a.action === 'would create')
    const skipped = actions.filter(a => a.action.startsWith('skipped'))
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      actions,
      summary: { wouldCreate: created.length, alreadyExist: skipped.length },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-content-assets] GET error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    const actions = await generateContentAssets(!dryRun)
    const created = actions.filter(a => a.action === 'created')
    const skipped = actions.filter(a => a.action.startsWith('skipped'))

    return NextResponse.json({
      success: true,
      dryRun,
      timestamp: new Date().toISOString(),
      actions,
      summary: { created: created.length, skipped: skipped.length, total: actions.length },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-content-assets] POST error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
