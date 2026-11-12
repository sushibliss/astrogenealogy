"use client";

import { useEffect, useRef } from "react";

/** Lets the layers of the sky drift a little against the pointer, for depth. */
export function SkyDrift({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      el.style.setProperty("--px", (e.clientX / window.innerWidth - 0.5).toFixed(3));
      el.style.setProperty("--py", (e.clientY / window.innerHeight - 0.5).toFixed(3));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      {children}
    </div>
  );
}
