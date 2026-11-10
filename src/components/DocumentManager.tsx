"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteDocumentAction } from "@/app/actions";

type Doc = { id: string; title: string; kind: "file" | "link"; href: string };

/** Researcher-only: attach PDFs or links to a person, and remove them. */
export function DocumentManager({ requestId, personId, documents }: { requestId: string; personId: string; documents: Doc[] }) {
  const t = useTranslations("docs");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = new FormData(e.currentTarget);
    body.set("requestId", requestId);
    body.set("personId", personId);
    start(async () => {
      setError(null);
      try {
        const res = await fetch("/api/documents", { method: "POST", body });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(typeof data.error === "string" ? data.error : "failed");
          return;
        }
        formRef.current?.reset();
        router.refresh();
      } catch {
        setError("failed");
      }
    });
  };

  return (
    <section className="mt-12 border-t border-ink pt-8">
      <h2 className="display text-3xl">{t("title")}</h2>
      <p className="mt-2 mb-5 max-w-2xl text-sm text-ink-soft">{t("lead")}</p>

      {documents.length === 0 ? (
        <p className="mb-6 text-sm text-ink-soft">{t("none")}</p>
      ) : (
        <ul className="mb-6 border-t border-ink">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 border-b border-hair py-2.5 text-sm">
              <span className="border border-current px-1 font-mono text-[0.5625rem] uppercase tracking-[0.1em]">
                {doc.kind === "file" ? "PDF" : "URL"}
              </span>
              <a href={doc.href} target="_blank" rel="noopener noreferrer" className="link min-w-0 flex-1">
                {doc.title}
              </a>
              <form action={deleteDocumentAction}>
                <input type="hidden" name="documentId" value={doc.id} />
                <button className="link cursor-pointer text-ink-soft">{t("remove")}</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} onSubmit={submit} className="card grid gap-4 p-5">
        <div>
          <label className="label" htmlFor="doc-title">
            {t("titleField")}
          </label>
          <input id="doc-title" name="title" required maxLength={160} className="field" placeholder={t("titlePlaceholder")} />
        </div>
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <label className="label" htmlFor="doc-file">
              {t("file")}
            </label>
            <input id="doc-file" name="file" type="file" accept="application/pdf,.pdf" className="field text-sm file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-1 file:text-paper" />
          </div>
          <span className="eyebrow pb-3 text-center">{t("or")}</span>
          <div>
            <label className="label" htmlFor="doc-url">
              {t("url")}
            </label>
            <input id="doc-url" name="url" type="url" className="field" placeholder="https://" />
          </div>
        </div>
        {error && (
          <p role="alert" className="border border-ink bg-ink px-4 py-2 text-sm text-paper">
            {t(`error_${["title", "size", "type", "url", "empty", "forbidden"].includes(error) ? error : "failed"}`)}
          </p>
        )}
        <div>
          <button className="btn" disabled={pending}>
            {pending ? t("adding") : t("add")}
          </button>
        </div>
      </form>
    </section>
  );
}
