import { NextRequest, NextResponse } from "next/server";
import { processRetries, getDeadLetter } from "@/lib/post-retry-queue";
import { readdir, readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const QUEUE_ROOT = "/data/marketing-post-retry-queue";

async function getPending() {
  try {
    const dir = path.join(QUEUE_ROOT, "pending");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
    const posts = [];
    for (const file of files) {
      try { posts.push(JSON.parse(await readFile(path.join(dir, file), "utf-8"))); } catch {}
    }
    return posts;
  } catch { return []; }
}

async function getCompleted() {
  try {
    const dir = path.join(QUEUE_ROOT, "completed");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
    const posts = [];
    for (const file of files) {
      try { posts.push(JSON.parse(await readFile(path.join(dir, file), "utf-8"))); } catch {}
    }
    return posts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "all";

    if (view === "pending") return NextResponse.json({ ok: true, pending: await getPending() });
    if (view === "dead-letter") return NextResponse.json({ ok: true, deadLetter: await getDeadLetter() });
    if (view === "completed") return NextResponse.json({ ok: true, completed: await getCompleted() });

    const [pending, deadLetter, completed] = await Promise.all([getPending(), getDeadLetter(), getCompleted()]);
    return NextResponse.json({ ok: true, pending, deadLetter, completed, counts: { pending: pending.length, deadLetter: deadLetter.length, completed: completed.length } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Queue read failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    if (action === "process") {
      const result = await processRetries();
      return NextResponse.json({ ok: true, ...result });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Queue processing failed" }, { status: 500 });
  }
}
