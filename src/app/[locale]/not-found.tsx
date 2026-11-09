import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="wrap py-24">
      <p className="glyph text-6xl leading-none" aria-hidden>
        ☽
      </p>
      <h1 className="display mt-4 text-5xl">{t("title")}</h1>
      <p className="mt-3 max-w-md text-ink-soft">{t("body")}</p>
      <Link href="/" className="btn mt-6">
        {t("home")}
      </Link>
    </div>
  );
}
