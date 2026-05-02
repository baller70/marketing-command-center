"use client";

import { useCallback, useEffect, useState, useRef, FormEvent } from "react";
import {
  Terminal, Search, Send, RefreshCw, Loader2, CheckCircle,
  XCircle, AlertTriangle, ChevronRight, Play, Activity,
  Database, Zap, Clock, Copy, Shield,
  BarChart2, GitBranch, Settings, Heart,
  ChevronDown, Hash, Filter, Layers
} from "lucide-react";
import {
  commands,
  COMMAND_GROUPS,
  getCommandsByGroup,
  getCommandById,
  searchCommands,
  getCoverageStats,
  type OpenCLICommand,
  type CommandGroup,
} from "@/lib/opencli-registry";

type Tab = "commands" | "coverage" | "health" | "gstack" | "batch" | "history";

interface ExecutionResult {
  commandId: string;
  status: string;
  httpStatus?: number;
  data?: unknown;
  error?: string;
  meta?: { elapsedMs: number; resolvedUrl: string };
  timestamp: number;
}

interface HealthData {
  [key: string]: { status: string; latencyMs?: number };
}

export default function OpenCLIAdminPage() {
  const [tab, setTab] = useState<Tab>("commands");
  const [selectedGroup, setSelectedGroup] = useState<CommandGroup>(COMMAND_GROUPS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommand, setSelectedCommand] = useState<OpenCLICommand | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [gstackOutput, setGstackOutput] = useState("");
  const [gstackCmd, setGstackCmd] = useState("");
  const [gstackRunning, setGstackRunning] = useState(false);
  const [coverageData, setCoverageData] = useState<ReturnType<typeof getCoverageStats> | null>(null);
  const [batchCommands, setBatchCommands] = useState<string[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [filterKind, setFilterKind] = useState<string>("all");
  const [groupOpen, setGroupOpen] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCoverageData(getCoverageStats());
  }, []);

  useEffect(() => {
    if (resultRef.current) resultRef.current.scrollTop = resultRef.current.scrollHeight;
  }, [results]);

  const filteredCommands = searchQuery
    ? searchCommands(searchQuery)
    : getCommandsByGroup(selectedGroup);

  const displayedCommands = filterKind === "all"
    ? filteredCommands
    : filteredCommands.filter(c => c.kind === filterKind);

  const selectCommand = useCallback((cmd: OpenCLICommand) => {
    setSelectedCommand(cmd);
    const p: Record<string, string> = {};
    cmd.params.forEach(param => { p[param.name] = ""; });
    setParams(p);
  }, []);

  const executeCommand = useCallback(async (dryRun = false) => {
    if (!selectedCommand) return;
    setExecuting(true);
    try {
      const parsedParams: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(params)) {
        if (!v) continue;
        if (k === "body") {
          try { parsedParams[k] = JSON.parse(v); } catch { parsedParams[k] = v; }
        } else if (k === "id") {
          parsedParams[k] = Number(v);
        } else {
          parsedParams[k] = v;
        }
      }
      const res = await fetch("/api/admin/opencli/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandId: selectedCommand.id,
          params: parsedParams,
          dryRun,
          confirmed: true,
        }),
      });
      const data = await res.json();
      setResults(prev => [...prev, {
        commandId: selectedCommand.id,
        status: data.status ?? "error",
        httpStatus: data.httpStatus,
        data: data.data ?? data,
        error: data.error,
        meta: data.meta,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      setResults(prev => [...prev, {
        commandId: selectedCommand.id,
        status: "error",
        error: err instanceof Error ? err.message : "Request failed",
        timestamp: Date.now(),
      }]);
    }
    setExecuting(false);
  }, [selectedCommand, params]);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/opencli/health");
      setHealthData(await res.json());
    } catch {
      setHealthData({ error: { status: "fetch failed" } });
    }
  }, []);

  const runGstack = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!gstackCmd.trim()) return;
    setGstackRunning(true);
    try {
      const res = await fetch("/api/admin/opencli/gstack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: gstackCmd }),
      });
      const data = await res.json();
      setGstackOutput(prev => prev + `\n$ ${gstackCmd}\n${data.stdout || ""}${data.stderr ? `\nSTDERR: ${data.stderr}` : ""}\n`);
    } catch (err) {
      setGstackOutput(prev => prev + `\nError: ${err instanceof Error ? err.message : "failed"}\n`);
    }
    setGstackRunning(false);
  }, [gstackCmd]);

  const runBatch = useCallback(async () => {
    if (batchCommands.length === 0) return;
    setBatchRunning(true);
    try {
      const res = await fetch("/api/admin/opencli/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commands: batchCommands.map(id => ({ commandId: id, params: {} })),
        }),
      });
      const data = await res.json();
      if (data.results) {
        const newResults = data.results.map((r: ExecutionResult) => ({ ...r, timestamp: Date.now() }));
        setResults(prev => [...prev, ...newResults]);
      }
    } catch (err) {
      setResults(prev => [...prev, {
        commandId: "batch",
        status: "error",
        error: err instanceof Error ? err.message : "batch failed",
        timestamp: Date.now(),
      }]);
    }
    setBatchRunning(false);
    setBatchCommands([]);
  }, [batchCommands]);

  const kindColors: Record<string, string> = {
    read: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    write: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dangerous: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const methodColors: Record<string, string> = {
    GET: "text-green-400",
    POST: "text-blue-400",
    PATCH: "text-amber-400",
    PUT: "text-orange-400",
    DELETE: "text-red-400",
  };

  const groupIcons: Record<string, typeof Terminal> = {
    "analytics": BarChart2,
    "automation-cron": Zap,
    "campaigns": GitBranch,
    "contacts-leads": Database,
    "content": Layers,
    "email": Send,
    "funnel": Filter,
    "integrations": Settings,
    "opencli-tools": Terminal,
    "pipeline-automation": Play,
    "pipeline-stages": Activity,
    "social": Hash,
    "subscribers": Shield,
    "system": Heart,
  };

  const tabs: { id: Tab; label: string; icon: typeof Terminal }[] = [
    { id: "commands", label: "Commands", icon: Terminal },
    { id: "coverage", label: "Coverage", icon: BarChart2 },
    { id: "health", label: "Health", icon: Activity },
    { id: "gstack", label: "GStack", icon: Zap },
    { id: "batch", label: "Batch", icon: Layers },
    { id: "history", label: "History", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-green-400" />
            <h1 className="text-xl font-bold">OpenCLI Command Center</h1>
            <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
              {commands.length} commands
            </span>
          </div>
          <div className="flex gap-2">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    if (t.id === "health" && !healthData) fetchHealth();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    tab === t.id
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {tab === "commands" && (
          <>
            {/* Left sidebar: groups + commands */}
            <div className="w-80 border-r border-gray-800 flex flex-col">
              <div className="p-3 border-b border-gray-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search commands..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {["all", "read", "write", "dangerous"].map(k => (
                    <button
                      key={k}
                      onClick={() => setFilterKind(k)}
                      className={`px-2 py-0.5 rounded text-xs capitalize transition-all ${
                        filterKind === k ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {!searchQuery && (
                <div className="p-2 border-b border-gray-800 overflow-x-auto flex gap-1 flex-wrap">
                  {COMMAND_GROUPS.map(g => {
                    const Icon = groupIcons[g] || Terminal;
                    const count = getCommandsByGroup(g).length;
                    return (
                      <button
                        key={g}
                        onClick={() => { setSelectedGroup(g); setGroupOpen(true); }}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition-all ${
                          selectedGroup === g
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {g.replace(/-/g, " ")}
                        <span className="text-gray-600 ml-0.5">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {displayedCommands.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No commands found</div>
                ) : (
                  displayedCommands.map(cmd => (
                    <button
                      key={cmd.id}
                      onClick={() => selectCommand(cmd)}
                      className={`w-full text-left px-3 py-2 border-b border-gray-800/50 hover:bg-white/5 transition-all ${
                        selectedCommand?.id === cmd.id ? "bg-white/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold ${methodColors[cmd.method]}`}>
                          {cmd.method}
                        </span>
                        <span className="text-sm text-white truncate flex-1">{cmd.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${kindColors[cmd.kind]}`}>
                          {cmd.kind}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate font-mono">{cmd.apiRoute}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right panel: command detail + execution */}
            <div className="flex-1 flex flex-col">
              {selectedCommand ? (
                <>
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-sm font-mono font-bold ${methodColors[selectedCommand.method]}`}>
                        {selectedCommand.method}
                      </span>
                      <h2 className="text-lg font-bold">{selectedCommand.label}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded border ${kindColors[selectedCommand.kind]}`}>
                        {selectedCommand.kind}
                      </span>
                      {selectedCommand.supportsDryRun && (
                        <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                          dry-run
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 font-mono">{selectedCommand.apiRoute}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Group: {selectedCommand.group} | Tab: {selectedCommand.sidebarTab} | Role: {selectedCommand.role}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          if (batchCommands.includes(selectedCommand.id)) {
                            setBatchCommands(prev => prev.filter(id => id !== selectedCommand.id));
                          } else {
                            setBatchCommands(prev => [...prev, selectedCommand.id]);
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded border transition-all ${
                          batchCommands.includes(selectedCommand.id)
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "text-gray-400 border-gray-700 hover:border-gray-500"
                        }`}
                      >
                        {batchCommands.includes(selectedCommand.id) ? "Remove from Batch" : "Add to Batch"}
                      </button>
                      {batchCommands.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {batchCommands.length} in batch
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-b border-gray-800 space-y-3">
                    {selectedCommand.params.map(param => (
                      <div key={param.name}>
                        <label className="block text-xs text-gray-400 mb-1">
                          {param.name}
                          {param.required && <span className="text-red-400 ml-1">*</span>}
                          <span className="text-gray-600 ml-2">({param.type})</span>
                        </label>
                        {param.type === "json" ? (
                          <textarea
                            value={params[param.name] || ""}
                            onChange={e => setParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                            rows={3}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50"
                            placeholder={param.description}
                          />
                        ) : (
                          <input
                            type="text"
                            value={params[param.name] || ""}
                            onChange={e => setParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50"
                            placeholder={param.description}
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        onClick={() => executeCommand(false)}
                        disabled={executing}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Execute
                      </button>
                      {selectedCommand.supportsDryRun && (
                        <button
                          onClick={() => executeCommand(true)}
                          disabled={executing}
                          className="flex items-center gap-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-purple-500/20"
                        >
                          Dry Run
                        </button>
                      )}
                    </div>
                  </div>

                  <div ref={resultRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {results.length === 0 ? (
                      <div className="text-center text-gray-500 pt-12">
                        <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Execute a command to see results</p>
                      </div>
                    ) : (
                      results.map((r, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border p-3 ${
                            r.status === "success"
                              ? "border-green-500/20 bg-green-500/5"
                              : r.status === "dry_run"
                              ? "border-purple-500/20 bg-purple-500/5"
                              : "border-red-500/20 bg-red-500/5"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {r.status === "success" ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : r.status === "dry_run" ? (
                                <AlertTriangle className="w-4 h-4 text-purple-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className="text-xs font-mono text-gray-400">{r.commandId}</span>
                              {r.httpStatus && (
                                <span className="text-xs text-gray-500">{r.httpStatus}</span>
                              )}
                              {r.meta?.elapsedMs && (
                                <span className="text-xs text-gray-600">{r.meta.elapsedMs}ms</span>
                              )}
                            </div>
                            <button
                              onClick={() => navigator.clipboard.writeText(JSON.stringify(r.data, null, 2))}
                              className="text-gray-500 hover:text-white"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <pre className="text-xs text-gray-300 overflow-auto max-h-48 font-mono bg-black/30 rounded p-2">
                            {JSON.stringify(r.data ?? r.error, null, 2)}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <ChevronRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Select a command from the left panel</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "coverage" && coverageData && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Commands", value: coverageData.totalCommands, color: "green" },
                { label: "Groups", value: coverageData.totalGroups, color: "blue" },
                { label: "Routes", value: coverageData.mappedRoutes, color: "amber" },
                { label: "Excluded", value: coverageData.excludedRoutes, color: "gray" },
              ].map(s => (
                <div key={s.label} className={`rounded-lg border border-${s.color}-500/20 bg-${s.color}-500/5 p-4`}>
                  <div className={`text-3xl font-bold text-${s.color}-400`}>{s.value}</div>
                  <div className="text-sm text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-lg border border-gray-800 p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3">By Group</h3>
                {coverageData.byGroup.map(g => (
                  <div key={g.group} className="flex items-center justify-between py-1.5 border-b border-gray-800/50">
                    <span className="text-sm text-gray-400">{g.group.replace(/-/g, " ")}</span>
                    <span className="text-sm font-mono text-green-400">{g.count}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-gray-800 p-4">
                  <h3 className="text-sm font-bold text-gray-300 mb-3">By Method</h3>
                  {Object.entries(coverageData.byMethod).map(([m, count]) => (
                    <div key={m} className="flex items-center justify-between py-1.5">
                      <span className={`text-sm font-mono font-bold ${methodColors[m] || "text-gray-400"}`}>{m}</span>
                      <span className="text-sm font-mono text-gray-300">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-800 p-4">
                  <h3 className="text-sm font-bold text-gray-300 mb-3">By Kind</h3>
                  {Object.entries(coverageData.byKind).map(([k, count]) => (
                    <div key={k} className="flex items-center justify-between py-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded border ${kindColors[k]}`}>{k}</span>
                      <span className="text-sm font-mono text-gray-300">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "health" && (
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">System Health</h2>
              <button onClick={fetchHealth} className="text-gray-400 hover:text-white">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {healthData ? (
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(healthData).map(([key, val]) => {
                  const isOk = typeof val === "object" && val !== null && "status" in val && String(val.status).startsWith("ok") || String(val.status) === "connected";
                  return (
                    <div key={key} className={`rounded-lg border p-4 ${isOk ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isOk ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                        <span className="font-medium text-sm">{key}</span>
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{typeof val === "object" && val !== null ? JSON.stringify(val) : String(val)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
          </div>
        )}

        {tab === "gstack" && (
          <div className="flex-1 p-6 flex flex-col">
            <h2 className="text-lg font-bold mb-4">GStack Terminal</h2>
            <pre className="flex-1 bg-black/50 rounded-lg p-4 text-xs font-mono text-green-400 overflow-auto whitespace-pre-wrap border border-gray-800">
              {gstackOutput || "GStack terminal ready. Type a command below."}
            </pre>
            <form onSubmit={runGstack} className="flex gap-2 mt-3">
              <input
                type="text"
                value={gstackCmd}
                onChange={e => setGstackCmd(e.target.value)}
                placeholder="gstack <command>"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/50"
              />
              <button
                type="submit"
                disabled={gstackRunning}
                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
              >
                {gstackRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Run
              </button>
            </form>
          </div>
        )}

        {tab === "batch" && (
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Batch Execution</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{batchCommands.length} commands queued</span>
                <button
                  onClick={runBatch}
                  disabled={batchRunning || batchCommands.length === 0}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {batchRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Run Batch
                </button>
                <button
                  onClick={() => setBatchCommands([])}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
            {batchCommands.length === 0 ? (
              <div className="text-center text-gray-500 pt-12">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Add commands from the Commands tab to build a batch</p>
              </div>
            ) : (
              <div className="space-y-2">
                {batchCommands.map((id, i) => {
                  const cmd = getCommandById(id);
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-800 p-3 bg-gray-900/50">
                      <span className="text-xs text-gray-500 w-6">{i + 1}</span>
                      <span className={`text-xs font-mono font-bold ${methodColors[cmd?.method || "GET"]}`}>
                        {cmd?.method}
                      </span>
                      <span className="text-sm text-white flex-1">{cmd?.label}</span>
                      <button
                        onClick={() => setBatchCommands(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="flex-1 p-6">
            <h2 className="text-lg font-bold mb-4">Execution History</h2>
            {results.length === 0 ? (
              <div className="text-center text-gray-500 pt-12">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No commands executed yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...results].reverse().map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-800 p-3">
                    {r.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm font-mono text-gray-300 flex-1">{r.commandId}</span>
                    {r.httpStatus && <span className="text-xs text-gray-500">{r.httpStatus}</span>}
                    {r.meta?.elapsedMs && <span className="text-xs text-gray-600">{r.meta.elapsedMs}ms</span>}
                    <span className="text-xs text-gray-600">{new Date(r.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
