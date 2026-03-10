import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaignId')

  const where: Record<string, unknown> = {}
  if (campaignId) where.campaignId = campaignId

  const assemblies = await prisma.campaignAssembly.findMany({
    where,
    include: { campaign: { include: { brandPod: true } } },
    orderBy: [{ campaignId: 'asc' }, { step: 'asc' }],
  })
  return NextResponse.json({ assemblies })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // If campaignId is provided without steps, auto-create all 7 steps
  if (body.campaignId && !body.step) {
    const steps = [
      { step: 1, stepName: 'Campaign Brief Creation' },
      { step: 2, stepName: 'Copy Creation' },
      { step: 3, stepName: 'Funnel Construction' },
      { step: 4, stepName: 'Ad Assembly' },
      { step: 5, stepName: 'Email Sequence Assembly' },
      { step: 6, stepName: 'Social Media Packaging' },
      { step: 7, stepName: 'Submit to Quality Gate' },
    ]
    const assemblies = await prisma.$transaction(
      steps.map(s => prisma.campaignAssembly.create({
        data: { campaignId: body.campaignId, ...s },
      }))
    )
    return NextResponse.json({ assemblies }, { status: 201 })
  }
  const assembly = await prisma.campaignAssembly.create({ data: body })
  return NextResponse.json({ assembly }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  const assembly = await prisma.campaignAssembly.update({ where: { id }, data })
  return NextResponse.json({ assembly })
}
