import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { Article } from "@/components/Article";
import { CallToAction } from "@/components/CallToAction";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { BRAND } from "@/lib/brand";
import { guide, guideByKey, guides } from "@/lib/content";
import { LOCALES, publicMeta, siteUrl } from "@/lib/site";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const doc = guide(locale, slug);
  if (!doc) return {};
  const path = Object.fromEntries(
    LOCALES.map((l) => {
      const other = l === locale ? doc : guideByKey(l, doc.key);
      return [l, other ? `/guides/${other.slug}` : undefined];
    }),
  );
  return publicMeta({ locale, path, title: `${doc.title} | ${BRAND}`, description: doc.description, article: { published: doc.date } });
}

export default async function GuidePage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const doc = guide(locale, slug);
  if (!doc) {
    // The language switch keeps the address: send a guide's other-language address to its translation.
    for (const l of LOCALES) {
      const other = l !== locale ? guide(l, slug) : null;
      const here = other && guideByKey(locale, other.key);
      if (here) redirect({ href: `/guides/${here.slug}`, locale });
    }
    notFound();
  }
  const t = await getTranslations("mk");
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
  const more = guides(locale).filter((g) => g.slug !== doc.slug).slice(0, 3);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: doc.title,
          description: doc.description,
          datePublished: doc.date,
          inLanguage: locale,
          mainEntityOfPage: `${siteUrl()}/${locale}/guides/${doc.slug}`,
          author: { "@type": "Organization", name: BRAND },
          publisher: { "@type": "Organization", name: BRAND },
        }}
      />
      <Article
        eyebrow={
          <>
            <Link href="/guides" className="link">
              {t("guidesTitle")}
            </Link>
            {doc.date && ` · ${fmt.format(new Date(doc.date))}`}
          </>
        }
        title={doc.title}
        lead={doc.description}
      >
        <Markdown>{doc.body}</Markdown>
        {more.length > 0 && (
          <aside className="mt-14 border-t border-hair pt-8">
            <h2 className="eyebrow mb-3">{t("guidesMore")}</h2>
            <ul className="grid gap-2">
              {more.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="link display text-xl">
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </Article>
      <CallToAction />
    </>
  );
}
