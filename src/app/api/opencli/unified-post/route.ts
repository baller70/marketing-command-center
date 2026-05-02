import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { checkDuplicate, appendLog } from "@/lib/social-post-log";
import { enqueueFailed } from "@/lib/post-retry-queue";

interface OpencliAccount {
  platform: string;
  cmd: string;
}

interface UnifiedPostBody {
  content: string;
  postizIds?: string[];
  opencliAccounts?: OpencliAccount[];
  mediaUrl?: string;
  scheduledAt?: string;
  brand?: string;
}

interface PostResult {
  platform: string;
  account: string;
  status: "success" | "failed";
  error?: string;
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const postizUrl = process.env.POSTIZ_BACKEND_URL || "http://localhost:8085";
  const postizToken = process.env.POSTIZ_API_TOKEN || "";

  try {
    const body: UnifiedPostBody = await req.json();
    const { content, postizIds, opencliAccounts, mediaUrl, scheduledAt, brand } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }
    if ((!postizIds || postizIds.length === 0) && (!opencliAccounts || opencliAccounts.length === 0)) {
      return NextResponse.json({ error: "At least one postizId or opencliAccount required" }, { status: 400 });
    }

    const allPlatforms = [
      ...(postizIds || []).map(() => "postiz"),
      ...(opencliAccounts || []).map((a) => a.platform),
    ];
    const dupCheck = await checkDuplicate(content, allPlatforms);
    if (dupCheck.isDuplicate) {
      return NextResponse.json({ duplicate: true, match: dupCheck.match }, { status: 409 });
    }

    const results: PostResult[] = [];

    if (postizIds && postizIds.length > 0) {
      const postBody: Record<string, unknown> = { content, integrationIds: postizIds };
      if (mediaUrl) postBody.media = [{ url: mediaUrl }];
      if (scheduledAt) postBody.date = scheduledAt;

      try {
        const res = await fetch(`${postizUrl}/public/v1/posts`, {
          method: "POST",
          headers: { Authorization: postizToken, "Content-Type": "application/json" },
          body: JSON.stringify(postBody),
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Postiz ${res.status}: ${text.slice(0, 300)}`);
        }
        for (const id of postizIds) {
          results.push({ platform: "postiz", account: id, status: "success" });
        }
      } catch (err) {
        for (const id of postizIds) {
          results.push({ platform: "postiz", account: id, status: "failed", error: err instanceof Error ? err.message : String(err) });
        }
      }
    }

    if (opencliAccounts && opencliAccounts.length > 0) {
      for (const acct of opencliAccounts) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const escaped = content.replace(/"/g, '\\"');
          const cmd = `/usr/local/bin/opencli-rs ${acct.platform} ${acct.cmd} --text "${escaped}" --format json`;
          await new Promise<string>((resolve, reject) => {
            exec(cmd, { timeout: 30_000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
              if (err && !stdout && !stderr) { reject(new Error(err.message)); return; }
              resolve((stdout || "") + (stderr ? `\n${stderr}` : ""));
            });
          });
          results.push({ platform: acct.platform, account: acct.cmd, status: "success" });
        } catch (err) {
          results.push({ platform: acct.platform, account: acct.cmd, status: "failed", error: err instanceof Error ? err.message : String(err) });
        }
      }
    }

    const hasFailure = results.some((r) => r.status === "failed");
    const hasSuccess = results.some((r) => r.status === "success");

    await appendLog({
      timestamp: new Date().toISOString(),
      brand: brand || "unknown",
      platforms: allPlatforms,
      contentPreview: content.slice(0, 200),
      status: hasFailure ? (hasSuccess ? "retry" : "failed") : "success",
    });

    if (hasFailure) {
      const failedPostiz = results.filter((r) => r.platform === "postiz" && r.status === "failed").map((r) => r.account);
      const failedCli = results.filter((r) => r.platform !== "postiz" && r.status === "failed").map((r) => ({ platform: r.platform, cmd: r.account }));
      await enqueueFailed({
        content,
        postizIds: failedPostiz.length > 0 ? failedPostiz : undefined,
        opencliAccounts: failedCli.length > 0 ? failedCli : undefined,
        mediaUrl,
        brand: brand || "unknown",
        lastError: results.find((r) => r.status === "failed")?.error || "unknown",
      });
    }

    return NextResponse.json({ results, hasFailure, hasSuccess });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Post failed" }, { status: 500 });
  }
}
