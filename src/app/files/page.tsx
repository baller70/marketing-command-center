"use client";

import { useEffect, useState } from "react";
import { FileText, FolderOpen, Loader2 } from "lucide-react";

export default function FilesPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [dirPath, setDirPath] = useState("");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/files")
      .then(r => r.json())
      .then(d => {
        setFiles(d.files || []);
        setDirPath(d.path || "");
        if (d.files?.includes("operating-manual.md")) {
          loadFile("operating-manual.md");
        } else if (d.files?.length > 0) {
          loadFile(d.files[0]);
        }
        setLoading(false);
      });
  }, []);

  const loadFile = (name: string) => {
    setActiveFile(name);
    setContent("Loading...");
    fetch(`/api/files?file=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(d => setContent(d.content || d.error || "Empty file"));
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Division Files</h1>
        <p className="text-sm text-slate-400 mt-1 font-mono">{dirPath}</p>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 bg-white border border-slate-200 rounded-xl p-3">
          <div className="flex items-center gap-2 px-2 py-2 mb-2 border-b border-slate-200">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Files</span>
            <span className="text-xs text-slate-400 ml-auto">{files.length}</span>
          </div>
          <div className="space-y-0.5">
            {files.map(f => (
              <button
                key={f}
                onClick={() => loadFile(f)}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  activeFile === f
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{f}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-9 bg-white border border-slate-200 rounded-xl p-5">
          {activeFile ? (
            <>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm">{activeFile}</h3>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-slate-600 bg-slate-50 rounded-lg p-4 overflow-auto max-h-[70vh]">{content}</pre>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">Select a file to view</div>
          )}
        </div>
      </div>
    </div>
  );
}
