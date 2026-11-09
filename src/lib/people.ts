import type { Person } from "@/db/schema";

/** Pedigree slots collected by the intake wizard, in order. */
export const INTAKE_PATHS = ["", "f", "m", "ff", "fm", "mf", "mm"] as const;

export const PATH_RE = /^[fm]{0,8}$/;

export function sortPeople<T extends { path: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => a.path.length - b.path.length || a.path.localeCompare(b.path));
}

export function fullName(p: Pick<Person, "givenNames" | "surnames">) {
  return `${p.givenNames} ${p.surnames}`.trim();
}

const EN_BASE: Record<string, string> = {
  "": "Requester",
  f: "Father",
  m: "Mother",
  ff: "Paternal grandfather",
  fm: "Paternal grandmother",
  mf: "Maternal grandfather",
  mm: "Maternal grandmother",
};
const ES_BASE: Record<string, string> = {
  "": "Solicitante",
  f: "Padre",
  m: "Madre",
  ff: "Abuelo paterno",
  fm: "Abuela paterna",
  mf: "Abuelo materno",
  mm: "Abuela materna",
};

/** Human label for a pedigree path, e.g. "fmf" → "Great-grandfather (via father → mother)". */
export function relationLabel(path: string, locale: string) {
  const es = locale === "es";
  const base = (es ? ES_BASE : EN_BASE)[path];
  if (base) return base;
  const male = path.endsWith("f");
  const depth = path.length;
  let noun: string;
  if (es) {
    const stems = ["", "", "", "bisabuel", "tatarabuel", "trastatarabuel"];
    noun = stems[depth] ? stems[depth] + (male ? "o" : "a") : `antepasad${male ? "o" : "a"} (generación ${depth})`;
  } else {
    noun = "great-".repeat(depth - 2) + (male ? "grandfather" : "grandmother");
  }
  noun = noun[0].toUpperCase() + noun.slice(1);
  const line = path
    .slice(0, -1)
    .split("")
    .map((c) => (es ? (c === "f" ? "padre" : "madre") : c === "f" ? "father" : "mother"))
    .join(" → ");
  return `${noun} (${es ? "por" : "via"} ${line})`;
}

/** Formats YYYY, YYYY-MM or YYYY-MM-DD for display. */
export function formatPartialDate(date: string | null | undefined, locale: string) {
  if (!date) return "";
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(date);
  if (!m) return date;
  const [, y, mo, d] = m;
  if (!mo) return y;
  const dt = new Date(Date.UTC(+y, +mo - 1, d ? +d : 1));
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    ...(d ? { day: "numeric" } : {}),
  }).format(dt);
}

export function yearOf(date: string | null | undefined) {
  const m = /^(\d{4})/.exec(date ?? "");
  return m ? +m[1] : null;
}

export function lifespan(p: Pick<Person, "birthDate" | "deathDate">) {
  const b = yearOf(p.birthDate);
  const d = yearOf(p.deathDate);
  if (!b && !d) return "";
  return `${b ?? "?"}–${d ?? ""}`.replace(/–$/, d ? "" : "–");
}

/**
 * Living-person privacy for invite-to-read guests: anyone alive, or of unknown
 * status and plausibly alive (born within the last 100 years or undated), is
 * shown by relationship only — no names, dates, places or charts.
 */
export function isPrivateForGuests(p: Pick<Person, "living" | "birthDate">) {
  if (p.living === "alive") return true;
  if (p.living === "deceased") return false;
  const y = yearOf(p.birthDate);
  return !y || y > new Date().getFullYear() - 100;
}

export function birthDataOf(p: Person) {
  return { date: p.birthDate, time: p.birthTime, lat: p.birthLat, lon: p.birthLon, tz: p.birthTz };
}
