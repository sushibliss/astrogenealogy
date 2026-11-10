import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { AuthForm } from "@/components/AuthForm";
import { DemoLogin } from "@/components/DemoLogin";
import { demoEnabled } from "@/lib/demo";
import { currentUser } from "@/lib/session";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await currentUser()) redirect({ href: "/dashboard", locale });
  const t = await getTranslations("auth");
  const demo = demoEnabled();
  return (
    <div className="wrap grid max-w-4xl gap-10 py-14 md:grid-cols-2">
      <div>
        <h1 className="display mb-6 text-4xl">{t("loginTitle")}</h1>
        <AuthForm mode="login" />
        <p className="mt-5 text-sm text-ink-soft">
          {t("noAccount")}{" "}
          <Link href="/register" className="link text-ink">
            {t("registerLink")}
          </Link>
        </p>
      </div>
      {demo && (
        <aside className="card self-start p-6">
          <p className="eyebrow mb-2">{t("demoEyebrow")}</p>
          <h2 className="display text-2xl">{t("demoTitle")}</h2>
          <p className="mt-2 text-sm text-ink-soft">{t("demoBody")}</p>
          <div className="mt-5">
            <DemoLogin locale={locale} />
          </div>
        </aside>
      )}
    </div>
  );
}
