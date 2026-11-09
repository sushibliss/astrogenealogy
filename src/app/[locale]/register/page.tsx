import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { AuthForm } from "@/components/AuthForm";
import { currentUser } from "@/lib/session";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await currentUser()) redirect({ href: "/dashboard", locale });
  const t = await getTranslations("auth");
  return (
    <div className="wrap max-w-md py-14">
      <h1 className="display mb-2 text-4xl">{t("registerTitle")}</h1>
      <p className="mb-6 text-ink-soft">{t("registerLead")}</p>
      <AuthForm mode="register" />
      <p className="mt-5 text-sm text-ink-soft">
        {t("haveAccount")}{" "}
        <Link href="/login" className="link text-ink">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
