import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Wheel } from "@/components/Wheel";
import { computeChart } from "@/lib/astro/chart";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const user = await currentUser();
  const now = new Date();
  const iso = now.toISOString();
  const sky = computeChart({ date: iso.slice(0, 10), time: iso.slice(11, 16), tz: "UTC" })!;
  const today = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(now);

  return (
    <>
      <section className="wrap grid items-center gap-x-10 gap-y-8 pt-10 pb-14 lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <p className="display text-[clamp(4.5rem,13vw,10rem)]">Origen</p>
          <h1 className="mt-5 max-w-xl text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">{t("headline")}</h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-soft">{t("support")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={user ? "/requests/new" : "/register"} className="btn px-7 py-3.5 text-base">
              {t("cta")}
            </Link>
            {!user && (
              <Link href="/login" className="btn-ghost px-7 py-3.5 text-base">
                {t("login")}
              </Link>
            )}
          </div>
          <p className="eyebrow mt-6">{t("private")}</p>
        </div>
        <figure className="mx-auto w-full max-w-[38rem]">
          <Wheel chart={sky} title={t("skyTitle", { date: today })} className="w-full" />
          <figcaption className="mt-2 text-center font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-soft">
            {t("skyTitle", { date: today })}
          </figcaption>
        </figure>
      </section>

      <section className="border-y border-ink bg-ink text-paper">
        <div className="wrap grid gap-10 py-14 md:grid-cols-3">
          {([1, 2, 3] as const).map((n) => (
            <div key={n}>
              <p className="font-mono text-xs opacity-60">0{n}</p>
              <h2 className="display mt-2 text-2xl">{t(`step${n}Title`)}</h2>
              <p className="mt-3 leading-relaxed opacity-80">{t(`step${n}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap grid gap-x-12 gap-y-8 py-16 lg:grid-cols-2">
        <div>
          <h2 className="display text-4xl sm:text-5xl">{t("honestTitle")}</h2>
        </div>
        <div className="grid gap-5 text-lg leading-relaxed">
          <p>{t("honest1")}</p>
          <p>{t("honest2")}</p>
          <p className="text-ink-soft">{t("honest3")}</p>
        </div>
      </section>
    </>
  );
}
