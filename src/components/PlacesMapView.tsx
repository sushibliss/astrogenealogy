"use client";

import { useRef, useState } from "react";
import type { FamilyMap, MapPlace, PlaceKind } from "@/lib/family-places";

export type MapLabels = Record<"title" | "born" | "lived" | "died" | "hint" | "zoomIn" | "zoomOut" | "reset" | "unplaced" | "show", string>;

const KINDS: PlaceKind[] = ["born", "lived", "died"];
const TONE: Record<PlaceKind, string> = {
  born: "var(--color-accent)",
  lived: "var(--color-accent-2)",
  died: "var(--color-accent-3)",
};
const MAX_ZOOM = 8;

/** The three marks nest, so one place can show all of them at once. */
function Mark({ kind, size = 14 }: { kind: PlaceKind; size?: number }) {
  return (
    <svg viewBox="-12 -12 24 24" width={size} height={size} aria-hidden className="inline-block shrink-0 align-[-0.15em]">
      {kind === "born" && <circle r={5} fill={TONE.born} />}
      {kind === "lived" && <circle r={7} fill="none" stroke={TONE.lived} strokeWidth={2.5} />}
      {kind === "died" && <circle r={9.5} fill="none" stroke={TONE.died} strokeWidth={2.5} strokeDasharray="3.2 3.2" />}
    </svg>
  );
}

