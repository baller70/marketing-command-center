import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
  const body = await req.json()
  const review = await prisma.qualityGateReview.create({
    data: body,
    include: { campaign: { include: { brandPod: true } } },
  })
  return NextResponse.json({ review }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  const review = await prisma.qualityGateReview.update({
    where: { id },
    data,
    include: { campaign: { include: { brandPod: true } } },
  })
  return NextResponse.json({ review })
}
