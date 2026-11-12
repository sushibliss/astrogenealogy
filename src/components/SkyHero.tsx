import { SkyDrift } from "./SkyDrift";
import { Starfield } from "./Starfield";

/**
 * The opening scene of a request: nothing but a night sky, always dark, with
 * the family tree (the children) drawing itself across it.
 */
export function SkyHero({
  children,
  cue,
}: {
  children: React.ReactNode;
  /** label of the "read on" link that appears once the tree is drawn */
  cue?: { label: string; href: string };
}) {
  return (
    <section className="night sky-hero relative overflow-hidden rounded-b-[2.5rem]">
      <SkyDrift>
        <div className="sky-layer sky-dust" />
        <div className="sky-layer sky-far">
          <Starfield count={120} seed={11} />
        </div>
        <div className="sky-layer sky-near">
          <Starfield count={40} seed={41} shooting />
        </div>
      </SkyDrift>
      <div className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-[112rem] flex-col justify-center px-3 pt-5 pb-6 sm:px-6">
        {children}
        {cue && (
          <a href={cue.href} className="reveal-late scroll-cue mx-auto mt-5 flex flex-col items-center gap-1" style={{ "--rd": "0.9s" } as React.CSSProperties}>
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
