"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitch() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  return (
    <div className="flex items-center border border-ink font-mono text-xs" role="group" aria-label={t("language")}>
      {routing.locales.map((l) => (
        <Link
          key={l}
          // @ts-expect-error -- pathname + params always match for the current route
          href={{ pathname, params }}
          locale={l}
          aria-current={l === locale ? "true" : undefined}
          className={`px-2 py-1 uppercase ${l === locale ? "bg-ink text-paper" : "hover:bg-paper-deep"}`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
