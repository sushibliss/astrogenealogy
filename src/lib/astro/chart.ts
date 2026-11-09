import * as Astronomy from "astronomy-engine";

/**
 * Western tropical chart computation.
 *
 * - Geocentric ecliptic longitudes of date (tropical zodiac).
 * - When the birth time is unknown the chart is cast for local noon and every
 *   body is checked across the whole civil day: bodies that change sign that
 *   day are flagged as uncertain, and angles/houses are never produced.
 * - When time AND coordinates are known: Ascendant, Midheaven and whole-sign houses.
 */

export const BODIES = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
] as const;
export type BodyKey = (typeof BODIES)[number];

export const SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;
export type SignKey = (typeof SIGNS)[number];

export const ELEMENTS = ["fire", "earth", "air", "water"] as const;
export type ElementKey = (typeof ELEMENTS)[number];
export const MODALITIES = ["cardinal", "fixed", "mutable"] as const;
export type ModalityKey = (typeof MODALITIES)[number];

export const ASPECTS = [
  { key: "conjunction", angle: 0, orb: 8 },
  { key: "opposition", angle: 180, orb: 8 },
  { key: "trine", angle: 120, orb: 7 },
  { key: "square", angle: 90, orb: 7 },
  { key: "sextile", angle: 60, orb: 5 },
] as const;
export type AspectKey = (typeof ASPECTS)[number]["key"];

export type Placement = {
  body: BodyKey;
  lon: number;
  sign: number;
  deg: number;
  retrograde: boolean;
  /** true when the body changes sign during the (time-unknown) birth day */
  uncertain: boolean;
  /** the other possible sign when uncertain */
  altSign?: number;
  /** longitude at the start and end of the birth day (time-unknown charts) */
  dayRange?: [number, number];
  house?: number;
};

export type Aspect = {
  a: BodyKey;
  b: BodyKey;
  type: AspectKey;
  orb: number;
};

export type Chart = {
  timeKnown: boolean;
  hasAngles: boolean;
  /** instant the chart was cast for, ISO UTC */
  utc: string;
  /** true when no time zone could be resolved and UTC was assumed */
  assumedUtc: boolean;
  placements: Placement[];
  asc?: number;
  mc?: number;
  aspects: Aspect[];
  elements: Record<ElementKey, number>;
  modalities: Record<ModalityKey, number>;
};

export type BirthData = {
  /** YYYY-MM-DD (full date required) */
  date: string | null | undefined;
  /** HH:MM, optional */
  time?: string | null;
  lat?: number | null;
  lon?: number | null;
  /** IANA zone */
  tz?: string | null;
};

export const MIN_YEAR = 1600;
export const MAX_YEAR = 2200;

const norm = (deg: number) => ((deg % 360) + 360) % 360;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function signOf(lon: number) {
  return Math.floor(norm(lon) / 30) % 12;
}
export function elementOfSign(sign: number): ElementKey {
  return ELEMENTS[sign % 4];
}
export function modalityOfSign(sign: number): ModalityKey {
  return MODALITIES[sign % 3];
}

/** Parses a strict YYYY-MM-DD string. */
export function parseFullDate(date: string | null | undefined) {
  if (!date) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  return { y, mo, d };
}

export function parseTime(time: string | null | undefined) {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const h = +m[1];
  const mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return { h, mi };
}

export type Eligibility =
  | { ok: true; timeKnown: boolean; hasAngles: boolean }
  | { ok: false; reason: "no_date" | "partial_date" | "out_of_range" };

export function chartEligibility(b: BirthData): Eligibility {
  if (!b.date) return { ok: false, reason: "no_date" };
  const d = parseFullDate(b.date);
  if (!d) return { ok: false, reason: "partial_date" };
  if (d.y < MIN_YEAR || d.y > MAX_YEAR) return { ok: false, reason: "out_of_range" };
  const timeKnown = !!parseTime(b.time);
  const hasAngles = timeKnown && b.lat != null && b.lon != null;
  return { ok: true, timeKnown, hasAngles };
}

