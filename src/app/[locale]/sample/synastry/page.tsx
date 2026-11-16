import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SynastryView } from "@/components/SynastryView";
import { samplePeople } from "@/lib/sample";

export default async function SampleSynastryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { locale } = await params;
  const { a, b } = await searchParams;
  setRequestLocale(locale);
  const pa = samplePeople.find((p) => p.id === a);
  const pb = samplePeople.find((p) => p.id === b);
  if (!pa || !pb || pa.id === pb.id) notFound();
  return <SynastryView a={pa} b={pb} locale={locale} base="/sample" />;
}
