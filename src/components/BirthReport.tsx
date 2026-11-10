import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Person } from "@/db/schema";
import {
  BODIES,
  ELEMENTS,
  MODALITIES,
  SIGNS,
  chartEligibility,
  computeChart,
  formatDegree,
  signOf,
  type Placement,
} from "@/lib/astro/chart";
import { ASPECT_GLYPH, BODY_GLYPH, SIGN_GLYPH } from "@/lib/astro/glyphs";
import {
  ASPECT_NAMES,
  BODY_NAMES,
  DOMAIN,
  ELEMENT_NAMES,
  ELEMENT_TEXT,
  MANNER,
  MODALITY_NAMES,
  MODALITY_TEXT,
  MOON,
  RISING,
  SIGN_NAMES,
  SUN,
  YEARS_PER_SIGN,
  aspectText,
} from "@/lib/astro/readings";
import { documentHref, documentsByPerson } from "@/lib/documents";
import { birthDataOf, formatPartialDate, fullName, relationLabel } from "@/lib/people";
import { Tree } from "./Tree";
import { Wheel } from "./Wheel";

export type ReportContext = {
  /** "/requests/<id>" or "/read/<token>" */
  base: string;
  canEdit: boolean;
  /** everyone in the tree */
  people: Person[];
  /** people whose details the viewer may not see */
  hiddenIds: Set<string>;
  /** invite token, when a guest is reading */
  token?: string;
};

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_1.5rem] items-center gap-3">
      <span className="text-sm font-medium">{label}</span>
      <span className="h-3 border border-ink bg-paper-light">
        <span className="block h-full bg-accent" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </span>
      <span className="text-right font-mono text-xs">{value}</span>
    </div>
  );
}

