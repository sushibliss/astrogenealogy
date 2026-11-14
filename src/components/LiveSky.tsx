"use client";

import { useEffect, useState } from "react";

export type SkyBody = {
  key: string;
  name: string;
  glyph: string;
  /** true ecliptic longitude, and where its glyph is drawn so neighbours don't collide */
  lon: number;
  shown: number;
  sign: number;
  signName: string;
  deg: number;
  tone: string;
};

const SIZE = 640;
const C = SIZE / 2;
const R_OUT = 304;
const R_IN = 252;
const R_PLANET = 204;
const R_ASPECT = 150;
const ELEMENT_TONE = ["var(--color-accent)", "var(--color-accent-2)", "var(--color-ink-soft)", "var(--color-accent-3)"];

const round = (n: number) => Math.round(n * 100) / 100;
/** 0° Aries at nine o'clock, signs running anticlockwise, as on a natal wheel */
const pt = (lon: number, r: number) => {
  const a = ((180 + lon) * Math.PI) / 180;
  return [round(C + r * Math.cos(a)), round(C - r * Math.sin(a))] as const;
};
const sector = (from: number) => {
  const [x1, y1] = pt(from, R_OUT);
  const [x2, y2] = pt(from + 30, R_OUT);
  const [x3, y3] = pt(from + 30, R_IN);
  const [x4, y4] = pt(from, R_IN);
  return `M ${x1} ${y1} A ${R_OUT} ${R_OUT} 0 0 0 ${x2} ${y2} L ${x3} ${y3} A ${R_IN} ${R_IN} 0 0 1 ${x4} ${y4} Z`;
};

/**
 * Today's sky as a small living instrument: the planets swing into place, the
 * lines between them draw themselves, and a light travels from one planet to
 * the next, naming each in the middle. Resting the pointer on a planet holds it.
 */
