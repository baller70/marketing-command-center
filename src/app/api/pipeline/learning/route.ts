import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')
  const loopType = searchParams.get('loopType')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (brand && brand !== '__all__') where.brand = brand
  if (loopType && loopType !== '__all__') where.loopType = loopType
  if (status && status !== '__all__') where.status = status

  const rules = await prisma.learningRule.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ rules })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const rule = await prisma.learningRule.create({ data: body })
  return NextResponse.json({ rule }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  const rule = await prisma.learningRule.update({ where: { id }, data })
  return NextResponse.json({ rule })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.learningRule.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
