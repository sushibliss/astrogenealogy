import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "@fontsource-variable/bricolage-grotesque/wdth.css";
import "@fontsource/im-fell-english/400.css";
import "@fontsource/im-fell-english/400-italic.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/noto-sans-symbols/symbols-400.css";
import "../globals.css";
import { BRAND } from "@/lib/brand";
import { siteUrl } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Consent } from "@/components/Consent";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("title"), template: `%s · ${BRAND}` },
    description: t("description"),
    // Private by default: only pages that opt in through publicMeta() are indexable.
    robots: { index: false, follow: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const tc = await getTranslations("mk");
  const saved = (await cookies()).get("theme")?.value;
  const theme = saved === "dark" || saved === "light" ? saved : undefined;
  return (
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <Header locale={locale} />
          <main className="flex-1">{children}</main>
          <Footer />
          <Consent
            tags={{ ga: process.env.GA_ID || undefined, ads: process.env.GOOGLE_ADS_ID || undefined, pixel: process.env.META_PIXEL_ID || undefined }}
            labels={{ text: tc("consentText"), accept: tc("consentAccept"), decline: tc("consentDecline"), more: tc("consentMore") }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
