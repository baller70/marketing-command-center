"use client";

/**
 * Global Brand Selector — drop-in for any division sidebar.
 *
 * Fetches brands + global default from KevinClaw /api/brands/global.
 * Stores per-division override in localStorage.
 * Dispatches "kevinclaw:brand-change" CustomEvent so division brand
 * contexts can sync automatically.
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface BrandInfo {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  colors: { primary: string; secondary: string } | null;
}

interface DivisionBrandSelectorProps {
  divisionId: string;
  kevinclawUrl?: string;
  collapsed?: boolean;
  onBrandChange?: (brand: BrandInfo | null) => void;
}

const POLL_INTERVAL = 30_000;

export function DivisionBrandSelector({
  divisionId,
  kevinclawUrl,
  collapsed = false,
  onBrandChange,
}: DivisionBrandSelectorProps) {
  const baseUrl =
    kevinclawUrl ||
    (typeof window !== "undefined" && (window as any).__KEVINCLAW_URL__) ||
    process.env.NEXT_PUBLIC_KEVINCLAW_URL ||
    "https://kevinclaw.89-167-33-236.sslip.io";

  const storageKey = `${divisionId}-active-brand`;
  const brandDataKey = `${divisionId}-brand-data`;
  const containerRef = useRef<HTMLDivElement>(null);

  const [brands, setBrands] = useState<BrandInfo[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandInfo | null>(null);
  const [globalBrandId, setGlobalBrandId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const dispatchBrandEvent = useCallback(
    (b: BrandInfo | null) => {
      if (typeof window === "undefined") return;
      if (b) {
        localStorage.setItem(brandDataKey, JSON.stringify(b));
      } else {
        localStorage.removeItem(brandDataKey);
      }
      window.dispatchEvent(
        new CustomEvent("kevinclaw:brand-change", {
          detail: { brand: b, divisionId },
        })
      );
    },
    [brandDataKey, divisionId]
  );

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;

    async function fetchBrands() {
      try {
        const res = await fetch(`${baseUrl}/api/brands/global`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (cancelled) return;

        const fetchedBrands: BrandInfo[] = data.brands || [];
        setBrands(fetchedBrands);
        const gid = data.globalBrandId;
        setGlobalBrandId(gid);

        const localOverride = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;

        if (localOverride && localOverride !== "global") {
          const found = fetchedBrands.find((b) => b.id === localOverride);
          if (found) {
            if (selectedBrand?.id !== found.id) {
              setSelectedBrand(found);
              dispatchBrandEvent(found);
            }
            setLoading(false);
            return;
          }
        }

        if (gid && gid !== "all") {
          const found = fetchedBrands.find((b) => b.id === gid);
          if (found) {
            if (selectedBrand?.id !== found.id) {
              setSelectedBrand(found);
              dispatchBrandEvent(found);
            }
            setLoading(false);
            return;
          }
        }

        if (selectedBrand !== null) {
          setSelectedBrand(null);
          dispatchBrandEvent(null);
        }
      } catch {
        /* KevinClaw unreachable */
      }
      setLoading(false);
    }

    fetchBrands();
    const interval = setInterval(fetchBrands, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [mounted, baseUrl, storageKey, dispatchBrandEvent]);

  const handleSelect = useCallback(
    (b: BrandInfo | null, useGlobal = false) => {
      setSelectedBrand(b);
      setOpen(false);
      if (useGlobal) {
        localStorage.setItem(storageKey, "global");
      } else if (b) {
        localStorage.setItem(storageKey, b.id);
      } else {
        localStorage.removeItem(storageKey);
      }
      dispatchBrandEvent(b);
      onBrandChange?.(b);
    },
    [storageKey, dispatchBrandEvent, onBrandChange]
  );

  if (!mounted || (loading && brands.length === 0)) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-3 py-2 text-xs" style={{ color: "var(--text-muted, #9ca3af)" }}>
          Loading brands...
        </div>
      </div>
    );
  }

  if (brands.length === 0) return null;

  const isFollowingGlobal = mounted
    ? localStorage.getItem(storageKey) === "global" || !localStorage.getItem(storageKey)
    : true;

  const globeIcon = (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );

  const checkIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );

  const dropdown = (
    <div
      className="mt-1 rounded-lg overflow-hidden max-h-64 overflow-y-auto"
      role="listbox"
      aria-label="Select active brand"
      style={{ background: "var(--bg-card, #1f2937)", border: "1px solid var(--border, #374151)" }}
    >
      <button
        role="option"
        aria-selected={!selectedBrand}
        onClick={() => handleSelect(null)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors hover:bg-white/5"
        style={{ color: "var(--text-secondary, #d1d5db)" }}
      >
        <span className="flex-shrink-0">{globeIcon(14)}</span>
        <span className="flex-1 text-left">All Brands</span>
        {!selectedBrand && checkIcon}
      </button>
      {brands.map((b) => (
        <button
          key={b.id}
          role="option"
          aria-selected={selectedBrand?.id === b.id}
          onClick={() => handleSelect(b)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors hover:bg-white/5"
          style={{ color: "var(--text-secondary, #d1d5db)" }}
        >
          <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.colors?.primary ?? "#6366f1" }} />
          <span className="flex-1 text-left truncate">{b.name}</span>
          {selectedBrand?.id === b.id && checkIcon}
        </button>
      ))}
      <div className="px-3 py-1.5 text-[10px] border-t" style={{ color: "var(--text-muted, #9ca3af)", borderColor: "var(--border, #374151)" }}>
        <button
          onClick={() => {
            const gBrand = brands.find((b) => b.id === globalBrandId) ?? null;
            handleSelect(gBrand, true);
          }}
          className="hover:underline"
        >
          Reset to global default
        </button>
      </div>
    </div>
  );

  if (collapsed) {
    return (
      <div className="px-3 py-2" ref={containerRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-full p-2 rounded-lg transition-colors hover:bg-white/5"
          title={selectedBrand ? selectedBrand.name : "All Brands"}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {selectedBrand ? (
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: selectedBrand.colors?.primary ?? "#6366f1" }} />
          ) : (
            globeIcon(18)
          )}
        </button>
        {open && dropdown}
      </div>
    );
  }

  return (
    <div className="px-3 py-2" ref={containerRef}>
      <div className="text-[10px] uppercase tracking-wider font-medium px-3 mb-1" style={{ color: "var(--text-muted, #9ca3af)" }}>
        Active Brand
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{ color: "var(--text-secondary, #d1d5db)", background: open ? "rgba(255,255,255,0.05)" : undefined }}
      >
        {selectedBrand ? (
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: selectedBrand.colors?.primary ?? "#6366f1" }} />
        ) : (
          <span className="flex-shrink-0">{globeIcon(16)}</span>
        )}
        <span className="flex-1 text-left truncate">
          {selectedBrand ? selectedBrand.name : "All Brands"}
          {isFollowingGlobal && selectedBrand && (
            <span className="text-[10px] ml-1" style={{ color: "var(--text-muted, #9ca3af)" }}>(global)</span>
          )}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && dropdown}
    </div>
  );
}
