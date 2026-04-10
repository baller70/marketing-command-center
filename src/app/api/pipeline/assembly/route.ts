import { prisma } from '@/lib/prisma'
import { sanitizeJsonBody } from '@/lib/sanitize-pipeline-body'
import { NextRequest, NextResponse } from 'next/server'

const ASSEMBLY_FIELDS = ['campaignId', 'step', 'stepName', 'status', 'notes', 'completedAt'] as const

function pickAssemblyData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const k of ASSEMBLY_FIELDS) {
    if (!(k in body) || body[k] === undefined) continue
    if (k === 'step' && body[k] != null) {
      data[k] = Number(body[k])
    } else if (k === 'completedAt' && body[k] != null) {
      data[k] = new Date(body[k] as string | number | Date)
    } else {
      data[k] = body[k]
    }
  }
  return data
}

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
  try {
    const raw = await req.json()
    const body = sanitizeJsonBody(raw)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (body.campaignId && body.step === undefined) {
      const campaignId = String(body.campaignId)
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
        steps.map(s =>
          prisma.campaignAssembly.create({
            data: { campaignId, ...s },
          })
        )
      )
      return NextResponse.json({ assemblies }, { status: 201 })
    }
    const data = pickAssemblyData(body)
    const assembly = await prisma.campaignAssembly.create({ data: data as never })
    return NextResponse.json({ assembly }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[assembly] POST:', msg, err)
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
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    delete body.id
    const data = pickAssemblyData(body)
    const assembly = await prisma.campaignAssembly.update({ where: { id }, data: data as never })
    return NextResponse.json({ assembly })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[assembly] PATCH:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
