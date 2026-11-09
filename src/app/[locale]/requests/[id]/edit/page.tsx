import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { IntakeWizard } from "@/components/IntakeWizard";
import { deleteDraftAction } from "@/app/actions";
import { redirect } from "@/i18n/navigation";
import { requestForUser } from "@/lib/access";
import { personToInput } from "@/lib/person-input";
import { requireUser } from "@/lib/session";

export default async function EditDraft({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const access = requestForUser(id, user);
  if (!access || !access.isOwner) notFound();
  if (access.request.status !== "draft") redirect({ href: `/requests/${id}`, locale });
  const t = await getTranslations("intake");
  return (
    <div className="wrap max-w-3xl py-12">
      <p className="eyebrow mb-2">{t("draftEyebrow")}</p>
      <h1 className="display mb-8 text-5xl">{t("title")}</h1>
      <IntakeWizard requestId={id} initialPeople={access.people.map(personToInput)} initialFocus={access.request.focusNotes} />
      <form action={deleteDraftAction.bind(null, locale, id)} className="mt-10 border-t border-hair pt-5">
        <button className="link cursor-pointer text-sm text-ink-soft">{t("deleteDraft")}</button>
      </form>
    </div>
  );
}
