"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The site's navigation, kept out of sight so nothing competes with the page.
 * It slides down when the pointer reaches the top edge (or the small tab there),
 * when it receives keyboard focus, or when the tab is tapped on a touch screen.
 */
export function TopBar({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={ref} className="topbar-zone no-print" data-open={open}>
      <button type="button" className="topbar-handle" aria-label={label} title={label} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10l5 5 5-5" />
        </svg>
      </button>
      <header className="topbar" onClick={(e) => (e.target as Element).closest("a") && setOpen(false)}>
        {children}
      </header>
    </div>
  );
}
