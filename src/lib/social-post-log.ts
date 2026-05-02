/**
 * Audit logging for social media posts.
 * Stores entries as JSON lines in /data/logs/marketing-social-posts.jsonl.
 * Provides duplicate detection via Jaccard similarity on word sets.
 */

import { mkdir, appendFile, readFile } from "fs/promises";
import path from "path";

const LOG_DIR = "/data/logs";
const LOG_FILE = path.join(LOG_DIR, "marketing-social-posts.jsonl");

export interface PostLogEntry {
  timestamp: string;
  brand: string;
  platforms: string[];
  contentPreview: string;
  status: "success" | "failed" | "duplicate" | "retry";
  error?: string;
  retryCount?: number;
}

interface DuplicateMatch {
  date: string;
  platforms: string[];
}

interface DuplicateResult {
  isDuplicate: boolean;
  match?: DuplicateMatch;
}

interface QueryOpts {
  brand?: string;
  days?: number;
  limit?: number;
}

export async function appendLog(entry: PostLogEntry): Promise<void> {
  await mkdir(LOG_DIR, { recursive: true });
  const line = JSON.stringify(entry) + "\n";
  await appendFile(LOG_FILE, line, "utf-8");
}

async function readAllEntries(): Promise<PostLogEntry[]> {
  let raw: string;
  try {
    raw = await readFile(LOG_FILE, "utf-8");
  } catch {
    return [];
  }
  const entries: PostLogEntry[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try { entries.push(JSON.parse(trimmed)); } catch {}
  }
  return entries;
}

export async function queryLog(opts: QueryOpts = {}): Promise<PostLogEntry[]> {
  const { brand, days, limit = 50 } = opts;
  let entries = await readAllEntries();
  if (brand) entries = entries.filter((e) => e.brand === brand);
  if (days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    entries = entries.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
  }
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return entries.slice(0, limit);
}

function wordSet(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 0)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const word of a) { if (b.has(word)) intersection++; }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export async function checkDuplicate(content: string, platforms: string[]): Promise<DuplicateResult> {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const entries = await readAllEntries();
  const targetWords = wordSet(content);
  const targetPlatforms = new Set(platforms);

  for (const entry of entries) {
    if (new Date(entry.timestamp).getTime() < cutoff) continue;
    const hasOverlap = entry.platforms.some((p) => targetPlatforms.has(p));
    if (!hasOverlap) continue;
    if (entry.status !== "success" && entry.status !== "retry") continue;
    const entryWords = wordSet(entry.contentPreview);
    const similarity = jaccardSimilarity(targetWords, entryWords);
    if (similarity >= 0.85) {
      return { isDuplicate: true, match: { date: entry.timestamp, platforms: entry.platforms } };
    }
  }
  return { isDuplicate: false };
}