export function PlacesMapView({ map, width: W, height: H, labels }: { map: FamilyMap; width: number; height: number; labels: MapLabels }) {
  const [on, setOn] = useState<Record<PlaceKind, boolean>>({ born: true, lived: true, died: true });
  const [hover, setHover] = useState<{ person?: string; place?: string } | null>(null);
  const [pin, setPin] = useState<{ person?: string; place?: string } | null>(null);
  const [view, setView] = useState({ k: 1, cx: W / 2, cy: H / 2 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; scale: number } | null>(null);

  const active = hover ?? pin;
  const person = active?.person ? map.people.find((p) => p.id === active.person) : undefined;
  const place = active?.place ? map.places.find((p) => p.id === active.place) : undefined;
  const nameOf = (id: string) => map.people.find((p) => p.id === id)?.name ?? "";

  const clamp = (v: { k: number; cx: number; cy: number }) => {
    const k = Math.min(MAX_ZOOM, Math.max(1, v.k));
    return {
      k,
      cx: Math.min(W - W / (2 * k), Math.max(W / (2 * k), v.cx)),
      cy: Math.min(H - H / (2 * k), Math.max(H / (2 * k), v.cy)),
    };
  };
  // the first step in goes to the chosen place, or to where most of the family was
  const focus = () => map.places.find((p) => p.id === pin?.place) ?? map.places[0];
  const zoom = (factor: number, at?: { x: number; y: number }) =>
    setView((v) => {
      const to = at ?? (v.k === 1 && factor > 1 ? focus() : undefined);
      return clamp({ k: v.k * factor, cx: to?.x ?? v.cx, cy: to?.y ?? v.cy });
    });
  const tx = W / 2 - view.cx * view.k;
  const ty = H / 2 - view.cy * view.k;

  const shows = (p: MapPlace) => p.events.some((e) => on[e.kind]);
  const lit = (p: MapPlace) =>
    place ? place.id === p.id : person ? person.stops.some((s) => s.placeId === p.id && on[s.kind]) : false;
  const toggle = (next: { person?: string; place?: string }) =>
    setPin((cur) => (cur?.person === next.person && cur?.place === next.place ? null : next));

  const caption = place ? (
    <>
      <span className="display mr-3 text-xl">{place.name}</span>
      {KINDS.filter((k) => on[k] && place.events.some((e) => e.kind === k)).map((k) => (
        <span key={k} className="mr-4 inline-block">
          <Mark kind={k} /> <span className="eyebrow">{labels[k]}</span>{" "}
          {place.events
            .filter((e) => e.kind === k)
            .map((e) => nameOf(e.personId))
            .join(", ")}
        </span>
      ))}
    </>
  ) : person ? (
    <>
      <span className="display mr-3 text-xl">{person.name}</span>
      {person.stops.map((s, i) => (
        <span key={i} className="mr-4 inline-block">
          <Mark kind={s.kind} /> {s.label}
          {s.when && <span className="text-ink-soft"> · {s.when}</span>}
        </span>
      ))}
    </>
  ) : (
    <span className="text-ink-soft">{labels.hint}</span>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="min-w-0">
        <div className="night map-panel relative overflow-hidden rounded-[1.75rem]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="group"
            aria-label={labels.title}
            className="block h-auto w-full select-none"
            style={{ cursor: view.k > 1 ? (dragging ? "grabbing" : "grab") : undefined, touchAction: view.k > 1 ? "none" : undefined }}
            onMouseLeave={() => setHover(null)}
            onDoubleClick={(e) => {
              const box = e.currentTarget.getBoundingClientRect();
              const scale = W / box.width;
              zoom(2, { x: ((e.clientX - box.left) * scale - tx) / view.k, y: ((e.clientY - box.top) * scale - ty) / view.k });
            }}
            onPointerDown={(e) => {
              if (view.k === 1) return;
              drag.current = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, scale: W / e.currentTarget.getBoundingClientRect().width };
              e.currentTarget.setPointerCapture(e.pointerId);
              setDragging(true);
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              setView((v) => clamp({ k: v.k, cx: d.cx - ((e.clientX - d.x) * d.scale) / v.k, cy: d.cy - ((e.clientY - d.y) * d.scale) / v.k }));
            }}
            onPointerUp={() => {
              drag.current = null;
              setDragging(false);
            }}
            onPointerCancel={() => {
              drag.current = null;
              setDragging(false);
            }}
          >
            <g
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${view.k})`,
                transition: dragging ? "none" : "transform 0.8s cubic-bezier(0.3, 0.7, 0.2, 1)",
              }}
            >
              <path d={map.graticule} fill="none" stroke="currentColor" strokeWidth={0.6} strokeDasharray="1 6" strokeLinecap="round" opacity={0.28} vectorEffect="non-scaling-stroke" />
              <path d={map.land} className="map-land" vectorEffect="non-scaling-stroke" />
              <path d={map.borders} fill="none" stroke="currentColor" strokeWidth={0.7} strokeDasharray="4 4" opacity={0.3} vectorEffect="non-scaling-stroke" />

              {/* every life as a faint thread; the active one lights up */}
              <g fill="none" strokeLinecap="round">
                {map.people.map((p) =>
                  p.route ? (
                    <path
                      key={p.id}
                      d={p.route}
                      stroke="var(--color-accent-2)"
                      strokeWidth={person?.id === p.id ? 2 : 1}
                      strokeDasharray={person?.id === p.id ? undefined : "2 5"}
                      vectorEffect="non-scaling-stroke"
                      className={`map-route ${person?.id === p.id ? "is-lit" : ""}`}
                      style={{ opacity: person ? (person.id === p.id ? 0.95 : 0.08) : place ? 0.12 : 0.3 }}
                    />
                  ) : null,
                )}
              </g>

              {map.places.filter(shows).map((p) => {
                const has = (k: PlaceKind) => on[k] && p.events.some((e) => e.kind === k);
                const isLit = lit(p);
                const dim = !!active && !isLit;
                return (
                  <g key={p.id} transform={`translate(${p.x} ${p.y})`}>
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label={`${labels.show}: ${p.name}`}
                      aria-pressed={pin?.place === p.id}
                      data-chime={p.name}
                      className="map-place"
                      style={{ transform: `scale(${1 / view.k})`, opacity: dim ? 0.3 : 1 }}
                      onMouseEnter={() => setHover({ place: p.id })}
                      onFocus={() => setHover({ place: p.id })}
                      onBlur={() => setHover(null)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => toggle({ place: p.id })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle({ place: p.id });
                        }
                      }}
                    >
                      <circle r={18} fill="transparent" />
                      <circle r={16} fill="var(--color-accent-2)" className={`map-glow ${isLit ? "is-lit" : ""}`} />
                      {has("died") && <circle r={10} fill="none" stroke={TONE.died} strokeWidth={1.5} strokeDasharray="2.6 2.6" />}
                      {has("lived") && <circle r={6.5} fill="none" stroke={TONE.lived} strokeWidth={1.6} />}
                      {has("born") ? <circle r={3.6} fill={TONE.born} /> : <circle r={1.2} fill="currentColor" opacity={0.7} />}
                      <text
                        x={p.label.dx}
                        y={p.label.dy}
                        textAnchor={p.label.anchor}
                        fontSize={14}
                        className="font-display"
                        fill={isLit ? "var(--color-accent-2)" : "currentColor"}
                        style={{ paintOrder: "stroke", stroke: "var(--color-paper)", strokeWidth: 4, strokeLinejoin: "round", transition: "fill 0.5s ease" }}
                      >
                        {p.name}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {(
              [
                [labels.zoomIn, "+", () => zoom(1.8), view.k >= MAX_ZOOM],
                [labels.zoomOut, "−", () => zoom(1 / 1.8), view.k <= 1],
                [labels.reset, "⟲", () => setView({ k: 1, cx: W / 2, cy: H / 2 }), view.k === 1],
              ] as const
            ).map(([label, sign, act, off]) => (
              <button key={label} type="button" aria-label={label} title={label} onClick={act} disabled={off} className="map-button">
                {sign}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={on[k]}
              onClick={() => setOn((cur) => ({ ...cur, [k]: !cur[k] }))}
              className={`chip ${on[k] ? "is-on" : ""}`}
            >
              <Mark kind={k} /> {labels[k]}
            </button>
          ))}
        </div>
        <p className="mt-3 min-h-[3.25rem] text-sm leading-relaxed" aria-live="polite">
          {caption}
        </p>
      </div>

      <ul className="grid gap-1.5 lg:max-h-[40rem] lg:overflow-y-auto lg:pr-1">
        {map.people.map((p) => {
          const here = place ? p.stops.some((s) => s.placeId === place.id && on[s.kind]) : false;
          const dim = (place && !here) || (person && person.id !== p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                data-chime={p.name}
                aria-pressed={pin?.person === p.id}
                onMouseEnter={() => setHover({ person: p.id })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ person: p.id })}
                onBlur={() => setHover(null)}
                onClick={() => toggle({ person: p.id })}
                className={`soft-card block w-full cursor-pointer px-4 py-3 text-left ${person?.id === p.id || here ? "is-lit" : ""}`}
                style={{ opacity: dim ? 0.45 : 1 }}
              >
                <span className="eyebrow block truncate !text-[0.625rem]">{p.relation}</span>
                <span className="block truncate font-semibold">{p.name}</span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                  {p.stops.map((s, i) => (
                    <span key={i} className="mr-2.5 inline-block" title={s.placeId ? labels[s.kind] : `${labels[s.kind]} · ${labels.unplaced}`}>
                      <Mark kind={s.kind} size={11} /> {s.label}
                      {!s.placeId && <span aria-label={labels.unplaced}> ?</span>}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
