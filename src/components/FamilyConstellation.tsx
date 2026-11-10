import { Link } from "@/i18n/navigation";
import type { Person } from "@/db/schema";
import { fullName, lifespan, relationLabel } from "@/lib/people";
import { Unveil } from "./Unveil";

export type ConstellationLabels = {
  unknown: string;
  living: string;
  deeper: string;
  legendIntake: string;
  legendResearch: string;
  legendUnknown: string;
  title: string;
};

const MAX_GEN = 4;
/** radius of each generation's orbit */
const RINGS = [0, 150, 290, 420, 510];
/** the fan opens 120°, from 150° (paternal edge) to 30° (maternal edge) */
const FAN_START = 150;
const FAN_SPAN = 120;
const NODE = [10, 7.5, 6.5, 5.5, 5];
const STAR = "M0 -1 C0.05 -0.38 0.38 -0.05 1 0 C0.38 0.05 0.05 0.38 0 1 C-0.05 0.38 -0.38 0.05 -1 0 C-0.38 -0.05 -0.05 -0.38 0 -1 Z";
const ROMAN = ["", "I", "II", "III", "IV"];

const slotOf = (path: string) => path.split("").reduce((n, c) => n * 2 + (c === "m" ? 1 : 0), 0);
/** fan angle in degrees, measured anticlockwise from the right */
const angleOf = (path: string) =>
  path.length === 0 ? 90 : FAN_START - ((slotOf(path) + 0.5) * FAN_SPAN) / 2 ** path.length;
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/**
 * The family as a constellation: the requester at the foot, each generation on
 * a wider orbit above. Branches draw themselves outward, one generation at a
 * time, the first time the chart scrolls into view.
 */
