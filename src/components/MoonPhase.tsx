/**
 * The Moon as it looks tonight, drawn from the Sun–Moon elongation
 * (0° new, 90° first quarter, 180° full, 270° last quarter).
 */
export function MoonPhase({ elongation, size = 44, className }: { elongation: number; size?: number; className?: string }) {
  const e = ((elongation % 360) + 360) % 360;
  const waxing = e <= 180;
  const a = waxing ? e : 360 - e; // 0 (new) … 180 (full)
  const r = 20;
  const rx = Math.abs(Math.cos((a * Math.PI) / 180)) * r;
  // lit half-disc on the right, closed by the terminator ellipse
  const lit = `M 24 ${24 - r} A ${r} ${r} 0 0 1 24 ${24 + r} A ${rx} ${r} 0 0 ${a < 90 ? 0 : 1} 24 ${24 - r} Z`;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
      <circle cx="24" cy="24" r={r} fill="var(--moon-shadow)" />
      <path d={lit} fill="var(--moon-lit)" transform={waxing ? undefined : "matrix(-1 0 0 1 48 0)"} />
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />
    </svg>
  );
}

/** 0 new · 1 waxing crescent · 2 first quarter · 3 waxing gibbous · 4 full · … */
export function phaseIndex(elongation: number) {
  const e = ((elongation % 360) + 360) % 360;
  return Math.round(e / 45) % 8;
}
