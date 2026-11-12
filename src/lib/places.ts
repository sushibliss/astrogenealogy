import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";

/**
 * Offline gazetteer (GeoNames-derived, ~170k towns of 1,000+ inhabitants).
 * Place names typed by users never leave the server.
 */
export type Place = { name: string; region: string; country: string; lat: number; lon: number };
type Row = Place & { key: string };

let cache: Row[] | null = null;

export const normalizePlace = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

function load(): Row[] {
  if (cache) return cache;
  const raw = gunzipSync(readFileSync(path.resolve(/*turbopackIgnore: true*/ process.cwd(), "data/cities.tsv.gz"))).toString("utf8");
  cache = raw.split("\n").map((line) => {
    const [name, country, region, lat, lon] = line.split("\t");
    return { name, country, region, lat: +lat, lon: +lon, key: normalizePlace(name) };
  });
  return cache;
}

export function searchPlaces(query: string, limit = 8): Place[] {
  // "Girona, Spain" → match on the town part only
  const q = normalizePlace(query.split(",")[0] ?? "");
  if (q.length < 2) return [];
  const exact: Row[] = [];
  const prefix: Row[] = [];
  for (const row of load()) {
    if (row.key === q) exact.push(row);
    else if (row.key.startsWith(q)) prefix.push(row);
  }
  prefix.sort((a, b) => a.key.length - b.key.length || a.key.localeCompare(b.key));
  return [...exact, ...prefix].slice(0, limit).map(({ name, region, country, lat, lon }) => ({ name, region, country, lat, lon }));
}

let byKey: Map<string, Row[]> | null = null;
const countryNames = new Map<string, string[]>();

function namesOfCountry(code: string) {
  let names = countryNames.get(code);
  if (!names) {
    names = [code.toLowerCase()];
    for (const lang of ["en", "es"]) {
      try {
        const name = new Intl.DisplayNames(lang, { type: "region" }).of(code);
        if (name) names.push(normalizePlace(name));
      } catch {}
    }
    countryNames.set(code, names);
  }
  return names;
}

/**
 * Best single match for a place written as free text ("Girona", "Atlixco, Puebla",
 * "Valencia (parish not yet identified)"). Towns that share a name are told apart by
 * the region or country in the text and, failing that, by closeness to `near`.
 */
export function locatePlace(text: string, near?: { lat: number; lon: number } | null): Place | null {
  const parts = text
    .replace(/\(.*?\)/g, "")
    .split(",")
    .map(normalizePlace)
    .filter(Boolean);
  if (parts.length === 0) return null;
  if (!byKey) {
    byKey = new Map();
    for (const row of load()) {
      const list = byKey.get(row.key);
      if (list) list.push(row);
      else byKey.set(row.key, [row]);
    }
  }
  let hits = byKey.get(parts[0]) ?? [];
  if (hits.length === 0) return null;
  if (parts.length > 1) {
    const rest = parts.slice(1);
    const narrowed = hits.filter((r) => rest.some((p) => p === normalizePlace(r.region) || namesOfCountry(r.country).includes(p)));
    if (narrowed.length > 0) hits = narrowed;
  }
  if (near && hits.length > 1) {
    const dist = (r: Row) => (r.lat - near.lat) ** 2 + ((r.lon - near.lon) * Math.cos((near.lat * Math.PI) / 180)) ** 2;
    hits = [...hits].sort((a, b) => dist(a) - dist(b));
  }
  const { name, region, country, lat, lon } = hits[0];
  return { name, region, country, lat, lon };
}
