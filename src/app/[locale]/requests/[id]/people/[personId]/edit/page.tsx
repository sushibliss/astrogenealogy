import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DocumentManager } from "@/components/DocumentManager";
import { PersonEditor } from "@/components/PersonEditor";
import { requestForUser } from "@/lib/access";
import { documentHref, documentsByPerson } from "@/lib/documents";
import { fullName, relationLabel } from "@/lib/people";
import { personToInput } from "@/lib/person-input";
import { requireUser } from "@/lib/session";

export default async function EditPerson({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string; personId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale, id, personId } = await params;
  const { from } = await searchParams;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const access = requestForUser(id, user);
  const person = access?.people.find((p) => p.id === personId);
  if (!access || !person) notFound();
  const t = await getTranslations("person");
  return (
    <div className="wrap max-w-3xl py-12">
      <p className="eyebrow mb-2">{relationLabel(person.path, locale)}</p>
      <h1 className="display mb-2 text-4xl">{fullName(person) || t("unknownName")}</h1>
      <p className="mb-8 text-ink-soft">{t("editLead")}</p>
      <PersonEditor requestId={id} personId={person.id} initial={personToInput(person)} returnTo={from === "admin" ? "admin" : "request"} />
      {access.isAdmin && (
        <DocumentManager
          requestId={id}
          personId={person.id}
          documents={(documentsByPerson(id).get(person.id) ?? []).map((d) => ({ id: d.id, title: d.title, kind: d.kind, href: documentHref(d) }))}
        />
      )}
    </div>
  );
}
