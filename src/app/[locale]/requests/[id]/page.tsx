import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { InvitePanel } from "@/components/InvitePanel";
import { Findings } from "@/components/Findings";
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

  const status = (
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
  );

  return (
    <SlowReveal after={published ? unveilSeconds(people.map((p) => p.path)) : 0}>
      {/* until the findings are out, the status comes first; afterwards the sky does */}
      {!published && (
        <header className="wrap-wide pt-14 pb-10">
          {status}
          <h1 className="display max-w-4xl text-4xl sm:text-6xl">{t("titleFor", { name: (self && fullName(self)) || "—" })}</h1>
          <p className="notice mt-6 max-w-2xl">{t(`explain_${request.status}`)}</p>
        </header>
      )}
      <SkyHero cue={published ? { label: t("readOn"), href: "#findings" } : undefined}>
        <FamilyConstellation people={people} locale={locale} base={base} />
      </SkyHero>

      {published && (
        <Findings
          style={later(0.3)}
          heading={
            <header>
              {status}
              <h1 className="display text-4xl sm:text-5xl xl:text-[2rem] xl:leading-[1.08] 2xl:text-4xl">{publication!.title}</h1>
              <p className="mt-4 text-sm text-ink-soft">{t("publishedOn", { date: fmt.format(publication!.publishedAt!) })}</p>
            </header>
          }
          body={publication!.body}
          people={people}
          locale={locale}
          sections={[...(map ? [{ href: "#places", label: t("map") }] : []), { href: "#reports", label: t("reports") }, { href: "#share", label: t("share") }]}
        />
      )}

      {map && (
        <section id="places" className="reveal-late scroll-mt-10" style={later(0.6)}>
          <div className={`wrap-wide pb-20 ${published ? "" : "pt-16"}`}>
            <h2 className="display text-4xl">{t("map")}</h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{t("mapLead")}</p>
            {map}
          </div>
        </section>
      )}

      <section id="reports" className="reveal-late scroll-mt-10" style={later(0.9)}>
        <div className="wrap-wide">
          <div className="rounded-[2rem] bg-paper-deep px-5 py-10 sm:px-10">
            <h2 className="display text-4xl">{t("reports")}</h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{t("reportsLead")}</p>
            <ReportIndex people={people} locale={locale} base={base} />
          </div>
        </div>
      </section>

      <section id="share" className="reveal-late no-print scroll-mt-10" style={later(1.1)}>
        <div className={`wrap-wide grid gap-6 pt-6 ${request.focusNotes ? "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : ""}`}>
          <div className="card p-6 sm:p-8">
            <h2 className="display mb-3 text-3xl">{t("share")}</h2>
            <InvitePanel requestId={id} locale={locale} published={published} />
          </div>
          {request.focusNotes && (
            <div className="card self-start p-6 sm:p-8">
              <h2 className="eyebrow mb-3">{t("focus")}</h2>
              <p className="display text-xl leading-snug whitespace-pre-wrap">{request.focusNotes}</p>
            </div>
          )}
        </div>
      </section>
    </SlowReveal>
  );
}
