"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Send,
  Clock,
  CheckCircle,
  Settings,
  RefreshCw,
} from "lucide-react";
import { ALL_BRANDS } from "@/context/BrandContext";

type ToastState = { type: "success" | "error"; message: string } | null;

interface ActiveBatch {
  id: string;
  status: string;
  batchSize: number;
  targetSize: number;
  createdAt: string;
  scheduledFor?: string | null;
  sentAt?: string | null;
  mauticEmailId?: number | null;
}

interface IntakeGroup {
  brand: string;
  contentType: string;
  byStatus: Record<string, number>;
  activeBatches: ActiveBatch[];
}

interface SettingRow {
  id?: string;
  key: string;
  value: string;
}

interface EmailAnalyticsRow {
  id: string;
  batchId: string | null;
  mauticEmailId: number | null;
  brand: string;
  contentType: string;
  subject: string;
  sentAt: string | null;
}

function brandColor(brand: string): string {
  const b = ALL_BRANDS.find((x) => x.id === brand);
  return b?.color ?? "#64748B";
}

function formatDt(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function mauticHref(mauticEmailId: number): string | null {
  const raw = process.env.NEXT_PUBLIC_MAUTIC_URL;
  if (!raw?.trim()) return null;
  const base = raw.replace(/\/$/, "");
  return `${base}/s/emails/view/${mauticEmailId}`;
}

export default function ContentDistributionPage() {
  const [grouped, setGrouped] = useState<IntakeGroup[]>([]);
  const [configs, setConfigs] = useState<SettingRow[]>([]);
  const [analytics, setAnalytics] = useState<EmailAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [scheduleInputs, setScheduleInputs] = useState<Record<string, string>>({});
  const [scheduleExpanded, setScheduleExpanded] = useState<string | null>(null);

  const showToast = useCallback((t: Exclude<ToastState, null>) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [intakeRes, cfgRes, anRes] = await Promise.all([
        fetch("/api/content-intake"),
        fetch("/api/content-distribution/config"),
        fetch("/api/email-analytics?limit=120"),
      ]);
      const [intakeData, cfgData, anData] = await Promise.all([
        intakeRes.json(),
        cfgRes.json(),
        anRes.json(),
      ]);
      if (intakeRes.ok && Array.isArray(intakeData.grouped)) {
        setGrouped(intakeData.grouped as IntakeGroup[]);
      } else if (!intakeRes.ok) {
        showToast({
          type: "error",
          message: intakeData.error ?? "Could not load content intake",
        });
      }
      if (cfgRes.ok && Array.isArray(cfgData.configs)) {
        setConfigs(cfgData.configs as SettingRow[]);
      } else if (!cfgRes.ok) {
        showToast({
          type: "error",
          message: cfgData.error ?? "Could not load distribution config",
        });
      }
      if (anRes.ok && Array.isArray(anData.analytics)) {
        setAnalytics(anData.analytics as EmailAnalyticsRow[]);
      }
    } catch {
      showToast({ type: "error", message: "Network error loading dashboard" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  const flattened = useMemo(() => {
    const batches: Array<ActiveBatch & { brand: string; contentType: string }> =
      [];
    for (const g of grouped) {
      for (const b of g.activeBatches) {
        batches.push({
          ...b,
          brand: g.brand,
          contentType: g.contentType,
        });
      }
    }
    return batches;
  }, [grouped]);

  const buffersCount = useMemo(() => {
    let n = 0;
    for (const g of grouped) {
      n += g.byStatus.buffered ?? 0;
    }
    return n;
  }, [grouped]);

  const batchesReadyCount = useMemo(
    () => flattened.filter((b) => b.status === "ready").length,
    [flattened]
  );

  const batchesSentStat = analytics.length;

  const nextScheduled = useMemo(() => {
    let min: Date | null = null;
    for (const b of flattened) {
      if (b.status !== "scheduled" || !b.scheduledFor) continue;
      const d = new Date(b.scheduledFor);
      if (Number.isNaN(d.getTime())) continue;
      if (!min || d < min) min = d;
    }
    return min;
  }, [flattened]);

  const readyRows = useMemo(
    () => flattened.filter((b) => b.status === "ready"),
    [flattened]
  );

  const fillingRows = useMemo(
    () => flattened.filter((b) => b.status === "filling"),
    [flattened]
  );

  const scheduledRows = useMemo(
    () => flattened.filter((b) => b.status === "scheduled"),
    [flattened]
  );

  const setBusyKey = (key: string, label: string | null) => {
    setBusy((prev) => {
      const next = { ...prev };
      if (label == null) delete next[key];
      else next[key] = label;
      return next;
    });
  };

  const postApprove = async (
    batchId: string,
    action: "send" | "schedule",
    scheduledFor?: string
  ) => {
    const lk = `approve-${batchId}`;
    setBusyKey(lk, action);
    try {
      const res = await fetch("/api/content-distribution/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          action,
          ...(action === "schedule" && scheduledFor
            ? { scheduledFor }
            : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ type: "success", message: "Batch updated" });
        setScheduleExpanded(null);
        await load();
      } else {
        showToast({
          type: "error",
          message: typeof data.error === "string" ? data.error : "Approve failed",
        });
      }
    } catch {
      showToast({ type: "error", message: "Network error" });
    } finally {
      setBusyKey(lk, null);
    }
  };

  const postSend = async (batchId: string) => {
    const lk = `send-${batchId}`;
    setBusyKey(lk, "send");
    try {
      const res = await fetch("/api/content-distribution/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ type: "success", message: "Send completed" });
        await load();
      } else {
        showToast({
          type: "error",
          message: typeof data.error === "string" ? data.error : "Send failed",
        });
      }
    } catch {
      showToast({ type: "error", message: "Network error" });
    } finally {
      setBusyKey(lk, null);
    }
  };

  const saveConfig = async (
    contentType: string,
    brand: string | undefined,
    size: number,
    busyOverride?: string
  ) => {
    const ck = busyOverride ?? `cfg-${contentType}-${brand ?? "_"}`;
    setBusyKey(ck, "save");
    try {
      const res = await fetch("/api/content-distribution/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          ...(brand ? { brand } : {}),
          size,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({ type: "success", message: "Config saved" });
        await load();
      } else {
        showToast({
          type: "error",
          message: typeof data.error === "string" ? data.error : "Save failed",
        });
      }
    } catch {
      showToast({ type: "error", message: "Network error" });
    } finally {
      setBusyKey(ck, null);
    }
  };

  type ParsedCfg = {
    rawKey: string;
    contentType: string;
    brand?: string;
    size: number;
  };

  const parsedConfigs = useMemo((): ParsedCfg[] => {
    const out: ParsedCfg[] = [];
    for (const row of configs) {
      if (!row.key.startsWith("batch-size-")) continue;
      const rest = row.key.slice("batch-size-".length);
      const n = Number.parseInt(row.value, 10);
      if (!Number.isFinite(n) || n < 1) continue;
      let contentType = rest;
      let brand: string | undefined;
      for (const b of ALL_BRANDS) {
        const suf = `-${b.id}`;
        if (rest.endsWith(suf)) {
          contentType = rest.slice(0, -suf.length);
          brand = b.id;
          break;
        }
      }
      out.push({ rawKey: row.key, contentType, brand, size: n });
    }
    return out.sort((a, b) =>
      `${a.contentType}-${a.brand ?? ""}`.localeCompare(
        `${b.contentType}-${b.brand ?? ""}`
      )
    );
  }, [configs]);

  if (loading) {
    return (
      <div className="p-6 flex min-h-[50vh] items-center justify-center bg-[var(--bg-primary)]">
        <RefreshCw className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-[var(--bg-primary)] p-6 text-[var(--text-primary)]">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
              : "border-red-500/30 bg-red-500/20 text-red-400"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-russo text-2xl text-[var(--text-primary)]">
            Content Distribution
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Buffers, approvals, sends, and batch sizing
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Package className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Items in buffer</span>
          </div>
          <p className="mt-2 font-russo text-2xl text-[var(--text-primary)]">
            {buffersCount}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-xs uppercase tracking-wide">Batches ready</span>
          </div>
          <p className="mt-2 font-russo text-2xl text-[var(--text-primary)]">
            {batchesReadyCount}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Send className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Batches sent (recent)</span>
          </div>
          <p className="mt-2 font-russo text-2xl text-[var(--text-primary)]">
            {batchesSentStat}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-xs uppercase tracking-wide">Next scheduled</span>
          </div>
          <p className="mt-2 text-lg text-[var(--text-primary)]">
            {nextScheduled ? formatDt(nextScheduled.toISOString()) : "—"}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-russo text-lg text-[var(--text-primary)]">
          Approval queue
        </h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
          {readyRows.length === 0 ? (
            <p className="p-6 text-sm text-[var(--text-secondary)]">
              No batches ready for approval.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {readyRows.map((row) => {
                const bc = brandColor(row.brand);
                const busyA = busy[`approve-${row.id}`];
                const open = scheduleExpanded === row.id;
                const draft =
                  scheduleInputs[row.id] ??
                  (() => {
                    const base = new Date();
                    base.setMinutes(base.getMinutes() - base.getTimezoneOffset());
                    return base.toISOString().slice(0, 16);
                  })();
                return (
                  <div
                    key={row.id}
                    className="p-4 transition-colors hover:bg-[var(--bg-card-hover)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: bc }}
                        >
                          {row.brand}
                        </span>
                        <span className="text-sm text-[var(--text-primary)]">
                          {row.contentType}
                        </span>
                        <span className="text-sm text-[var(--text-secondary)]">
                          {row.batchSize} / {row.targetSize} items
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatDt(row.createdAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={!!busyA}
                          onClick={() => postApprove(row.id, "send")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-400 ring-1 ring-emerald-500/30 disabled:opacity-50"
                        >
                          {busyA === "send" ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          Approve &amp; send now
                        </button>
                        <button
                          type="button"
                          disabled={!!busyA}
                          onClick={() => {
                            setScheduleExpanded(open ? null : row.id);
                            if (!scheduleInputs[row.id]) {
                              const base = new Date();
                              base.setMinutes(
                                base.getMinutes() - base.getTimezoneOffset()
                              );
                              setScheduleInputs((s) => ({
                                ...s,
                                [row.id]: base.toISOString().slice(0, 16),
                              }));
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-yellow-500/20 px-3 py-1.5 text-sm text-yellow-400 ring-1 ring-yellow-500/30 disabled:opacity-50"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Schedule
                        </button>
                      </div>
                    </div>
                    {open && (
                      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-3">
                        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
                          Scheduled for (local)
                          <input
                            type="datetime-local"
                            value={draft}
                            onChange={(e) =>
                              setScheduleInputs((s) => ({
                                ...s,
                                [row.id]: e.target.value,
                              }))
                            }
                            className="rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1 text-[var(--text-primary)]"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={!!busyA}
                          onClick={() => {
                            const v = scheduleInputs[row.id] ?? draft;
                            if (!v) {
                              showToast({
                                type: "error",
                                message: "Pick a date/time",
                              });
                              return;
                            }
                            const iso = new Date(v).toISOString();
                            postApprove(row.id, "schedule", iso);
                          }}
                          className="rounded-lg bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-[var(--text-primary)] ring-1 ring-[var(--border)] disabled:opacity-50"
                        >
                          {busyA === "schedule" ? (
                            <span className="inline-flex items-center gap-1">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Saving…
                            </span>
                          ) : (
                            "Confirm schedule"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-russo text-lg text-[var(--text-primary)]">
          Active batches
        </h2>
        <div className="space-y-4">
          {fillingRows.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Nothing filling right now.
            </p>
          ) : (
            fillingRows.map((row) => {
              const pct = Math.min(
                100,
                row.targetSize
                  ? Math.round((row.batchSize / row.targetSize) * 100)
                  : 0
              );
              const bc = brandColor(row.brand);
              const bk = busy[`send-${row.id}`];
              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: bc }}
                      >
                        {row.brand}
                      </span>
                      <span className="text-sm">{row.contentType}</span>
                    </div>
                    <button
                      type="button"
                      disabled={!!bk || row.batchSize < 1}
                      onClick={() => postSend(row.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-400 ring-1 ring-emerald-500/30 disabled:opacity-50"
                    >
                      {bk ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Send now (partial)
                    </button>
                  </div>
                  <div className="mb-1 flex justify-between text-xs text-[var(--text-secondary)]">
                    <span>
                      {row.batchSize} / {row.targetSize} items
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)] ring-1 ring-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-emerald-500/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-russo text-lg text-[var(--text-primary)]">
          Batch history
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="px-4 py-2 font-medium">Brand</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Items</th>
                <th className="px-4 py-2 font-medium">Sent / scheduled</th>
                <th className="px-4 py-2 font-medium">Mautic</th>
              </tr>
            </thead>
            <tbody>
              {scheduledRows.map((row) => {
                return (
                  <tr
                    key={`sched-${row.id}`}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)]"
                  >
                    <td className="px-4 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: brandColor(row.brand) }}
                      >
                        {row.brand}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[var(--text-primary)]">
                      {row.contentType}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-secondary)]">
                      {row.batchSize} / {row.targetSize}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-secondary)]">
                      Scheduled · {formatDt(row.scheduledFor)}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">—</td>
                  </tr>
                );
              })}
              {analytics.map((a) => {
                const mh =
                  a.mauticEmailId != null ? mauticHref(a.mauticEmailId) : null;
                return (
                  <tr
                    key={`sent-${a.id}`}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)]"
                  >
                    <td className="px-4 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: brandColor(a.brand) }}
                      >
                        {a.brand}
                      </span>
                    </td>
                    <td className="px-4 py-2">{a.contentType}</td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">—</td>
                    <td className="px-4 py-2 text-[var(--text-secondary)]">
                      Sent · {formatDt(a.sentAt)}
                    </td>
                    <td className="px-4 py-2">
                      {a.mauticEmailId != null &&
                        (mh ? (
                          <a
                            href={mh}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 underline"
                          >
                            Email #{a.mauticEmailId}
                          </a>
                        ) : (
                          <span className="font-mono text-xs text-[var(--text-muted)]">
                            #{a.mauticEmailId}
                          </span>
                        ))}
                      {a.mauticEmailId == null && "—"}
                    </td>
                  </tr>
                );
              })}
              {scheduledRows.length === 0 && analytics.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-[var(--text-secondary)]"
                  >
                    No scheduled or sent batches in view.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <button
          type="button"
          onClick={() => setConfigOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-card-hover)]"
        >
          <span className="flex items-center gap-2 font-russo text-lg text-[var(--text-primary)]">
            <Settings className="h-5 w-5 text-[var(--text-secondary)]" />
            Batch size configuration
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            {configOpen ? "Hide" : "Show"}
          </span>
        </button>
        {configOpen && (
          <div className="space-y-4 border-t border-[var(--border)] p-4">
            {parsedConfigs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No batch size settings yet. Defaults apply until you add rows.
              </p>
            ) : (
              parsedConfigs.map((c) => (
                <ConfigRow
                  key={c.rawKey}
                  row={c}
                  busy={
                    !!busy[`cfg-${c.contentType}-${c.brand ?? "_"}`]
                  }
                  onSave={(size) =>
                    saveConfig(c.contentType, c.brand, size)
                  }
                />
              ))
            )}
            <NewConfigRow
              brands={ALL_BRANDS}
              onAdd={(contentType, brand, size) =>
                saveConfig(contentType.trim(), brand, size, "cfg-new")
              }
              busy={!!busy["cfg-new"]}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function ConfigRow({
  row,
  busy,
  onSave,
}: {
  row: {
    rawKey: string;
    contentType: string;
    brand?: string;
    size: number;
  };
  busy: boolean;
  onSave: (n: number) => void;
}) {
  const [val, setVal] = useState(String(row.size));
  useEffect(() => {
    setVal(String(row.size));
  }, [row.size, row.rawKey]);
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-3">
      <div className="min-w-[120px] text-sm">
        <div className="text-[var(--text-muted)] text-xs uppercase">Content type</div>
        <div className="text-[var(--text-primary)]">{row.contentType}</div>
      </div>
      <div className="min-w-[120px] text-sm">
        <div className="text-[var(--text-muted)] text-xs uppercase">Brand</div>
        <div className="text-[var(--text-secondary)]">{row.brand ?? "(default)"}</div>
      </div>
      <label className="flex flex-col text-xs text-[var(--text-secondary)]">
        Batch size
        <input
          type="number"
          min={1}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="mt-1 w-24 rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1 text-[var(--text-primary)]"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          const n = Number.parseInt(val, 10);
          if (!Number.isFinite(n) || n < 1) return;
          onSave(n);
        }}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-400 ring-1 ring-emerald-500/30 disabled:opacity-50"
      >
        {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
        Save
      </button>
    </div>
  );
}

function NewConfigRow({
  brands,
  onAdd,
  busy,
}: {
  brands: typeof ALL_BRANDS;
  onAdd: (contentType: string, brand: string | undefined, size: number) => Promise<void>;
  busy: boolean;
}) {
  const [contentType, setContentType] = useState("blog");
  const [brand, setBrand] = useState<string>("");
  const [size, setSize] = useState("4");
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-primary)] p-3">
      <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">
        Add / override batch size
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-[var(--text-secondary)]">
          Content type
          <input
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="mt-1 rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1 text-[var(--text-primary)]"
          />
        </label>
        <label className="flex flex-col text-xs text-[var(--text-secondary)]">
          Brand (optional)
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1 text-[var(--text-primary)]"
          >
            <option value="">Default (all brands)</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs text-[var(--text-secondary)]">
          Size
          <input
            type="number"
            min={1}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="mt-1 w-24 rounded-md border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1 text-[var(--text-primary)]"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            const n = Number.parseInt(size, 10);
            if (!contentType.trim() || !Number.isFinite(n) || n < 1) return;
            await onAdd(
              contentType.trim(),
              brand.trim() ? brand.trim() : undefined,
              n
            );
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-yellow-500/20 px-3 py-1.5 text-sm text-yellow-400 ring-1 ring-yellow-500/30 disabled:opacity-50"
        >
          {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
          Save new rule
        </button>
      </div>
    </div>
  );
}
