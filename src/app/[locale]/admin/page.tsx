import { desc, eq, ne } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { db, schema } from "@/db";
import type { RequestStatus } from "@/db/schema";
import { fullName } from "@/lib/people";
import { requireAdmin } from "@/lib/session";

const ORDER: RequestStatus[] = ["submitted", "in_research", "published"];

export default async function AdminQueue({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const t = await getTranslations("admin");
  const tStatus = await getTranslations("status");
  const rows = db
    .select({ request: schema.requests, owner: schema.users })
    .from(schema.requests)
    .innerJoin(schema.users, eq(schema.users.id, schema.requests.ownerId))
    .where(ne(schema.requests.status, "draft"))
    .orderBy(desc(schema.requests.submittedAt))
    .all();
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="wrap py-12">
      <p className="eyebrow mb-2">{t("eyebrow")}</p>
      <h1 className="display text-5xl">{t("queueTitle")}</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">{t("queueLead")}</p>

      {rows.length === 0 && <p className="notice mt-8 max-w-xl">{t("queueEmpty")}</p>}

      {ORDER.map((status) => {
        const group = rows.filter((r) => r.request.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status} className="mt-10">
            <h2 className="eyebrow mb-2">
              {tStatus(status)} · {group.length}
            </h2>
            <ul className="border-t border-hair">
              {group.map(({ request, owner }) => {
                const self = db
                  .select()
                  .from(schema.people)
                  .where(eq(schema.people.requestId, request.id))
                  .all()
                  .find((p) => p.path === "");
                return (
                  <li key={request.id} className="border-b border-hair">
                    <Link
                      href={`/admin/requests/${request.id}`}
                      className="group grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <span>
                        <span className="block text-lg font-bold group-hover:underline underline-offset-4">
                          {(self && fullName(self)) || owner.name || owner.email}
                        </span>
                        <span className="block font-mono text-xs text-ink-soft">
                          {owner.email} · {request.submittedAt ? fmt.format(request.submittedAt) : ""}
                        </span>
                        {request.focusNotes && <span className="mt-1 block max-w-3xl truncate text-sm text-ink-soft">{request.focusNotes}</span>}
                      </span>
                      <span className="flex items-center gap-4">
                        <StatusBadge status={request.status} />
                        <span aria-hidden className="text-xl">
                          →
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
