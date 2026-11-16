import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { currentUser, isAdmin } from "@/lib/session";
import { logoutAction } from "@/app/actions";
import { LocaleSwitch } from "./LocaleSwitch";
import { ThemeToggle } from "./ThemeToggle";
import { Chime } from "./Chime";
import { TopBar } from "./TopBar";
import { BRAND } from "@/lib/brand";

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations("nav");
  const user = await currentUser();
  return (
    <TopBar label={t("menu")}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-2.5">
        <Link href={user ? "/dashboard" : "/"} className="display text-xl" aria-label={BRAND}>
          {BRAND}
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
              <Link href="/chart" className="hover:underline underline-offset-4">
                {t("chart")}
              </Link>
              <Link href="/sample" className="hover:underline underline-offset-4">
                {t("sample")}
              </Link>
              <Link href="/guides" className="hover:underline underline-offset-4">
                {t("guides")}
              </Link>
              <Link href="/login" className="hover:underline underline-offset-4">
                {t("login")}
              </Link>
              <Link href="/register" className="btn btn-sm">
                {t("register")}
              </Link>
            </>
          )}
          <Chime labelOn={t("soundOn")} labelOff={t("soundOff")} />
          <ThemeToggle label={t("theme")} />
          <LocaleSwitch />
        </nav>
      </div>
    </TopBar>
  );
}
