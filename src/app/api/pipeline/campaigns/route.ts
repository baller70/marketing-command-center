import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const CAMPAIGN_PATCH_FIELDS = [
  'name',
  'messagingLane',
  'goal',
  'targetAudience',
  'offer',
  'channels',
  'budget',
  'horizon',
  'status',
  'startDate',
  'endDate',
] as const

function pickCampaignPatch(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  if (body.brandPodId !== undefined && body.brandPodId !== null) {
    data.brandPod = { connect: { id: String(body.brandPodId) } }
  }
  for (const k of CAMPAIGN_PATCH_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    if (k === 'startDate' || k === 'endDate') {
      data[k] =
        body[k] != null ? new Date(body[k] as string | number | Date) : null
    } else if (k === 'budget') {
      data[k] = Number(body[k])
    } else if (k === 'channels') {
      data[k] = Array.isArray(body.channels)
        ? body.channels.map(String)
        : body.channels
    } else {
      data[k] = body[k]
    }
  }
  return data
}

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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[campaigns] GET error:', msg, err)
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[campaigns] POST error:', msg, err)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const id = body.id
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    delete body.id
    const data = pickCampaignPatch(body)
    const campaign = await prisma.campaign.update({
      where: { id },
      data: data as never,
      include: { brandPod: true },
    })
    return NextResponse.json({ campaign })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[campaigns] PATCH error:', msg, err)
    const notFound = err instanceof Error && err.message.includes('not found')
    return NextResponse.json(
      { error: notFound ? 'Campaign not found' : 'Failed to update campaign' },
      { status: notFound ? 404 : 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.campaign.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[campaigns] DELETE error:', msg, err)
    const notFound = err instanceof Error && err.message.includes('not found')
    return NextResponse.json(
      { error: notFound ? 'Campaign not found' : 'Failed to delete campaign' },
      { status: notFound ? 404 : 500 }
    )
  }
}
