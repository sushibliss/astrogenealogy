import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { InvitePanel } from "@/components/InvitePanel";
import { Markdown } from "@/components/Markdown";
import { ReportIndex } from "@/components/ReportIndex";
import { StatusBadge } from "@/components/StatusBadge";
import { FamilyConstellation } from "@/components/FamilyConstellation";
import { Starfield } from "@/components/Starfield";
import { requestForUser } from "@/lib/access";
import { fullName } from "@/lib/people";
import { requireUser } from "@/lib/session";

export default async function RequestPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const access = requestForUser(id, user);
  if (!access) notFound();
  const { request, people, publication } = access;
  if (request.status === "draft" && access.isOwner) redirect({ href: `/requests/${id}/edit`, locale });

  const t = await getTranslations("request");
  const tTree = await getTranslations("tree");
  const self = people.find((p) => p.path === "");
  const published = request.status === "published" && !!publication?.publishedAt;
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const base = `/requests/${id}`;

  return (
    <div>
      <header className="wrap pt-12 pb-10">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={request.status} />
          {request.submittedAt && (
            <span className="eyebrow">
              {t("submittedOn")} {fmt.format(request.submittedAt)}
            </span>
          )}
          {access.isAdmin && (
            <Link href={`/admin/requests/${id}`} className="btn-ghost btn-sm no-print">
              {t("openAdmin")}
            </Link>
          )}
        </div>
        <h1 className="display max-w-4xl text-4xl sm:text-6xl">
          {published ? publication!.title : t("titleFor", { name: (self && fullName(self)) || "—" })}
        </h1>
        {published ? (
          <p className="mt-4 text-ink-soft">
            {t("publishedOn", { date: fmt.format(publication!.publishedAt!) })}
          </p>
        ) : (
          <p className="notice mt-6 max-w-2xl">{t(`explain_${request.status}`)}</p>
        )}
      </header>

      {published && (
        <section className="border-t border-ink">
          <div className="wrap grid gap-x-12 gap-y-6 py-12 lg:grid-cols-[14rem_1fr]">
            <h2 className="display text-3xl">{t("findings")}</h2>
            <Markdown>{publication!.body}</Markdown>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden border-t border-ink">
        <Starfield count={54} seed={41} shooting />
        <div className="wrap relative py-14">
          <div className="mb-2 text-center">
            <h2 className="display text-4xl sm:text-5xl">{t("tree")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-ink-soft">{t("treeLead")}</p>
          </div>
          <FamilyConstellation
            people={people}
            locale={locale}
            hrefFor={(p) => `${base}/people/${p.id}`}
            labels={{
              unknown: tTree("unknown"),
              living: tTree("living"),
              deeper: tTree("deeper"),
              legendIntake: tTree("legendIntake"),
              legendResearch: tTree("legendResearch"),
              legendUnknown: tTree("legendUnknown"),
              title: tTree("title"),
            }}
          />
        </div>
      </section>

      <section className="border-t border-ink bg-paper-deep">
        <div className="wrap py-12">
          <h2 className="display text-3xl">{t("reports")}</h2>
          <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{t("reportsLead")}</p>
          <ReportIndex people={people} locale={locale} base={base} />
        </div>
      </section>

      <section className="no-print border-t border-ink">
        <div className="wrap py-12">
          <h2 className="display mb-3 text-3xl">{t("share")}</h2>
          <InvitePanel requestId={id} locale={locale} published={published} />
        </div>
      </section>

      {request.focusNotes && (
        <section className="border-t border-ink">
          <div className="wrap py-10">
            <h2 className="eyebrow mb-2">{t("focus")}</h2>
            <p className="max-w-2xl whitespace-pre-wrap">{request.focusNotes}</p>
          </div>
        </section>
      )}
    </div>
  );
}
