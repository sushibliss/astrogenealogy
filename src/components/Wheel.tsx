import { type Chart, SIGNS, signOf } from "@/lib/astro/chart";
import { BODY_GLYPH, SIGN_GLYPH } from "@/lib/astro/glyphs";

const SIZE = 640;
const C = SIZE / 2;
const R_OUT = 300;
const R_IN = 256;
const R_SIGN = 278;
const R_PLANET = 214;
const R_ASPECT = 168;

/** Keeps glyphs legible when planets sit close together. */
function spread(angles: number[], minGap: number) {
  const idx = angles.map((_, i) => i).sort((a, b) => angles[a] - angles[b]);
  const out = idx.map((i) => angles[i]);
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let k = 0; k < out.length; k++) {
      const next = (k + 1) % out.length;
      let gap = out[next] - out[k];
      if (next === 0) gap += 360;
      if (gap < minGap) {
        const push = (minGap - gap) / 2;
        out[k] -= push;
        out[next] += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  const result = new Array<number>(angles.length);
  idx.forEach((orig, k) => (result[orig] = out[k]));
  return result;
}

/**
 * Natal wheel, drawn as black line art.
 * With angles the Ascendant sits at nine o'clock; without them 0° Aries does.
 */
export function Wheel({
  chart,
  title,
  className,
  animated = false,
}: {
  chart: Chart;
  title: string;
  className?: string;
  /** draws the aspects in and lets the planets appear one by one (landing page) */
  animated?: boolean;
}) {
  const base = chart.hasAngles && chart.asc != null ? chart.asc : 0;
  const pt = (lon: number, r: number) => {
    const a = ((180 + (lon - base)) * Math.PI) / 180;
    return [C + r * Math.cos(a), C - r * Math.sin(a)] as const;
  };
  const line = (lon: number, r1: number, r2: number) => {
    const [x1, y1] = pt(lon, r1);
    const [x2, y2] = pt(lon, r2);
    return { x1, y1, x2, y2 };
  };
  const arc = (from: number, to: number, r: number) => {
    const [x1, y1] = pt(from, r);
    const [x2, y2] = pt(to, r);
    const sweep = (((to - from) % 360) + 360) % 360;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${x2} ${y2}`;
  };

  const shown = spread(
    chart.placements.map((p) => p.lon),
    11,
  );
  const lonOf = Object.fromEntries(chart.placements.map((p) => [p.body, p.lon]));
  const moon = chart.placements.find((p) => p.body === "moon");

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={title} className={className}>
      <title>{title}</title>
      <g fill="none" stroke="currentColor">
        <circle cx={C} cy={C} r={R_OUT} strokeWidth={1.5} />
        <circle cx={C} cy={C} r={R_IN} strokeWidth={1.5} />
        <circle cx={C} cy={C} r={R_ASPECT} strokeWidth={0.75} />
        {SIGNS.map((_, i) => (
          <line key={i} {...line(i * 30, R_IN, R_OUT)} strokeWidth={1.5} />
        ))}
        {Array.from({ length: 360 }, (_, d) =>
          d % 30 === 0 ? null : (
            <line
              key={d}
              {...line(d, R_IN, R_IN - (d % 10 === 0 ? 10 : d % 5 === 0 ? 7 : 4))}
              strokeWidth={d % 5 === 0 ? 1 : 0.5}
            />
          ),
        )}
        {chart.hasAngles &&
          SIGNS.map((_, i) => (
            <line key={`h${i}`} {...line(i * 30, R_ASPECT, R_IN)} strokeWidth={0.5} strokeDasharray="2 4" />
          ))}

        {/* aspects: solid = hard, dashed = soft */}
        {chart.aspects
          .filter((a) => a.type !== "conjunction")
          .map((a) => {
            const [x1, y1] = pt(lonOf[a.a], R_ASPECT);
            const [x2, y2] = pt(lonOf[a.b], R_ASPECT);
            const soft = a.type === "trine" || a.type === "sextile";
            return (
              <line
                key={`${a.a}-${a.b}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={soft ? 0.75 : 1}
                strokeDasharray={soft ? "5 5" : undefined}
                className={animated ? "wheel-aspect" : undefined}
              />
            );
          })}

        {/* where the Moon may be when the hour is unknown */}
        {moon?.dayRange && <path d={arc(moon.dayRange[0], moon.dayRange[1], R_IN - 16)} strokeWidth={4} />}

        {chart.placements.map((p, i) => {
          const [x1, y1] = pt(p.lon, R_IN - 12);
          const [x2, y2] = pt(shown[i], R_PLANET + 18);
          return (
            <g key={p.body}>
              <line {...line(p.lon, R_IN, R_IN - 12)} strokeWidth={1.5} />
              <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={0.5} />
            </g>
          );
        })}

        {chart.hasAngles && chart.asc != null && chart.mc != null && (
          <>
            <line {...line(chart.asc, R_ASPECT, R_OUT + 14)} strokeWidth={2} />
            <line {...line(chart.mc, R_ASPECT, R_OUT + 14)} strokeWidth={2} />
          </>
        )}
      </g>

      <g fill="currentColor" textAnchor="middle" dominantBaseline="central">
        {SIGNS.map((s, i) => {
          const [x, y] = pt(i * 30 + 15, R_SIGN);
          return (
            <text key={s} x={x} y={y} fontSize={26} className="glyph">
              {SIGN_GLYPH[s]}
            </text>
          );
        })}
        {chart.placements.map((p, i) => {
          const [x, y] = pt(shown[i], R_PLANET);
          return (
            <text
              key={p.body}
              x={x}
              y={y}
              fontSize={30}
              className={animated ? "glyph wheel-planet" : "glyph"}
              style={animated ? { animationDelay: `${0.5 + i * 0.16}s, ${2.5 + i * 0.7}s` } : undefined}
            >
              {BODY_GLYPH[p.body]}
            </text>
          );
        })}
        {chart.hasAngles &&
          chart.asc != null &&
          SIGNS.map((_, i) => {
            const house = ((i - signOf(chart.asc!) + 12) % 12) + 1;
            const [x, y] = pt(i * 30 + 15, R_ASPECT + 14);
            return (
              <text key={i} x={x} y={y} fontSize={11} className="font-mono" opacity={0.7}>
                {house}
              </text>
            );
          })}
        {chart.hasAngles && chart.asc != null && chart.mc != null && (
          <g fontSize={11} className="font-mono" fontWeight={600}>
            <text x={pt(chart.asc, R_OUT + 6)[0] - 2} y={pt(chart.asc, R_OUT + 6)[1] - 12} textAnchor="start">
              ASC
            </text>
            <text x={pt(chart.mc, R_OUT + 6)[0] + 16} y={pt(chart.mc, R_OUT + 6)[1]}>
              MC
            </text>
          </g>
        )}
        <circle cx={C} cy={C} r={2.5} />
      </g>
    </svg>
  );
}
