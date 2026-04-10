import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaignId')
  const channel = searchParams.get('channel')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (campaignId) where.campaignId = campaignId
  if (channel && channel !== '__all__') where.channel = channel
  if (status && status !== '__all__') where.status = status

  const deployments = await prisma.channelDeployment.findMany({
    where,
    include: { campaign: { include: { brandPod: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ deployments })
}

const DEPLOYMENT_FIELDS = ['campaignId', 'channel', 'status', 'launchedAt', 'budget', 'schedule'] as const

function pickDeploymentData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of DEPLOYMENT_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    if (k === 'launchedAt') {
      data[k] = new Date(body[k] as string | number | Date)
    } else if (k === 'budget') {
      data[k] = Number(body[k])
    } else {
      data[k] = body[k]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const data = pickDeploymentData(body)
    const deployment = await prisma.channelDeployment.create({
      data: data as never,
      include: { campaign: { include: { brandPod: true } } },
    })
    return NextResponse.json({ deployment }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[deployments] POST:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    const data = pickDeploymentData(body)
    const deployment = await prisma.channelDeployment.update({
      where: { id },
      data: data as never,
      include: { campaign: { include: { brandPod: true } } },
    })
    return NextResponse.json({ deployment })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[deployments] PATCH:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  await prisma.channelDeployment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
