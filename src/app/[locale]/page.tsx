import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DemoLogin } from "@/components/DemoLogin";
import { demoEnabled } from "@/lib/demo";
import { MoonPhase, phaseIndex } from "@/components/MoonPhase";
import { Starfield } from "@/components/Starfield";
import { Wheel } from "@/components/Wheel";
import { SIGNS, computeChart } from "@/lib/astro/chart";
import { BODY_GLYPH, SIGN_GLYPH } from "@/lib/astro/glyphs";
import { BODY_NAMES, SIGN_NAMES } from "@/lib/astro/readings";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const STAR = "M12 0 C12.6 7.5 16.5 11.4 24 12 C16.5 12.6 12.6 16.5 12 24 C11.4 16.5 7.5 12.6 0 12 C7.5 11.4 11.4 7.5 12 0 Z";

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const user = await currentUser();
  const lang = locale === "es" ? "es" : "en";

  const now = new Date();
  const iso = now.toISOString();
  const sky = computeChart({ date: iso.slice(0, 10), time: iso.slice(11, 16), tz: "UTC" })!;
  const [sun, moon] = sky.placements;
  const elongation = moon.lon - sun.lon;
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(now);
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" }).format(now);
  const monthYear = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(now);

  return (
    <>
      <section className="relative overflow-hidden">
        <Starfield count={64} shooting />
        <div className="wrap relative grid items-center gap-x-10 gap-y-10 pt-12 pb-16 lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <p className="eyebrow rise-in flex items-center gap-2">
              <svg viewBox="0 0 24 24" width="11" height="11" className="text-accent" aria-hidden>
                <path d={STAR} fill="currentColor" />
              </svg>
              {t("flourish")}
            </p>
            <p
              className="display rise-in mt-3 text-[clamp(5rem,14vw,11rem)] leading-[0.85]"
              style={{ "--delay": "0.1s" } as React.CSSProperties}
            >
              Origen
            </p>
            <h1
              className="display rise-in mt-6 max-w-xl text-4xl leading-[1.08] text-accent italic sm:text-5xl"
              style={{ "--delay": "0.25s" } as React.CSSProperties}
            >
              {t("headline")}
            </h1>
            <p
              className="rise-in mt-5 max-w-lg text-lg leading-relaxed text-ink-soft"
              style={{ "--delay": "0.4s" } as React.CSSProperties}
            >
              {t("support")}
            </p>
            <div className="rise-in mt-7 flex flex-wrap gap-3" style={{ "--delay": "0.55s" } as React.CSSProperties}>
              <Link href={user ? "/requests/new" : "/register"} className="btn px-7 py-3.5 text-base">
                {t("cta")}
              </Link>
              {!user && (
                <Link href="/login" className="btn-ghost bg-paper px-7 py-3.5 text-base">
                  {t("login")}
                </Link>
              )}
            </div>
            <p className="eyebrow rise-in mt-6" style={{ "--delay": "0.7s" } as React.CSSProperties}>
              {t("private")}
            </p>
            {!user && demoEnabled() && (
              <div className="rise-in mt-8 border-t border-hair pt-5" style={{ "--delay": "0.85s" } as React.CSSProperties}>
                <p className="eyebrow mb-2.5">{t("demoPrompt")}</p>
                <DemoLogin locale={locale} compact />
              </div>
            )}
          </div>

          <figure className="mx-auto w-full max-w-[40rem]">
            {/* the living sky: two slow rings of stars around today's chart */}
            <div className="relative p-[6.5%]">
              <svg viewBox="0 0 200 200" className="slow-turn absolute inset-0 h-full w-full text-accent" aria-hidden>
                <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="0.4 3.2" />
                {Array.from({ length: 12 }, (_, i) => {
                  const a = (i * 30 * Math.PI) / 180;
                  const big = i % 3 === 0;
                  const s = big ? 0.24 : 0.13;
                  return (
                    <path
                      key={i}
                      d={STAR}
                      fill="currentColor"
                      transform={`translate(${100 + 98 * Math.cos(a) - 12 * s} ${100 + 98 * Math.sin(a) - 12 * s}) scale(${s})`}
                    />
                  );
                })}
              </svg>
              <svg viewBox="0 0 200 200" className="slow-turn-back absolute inset-0 h-full w-full" aria-hidden>
                <circle cx="100" cy="100" r="92.5" fill="none" stroke="currentColor" strokeWidth="0.25" />
                {Array.from({ length: 36 }, (_, i) => {
                  const a = (i * 10 * Math.PI) / 180;
                  return <circle key={i} cx={100 + 92.5 * Math.cos(a)} cy={100 + 92.5 * Math.sin(a)} r={i % 3 === 0 ? 0.9 : 0.45} fill="currentColor" />;
                })}
              </svg>
              <div className="relative rounded-full bg-paper">
                <Wheel chart={sky} title={t("skyTitle")} className="w-full" animated />
              </div>
            </div>

            {/* today's almanac */}
            <figcaption className="card relative mx-auto mt-2 grid max-w-md grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3">
              <div className="border-r border-hair pr-4 text-center">
                <p className="display text-4xl leading-none">{day}</p>
                <p className="eyebrow mt-1 !text-[0.5625rem]">{weekday}</p>
              </div>
              <div className="min-w-0">
                <p className="eyebrow">
                  {t("almanac")} · {monthYear}
                </p>
                <p className="mt-1 truncate text-sm font-medium">
                  <span className="glyph">{BODY_GLYPH.sun}</span>{" "}
                  {t("inSign", { body: BODY_NAMES.sun[lang], sign: SIGN_NAMES[SIGNS[sun.sign]][lang] })}{" "}
                  <span className="glyph text-ink-soft">{SIGN_GLYPH[SIGNS[sun.sign]]}</span>
                </p>
                <p className="truncate text-sm font-medium">
                  <span className="glyph">{BODY_GLYPH.moon}</span>{" "}
                  {t("inSign", { body: BODY_NAMES.moon[lang], sign: SIGN_NAMES[SIGNS[moon.sign]][lang] })}{" "}
                  <span className="glyph text-ink-soft">{SIGN_GLYPH[SIGNS[moon.sign]]}</span>
                </p>
              </div>
              <div className="text-center">
                <MoonPhase elongation={elongation} className="floaty mx-auto" />
                <p className="eyebrow mt-1 max-w-20 !text-[0.5625rem] leading-tight">{t(`phase_${phaseIndex(elongation)}`)}</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="band relative overflow-hidden border-y border-ink">
        <Starfield count={40} seed={23} />
        <div className="wrap relative grid gap-10 py-16 md:grid-cols-3">
          {([1, 2, 3] as const).map((n) => (
            <div key={n}>
              <p className="display text-5xl italic opacity-50">{["i", "ii", "iii"][n - 1]}.</p>
              <h2 className="display mt-3 text-3xl">{t(`step${n}Title`)}</h2>
              <p className="mt-3 leading-relaxed opacity-80">{t(`step${n}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap grid gap-x-12 gap-y-8 py-20 lg:grid-cols-2">
        <div>
          <h2 className="display text-5xl sm:text-6xl">{t("honestTitle")}</h2>
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
