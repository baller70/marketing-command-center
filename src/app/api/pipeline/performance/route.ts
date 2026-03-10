import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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

    // Calculate aggregated stats
    const totals = {
      impressions: 0, clicks: 0, leadsGenerated: 0, enrollments: 0,
      revenueGenerated: 0, budgetSpent: 0,
    }
    metrics.forEach(m => {
      totals.impressions += m.impressions
      totals.clicks += m.clicks
      totals.leadsGenerated += m.leadsGenerated
      totals.enrollments += m.enrollments
      totals.revenueGenerated += m.revenueGenerated
      totals.budgetSpent += m.budgetSpent
    })

    const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00'
    const roas = totals.budgetSpent > 0 ? (totals.revenueGenerated / totals.budgetSpent).toFixed(2) : '0.00'
    const costPerLead = totals.leadsGenerated > 0 ? (totals.budgetSpent / totals.leadsGenerated).toFixed(2) : '0.00'

    return NextResponse.json({ metrics, totals: { ...totals, ctr, roas, costPerLead } })
  } catch (error) {
    console.error('[performance] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch performance metrics', metrics: [], totals: {} }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }
    const metric = await prisma.performanceMetric.create({ data: body })
    return NextResponse.json({ metric }, { status: 201 })
  } catch (error) {
    console.error('[performance] POST error:', error)
    return NextResponse.json({ error: 'Failed to create performance metric' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const metric = await prisma.performanceMetric.update({ where: { id }, data })
    return NextResponse.json({ metric })
  } catch (error) {
    console.error('[performance] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update performance metric' }, { status: 500 })
  }
}
