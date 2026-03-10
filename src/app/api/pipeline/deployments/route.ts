import { prisma } from '@/lib/prisma'
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

export async function POST(req: NextRequest) {
  const body = await req.json()
  const deployment = await prisma.channelDeployment.create({
    data: body,
    include: { campaign: { include: { brandPod: true } } },
  })
  return NextResponse.json({ deployment }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  const deployment = await prisma.channelDeployment.update({
    where: { id },
    data,
    include: { campaign: { include: { brandPod: true } } },
  })
  return NextResponse.json({ deployment })
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
