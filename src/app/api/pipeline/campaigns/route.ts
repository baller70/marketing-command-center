import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const brand = searchParams.get('brand')
    const status = searchParams.get('status')
    const horizon = searchParams.get('horizon')

    const where: Record<string, unknown> = {}
    if (brand && brand !== '__all__') {
      const pod = await prisma.brandPod.findUnique({ where: { brand } })
      if (pod) where.brandPodId = pod.id
    }
    if (status && status !== '__all__') where.status = status
    if (horizon && horizon !== '__all__') where.horizon = horizon

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        brandPod: true,
        _count: { select: { assemblies: true, qualityReviews: true, deployments: true, performance: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('[campaigns] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns', campaigns: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.brandPodId || !body.name) {
      return NextResponse.json({ error: 'brandPodId and name are required' }, { status: 400 })
    }
    // Sanitize: only allow known campaign fields (prevent arbitrary field injection)
    const sanitized = {
      brandPod: { connect: { id: String(body.brandPodId) } },
      name: String(body.name),
      messagingLane: String(body.messagingLane || ''),
      goal: String(body.goal || 'awareness'),
      targetAudience: String(body.targetAudience || ''),
      offer: body.offer ? String(body.offer) : null,
      channels: Array.isArray(body.channels) ? body.channels.map(String) : [],
      budget: Number(body.budget) || 0,
      horizon: String(body.horizon || 'H2'),
      ...(body.status ? { status: String(body.status) } : {}),
      ...(body.startDate ? { startDate: new Date(body.startDate) } : {}),
      ...(body.endDate ? { endDate: new Date(body.endDate) } : {}),
    } satisfies Prisma.CampaignCreateInput

    const campaign = await prisma.campaign.create({
      data: sanitized,
      include: { brandPod: true },
    })
    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('[campaigns] POST error:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const campaign = await prisma.campaign.update({
      where: { id },
      data,
      include: { brandPod: true },
    })
    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('[campaigns] PATCH error:', error)
    const msg = error instanceof Error && error.message.includes('not found') ? 'Campaign not found' : 'Failed to update campaign'
    return NextResponse.json({ error: msg }, { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.campaign.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[campaigns] DELETE error:', error)
    const msg = error instanceof Error && error.message.includes('not found') ? 'Campaign not found' : 'Failed to delete campaign'
    return NextResponse.json({ error: msg }, { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 })
  }
}
