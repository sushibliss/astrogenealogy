/** Deterministic pseudo-random numbers, so the sky is the same on every render. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const FOUR_POINT = "M12 0 C12.6 7.5 16.5 11.4 24 12 C16.5 12.6 12.6 16.5 12 24 C11.4 16.5 7.5 12.6 0 12 C7.5 11.4 11.4 7.5 12 0 Z";

/**
 * Hand-scattered ink stars that twinkle behind a section.
 * Purely decorative; the parent must be `relative` and `overflow-hidden`.
 */
export function Starfield({ count = 46, seed = 7, shooting = false }: { count?: number; seed?: number; shooting?: boolean }) {
  const rand = rng(seed);
  const stars = Array.from({ length: count }, (_, i) => {
    const kind = rand();
    return {
      i,
      left: rand() * 100,
      top: rand() * 100,
      // mostly specks, a few proper stars
      size: kind > 0.72 ? 10 + rand() * 12 : 2.5 + rand() * 3.5,
      star: kind > 0.72,
      opacity: 0.3 + rand() * 0.45,
      duration: 2.6 + rand() * 4.5,
      delay: -rand() * 6,
    };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <svg
          key={s.i}
          viewBox="0 0 24 24"
          width={s.size}
          height={s.size}
          className="star"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              "--o": s.opacity,
              "--d": `${s.duration}s`,
              "--delay": `${s.delay}s`,
            } as React.CSSProperties
          }
        >
          {s.star ? <path d={FOUR_POINT} fill="currentColor" /> : <circle cx="12" cy="12" r="12" fill="currentColor" />}
        </svg>
      ))}
      {shooting && (
        <>
          <span
            className="shooting-star absolute top-[12%] right-[6%] block h-px w-40 origin-right"
            style={{ background: "linear-gradient(to left, var(--color-accent), transparent)" }}
          />
          <span
            className="shooting-star-2 absolute top-[38%] right-[42%] block h-px w-28 origin-right"
            style={{ background: "linear-gradient(to left, var(--color-accent-3), transparent)" }}
          />
        </>
      )}
    </div>
  );
}
