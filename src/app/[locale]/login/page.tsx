import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { AuthForm } from "@/components/AuthForm";
import { demoLoginAction } from "@/app/actions";
import { currentUser } from "@/lib/session";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await currentUser()) redirect({ href: "/dashboard", locale });
  const t = await getTranslations("auth");
  const demo = process.env.DEMO_LOGIN === "true";
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
          <div className="mt-5 grid gap-3">
            {(["user", "admin"] as const).map((role) => (
              <form key={role} action={demoLoginAction}>
                <input type="hidden" name="role" value={role} />
                <input type="hidden" name="locale" value={locale} />
                <button className={`${role === "user" ? "btn" : "btn-ghost"} w-full flex-col !items-start !gap-0 text-left`}>
                  <span>{t(`demo_${role}`)}</span>
                  <span className="font-mono text-[0.6875rem] font-normal opacity-70">{t(`demo_${role}_hint`)}</span>
                </button>
              </form>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
