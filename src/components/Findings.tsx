import { getTranslations } from "next-intl/server";
import type { Person } from "@/db/schema";
import { ELEMENTS, SIGNS, computeChart, elementOfSign } from "@/lib/astro/chart";
import { SIGN_GLYPH } from "@/lib/astro/glyphs";
import { ELEMENT_NAMES, SIGN_NAMES } from "@/lib/astro/readings";
import { birthDataOf, yearOf } from "@/lib/people";
import { Markdown } from "./Markdown";

const ELEMENT_TONE = {
  fire: "var(--color-accent)",
  earth: "var(--color-accent-2)",
  air: "var(--color-ink-soft)",
  water: "var(--color-accent-3)",
} as const;

/**
 * The written findings, set across the whole screen: what the page holds on
 * the left, the text in the middle, and the family in figures on the right.
 * `people` must already exclude anyone the reader may not see.
 */
export async function Findings({
  heading,
  body,
  people,
  locale,
  sections,
  style,
}: {
  heading: React.ReactNode;
  body: string;
  people: Person[];
  locale: string;
  /** the other parts of the page, for the contents list */
  sections: { href: string; label: string }[];
  style?: React.CSSProperties;
}) {
  const t = await getTranslations("glance");
  const lang = locale === "es" ? "es" : "en";

  const years = people.flatMap((p) => yearOf(p.birthDate) ?? []);
  const surnames = [...new Set(people.map((p) => p.surnames.trim().split(/\s+/)[0]).filter(Boolean))];
  const suns = new Map<number, number>();
  for (const p of people) {
    const sun = computeChart(birthDataOf(p))?.placements[0];
    if (sun && !sun.uncertain) suns.set(sun.sign, (suns.get(sun.sign) ?? 0) + 1);
  }
  const signs = [...suns.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const withSun = signs.reduce((n, [, count]) => n + count, 0);
  const elements = ELEMENTS.map((key) => ({
    key,
    count: signs.filter(([sign]) => elementOfSign(sign) === key).reduce((n, [, count]) => n + count, 0),
  }));
  const stats: [string | number, string][] = [
    [people.length, t("people")],
    [Math.max(0, ...people.map((p) => p.path.length)) + 1, t("generations")],
    [years.length > 0 ? Math.min(...years) : "–", t("earliest")],
    [people.filter((p) => p.source === "research").length, t("found")],
  ];

  return (
    <section id="findings" className="reveal-late scroll-mt-6" style={style}>
      <div className="wrap-wide grid gap-x-12 gap-y-10 pt-16 pb-20 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[15rem_minmax(0,1fr)_21rem] 2xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
        <div className="self-start lg:col-span-2 xl:sticky xl:top-10 xl:col-span-1">
          {heading}
          <nav className="section-nav mt-7 hidden xl:block" aria-label={t("contents")}>
            <p className="eyebrow mb-2 px-3">{t("contents")}</p>
            {sections.map((s) => (
              <a key={s.href} href={s.href}>
                <span aria-hidden className="text-accent">
                  ✦
                </span>
                {s.label}
              </a>
            ))}
          </nav>
        </div>

        <Markdown>{body}</Markdown>

        <aside className="grid gap-4 self-start lg:sticky lg:top-10">
          <div className="card p-5">
            <h2 className="eyebrow mb-3">{t("title")}</h2>
            <dl className="grid grid-cols-2 gap-2">
              {stats.map(([value, label]) => (
                <div key={label} className="stat">
                  <dd className="display text-3xl">{value}</dd>
                  <dt className="mt-1 text-xs leading-snug text-ink-soft">{label}</dt>
                </div>
              ))}
            </dl>
            {surnames.length > 0 && (
              <>
                <h3 className="eyebrow mt-5 mb-2">{t("lines")}</h3>
                <p className="display text-xl leading-snug">{surnames.join(" · ")}</p>
              </>
            )}
          </div>

          {withSun > 0 && (
            <div className="card p-5">
              <h2 className="eyebrow">{t("suns")}</h2>
              <p className="mt-1 mb-3 text-xs text-ink-soft">{t("sunsLead")}</p>
              <ul className="flex flex-wrap gap-1.5">
                {signs.map(([sign, count]) => (
                  <li key={sign} className="flex items-center gap-1.5 rounded-full bg-paper-deep py-1 pr-3 pl-2.5 text-sm">
                    <span className="glyph text-lg leading-none" style={{ color: ELEMENT_TONE[elementOfSign(sign)] }}>
                      {SIGN_GLYPH[SIGNS[sign]]}
                    </span>
                    {SIGN_NAMES[SIGNS[sign]][lang]}
                    {count > 1 && <span className="font-mono text-xs text-ink-soft">×{count}</span>}
                  </li>
                ))}
              </ul>
              <h3 className="eyebrow mt-5 mb-2.5">{t("elements")}</h3>
              <ul className="grid gap-2">
                {elements.map(({ key, count }) => (
                  <li key={key} className="grid grid-cols-[4.5rem_1fr_1.25rem] items-center gap-2 text-sm">
                    <span>{ELEMENT_NAMES[key][lang]}</span>
                    <span className="meter">
                      <span style={{ width: `${(count / withSun) * 100}%`, background: ELEMENT_TONE[key] }} />
                    </span>
                    <span className="text-right font-mono text-xs text-ink-soft">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
