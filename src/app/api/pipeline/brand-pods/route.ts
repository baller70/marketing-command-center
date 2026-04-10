import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

const POD_FIELDS = [
  'brand',
  'name',
  'audience',
  'coreOffer',
  'coreMessage',
  'channelMix',
  'kpiTargets',
  'status',
] as const

const LANE_FIELDS = ['lane', 'message', 'contentTypes', 'target', 'status'] as const

function pickPodData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of POD_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    data[k] = body[k]
  }
  return data
}

function sanitizeMessagingLanesCreate(raw: unknown) {
  if (!Array.isArray(raw)) return undefined
  return raw.map(item => {
    if (typeof item !== 'object' || item === null) return {}
    const o = item as Record<string, unknown>
    const row: Record<string, unknown> = {}
    for (const k of LANE_FIELDS) {
      if (o[k] !== undefined) row[k] = o[k]
    }
    return row
  })
}

export async function GET() {
  try {
    const pods = await prisma.brandPod.findMany({
      include: { messagingLanes: true, _count: { select: { campaigns: true } } },
      orderBy: { brand: 'asc' },
    })
    return NextResponse.json({ pods })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[brand-pods] GET error:', msg, err)
    return NextResponse.json({ error: 'Failed to fetch brand pods', pods: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (!body.brand || !body.name) {
      return NextResponse.json({ error: 'brand and name are required' }, { status: 400 })
    }
    const messagingLanes = body.messagingLanes
    delete body.messagingLanes
    const podData = pickPodData(body)
    const lanes = sanitizeMessagingLanesCreate(messagingLanes)
    const pod = await prisma.brandPod.create({
      data: {
        ...podData,
        messagingLanes:
          lanes && lanes.length > 0 ? { create: lanes as never[] } : undefined,
      } as never,
      include: { messagingLanes: true },
    })
    return NextResponse.json({ pod }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[brand-pods] POST error:', msg, err)
    const isUnique =
      err instanceof Error && err.message.includes('Unique constraint')
    const clientMsg = isUnique
      ? 'A brand pod with this brand already exists'
      : 'Failed to create brand pod'
    return NextResponse.json(
      { error: clientMsg },
      { status: isUnique ? 409 : 500 }
    )
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
    delete body.messagingLanes
    const data = pickPodData(body)
    const pod = await prisma.brandPod.update({
      where: { id },
      data: data as never,
      include: { messagingLanes: true },
    })
    return NextResponse.json({ pod })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[brand-pods] PATCH error:', msg, err)
    const notFound = err instanceof Error && err.message.includes('not found')
    return NextResponse.json(
      { error: notFound ? 'Brand pod not found' : 'Failed to update brand pod' },
      { status: notFound ? 404 : 500 }
    )
  }
}
