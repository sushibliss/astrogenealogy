import { eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { unsubscribeAction } from "@/app/actions";
import { Article } from "@/components/Article";
import { db, schema } from "@/db";

/** Reached from the link in every email. "done" is the page shown afterwards. */
export default async function UnsubscribePage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("mk");
  const found = token !== "done" && !!db.select().from(schema.subscribers).where(eq(schema.subscribers.token, token)).get();
  return (
    <Article title={t("unsubTitle")}>
      {found ? (
        <form action={unsubscribeAction}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="locale" value={locale} />
          <p className="mb-5 text-ink-soft">{t("unsubBody")}</p>
          <button className="btn">{t("unsubConfirm")}</button>
        </form>
      ) : (
        <p className="notice max-w-md">{t("unsubDone")}</p>
      )}
    </Article>
  );
}
