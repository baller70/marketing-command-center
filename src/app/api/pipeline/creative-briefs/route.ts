import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

const BRIEF_FIELDS = [
  'brand',
  'campaignName',
  'campaignGoal',
  'targetAudience',
  'messagingLane',
  'keyMessage',
  'cta',
  'assetsNeeded',
  'priority',
  'deadline',
  'status',
] as const

function pickBriefData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of BRIEF_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    if (k === 'deadline' && body[k] != null) {
      data[k] = new Date(body[k] as string | number | Date)
    } else {
      data[k] = body[k]
    }
  }
  return data
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const where: Record<string, unknown> = {}
  if (brand && brand !== '__all__') where.brand = brand
  if (status && status !== '__all__') where.status = status
  if (priority && priority !== '__all__') where.priority = priority

  const briefs = await prisma.creativeBrief.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ briefs })
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const data = pickBriefData(body)
    const brief = await prisma.creativeBrief.create({ data: data as never })
    return NextResponse.json({ brief }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[creative-briefs] POST:', msg, err)
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
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }
    delete body.id
    const data = pickBriefData(body)
    const brief = await prisma.creativeBrief.update({ where: { id }, data: data as never })
    return NextResponse.json({ brief })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[creative-briefs] PATCH:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.creativeBrief.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