export function FamilyConstellation({
  people,
  locale,
  labels,
  hrefFor,
  hiddenIds,
}: {
  people: Person[];
  locale: string;
  labels: ConstellationLabels;
  hrefFor: (p: Person) => string;
  hiddenIds?: Set<string>;
}) {
  const shown = people.filter((p) => p.path.length <= MAX_GEN);
  const deeper = people.filter((p) => p.path.length > MAX_GEN);
  const maxGen = Math.max(2, ...shown.map((p) => p.path.length));
  const radial = maxGen >= 3;
  const R = RINGS[maxGen];
  const W = 2 * (R * 0.87 + (radial ? 190 : 240));
  const top = radial ? 196 : 70;
  const cx = W / 2;
  const cy = top + R;
  const H = cy + 112;

  const at = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
  };
  const pos = (path: string, r = RINGS[path.length]) => at(angleOf(path), r);
  const edge = 7; // orbits run a little past the outermost people
  const branch = (child: string, parent: string) => {
    const [x0, y0] = pos(child);
    const [x1, y1] = pos(parent);
    const rm = (RINGS[child.length] + RINGS[parent.length]) / 2;
    const [c1x, c1y] = child.length === 0 ? [cx, cy - rm * 0.9] : pos(child, rm);
    const [c2x, c2y] = pos(parent, rm);
    return `M ${x0} ${y0} C ${c1x} ${c1y} ${c2x} ${c2y} ${x1} ${y1}`;
  };
  /** seconds before a generation starts to appear */
  const delay = (path: string, extra = 0) =>
    `${(path.length * 1.15 + (slotOf(path) / 2 ** path.length) * 0.5 + extra).toFixed(2)}s`;

  const paths = new Set(shown.map((p) => p.path));
  const unknownSlots = shown
    .filter((p) => p.path.length < maxGen)
    .flatMap((p) => [p.path + "f", p.path + "m"])
    .filter((path) => !paths.has(path));

  return (
    <div>
      <Unveil className="constellation overflow-x-auto">
        <noscript>
          <style>{`.constellation *{opacity:1!important;stroke-dashoffset:0!important;transform:none!important}`}</style>
        </noscript>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={labels.title}
          className="mx-auto block h-auto w-full"
          style={{ minWidth: Math.min(W, radial ? 860 : 620), maxWidth: W }}
        >
          {/* orbits, one per generation */}
          <g fill="none" stroke="currentColor">
            {RINGS.slice(1, maxGen + 1).map((r, i) => (
              <path
                key={r}
                d={`M ${at(FAN_START + edge, r).join(" ")} A ${r} ${r} 0 0 1 ${at(FAN_START - FAN_SPAN - edge, r).join(" ")}`}
                strokeWidth={0.75}
                strokeDasharray="1 7"
                strokeLinecap="round"
                className="c-orbit"
                style={{ "--d": `${(i + 1) * 1.15 - 0.6}s` } as React.CSSProperties}
              />
            ))}
          </g>
          <g className="font-mono" fontSize={10} fill="currentColor" textAnchor="middle">
            {RINGS.slice(1, maxGen + 1).map((r, i) => (
              <text
                key={r}
                x={at(FAN_START - FAN_SPAN - edge - 3, r)[0] + 6}
                y={at(FAN_START - FAN_SPAN - edge - 3, r)[1] + 6}
                className="c-label"
                opacity={0.55}
                style={{ "--d": `${(i + 1) * 1.15}s` } as React.CSSProperties}
              >
                {ROMAN[i + 1]}
              </text>
            ))}
          </g>

          {/* the first light, spreading from the requester */}
          <circle cx={cx} cy={cy} r={RINGS[1]} fill="none" stroke="var(--color-accent)" strokeWidth={1} className="c-ripple" />
          <circle cx={cx} cy={cy} r={RINGS[1]} fill="none" stroke="var(--color-accent)" strokeWidth={1} className="c-ripple c-ripple-2" />

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
                style={{ "--d": delay(path, 0.3) } as React.CSSProperties}
              />
            ))}
            {shown
              .filter((p) => p.path.length > 0)
              .map((p) => (
                <path
                  key={p.id}
                  d={branch(p.path.slice(0, -1), p.path)}
                  pathLength={1}
                  stroke={p.source === "research" ? "var(--color-accent)" : "currentColor"}
                  strokeWidth={p.path.length === 1 ? 1.75 : p.path.length === 2 ? 1.4 : 1.1}
                  className="c-link"
                  style={{ "--d": delay(p.path, -0.85) } as React.CSSProperties}
                />
              ))}
          </g>

          {/* places still empty */}
          {unknownSlots.map((path) => {
            const [x, y] = pos(path);
            return (
              <circle
                key={path}
                cx={x}
                cy={y}
                r={3}
                fill="var(--color-paper)"
                stroke="currentColor"
                strokeWidth={0.75}
                className="c-faint"
                style={{ "--d": delay(path, 0.5) } as React.CSSProperties}
              />
            );
          })}

          {/* people */}
          {shown.map((p) => {
            const g = p.path.length;
            const [x, y] = pos(p.path);
            const theta = angleOf(p.path);
            const hidden = hiddenIds?.has(p.id) ?? false;
            const found = p.source === "research";
            const name = hidden ? labels.living : fullName(p) || labels.unknown;
            const relation = relationLabel(p.path, locale).replace(/ \(.*\)$/, "");
            const years = hidden ? "" : lifespan(p);
            const left = theta > 90;
            const r = NODE[g];
            const halo = { paintOrder: "stroke", stroke: "var(--color-paper)", strokeWidth: 5, strokeLinejoin: "round" } as const;

            let label: React.ReactNode;
            if (g === 0) {
              label = (
                <g textAnchor="middle">
                  <text y={38} fontSize={24} className="font-display" style={halo}>
                    {clip(name, 34)}
                  </text>
                  <text y={57} fontSize={10} letterSpacing="0.14em" className="font-mono uppercase" opacity={0.7}>
                    {relation}
                    {years && ` · ${years}`}
                  </text>
                </g>
              );
            } else if (g <= 2 || !radial) {
              const dx = left ? -(r + 9) : r + 9;
              label = (
                <g textAnchor={left ? "end" : "start"}>
                  <text x={dx} y={-9} fontSize={9.5} letterSpacing="0.14em" className="font-mono uppercase" opacity={0.7} style={halo}>
                    {relation}
                    {found && " ✦"}
                  </text>
                  <text x={dx} y={10} fontSize={g === 1 ? 19 : 16.5} className="font-display" style={halo}>
                    {clip(name, 26)}
                  </text>
                  {years && (
                    <text x={dx} y={25} fontSize={10} className="font-mono" opacity={0.7} style={halo}>
                      {years}
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
                    {clip(name, 23)}
                  </text>
                  {years && (
                    <text x={dx} y={14} fontSize={9} className="font-mono" opacity={0.7} style={halo}>
                      {years}
                    </text>
                  )}
                </g>
              );
            }

            const mark = (
              <g className="c-node" style={{ "--d": delay(p.path) } as React.CSSProperties}>
                <circle r={r * 2.6} fill="var(--color-accent)" className="c-halo" />
                {found ? (
                  <path d={STAR} transform={`scale(${r * 1.9})`} fill="var(--color-accent)" />
                ) : (
                  <circle
                    r={r}
                    fill={hidden ? "var(--color-paper)" : "currentColor"}
                    stroke="currentColor"
                    strokeWidth={1.25}
                    strokeDasharray={hidden ? "2 2" : undefined}
                  />
                )}
              </g>
            );
            const body = (
              <>
                {mark}
                <g className="c-label" fill="currentColor" style={{ "--d": delay(p.path, 0.35) } as React.CSSProperties}>
                  {label}
                </g>
              </>
            );
            return (
              <g key={p.id} transform={`translate(${x} ${y})`}>
                {hidden ? (
                  body
                ) : (
                  <Link href={hrefFor(p)} className="c-person" aria-label={`${relation}: ${name}`}>
                    {/* generous, invisible hit area */}
                    <circle r={22} fill="transparent" />
                    {body}
                  </Link>
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
            ✦
          </span>{" "}
          {labels.legendResearch}
        </li>
        <li>
          <span aria-hidden>○</span> {labels.legendUnknown}
        </li>
      </ul>

      {deeper.length > 0 && (
        <div className="mt-8">
          <p className="eyebrow mb-2">{labels.deeper}</p>
          <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {deeper.map((p) => {
              const hidden = hiddenIds?.has(p.id);
              const inner = (
                <>
                  <span className="eyebrow block truncate !text-[0.625rem]">{relationLabel(p.path, locale)}</span>
                  <span className="block truncate font-semibold">{hidden ? labels.living : fullName(p) || labels.unknown}</span>
                </>
              );
              return (
                <li key={p.id}>
                  {hidden ? (
                    <div className="card border-dashed px-3 py-2">{inner}</div>
                  ) : (
                    <Link href={hrefFor(p)} className="card fade-colors block px-3 py-2 hover:border-accent">
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
