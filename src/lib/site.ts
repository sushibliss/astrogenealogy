import type { Metadata } from "next";
import { BRAND } from "./brand";

/** Public address of the site, without a trailing slash. Set SITE_URL in production. */
export function siteUrl() {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export const LOCALES = ["en", "es"] as const;

/** Pages anyone may read, and the only ones search engines are invited to index. */
export const PUBLIC_PATHS = ["", "/chart", "/sample", "/how-it-works", "/faq", "/guides", "/privacy"] as const;

/**
 * Metadata for a public page: indexable, with its canonical address, its
 * translation in the other language and a share card. Everything else on the
 * site inherits `noindex` from the layout.
 * `path` is the part after the locale ("" for the front page); pass a map when
 * the two languages use different addresses (the guides).
 */
export function publicMeta({
  locale,
  path,
  title,
  description,
  article,
}: {
  locale: string;
  path: string | Record<string, string | undefined>;
  title: string;
  description: string;
  article?: { published: string };
}): Metadata {
  const base = siteUrl();
  const pathFor = (l: string) => (typeof path === "string" ? path : path[l]);
  const url = (l: string) => `${base}/${l}${pathFor(l) ?? ""}`;
  const languages: Record<string, string> = {};
  for (const l of LOCALES) if (pathFor(l) !== undefined) languages[l] = url(l);
  if (languages.en) languages["x-default"] = languages.en;
  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url(locale), languages },
    openGraph: {
      title,
      description,
      url: url(locale),
      siteName: BRAND,
      locale: locale === "es" ? "es_ES" : "en_GB",
      type: article ? "article" : "website",
      ...(article ? { publishedTime: article.published } : {}),
      images: [{ url: `${base}/og-${locale === "es" ? "es" : "en"}.png`, width: 1200, height: 630, alt: BRAND }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${base}/og-${locale === "es" ? "es" : "en"}.png`] },
  };
}
