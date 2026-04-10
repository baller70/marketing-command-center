import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

const ASSET_FIELDS = [
  'assetId',
  'brand',
  'messagingLane',
  'format',
  'platformOptimized',
  'dimensions',
  'duration',
  'campaignId',
  'captionText',
  'ctaText',
  'status',
] as const

function pickAssetData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of ASSET_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    if (k === 'duration' && body[k] != null) {
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
  const format = searchParams.get('format')

  const where: Record<string, unknown> = {}
  if (brand && brand !== '__all__') where.brand = brand
  if (status && status !== '__all__') where.status = status
  if (format && format !== '__all__') where.format = format

  const assets = await prisma.contentAsset.findMany({
    where,
    orderBy: { deliveredAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ assets })
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const data = pickAssetData(body)
    const asset = await prisma.contentAsset.create({ data: data as never })
    return NextResponse.json({ asset }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[content-assets] POST:', msg, err)
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
    const data = pickAssetData(body)
    const asset = await prisma.contentAsset.update({ where: { id }, data: data as never })
    return NextResponse.json({ asset })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[content-assets] PATCH:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
