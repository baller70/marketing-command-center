import { NextRequest, NextResponse } from "next/server";
import { execFileSync } from "child_process";
import fs from "fs";

const GSTACK_PATH = "/opt/apps/gstack";

const GSTACK_SKILLS = [
  "review", "qa", "cso", "ship", "office-hours", "pair", "debug",
  "refactor", "test", "docs", "perf", "security", "deploy",
  "plan", "estimate", "standup", "retro", "onboard",
  "migrate", "monitor", "incident", "postmortem", "release",
] as const;

export async function GET() {
  const gstackAvailable = fs.existsSync(GSTACK_PATH);

  return NextResponse.json({
    available: gstackAvailable,
    path: GSTACK_PATH,
    skills: GSTACK_SKILLS,
    totalSkills: GSTACK_SKILLS.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { skill, args = [] } = await req.json();

    if (!GSTACK_SKILLS.includes(skill)) {
      return NextResponse.json({ error: `Unknown GStack skill: ${skill}` }, { status: 400 });
    }

    const safeArgs = (args as string[]).filter(a => /^[\w\-.=/]+$/.test(a));

    let output: string;
    try {
      output = execFileSync("bash", ["-c", `cd ${GSTACK_PATH} && ./${skill} ${safeArgs.join(" ")}`], {
        encoding: "utf-8",
        timeout: 35000,
      });
    } catch (err) {
      output = err instanceof Error ? (err as { stdout?: string }).stdout ?? err.message : String(err);
    }

    return NextResponse.json({
      skill,
      output: output.slice(0, 10000),
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "GStack execution failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
