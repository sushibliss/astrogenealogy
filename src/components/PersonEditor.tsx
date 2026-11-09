"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { savePersonAction } from "@/app/actions";
import type { PersonInput } from "@/lib/person-input";
import { PersonFields } from "./PersonFields";

export function PersonEditor({
  requestId,
  personId,
  initial,
  returnTo,
}: {
  requestId: string;
  personId: string | null;
  initial: PersonInput;
  returnTo: "request" | "admin";
}) {
  const t = useTranslations("person");
  const locale = useLocale();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const res = await savePersonAction(locale, requestId, personId, value, returnTo);
          if (res?.error) setError(res.error);
        });
      }}
    >
      <div className="card p-5 sm:p-6">
        <PersonFields value={value} onChange={setValue} />
      </div>
      {error && (
        <p role="alert" className="mt-4 border border-ink bg-ink px-4 py-2 text-sm text-paper">
          {t("saveError")}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button className="btn" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </button>
        <button type="button" className="btn-ghost" onClick={() => history.back()}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
