import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

export const dynamic = "force-dynamic";

const BINARY = "/usr/local/bin/opencli-rs";
const TIMEOUT = 30_000;

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json();
    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "command required" }, { status: 400 });
    }

    const tokens = command.trim().split(/\s+/);
    if (tokens[0] !== "opencli-rs") {
      return NextResponse.json({ error: "Only opencli-rs commands are allowed" }, { status: 403 });
    }

    const fullCmd = BINARY + " " + tokens.slice(1).join(" ");

    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
      exec(fullCmd, { timeout: TIMEOUT, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
        resolve({
          stdout: stdout || "",
          stderr: stderr || "",
          exitCode: err?.code ?? 0,
        });
      });
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "exec failed" },
      { status: 500 }
    );
  }
}