/** Offset (ms) of an IANA zone at a given instant, using the runtime tz database. */
function zoneOffsetMs(tz: string, instant: number) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  const parts: Record<string, number> = {};
  for (const p of fmt.formatToParts(new Date(instant))) {
    if (p.type !== "literal") parts[p.type] = +p.value;
  }
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Converts civil local time in a zone to a UTC instant (ms). */
export function localToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  tz: string | null | undefined,
  lon?: number | null,
) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  if (!tz) {
    // No zone but a longitude: local mean time is the best estimate.
    if (lon != null) return { ms: guess - Math.round(lon * 240000), assumedUtc: false };
    return { ms: guess, assumedUtc: true };
  }
  try {
    let offset = zoneOffsetMs(tz, guess);
    offset = zoneOffsetMs(tz, guess - offset);
    // Before standard time the tz database only knows the local mean time of the
    // zone's reference city; the birthplace's own longitude is more accurate.
    if (lon != null && offset % 900000 !== 0) offset = Math.round(lon * 240000);
    return { ms: guess - offset, assumedUtc: false };
  } catch {
    return { ms: guess, assumedUtc: true };
  }
}

function longitude(body: BodyKey, date: Date): number {
  if (body === "sun") return Astronomy.SunPosition(date).elon;
  if (body === "moon") return Astronomy.EclipticGeoMoon(date).lon;
  const name = (body[0].toUpperCase() + body.slice(1)) as keyof typeof Astronomy.Body;
  const vec = Astronomy.GeoVector(Astronomy.Body[name], date, true);
  return Astronomy.Ecliptic(vec).elon;
}

function angles(date: Date, lat: number, lon: number) {
  const T = (date.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  const eps = rad(23.4392911 - 0.0130042 * T);
  const ramc = rad(norm(Astronomy.SiderealTime(date) * 15 + lon));
  const mc = norm(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))));
  const phi = rad(Math.max(-89.9, Math.min(89.9, lat)));
  const asc = norm(
    deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)))),
  );
  return { asc, mc };
}

export function separation(a: number, b: number) {
  const d = Math.abs(norm(a) - norm(b));
  return d > 180 ? 360 - d : d;
}

export function findAspect(lonA: number, lonB: number) {
  const sep = separation(lonA, lonB);
  for (const asp of ASPECTS) {
    const orb = Math.abs(sep - asp.angle);
    if (orb <= asp.orb) return { type: asp.key, orb };
  }
  return null;
}

