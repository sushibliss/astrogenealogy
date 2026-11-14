import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Findings } from "@/components/Findings";
import { ReportIndex } from "@/components/ReportIndex";
import { FamilyConstellation } from "@/components/FamilyConstellation";
import { PlacesMap } from "@/components/PlacesMap";
import { SkyHero } from "@/components/SkyHero";
import { SlowReveal } from "@/components/SlowReveal";
import { requestForToken } from "@/lib/access";
import { isPrivateForGuests } from "@/lib/people";
import { unveilSeconds } from "@/lib/tree-timing";

const later = (seconds: number) => ({ "--rd": `${seconds}s` }) as React.CSSProperties;

export default async function ReadPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const access = requestForToken(token);
  if (!access) notFound();
  const { people, publication } = access;
  const t = await getTranslations("read");
  const hiddenIds = new Set(people.filter(isPrivateForGuests).map((p) => p.id));
  const visible = people.filter((p) => !hiddenIds.has(p.id));
  const base = `/read/${token}`;
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  // living relatives stay off the map, as they do everywhere else for guests
  const map = await PlacesMap({ people: visible, locale });

  return (
    <SlowReveal after={unveilSeconds(people.map((p) => p.path))}>
      {/* the sky and the tree come first; everything else waits for them */}
      <SkyHero cue={{ label: t("readOn"), href: "#findings" }}>
        <FamilyConstellation people={people} locale={locale} base={base} hiddenIds={hiddenIds} token={token} />
      </SkyHero>

      <Findings
        style={later(0.3)}
        heading={
          <header>
            <p className="pill mb-4">{t("badge")}</p>
            <h1 className="display text-4xl sm:text-5xl xl:text-[2rem] xl:leading-[1.08] 2xl:text-4xl">{publication!.title}</h1>
            <p className="mt-4 text-sm text-ink-soft">{t("publishedOn", { date: fmt.format(publication!.publishedAt!) })}</p>
          </header>
        }
        body={publication!.body}
        people={visible}
        locale={locale}
        sections={[
          ...(map ? [{ href: "#places", label: t("map") }] : []),
          ...(visible.length > 0 ? [{ href: "#reports", label: t("reports") }] : []),
        ]}
      />

      {map && (
        <section id="places" className="reveal-late scroll-mt-10" style={later(0.6)}>
          <div className="wrap-wide pb-20">
            <h2 className="display text-4xl">{t("map")}</h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{t("mapLead")}</p>
            {map}
          </div>
        </section>
      )}

      {visible.length > 0 && (
        <section id="reports" className="reveal-late scroll-mt-10" style={later(0.9)}>
          <div className="wrap-wide">
            <div className="rounded-[2rem] bg-paper-deep px-5 py-10 sm:px-10">
              <h2 className="display text-4xl">{t("reports")}</h2>
              <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{t("reportsLead")}</p>
              <ReportIndex people={visible} locale={locale} base={base} />
            </div>
          </div>
        </section>
      )}
    </SlowReveal>
  );
}
