import { NextResponse } from 'next/server';
import { umami } from '@/lib/integrations/umami';

const WEBSITES: Record<string, string> = {
  tbf: '733a8665-962c-452d-8a94-bbc17b5babb9',
  ra1: 'ad0446a5-830a-4b6b-a2c4-d3f354aa7eea',
  hos: 'c201600f-6a4a-4fb0-892d-21b1aa3ec8ae',
  shotiq: 'f060591a-a9f6-43cb-b777-5ddedf7b0261',
  bookmarkai: '53f605cc-38c9-4d43-83e8-abae2e765134',
};

export async function GET() {
  const token = process.env.UMAMI_API_TOKEN;
  if (!token) {
    return NextResponse.json({
      success: false,
      configured: false,
      message: 'Umami not configured — set UMAMI_API_TOKEN in .env',
    });
  }

  try {
    const results: Record<string, unknown> = {};
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;

    for (const [brand, websiteId] of Object.entries(WEBSITES)) {
      try {
        const stats = await umami.getWebsiteStats(websiteId, yesterday, now);
        results[brand] = stats;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[analytics] ${brand}:`, msg, err)
        results[brand] = { error: 'unreachable' }
      }
    }

    return NextResponse.json({
      success: true,
      configured: true,
      source: 'umami',
      websites: Object.keys(WEBSITES).length,
      analytics: results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[analytics]', msg, err)
    return NextResponse.json(
      {
        success: false,
        configured: true,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
