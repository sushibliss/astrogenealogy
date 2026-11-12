import { SkyDrift } from "./SkyDrift";
import { Starfield } from "./Starfield";

/**
 * The opening scene of a request: a night sky, always dark, with the title
 * above and the family tree (the children) drawing itself in the middle.
 */
export function SkyHero({
  eyebrow,
  title,
  sub,
  children,
  cue,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  sub?: React.ReactNode;
  children: React.ReactNode;
  /** label of the "read on" link that appears once the tree is drawn */
  cue?: { label: string; href: string };
}) {
  return (
    <section className="night sky-hero relative overflow-hidden rounded-b-[2.5rem]">
      <SkyDrift>
        <div className="sky-layer sky-far">
          <Starfield count={90} seed={11} />
        </div>
        <div className="sky-layer sky-near">
          <Starfield count={36} seed={41} shooting />
        </div>
      </SkyDrift>
      <div className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-[100rem] flex-col px-4 pt-9 pb-7 sm:px-8">
        <header className="sky-title mx-auto max-w-3xl text-center">
          {eyebrow && <div className="mb-4 flex flex-wrap items-center justify-center gap-3">{eyebrow}</div>}
          <h1 className="display text-3xl sm:text-5xl">{title}</h1>
          {sub && <div className="mt-3 text-sm text-ink-soft">{sub}</div>}
        </header>
        <div className="mt-2 flex-1">{children}</div>
        {cue && (
          <a href={cue.href} className="reveal-late scroll-cue mx-auto mt-6 flex flex-col items-center gap-1" style={{ "--rd": "0.9s" } as React.CSSProperties}>
            <span className="eyebrow">{cue.label}</span>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
        )}
      </div>
    </section>
  );
}
