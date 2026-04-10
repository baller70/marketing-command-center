import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto-Prune Learning Rules
 * 
 * Prevents unbounded growth of learning rules by:
 * 1. Deduplicating rules with identical brand + loopType + rule text
 * 2. Removing rules older than 90 days (stale insights)
 * 3. Capping total rules per brand at 100 (keep most recent)
 * 
 * ZERO COST — local data only.
 * 
 * GET  - Preview what would be pruned
 * POST - Execute pruning
 */

interface PruneResult {
  duplicatesRemoved: number
  staleRemoved: number
  capRemoved: number
  totalBefore: number
  totalAfter: number
}

async function analyzePruning(): Promise<PruneResult & { dryRun: true; duplicateIds: string[]; staleIds: string[]; capIds: string[] }> {
  const totalBefore = await prisma.learningRule.count()
  
  // 1. Find duplicates (same brand + loopType + first 100 chars of rule)
  const allRules = await prisma.learningRule.findMany({
    select: { id: true, brand: true, loopType: true, rule: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const seen = new Map<string, string>() // key -> first (newest) id
  const duplicateIds: string[] = []
  for (const r of allRules) {
    const key = `${r.brand}::${r.loopType}::${r.rule.slice(0, 100)}`
    if (seen.has(key)) {
      duplicateIds.push(r.id)
    } else {
      seen.set(key, r.id)
    }
  }

  // 2. Find stale rules (older than 90 days)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const staleRules = await prisma.learningRule.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true },
  })
  const staleIds = staleRules.map(r => r.id).filter(id => !duplicateIds.includes(id))

  // 3. Cap per brand at 100 (keep newest)
  const brands = await prisma.brandPod.findMany({ where: { status: 'active' }, select: { brand: true } })
  const capIds: string[] = []
  for (const bp of brands) {
    const brandRules = await prisma.learningRule.findMany({
      where: { brand: bp.brand },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
      skip: 100,
    })
    for (const r of brandRules) {
      if (!duplicateIds.includes(r.id) && !staleIds.includes(r.id)) {
        capIds.push(r.id)
      }
    }
  }

  return {
    dryRun: true,
    duplicatesRemoved: duplicateIds.length,
    staleRemoved: staleIds.length,
    capRemoved: capIds.length,
    totalBefore,
    totalAfter: totalBefore - duplicateIds.length - staleIds.length - capIds.length,
    duplicateIds,
    staleIds,
    capIds,
  }
}

export async function GET() {
  try {
    const result = await analyzePruning()
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-prune-learning] GET:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const analysis = await analyzePruning()
    const allIdsToDelete = [
      ...analysis.duplicateIds,
      ...analysis.staleIds,
      ...analysis.capIds,
    ]

    if (allIdsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'No rules to prune',
        totalBefore: analysis.totalBefore,
        totalAfter: analysis.totalBefore,
        pruned: 0,
      })
    }

    // Delete in batches of 500
    let deleted = 0
    for (let i = 0; i < allIdsToDelete.length; i += 500) {
      const batch = allIdsToDelete.slice(i, i + 500)
      const result = await prisma.learningRule.deleteMany({
        where: { id: { in: batch } },
      })
      deleted += result.count
    }

    const totalAfter = await prisma.learningRule.count()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pruned: deleted,
      breakdown: {
        duplicates: analysis.duplicatesRemoved,
        stale: analysis.staleRemoved,
        capped: analysis.capRemoved,
      },
      totalBefore: analysis.totalBefore,
      totalAfter,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-prune-learning] POST:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