export async function BirthReport({ person, locale, ctx }: { person: Person; locale: string; ctx: ReportContext }) {
  const t = await getTranslations("report");
  const tTree = await getTranslations("tree");
  const tDocs = await getTranslations("docs");
  const sources = documentsByPerson(person.requestId).get(person.id) ?? [];
  const lang = locale === "es" ? "es" : "en";
  const name = fullName(person) || t("unknownName");
  const birth = birthDataOf(person);
  const elig = chartEligibility(birth);
  const chart = computeChart(birth);

  const visible = ctx.people.filter((p) => !ctx.hiddenIds.has(p.id));
  const index = visible.findIndex((p) => p.id === person.id);
  const prev = index > 0 ? visible[index - 1] : null;
  const next = index >= 0 && index < visible.length - 1 ? visible[index + 1] : null;
  const personHref = (p: Person) => `${ctx.base}/people/${p.id}`;
  const comparable = visible.filter((p) => p.id !== person.id && chartEligibility(birthDataOf(p)).ok);

  const signName = (i: number) => SIGN_NAMES[SIGNS[i]][lang];
  const byBody = Object.fromEntries((chart?.placements ?? []).map((p) => [p.body, p])) as Record<string, Placement>;
  const sun = byBody.sun;
  const moon = byBody.moon;

  const elementMax = chart ? Math.max(...Object.values(chart.elements)) : 0;
  const modalityMax = chart ? Math.max(...Object.values(chart.modalities)) : 0;
  const topElements = chart ? ELEMENTS.filter((e) => chart.elements[e] === elementMax) : [];
  const topModalities = chart ? MODALITIES.filter((m) => chart.modalities[m] === modalityMax) : [];

  const facts = [
    person.birthDate ? formatPartialDate(person.birthDate, locale) : t("dateUnknown"),
    person.birthTime ?? t("hourUnknown"),
    person.birthPlace || t("placeUnknown"),
  ];

  return (
    <article>
      {/* navigation between ancestors */}
      <div className="no-print border-b border-ink">
        <div className="wrap flex items-center justify-between gap-4 py-2.5 text-sm">
          <Link href={ctx.base} className="link">
            ← {t("backToRequest")}
          </Link>
          <div className="flex gap-4 font-medium">
            {prev ? (
              <Link href={personHref(prev)} className="hover:underline underline-offset-4" rel="prev">
                ← <span className="hidden sm:inline">{fullName(prev) || relationLabel(prev.path, locale)}</span>
              </Link>
            ) : null}
            {next ? (
              <Link href={personHref(next)} className="hover:underline underline-offset-4" rel="next">
                <span className="hidden sm:inline">{fullName(next) || relationLabel(next.path, locale)}</span> →
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* title */}
      <header className="wrap pt-10 pb-8 sm:pt-14">
        <p className="eyebrow mb-3">
          {t("eyebrow")} · {relationLabel(person.path, locale)}
        </p>
        <h1 className="display text-5xl sm:text-7xl">{name}</h1>
        <dl className="mt-6 grid max-w-3xl grid-cols-1 border-y border-ink sm:grid-cols-3 sm:divide-x sm:divide-ink">
          {[t("born"), t("hour"), t("place")].map((label, i) => (
            <div key={label} className="border-b border-hair py-3 last:border-b-0 sm:border-b-0 sm:px-4 sm:first:pl-0">
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-0.5 font-medium">{facts[i]}</dd>
            </div>
          ))}
        </dl>
        {person.deathDate && (
          <p className="mt-3 text-sm text-ink-soft">
            {t("died")} {formatPartialDate(person.deathDate, locale)}
            {person.deathPlace ? `, ${person.deathPlace}` : ""}
          </p>
        )}
        {ctx.canEdit && (
          <p className="no-print mt-4">
            <Link href={`${personHref(person)}/edit`} className="btn-ghost btn-sm">
              {t("edit")}
            </Link>
          </p>
        )}
      </header>

      {!chart || !elig.ok ? (
        <section className="wrap pb-10">
          <div className="card max-w-2xl p-6 sm:p-8">
            <p className="glyph mb-3 text-4xl leading-none" aria-hidden>
              ☉
            </p>
            <h2 className="display text-2xl">{t("noChartTitle")}</h2>
            <p className="mt-3 text-ink-soft">{t(`noChart_${elig.ok ? "no_date" : elig.reason}`)}</p>
            {ctx.canEdit && (
              <Link href={`${personHref(person)}/edit`} className="btn mt-5">
                {t("addBirthData")}
              </Link>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* wheel + signature */}
          <section className="wrap grid items-start gap-10 pb-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div>
              <Wheel chart={chart} title={t("wheelTitle", { name })} className="mx-auto w-full max-w-[36rem]" />
              <p className="mt-3 text-center font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-soft">
                {chart.timeKnown ? (chart.hasAngles ? t("captionFull") : t("captionNoPlace")) : t("captionNoon")}
              </p>
            </div>

            <div className="grid gap-4">
              {(
                [
                  ["sun", sun, t("sunRole")],
                  ["moon", moon, t("moonRole")],
                ] as const
              ).map(([key, p, role]) => (
                <div key={key} className="card grid grid-cols-[4rem_1fr] items-center gap-4 p-4">
                  <span className="glyph text-center text-5xl leading-none text-accent" aria-hidden>
                    {BODY_GLYPH[key]}
                  </span>
                  <div>
                    <p className="eyebrow">{role}</p>
                    <p className="display text-3xl">
                      {signName(p.sign)}
                      {p.uncertain && p.altSign != null && (
                        <span className="text-ink-faint">
                          {" "}
                          {t("or")} {signName(p.altSign)}
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-xs text-ink-soft">
                      {BODY_NAMES[key][lang]} · {p.uncertain ? t("signChanges") : formatDegree(p.deg)}
                    </p>
                  </div>
                </div>
              ))}
              <div className={`card grid grid-cols-[4rem_1fr] items-center gap-4 p-4 ${chart.hasAngles ? "" : "border-dashed"}`}>
                <span className="text-center font-mono text-sm font-semibold" aria-hidden>
                  ASC
                </span>
                <div>
                  <p className="eyebrow">{t("risingRole")}</p>
                  {chart.hasAngles && chart.asc != null ? (
                    <>
                      <p className="display text-3xl">{signName(signOf(chart.asc))}</p>
                      <p className="font-mono text-xs text-ink-soft">
                        {t("ascendant")} · {formatDegree(chart.asc % 30)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="display text-3xl text-ink-faint">{t("risingUnknown")}</p>
                      <p className="text-xs text-ink-soft">{chart.timeKnown ? t("risingNeedsPlace") : t("risingNeedsHour")}</p>
                    </>
                  )}
                </div>
              </div>

              {!chart.timeKnown && <p className="notice">{t("noonNotice")}</p>}
              {chart.timeKnown && chart.assumedUtc && <p className="notice">{t("utcNotice")}</p>}
            </div>
          </section>

          {/* readings */}
          <section className="border-t border-ink">
            <div className="wrap grid gap-x-12 gap-y-8 py-12 lg:grid-cols-[14rem_1fr]">
              <h2 className="display text-3xl">{t("readingTitle")}</h2>
              <div className="grid max-w-[68ch] gap-8 text-[1.0625rem] leading-[1.65]">
                <div>
                  <h3 className="mb-1.5 flex items-baseline gap-2 font-bold">
                    <span className="glyph" aria-hidden>
                      {BODY_GLYPH.sun}
                    </span>
                    {t("placementIn", { body: BODY_NAMES.sun[lang], sign: signName(sun.sign) })}
                  </h3>
                  <p>{SUN[SIGNS[sun.sign]][lang]}</p>
                  {sun.uncertain && sun.altSign != null && (
                    <p className="mt-3 border-l-2 border-ink pl-4 text-[0.9375rem] text-ink-soft">
                      {t("cuspNote", { sign: signName(sun.altSign) })} {SUN[SIGNS[sun.altSign]][lang]}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="mb-1.5 flex items-baseline gap-2 font-bold">
                    <span className="glyph" aria-hidden>
                      {BODY_GLYPH.moon}
                    </span>
                    {t("placementIn", { body: BODY_NAMES.moon[lang], sign: signName(moon.sign) })}
                  </h3>
                  <p>{MOON[SIGNS[moon.sign]][lang]}</p>
                  {moon.uncertain && moon.altSign != null && (
                    <p className="mt-3 border-l-2 border-ink pl-4 text-[0.9375rem] text-ink-soft">
                      {t("cuspNote", { sign: signName(moon.altSign) })} {MOON[SIGNS[moon.altSign]][lang]}
                    </p>
                  )}
                </div>
                {chart.hasAngles && chart.asc != null && (
                  <div>
                    <h3 className="mb-1.5 font-bold">
                      {t("placementIn", { body: t("ascendant"), sign: signName(signOf(chart.asc)) })}
                    </h3>
                    <p>{RISING[SIGNS[signOf(chart.asc)]][lang]}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* placements */}
          <section className="border-t border-ink">
            <div className="wrap grid gap-x-12 gap-y-6 py-12 lg:grid-cols-[14rem_1fr]">
              <div>
                <h2 className="display text-3xl">{t("placementsTitle")}</h2>
                <p className="mt-2 text-sm text-ink-soft">{t("placementsLead")}</p>
              </div>
              <ul className="border-t border-ink">
                {BODIES.map((body) => {
                  const p = byBody[body];
                  const years = YEARS_PER_SIGN[body];
                  return (
                    <li
                      key={body}
                      className="grid grid-cols-[2.25rem_1fr] gap-x-3 border-b border-hair py-3 sm:grid-cols-[2.25rem_6.5rem_13.5rem_1fr] sm:items-baseline"
                    >
                      <span className="glyph row-span-3 text-2xl leading-none sm:row-span-1" aria-hidden>
                        {BODY_GLYPH[body]}
                      </span>
                      <span className="font-bold">{BODY_NAMES[body][lang]}</span>
                      <span className="font-mono text-sm">
                        <span className="glyph" aria-hidden>
                          {SIGN_GLYPH[SIGNS[p.sign]]}
                        </span>{" "}
                        {signName(p.sign)} {p.uncertain ? "?" : formatDegree(p.deg)}
                        {p.retrograde && <abbr title={t("retrograde")}> ℞</abbr>}
                        {p.house && (
                          <span className="text-ink-soft">
                            {" "}
                            · {t("house")} {p.house}
                          </span>
                        )}
                      </span>
                      <span className="text-[0.9375rem] text-ink-soft">
                        {body === "sun" || body === "moon" ? (
                          t(body === "sun" ? "seeSun" : "seeMoon")
                        ) : (
                          <>
                            {DOMAIN[body][lang]}: {MANNER[SIGNS[p.sign]][lang]}.
                            {years && years >= 7 && <> {t("generational", { years })}</>}
                          </>
                        )}
                        {p.uncertain && p.altSign != null && body !== "sun" && body !== "moon" && (
                          <> {t("mayBe", { sign: signName(p.altSign) })}</>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* balance */}
          <section className="border-t border-ink">
            <div className="wrap grid gap-x-12 gap-y-6 py-12 lg:grid-cols-[14rem_1fr]">
              <h2 className="display text-3xl">{t("balanceTitle")}</h2>
              <div className="grid gap-10 md:grid-cols-2">
                <div>
                  <p className="eyebrow mb-3">{t("elements")}</p>
                  <div className="grid gap-2">
                    {ELEMENTS.map((e) => (
                      <Bar key={e} label={ELEMENT_NAMES[e][lang]} value={chart.elements[e]} max={elementMax} />
                    ))}
                  </div>
                  {topElements.length === 1 && <p className="mt-4 text-[0.9375rem]">{ELEMENT_TEXT[topElements[0]][lang]}</p>}
                </div>
                <div>
                  <p className="eyebrow mb-3">{t("modalities")}</p>
                  <div className="grid gap-2">
                    {MODALITIES.map((m) => (
                      <Bar key={m} label={MODALITY_NAMES[m][lang]} value={chart.modalities[m]} max={modalityMax} />
                    ))}
                  </div>
                  {topModalities.length === 1 && (
                    <p className="mt-4 text-[0.9375rem]">{MODALITY_TEXT[topModalities[0]][lang]}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* aspects */}
          <section className="border-t border-ink">
            <div className="wrap grid gap-x-12 gap-y-6 py-12 lg:grid-cols-[14rem_1fr]">
              <div>
                <h2 className="display text-3xl">{t("aspectsTitle")}</h2>
                <p className="mt-2 text-sm text-ink-soft">{chart.timeKnown ? t("aspectsLead") : t("aspectsLeadNoMoon")}</p>
              </div>
              {chart.aspects.length === 0 ? (
                <p className="text-ink-soft">{t("noAspects")}</p>
              ) : (
                <ul className="border-t border-ink">
                  {chart.aspects.slice(0, 10).map((a) => (
                    <li
                      key={`${a.a}-${a.b}`}
                      className="grid gap-x-4 gap-y-1 border-b border-hair py-3 sm:grid-cols-[6.5rem_13.5rem_1fr] sm:items-baseline"
                    >
                      <span className="glyph text-xl leading-none" aria-hidden>
                        {BODY_GLYPH[a.a]} {ASPECT_GLYPH[a.type]} {BODY_GLYPH[a.b]}
                      </span>
                      <span className="font-mono text-xs uppercase tracking-[0.08em]">
                        {ASPECT_NAMES[a.type][lang]} · {t("orb")} {a.orb.toFixed(1)}°
                      </span>
                      <span className="text-[0.9375rem]">{aspectText(a.a, a.b, a.type, lang)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* synastry */}
          {comparable.length > 0 && (
            <section className="no-print border-t border-ink">
              <div className="wrap grid gap-x-12 gap-y-6 py-12 lg:grid-cols-[14rem_1fr]">
                <div>
                  <h2 className="display text-3xl">{t("compareTitle")}</h2>
                  <p className="mt-2 text-sm text-ink-soft">{t("compareLead")}</p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {comparable.map((p) => (
                    <li key={p.id}>
                      <Link href={`${ctx.base}/synastry?a=${person.id}&b=${p.id}`} className="btn-ghost btn-sm">
                        {fullName(p) || relationLabel(p.path, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}

      {sources.length > 0 && (
        <section className="border-t border-ink">
          <div className="wrap grid gap-x-12 gap-y-6 py-12 lg:grid-cols-[14rem_1fr]">
            <div>
              <h2 className="display text-3xl">{tDocs("sectionTitle")}</h2>
              <p className="mt-2 text-sm text-ink-soft">{tDocs("sectionLead")}</p>
            </div>
            <ul className="grid max-w-2xl gap-2 self-start">
              {sources.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={documentHref(doc, ctx.token)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fade-colors flex items-center gap-3 border border-ink bg-paper-light px-4 py-3 hover:border-accent hover:text-accent"
                  >
                    <span className="shrink-0 border border-current px-1 font-mono text-[0.625rem] uppercase tracking-[0.1em]">
                      {doc.kind === "file" ? tTree("pdf") : tTree("link")}
                    </span>
                    <span className="min-w-0 flex-1">{doc.title}</span>
                    <span aria-hidden>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* lineage navigator */}
      <section className="no-print border-t border-ink bg-paper-deep">
        <div className="wrap py-10">
          <h2 className="eyebrow mb-4">{t("lineage")}</h2>
          <Tree
            compact
            people={ctx.people}
            locale={locale}
            currentId={person.id}
            hiddenIds={ctx.hiddenIds}
            hrefFor={personHref}
            labels={{
              unknown: tTree("unknown"),
              living: tTree("living"),
              deeper: tTree("deeper"),
              research: tTree("research"),
            }}
          />
        </div>
      </section>

      <div className="wrap pt-8">
        <p className="max-w-3xl font-mono text-[0.6875rem] leading-relaxed text-ink-soft">{t("method")}</p>
      </div>
    </article>
  );
}
