"use client";

import { useEffect, useState } from "react";

/**
 * Holds back everything marked `.reveal-late` until the opening scene has
 * played (`after` seconds), then lets it fade in. A visitor who starts to
 * scroll or type is never kept waiting: that reveals the page at once.
 */
export function SlowReveal({ after, children }: { after: number; children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const done = () => setRevealed(true);
    const timer = setTimeout(done, after * 1000);
    const events = ["wheel", "touchmove", "keydown", "scroll"] as const;
    events.forEach((name) => window.addEventListener(name, done, { once: true, passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, done));
    };
  }, [after]);
  return (
    <div className="slow-reveal" data-revealed={revealed}>
      <noscript>
        <style>{`.reveal-late{opacity:1!important;transform:none!important;pointer-events:auto!important}`}</style>
      </noscript>
      {children}
    </div>
  );
}
