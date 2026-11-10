"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Unveil } from "./Unveil";

export type TreePerson = {
  id: string;
  path: string;
  hidden: boolean;
  found: boolean;
  name: string;
  relation: string;
  relationShort: string;
  years: string;
  born: string;
  died: string;
  notes: string;
  href: string;
  hourKnown: boolean;
  sun: { sign: number; lon: number; name: string; glyph: string; text: string } | null;
  moon: { name: string; glyph: string; text: string } | null;
  element: string;
  docs: { id: string; title: string; kind: "file" | "link"; href: string }[];
};

export type TreeLabels = Record<
  | "title" | "deeper" | "legendIntake" | "legendResearch" | "legendUnknown" | "legendKin" | "legendSun" | "hint" | "close"
  | "born" | "died" | "sun" | "moon" | "element" | "noChart" | "hourUnknown" | "notes" | "documents" | "noDocuments"
  | "pdf" | "link" | "openReport" | "foundBadge" | "sunGlyph" | "moonGlyph",
  string
>;

const MAX_GEN = 4;
/** radius of each generation's orbit */
const RINGS = [0, 150, 290, 420, 510];
const NODE = [15, 12.5, 11.5, 10.5, 9.5];
/** the fan opens 120°, from 150° (paternal edge) to 30° (maternal edge) */
const FAN_START = 150;
const FAN_SPAN = 120;
const EDGE = 7;
const ROMAN = ["", "I", "II", "III", "IV"];
/** seconds of sky-drawing before the first generation appears */
const PRELUDE = 1.5;
const STEP = 1.15;

const slotOf = (path: string) => path.split("").reduce((n, c) => n * 2 + (c === "m" ? 1 : 0), 0);
const angleOf = (path: string) =>
  path.length === 0 ? 90 : FAN_START - ((slotOf(path) + 0.5) * FAN_SPAN) / 2 ** path.length;
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const d = (seconds: number) => ({ "--d": `${seconds.toFixed(2)}s` }) as React.CSSProperties;

/**
 * The family as a star chart. The requester sits at the foot and each
 * generation fans out on a wider orbit; the outer band is the zodiac, with
 * every person's Sun marked where it stood on the day they were born.
 */
