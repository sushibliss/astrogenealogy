import { and, desc, eq, isNull } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { createInviteAction, revokeInviteAction } from "@/app/actions";
import { db, schema } from "@/db";
import { CopyLink } from "./CopyLink";

export async function InvitePanel({ requestId, locale, published }: { requestId: string; locale: string; published: boolean }) {
  const t = await getTranslations("invites");
  const invites = db
    .select()
    .from(schema.invites)
    .where(and(eq(schema.invites.requestId, requestId), isNull(schema.invites.revokedAt)))
    .orderBy(desc(schema.invites.createdAt))
    .all();
  return (
    <div>
      <p className="max-w-2xl text-ink-soft">{t("lead")}</p>
      {!published && <p className="notice mt-4 max-w-2xl">{t("notYet")}</p>}
      <form action={createInviteAction} className="mt-5 flex max-w-xl flex-wrap items-end gap-3">
        <input type="hidden" name="requestId" value={requestId} />
        <div className="min-w-48 flex-1">
          <label className="label" htmlFor="invite-label">
            {t("labelField")}
          </label>
          <input id="invite-label" name="label" className="field" placeholder={t("labelPlaceholder")} maxLength={120} />
        </div>
        <button className="btn">{t("create")}</button>
      </form>
      {invites.length > 0 && (
        <ul className="mt-6 max-w-3xl border-t border-hair">
          {invites.map((inv) => (
            <li key={inv.id} className="grid gap-x-4 gap-y-2 border-b border-hair py-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center">
              <span className="truncate font-semibold">{inv.label || t("unnamed")}</span>
              <CopyLink path={`/${locale}/read/${inv.token}`} copyLabel={t("copy")} copiedLabel={t("copied")} />
              <form action={revokeInviteAction}>
                <input type="hidden" name="inviteId" value={inv.id} />
                <button className="link cursor-pointer text-sm text-ink-soft">{t("revoke")}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
