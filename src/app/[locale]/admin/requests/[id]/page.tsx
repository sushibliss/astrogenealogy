import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { deletePersonAction, setStatusAction } from "@/app/actions";
import { InvitePanel } from "@/components/InvitePanel";
import { PublicationEditor } from "@/components/PublicationEditor";
import { StatusBadge } from "@/components/StatusBadge";
import { db, schema } from "@/db";
import { Link } from "@/i18n/navigation";
import { requestForUser } from "@/lib/access";
import { formatPartialDate, fullName, relationLabel } from "@/lib/people";
import { requireAdmin } from "@/lib/session";

export default async function AdminRequest({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireAdmin(locale);
  const access = requestForUser(id, user);
  if (!access || access.request.status === "draft") notFound();
  const { request, people, publication } = access;
  const t = await getTranslations("admin");
  const tStatus = await getTranslations("status");
  const tPerson = await getTranslations("person");
  const owner = db.select().from(schema.users).where(eq(schema.users.id, request.ownerId)).get();
  const self = people.find((p) => p.path === "");
  const paths = new Set(people.map((p) => p.path));
  const isPublished = !!publication?.publishedAt;
  const hasDescendantInTree = (path: string) => people.some((p) => p.path.length > path.length && p.path.startsWith(path));

  return (
    <div>
      <header className="wrap pt-12 pb-8">
        <Link href="/admin" className="link text-sm">
          ← {t("backToQueue")}
        </Link>
        <div className="mt-5 mb-3 flex flex-wrap items-center gap-3">
          <StatusBadge status={request.status} />
          <span className="eyebrow">{owner?.email}</span>
        </div>
        <h1 className="display text-4xl sm:text-5xl">{(self && fullName(self)) || owner?.name || "—"}</h1>
        {request.focusNotes && (
          <blockquote className="notice mt-5 max-w-2xl whitespace-pre-wrap">
            <span className="eyebrow mb-1 block">{t("focus")}</span>
            {request.focusNotes}
          </blockquote>
        )}
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <form action={setStatusAction} className="flex items-end gap-2">
            <input type="hidden" name="requestId" value={id} />
            <div>
              <label className="label" htmlFor="status">
                {t("status")}
              </label>
              <select id="status" name="status" defaultValue={request.status} className="field !w-auto">
                <option value="submitted">{tStatus("submitted")}</option>
                <option value="in_research">{tStatus("in_research")}</option>
                <option value="published" disabled={!isPublished}>
                  {tStatus("published")}
                </option>
              </select>
            </div>
            <button className="btn-ghost">{t("setStatus")}</button>
          </form>
          <Link href={`/requests/${id}`} className="btn-ghost">
            {t("viewAsRequester")}
          </Link>
        </div>
      </header>

      <section className="border-t border-hair">
        <div className="wrap py-10">
          <h2 className="display text-3xl">{t("people")}</h2>
          <p className="mt-2 mb-5 max-w-2xl text-sm text-ink-soft">{t("peopleLead")}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-y border-hair text-left">
                  {[t("colRelation"), t("colName"), t("colBirth"), t("colDeath"), ""].map((h, i) => (
                    <th key={i} className="eyebrow px-2 py-2 font-normal first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id} className="border-b border-hair align-top">
                    <td className="py-2.5 pr-2">
                      {relationLabel(p.path, locale)}
                      {p.source === "research" && (
                        <span className="ml-1.5 rounded-full border border-ink px-2 font-mono text-[0.625rem] uppercase">{t("found")}</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 font-semibold">
                      {fullName(p) || <span className="font-normal text-ink-faint">{tPerson("unknownName")}</span>}
                      {p.notes && <span className="mt-0.5 block max-w-xs text-xs font-normal text-ink-soft">{p.notes}</span>}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs">
                      {[formatPartialDate(p.birthDate, locale), p.birthTime, p.birthPlace].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs">
                      {p.living === "alive"
                        ? tPerson("living_alive")
                        : [formatPartialDate(p.deathDate, locale), p.deathPlace].filter(Boolean).join(" · ") ||
                          tPerson(`living_${p.living}`)}
                    </td>
                    <td className="py-2.5 pl-2">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {p.path.length < 8 &&
                          (["f", "m"] as const)
                            .filter((side) => !paths.has(p.path + side))
                            .map((side) => (
                              <Link
                                key={side}
                                href={`/requests/${id}/people/new?path=${p.path + side}`}
                                className="btn-ghost btn-sm"
                              >
                                + {side === "f" ? tPerson("father") : tPerson("mother")}
                              </Link>
                            ))}
                        <Link href={`/requests/${id}/people/${p.id}/edit?from=admin`} className="btn-ghost btn-sm">
                          {t("edit")}
                        </Link>
                        <Link href={`/requests/${id}/people/${p.id}`} className="btn-ghost btn-sm">
                          {t("report")}
                        </Link>
                        {p.source === "research" && !hasDescendantInTree(p.path) && (
                          <form action={deletePersonAction}>
                            <input type="hidden" name="requestId" value={id} />
                            <input type="hidden" name="personId" value={p.id} />
                            <button className="btn-ghost btn-sm">{t("remove")}</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-hair bg-paper-deep">
        <div className="wrap max-w-4xl py-10">
          <h2 className="display text-3xl">{t("publication")}</h2>
          <p className="mt-2 mb-5 max-w-2xl text-sm text-ink-soft">{isPublished ? t("publicationLive") : t("publicationLead")}</p>
          <PublicationEditor
            requestId={id}
            initialTitle={publication?.title ?? ""}
            initialBody={publication?.body ?? ""}
            isPublished={isPublished}
          />
        </div>
      </section>

      <section className="border-t border-hair">
        <div className="wrap py-10">
          <h2 className="display mb-3 text-3xl">{t("invites")}</h2>
          <InvitePanel requestId={id} locale={locale} published={request.status === "published" && isPublished} />
        </div>
      </section>
    </div>
  );
}
