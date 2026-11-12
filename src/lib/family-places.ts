import type { Person } from "@/db/schema";
import { drawAtlas } from "./atlas";
import { fullName, relationLabel, yearOf } from "./people";
import { locatePlace } from "./places";

export type PlaceKind = "born" | "lived" | "died";
export const MAP_W = 900;
export const MAP_H = 600;

export type MapPlace = {
  id: string;
  name: string;
  x: number;
  y: number;
  /** where the name is written, relative to the mark */
  label: { dx: number; dy: number; anchor: "start" | "end" | "middle" };
  events: { personId: string; kind: PlaceKind }[];
};
export type MapPerson = {
  id: string;
  name: string;
  relation: string;
  stops: { kind: PlaceKind; label: string; when: string; placeId: string | null }[];
  /** their path through life, from birthplace to resting place */
  route: string;
};
export type FamilyMap = { land: string; borders: string; graticule: string; places: MapPlace[]; people: MapPerson[] };

type Stop = { kind: PlaceKind; label: string; when: string; at: { lat: number; lon: number; name: string } | null };

const short = (place: string) => place.replace(/\(.*?\)/g, "").split(",")[0].trim();

/** Where each person was born, lived and died, laid out on a map of just that part of the world. */
export function familyPlaces(people: Person[], locale: string, unknownName: string): FamilyMap | null {
  const known = people.filter((p) => p.birthLat != null && p.birthLon != null);
  const centre =
    known.length > 0
      ? { lat: known.reduce((n, p) => n + p.birthLat!, 0) / known.length, lon: known.reduce((n, p) => n + p.birthLon!, 0) / known.length }
      : null;

  const lives = people.map((p) => {
    const stops: Stop[] = [];
    const home = p.birthLat != null && p.birthLon != null ? { lat: p.birthLat, lon: p.birthLon } : null;
    const near = home ?? centre;
    const find = (text: string) => {
      const hit = locatePlace(text, near);
      return hit && { lat: hit.lat, lon: hit.lon, name: hit.name };
    };
    if (p.birthPlace || home) {
      const label = short(p.birthPlace);
      stops.push({
        kind: "born",
        label,
        when: String(yearOf(p.birthDate) ?? ""),
        at: home ? { ...home, name: label || find(p.birthPlace)?.name || "" } : find(p.birthPlace),
      });
    }
    for (const line of p.residences.split("\n")) {
      const m = /^(.*?)\s*(?:\(([^)]*)\))?\s*$/.exec(line.trim());
      const label = short(m?.[1] ?? "");
      if (label) stops.push({ kind: "lived", label, when: m?.[2]?.trim() ?? "", at: find(m![1]) });
    }
    if (p.living !== "alive" && p.deathPlace) {
      stops.push({ kind: "died", label: short(p.deathPlace), when: String(yearOf(p.deathDate) ?? ""), at: find(p.deathPlace) });
    }
    return { person: p, stops };
  });

  const located = lives.flatMap((l) => l.stops.flatMap((s) => (s.at ? [s.at] : [])));
  if (located.length === 0) return null;
  const atlas = drawAtlas(located, MAP_W, MAP_H);

  const idOf = (at: { lat: number; lon: number }) => `${at.lat.toFixed(2)},${at.lon.toFixed(2)}`;
  const places = new Map<string, MapPlace>();
  const mapPeople: MapPerson[] = [];
  for (const { person, stops } of lives) {
    if (stops.length === 0) continue;
    const points: [number, number][] = [];
    for (const stop of stops) {
      if (!stop.at) continue;
      const id = idOf(stop.at);
      let place = places.get(id);
      if (!place) {
        const [x, y] = atlas.project(stop.at.lon, stop.at.lat);
        place = { id, name: stop.at.name || stop.label, x, y, label: { dx: 15, dy: 4, anchor: "start" }, events: [] };
        places.set(id, place);
      }
      if (!place.events.some((e) => e.personId === person.id && e.kind === stop.kind)) place.events.push({ personId: person.id, kind: stop.kind });
      const last = points[points.length - 1];
      if (!last || last[0] !== place.x || last[1] !== place.y) points.push([place.x, place.y]);
    }
    // each leg bows gently, like a path traced across a chart
    const route = points
      .map(([x, y], i) => {
        if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        const [px, py] = points[i - 1];
        const bend = 0.2;
        const cx = (px + x) / 2 - (y - py) * bend;
        const cy = (py + y) / 2 + (x - px) * bend;
        return `Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
    mapPeople.push({
      id: person.id,
      name: fullName(person) || unknownName,
      relation: relationLabel(person.path, locale).replace(/ \(.*\)$/, ""),
      stops: stops.map((s) => ({ kind: s.kind, label: s.label, when: s.when, placeId: s.at ? idOf(s.at) : null })),
      route: points.length > 1 ? route : "",
    });
  }

  // write each name on the side of its mark with the most room
  const list = [...places.values()].sort((a, b) => b.events.length - a.events.length);
  type Box = [x0: number, y0: number, x1: number, y1: number];
  const taken: Box[] = list.map((p) => [p.x - 12, p.y - 12, p.x + 12, p.y + 12]);
  const clash = (a: Box) =>
    taken.filter((b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]).length +
    (a[0] < 4 || a[2] > MAP_W - 4 || a[1] < 4 || a[3] > MAP_H - 4 ? 3 : 0);
  for (const place of list) {
    const w = place.name.length * 7 + 6;
    const options: { label: MapPlace["label"]; box: Box }[] = [
      { label: { dx: 15, dy: 4, anchor: "start" }, box: [place.x + 13, place.y - 8, place.x + 15 + w, place.y + 8] },
      { label: { dx: -15, dy: 4, anchor: "end" }, box: [place.x - 15 - w, place.y - 8, place.x - 13, place.y + 8] },
      { label: { dx: 0, dy: -17, anchor: "middle" }, box: [place.x - w / 2, place.y - 30, place.x + w / 2, place.y - 13] },
      { label: { dx: 0, dy: 27, anchor: "middle" }, box: [place.x - w / 2, place.y + 13, place.x + w / 2, place.y + 30] },
    ];
    const best = options.map((o) => ({ ...o, score: clash(o.box) })).sort((a, b) => a.score - b.score)[0];
    place.label = best.label;
    taken.push(best.box);
  }

  return { land: atlas.land, borders: atlas.borders, graticule: atlas.graticule, places: list, people: mapPeople };
}
