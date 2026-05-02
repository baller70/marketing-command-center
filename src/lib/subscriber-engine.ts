import { prisma } from "@/lib/prisma";
import { mautic } from "@/lib/integrations/mautic";

const BRANDS = ["TBF", "RA1", "HoS", "ShotIQ", "Kevin", "Bookmark"] as const;
export type SubscriberBrand = (typeof BRANDS)[number];

const MS_DAY = 86_400_000;
const MS_WEEK = 7 * MS_DAY;

const MAUTIC_URL = process.env.MAUTIC_URL || "http://localhost:8088";
const MAUTIC_USER = process.env.MAUTIC_API_USER || "";
const MAUTIC_PASS = process.env.MAUTIC_API_PASS || "";

function mauticAuthHeader(): string {
  if (!MAUTIC_USER) return "";
  return `Basic ${Buffer.from(`${MAUTIC_USER}:${MAUTIC_PASS}`).toString("base64")}`;
}

type MauticFieldBag = Record<string, unknown>;

type MauticContactWire = {
  id?: number | string;
  fields?: { core?: MauticFieldBag; all?: MauticFieldBag };
  tags?: Array<string | { tag?: string }>;
  doNotContact?: Array<{ channel?: string }>;
};

type MauticListResponse = {
  total?: string | number;
  contacts?: Record<string, MauticContactWire>;
};

