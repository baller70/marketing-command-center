/**
 * File-based retry queue for failed social media posts.
 * Directory: /data/marketing-post-retry-queue/{pending,completed,failed}
 */

import { mkdir, writeFile, readdir, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { exec } from "child_process";

const QUEUE_ROOT = "/data/marketing-post-retry-queue";
const DIRS = ["pending", "completed", "failed"] as const;
const BACKOFF_MS = [60_000, 300_000, 900_000];

export interface FailedPost {
  id: string;
  content: string;
  postizIds?: string[];
  opencliAccounts?: { platform: string; cmd: string }[];
  mediaUrl?: string;
  brand?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string;
  lastError: string;
  createdAt: string;
}

async function ensureDirs(): Promise<void> {
  for (const dir of DIRS) {
    await mkdir(path.join(QUEUE_ROOT, dir), { recursive: true });
  }
}

export async function enqueueFailed(
  post: Omit<FailedPost, "id" | "retryCount" | "maxRetries" | "nextRetryAt" | "createdAt">
): Promise<FailedPost> {
  await ensureDirs();
  const entry: FailedPost = {
    ...post,
    id: randomUUID(),
    retryCount: 0,
    maxRetries: 3,
    nextRetryAt: new Date(Date.now() + BACKOFF_MS[0]).toISOString(),
    createdAt: new Date().toISOString(),
  };
  await writeFile(path.join(QUEUE_ROOT, "pending", `${entry.id}.json`), JSON.stringify(entry, null, 2), { mode: 0o600 });
  return entry;
}

async function executeRetry(post: FailedPost): Promise<boolean> {
  const postizUrl = process.env.POSTIZ_BACKEND_URL || "http://localhost:8085";
  const postizToken = process.env.POSTIZ_API_TOKEN || "";

  if (post.postizIds && post.postizIds.length > 0) {
    const body: Record<string, unknown> = { content: post.content, integrationIds: post.postizIds };
    if (post.mediaUrl) body.media = [{ url: post.mediaUrl }];
    const res = await fetch(`${postizUrl}/public/v1/posts`, {
      method: "POST",
      headers: { Authorization: postizToken, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Postiz ${res.status}: ${text.slice(0, 300)}`);
    }
  }

  if (post.opencliAccounts && post.opencliAccounts.length > 0) {
    for (const acct of post.opencliAccounts) {
      const escaped = post.content.replace(/"/g, '\\"');
      const cmd = `/usr/local/bin/opencli-rs ${acct.platform} ${acct.cmd} --text "${escaped}" --format json`;
      await new Promise<string>((resolve, reject) => {
        exec(cmd, { timeout: 30_000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
          if (err && !stdout && !stderr) { reject(new Error(err.message)); return; }
          resolve((stdout || "") + (stderr ? `\n${stderr}` : ""));
        });
      });
    }
  }
  return true;
}

export async function processRetries(): Promise<{ retried: number; failed: number }> {
  await ensureDirs();
  const pendingDir = path.join(QUEUE_ROOT, "pending");
  const files = (await readdir(pendingDir)).filter((f) => f.endsWith(".json"));
  const now = Date.now();
  let retried = 0;
  let failedCount = 0;

  for (const file of files) {
    const filePath = path.join(pendingDir, file);
    let post: FailedPost;
    try { post = JSON.parse(await readFile(filePath, "utf-8")); } catch { continue; }
    if (new Date(post.nextRetryAt).getTime() > now) continue;

    try {
      await executeRetry(post);
      post.retryCount += 1;
      await writeFile(path.join(QUEUE_ROOT, "completed", file), JSON.stringify(post, null, 2), { mode: 0o600 });
      await unlink(filePath).catch(() => {});
      retried++;
    } catch (err) {
      post.retryCount += 1;
      post.lastError = err instanceof Error ? err.message : String(err);
      if (post.retryCount >= post.maxRetries) {
        await writeFile(path.join(QUEUE_ROOT, "failed", file), JSON.stringify(post, null, 2), { mode: 0o600 });
        await unlink(filePath).catch(() => {});
        failedCount++;
      } else {
        const backoffIndex = Math.min(post.retryCount, BACKOFF_MS.length - 1);
        post.nextRetryAt = new Date(Date.now() + BACKOFF_MS[backoffIndex]).toISOString();
        await writeFile(filePath, JSON.stringify(post, null, 2), { mode: 0o600 });
      }
    }
  }
  return { retried, failed: failedCount };
}

export async function getDeadLetter(): Promise<FailedPost[]> {
  await ensureDirs();
  const files = (await readdir(path.join(QUEUE_ROOT, "failed"))).filter((f) => f.endsWith(".json"));
  const posts: FailedPost[] = [];
  for (const file of files) {
    try { posts.push(JSON.parse(await readFile(path.join(QUEUE_ROOT, "failed", file), "utf-8"))); } catch {}
  }
  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
