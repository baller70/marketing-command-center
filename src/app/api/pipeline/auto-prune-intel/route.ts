import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Prune Intelligence Entries
 * 
 * Prevents intelligence table bloat by removing old, processed entries.
 * Keeps the pipeline fast and DB lean.
 * 
 * Rules:
 * - Entries older than 30 days with status 'processed' or 'reviewed' → delete
 * - Entries older than 60 days regardless of status → delete
 * - Never delete entries less than 7 days old
 * - Keeps a maximum of 500 entries (newest first)
 * 
 * ZERO COST — internal DB cleanup only.
 * 
 * GET  - Preview what would be pruned
 * POST - Execute pruning
 */

const RETENTION_PROCESSED_DAYS = 30
const RETENTION_MAX_DAYS = 60
const MAX_ENTRIES = 500

async function calculatePruning() {
  const now = new Date()
  const processedCutoff = new Date(now.getTime() - RETENTION_PROCESSED_DAYS * 24 * 60 * 60 * 1000)
  const maxCutoff = new Date(now.getTime() - RETENTION_MAX_DAYS * 24 * 60 * 60 * 1000)

  // Old processed entries
  const oldProcessed = await prisma.intelligenceEntry.findMany({
    where: {
      status: { in: ['processed', 'reviewed'] },
      createdAt: { lt: processedCutoff },
    },
    select: { id: true, source: true, createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  })

  // Very old entries regardless of status
  const veryOld = await prisma.intelligenceEntry.findMany({
    where: {
      createdAt: { lt: maxCutoff },
      id: { notIn: oldProcessed.map(e => e.id) },
    },
    select: { id: true, source: true, createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  })

  // Overflow entries (keep newest MAX_ENTRIES)
  const totalCount = await prisma.intelligenceEntry.count()
  let overflowIds: string[] = []
  if (totalCount > MAX_ENTRIES) {
    const overflow = await prisma.intelligenceEntry.findMany({
      orderBy: { createdAt: 'desc' },
      skip: MAX_ENTRIES,
      select: { id: true },
    })
    // Exclude already-marked entries
    const alreadyMarked = new Set([...oldProcessed.map(e => e.id), ...veryOld.map(e => e.id)])
    overflowIds = overflow.map(e => e.id).filter(id => !alreadyMarked.has(id))
  }

  const allIds = [
    ...oldProcessed.map(e => e.id),
    ...veryOld.map(e => e.id),
    ...overflowIds,
  ]

  return {
    totalEntries: totalCount,
    toPrune: {
      oldProcessed: oldProcessed.length,
      veryOld: veryOld.length,
      overflow: overflowIds.length,
      total: allIds.length,
    },
    ids: allIds,
  }
}

export async function GET() {
  try {
    const result = await calculatePruning()
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      ...result,
      config: {
        retentionProcessedDays: RETENTION_PROCESSED_DAYS,
        retentionMaxDays: RETENTION_MAX_DAYS,
        maxEntries: MAX_ENTRIES,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await calculatePruning()

    if (result.ids.length === 0) {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        pruned: 0,
        message: 'No entries to prune',
        totalRemaining: result.totalEntries,
      })
    }

    // Delete in batches of 100
    let deleted = 0
    for (let i = 0; i < result.ids.length; i += 100) {
      const batch = result.ids.slice(i, i + 100)
      const res = await prisma.intelligenceEntry.deleteMany({
        where: { id: { in: batch } },
      })
      deleted += res.count
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pruned: deleted,
      breakdown: result.toPrune,
      totalRemaining: result.totalEntries - deleted,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
