import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface AgentKey {
  key: string;
  name: string;
  role: "admin" | "agent";
  createdAt: string;
  lastUsed: string | null;
  rateLimit: number;
}

const agentKeys = new Map<string, AgentKey>();

function generateKey(): string {
  return `tbf_cli_${crypto.randomBytes(24).toString("hex")}`;
}

export async function GET() {
  const keys = Array.from(agentKeys.values()).map(k => ({
    name: k.name,
    keyPrefix: k.key.slice(0, 16) + "...",
    role: k.role,
    createdAt: k.createdAt,
    lastUsed: k.lastUsed,
    rateLimit: k.rateLimit,
  }));

  return NextResponse.json({ keys, total: keys.length });
}

export async function POST(req: NextRequest) {
  try {
    const { action, name, key: inputKey, rateLimit: rl = 100 } = await req.json();

    if (action === "create") {
      if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
      const key = generateKey();
      agentKeys.set(key, {
        key,
        name,
        role: "agent",
        createdAt: new Date().toISOString(),
        lastUsed: null,
        rateLimit: rl,
      });
      return NextResponse.json({ key, name, message: "Store this key securely. It won't be shown again." });
    }

    if (action === "validate") {
      const entry = agentKeys.get(inputKey);
      if (!entry) return NextResponse.json({ valid: false });
      entry.lastUsed = new Date().toISOString();
      return NextResponse.json({ valid: true, name: entry.name, role: entry.role });
    }

    if (action === "revoke") {
      if (!inputKey) return NextResponse.json({ error: "key is required" }, { status: 400 });
      const deleted = agentKeys.delete(inputKey);
      return NextResponse.json({ revoked: deleted });
    }

    return NextResponse.json({ error: "Unknown action. Use: create, validate, revoke" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Agent auth failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
