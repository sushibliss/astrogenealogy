import { getTranslations } from "next-intl/server";
import type { Person } from "@/db/schema";
import { SIGNS, computeChart, elementOfSign } from "@/lib/astro/chart";
import { BODY_GLYPH, SIGN_GLYPH } from "@/lib/astro/glyphs";
import { ELEMENT_NAMES, MOON, SIGN_NAMES, SUN } from "@/lib/astro/readings";
import { documentHref, documentsByPerson } from "@/lib/documents";
import { birthDataOf, formatPartialDate, fullName, lifespan, relationLabel } from "@/lib/people";
import { ConstellationChart, type TreeLabels, type TreePerson } from "./ConstellationChart";

/**
 * Prepares everything the interactive family chart needs (names, charts,
 * readings, source documents) on the server, so no birth maths ships to the browser.
 */
export async function FamilyConstellation({
  people,
  locale,
  base,
  hiddenIds,
  token,
}: {
  people: Person[];
  locale: string;
  /** "/requests/<id>" or "/read/<token>" */
  base: string;
  hiddenIds?: Set<string>;
  /** invite token, when a guest is reading */
  token?: string;
}) {
  const t = await getTranslations("tree");
  const lang = locale === "es" ? "es" : "en";
  const docs = people[0] ? documentsByPerson(people[0].requestId) : new Map();

  const data: TreePerson[] = people.map((p) => {
    const hidden = hiddenIds?.has(p.id) ?? false;
    const relation = relationLabel(p.path, locale);
    const base_ = {
      id: p.id,
      path: p.path,
      hidden,
      found: p.source === "research",
      relation,
      relationShort: relation.replace(/ \(.*\)$/, ""),
    };
    if (hidden) {
      return { ...base_, name: t("living"), years: "", born: "", died: "", notes: "", href: "", hourKnown: false, sun: null, moon: null, element: "", docs: [] };
    }
    const chart = computeChart(birthDataOf(p));
    const sun = chart?.placements[0];
    const moon = chart?.placements[1];
    return {
      ...base_,
      name: fullName(p) || t("unknown"),
      years: lifespan(p),
      born: [formatPartialDate(p.birthDate, locale), p.birthTime, p.birthPlace].filter(Boolean).join(" · "),
      died: p.living === "alive" ? "" : [formatPartialDate(p.deathDate, locale), p.deathPlace].filter(Boolean).join(" · "),
      notes: p.notes,
      href: `${base}/people/${p.id}`,
      hourKnown: !!chart?.timeKnown,
      sun:
        sun && !sun.uncertain
          ? { sign: sun.sign, lon: sun.lon, name: SIGN_NAMES[SIGNS[sun.sign]][lang], glyph: SIGN_GLYPH[SIGNS[sun.sign]], text: SUN[SIGNS[sun.sign]][lang] }
          : null,
      moon:
        moon && !moon.uncertain
          ? { name: SIGN_NAMES[SIGNS[moon.sign]][lang], glyph: SIGN_GLYPH[SIGNS[moon.sign]], text: MOON[SIGNS[moon.sign]][lang] }
          : null,
      element: sun && !sun.uncertain ? ELEMENT_NAMES[elementOfSign(sun.sign)][lang] : "",
      docs: (docs.get(p.id) ?? []).map((d: Parameters<typeof documentHref>[0]) => ({
        id: d.id,
        title: d.title,
        kind: d.kind,
        href: documentHref(d, token),
      })),
    };
  });

  const labels: TreeLabels = {
    title: t("title"),
    deeper: t("deeper"),
    legendIntake: t("legendIntake"),
    legendResearch: t("legendResearch"),
    legendUnknown: t("legendUnknown"),
    legendKin: t("legendKin"),
    legendSun: t("legendSun"),
    hint: t("hint"),
    close: t("close"),
    born: t("born"),
    died: t("died"),
    sun: t("sun"),
    moon: t("moon"),
    element: t("element"),
    noChart: t("noChart"),
    hourUnknown: t("hourUnknown"),
    notes: t("notes"),
    documents: t("documents"),
    noDocuments: t("noDocuments"),
    pdf: t("pdf"),
    link: t("link"),
    openReport: t("openReport"),
    foundBadge: t("research"),
    sunGlyph: BODY_GLYPH.sun,
    moonGlyph: BODY_GLYPH.moon,
  };

  return (
    <ConstellationChart
      people={data}
      labels={labels}
      zodiac={SIGNS.map((s) => ({ glyph: SIGN_GLYPH[s], name: SIGN_NAMES[s][lang] }))}
    />
  );
}
