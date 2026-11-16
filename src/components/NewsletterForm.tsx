"use client";

import { useActionState, useEffect } from "react";
import { useLocale } from "next-intl";
import { subscribeAction } from "@/app/actions";
import { track } from "@/lib/track";

type Labels = Record<"email" | "placeholder" | "consent" | "submit" | "done" | "error", string>;

/** Email sign-up. The address is stored in the app's own database and nowhere else. */
export function NewsletterForm({ source, labels }: { source: string; labels: Labels }) {
  const locale = useLocale();
  const [state, action, pending] = useActionState(subscribeAction, undefined);
  useEffect(() => {
    if (state?.ok) track("newsletter_signup", { source });
  }, [state, source]);

  if (state?.ok) return <p className="notice max-w-md">{labels.done}</p>;
  return (
    <form action={action} className="grid max-w-md gap-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="source" value={source} />
      {/* left empty by people, filled in by bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor={`nl-${source}`}>
          {labels.email}
        </label>
        <input id={`nl-${source}`} name="email" type="email" required autoComplete="email" placeholder={labels.placeholder} className="field min-w-0 flex-1" />
        <button className="btn" disabled={pending}>
          {labels.submit}
        </button>
      </div>
      <label className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-0.5 accent-[var(--color-accent)]" />
        <span>{labels.consent}</span>
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-accent">
          {labels.error}
        </p>
      )}
    </form>
  );
}
