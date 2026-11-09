"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { saveIntakeAction } from "@/app/actions";
import { INTAKE_PATHS, relationLabel } from "@/lib/people";
import { emptyPerson, type PersonInput } from "@/lib/person-input";
import { PersonFields } from "./PersonFields";

const STEPS = [[""], ["f", "m"], ["ff", "fm", "mf", "mm"]] as const;

export function IntakeWizard({
  requestId,
  initialPeople,
  initialFocus,
}: {
  requestId: string | null;
  initialPeople: PersonInput[];
  initialFocus: string;
}) {
  const t = useTranslations("intake");
  const locale = useLocale();
  const [people, setPeople] = useState<Record<string, PersonInput>>(() =>
    Object.fromEntries(INTAKE_PATHS.map((p) => [p, initialPeople.find((x) => x.path === p) ?? emptyPerson(p)])),
  );
  const [focus, setFocus] = useState(initialFocus);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const last = STEPS.length; // review step

  const named = (path: string) => !!(people[path].givenNames.trim() || people[path].surnames.trim());
  const canSubmit = ["", "f", "m"].every(named);

  const save = (submit: boolean) =>
    start(async () => {
      setError(null);
      const res = await saveIntakeAction(locale, requestId, { focusNotes: focus, people: Object.values(people) }, submit);
      if (res?.error) setError(res.error);
    });

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };

  const stepTitles = [t("stepSelf"), t("stepParents"), t("stepGrandparents"), t("stepReview")];

  return (
    <div>
      <ol className="mb-8 grid grid-cols-4 border border-ink text-center font-mono text-[0.6875rem] uppercase tracking-[0.1em]">
        {stepTitles.map((title, i) => (
          <li key={i} className="not-first:border-l border-ink">
            <button
              type="button"
              onClick={() => go(i)}
              aria-current={i === step ? "step" : undefined}
              className={`w-full cursor-pointer px-1 py-2.5 ${i === step ? "bg-ink text-paper" : "hover:bg-paper-deep"}`}
            >
              <span className="opacity-60">{i + 1} </span>
              <span className="hidden sm:inline">{title}</span>
            </button>
          </li>
        ))}
      </ol>

      {step < last ? (
        <div className="grid gap-6">
          <p className="max-w-2xl text-ink-soft">{[t("introSelf"), t("introParents"), t("introGrandparents")][step]}</p>
          {STEPS[step].map((path) => (
            <section key={path} className="card p-5 sm:p-6">
              <h2 className="display mb-5 text-xl">{path === "" ? t("you") : relationLabel(path, locale)}</h2>
              <PersonFields
                value={people[path]}
                showLiving={path !== ""}
                onChange={(next) => setPeople((prev) => ({ ...prev, [path]: next }))}
              />
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          <section className="card p-5 sm:p-6">
            <h2 className="display mb-4 text-xl">{t("reviewTitle")}</h2>
            <ul className="divide-y divide-hair">
              {INTAKE_PATHS.map((path) => {
                const p = people[path];
                const name = `${p.givenNames} ${p.surnames}`.trim();
                return (
                  <li key={path} className="grid gap-x-4 py-2.5 sm:grid-cols-[13rem_1fr]">
                    <span className="eyebrow self-center">{path === "" ? t("you") : relationLabel(path, locale)}</span>
                    <span>
                      <span className={name ? "font-semibold" : "text-ink-faint"}>{name || t("unknownName")}</span>
                      <span className="ml-2 font-mono text-xs text-ink-soft">
                        {[p.birthDate, p.birthTime, p.birthPlace].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="card p-5 sm:p-6">
            <label className="label" htmlFor="focus">
              {t("focusLabel")}
            </label>
            <textarea
              id="focus"
              rows={4}
              className="field"
              placeholder={t("focusPlaceholder")}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />
          </section>
          <p className="notice">{t("honest")}</p>
          {!canSubmit && <p className="text-sm font-medium">{t("needNames")}</p>}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-5 border border-ink bg-ink px-4 py-2 text-sm text-paper">
          {t(`error_${error}`)}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          {step > 0 && (
            <button type="button" className="btn-ghost" onClick={() => go(step - 1)}>
              ← {t("back")}
            </button>
          )}
          <button type="button" className="btn-ghost" disabled={pending} onClick={() => save(false)}>
            {t("saveDraft")}
          </button>
        </div>
        {step < last ? (
          <button type="button" className="btn" onClick={() => go(step + 1)}>
            {t("next")} →
          </button>
        ) : (
          <button type="button" className="btn" disabled={pending || !canSubmit} onClick={() => save(true)}>
            {pending ? t("sending") : t("submit")}
          </button>
        )}
      </div>
    </div>
  );
}
