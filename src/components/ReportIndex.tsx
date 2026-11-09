import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Person } from "@/db/schema";
import { SIGNS, computeChart } from "@/lib/astro/chart";
import { BODY_GLYPH, SIGN_GLYPH } from "@/lib/astro/glyphs";
import { SIGN_NAMES } from "@/lib/astro/readings";
import { birthDataOf, fullName, lifespan, relationLabel } from "@/lib/people";

/** Gallery of birth reports: one card per visible person. */
export async function ReportIndex({ people, locale, base }: { people: Person[]; locale: string; base: string }) {
  const t = await getTranslations("reports");
  const lang = locale === "es" ? "es" : "en";
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((p) => {
        const chart = computeChart(birthDataOf(p));
        const sun = chart?.placements[0];
        const moon = chart?.placements[1];
        return (
          <li key={p.id}>
            <Link
              href={`${base}/people/${p.id}`}
              className="card group grid h-full grid-cols-[3.25rem_1fr] items-center gap-3 p-3.5 transition-colors hover:bg-ink hover:text-paper"
            >
              <span
                className={`glyph grid h-13 w-13 place-items-center border border-current text-3xl leading-none ${chart ? "" : "border-dashed opacity-50"}`}
                aria-hidden
              >
                {sun ? SIGN_GLYPH[SIGNS[sun.sign]] : "·"}
              </span>
              <span className="min-w-0">
                <span className="eyebrow block truncate !text-[0.625rem] group-hover:!text-paper">
                  {relationLabel(p.path, locale).replace(/ \(.*\)$/, "")}
                </span>
                <span className="block truncate font-bold leading-tight">{fullName(p) || t("unknown")}</span>
                <span className="block truncate font-mono text-[0.6875rem] opacity-70">
                  {sun && moon ? (
                    <>
                      <span className="glyph">{BODY_GLYPH.sun}</span> {SIGN_NAMES[SIGNS[sun.sign]][lang]}
                      {!moon.uncertain && (
                        <>
                          {" · "}
                          <span className="glyph">{BODY_GLYPH.moon}</span> {SIGN_NAMES[SIGNS[moon.sign]][lang]}
                        </>
                      )}
                    </>
                  ) : (
                    t("needsDate")
                  )}
                  {lifespan(p) && ` · ${lifespan(p)}`}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
