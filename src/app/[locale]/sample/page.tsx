import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CallToAction } from "@/components/CallToAction";
import { FamilyConstellation } from "@/components/FamilyConstellation";
import { Findings } from "@/components/Findings";
import { PlacesMap } from "@/components/PlacesMap";
import { ReportIndex } from "@/components/ReportIndex";
import { SkyHero } from "@/components/SkyHero";
import { SlowReveal } from "@/components/SlowReveal";
import { SAMPLE_BODY, SAMPLE_TITLE, samplePeople } from "@/lib/sample";
import { publicMeta } from "@/lib/site";
import { unveilSeconds } from "@/lib/tree-timing";

const later = (seconds: number) => ({ "--rd": `${seconds}s` }) as React.CSSProperties;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "mk" });
  return publicMeta({ locale, path: "/sample", title: t("sampleMetaTitle"), description: t("sampleMetaDescription") });
}

/** A complete published request, built from an invented family, open to everyone. */
export default async function SamplePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("mk");
  const tr = await getTranslations("read");
  const people = samplePeople;
  const map = await PlacesMap({ people, locale });
  return (
    <SlowReveal after={unveilSeconds(people.map((p) => p.path))}>
      <SkyHero cue={{ label: tr("readOn"), href: "#findings" }}>
        <FamilyConstellation people={people} locale={locale} base="/sample" />
      </SkyHero>

      <Findings
        style={later(0.3)}
        heading={
          <header>
            <p className="pill mb-4">{t("sampleBadge")}</p>
            <h1 className="display text-4xl sm:text-5xl xl:text-[2rem] xl:leading-[1.08] 2xl:text-4xl">{SAMPLE_TITLE[locale === "es" ? "es" : "en"]}</h1>
            <p className="mt-4 text-sm text-ink-soft">{t("sampleNote")}</p>
            <Link href="/register" className="btn mt-5">
              {t("ctaStart")}
            </Link>
          </header>
        }
        body={SAMPLE_BODY}
        people={people}
        locale={locale}
        sections={[...(map ? [{ href: "#places", label: tr("map") }] : []), { href: "#reports", label: tr("reports") }]}
      />

      {map && (
        <section id="places" className="reveal-late scroll-mt-10" style={later(0.6)}>
          <div className="wrap-wide pb-20">
            <h2 className="display text-4xl">{tr("map")}</h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{tr("mapLead")}</p>
            {map}
          </div>
        </section>
      )}

      <section id="reports" className="reveal-late scroll-mt-10" style={later(0.9)}>
        <div className="wrap-wide">
          <div className="rounded-[2rem] bg-paper-deep px-5 py-10 sm:px-10">
            <h2 className="display text-4xl">{tr("reports")}</h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{tr("reportsLead")}</p>
            <ReportIndex people={people} locale={locale} base="/sample" />
          </div>
        </div>
      </section>

      <div className="reveal-late" style={later(1.1)}>
        <CallToAction hide="sample" />
      </div>
    </SlowReveal>
  );
}
