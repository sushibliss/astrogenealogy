import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Article } from "@/components/Article";
import { CallToAction } from "@/components/CallToAction";
import { Markdown } from "@/components/Markdown";
import { BRAND } from "@/lib/brand";
import { page } from "@/lib/content";
import { publicMeta } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const doc = page(locale, "how-it-works");
  if (!doc) return {};
  return publicMeta({ locale, path: "/how-it-works", title: `${doc.title} | ${BRAND}`, description: doc.description });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const doc = page(locale, "how-it-works");
  if (!doc) notFound();
  const t = await getTranslations("mk");
  return (
    <>
      <Article eyebrow={t("how_it_works_eyebrow")} title={doc.title} lead={doc.description}>
        <Markdown>{doc.body}</Markdown>
      </Article>
      <CallToAction />
    </>
  );
}
