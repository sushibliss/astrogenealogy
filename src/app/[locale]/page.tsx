import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CallToAction } from "@/components/CallToAction";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterForm } from "@/components/NewsletterForm";
import { guides } from "@/lib/content";
import { publicMeta, siteUrl } from "@/lib/site";
import { TESTIMONIALS } from "@/lib/testimonials";
import { Link } from "@/i18n/navigation";
import { DemoLogin } from "@/components/DemoLogin";
import { demoEnabled } from "@/lib/demo";
import { MoonPhase, phaseIndex } from "@/components/MoonPhase";
import { Starfield } from "@/components/Starfield";
import { LiveSky } from "@/components/LiveSky";
import { spread } from "@/components/Wheel";
import { SIGNS, computeChart } from "@/lib/astro/chart";
import { BODY_GLYPH, SIGN_GLYPH } from "@/lib/astro/glyphs";
import { BODY_NAMES, SIGN_NAMES } from "@/lib/astro/readings";
import { BRAND } from "@/lib/brand";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = await getTranslations({ locale, namespace: "mk" });
  return publicMeta({ locale, path: "", title: m("metaTitle"), description: m("metaDescription") });
}

const STAR = "M12 0 C12.6 7.5 16.5 11.4 24 12 C16.5 12.6 12.6 16.5 12 24 C11.4 16.5 7.5 12.6 0 12 C7.5 11.4 11.4 7.5 12 0 Z";

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const m = await getTranslations("mk");
  const latest = guides(locale).slice(0, 4);
  const quotes = TESTIMONIALS.filter((q) => q.locale === (locale === "es" ? "es" : "en"));
  const user = await currentUser();
  const lang = locale === "es" ? "es" : "en";

  const now = new Date();
  const iso = now.toISOString();
  const sky = computeChart({ date: iso.slice(0, 10), time: iso.slice(11, 16), tz: "UTC" })!;
  const [sun, moon] = sky.placements;
  const shown = spread(
    sky.placements.map((p) => p.lon),
    13,
  );
  const elongation = moon.lon - sun.lon;
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(now);
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" }).format(now);
  const monthYear = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(now);

  return (
    <>
      <section className="relative overflow-hidden">
        <Starfield count={64} shooting />
        <div className="wrap relative grid items-center gap-x-10 gap-y-10 pt-16 pb-16 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <p className="eyebrow rise-in flex items-center gap-2">
              <svg viewBox="0 0 24 24" width="11" height="11" className="text-accent" aria-hidden>
                <path d={STAR} fill="currentColor" />
              </svg>
              {t("flourish")}
            </p>
            <p
              className="display rise-in mt-3 text-[clamp(3.5rem,9.6vw,7.5rem)] leading-[0.9]"
              style={{ "--delay": "0.1s" } as React.CSSProperties}
            >
              {BRAND}
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
              <Link href="/sample" className="btn-ghost bg-paper px-7 py-3.5 text-base">
                {m("ctaSample")}
              </Link>
            </div>
            <p className="rise-in mt-4 text-sm text-ink-soft" style={{ "--delay": "0.62s" } as React.CSSProperties}>
              {m("heroOr")}{" "}
              <Link href="/chart" className="link text-ink">
                {m("heroChart")}
              </Link>
              {!user && (
                <>
                  {" · "}
                  <Link href="/login" className="link">
                    {t("login")}
                  </Link>
                </>
              )}
            </p>
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
              <LiveSky
                title={t("skyTitle")}
                inWord={t("skyIn")}
                signs={SIGNS.map((key) => ({ glyph: SIGN_GLYPH[key], name: SIGN_NAMES[key][lang] }))}
                bodies={sky.placements.map((p, i) => ({
                  key: p.body,
                  name: BODY_NAMES[p.body][lang],
                  glyph: BODY_GLYPH[p.body],
                  lon: p.lon,
                  shown: shown[i],
                  sign: p.sign,
                  signName: SIGN_NAMES[SIGNS[p.sign]][lang],
                  deg: p.deg,
                  tone: i < 2 ? "var(--color-accent-2)" : i < 5 ? "var(--color-accent)" : "var(--color-accent-3)",
                }))}
                aspects={sky.aspects
                  .filter((a) => a.type !== "conjunction")
                  .map((a) => ({ a: a.a, b: a.b, soft: a.type === "trine" || a.type === "sextile" }))}
              />
            </div>

            <p className="eyebrow rise-in mt-1 mb-3 text-center" style={{ "--delay": "1.2s" } as React.CSSProperties}>
              {t("skyHint")}
            </p>

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

      <section className="band relative mx-3 overflow-hidden rounded-[2.5rem] sm:mx-6">
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

      {/* what a finished request contains */}
      <section className="wrap-wide pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow mb-3">{m("getEyebrow")}</p>
          <h2 className="display text-4xl sm:text-5xl">{m("getTitle")}</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{m("getLead")}</p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {([1, 2, 3, 4] as const).map((n) => (
            <li key={n} className="card p-6">
              <p className="glyph text-3xl text-accent" aria-hidden>
                {["✦", "⌖", "✎", "☉"][n - 1]}
              </p>
              <h3 className="display mt-3 text-2xl">{m(`get${n}Title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m(`get${n}Body`)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/sample" className="btn px-7 py-3.5 text-base">
            {m("ctaSample")}
          </Link>
          <Link href="/how-it-works" className="btn-ghost px-7 py-3.5 text-base">
            {m("getHow")}
          </Link>
        </div>
      </section>

      {/* the free chart: something useful before any commitment */}
      <section className="wrap pt-20">
        <div className="card grid items-center gap-6 p-7 sm:p-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow mb-2">{m("chartEyebrow")}</p>
            <h2 className="display text-3xl sm:text-4xl">{m("teaserTitle")}</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{m("teaserBody")}</p>
          </div>
          <Link href="/chart" className="btn px-7 py-3.5 text-base">
            {m("ctaChart")}
          </Link>
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

      {/* the person behind the research */}
      <section className="wrap">
        <div className="grid gap-x-12 gap-y-6 rounded-[2rem] bg-paper-deep px-6 py-12 sm:px-12 lg:grid-cols-[14rem_1fr]">
          <p className="eyebrow">{m("teresaEyebrow")}</p>
          <div>
            <h2 className="display text-4xl">{m("teresaTitle")}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed">{m("teresaBody")}</p>
            <p className="display mt-5 text-2xl italic">Teresa</p>
          </div>
        </div>
      </section>

      {quotes.length > 0 && (
        <section className="wrap pt-20">
          <h2 className="eyebrow mb-4">{m("quotesTitle")}</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {quotes.map((q) => (
              <li key={q.name + q.quote.slice(0, 12)} className="card p-6">
                <blockquote className="display text-2xl leading-snug">“{q.quote}”</blockquote>
                <p className="eyebrow mt-4">
                  {q.name}
                  {q.place && ` · ${q.place}`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* guides and the email list */}
      <section className="wrap grid gap-x-12 gap-y-10 pt-20 lg:grid-cols-2">
        <div>
          <h2 className="display text-4xl">{m("guidesTitle")}</h2>
          <ul className="mt-5 grid gap-3">
            {latest.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`} className="link display text-xl">
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/guides" className="btn-ghost btn-sm mt-6">
            {m("guidesAll")}
          </Link>
        </div>
        <div>
          <h2 className="display text-4xl">{m("newsTitle")}</h2>
          <p className="mt-3 mb-5 max-w-md leading-relaxed text-ink-soft">{m("newsBody")}</p>
          <NewsletterForm
            source="landing"
            labels={{
              email: m("newsEmail"),
              placeholder: m("newsPlaceholder"),
              consent: m("newsConsent"),
              submit: m("newsSubmit"),
              done: m("newsDone"),
              error: m("newsError"),
            }}
          />
        </div>
      </section>

      <CallToAction />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", "@id": `${siteUrl()}/#org`, name: BRAND, url: siteUrl(), logo: `${siteUrl()}/icon.svg` },
            { "@type": "WebSite", "@id": `${siteUrl()}/#site`, name: BRAND, url: siteUrl(), inLanguage: ["en", "es"], publisher: { "@id": `${siteUrl()}/#org` } },
            {
              "@type": "Service",
              name: m("serviceName"),
              description: m("metaDescription"),
              serviceType: "Genealogy research",
              provider: { "@id": `${siteUrl()}/#org` },
              availableLanguage: ["en", "es"],
              url: `${siteUrl()}/${locale}`,
              offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: m("serviceOffer") },
            },
          ],
        }}
      />
    </>
  );
}
