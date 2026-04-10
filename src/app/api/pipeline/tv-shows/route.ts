import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

const TV_FIELDS = [
  'brand',
  'showName',
  'format',
  'cadence',
  'marketingRole',
  'episodes',
  'avgWatchDuration',
  'leadsPerEpisode',
  'status',
] as const

function pickTVShowData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of TV_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    if (['episodes', 'avgWatchDuration', 'leadsPerEpisode'].includes(k)) {
      data[k] = Number(body[k])
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

  const where: Record<string, unknown> = {}
  if (brand && brand !== '__all__') where.brand = brand
  if (status && status !== '__all__') where.status = status

  const shows = await prisma.tVShowMarketing.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ shows })
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const data = pickTVShowData(body)
    const show = await prisma.tVShowMarketing.create({ data: data as never })
    return NextResponse.json({ show }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[tv-shows] POST:', msg, err)
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
    const data = pickTVShowData(body)
    const show = await prisma.tVShowMarketing.update({ where: { id }, data: data as never })
    return NextResponse.json({ show })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[tv-shows] PATCH:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.tVShowMarketing.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
