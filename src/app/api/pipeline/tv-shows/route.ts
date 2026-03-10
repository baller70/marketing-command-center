import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
  const body = await req.json()
  const show = await prisma.tVShowMarketing.create({ data: body })
  return NextResponse.json({ show }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  const show = await prisma.tVShowMarketing.update({ where: { id }, data })
  return NextResponse.json({ show })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.tVShowMarketing.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
