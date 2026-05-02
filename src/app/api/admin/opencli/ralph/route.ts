import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";

export const dynamic = "force-dynamic";

const RALPH_PRD_PATH = "/opt/apps/kevinclaw/ralph/divisions/marketing/prd.json";

export async function GET() {
  try {
    if (!existsSync(RALPH_PRD_PATH)) {
      return NextResponse.json({ error: "PRD not found", path: RALPH_PRD_PATH }, { status: 404 });
    }
    const prd = JSON.parse(readFileSync(RALPH_PRD_PATH, "utf-8"));
    return NextResponse.json(prd);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "read failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    if (action === "run") {
      try {
        const output = execFileSync(
          "bash",
          ["/opt/apps/marketing-command-center/run-ralph-opencli.sh"],
          { timeout: 120_000, maxBuffer: 5 * 1024 * 1024 }
        ).toString();
        return NextResponse.json({ status: "started", output: output.substring(0, 2000) });
      } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "run failed" }, { status: 500 });
      }
    }
    if (action === "update-prd") {
      writeFileSync(RALPH_PRD_PATH, JSON.stringify(body.prd, null, 2));
      return NextResponse.json({ status: "updated" });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "post failed" }, { status: 500 });
  }
}
