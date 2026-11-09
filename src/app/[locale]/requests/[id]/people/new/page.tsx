import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PersonEditor } from "@/components/PersonEditor";
import { requestForUser } from "@/lib/access";
import { PATH_RE, fullName, relationLabel } from "@/lib/people";
import { emptyPerson } from "@/lib/person-input";
import { requireAdmin } from "@/lib/session";

/** Researcher-only: add an ancestor found during research. */
export default async function NewPerson({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { locale, id } = await params;
  const { path = "" } = await searchParams;
  setRequestLocale(locale);
  const user = await requireAdmin(locale);
  const access = requestForUser(id, user);
  if (!access || !path || !PATH_RE.test(path)) notFound();
  const child = access.people.find((p) => p.path === path.slice(0, -1));
  if (!child || access.people.some((p) => p.path === path)) notFound();
  const t = await getTranslations("person");
  return (
    <div className="wrap max-w-3xl py-12">
      <p className="eyebrow mb-2">{t("newEyebrow")}</p>
      <h1 className="display mb-2 text-4xl">{relationLabel(path, locale)}</h1>
      <p className="mb-8 text-ink-soft">
        {t("parentOf", { side: path.endsWith("f") ? t("father") : t("mother"), name: fullName(child) || relationLabel(child.path, locale) })}
      </p>
      <PersonEditor requestId={id} personId={null} initial={{ ...emptyPerson(path), living: "deceased" }} returnTo="admin" />
    </div>
  );
}
