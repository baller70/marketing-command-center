import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

const INTEL_FIELDS = [
  'brand',
  'category',
  'source',
  'insight',
  'actionable',
  'actionRecommended',
  'priority',
  'status',
  'dateCaptured',
] as const

function pickIntelData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of INTEL_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    if (k === 'dateCaptured' && body[k] != null) {
      data[k] = new Date(body[k] as string | number | Date)
    } else if (k === 'actionable') {
      data[k] = Boolean(body[k])
    } else {
      data[k] = body[k]
    }
  }
  return data
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const where: Record<string, unknown> = {}
  if (brand && brand !== '__all__') where.brand = brand
  if (category && category !== '__all__') where.category = category
  if (status && status !== '__all__') where.status = status
  if (priority && priority !== '__all__') where.priority = priority

  const entries = await prisma.intelligenceEntry.findMany({
    where,
    orderBy: { dateCaptured: 'desc' },
    take: 100,
  })
  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const data = pickIntelData(body)
    const entry = await prisma.intelligenceEntry.create({ data: data as never })
    return NextResponse.json({ entry }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[intelligence] POST:', msg, err)
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
    const data = pickIntelData(body)
    const entry = await prisma.intelligenceEntry.update({ where: { id }, data: data as never })
    return NextResponse.json({ entry })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[intelligence] PATCH:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.intelligenceEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
