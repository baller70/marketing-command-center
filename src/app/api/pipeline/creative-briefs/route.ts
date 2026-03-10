import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
  const body = await req.json()
  const brief = await prisma.creativeBrief.create({ data: body })
  return NextResponse.json({ brief }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  const brief = await prisma.creativeBrief.update({ where: { id }, data })
  return NextResponse.json({ brief })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.creativeBrief.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
