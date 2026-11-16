/** Paths (after the locale) where measurement may run. Everything personal is excluded. */
const PUBLIC_PREFIXES = ["/chart", "/sample", "/how-it-works", "/faq", "/guides", "/privacy", "/login", "/register"];

export function isPublicPath(pathname: string) {
  const path = pathname.replace(/^\/(en|es)(?=\/|$)/, "");
  return path === "" || path === "/" || PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

const META_EVENT: Record<string, string> = {
  sign_up: "CompleteRegistration",
  request_submitted: "Lead",
  newsletter_signup: "Subscribe",
  chart_generated: "ViewContent",
};

type Tagged = Window & { gtag?: (...args: unknown[]) => void; fbq?: (...args: unknown[]) => void };

/**
 * Reports something worth counting (a chart cast, a sign-up, a request sent).
 * Does nothing unless the visitor accepted measurement, because the tags are
 * only ever loaded after consent. On private pages the address is withheld.
 */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as Tagged;
  const withheld = isPublicPath(window.location.pathname) ? {} : { page_location: window.location.origin, page_title: "private" };
  w.gtag?.("event", event, { ...params, ...withheld });
  if (META_EVENT[event]) w.fbq?.("track", META_EVENT[event]);
}
