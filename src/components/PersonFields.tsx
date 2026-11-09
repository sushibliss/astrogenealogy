"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { PersonInput } from "@/lib/person-input";

type Place = { name: string; region: string; country: string; lat: number; lon: number };

function DateParts({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const t = useTranslations("person");
  const locale = useLocale();
  const id = useId();
  const [y = "", m = "", d = ""] = value.split("-");
  const set = (ny: string, nm: string, nd: string) => {
    if (!ny) return onChange("");
    onChange(ny + (nm ? `-${nm}` + (nd ? `-${nd}` : "") : ""));
  };
  const months = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2000, i, 1))),
  );
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-2">
        <input
          aria-label={t("day")}
          placeholder={t("day")}
          inputMode="numeric"
          className="field"
          disabled={!m}
          value={d ? String(+d) : ""}
          onChange={(e) => {
            const n = e.target.value.replace(/\D/g, "").slice(0, 2);
            set(y, m, n && +n >= 1 && +n <= 31 ? n.padStart(2, "0") : "");
          }}
        />
        <select
          aria-label={t("month")}
          className="field"
          disabled={y.length !== 4}
          value={m}
          onChange={(e) => set(y, e.target.value, e.target.value ? d : "")}
        >
          <option value="">{t("month")}</option>
          {months.map((name, i) => (
            <option key={i} value={String(i + 1).padStart(2, "0")}>
              {name}
            </option>
          ))}
        </select>
        <input
          id={id}
          aria-label={t("year")}
          placeholder={t("year")}
          inputMode="numeric"
          className="field"
          value={y}
          onChange={(e) => {
            const n = e.target.value.replace(/\D/g, "").slice(0, 4);
            // keep month/day only while the year is complete
            if (n.length === 4) set(n, m, d);
            else onChange(n);
          }}
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
    </fieldset>
  );
}

function PlaceField({
  value,
  located,
  onChange,
}: {
  value: string;
  located: boolean;
  onChange: (place: string, lat: number | null, lon: number | null) => void;
}) {
  const t = useTranslations("person");
  const locale = useLocale();
  const id = useId();
  const [options, setOptions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regionNames = new Intl.DisplayNames(locale, { type: "region" });
  const describe = (p: Place) => {
    let country = p.country;
    try {
      country = regionNames.of(p.country) ?? p.country;
    } catch {}
    return [p.name, p.region, country].filter(Boolean).join(", ");
  };

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const lookup = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) return setOptions([]);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
        if (res.ok) setOptions((await res.json()).places);
      } catch {}
    }, 180);
  };

  return (
    <div className="relative">
      <label className="label" htmlFor={id}>
        {t("birthPlace")}
      </label>
      <input
        id={id}
        className="field"
        autoComplete="off"
        placeholder={t("birthPlacePlaceholder")}
        value={value}
        onChange={(e) => {
          onChange(e.target.value, null, null);
          setOpen(true);
          lookup(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && options.length > 0 && !located && (
        <ul className="absolute z-20 mt-px max-h-64 w-full overflow-auto border border-ink bg-paper-light shadow-[4px_4px_0_0_var(--color-ink)]">
          {options.map((p, i) => (
            <li key={i}>
              <button
                type="button"
                className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-ink hover:text-paper"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(describe(p), p.lat, p.lon);
                  setOpen(false);
                  setOptions([]);
                }}
              >
                {describe(p)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1.5 text-xs text-ink-soft">{located ? t("placeLocated") : t("placeHint")}</p>
    </div>
  );
}

export function PersonFields({
  value,
  onChange,
  showLiving = true,
}: {
  value: PersonInput;
  onChange: (next: PersonInput) => void;
  showLiving?: boolean;
}) {
  const t = useTranslations("person");
  const id = useId();
  const set = (patch: Partial<PersonInput>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${id}-g`}>
            {t("givenNames")}
          </label>
          <input id={`${id}-g`} className="field" value={value.givenNames} onChange={(e) => set({ givenNames: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor={`${id}-s`}>
            {t("surnames")}
          </label>
          <input id={`${id}-s`} className="field" value={value.surnames} onChange={(e) => set({ surnames: e.target.value })} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <DateParts label={t("birthDate")} value={value.birthDate} onChange={(v) => set({ birthDate: v })} hint={t("dateHint")} />
        <div>
          <label className="label" htmlFor={`${id}-t`}>
            {t("birthTime")}
          </label>
          <input
            id={`${id}-t`}
            type="time"
            className="field"
            value={value.birthTime}
            onChange={(e) => set({ birthTime: e.target.value })}
          />
          <p className="mt-1.5 text-xs text-ink-soft">{t("timeHint")}</p>
        </div>
      </div>

      <PlaceField
        value={value.birthPlace}
        located={value.birthLat != null}
        onChange={(birthPlace, birthLat, birthLon) => set({ birthPlace, birthLat, birthLon })}
      />

      {showLiving && (
        <fieldset>
          <legend className="label">{t("living")}</legend>
          <div className="flex flex-wrap border border-ink text-sm">
            {(["alive", "deceased", "unknown"] as const).map((opt) => (
              <label
                key={opt}
                className={`flex-1 cursor-pointer border-ink px-3 py-2 text-center not-first:border-l has-focus-visible:outline-2 ${
                  value.living === opt ? "bg-ink text-paper" : "bg-paper-light hover:bg-paper-deep"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={`${id}-living`}
                  checked={value.living === opt}
                  onChange={() => set({ living: opt })}
                />
                {t(`living_${opt}`)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {value.living !== "alive" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <DateParts label={t("deathDate")} value={value.deathDate} onChange={(v) => set({ deathDate: v })} />
          <div>
            <label className="label" htmlFor={`${id}-dp`}>
              {t("deathPlace")}
            </label>
            <input id={`${id}-dp`} className="field" value={value.deathPlace} onChange={(e) => set({ deathPlace: e.target.value })} />
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor={`${id}-n`}>
          {t("notes")}
        </label>
        <textarea
          id={`${id}-n`}
          rows={2}
          className="field"
          placeholder={t("notesPlaceholder")}
          value={value.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}
