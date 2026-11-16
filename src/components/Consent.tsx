"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { isPublicPath } from "@/lib/track";

export type Tags = { ga?: string; ads?: string; pixel?: string };
type Labels = Record<"text" | "accept" | "decline" | "more", string>;
type Tagged = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown; callMethod?: (...a: unknown[]) => void } };

const COOKIE = "consent";
const readChoice = () => /(?:^|; )consent=(granted|denied)/.exec(document.cookie)?.[1] ?? null;

function loadTags(tags: Tags) {
  const w = window as Tagged;
  const google = tags.ga ?? tags.ads;
  if (google && !w.gtag) {
    w.dataLayer = w.dataLayer ?? [];
    // gtag expects the arguments object itself, hence the classic function form
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    // page views are sent by hand below, so private addresses are never reported
    if (tags.ga) w.gtag("config", tags.ga, { send_page_view: false });
    if (tags.ads) w.gtag("config", tags.ads, { send_page_view: false });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(google)}`;
    document.head.appendChild(s);
  }
  if (tags.pixel && !w.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as NonNullable<Tagged["fbq"]> & { queue: unknown[] };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    w.fbq = fbq;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    w.fbq("init", tags.pixel);
  }
}

/**
 * Cookie consent and the measurement / advertising tags behind it.
 * - Nothing is loaded until the visitor accepts, and nothing at all when no tag is configured.
 * - Tags are only loaded from public pages, and page views are only reported
 *   for public pages, so request ids and reader links never reach a third party.
 */
export function Consent({ tags, labels }: { tags: Tags; labels: Labels }) {
  const pathname = usePathname();
  const configured = !!(tags.ga || tags.ads || tags.pixel);
  const open = isPublicPath(pathname);
  const [choice, setChoice] = useState<string | null>("unknown");

  useEffect(() => {
    // the stored choice lives in a cookie only the browser can read here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(readChoice());
    const reopen = () => setChoice(null);
    window.addEventListener("open-consent", reopen);
    return () => window.removeEventListener("open-consent", reopen);
  }, []);

  useEffect(() => {
    if (!configured || choice !== "granted" || !open) return;
    loadTags(tags);
    const w = window as Tagged;
    w.gtag?.("event", "page_view", { page_location: window.location.origin + pathname, page_title: document.title });
    w.fbq?.("track", "PageView");
  }, [configured, choice, open, pathname, tags]);

  const decide = (value: "granted" | "denied") => {
    document.cookie = `${COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
    setChoice(value);
  };

  if (!configured || !open || choice !== null) return null;
  return (
    <div role="dialog" aria-label={labels.more} className="consent no-print">
      <p className="text-sm leading-relaxed">
        {labels.text}{" "}
        <Link href="/privacy" className="link">
          {labels.more}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => decide("granted")}>
          {labels.accept}
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => decide("denied")}>
          {labels.decline}
        </button>
      </div>
    </div>
  );
}

/** Footer link that brings the consent question back. */
export function CookieSettings({ label }: { label: string }) {
  return (
    <button type="button" className="cursor-pointer justify-self-start text-left" onClick={() => window.dispatchEvent(new Event("open-consent"))}>
      {label}
    </button>
  );
}

/** Fires an event once when a flag left by an earlier step is found (e.g. after registering). */
export function TrackFlag({ flag, event }: { flag: string; event: string }) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(flag)) {
        sessionStorage.removeItem(flag);
        void import("@/lib/track").then((m) => m.track(event));
      }
    } catch {}
  }, [flag, event]);
  return null;
}
