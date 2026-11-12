import tzlookup from "tz-lookup";
import type { Living, Person } from "@/db/schema";
import { LIVING } from "@/db/schema";
import { parseTime } from "@/lib/astro/chart";

/** Shape edited by the intake wizard and the person editor. */
export type PersonInput = {
  path: string;
  givenNames: string;
  surnames: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthLat: number | null;
  birthLon: number | null;
  living: Living;
  deathDate: string;
  deathPlace: string;
  residences: string;
  notes: string;
};

export function emptyPerson(path: string): PersonInput {
  return {
    path,
    givenNames: "",
    surnames: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    birthLat: null,
    birthLon: null,
    living: path === "" ? "alive" : "unknown",
    deathDate: "",
    deathPlace: "",
    residences: "",
    notes: "",
  };
}

export function personToInput(p: Person): PersonInput {
  return {
    path: p.path,
    givenNames: p.givenNames,
    surnames: p.surnames,
    birthDate: p.birthDate ?? "",
    birthTime: p.birthTime ?? "",
    birthPlace: p.birthPlace,
    birthLat: p.birthLat,
    birthLon: p.birthLon,
    living: p.living,
    deathDate: p.deathDate ?? "",
    deathPlace: p.deathPlace,
    residences: p.residences,
    notes: p.notes,
  };
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function partialDate(v: unknown): string | null {
  const s = str(v, 10);
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(s);
  if (!m) return null;
  const y = +m[1];
  const mo = m[2] ? +m[2] : null;
  const d = m[3] ? +m[3] : null;
  if (y < 1000 || y > new Date().getFullYear()) return null;
  if (mo !== null && (mo < 1 || mo > 12)) return null;
  if (d !== null) {
    const probe = new Date(Date.UTC(y, mo! - 1, d));
    if (probe.getUTCDate() !== d || probe.getUTCMonth() !== mo! - 1) return null;
  }
  return s;
}

/** Validates untrusted client input and returns columns ready to store. */
export function cleanPersonInput(raw: unknown) {
  const r = (raw ?? {}) as Record<string, unknown>;
  const time = parseTime(str(r.birthTime, 5));
  let lat = typeof r.birthLat === "number" && Math.abs(r.birthLat) <= 90 ? r.birthLat : null;
  let lon = typeof r.birthLon === "number" && Math.abs(r.birthLon) <= 180 ? r.birthLon : null;
  if (lat === null || lon === null) lat = lon = null;
  let tz: string | null = null;
  if (lat !== null && lon !== null) {
    try {
      tz = tzlookup(lat, lon);
    } catch {
      tz = null;
    }
  }
  const living: Living = LIVING.includes(r.living as Living) ? (r.living as Living) : "unknown";
  return {
    givenNames: str(r.givenNames, 120),
    surnames: str(r.surnames, 120),
    birthDate: partialDate(r.birthDate),
    birthTime: time ? `${String(time.h).padStart(2, "0")}:${String(time.mi).padStart(2, "0")}` : null,
    birthPlace: str(r.birthPlace, 160),
    birthLat: lat,
    birthLon: lon,
    birthTz: tz,
    deathDate: living === "alive" ? null : partialDate(r.deathDate),
    deathPlace: living === "alive" ? "" : str(r.deathPlace, 160),
    residences: str(r.residences, 800)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12)
      .join("\n"),
    living,
    notes: str(r.notes, 2000),
  };
}