export function ConstellationChart({
  people,
  labels,
  zodiac,
}: {
  people: TreePerson[];
  labels: TreeLabels;
  zodiac: { glyph: string; name: string }[];
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const shown = people.filter((p) => p.path.length <= MAX_GEN);
  const deeper = people.filter((p) => p.path.length > MAX_GEN);
  const selected = people.find((p) => p.id === selectedId) ?? null;
  const active = people.find((p) => p.id === (hoverId ?? selectedId)) ?? null;

  useEffect(() => {
    // On narrow screens the card sits under the chart: bring it into view.
    if (selectedId && window.innerWidth < 1024) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  const maxGen = Math.max(2, ...shown.map((p) => p.path.length));
  const radial = maxGen >= 3;
  const R = RINGS[maxGen];
  const bandIn = R + 178;
  const bandOut = bandIn + 36;
  const W = 2 * (bandOut * 0.93 + 24);
  const cx = W / 2;
  const cy = bandOut + 22;
  const H = cy + 112;

  const at = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
  };
  const pos = (path: string, r = RINGS[path.length]) => at(angleOf(path), r);
  const arc = (r: number) =>
    `M ${at(FAN_START + EDGE, r).join(" ")} A ${r} ${r} 0 0 1 ${at(FAN_START - FAN_SPAN - EDGE, r).join(" ")}`;
  /** the zodiac runs along the outer band, 0° Aries at the paternal edge */
  const zodiacAngle = (lon: number) => FAN_START + EDGE - (lon / 360) * (FAN_SPAN + 2 * EDGE);
  const branch = (child: string, parent: string) => {
    const [x0, y0] = pos(child);
    const [x1, y1] = pos(parent);
    const rm = (RINGS[child.length] + RINGS[parent.length]) / 2;
    const [c1x, c1y] = child.length === 0 ? [cx, cy - rm * 0.9] : pos(child, rm);
    const [c2x, c2y] = pos(parent, rm);
    return `M ${x0} ${y0} C ${c1x} ${c1y} ${c2x} ${c2y} ${x1} ${y1}`;
  };
  const when = (path: string, extra = 0) => PRELUDE + path.length * STEP + (slotOf(path) / 2 ** path.length) * 0.5 + extra;
  const finale = PRELUDE + (maxGen + 1) * STEP;

  const paths = new Set(shown.map((p) => p.path));
  const unknownSlots = shown
    .filter((p) => p.path.length < maxGen)
    .flatMap((p) => [p.path + "f", p.path + "m"])
    .filter((path) => !paths.has(path));

  // people who share a Sun sign are joined by a faint thread
  const kin: [TreePerson, TreePerson][] = [];
  shown.forEach((a, i) =>
    shown.slice(i + 1).forEach((b) => {
      if (a.sun && b.sun && a.sun.sign === b.sun.sign) kin.push([a, b]);
    }),
  );

  // hovering (or selecting) someone lights their line back to the requester
  const inLine = (path: string) => !!active && active.path.startsWith(path);
  const dimmed = (path: string) => !!active && !inLine(path) && !path.startsWith(active.path);
  const fade = (dim: boolean) => ({ opacity: dim ? 0.42 : 1, transition: "opacity 0.6s ease" });

  const open = (p: TreePerson) => setSelectedId((cur) => (cur === p.id ? null : p.id));

  return (
    <div className={selected ? "items-start gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_21.5rem]" : undefined}>
      <div className="min-w-0">
        <Unveil className="constellation overflow-x-auto">
          <noscript>
            <style>{`.constellation *{opacity:1!important;stroke-dashoffset:0!important;transform:none!important}`}</style>
          </noscript>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="group"
            aria-label={labels.title}
            className="mx-auto block h-auto w-full"
            style={{ minWidth: Math.min(W, 900), maxWidth: W }}
            onMouseLeave={() => setHoverId(null)}
          >
            {/* a line of light sweeps the sky once */}
            <line
              x1={cx}
              y1={cy - 30}
              x2={cx}
              y2={cy - bandOut}
              stroke="var(--color-accent)"
              strokeWidth={1}
              className="c-sweep"
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />

            {/* the zodiac band */}
            <g fill="none" stroke="currentColor">
              <path d={arc(bandIn)} pathLength={1} strokeWidth={1} className="c-link" style={d(0.1)} />
              <path d={arc(bandOut)} pathLength={1} strokeWidth={1.5} className="c-link" style={d(0.3)} />
              {Array.from({ length: 13 }, (_, i) => {
                const [x1, y1] = at(zodiacAngle(i * 30), bandIn);
                const [x2, y2] = at(zodiacAngle(i * 30), bandOut);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={1} className="c-fade" style={d(0.5 + i * 0.09)} />;
              })}
              {Array.from({ length: 72 }, (_, i) => {
                if (i % 6 === 0) return null;
                const [x1, y1] = at(zodiacAngle(i * 5), bandIn);
                const [x2, y2] = at(zodiacAngle(i * 5), bandIn + (i % 2 === 0 ? 7 : 4));
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={0.6} className="c-fade" style={d(0.6 + i * 0.015)} />;
              })}
            </g>
            <g textAnchor="middle" dominantBaseline="central">
              {zodiac.map((z, i) => {
                const [x, y] = at(zodiacAngle(i * 30 + 15), (bandIn + bandOut) / 2 + 2);
                const lit = active?.sun?.sign === i;
                return (
                  <g key={i} transform={`translate(${x} ${y})`}>
                    <text
                      fontSize={20}
                      className={`glyph c-sign ${lit ? "is-lit" : ""}`}
                      fill={lit ? "var(--color-accent)" : "currentColor"}
                      style={d(0.6 + i * 0.09)}
                    >
                      <title>{z.name}</title>
                      {z.glyph}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* orbits, one per generation */}
            <g fill="none" stroke="currentColor">
              {RINGS.slice(1, maxGen + 1).map((r, i) => (
                <path key={r} d={arc(r)} strokeWidth={0.75} strokeDasharray="1 7" strokeLinecap="round" className="c-orbit" style={d(PRELUDE + (i + 1) * STEP - 0.6)} />
              ))}
            </g>
            <g className="font-mono" fontSize={10} fill="currentColor" textAnchor="middle">
              {RINGS.slice(1, maxGen + 1).map((r, i) => {
                const [x, y] = at(FAN_START - FAN_SPAN - EDGE - 3, r);
                return (
                  <text key={r} x={x + 6} y={y + 6} className="c-fade" opacity={0.55} style={d(PRELUDE + (i + 1) * STEP)}>
                    {ROMAN[i + 1]}
                  </text>
                );
              })}
            </g>

            {/* the first light, spreading from the requester */}
            <circle cx={cx} cy={cy} r={RINGS[1]} fill="none" stroke="var(--color-accent)" strokeWidth={1} className="c-ripple" />
            <circle cx={cx} cy={cy} r={RINGS[1]} fill="none" stroke="var(--color-accent)" strokeWidth={1} className="c-ripple c-ripple-2" />

            {/* threads between people born under the same sign */}
            <g fill="none" stroke="var(--color-accent-3)" strokeWidth={0.9} strokeDasharray="1 5" strokeLinecap="round">
              {kin.map(([a, b]) => {
                const [x0, y0] = pos(a.path);
                const [x1, y1] = pos(b.path);
                const mx = (x0 + x1) / 2;
                const my = (y0 + y1) / 2;
                const lit = active?.id === a.id || active?.id === b.id;
                return (
                  <path
                    key={a.id + b.id}
                    d={`M ${x0} ${y0} Q ${mx + (cx - mx) * 0.35} ${my + (cy - my) * 0.35} ${x1} ${y1}`}
                    className={`c-kin ${lit ? "is-lit" : ""}`}
                    style={d(finale + 0.4)}
                  />
                );
              })}
            </g>

            {/* each Sun's ray to its place in the zodiac */}
            <g stroke="var(--color-accent)" strokeWidth={0.75} strokeDasharray="2 4">
              {shown.map((p) => {
                if (!p.sun) return null;
                const [x0, y0] = pos(p.path);
                const [x1, y1] = at(zodiacAngle(p.sun.lon), bandIn);
                return <line key={p.id} x1={x0} y1={y0} x2={x1} y2={y1} className={`c-ray ${active?.id === p.id ? "is-lit" : ""}`} />;
              })}
            </g>

            {/* branches */}
            <g fill="none" strokeLinecap="round">
              {unknownSlots.map((path) => (
                <path
                  key={path}
                  d={branch(path.slice(0, -1), path)}
                  stroke="currentColor"
                  strokeWidth={0.75}
                  strokeDasharray="2 5"
                  className="c-faint"
                  style={d(when(path, 0.3))}
                />
              ))}
              {shown
                .filter((p) => p.path.length > 0)
                .map((p) => {
                  const lit = inLine(p.path);
                  return (
                    <g key={p.id} style={fade(dimmed(p.path))}>
                      <path
                        d={branch(p.path.slice(0, -1), p.path)}
                        pathLength={1}
                        stroke={lit || p.found ? "var(--color-accent)" : "currentColor"}
                        strokeWidth={(p.path.length === 1 ? 1.75 : p.path.length === 2 ? 1.4 : 1.1) + (lit ? 0.9 : 0)}
                        className="c-link"
                        style={d(when(p.path, -0.85))}
                      />
                    </g>
                  );
                })}
            </g>

            {/* places still empty */}
            {unknownSlots.map((path) => {
              const [x, y] = pos(path);
              return (
                <circle key={path} cx={x} cy={y} r={3} fill="var(--color-paper)" stroke="currentColor" strokeWidth={0.75} className="c-faint" style={d(when(path, 0.5))} />
              );
            })}

            {/* where each Sun stood, marked on the band */}
            {shown.map((p) => {
              if (!p.sun) return null;
              const [x, y] = at(zodiacAngle(p.sun.lon), bandIn);
              const lit = active?.id === p.id;
              return (
                <g key={p.id} transform={`translate(${x} ${y})`}>
                  <circle
                    r={lit ? 6 : 3.5}
                    fill="var(--color-accent)"
                    stroke="var(--color-paper)"
                    strokeWidth={1.5}
                    className="c-node"
                    style={{ ...d(when(p.path, 0.7)), transitionProperty: "opacity, transform, r" }}
                  />
                </g>
              );
            })}

            {/* people */}
            {shown.map((p) => {
              const g = p.path.length;
              const [x, y] = pos(p.path);
              const theta = angleOf(p.path);
              const left = theta > 90;
              const r = p.sun || p.hidden ? NODE[g] : NODE[g] * 0.62;
              const isSelected = selectedId === p.id;
              const tone = p.found ? "var(--color-accent)" : "currentColor";
              const halo = { paintOrder: "stroke", stroke: "var(--color-paper)", strokeWidth: 5, strokeLinejoin: "round" } as const;

              let label: React.ReactNode;
              if (g === 0) {
                label = (
                  <g textAnchor="middle">
                    <text y={r + 30} fontSize={24} className="font-display" style={halo}>
                      {clip(p.name, 34)}
                    </text>
                    <text y={r + 49} fontSize={10} letterSpacing="0.14em" className="font-mono uppercase" opacity={0.7}>
                      {p.relationShort}
                      {p.years && ` · ${p.years}`}
                    </text>
                  </g>
                );
              } else if (g <= 2 || !radial) {
                const dx = left ? -(r + 9) : r + 9;
                label = (
                  <g textAnchor={left ? "end" : "start"}>
                    <text x={dx} y={-9} fontSize={9.5} letterSpacing="0.14em" className="font-mono uppercase" opacity={0.7} style={halo}>
                      {p.relationShort}
                      {p.found && " ✦"}
                    </text>
                    <text x={dx} y={10} fontSize={g === 1 ? 19 : 16.5} className="font-display" style={halo}>
                      {clip(p.name, 26)}
                    </text>
                    {p.years && (
                      <text x={dx} y={25} fontSize={10} className="font-mono" opacity={0.7} style={halo}>
                        {p.years}
                      </text>
                    )}
                  </g>
                );
              } else {
                // outer generations: labels run outward along the ray, like a fan chart
                const rot = left ? 180 - theta : -theta;
                const dx = left ? -(r + 8) : r + 8;
                label = (
                  <g transform={`rotate(${rot})`} textAnchor={left ? "end" : "start"}>
                    <text x={dx} y={1} fontSize={14.5} className="font-display" style={halo}>
                      {clip(p.name, 23)}
                    </text>
                    {p.years && (
                      <text x={dx} y={14} fontSize={9} className="font-mono" opacity={0.7} style={halo}>
                        {p.years}
                      </text>
                    )}
                  </g>
                );
              }

              const body = (
                <>
                  <g className="c-node" style={d(when(p.path))}>
                    <circle r={r * 2.1} fill="var(--color-accent)" className="c-halo" />
                    <circle r={r + 5} fill="none" stroke="var(--color-accent)" strokeWidth={1.25} className={`c-select ${isSelected ? "is-lit" : ""}`} />
                    <g className="c-mark">
                      <circle
                        r={r}
                        fill={p.hidden ? "var(--color-paper)" : tone}
                        stroke={tone}
                        strokeWidth={1.25}
                        strokeDasharray={p.hidden ? "2 2" : undefined}
                      />
                      {p.sun && (
                        <text
                          className="glyph"
                          fontSize={r * 1.3}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="var(--color-paper)"
                          style={{ pointerEvents: "none" }}
                        >
                          {p.sun.glyph}
                        </text>
                      )}
                    </g>
                  </g>
                  <g className="c-label" fill="currentColor" style={d(when(p.path, 0.35))}>
                    {label}
                  </g>
                </>
              );

              return (
                <g key={p.id} transform={`translate(${x} ${y})`} style={fade(dimmed(p.path))} onMouseEnter={() => setHoverId(p.id)}>
                  {p.hidden ? (
                    body
                  ) : (
                    <a
                      href={p.href}
                      className={`c-person ${isSelected ? "is-selected" : ""}`}
                      aria-label={`${p.relationShort}: ${p.name}`}
                      aria-expanded={isSelected}
                      onClick={(e) => {
                        // plain click opens the card beside the chart; modified clicks still follow the link
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                        e.preventDefault();
                        open(p);
                      }}
                      onFocus={() => setHoverId(p.id)}
                      onBlur={() => setHoverId(null)}
                    >
                      <circle r={24} fill="transparent" />
                      {body}
                    </a>
                  )}
                </g>
              );
            })}
          </svg>
        </Unveil>

        <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-soft">
          <li>
            <span aria-hidden>●</span> {labels.legendIntake}
          </li>
          <li>
            <span aria-hidden className="text-accent">
              ●
            </span>{" "}
            {labels.legendResearch}
          </li>
          <li>
            <span aria-hidden>○</span> {labels.legendUnknown}
          </li>
          <li>
            <span aria-hidden className="text-accent">
              •
            </span>{" "}
            {labels.legendSun}
          </li>
          <li>
            <span aria-hidden className="text-accent-3">
              ┄
            </span>{" "}
            {labels.legendKin}
          </li>
        </ul>
        {!selected && <p className="mt-3 text-center text-sm text-ink-soft">{labels.hint}</p>}

        {deeper.length > 0 && (
          <div className="mt-8">
            <p className="eyebrow mb-2">{labels.deeper}</p>
            <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {deeper.map((p) => (
                <li key={p.id}>
                  {p.hidden ? (
                    <div className="card border-dashed px-3 py-2">
                      <span className="eyebrow block truncate !text-[0.625rem]">{p.relation}</span>
                      <span className="block truncate font-semibold">{p.name}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => open(p)}
                      className="card fade-colors block w-full cursor-pointer px-3 py-2 text-left hover:border-accent"
                    >
                      <span className="eyebrow block truncate !text-[0.625rem]">{p.relation}</span>
                      <span className="block truncate font-semibold">{p.name}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {selected && (
        <aside ref={cardRef} key={selected.id} className="card person-card relative mt-8 p-5 lg:sticky lg:top-6 lg:mt-0" aria-live="polite">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            aria-label={labels.close}
            title={labels.close}
            className="absolute top-3 right-3 grid h-7 w-7 cursor-pointer place-items-center border border-ink text-sm leading-none transition-colors duration-300 hover:bg-ink hover:text-paper"
          >
            ×
          </button>
          <p className="eyebrow pr-9">
            {selected.relation}
            {selected.found && <span className="text-accent"> ✦ {labels.foundBadge}</span>}
          </p>
          <h3 className="display mt-1.5 pr-6 text-3xl">{selected.name}</h3>

          <dl className="mt-4 grid gap-2.5 border-t border-hair pt-4 text-sm">
            {selected.born && (
              <div>
                <dt className="eyebrow">{labels.born}</dt>
                <dd>{selected.born}</dd>
              </div>
            )}
            {selected.died && (
              <div>
                <dt className="eyebrow">{labels.died}</dt>
                <dd>{selected.died}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 border-t border-hair pt-4">
            {selected.sun ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-ink px-3 py-2">
                    <p className="eyebrow">
                      <span className="glyph">{labels.sunGlyph}</span> {labels.sun}
                    </p>
                    <p className="display text-xl">
                      <span className="glyph text-accent">{selected.sun.glyph}</span> {selected.sun.name}
                    </p>
                  </div>
                  <div className={`border px-3 py-2 ${selected.moon ? "border-ink" : "border-dashed border-ink"}`}>
                    <p className="eyebrow">
                      <span className="glyph">{labels.moonGlyph}</span> {labels.moon}
                    </p>
                    <p className="display text-xl">
                      {selected.moon ? (
                        <>
                          <span className="glyph text-accent">{selected.moon.glyph}</span> {selected.moon.name}
                        </>
                      ) : (
                        <span className="text-ink-faint">?</span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="eyebrow mt-3">
                  {labels.element}: {selected.element}
                  {!selected.hourKnown && ` · ${labels.hourUnknown}`}
                </p>
                <p className="mt-2 text-sm leading-relaxed">{selected.sun.text}</p>
              </>
            ) : (
              <p className="text-sm text-ink-soft">{labels.noChart}</p>
            )}
          </div>

          {selected.notes && (
            <div className="mt-4 border-t border-hair pt-4">
              <p className="eyebrow mb-1">{labels.notes}</p>
              <p className="text-sm whitespace-pre-wrap">{selected.notes}</p>
            </div>
          )}

          <div className="mt-4 border-t border-hair pt-4">
            <p className="eyebrow mb-2">{labels.documents}</p>
            {selected.docs.length === 0 ? (
              <p className="text-sm text-ink-soft">{labels.noDocuments}</p>
            ) : (
              <ul className="grid gap-1.5">
                {selected.docs.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fade-colors flex items-center gap-2.5 border border-ink px-3 py-2 text-sm hover:border-accent hover:text-accent"
                    >
                      <span className="shrink-0 border border-current px-1 font-mono text-[0.5625rem] uppercase tracking-[0.1em]">
                        {doc.kind === "file" ? labels.pdf : labels.link}
                      </span>
                      <span className="min-w-0 flex-1">{doc.title}</span>
                      <span aria-hidden>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link href={selected.href} className="btn mt-5 w-full">
            {labels.openReport} →
          </Link>
        </aside>
      )}
    </div>
  );
}
