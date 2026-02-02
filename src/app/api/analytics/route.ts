import { NextResponse } from 'next/server';

// PostHog configuration - needs to be set up
// Sign up at https://posthog.com (free tier: 1M events/month)
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || 'phc_a9YPRbIEB1n636t4w60EswD8Yw3ms0hmfJPp62wcg1m';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '297549';

interface AnalyticsEvent {
  event: string;
  distinct_id: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

// Check if PostHog is configured
export async function GET() {
  const isConfigured = !!POSTHOG_API_KEY && !!POSTHOG_PROJECT_ID;

  if (!isConfigured) {
    return NextResponse.json({
      success: false,
      configured: false,
      message: 'PostHog not configured',
      setupSteps: [
        '1. Go to https://posthog.com and create free account',
        '2. Create a new project',
        '3. Get your Project API Key from Project Settings',
        '4. Add to .env.local:',
        '   POSTHOG_API_KEY=phc_xxxxx',
        '   POSTHOG_PROJECT_ID=12345',
        '5. Restart the app'
      ],
      freeTier: {
        events: '1M/month',
        sessionRecordings: '5K/month',
        creditCard: 'Not required'
      }
    });
  }

  // Test connection
  try {
    const res = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/`, {
      headers: {
        'Authorization': `Bearer ${POSTHOG_API_KEY}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        configured: true,
        project: {
          id: data.id,
          name: data.name,
          created_at: data.created_at
        }
      });
    }
  } catch (error) {
    console.error('PostHog error:', error);
  }

  return NextResponse.json({
    success: false,
    configured: true,
    error: 'Could not connect to PostHog'
  });
}

// Send event to PostHog
export async function POST(request: Request) {
  if (!POSTHOG_API_KEY) {
    return NextResponse.json({ 
      success: false, 
      error: 'PostHog not configured' 
    }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { event, distinct_id, properties } = body as AnalyticsEvent;

    const res = await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: POSTHOG_API_KEY,
        event,
        distinct_id,
        properties: {
          ...properties,
          $lib: 'marketing-command-center'
        }
      })
    });

    if (res.ok) {
      return NextResponse.json({ success: true, event });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send event' 
    }, { status: 500 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
