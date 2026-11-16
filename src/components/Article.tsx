/** Shell for an editorial page: one readable column under a large title. */
export function Article({ eyebrow, title, lead, children }: { eyebrow?: React.ReactNode; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <article className="wrap max-w-3xl pt-20 pb-4">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="display text-4xl sm:text-6xl">{title}</h1>
      {lead && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{lead}</p>}
      <div className="mt-8">{children}</div>
    </article>
  );
}
