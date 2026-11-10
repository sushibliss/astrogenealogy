"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Marks its children as "unveiled" the first time they scroll into view,
 * so CSS can play an entrance sequence exactly once.
 */
export function Unveil({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // When the content is wider than the screen, start in the middle of it.
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} data-unveiled={seen}>
      {children}
    </div>
  );
}
