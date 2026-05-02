import { NextRequest, NextResponse } from "next/server";

interface HistoryEntry {
  id: number;
  commandId: string;
  status: string;
  params: Record<string, unknown>;
  executedAt: string;
  executedBy: string;
}

const history: HistoryEntry[] = [];
let nextId = 1;

export function recordExecution(commandId: string, status: string, params: Record<string, unknown>, executedBy = "admin") {
  history.unshift({
    id: nextId++,
    commandId,
    status,
    params,
    executedAt: new Date().toISOString(),
    executedBy,
  });
  if (history.length > 500) history.length = 500;
}

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const commandFilter = req.nextUrl.searchParams.get("command");

  let filtered = history;
  if (commandFilter) {
    filtered = history.filter(h => h.commandId.includes(commandFilter));
  }

  return NextResponse.json({
    total: filtered.length,
    entries: filtered.slice(0, limit),
  });
}
