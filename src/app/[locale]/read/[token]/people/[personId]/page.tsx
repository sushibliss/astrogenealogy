import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BirthReport } from "@/components/BirthReport";
import { requestForToken } from "@/lib/access";
import { isPrivateForGuests } from "@/lib/people";

export default async function GuestPersonPage({
  params,
}: {
  params: Promise<{ locale: string; token: string; personId: string }>;
}) {
  const { locale, token, personId } = await params;
  setRequestLocale(locale);
  const access = requestForToken(token);
  const person = access?.people.find((p) => p.id === personId);
  // Living people are never shown to guests.
  if (!access || !person || isPrivateForGuests(person)) notFound();
  const hiddenIds = new Set(access.people.filter(isPrivateForGuests).map((p) => p.id));
  return (
    <BirthReport
      person={person}
      locale={locale}
      ctx={{ base: `/read/${token}`, canEdit: false, people: access.people, hiddenIds }}
    />
  );
}
