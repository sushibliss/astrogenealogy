import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Markdown } from "@/components/Markdown";
import { ReportIndex } from "@/components/ReportIndex";
import { FamilyConstellation } from "@/components/FamilyConstellation";
import { Starfield } from "@/components/Starfield";
import { requestForToken } from "@/lib/access";
import { isPrivateForGuests } from "@/lib/people";

export default async function ReadPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const access = requestForToken(token);
  if (!access) notFound();
  const { people, publication } = access;
  const t = await getTranslations("read");
  const tTree = await getTranslations("tree");
  const hiddenIds = new Set(people.filter(isPrivateForGuests).map((p) => p.id));
  const visible = people.filter((p) => !hiddenIds.has(p.id));
  const base = `/read/${token}`;
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  return (
    <div>
      <header className="wrap pt-12 pb-10">
        <p className="eyebrow mb-4 inline-block border border-ink px-2 py-0.5">{t("badge")}</p>
        <h1 className="display max-w-4xl text-4xl sm:text-6xl">{publication!.title}</h1>
        <p className="mt-4 text-ink-soft">{t("publishedOn", { date: fmt.format(publication!.publishedAt!) })}</p>
      </header>

      <section className="border-t border-ink">
        <div className="wrap grid gap-x-12 gap-y-6 py-12 lg:grid-cols-[14rem_1fr]">
          <h2 className="display text-3xl">{t("findings")}</h2>
          <Markdown>{publication!.body}</Markdown>
        </div>
      </section>

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
            hiddenIds={hiddenIds}
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

      {visible.length > 0 && (
        <section className="border-t border-ink bg-paper-deep">
          <div className="wrap py-12">
            <h2 className="display text-3xl">{t("reports")}</h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-ink-soft">{t("reportsLead")}</p>
            <ReportIndex people={visible} locale={locale} base={base} />
          </div>
        </section>
      )}
    </div>
  );
}
