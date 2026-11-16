import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Article } from "@/components/Article";
import { CallToAction } from "@/components/CallToAction";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { BRAND } from "@/lib/brand";
import { page, questions } from "@/lib/content";
import { publicMeta } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const doc = page(locale, "faq");
  if (!doc) return {};
  return publicMeta({ locale, path: "/faq", title: `${doc.title} | ${BRAND}`, description: doc.description });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const doc = page(locale, "faq");
  if (!doc) notFound();
  const t = await getTranslations("mk");
  const list = questions(doc.body);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: locale,
          mainEntity: list.map((q) => ({ "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: q.answer } })),
        }}
      />
      <Article eyebrow={t("faq_eyebrow")} title={doc.title}>
        <div className="grid gap-2.5">
          {list.map((q) => (
            <details key={q.question} className="faq card px-6 py-4">
              <summary className="display cursor-pointer text-2xl">{q.question}</summary>
              <div className="mt-3">
                <Markdown>{q.answer}</Markdown>
              </div>
            </details>
          ))}
        </div>
      </Article>
      <CallToAction />
    </>
  );
}
