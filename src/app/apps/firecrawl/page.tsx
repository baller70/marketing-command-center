'use client';

import { Flame } from 'lucide-react';

export default function FirecrawlPage() {
  const url = process.env.NEXT_PUBLIC_FIRECRAWL_URL || 'http://localhost:3040';
  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)] shrink-0">
        <Flame className="w-5 h-5 text-[var(--text-primary)]" />
        <div>
          <h1 className="text-sm font-bold">Firecrawl</h1>
          <p className="text-[10px] text-[var(--text-secondary)]">Web scraping for prospect discovery, email harvesting, competitor intel</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          Open in new tab ↗
        </a>
      </div>
      <iframe src={url} className="flex-1 w-full border-0" allow="clipboard-write" />
    </div>
  );
}
