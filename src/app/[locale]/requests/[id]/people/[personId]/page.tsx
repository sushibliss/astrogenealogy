import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BirthReport } from "@/components/BirthReport";
import { requestForUser } from "@/lib/access";
import { fullName } from "@/lib/people";
import { currentUser, requireUser } from "@/lib/session";

type Props = { params: Promise<{ locale: string; id: string; personId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, personId } = await params;
  const user = await currentUser();
  const person = user ? requestForUser(id, user)?.people.find((p) => p.id === personId) : null;
  return { title: person ? fullName(person) || undefined : undefined };
}

export default async function PersonPage({ params }: Props) {
  const { locale, id, personId } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const access = requestForUser(id, user);
  const person = access?.people.find((p) => p.id === personId);
  if (!access || !person) notFound();
  return (
    <BirthReport
      person={person}
      locale={locale}
      ctx={{ base: `/requests/${id}`, canEdit: true, people: access.people, hiddenIds: new Set() }}
    />
  );
}
