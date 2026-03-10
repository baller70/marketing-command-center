import { prisma } from '@/lib/prisma'
import { umami } from '@/lib/integrations/umami'
import { NextRequest, NextResponse } from 'next/server'

const WEBSITES: Record<string, string> = {
  tbf: '733a8665-962c-452d-8a94-bbc17b5babb9',
  ra1: 'ad0446a5-830a-4b6b-a2c4-d3f354aa7eea',
  hos: 'c201600f-6a4a-4fb0-892d-21b1aa3ec8ae',
  shotiq: 'f060591a-a9f6-43cb-b777-5ddedf7b0261',
  bookmarkai: '53f605cc-38c9-4d43-83e8-abae2e765134',
}

interface AnalyticsInsight {
  type: string
  metric: string
  value: string
  insight: string
}

async function gatherUmamiAnalytics(): Promise<{
  insights: AnalyticsInsight[]
  raw: Record<string, unknown>
}> {
  const now = Date.now()
  const yesterday = now - 24 * 60 * 60 * 1000
  const insights: AnalyticsInsight[] = []
  const raw: Record<string, unknown> = {}

  for (const [brand, websiteId] of Object.entries(WEBSITES)) {
    try {
      const stats = await umami.getWebsiteStats(websiteId, yesterday, now)
      raw[`${brand}_stats`] = stats

      if (stats) {
        const pv = stats.pageviews?.value ?? 0
        const visitors = stats.visitors?.value ?? 0
        const bounceRate = stats.bounces?.value ?? 0

        if (pv > 0 || visitors > 0) {
          insights.push({
            type: 'web_overview',
            metric: `${brand}_traffic`,
            value: JSON.stringify({ pageviews: pv, visitors, bounceRate }),
            insight: `${brand.toUpperCase()}: ${pv} pageviews, ${visitors} unique visitors (last 24h)`,
          })
        }
      }
    } catch (e) {
      raw[`${brand}_error`] = String(e)
    }

    try {
      const pages = await umami.getTopPages(websiteId, yesterday, now)
      raw[`${brand}_topPages`] = pages

      if (Array.isArray(pages) && pages.length > 0) {
        const top5 = pages.slice(0, 5)
        insights.push({
          type: 'top_pages',
          metric: `${brand}_pages`,
          value: JSON.stringify(top5),
          insight: `${brand.toUpperCase()} top pages: ${top5.map((p: any) => `${p.x} (${p.y})`).join(', ')}`,
        })
      }
    } catch (e) {
      raw[`${brand}_topPagesError`] = String(e)
    }

    try {
      const refs = await umami.getReferrers(websiteId, yesterday, now)
      raw[`${brand}_referrers`] = refs

      if (Array.isArray(refs) && refs.length > 0) {
        const top5 = refs.slice(0, 5)
        insights.push({
          type: 'traffic_sources',
          metric: `${brand}_referrers`,
          value: JSON.stringify(top5),
          insight: `${brand.toUpperCase()} traffic sources: ${top5.map((r: any) => `${r.x} (${r.y})`).join(', ')}`,
        })
      }
    } catch (e) {
      raw[`${brand}_referrersError`] = String(e)
    }
  }

  return { insights, raw }
}

export async function GET() {
  try {
    const { insights, raw } = await gatherUmamiAnalytics()
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      source: 'umami',
      insights,
      raw,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Umami analytics preview failed', details: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { insights, raw } = await gatherUmamiAnalytics()
    const dateKey = new Date().toISOString().slice(0, 10)
    const created: string[] = []
    const skipped: string[] = []

    for (const insight of insights) {
      const source = `auto-umami:${insight.type}:${dateKey}`

      const existing = await prisma.intelligenceEntry.findFirst({
        where: { source, insight: { startsWith: insight.insight.slice(0, 50) } },
      })
      if (existing) {
        skipped.push(`${insight.type}: already exists`)
        continue
      }

      await prisma.intelligenceEntry.create({
        data: {
          brand: insight.metric.split('_')[0] || 'all',
          category: 'analytics',
          source,
          insight: `[Real Analytics] ${insight.insight}`,
          actionable: true,
          actionRecommended: `Review ${insight.metric} data and adjust campaigns accordingly.`,
          priority: 'medium',
          status: 'new',
        },
      })
      created.push(`${insight.type}: ${insight.insight.slice(0, 80)}`)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'umami',
      persisted: { created: created.length, skipped: skipped.length, details: created },
      analyticsRaw: raw,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Umami analytics ingestion failed', details: String(error) }, { status: 500 })
  }
}
