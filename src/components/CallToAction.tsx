import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Starfield } from "./Starfield";

/** Closing invitation shared by every public page. `hide` drops the button for the page you are already on. */
export async function CallToAction({ hide }: { hide?: "sample" | "chart" }) {
  const t = await getTranslations("mk");
  return (
    <section className="night sky-hero relative mx-3 mt-20 overflow-hidden rounded-[2.5rem] sm:mx-6">
      <Starfield count={60} seed={17} shooting />
      <div className="wrap relative py-16 text-center sm:py-20">
        <h2 className="display mx-auto max-w-3xl text-4xl sm:text-5xl">{t("ctaTitle")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">{t("ctaBody")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="btn px-7 py-3.5 text-base">
            {t("ctaStart")}
          </Link>
          {hide !== "sample" && (
            <Link href="/sample" className="btn-ghost px-7 py-3.5 text-base">
              {t("ctaSample")}
            </Link>
          )}
          {hide !== "chart" && (
            <Link href="/chart" className="btn-ghost px-7 py-3.5 text-base">
              {t("ctaChart")}
            </Link>
          )}
        </div>
        <p className="eyebrow mt-6">{t("ctaNote")}</p>
      </div>
    </section>
  );
}
