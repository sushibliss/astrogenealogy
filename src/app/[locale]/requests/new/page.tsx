import { getTranslations, setRequestLocale } from "next-intl/server";
import { IntakeWizard } from "@/components/IntakeWizard";
import { requireUser } from "@/lib/session";

export default async function NewRequest({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale);
  const t = await getTranslations("intake");
  return (
    <div className="wrap max-w-3xl py-12">
      <p className="eyebrow mb-2">{t("eyebrow")}</p>
      <h1 className="display mb-8 text-5xl">{t("title")}</h1>
      <IntakeWizard requestId={null} initialPeople={[]} initialFocus="" />
    </div>
  );
}
