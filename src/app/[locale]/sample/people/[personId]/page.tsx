import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BirthReport } from "@/components/BirthReport";
import { CallToAction } from "@/components/CallToAction";
import { fullName } from "@/lib/people";
import { samplePeople } from "@/lib/sample";
import { publicMeta } from "@/lib/site";

type Params = Promise<{ locale: string; personId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, personId } = await params;
  const person = samplePeople.find((p) => p.id === personId);
  if (!person) return {};
  const t = await getTranslations({ locale, namespace: "mk" });
  return publicMeta({
    locale,
    path: `/sample/people/${personId}`,
    title: t("samplePersonMetaTitle", { name: fullName(person) }),
    description: t("sampleMetaDescription"),
  });
}

export default async function SamplePersonPage({ params }: { params: Params }) {
  const { locale, personId } = await params;
  setRequestLocale(locale);
  const person = samplePeople.find((p) => p.id === personId);
  if (!person) notFound();
  return (
    <>
      <BirthReport person={person} locale={locale} ctx={{ base: "/sample", canEdit: false, people: samplePeople, hiddenIds: new Set() }} />
      <CallToAction />
    </>
  );
}
