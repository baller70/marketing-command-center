import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

const LEARNING_FIELDS = ['brand', 'dataSource', 'rule', 'confidence', 'appliesTo', 'loopType', 'status'] as const

function pickLearningData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of LEARNING_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    data[k] = body[k]
  }
  return data
}

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
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const data = pickLearningData(body)
    const rule = await prisma.learningRule.create({ data: data as never })
    return NextResponse.json({ rule }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[learning] POST:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const id = body.id
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }
    delete body.id
    const data = pickLearningData(body)
    const rule = await prisma.learningRule.update({ where: { id }, data: data as never })
    return NextResponse.json({ rule })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[learning] PATCH:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.learningRule.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
