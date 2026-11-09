import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SynastryView } from "@/components/SynastryView";
import { requestForToken } from "@/lib/access";
import { isPrivateForGuests } from "@/lib/people";

export default async function GuestSynastryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { locale, token } = await params;
  const { a, b } = await searchParams;
  setRequestLocale(locale);
  const access = requestForToken(token);
  const pa = access?.people.find((p) => p.id === a);
  const pb = access?.people.find((p) => p.id === b);
  if (!access || !pa || !pb || pa.id === pb.id || isPrivateForGuests(pa) || isPrivateForGuests(pb)) notFound();
  return <SynastryView a={pa} b={pb} locale={locale} base={`/read/${token}`} />;
}
