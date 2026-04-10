import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

const METRIC_FIELDS = [
  'campaignId',
  'brand',
  'channel',
  'impressions',
  'clicks',
  'leadsGenerated',
  'enrollments',
  'revenueGenerated',
  'budgetSpent',
  'recordedAt',
] as const

function pickMetricData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of METRIC_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    if (k === 'recordedAt' && body[k] != null) {
      data[k] = new Date(body[k] as string | number | Date)
    } else if (
      ['impressions', 'clicks', 'leadsGenerated', 'enrollments', 'revenueGenerated', 'budgetSpent'].includes(k)
    ) {
      data[k] = Number(body[k])
    } else {
      data[k] = body[k]
    }
  }
  return data
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')
    const brand = searchParams.get('brand')
    const channel = searchParams.get('channel')

    const where: Record<string, unknown> = {}
    if (campaignId) where.campaignId = campaignId
    if (brand && brand !== '__all__') where.brand = brand
    if (channel && channel !== '__all__') where.channel = channel

    const metrics = await prisma.performanceMetric.findMany({
      where,
      include: { campaign: { include: { brandPod: true } } },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    })

    const totals = {
      impressions: 0,
      clicks: 0,
      leadsGenerated: 0,
      enrollments: 0,
      revenueGenerated: 0,
      budgetSpent: 0,
    }
    metrics.forEach(m => {
      totals.impressions += m.impressions
      totals.clicks += m.clicks
      totals.leadsGenerated += m.leadsGenerated
      totals.enrollments += m.enrollments
      totals.revenueGenerated += m.revenueGenerated
      totals.budgetSpent += m.budgetSpent
    })

    const ctr =
      totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00'
    const roas =
      totals.budgetSpent > 0 ? (totals.revenueGenerated / totals.budgetSpent).toFixed(2) : '0.00'
    const costPerLead =
      totals.leadsGenerated > 0 ? (totals.budgetSpent / totals.leadsGenerated).toFixed(2) : '0.00'

    return NextResponse.json({
      metrics,
      totals: { ...totals, ctr, roas, costPerLead },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[performance] GET error:', msg, err)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics', metrics: [], totals: {} },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (!body.campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }
    const data = pickMetricData(body)
    const metric = await prisma.performanceMetric.create({ data: data as never })
    return NextResponse.json({ metric }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[performance] POST error:', msg, err)
    return NextResponse.json({ error: 'Failed to create performance metric' }, { status: 500 })
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
    const data = pickMetricData(body)
    const metric = await prisma.performanceMetric.update({ where: { id }, data: data as never })
    return NextResponse.json({ metric })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[performance] PATCH error:', msg, err)
    return NextResponse.json({ error: 'Failed to update performance metric' }, { status: 500 })
  }
}
