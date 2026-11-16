import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Article } from "@/components/Article";
import { Markdown } from "@/components/Markdown";
import { BRAND } from "@/lib/brand";
import { page } from "@/lib/content";
import { publicMeta } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const doc = page(locale, "privacy");
  if (!doc) return {};
  return publicMeta({ locale, path: "/privacy", title: `${doc.title} | ${BRAND}`, description: doc.description });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const doc = page(locale, "privacy");
  if (!doc) notFound();
  const t = await getTranslations("mk");
  return (
    <>
      <Article eyebrow={t("privacy_eyebrow")} title={doc.title} >
        <p className="notice mb-8">{t("privacyDraft")}</p>
        <Markdown>{doc.body}</Markdown>
      </Article>
    </>
  );
}
