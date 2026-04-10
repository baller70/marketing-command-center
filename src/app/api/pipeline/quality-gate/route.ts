import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

const QG_FIELDS = [
  'campaignId',
  'reviewType',
  'brandCompliance',
  'messagingCheck',
  'funnelCheck',
  'adCompliance',
  'decision',
  'revisionNotes',
  'reviewedAt',
] as const

function pickQualityGateData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of QG_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    if (k === 'reviewedAt' && body[k] != null) {
      data[k] = new Date(body[k] as string | number | Date)
    } else {
      data[k] = body[k]
    }
  }
  return data
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaignId')
  const decision = searchParams.get('decision')

  const where: Record<string, unknown> = {}
  if (campaignId) where.campaignId = campaignId
  if (decision && decision !== '__all__') where.decision = decision

  const reviews = await prisma.qualityGateReview.findMany({
    where,
    include: { campaign: { include: { brandPod: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ reviews })
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const data = pickQualityGateData(body)
    const review = await prisma.qualityGateReview.create({
      data: data as never,
      include: { campaign: { include: { brandPod: true } } },
    })
    return NextResponse.json({ review }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[quality-gate] POST:', msg, err)
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
    const data = pickQualityGateData(body)
    const review = await prisma.qualityGateReview.update({
      where: { id },
      data: data as never,
      include: { campaign: { include: { brandPod: true } } },
    })
    return NextResponse.json({ review })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[quality-gate] PATCH:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
