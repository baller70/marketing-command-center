import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const pods = await prisma.brandPod.findMany({
      include: { messagingLanes: true, _count: { select: { campaigns: true } } },
      orderBy: { brand: 'asc' },
    })
    return NextResponse.json({ pods })
  } catch (error) {
    console.error('[brand-pods] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch brand pods', pods: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.brand || !body.name) {
      return NextResponse.json({ error: 'brand and name are required' }, { status: 400 })
    }
    const { messagingLanes, ...podData } = body
    const pod = await prisma.brandPod.create({
      data: {
        ...podData,
        messagingLanes: messagingLanes ? { create: messagingLanes } : undefined,
      },
      include: { messagingLanes: true },
    })
    return NextResponse.json({ pod }, { status: 201 })
  } catch (error) {
    console.error('[brand-pods] POST error:', error)
    const msg = error instanceof Error && error.message.includes('Unique constraint')
      ? 'A brand pod with this brand already exists'
      : 'Failed to create brand pod'
    return NextResponse.json({ error: msg }, { status: error instanceof Error && error.message.includes('Unique constraint') ? 409 : 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const pod = await prisma.brandPod.update({
      where: { id },
      data,
      include: { messagingLanes: true },
    })
    return NextResponse.json({ pod })
  } catch (error) {
    console.error('[brand-pods] PATCH error:', error)
    const msg = error instanceof Error && error.message.includes('not found') ? 'Brand pod not found' : 'Failed to update brand pod'
    return NextResponse.json({ error: msg }, { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 })
  }
}
