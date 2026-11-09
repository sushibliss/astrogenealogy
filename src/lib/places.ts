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
