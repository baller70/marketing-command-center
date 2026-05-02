"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal, Search, ArrowRight } from "lucide-react";
import { searchCommands, type OpenCLICommand } from "@/lib/opencli-registry";

export default function CmdKPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpenCLICommand[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
    }
  }, [open]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setSelectedIdx(0);
    if (q.length >= 2) {
      setResults(searchCommands(q).slice(0, 12));
    } else {
      setResults([]);
    }
  }, []);

  const handleSelect = useCallback((cmd: OpenCLICommand) => {
    setOpen(false);
    router.push(`/admin/opencli?cmd=${cmd.id}`);
  }, [router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIdx]) {
        handleSelect(results[selectedIdx]);
      }
    },
    [results, selectedIdx, handleSelect]
  );

  if (!open) return null;

  const methodColors: Record<string, string> = {
    GET: "text-green-400",
    POST: "text-blue-400",
    PATCH: "text-amber-400",
    PUT: "text-orange-400",
    DELETE: "text-red-400",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 focus:outline-none"
          />
          <kbd className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">ESC</kbd>
        </div>
        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto">
            {results.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                  i === selectedIdx ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-gray-500" />
                <span className={`text-xs font-mono font-bold ${methodColors[cmd.method]}`}>{cmd.method}</span>
                <span className="text-sm text-white flex-1 truncate">{cmd.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
              </button>
            ))}
          </div>
        )}
        {query.length >= 2 && results.length === 0 && (
          <div className="px-4 py-6 text-center text-gray-500 text-sm">No commands found</div>
        )}
      </div>
    </div>
  );
}
