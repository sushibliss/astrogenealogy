import { desc, eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { db, schema } from "@/db";
import { fullName } from "@/lib/people";
import { requireUser } from "@/lib/session";

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations("dashboard");
  const requests = db
    .select()
    .from(schema.requests)
    .where(eq(schema.requests.ownerId, user.id))
    .orderBy(desc(schema.requests.updatedAt))
    .all();
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="wrap py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{user.name || user.email}</p>
          <h1 className="display text-5xl">{t("title")}</h1>
        </div>
        <Link href="/requests/new" className="btn">
          {t("new")}
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="card mt-10 max-w-xl p-8">
          <h2 className="display text-2xl">{t("emptyTitle")}</h2>
          <p className="mt-2 text-ink-soft">{t("emptyBody")}</p>
          <Link href="/requests/new" className="btn mt-5">
            {t("new")}
          </Link>
        </div>
      ) : (
        <ul className="mt-10 border-t border-hair">
          {requests.map((r) => {
            const people = db.select().from(schema.people).where(eq(schema.people.requestId, r.id)).all();
            const self = people.find((p) => p.path === "");
            const pub = db.select().from(schema.publications).where(eq(schema.publications.requestId, r.id)).get();
            const title =
              (r.status === "published" && pub?.title) || t("requestFor", { name: (self && fullName(self)) || "—" });
            return (
              <li key={r.id} className="border-b border-hair">
                <Link
                  href={r.status === "draft" ? `/requests/${r.id}/edit` : `/requests/${r.id}`}
                  className="group grid gap-x-6 gap-y-2 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <span>
                    <span className="block text-xl font-bold group-hover:underline underline-offset-4">{title}</span>
                    <span className="mt-1 block font-mono text-xs text-ink-soft">
                      {t("peopleCount", { count: people.length })} · {t("updated")} {fmt.format(r.updatedAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
                    <StatusBadge status={r.status} />
                    <span aria-hidden className="text-xl">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
