import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/brand";
import { CookieSettings } from "./Consent";

/** Every public page is one link away from every other, for visitors and for search engines. */
export async function Footer() {
  const t = await getTranslations("footer");
  const n = await getTranslations("nav");
  const tagged = !!(process.env.GA_ID || process.env.GOOGLE_ADS_ID || process.env.META_PIXEL_ID);
  return (
    <footer className="no-print mt-20 border-t border-hair">
      <div className="wrap grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display text-2xl">{BRAND}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">{t("tagline")}</p>
        </div>
        <nav className="footer-nav grid content-start gap-2" aria-label={t("explore")}>
          <p className="eyebrow mb-1">{t("explore")}</p>
          <Link href="/chart">{n("chart")}</Link>
          <Link href="/sample">{n("sample")}</Link>
          <Link href="/guides">{n("guides")}</Link>
        </nav>
        <nav className="footer-nav grid content-start gap-2" aria-label={t("about")}>
          <p className="eyebrow mb-1">{t("about")}</p>
          <Link href="/how-it-works">{n("how")}</Link>
          <Link href="/faq">{n("faq")}</Link>
          <Link href="/privacy">{t("privacy")}</Link>
          {tagged && <CookieSettings label={t("cookies")} />}
        </nav>
      </div>
    </footer>
  );
}
