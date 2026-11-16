"use server";

import tzlookup from "tz-lookup";
import { getTranslations } from "next-intl/server";
import { ChartResult } from "@/components/ChartResult";
import { computeChart, parseFullDate, parseTime } from "@/lib/astro/chart";

export type FreeChartState = { error?: "date"; node?: React.ReactNode; at?: number } | null;

/**
 * Casts a chart for the public tool. The birth details are used for this one
 * answer and are not stored or logged.
 */
export async function freeChartAction(_prev: FreeChartState, form: FormData): Promise<FreeChartState> {
  const locale = form.get("locale") === "es" ? "es" : "en";
  const date = String(form.get("date") ?? "");
  if (!parseFullDate(date)) return { error: "date" };
  const time = parseTime(String(form.get("time") ?? "")) ? String(form.get("time")) : null;
  const latRaw = form.get("lat");
  const lonRaw = form.get("lon");
  const lat = latRaw ? Number(latRaw) : NaN;
  const lon = lonRaw ? Number(lonRaw) : NaN;
  const located = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  let tz: string | null = null;
  if (located) {
    try {
      tz = tzlookup(lat, lon);
    } catch {}
  }
  const chart = computeChart({ date, time, lat: located ? lat : null, lon: located ? lon : null, tz });
  if (!chart) return { error: "date" };
  const t = await getTranslations({ locale, namespace: "mk" });
  return {
    at: Date.now(),
    node: (
      <ChartResult
        chart={chart}
        lang={locale}
        labels={{
          title: t("chartResult"),
          sun: t("chartSun"),
          moon: t("chartMoon"),
          rising: t("chartRising"),
          risingMissing: t("chartRisingMissing"),
          moonEither: t("chartMoonEither"),
          planets: t("chartPlanets"),
          elements: t("chartElements"),
          wheel: t("chartWheel"),
        }}
      />
    ),
  };
}
