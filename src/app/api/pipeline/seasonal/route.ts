import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

const SEASONAL_FIELDS = ['brand', 'months', 'observation', 'action', 'status'] as const

function pickSeasonalData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of SEASONAL_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    data[k] = body[k]
  }
  return data
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')

  const where: Record<string, unknown> = {}
  if (brand && brand !== '__all__') where.brand = brand

  const patterns = await prisma.seasonalPattern.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ patterns })
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const data = pickSeasonalData(body)
    const pattern = await prisma.seasonalPattern.create({ data: data as never })
    return NextResponse.json({ pattern }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seasonal] POST:', msg, err)
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
    const data = pickSeasonalData(body)
    const pattern = await prisma.seasonalPattern.update({ where: { id }, data: data as never })
    return NextResponse.json({ pattern })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seasonal] PATCH:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
