import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mautic } from "@/lib/integrations/mautic";

const MS_DAY = 86_400_000;

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

export async function cleanBounces(): Promise<number> {
  const bouncedIdsRows = await prisma.subscriberEvent.findMany({
    where: { eventType: "bounce" },
    select: { subscriberId: true },
    distinct: ["subscriberId"],
  });
  const bounceSubscriberIds = bouncedIdsRows.map((r) => r.subscriberId);
  const orBranches: Prisma.SubscriberWhereInput[] = [{ totalBounces: { gt: 0 } }];
  if (bounceSubscriberIds.length) orBranches.unshift({ id: { in: bounceSubscriberIds } });
  const now = new Date();

  const r = await prisma.subscriber.updateMany({
    where: {
      suppressedAt: null,
      OR: orBranches,
    },
    data: {
      suppressedAt: now,
      suppressReason: "bounce",
    },
  });
  return r.count;
}

export async function syncUnsubscribes(): Promise<number> {
  const pageSize = 200;
  let start = 0;
  let total = Number.POSITIVE_INFINITY;
  const blockedEmails = new Set<string>();

  while (start < total) {
    const payload = await fetchContactsPage(undefined, start, pageSize);
    total = parseMauticTotal(payload.total);
    const entries = payload.contacts ? Object.entries(payload.contacts) : [];
    if (entries.length === 0) break;
    for (const [, raw] of entries) {
      const c = raw as MauticContactWire;
      const email = normalizeEmail(fieldFromContact(c, ["email", "mail"]));
      if (!email) continue;
      if (emailGloballyUnsubscribed(c)) blockedEmails.add(email);
    }
    start += entries.length;
    if (entries.length < pageSize) break;
  }

  if (blockedEmails.size === 0) return 0;
  let updated = 0;
  const now = new Date();
  for (const email of blockedEmails) {
    const res = await prisma.subscriber.updateMany({
      where: {
        suppressedAt: null,
        email,
      },
      data: {
        suppressedAt: now,
        suppressReason: "unsubscribe",
      },
    });
    updated += res.count;
  }
  return updated;
}

export async function suppressInactiveSubscribers(): Promise<number> {
  const cutoff = new Date(Date.now() - 90 * MS_DAY);
  const rows = await prisma.subscriber.updateMany({
    where: {
      suppressedAt: null,
      totalSent: { gt: 0 },
      OR: [{ lastOpenedAt: null }, { lastOpenedAt: { lt: cutoff } }],
      subscribedAt: { lt: cutoff },
    },
    data: {
      suppressedAt: new Date(),
      suppressReason: "inactive_90d",
    },
  });
  return rows.count;
}

export async function runListHygiene(): Promise<{
  bouncesCleaned: number;
  unsubscribesSynced: number;
  inactiveSuppressed: number;
}> {
  const bouncesCleaned = await cleanBounces();
  const unsubscribesSynced = await syncUnsubscribes();
  const inactiveSuppressed = await suppressInactiveSubscribers();
  await mautic.listEmails(5).catch(() => null);
  return { bouncesCleaned, unsubscribesSynced, inactiveSuppressed };
}

export async function getHygieneStats(): Promise<{
  activeCount: number;
  suppressedTotal: number;
  bySuppressReason: Record<string, number>;
  bounceEventsDistinctSubscribers: number;
  unsubscribedFromSync: number;
  inactiveHeld: number;
}> {
  const activeCount = await prisma.subscriber.count({ where: { suppressedAt: null } });
  const suppressedTotal = await prisma.subscriber.count({ where: { suppressedAt: { not: null } } });
  const grouped = await prisma.subscriber.groupBy({
    by: ["suppressReason"],
    where: { suppressReason: { not: null } },
    _count: true,
  });
  const bySuppressReason: Record<string, number> = {};
  for (const row of grouped) {
    const k = row.suppressReason ?? "unknown";
    bySuppressReason[k] = row._count;
  }
  const bounceEventsDistinctSubscribers = await prisma.subscriberEvent.groupBy({
    by: ["subscriberId"],
    where: { eventType: "bounce" },
    _count: true,
  }).then((r) => r.length);

  const unsubscribedFromSync =
    grouped.find((g) => g.suppressReason === "unsubscribe")?._count ?? 0;

  const inactiveHeld =
    grouped.find((g) => g.suppressReason === "inactive_90d")?._count ?? 0;

  return {
    activeCount,
    suppressedTotal,
    bySuppressReason,
    bounceEventsDistinctSubscribers,
    unsubscribedFromSync,
    inactiveHeld,
  };
}
