import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SynastryView } from "@/components/SynastryView";
import { requestForUser } from "@/lib/access";
import { requireUser } from "@/lib/session";

export default async function SynastryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { locale, id } = await params;
  const { a, b } = await searchParams;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const access = requestForUser(id, user);
  const pa = access?.people.find((p) => p.id === a);
  const pb = access?.people.find((p) => p.id === b);
  if (!access || !pa || !pb || pa.id === pb.id) notFound();
  return <SynastryView a={pa} b={pb} locale={locale} base={`/requests/${id}`} />;
}
