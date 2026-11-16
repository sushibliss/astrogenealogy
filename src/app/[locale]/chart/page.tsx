import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CallToAction } from "@/components/CallToAction";
import { ChartTool } from "@/components/ChartTool";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { publicMeta, siteUrl } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "mk" });
  return publicMeta({ locale, path: "/chart", title: t("chartMetaTitle"), description: t("chartMetaDescription") });
}

export default async function ChartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("mk");
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: t("chartTitle"),
          url: `${siteUrl()}/${locale}/chart`,
          applicationCategory: "LifestyleApplication",
          operatingSystem: "Any",
          inLanguage: locale,
          offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
          publisher: { "@type": "Organization", name: BRAND },
        }}
      />
      <div className="wrap max-w-5xl pt-20">
        <p className="eyebrow mb-3">{t("chartEyebrow")}</p>
        <h1 className="display max-w-3xl text-4xl sm:text-6xl">{t("chartTitle")}</h1>
        <p className="mt-5 mb-8 max-w-2xl text-lg leading-relaxed text-ink-soft">{t("chartLead")}</p>
        <ChartTool
          labels={{
            date: t("chartDate"),
            time: t("chartTime"),
            timeHint: t("chartTimeHint"),
            submit: t("chartSubmit"),
            working: t("chartWorking"),
            errorDate: t("chartErrorDate"),
            private: t("chartPrivate"),
          }}
        >
          {/* shown under a finished chart: the step from one chart to a family of them */}
          <div className="card mt-10 grid items-center gap-5 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
            <div>
              <h2 className="display text-3xl">{t("chartNextTitle")}</h2>
              <p className="mt-2 max-w-xl text-ink-soft">{t("chartNextBody")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/register" className="btn">
                {t("ctaStart")}
              </Link>
              <Link href="/sample" className="btn-ghost">
                {t("ctaSample")}
              </Link>
            </div>
          </div>
        </ChartTool>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {([1, 2, 3] as const).map((n) => (
            <div key={n}>
              <h2 className="display text-2xl">{t(`chartWhy${n}Title`)}</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{t(`chartWhy${n}Body`)}</p>
            </div>
          ))}
        </div>
      </div>
      <CallToAction hide="chart" />
    </>
  );
}