export function computeChart(b: BirthData): Chart | null {
  const elig = chartEligibility(b);
  if (!elig.ok) return null;
  const d = parseFullDate(b.date)!;
  const t = parseTime(b.time);
  const { ms, assumedUtc } = localToUtc(d.y, d.mo, d.d, t ? t.h : 12, t ? t.mi : 0, b.tz, b.lon);
  const date = new Date(ms);
  const HOUR = 3600000;

  const placements: Placement[] = BODIES.map((body) => {
    const lon = norm(longitude(body, date));
    const before = longitude(body, new Date(ms - HOUR));
    const after = longitude(body, new Date(ms + HOUR));
    const motion = ((after - before + 540) % 360) - 180;
    const sign = signOf(lon);
    const p: Placement = {
      body,
      lon,
      sign,
      deg: lon - sign * 30,
      retrograde: body !== "sun" && body !== "moon" && motion < 0,
      uncertain: false,
    };
    if (!elig.timeKnown) {
      const startLon = norm(longitude(body, new Date(ms - 12 * HOUR)));
      const endLon = norm(longitude(body, new Date(ms + 12 * HOUR)));
      if (body === "moon") p.dayRange = [startLon, endLon];
      const startSign = signOf(startLon);
      const endSign = signOf(endLon);
      if (startSign !== endSign) {
        p.uncertain = true;
        p.altSign = startSign === sign ? endSign : startSign;
      }
    }
    return p;
  });

  let asc: number | undefined;
  let mc: number | undefined;
  if (elig.hasAngles) {
    const a = angles(date, b.lat!, b.lon!);
    asc = a.asc;
    mc = a.mc;
    const ascSign = signOf(asc);
    for (const p of placements) p.house = ((p.sign - ascSign + 12) % 12) + 1;
  }

  const aspects: Aspect[] = [];
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const A = placements[i];
      const B = placements[j];
      // Without a birth time the Moon can be ~6.5° off either way: skip its aspects.
      if (!elig.timeKnown && (A.body === "moon" || B.body === "moon")) continue;
      const found = findAspect(A.lon, B.lon);
      if (found) aspects.push({ a: A.body, b: B.body, ...found });
    }
  }
  aspects.sort((x, y) => x.orb - y.orb);

  const elements: Record<ElementKey, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities: Record<ModalityKey, number> = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const p of placements) {
    if (p.uncertain) continue;
    elements[elementOfSign(p.sign)]++;
    modalities[modalityOfSign(p.sign)]++;
  }

  return {
    timeKnown: elig.timeKnown,
    hasAngles: elig.hasAngles,
    utc: date.toISOString(),
    assumedUtc,
    placements,
    asc,
    mc,
    aspects,
    elements,
    modalities,
  };
}

export type SynastryAspect = { a: BodyKey; b: BodyKey; type: AspectKey; orb: number };
export type Synastry = {
  aspects: SynastryAspect[];
  harmony: number;
  tension: number;
  /** -1 (mostly friction) … +1 (mostly ease) */
  balance: number;
  tone: "easy" | "mixed" | "charged" | "quiet";
};

const SOFT: AspectKey[] = ["trine", "sextile"];
const HARD: AspectKey[] = ["square", "opposition"];
const WEIGHT: Record<BodyKey, number> = {
  sun: 3,
  moon: 3,
  mercury: 2,
  venus: 2.5,
  mars: 2.5,
  jupiter: 1.5,
  saturn: 1.5,
  uranus: 0.5,
  neptune: 0.5,
  pluto: 0.5,
};

export function computeSynastry(a: Chart, b: Chart): Synastry {
  const aspects: SynastryAspect[] = [];
  let harmony = 0;
  let tension = 0;
  for (const pa of a.placements) {
    if (!a.timeKnown && pa.body === "moon") continue;
    for (const pb of b.placements) {
      if (!b.timeKnown && pb.body === "moon") continue;
      // Two outer planets aspecting each other only describe the generations.
      if (WEIGHT[pa.body] < 1 && WEIGHT[pb.body] < 1) continue;
      const found = findAspect(pa.lon, pb.lon);
      if (!found) continue;
      // tighter orbs for synastry
      if (found.orb > 6) continue;
      aspects.push({ a: pa.body, b: pb.body, ...found });
      const w = ((WEIGHT[pa.body] + WEIGHT[pb.body]) / 2) * (1 - found.orb / 8);
      if (SOFT.includes(found.type)) harmony += w;
      else if (HARD.includes(found.type)) tension += w;
      else {
        harmony += w / 2;
        tension += w / 4;
      }
    }
  }
  aspects.sort((x, y) => x.orb - y.orb);
  const total = harmony + tension;
  const balance = total ? (harmony - tension) / total : 0;
  const tone = total < 2 ? "quiet" : balance > 0.25 ? "easy" : balance < -0.25 ? "charged" : "mixed";
  return { aspects, harmony, tension, balance, tone };
}

export function formatDegree(degInSign: number) {
  let d = Math.floor(degInSign);
  let m = Math.round((degInSign - d) * 60);
  if (m === 60) {
    d += 1;
    m = 0;
  }
  if (d === 30) {
    d = 29;
    m = 59;
  }
  return `${d}°${String(m).padStart(2, "0")}′`;
}
