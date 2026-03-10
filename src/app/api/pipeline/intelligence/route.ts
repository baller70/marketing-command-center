import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const where: Record<string, unknown> = {}
  if (brand && brand !== '__all__') where.brand = brand
  if (category && category !== '__all__') where.category = category
  if (status && status !== '__all__') where.status = status
  if (priority && priority !== '__all__') where.priority = priority

  const entries = await prisma.intelligenceEntry.findMany({
    where,
    orderBy: { dateCaptured: 'desc' },
    take: 100,
  })
  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const entry = await prisma.intelligenceEntry.create({ data: body })
  return NextResponse.json({ entry }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  const entry = await prisma.intelligenceEntry.update({ where: { id }, data })
  return NextResponse.json({ entry })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.intelligenceEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
