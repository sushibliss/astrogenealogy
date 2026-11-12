import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="no-print mt-20 border-t border-hair">
      <div className="wrap flex flex-wrap items-baseline justify-between gap-3 py-5 text-sm text-ink-soft">
        <p>{t("tagline")}</p>
        <Link href="/privacy" className="link">
          {t("privacy")}
        </Link>
      </div>
    </footer>
  );
}
