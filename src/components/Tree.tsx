import { Link } from "@/i18n/navigation";
import type { Person } from "@/db/schema";
import { fullName, lifespan, relationLabel } from "@/lib/people";

export type TreeLabels = { unknown: string; living: string; deeper: string; research: string };

const MAX_DEPTH = 4;

function slot(path: string) {
  // row index of a path within its generation: f = 0, m = 1 at each step
  return path.split("").reduce((n, c) => n * 2 + (c === "m" ? 1 : 0), 0);
}

/**
 * Light pedigree sketch: one column per generation, the requester on the left.
 * `hidden` people (living, for guests) are shown by relationship only.
 */
export function Tree({
  people,
  locale,
  labels,
  hrefFor,
  currentId,
  hiddenIds,
  compact = false,
}: {
  people: Person[];
  locale: string;
  labels: TreeLabels;
  hrefFor?: (p: Person) => string | null;
  currentId?: string;
  hiddenIds?: Set<string>;
  compact?: boolean;
}) {
  const depth = Math.min(MAX_DEPTH, Math.max(0, ...people.map((p) => p.path.length)));
  const rows = 2 ** depth;
  const inGrid = people.filter((p) => p.path.length <= MAX_DEPTH);
  const deeper = people.filter((p) => p.path.length > MAX_DEPTH);

  const cell = (p: Person) => {
    const hidden = hiddenIds?.has(p.id);
    const name = hidden ? labels.living : fullName(p) || labels.unknown;
    const href = hidden ? null : (hrefFor?.(p) ?? null);
    const current = p.id === currentId;
    const body = (
      <>
        <span className="eyebrow block truncate !text-[0.625rem] !text-current opacity-70">
          {relationLabel(p.path, locale).replace(/ \(.*\)$/, "")}
          {p.source === "research" && <span title={labels.research}> ✦</span>}
        </span>
        <span className={`block truncate font-semibold leading-tight ${compact ? "text-[0.8125rem]" : "text-sm"}`}>
          {name}
        </span>
        {!hidden && !compact && (
          <span className="block truncate font-mono text-[0.6875rem] opacity-70">{lifespan(p) || " "}</span>
        )}
      </>
    );
    const cls = `block w-full rounded-xl border px-3 ${compact ? "py-1" : "py-1.5"} text-left fade-colors ${
      current ? "border-accent bg-accent text-paper" : "border-hair bg-paper-light"
    } ${href && !current ? "hover:border-accent hover:bg-accent hover:text-paper" : ""}`;
    return href ? (
      <Link href={href} className={cls} aria-current={current ? "page" : undefined}>
        {body}
      </Link>
    ) : (
      <div className={`${cls} ${hidden ? "border-dashed" : ""}`}>{body}</div>
    );
  };

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div
          className="grid gap-x-5 gap-y-1.5"
          style={{
            gridTemplateColumns: `repeat(${depth + 1}, minmax(${compact ? 132 : 158}px, 1fr))`,
            gridTemplateRows: `repeat(${rows}, auto)`,
            minWidth: (depth + 1) * (compact ? 150 : 176),
          }}
        >
          {inGrid.map((p) => {
            const span = rows / 2 ** p.path.length;
            return (
              <div
                key={p.id}
                className="relative flex items-center"
                style={{
                  gridColumn: p.path.length + 1,
                  gridRow: `${slot(p.path) * span + 1} / span ${span}`,
                }}
              >
                {p.path.length > 0 && <span aria-hidden className="absolute -left-5 top-1/2 w-5 border-t border-hair" />}
                {cell(p)}
              </div>
            );
          })}
        </div>
      </div>
      {deeper.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow mb-2">{labels.deeper}</p>
          <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {deeper.map((p) => (
              <li key={p.id}>{cell(p)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
