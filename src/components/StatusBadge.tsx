import { getTranslations } from "next-intl/server";
import type { RequestStatus } from "@/db/schema";

export async function StatusBadge({ status }: { status: RequestStatus }) {
  const t = await getTranslations("status");
  const filled = status === "published";
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] ${
        filled ? "border-accent bg-accent text-paper" : "border-ink"
      }`}
    >
      <span aria-hidden className="tracking-normal">
        {{ draft: "○○○", submitted: "●○○", in_research: "●●○", published: "●●●" }[status]}
      </span>
      {t(status)}
    </span>
  );
}
