import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { currentUser, isAdmin } from "@/lib/session";
import { logoutAction } from "@/app/actions";
import { LocaleSwitch } from "./LocaleSwitch";

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations("nav");
  const user = await currentUser();
  return (
    <header className="no-print border-b border-ink">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
        <Link href={user ? "/dashboard" : "/"} className="display text-2xl" aria-label="Origen">
          Origen
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:underline underline-offset-4">
                {t("dashboard")}
              </Link>
              {isAdmin(user) && (
                <Link href="/admin" className="hover:underline underline-offset-4">
                  {t("admin")}
                </Link>
              )}
              <form action={logoutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button className="cursor-pointer hover:underline underline-offset-4">{t("logout")}</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline underline-offset-4">
                {t("login")}
              </Link>
              <Link href="/register" className="btn btn-sm">
                {t("register")}
              </Link>
            </>
          )}
          <LocaleSwitch />
        </nav>
      </div>
    </header>
  );
}
