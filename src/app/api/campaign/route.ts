import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const brand = searchParams.get('brand')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (brand && brand !== '__all__') {
      const pod = await prisma.brandPod.findUnique({ where: { brand } })
      if (pod) where.brandPodId = pod.id
    }
    if (status && status !== '__all__') where.status = status

    const campaigns = await prisma.campaign.findMany({
      where,
      include: { brandPod: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ campaigns })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[campaign] GET error:', msg, err)
    return NextResponse.json({ error: 'Failed to fetch campaigns', campaigns: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { brand, campaignType, headline, description, platform, sendNow } = body

    if (!brand || !headline) {
      return NextResponse.json({ error: 'brand and headline are required' }, { status: 400 })
    }

    const pod = await prisma.brandPod.findUnique({ where: { brand } })
    if (!pod) {
      return NextResponse.json({ error: `Brand pod "${brand}" not found` }, { status: 404 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        brandPod: { connect: { id: pod.id } },
        name: headline,
        messagingLane: campaignType || 'newsletter',
        goal: 'engagement',
        targetAudience: platform || 'email',
        channels: platform ? [platform] : ['email'],
        status: sendNow ? 'active' : 'draft',
      },
      include: { brandPod: true },
    })

    if (sendNow) {
      const mauticUrl = process.env.MAUTIC_URL || 'http://localhost:8088'
      const mauticUser = process.env.MAUTIC_API_USER || 'admin'
      const mauticPass = process.env.MAUTIC_API_PASS || ''

      try {
        await fetch(`${mauticUrl}/api/emails/new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${mauticUser}:${mauticPass}`).toString('base64')}`,
          },
          body: JSON.stringify({
            name: headline,
            subject: headline,
            customHtml: `<h1>${headline}</h1><p>${description || ''}</p>`,
            emailType: 'template',
          }),
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.warn('[campaign] Mautic send failed (non-blocking):', msg, err)
      }
    }

    return NextResponse.json({ campaign, sent: !!sendNow }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[campaign] POST error:', msg, err)
    return NextResponse.json({ error: 'Failed to process campaign' }, { status: 500 })
  }
}
