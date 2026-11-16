"use client";

import { useActionState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { loginAction, registerAction } from "@/app/actions";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [state, action, pending] = useActionState(mode === "login" ? loginAction : registerAction, undefined);
  useEffect(() => {
    // a failed attempt must not be counted as a sign-up later
    if (state?.error) {
      try {
        sessionStorage.removeItem("signup-pending");
      } catch {}
    }
  }, [state]);
  return (
    <form
      action={action}
      className="grid gap-4"
      onSubmit={() => {
        // picked up on the dashboard, where a successful registration lands
        try {
          if (mode === "register") sessionStorage.setItem("signup-pending", "1");
        } catch {}
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      {mode === "register" && (
        <div>
          <label className="label" htmlFor="name">
            {t("name")}
          </label>
          <input id="name" name="name" className="field" autoComplete="name" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">
          {t("email")}
        </label>
        <input id="email" name="email" type="email" required className="field" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          className="field"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {mode === "register" && <p className="mt-1.5 text-xs text-ink-soft">{t("passwordHint")}</p>}
      </div>
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-ink px-4 py-2.5 text-sm text-paper">
          {t(`error_${state.error}`)}
        </p>
      )}
      <button className="btn mt-1" disabled={pending}>
        {mode === "login" ? t("loginCta") : t("registerCta")}
      </button>
    </form>
  );
}