async function fetchContactsPage(search: string | undefined, start: number, limit: number): Promise<MauticListResponse> {
  const params = new URLSearchParams({ limit: String(limit), start: String(start) });
  if (search) params.set("search", search);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = mauticAuthHeader();
  if (auth) headers.Authorization = auth;
  const res = await fetch(`${MAUTIC_URL}/api/contacts?${params}`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Mautic GET contacts: ${res.status} - ${errText}`);
  }
  return res.json() as Promise<MauticListResponse>;
}

function normalizeEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  return e.includes("@") ? e : null;
}

function fieldFromContact(c: MauticContactWire, keys: string[]): unknown {
  const bags = [c.fields?.core, c.fields?.all].filter(Boolean) as MauticFieldBag[];
  for (const k of keys) {
    const lk = k.toLowerCase();
    for (const bag of bags) {
      if (bag[k] != null && String(bag[k]).trim().length) return bag[k];
      for (const [key, val] of Object.entries(bag)) {
        if (key.toLowerCase() === lk && val != null && String(val).trim().length) return val;
      }
    }
  }
  return undefined;
}

function tagStrings(c: MauticContactWire): string[] {
  const raw = c.tags ?? [];
  const out: string[] = [];
  for (const t of raw) {
    if (typeof t === "string") out.push(t);
    else if (t && typeof t === "object" && typeof t.tag === "string") out.push(t.tag);
  }
  return out.map((x) => x.trim()).filter(Boolean);
}

function brandFromToken(tok: string): SubscriberBrand | null {
  const t = tok.trim();
  if (!t) return null;
  const brandedRaw = /^BRAND[:-_\s]+(.+)$/i.exec(t)?.[1]?.trim();
  if (brandedRaw) {
    const canon = BRANDS.find((b) => b.toUpperCase() === brandedRaw.toUpperCase());
    if (canon) return canon;
  }
  const u = t.toUpperCase();
  const direct = BRANDS.find((b) => b.toUpperCase() === u);
  if (direct) return direct;
  const prefixed = BRANDS.find(
    (b) => u === `${b.toUpperCase()}-LIST` || u.startsWith(`${b.toUpperCase()}-`)
  );
  if (prefixed) return prefixed;
  const parts = u.split(/[^A-Z0-9]+/).filter(Boolean);
  for (const p of parts) {
    const hit = BRANDS.find((b) => b.toUpperCase() === p);
    if (hit) return hit;
  }
  return null;
}

export function detectBrandsFromTags(c: MauticContactWire): SubscriberBrand[] {
  const hits = new Set<SubscriberBrand>();
  for (const t of tagStrings(c)) {
    const b = brandFromToken(t);
    if (b) hits.add(b);
  }
  return [...hits];
}

function parseMauticTotal(v: string | number | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function emailGloballyUnsubscribed(c: MauticContactWire): boolean {
  const dnc = c.doNotContact ?? [];
  if (!Array.isArray(dnc)) return false;
  return dnc.some((e) => {
    const ch = String(e?.channel ?? "").toLowerCase();
    return ch === "email";
  });
}

function scalarTrim(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

export async function syncSubscribersFromMautic(): Promise<{
  fetched: number;
  upserts: number;
  skipped: number;
  pages: number;
}> {
  const pageSize = 200;
  let start = 0;
  let total = Number.POSITIVE_INFINITY;
  let pages = 0;
  let fetched = 0;
  let upserts = 0;
  let skipped = 0;

  while (start < total) {
    pages += 1;
    const payload = await fetchContactsPage(undefined, start, pageSize);
    total = parseMauticTotal(payload.total);
    const entries = payload.contacts ? Object.entries(payload.contacts) : [];
    if (entries.length === 0) break;

    for (const [key, raw] of entries) {
      const c = raw as MauticContactWire;
      const emailRaw = fieldFromContact(c, ["email", "mail"]);
      const email = normalizeEmail(emailRaw);
      if (!email) {
        skipped += 1;
        continue;
      }
      const idNum =
        typeof c.id === "number"
          ? c.id
          : typeof c.id === "string"
            ? Number(c.id)
            : Number(key);
      const externalId = Number.isFinite(idNum) ? String(idNum) : String(key);
      const fixedFname = scalarTrim(fieldFromContact(c, ["firstname", "first_name"]));
      const fixedLname = scalarTrim(fieldFromContact(c, ["lastname", "last_name"]));
      const tagList = tagStrings(c);
      const brands = detectBrandsFromTags(c);
      if (brands.length === 0) {
        skipped += 1;
        continue;
      }
      fetched += 1;
      const blocked = emailGloballyUnsubscribed(c);
      const now = new Date();
      const suppressReason =
        blocked ? ("mautic_do_not_contact" as const) : undefined;

      for (const brand of brands) {
        await prisma.subscriber.upsert({
          where: {
            email_brand: {
              email,
              brand,
            },
          },
          create: {
            email,
            firstName: fixedFname,
            lastName: fixedLname,
            brand,
            source: "mautic",
            externalId,
            engagementTier: "new",
            engagementScore: 50,
            subscribedAt: now,
            tags: tagList,
            ...(blocked
              ? { suppressedAt: now, suppressReason }
              : {}),
          },
          update: {
            firstName: fixedFname,
            lastName: fixedLname,
            externalId,
            tags: tagList,
            source: "mautic",
            ...(blocked
              ? { suppressedAt: now, suppressReason }
              : {}),
          },
        });
        upserts += 1;
      }
    }

    start += entries.length;
    if (entries.length < pageSize) break;
  }

  await mautic.listEmails(5).catch(() => null);

  return { fetched, upserts, skipped, pages };
}

export async function recalculateEngagementScores(): Promise<{ updated: number }> {
  const cutoff30 = new Date(Date.now() - 30 * MS_DAY);
  const subs = await prisma.subscriber.findMany({
    where: { suppressedAt: null },
    select: {
      id: true,
      totalBounces: true,
      subscribedAt: true,
      lastOpenedAt: true,
      lastClickedAt: true,
    },
  });
  if (subs.length === 0) return { updated: 0 };

  const ids = subs.map((s) => s.id);
  const agg = await prisma.subscriberEvent.groupBy({
    by: ["subscriberId", "eventType"],
    where: {
      subscriberId: { in: ids },
      createdAt: { gte: cutoff30 },
    },
    _count: true,
  });
  const map30 = new Map<string, Partial<Record<"open" | "click" | "bounce" | "send", number>>>();
  for (const row of agg) {
    const m = map30.get(row.subscriberId) ?? {};
    const k = row.eventType as "open" | "click" | "bounce" | "send";
    m[k] = row._count;
    map30.set(row.subscriberId, m);
  }

  let updated = 0;
  const now = Date.now();
  for (const s of subs) {
    const m30 = map30.get(s.id) ?? {};
    const opens30 = m30.open ?? 0;
    const clicks30 = m30.click ?? 0;
    const sends30 = m30.send ?? 0;
    const bounces30 = m30.bounce ?? 0;
    const bounceLife = Math.max(s.totalBounces, bounces30);
    const sentNotOpenedApprox = Math.max(0, sends30 - opens30);
    let score = 50;
    score += opens30 * 10;
    score += clicks30 * 20;
    score -= bounceLife * 15;
    score -= sentNotOpenedApprox * 5;
    const lastEngagement = Math.max(
      s.lastClickedAt?.getTime() ?? 0,
      s.lastOpenedAt?.getTime() ?? 0,
      s.subscribedAt.getTime()
    );
    const weeksInactive = Math.floor((now - lastEngagement) / MS_WEEK);
    score -= weeksInactive * 5;
    score = Math.max(0, Math.min(100, Math.round(score)));
    await prisma.subscriber.update({
      where: { id: s.id },
      data: { engagementScore: score },
    });
    updated += 1;
  }
  return { updated };
}

export function tierForScore(score: number, subscribedAt: Date, totalOpens: number, totalClicks: number): string {
  if (
    Date.now() - subscribedAt.getTime() <= 14 * MS_DAY &&
    totalOpens + totalClicks < 4
  )
    return "new";
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  if (score >= 15) return "cold";
  return "inactive";
}

export async function assignEngagementTiers(): Promise<{ updated: number }> {
  const subs = await prisma.subscriber.findMany({
    where: { suppressedAt: null },
    select: {
      id: true,
      engagementScore: true,
      subscribedAt: true,
      totalOpens: true,
      totalClicks: true,
    },
  });
  let updated = 0;
  for (const s of subs) {
    const tier = tierForScore(s.engagementScore, s.subscribedAt, s.totalOpens, s.totalClicks);
    await prisma.subscriber.update({
      where: { id: s.id },
      data: { engagementTier: tier },
    });
    updated += 1;
  }
  return { updated };
}

export async function takeSubscriberSnapshot(brand: string): Promise<void> {
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);

  const all = await prisma.subscriber.groupBy({
    by: ["engagementTier", "suppressedAt"],
    where: { brand },
    _count: true,
  });

  let hotCount = 0;
  let warmCount = 0;
  let coldCount = 0;
  let inactiveCount = 0;
  let newCount = 0;
  let suppressedCount = 0;

  for (const row of all) {
    const n = row._count;
    if (row.suppressedAt != null) {
      suppressedCount += n;
      continue;
    }
    switch (row.engagementTier) {
      case "hot":
        hotCount += n;
        break;
      case "warm":
        warmCount += n;
        break;
      case "cold":
        coldCount += n;
        break;
      case "inactive":
        inactiveCount += n;
        break;
      case "new":
        newCount += n;
        break;
      default:
        newCount += n;
    }
  }

  const totalCount =
    hotCount + warmCount + coldCount + inactiveCount + newCount + suppressedCount;

  await prisma.subscriberSnapshot.upsert({
    where: {
      brand_snapshotDate: {
        brand,
        snapshotDate: day,
      },
    },
    create: {
      brand,
      snapshotDate: day,
      totalCount,
      hotCount,
      warmCount,
      coldCount,
      inactiveCount,
      newCount,
      suppressedCount,
    },
    update: {
      totalCount,
      hotCount,
      warmCount,
      coldCount,
      inactiveCount,
      newCount,
      suppressedCount,
    },
  });
}

export type SubscriberStatsRow = {
  brand: string;
  hot: number;
  warm: number;
  cold: number;
  inactive: number;
  new: number;
  suppressed: number;
  total: number;
};

export async function getSubscriberStats(): Promise<SubscriberStatsRow[]> {
  const rows = await prisma.subscriber.groupBy({
    by: ["brand", "engagementTier", "suppressedAt"],
    _count: true,
  });

  const byBrand = new Map<string, SubscriberStatsRow>();
  for (const b of BRANDS) {
    byBrand.set(b, {
      brand: b,
      hot: 0,
      warm: 0,
      cold: 0,
      inactive: 0,
      new: 0,
      suppressed: 0,
      total: 0,
    });
  }

  for (const row of rows) {
    const rec = byBrand.get(row.brand);
    if (!rec) continue;
    const n = row._count;
    if (row.suppressedAt != null) {
      rec.suppressed += n;
    } else {
      switch (row.engagementTier) {
        case "hot":
          rec.hot += n;
          break;
        case "warm":
          rec.warm += n;
          break;
        case "cold":
          rec.cold += n;
          break;
        case "inactive":
          rec.inactive += n;
          break;
        case "new":
          rec.new += n;
          break;
        default:
          rec.new += n;
      }
    }
    rec.total += n;
  }

  return BRANDS.map((b) => byBrand.get(b)!);
}
