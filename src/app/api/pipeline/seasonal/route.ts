import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')

  const where: Record<string, unknown> = {}
  if (brand && brand !== '__all__') where.brand = brand

  const patterns = await prisma.seasonalPattern.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ patterns })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const pattern = await prisma.seasonalPattern.create({ data: body })
  return NextResponse.json({ pattern }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  const pattern = await prisma.seasonalPattern.update({ where: { id }, data })
  return NextResponse.json({ pattern })
}
