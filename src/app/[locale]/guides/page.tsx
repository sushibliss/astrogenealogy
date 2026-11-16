import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Article } from "@/components/Article";
import { CallToAction } from "@/components/CallToAction";
import { guides } from "@/lib/content";
import { publicMeta } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "mk" });
  return publicMeta({ locale, path: "/guides", title: t("guidesMetaTitle"), description: t("guidesLead") });
}

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("mk");
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
  return (
    <>
      <Article eyebrow={t("guidesEyebrow")} title={t("guidesTitle")} lead={t("guidesLead")}>
        <ul className="grid gap-3">
          {guides(locale).map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`} className="soft-card block px-6 py-5 hover:border-accent-2">
                <span className="eyebrow">{g.date && fmt.format(new Date(g.date))}</span>
                <span className="display mt-1 block text-2xl sm:text-3xl">{g.title}</span>
                <span className="mt-2 block text-sm leading-relaxed text-ink-soft">{g.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Article>
      <CallToAction />
    </>
  );
}
