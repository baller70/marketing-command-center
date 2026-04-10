"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, FileText, FolderOpen, Loader2 } from "lucide-react";

export default function FilesPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [dirPath, setDirPath] = useState("");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (name: string) => {
    setActiveFile(name);
    setContent("Loading...");
    try {
      const res = await fetch(`/api/files?file=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const d = await res.json();
      setContent(d.content || d.error || "Empty file");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setContent(`Error: ${msg}`);
    }
  }, []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const d = await res.json();
      setFiles(d.files || []);
      setDirPath(d.path || "");
      if (d.files?.includes("operating-manual.md")) {
        await loadFile("operating-manual.md");
      } else if (d.files?.length > 0) {
        await loadFile(d.files[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [loadFile]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--text-muted)]" /></div>;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Division Files</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 font-mono">{dirPath}</p>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3">
          <div className="flex items-center gap-2 px-2 py-2 mb-2 border-b border-[var(--border)]">
            <FolderOpen className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Files</span>
            <span className="text-xs text-[var(--text-muted)] ml-auto">{files.length}</span>
          </div>
          <div className="space-y-0.5">
            {files.map(f => (
              <button
                type="button"
                key={f}
                onClick={() => void loadFile(f)}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  activeFile === f
                    ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                }`}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{f}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-9 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-5">
          {activeFile ? (
            <>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border)]">
                <FileText className="w-4 h-4 text-[var(--text-primary)]" />
                <h3 className="font-semibold text-sm">{activeFile}</h3>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-lg p-4 overflow-auto max-h-[70vh]">{content}</pre>
            </>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)]">Select a file to view</div>
          )}
        </div>
      </div>
    </div>
  );
}
