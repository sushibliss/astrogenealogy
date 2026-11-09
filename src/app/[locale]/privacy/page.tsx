import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Privacy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  return (
    <div className="wrap max-w-3xl py-14">
      <p className="eyebrow mb-2">{t("eyebrow")}</p>
      <h1 className="display text-5xl">{t("title")}</h1>
      <p className="notice mt-6">{t("placeholder")}</p>
      <div className="prose-origen mt-8">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <div key={n}>
            <h2>{t(`h${n}`)}</h2>
            <p>{t(`p${n}`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
