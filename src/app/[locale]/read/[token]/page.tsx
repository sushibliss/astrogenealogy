import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Markdown } from "@/components/Markdown";
import { ReportIndex } from "@/components/ReportIndex";
import { FamilyConstellation } from "@/components/FamilyConstellation";
import { PlacesMap } from "@/components/PlacesMap";
import { SkyHero } from "@/components/SkyHero";
import { SlowReveal } from "@/components/SlowReveal";
import { requestForToken } from "@/lib/access";
import { isPrivateForGuests } from "@/lib/people";
import { unveilSeconds } from "@/lib/tree-timing";

const later = (seconds: number) => ({ "--rd": `${seconds}s` }) as React.CSSProperties;

export default async function ReadPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const access = requestForToken(token);
  if (!access) notFound();
  const { people, publication } = access;
  const t = await getTranslations("read");
  const hiddenIds = new Set(people.filter(isPrivateForGuests).map((p) => p.id));
  const visible = people.filter((p) => !hiddenIds.has(p.id));
  const base = `/read/${token}`;
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  // living relatives stay off the map, as they do everywhere else for guests
  const map = await PlacesMap({ people: visible, locale });

  return (
    <SlowReveal after={unveilSeconds(people.map((p) => p.path))}>
      {/* the sky and the tree come first; everything else waits for them */}
      <SkyHero
        eyebrow={<p className="pill">{t("badge")}</p>}
        title={publication!.title}
        sub={t("publishedOn", { date: fmt.format(publication!.publishedAt!) })}
        cue={{ label: t("readOn"), href: "#findings" }}
      >
        <FamilyConstellation people={people} locale={locale} base={base} hiddenIds={hiddenIds} token={token} />
        <p className="reveal-late mx-auto mt-3 max-w-xl text-center text-xs text-ink-faint" style={later(0.5)}>
          {t("treeLead")}
        </p>
      </SkyHero>

      <section id="findings" className="reveal-late scroll-mt-6" style={later(0.3)}>
        <div className="wrap grid gap-x-12 gap-y-6 py-16 lg:grid-cols-[14rem_1fr]">
          <h2 className="display text-3xl">{t("findings")}</h2>
          <Markdown>{publication!.body}</Markdown>
        </div>
      </section>

      {map && (
        <section className="reveal-late" style={later(0.6)}>
          <div className="wrap pb-16">
            <h2 className="display text-3xl">{t("map")}</h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{t("mapLead")}</p>
            {map}
          </div>
        </section>
      )}

      {visible.length > 0 && (
        <section className="reveal-late" style={later(0.9)}>
          <div className="wrap">
            <div className="rounded-[2rem] bg-paper-deep px-5 py-10 sm:px-10">
              <h2 className="display text-3xl">{t("reports")}</h2>
              <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{t("reportsLead")}</p>
              <ReportIndex people={visible} locale={locale} base={base} />
            </div>
          </div>
        </section>
      )}
    </SlowReveal>
  );
}
