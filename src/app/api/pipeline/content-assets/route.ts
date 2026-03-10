import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')
  const status = searchParams.get('status')
  const format = searchParams.get('format')

  const where: Record<string, unknown> = {}
  if (brand && brand !== '__all__') where.brand = brand
  if (status && status !== '__all__') where.status = status
  if (format && format !== '__all__') where.format = format

  const assets = await prisma.contentAsset.findMany({
    where,
    orderBy: { deliveredAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ assets })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const asset = await prisma.contentAsset.create({ data: body })
  return NextResponse.json({ asset }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body
  const asset = await prisma.contentAsset.update({ where: { id }, data })
  return NextResponse.json({ asset })
}
