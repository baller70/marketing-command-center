import { NextResponse } from "next/server";
import { exec } from "child_process";
import { mautic } from "@/lib/integrations/mautic";
import { formbricks } from "@/lib/integrations/formbricks";
import { novu } from "@/lib/integrations/novu";

export const dynamic = "force-dynamic";

async function checkPostiz(): Promise<{ status: string; latencyMs: number }> {
  const url = process.env.POSTIZ_BACKEND_URL || "http://localhost:8085";
  const token = process.env.POSTIZ_API_TOKEN || "";
  const start = Date.now();
  try {
    const res = await fetch(`${url}/public/v1/integrations`, {
      headers: { Authorization: token },
      signal: AbortSignal.timeout(5000),
    });
    return { status: res.ok ? "connected" : `error:${res.status}`, latencyMs: Date.now() - start };
  } catch {
    return { status: "unreachable", latencyMs: Date.now() - start };
  }
}

async function checkOpencliRs(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const output = await new Promise<string>((resolve, reject) => {
      exec("/usr/local/bin/opencli-rs --version 2>/dev/null | tail -1", { timeout: 5000 }, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout.trim());
      });
    });
    return { status: `ok:${output}`, latencyMs: Date.now() - start };
  } catch {
    return { status: "unavailable", latencyMs: Date.now() - start };
  }
}

async function checkMautic(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const ok = await mautic.isHealthy();
    return { status: ok ? "connected" : "unhealthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "unreachable", latencyMs: Date.now() - start };
  }
}

async function checkUmami(): Promise<{ status: string; latencyMs: number }> {
  const url = process.env.UMAMI_URL || "http://localhost:8083";
  const start = Date.now();
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
    return { status: res.status > 0 ? "connected" : "error", latencyMs: Date.now() - start };
  } catch {
    return { status: "unreachable", latencyMs: Date.now() - start };
  }
}

async function checkFormbricks(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const ok = await formbricks.isHealthy();
    return { status: ok ? "connected" : "unhealthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "unreachable", latencyMs: Date.now() - start };
  }
}

async function checkNovu(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const ok = await novu.isHealthy();
    return { status: ok ? "connected" : "unhealthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "unreachable", latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const [postiz, opencliRs, mauticHealth, umami, formbricksHealth, novuHealth] = await Promise.all([
    checkPostiz(),
    checkOpencliRs(),
    checkMautic(),
    checkUmami(),
    checkFormbricks(),
    checkNovu(),
  ]);

  return NextResponse.json({ postiz, opencliRs, mautic: mauticHealth, umami, formbricks: formbricksHealth, novu: novuHealth });
}
