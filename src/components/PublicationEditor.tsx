"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import { savePublicationAction } from "@/app/actions";

export function PublicationEditor({
  requestId,
  initialTitle,
  initialBody,
  isPublished,
}: {
  requestId: string;
  initialTitle: string;
  initialBody: string;
  isPublished: boolean;
}) {
  const t = useTranslations("admin");
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (publish: boolean) =>
    start(async () => {
      setMessage(null);
      const res = await savePublicationAction(requestId, title, body, publish);
      setMessage(res.error ? t(`pubError_${res.error}`) : publish ? t("pubPublished") : t("pubSaved"));
    });

  return (
    <div className="grid gap-4">
      <div>
        <label className="label" htmlFor="pub-title">
          {t("pubTitle")}
        </label>
        <input id="pub-title" className="field text-lg font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <div className="mb-1.5 flex items-end justify-between">
          <label className="label !mb-0" htmlFor="pub-body">
            {t("pubBody")}
          </label>
          <div className="flex border border-ink font-mono text-[0.6875rem] uppercase tracking-[0.1em]">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={`cursor-pointer px-2.5 py-1 ${!preview ? "bg-ink text-paper" : ""}`}
            >
              {t("write")}
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={`cursor-pointer border-l border-ink px-2.5 py-1 ${preview ? "bg-ink text-paper" : ""}`}
            >
              {t("preview")}
            </button>
          </div>
        </div>
        {preview ? (
          <div className="card min-h-80 p-5">
            <div className="prose-origen">
              <ReactMarkdown>{body || "…"}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            id="pub-body"
            rows={18}
            className="field font-mono text-sm leading-relaxed"
            placeholder={t("pubPlaceholder")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn" disabled={pending} onClick={() => save(true)}>
          {isPublished ? t("pubUpdate") : t("pubPublish")}
        </button>
        {!isPublished && (
          <button type="button" className="btn-ghost" disabled={pending} onClick={() => save(false)}>
            {t("pubSaveDraft")}
          </button>
        )}
        {message && (
          <span role="status" className="font-mono text-xs">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