export function LiveSky({
  bodies,
  aspects,
  signs,
  title,
  inWord,
}: {
  bodies: SkyBody[];
  aspects: { a: string; b: string; soft: boolean }[];
  signs: { glyph: string; name: string }[];
  title: string;
  inWord: string;
}) {
  const [tour, setTour] = useState(0);
  const [held, setHeld] = useState<number | null>(null);

  useEffect(() => {
    if (held !== null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setTour((i) => (i + 1) % bodies.length), 2800);
    return () => clearInterval(timer);
  }, [held, bodies.length]);

  const index = held ?? tour;
  const active = bodies[index];
  const lonOf = Object.fromEntries(bodies.map((b) => [b.key, b.lon]));

  return (
    <div className="night live-sky relative rounded-full">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label={title} className="block h-auto w-full" onMouseLeave={() => setHeld(null)}>
        <defs>
          <radialGradient id="sky-disc">
            <stop offset="0" stopColor="#1d1934" />
            <stop offset="0.62" stopColor="#100e1c" />
            <stop offset="1" stopColor="#08070e" />
          </radialGradient>
          <radialGradient id="sky-core">
            <stop offset="0" stopColor={active.tone} stopOpacity={0.22} />
            <stop offset="1" stopColor={active.tone} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={R_OUT + 12} fill="url(#sky-disc)" />
        <circle cx={C} cy={C} r={R_ASPECT + 30} fill="url(#sky-core)" className="live-core" />

        {/* the zodiac, each sign tinted by its element */}
        {signs.map((s, i) => {
          const lit = active.sign === i;
          const [x, y] = pt(i * 30 + 15, (R_OUT + R_IN) / 2);
          return (
            <g key={i}>
              <path d={sector(i * 30)} fill={ELEMENT_TONE[i % 4]} className="live-sign" style={{ opacity: lit ? 0.42 : 0.09 }} />
              <text
                x={x}
                y={y}
                fontSize={lit ? 30 : 24}
                textAnchor="middle"
                dominantBaseline="central"
                className="glyph live-sign"
                fill="currentColor"
                style={{ opacity: lit ? 1 : 0.7 }}
              >
                <title>{s.name}</title>
                {s.glyph}
              </text>
            </g>
          );
        })}
        <g fill="none" stroke="currentColor">
          <circle cx={C} cy={C} r={R_OUT} strokeWidth={1.25} opacity={0.8} />
          <circle cx={C} cy={C} r={R_IN} strokeWidth={1} opacity={0.6} />
          <circle cx={C} cy={C} r={R_PLANET} strokeWidth={0.75} strokeDasharray="1 7" strokeLinecap="round" opacity={0.4} />
          <circle cx={C} cy={C} r={R_ASPECT} strokeWidth={0.75} opacity={0.3} />
          {Array.from({ length: 72 }, (_, i) => {
            const [x1, y1] = pt(i * 5, R_IN);
            const [x2, y2] = pt(i * 5, R_IN - (i % 6 === 0 ? 12 : i % 2 === 0 ? 7 : 4));
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={i % 6 === 0 ? 1 : 0.6} opacity={0.55} />;
          })}
        </g>

        {/* the angles the planets make with one another */}
        <g fill="none" strokeLinecap="round">
          {aspects.map((a, i) => {
            const [x1, y1] = pt(lonOf[a.a], R_ASPECT);
            const [x2, y2] = pt(lonOf[a.b], R_ASPECT);
            const lit = a.a === active.key || a.b === active.key;
            return (
              <line
                key={`${a.a}-${a.b}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                pathLength={1}
                stroke={a.soft ? "var(--color-accent-3)" : "var(--color-accent)"}
                strokeWidth={lit ? 1.8 : 0.9}
                className={`live-aspect ${lit ? "is-lit" : ""}`}
                style={{ animationDelay: `${1.6 + i * 0.12}s`, opacity: lit ? 0.95 : 0.22 }}
              />
            );
          })}
        </g>

        {bodies.map((b, i) => {
          const [mx, my] = pt(b.lon, R_IN);
          const [ax, ay] = pt(b.lon, R_ASPECT);
          const [x, y] = pt(b.shown, R_PLANET);
          const lit = i === index;
          return (
            <g key={b.key} className="live-orbit" style={{ animationDelay: `${0.3 + i * 0.14}s` }}>
              <line x1={mx} y1={my} x2={ax} y2={ay} stroke={b.tone} strokeWidth={0.75} strokeDasharray="1 5" strokeLinecap="round" className="live-fade" style={{ opacity: lit ? 0.9 : 0.25 }} />
              <circle cx={mx} cy={my} r={lit ? 5 : 3} fill={b.tone} className="live-fade" />
              <circle cx={ax} cy={ay} r={2} fill={b.tone} />
              <g
                transform={`translate(${x} ${y})`}
                data-chime={b.name}
                className="cursor-pointer"
                onMouseEnter={() => setHeld(i)}
                onClick={() => setHeld(i)}
              >
                <circle r={26} fill="transparent" />
                {lit && <circle r={19} fill="none" stroke={b.tone} strokeWidth={1} className="live-pulse" />}
                <g className="live-planet" style={{ transform: lit ? "scale(1.28)" : undefined }}>
                  <circle r={18} fill="var(--color-paper-light)" stroke={b.tone} strokeWidth={lit ? 2 : 1.1} style={lit ? { filter: `drop-shadow(0 0 9px ${b.tone})` } : undefined} />
                  <text fontSize={22} textAnchor="middle" dominantBaseline="central" className="glyph" fill={b.tone} style={{ pointerEvents: "none" }}>
                    {b.glyph}
                  </text>
                </g>
              </g>
            </g>
          );
        })}
      </svg>

      {/* the planet the light is resting on */}
      <div key={active.key} className="live-readout pointer-events-none absolute inset-0 grid place-items-center text-center" aria-live="off">
        <div>
          <p className="glyph text-[clamp(2rem,5vw,3.5rem)] leading-none" style={{ color: active.tone }}>
            {active.glyph}
          </p>
          <p className="display mt-2 text-[clamp(1.25rem,2.6vw,2rem)]">{active.name}</p>
          <p className="eyebrow mt-1.5 !text-[0.625rem]">
            {inWord} {active.signName} · {Math.floor(active.deg)}°
          </p>
        </div>
      </div>
    </div>
  );
}
