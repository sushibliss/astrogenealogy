"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { freeChartAction } from "@/app/chart-action";
import { track } from "@/lib/track";
import { PlaceField } from "./PersonFields";

type Labels = Record<"date" | "time" | "timeHint" | "submit" | "working" | "errorDate" | "private", string>;

/** The free birth chart form. Only a date is required; hour and place sharpen the result. */
export function ChartTool({ labels, children }: { labels: Labels; children?: React.ReactNode }) {
  const locale = useLocale();
  const [state, action, pending] = useActionState(freeChartAction, null);
  const [place, setPlace] = useState<{ text: string; lat: number | null; lon: number | null }>({ text: "", lat: null, lon: null });
  // kept in state so the form still shows what was asked once the chart appears
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const result = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state?.node) return;
    track("chart_generated");
    result.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state?.at, state?.node]);

  return (
    <>
      <form action={action} className="card grid gap-5 p-6 sm:p-8">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="lat" value={place.lat ?? ""} />
        <input type="hidden" name="lon" value={place.lon ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="chart-date">
              {labels.date}
            </label>
            <input id="chart-date" name="date" type="date" required min="1600-01-01" max="2199-12-31" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="chart-time">
              {labels.time}
            </label>
            <input id="chart-time" name="time" type="time" className="field" value={time} onChange={(e) => setTime(e.target.value)} />
            <p className="mt-1.5 text-xs text-ink-soft">{labels.timeHint}</p>
          </div>
        </div>
        <PlaceField value={place.text} located={place.lat != null} onChange={(text, lat, lon) => setPlace({ text, lat, lon })} />
        {state?.error && (
          <p role="alert" className="rounded-2xl bg-ink px-4 py-2.5 text-sm text-paper">
            {labels.errorDate}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <button className="btn px-7 py-3.5 text-base" disabled={pending}>
            {pending ? labels.working : labels.submit}
          </button>
          <p className="eyebrow">{labels.private}</p>
        </div>
      </form>
      <div ref={result} className="scroll-mt-8">
        {state?.node}
        {state?.node && children}
      </div>
    </>
  );
}
