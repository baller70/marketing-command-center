'use client';

import { Search } from 'lucide-react';

export default function SEOEnginePage() {
  const url = process.env.NEXT_PUBLIC_SEO_ENGINE_URL || 'http://localhost:8101';
  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)] shrink-0">
        <Search className="w-5 h-5 text-[var(--text-primary)]" />
        <div>
          <h1 className="text-sm font-bold">SEO Engine</h1>
          <p className="text-[10px] text-[var(--text-secondary)]">Organic search optimization, keyword tracking, local SEO</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          Open in new tab ↗
        </a>
      </div>
      <iframe src={url} className="flex-1 w-full border-0" allow="clipboard-write" />
    </div>
  );
}
