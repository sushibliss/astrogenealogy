import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { InvitePanel } from "@/components/InvitePanel";
import { Markdown } from "@/components/Markdown";
import { ReportIndex } from "@/components/ReportIndex";
import { StatusBadge } from "@/components/StatusBadge";
import { FamilyConstellation } from "@/components/FamilyConstellation";
import { PlacesMap } from "@/components/PlacesMap";
import { SkyHero } from "@/components/SkyHero";
import { SlowReveal } from "@/components/SlowReveal";
import { requestForUser } from "@/lib/access";
import { fullName } from "@/lib/people";
import { requireUser } from "@/lib/session";
import { unveilSeconds } from "@/lib/tree-timing";

const later = (seconds: number) => ({ "--rd": `${seconds}s` }) as React.CSSProperties;

export default async function RequestPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const access = requestForUser(id, user);
  if (!access) notFound();
  const { request, people, publication } = access;
  if (request.status === "draft" && access.isOwner) redirect({ href: `/requests/${id}/edit`, locale });

  const t = await getTranslations("request");
  const self = people.find((p) => p.path === "");
  const published = request.status === "published" && !!publication?.publishedAt;
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const base = `/requests/${id}`;

  const map = await PlacesMap({ people, locale });

  return (
    <SlowReveal after={published ? unveilSeconds(people.map((p) => p.path)) : 0}>
      <SkyHero
        eyebrow={
          <>
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
          </>
        }
        title={published ? publication!.title : t("titleFor", { name: (self && fullName(self)) || "—" })}
        sub={
          published ? (
            t("publishedOn", { date: fmt.format(publication!.publishedAt!) })
          ) : (
            <p className="notice mx-auto mt-2 max-w-2xl text-left text-ink">{t(`explain_${request.status}`)}</p>
          )
        }
        cue={published ? { label: t("readOn"), href: "#findings" } : undefined}
      >
        <FamilyConstellation people={people} locale={locale} base={base} />
        <p className="reveal-late mx-auto mt-3 max-w-xl text-center text-xs text-ink-faint" style={later(0.5)}>
          {t("treeLead")}
        </p>
      </SkyHero>

      {published && (
        <section id="findings" className="reveal-late scroll-mt-6" style={later(0.3)}>
          <div className="wrap grid gap-x-12 gap-y-6 py-16 lg:grid-cols-[14rem_1fr]">
            <h2 className="display text-3xl">{t("findings")}</h2>
            <Markdown>{publication!.body}</Markdown>
          </div>
        </section>
      )}

      {map && (
        <section className="reveal-late" style={later(0.6)}>
          <div className={`wrap pb-16 ${published ? "" : "pt-16"}`}>
            <h2 className="display text-3xl">{t("map")}</h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{t("mapLead")}</p>
            {map}
          </div>
        </section>
      )}

      <section className="reveal-late" style={later(0.9)}>
        <div className="wrap">
          <div className="rounded-[2rem] bg-paper-deep px-5 py-10 sm:px-10">
            <h2 className="display text-3xl">{t("reports")}</h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{t("reportsLead")}</p>
            <ReportIndex people={people} locale={locale} base={base} />
          </div>
        </div>
      </section>

      <section className="reveal-late no-print" style={later(1.1)}>
        <div className="wrap pt-14 pb-4">
          <h2 className="display mb-3 text-3xl">{t("share")}</h2>
          <InvitePanel requestId={id} locale={locale} published={published} />
        </div>
      </section>

      {request.focusNotes && (
        <section className="reveal-late" style={later(1.2)}>
          <div className="wrap py-10">
            <h2 className="eyebrow mb-2">{t("focus")}</h2>
            <p className="max-w-2xl whitespace-pre-wrap">{request.focusNotes}</p>
          </div>
        </section>
      )}
    </SlowReveal>
  );
}
