import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Person } from "@/db/schema";
import { SIGNS, computeChart, computeSynastry, formatDegree } from "@/lib/astro/chart";
import { ASPECT_GLYPH, BODY_GLYPH, SIGN_GLYPH } from "@/lib/astro/glyphs";
import { ASPECT_NAMES, SIGN_NAMES, SYNASTRY_TONE, synastryText } from "@/lib/astro/readings";
import { birthDataOf, fullName, relationLabel } from "@/lib/people";

export async function SynastryView({ a, b, locale, base }: { a: Person; b: Person; locale: string; base: string }) {
  const t = await getTranslations("synastry");
  const lang = locale === "es" ? "es" : "en";
  const chartA = computeChart(birthDataOf(a));
  const chartB = computeChart(birthDataOf(b));
  const nameA = fullName(a) || relationLabel(a.path, locale);
  const nameB = fullName(b) || relationLabel(b.path, locale);
  const shortA = a.givenNames || nameA;
  const shortB = b.givenNames || nameB;

  if (!chartA || !chartB) {
    return (
      <div className="wrap py-14">
        <p className="notice max-w-xl">{t("unavailable")}</p>
      </div>
    );
  }
  const syn = computeSynastry(chartA, chartB);
  const total = syn.harmony + syn.tension;
  const easePct = total ? Math.round((syn.harmony / total) * 100) : 50;
  const anyUnknown = !chartA.timeKnown || !chartB.timeKnown;

  return (
    <article>
      <div className="no-print border-b border-hair">
        <div className="wrap flex flex-wrap gap-x-6 gap-y-1 py-2.5 text-sm">
          <Link href={`${base}/people/${a.id}`} className="link">
            ← {nameA}
          </Link>
          <Link href={`${base}/people/${b.id}`} className="link">
            ← {nameB}
          </Link>
        </div>
      </div>
      <header className="wrap pt-10 pb-8 sm:pt-14">
        <p className="eyebrow mb-3">{t("eyebrow")}</p>
        <h1 className="display text-4xl sm:text-6xl">
          {nameA} <span className="text-ink-faint">×</span> {nameB}
        </h1>
        <p className="mt-3 text-ink-soft">
          {relationLabel(a.path, locale)} · {relationLabel(b.path, locale)}
        </p>
      </header>

      <section className="wrap grid gap-10 pb-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="eyebrow mb-2">{t("toneLabel")}</p>
          <p className="display text-3xl">{t(`tone_${syn.tone}`)}</p>
          <div className="mt-5">
            <div className="flex h-4 overflow-hidden rounded-full border border-hair bg-paper-light" role="img" aria-label={t("easeBar", { pct: easePct })}>
              <span className="block h-full bg-accent" style={{ width: `${easePct}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-soft">
              <span>
                {t("ease")} {easePct}%
              </span>
              <span>
                {t("friction")} {100 - easePct}%
              </span>
            </div>
          </div>
          <p className="mt-6 max-w-[60ch] text-[1.0625rem] leading-[1.65]">{SYNASTRY_TONE[syn.tone][lang]}</p>
          {anyUnknown && <p className="notice mt-6">{t("noMoonNotice")}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 self-start">
          {(
            [
              [shortA, chartA],
              [shortB, chartB],
            ] as const
          ).map(([label, chart], i) => (
            <div key={i} className="card p-4">
              <p className="eyebrow mb-2 truncate">{label}</p>
              <ul className="grid gap-1 font-mono text-xs">
                {chart.placements.slice(0, 7).map((p) => (
                  <li key={p.body} className="flex gap-2">
                    <span className="glyph w-4 text-center" aria-hidden>
                      {BODY_GLYPH[p.body]}
                    </span>
                    <span className="glyph" aria-hidden>
                      {SIGN_GLYPH[SIGNS[p.sign]]}
                    </span>
                    <span className="truncate">
                      {SIGN_NAMES[SIGNS[p.sign]][lang]} {p.uncertain ? "?" : formatDegree(p.deg)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-hair">
        <div className="wrap grid gap-x-12 gap-y-6 py-12 lg:grid-cols-[14rem_1fr]">
          <div>
            <h2 className="display text-3xl">{t("contactsTitle")}</h2>
            <p className="mt-2 text-sm text-ink-soft">{t("contactsLead", { a: shortA, b: shortB })}</p>
          </div>
          {syn.aspects.length === 0 ? (
            <p className="text-ink-soft">{t("none")}</p>
          ) : (
            <ul className="border-t border-hair">
              {syn.aspects.slice(0, 12).map((x, i) => (
                <li
                  key={i}
                  className="grid gap-x-4 gap-y-1 border-b border-hair py-3 sm:grid-cols-[6.5rem_13.5rem_1fr] sm:items-baseline"
                >
                  <span className="glyph text-xl leading-none" aria-hidden>
                    {BODY_GLYPH[x.a]} {ASPECT_GLYPH[x.type]} {BODY_GLYPH[x.b]}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.08em]">
                    {ASPECT_NAMES[x.type][lang]} · {x.orb.toFixed(1)}°
                  </span>
                  <span className="text-[0.9375rem]">{synastryText(shortA, x.a, shortB, x.b, x.type, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </article>
  );
}
