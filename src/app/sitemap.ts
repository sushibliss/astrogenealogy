import type { MetadataRoute } from "next";
import { guideByKey, guides } from "@/lib/content";
import { LOCALES, PUBLIC_PATHS, siteUrl } from "@/lib/site";

// read SITE_URL when asked, not when built
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = [];
  for (const path of PUBLIC_PATHS) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${base}/${locale}${path}`,
        changeFrequency: path === "" || path === "/guides" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/chart" || path === "/sample" ? 0.9 : path === "/privacy" ? 0.2 : 0.7,
        alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${base}/${l}${path}`])) },
      });
    }
  }
  for (const locale of LOCALES) {
    for (const g of guides(locale)) {
      const languages: Record<string, string> = {};
      for (const l of LOCALES) {
        const other = l === locale ? g : guideByKey(l, g.key);
        if (other) languages[l] = `${base}/${l}/guides/${other.slug}`;
      }
      entries.push({
        url: `${base}/${locale}/guides/${g.slug}`,
        lastModified: g.date ? new Date(g.date) : undefined,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages },
      });
    }
  }
  return entries;
}
