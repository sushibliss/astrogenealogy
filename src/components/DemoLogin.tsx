import { getTranslations } from "next-intl/server";
import { demoLoginAction } from "@/app/actions";

/** The two sample sign-in buttons: a requester with a published request, and the admin. */
export async function DemoLogin({ locale, compact = false }: { locale: string; compact?: boolean }) {
  const t = await getTranslations("auth");
  return (
    <div className={compact ? "flex flex-wrap gap-2" : "grid gap-3"}>
      {(["user", "admin"] as const).map((role) => (
        <form key={role} action={demoLoginAction}>
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="locale" value={locale} />
          {compact ? (
            <button className="btn-ghost btn-sm bg-paper">{t(`demo_${role}`)}</button>
          ) : (
            <button className={`${role === "user" ? "btn" : "btn-ghost"} w-full flex-col !items-start !gap-0 text-left`}>
              <span>{t(`demo_${role}`)}</span>
              <span className="font-mono text-[0.6875rem] font-normal opacity-70">{t(`demo_${role}_hint`)}</span>
            </button>
          )}
        </form>
      ))}
    </div>
  );
}
