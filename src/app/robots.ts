import type { MetadataRoute } from "next";
import { LOCALES, siteUrl } from "@/lib/site";

// read SITE_URL when asked, not when built
export const dynamic = "force-dynamic";

/** Search engines may read the public pages; everything personal is off limits. */
export default function robots(): MetadataRoute.Robots {
  const closed = ["/dashboard", "/admin", "/requests", "/read", "/login", "/register", "/unsubscribe"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", ...LOCALES.flatMap((l) => closed.map((p) => `/${l}${p}`))] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
