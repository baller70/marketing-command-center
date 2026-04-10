import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auto RSS Intelligence Ingestion
 * 
 * Pulls real-world marketing news/trends from free RSS feeds,
 * parses them, and creates IntelligenceEntry records tagged as external.
 * 
 * Sources (all free, no API key):
 * - Marketing Land / Search Engine Land RSS
 * - HubSpot Marketing Blog RSS  
 * - Content Marketing Institute RSS
 * - Google Trends RSS (via feedburner)
 * 
 * GET  - Preview what would be ingested
 * POST - Ingest and persist entries
 */

const RSS_FEEDS = [
  {
    url: 'https://feeds.feedburner.com/ContentMarketingInstitute',
    source: 'content-marketing-institute',
    category: 'industry',
    brand: 'all',
  },
  {
    url: 'https://blog.hubspot.com/marketing/rss.xml',
    source: 'hubspot-marketing',
    category: 'industry',
    brand: 'all',
  },
  {
    url: 'https://www.socialmediatoday.com/feed',
    source: 'social-media-today',
    category: 'platform',
    brand: 'all',
  },
  {
    url: 'https://searchengineland.com/feed',
    source: 'search-engine-land',
    category: 'platform',
    brand: 'all',
  },
  {
    url: 'https://feeds.feedburner.com/naborly',
    source: 'marketing-profs',
    category: 'industry',
    brand: 'all',
  },
  {
    url: 'https://sproutsocial.com/insights/feed/',
    source: 'sprout-social-insights',
    category: 'platform',
    brand: 'all',
  },
  {
    url: 'https://neilpatel.com/blog/feed/',
    source: 'neil-patel',
    category: 'industry',
    brand: 'all',
  },
  {
    url: 'https://moz.com/blog/feed',
    source: 'moz-blog',
    category: 'industry',
    brand: 'all',
  },
]

interface RSSItem {
  title: string
  link: string
  description: string
  pubDate: string
}

function extractItems(xml: string): RSSItem[] {
  const items: RSSItem[] = []
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() || ''
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1]?.trim() || ''
    const desc = block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim() || ''
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || ''

    if (title) {
      // Strip HTML tags, CDATA, entities from description
      const cleanDesc = desc
        .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200)
      items.push({ title, link, description: cleanDesc, pubDate })
    }
  }

  return items.slice(0, 5) // Max 5 per feed
}

function itemToInsight(item: RSSItem, feed: typeof RSS_FEEDS[0]): string {
  const desc = item.description ? ` — ${item.description.slice(0, 200)}` : ''
  return `[External] ${item.title}${desc} (Source: ${feed.source})`
}

function itemToAction(item: RSSItem): string {
  return `Review external insight and assess relevance to active campaigns. Source: ${item.link || 'RSS feed'}`
}

async function fetchFeed(feed: typeof RSS_FEEDS[0]): Promise<RSSItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MarketingCommandCenter/1.0' },
    })
    clearTimeout(timeout)
    
    if (!res.ok) return []
    const xml = await res.text()
    return extractItems(xml)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.warn(`[auto-rss-intel] Failed to fetch ${feed.source}:`, msg, err)
    return []
  }
}

async function gatherRSSIntelligence() {
  const dateKey = new Date().toISOString().slice(0, 10)
  const entries: Array<{
    brand: string
    category: string
    source: string
    insight: string
    actionable: boolean
    actionRecommended: string
    priority: string
    feedSource: string
  }> = []

  const results = await Promise.allSettled(RSS_FEEDS.map(f => fetchFeed(f)))
  
  for (let i = 0; i < RSS_FEEDS.length; i++) {
    const feed = RSS_FEEDS[i]
    const result = results[i]
    if (result.status !== 'fulfilled') continue
    
    for (const item of result.value) {
      entries.push({
        brand: feed.brand,
        category: feed.category,
        source: `auto-rss:${feed.source}:${dateKey}`,
        insight: itemToInsight(item, feed),
        actionable: true,
        actionRecommended: itemToAction(item),
        priority: 'low',
        feedSource: feed.source,
      })
    }
  }

  return entries
}

export async function GET() {
  try {
    const entries = await gatherRSSIntelligence()
    return NextResponse.json({
      success: true,
      preview: true,
      timestamp: new Date().toISOString(),
      feeds: RSS_FEEDS.map(f => ({ source: f.source, url: f.url })),
      entries,
      summary: { total: entries.length },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-rss-intel] GET error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const entries = await gatherRSSIntelligence()
    const created: string[] = []
    const skipped: string[] = []

    for (const entry of entries) {
      // Deduplicate by source string (contains date + feed)
      const existing = await prisma.intelligenceEntry.findFirst({
        where: { source: entry.source, insight: { startsWith: entry.insight.slice(0, 50) } },
      })
      if (existing) {
        skipped.push(`${entry.feedSource}: already exists`)
        continue
      }

      await prisma.intelligenceEntry.create({
        data: {
          brand: entry.brand,
          category: entry.category,
          source: entry.source,
          insight: entry.insight,
          actionable: entry.actionable,
          actionRecommended: entry.actionRecommended,
          priority: entry.priority,
          status: 'new',
        },
      })
      created.push(`${entry.feedSource}: ${entry.insight.slice(0, 80)}...`)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      persisted: { created: created.length, skipped: skipped.length, details: created },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[auto-rss-intel] POST error:', msg, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
