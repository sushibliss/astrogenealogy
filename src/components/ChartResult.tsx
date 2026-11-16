import type { Chart } from "@/lib/astro/chart";
import { ELEMENTS, SIGNS, formatDegree } from "@/lib/astro/chart";
import { BODY_GLYPH, SIGN_GLYPH } from "@/lib/astro/glyphs";
import { BODY_NAMES, DOMAIN, ELEMENT_NAMES, MANNER, MOON, RISING, SIGN_NAMES, SUN } from "@/lib/astro/readings";
import { Wheel } from "./Wheel";

export type ChartLabels = Record<"title" | "sun" | "moon" | "rising" | "risingMissing" | "moonEither" | "planets" | "elements" | "wheel", string>;

/** The free chart: wheel, the three main points and every planet by sign. */
export function ChartResult({ chart, lang, labels }: { chart: Chart; lang: "en" | "es"; labels: ChartLabels }) {
  const [sun, moon, ...rest] = chart.placements;
  const sign = (i: number) => SIGNS[i];
  const total = Object.values(chart.elements).reduce((a, b) => a + b, 0) || 1;
  const main = [
    { label: labels.sun, glyph: SIGN_GLYPH[sign(sun.sign)], name: SIGN_NAMES[sign(sun.sign)][lang], text: SUN[sign(sun.sign)][lang] },
    moon.uncertain
      ? { label: labels.moon, glyph: "?", name: `${SIGN_NAMES[sign(moon.sign)][lang]} / ${SIGN_NAMES[sign(moon.altSign ?? moon.sign)][lang]}`, text: labels.moonEither }
      : { label: labels.moon, glyph: SIGN_GLYPH[sign(moon.sign)], name: SIGN_NAMES[sign(moon.sign)][lang], text: MOON[sign(moon.sign)][lang] },
    chart.hasAngles && chart.asc != null
      ? {
          label: labels.rising,
          glyph: SIGN_GLYPH[sign(Math.floor(chart.asc / 30) % 12)],
          name: SIGN_NAMES[sign(Math.floor(chart.asc / 30) % 12)][lang],
          text: RISING[sign(Math.floor(chart.asc / 30) % 12)][lang],
        }
      : { label: labels.rising, glyph: "?", name: "–", text: labels.risingMissing },
  ];
  return (
    <div className="mt-10">
      <h2 className="display text-4xl">{labels.title}</h2>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="card p-4">
          <Wheel chart={chart} title={labels.wheel} className="w-full" />
        </div>
        <div className="grid gap-3">
          {main.map((m) => (
            <div key={m.label} className="card grid grid-cols-[3.5rem_1fr] items-start gap-4 p-5">
              <span className="glyph grid h-14 w-14 place-items-center rounded-full border border-hair text-3xl text-accent" aria-hidden>
                {m.glyph}
              </span>
              <div>
                <p className="eyebrow">{m.label}</p>
                <p className="display text-2xl">{m.name}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <h3 className="eyebrow mb-2">{labels.planets}</h3>
          <ul className="border-t border-hair">
            {rest.map((p) => (
              <li key={p.body} className="grid grid-cols-[2rem_1fr] gap-x-3 border-b border-hair py-3 sm:grid-cols-[2rem_6rem_11rem_1fr] sm:items-baseline">
                <span className="glyph text-xl text-accent" aria-hidden>
                  {BODY_GLYPH[p.body]}
                </span>
                <span className="font-semibold">{BODY_NAMES[p.body][lang]}</span>
                <span className="col-start-2 font-mono text-sm sm:col-start-auto">
                  <span className="glyph">{SIGN_GLYPH[sign(p.sign)]}</span> {SIGN_NAMES[sign(p.sign)][lang]} {formatDegree(p.deg)}
                  {p.retrograde && " ℞"}
                </span>
                <span className="col-start-2 text-sm text-ink-soft sm:col-start-auto">
                  {DOMAIN[p.body as keyof typeof DOMAIN][lang]}: {MANNER[sign(p.sign)][lang]}.
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card self-start p-5">
          <h3 className="eyebrow mb-3">{labels.elements}</h3>
          <ul className="grid gap-2">
            {ELEMENTS.map((key) => (
              <li key={key} className="grid grid-cols-[4.5rem_1fr_1.25rem] items-center gap-2 text-sm">
                <span>{ELEMENT_NAMES[key][lang]}</span>
                <span className="meter">
                  <span style={{ width: `${(chart.elements[key] / total) * 100}%`, background: "var(--color-accent)" }} />
                </span>
                <span className="text-right font-mono text-xs text-ink-soft">{chart.elements[key]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
