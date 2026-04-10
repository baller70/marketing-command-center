import { NextResponse } from "next/server";

const BASE_URL = `http://localhost:${process.env.PORT || 3012}`;

export async function GET() {
  const start = Date.now();
  const results: Record<string, unknown> = {};

  // 1. Run auto-advance
  try {
    const res = await fetch(`${BASE_URL}/api/marketing-pipeline/auto-advance`, {
      method: "POST",
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) {
      results.autoAdvance = await res.json();
    } else {
      results.autoAdvance = { error: `HTTP ${res.status}` };
    }
  } catch (err: unknown) {
    results.autoAdvance = { error: err instanceof Error ? err.message : "failed" };
  }

  // 2. Run Postiz intake poll (every call)
  try {
    const res = await fetch(`${BASE_URL}/api/marketing-pipeline/intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "postiz" }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      results.postizIntake = await res.json();
    } else {
      results.postizIntake = { error: `HTTP ${res.status}` };
    }
  } catch (err: unknown) {
    results.postizIntake = { error: err instanceof Error ? err.message : "failed" };
  }

  // 3. Run ContentHub intake poll
  try {
    const res = await fetch(`${BASE_URL}/api/marketing-pipeline/intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "contenthub" }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      results.contenthubIntake = await res.json();
    } else {
      results.contenthubIntake = { error: `HTTP ${res.status}` };
    }
  } catch (err: unknown) {
    results.contenthubIntake = { error: err instanceof Error ? err.message : "failed" };
  }

  return NextResponse.json({
    success: true,
    durationMs: Date.now() - start,
    results,
    timestamp: new Date().toISOString(),
  });
}
