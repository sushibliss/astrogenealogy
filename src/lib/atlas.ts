import { readFileSync } from "node:fs";
import path from "node:path";
import { geoArea, geoEqualEarth, geoGraticule, geoMercator, geoPath } from "d3-geo";
import type { MultiPolygon, Polygon } from "geojson";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

/**
 * Draws the piece of the world a family lived in, from the Natural Earth
 * outlines bundled with `world-atlas`. Everything is computed on the server,
 * so no map tiles are fetched and no place ever leaves the app.
 */
type World = Topology<{ land: GeometryCollection; countries: GeometryCollection }>;
const worlds = new Map<string, World>();

function world(resolution: "10m" | "50m" | "110m") {
  let topo = worlds.get(resolution);
  if (!topo) {
    const file = path.resolve(/*turbopackIgnore: true*/ process.cwd(), `node_modules/world-atlas/countries-${resolution}.json`);
    topo = JSON.parse(readFileSync(file, "utf8")) as World;
    worlds.set(resolution, topo);
  }
  return topo;
}

/**
 * The land outline as separate polygons. A ring wound the wrong way reads, on a
 * sphere, as "everything except this", which would flood the whole map; those are turned round.
 */
const lands = new Map<World, MultiPolygon>();
function landOf(topo: World): MultiPolygon {
  let land = lands.get(topo);
  if (!land) {
    const polygons = feature(topo, topo.objects.land).features.flatMap((f) => {
      const g = f.geometry as Polygon | MultiPolygon;
      return g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    });
    land = {
      type: "MultiPolygon",
      coordinates: polygons.map((rings) =>
        geoArea({ type: "Polygon", coordinates: rings }) > 2 * Math.PI ? rings.map((ring) => [...ring].reverse()) : rings,
      ),
    };
    lands.set(topo, land);
  }
  return land;
}

export type Atlas = {
  land: string;
  borders: string;
  graticule: string;
  project: (lon: number, lat: number) => [number, number];
};

const cache = new Map<string, Atlas>();

export function drawAtlas(points: { lat: number; lon: number }[], width: number, height: number): Atlas {
  const lons = points.map((p) => p.lon);
  const lats = points.map((p) => p.lat);
  let [w, e] = [Math.min(...lons), Math.max(...lons)];
  let [s, n] = [Math.min(...lats), Math.max(...lats)];
  // never closer than a small region, and always with air around the outermost places
  const lonSpan = Math.max(e - w, 2.4);
  const latSpan = Math.max(n - s, 1.6);
  const [midLon, midLat] = [(w + e) / 2, (s + n) / 2];
  w = Math.max(-179, midLon - lonSpan * 0.66);
  e = Math.min(179, midLon + lonSpan * 0.66);
  s = Math.max(-84, midLat - latSpan * 0.66);
  n = Math.min(84, midLat + latSpan * 0.66);

  const key = [w, e, s, n].map((v) => v.toFixed(2)).join(",") + `/${width}x${height}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const wide = e - w > 70;
  const projection = wide ? geoEqualEarth() : geoMercator();
  projection.fitExtent(
    [
      [0, 0],
      [width, height],
    ],
    {
      type: "MultiPoint",
      coordinates: [
        [w, s],
        [w, n],
        [e, s],
        [e, n],
        [(w + e) / 2, s],
        [(w + e) / 2, n],
      ],
    },
  );
  projection.clipExtent([
    [-2, -2],
    [width + 2, height + 2],
  ]);

  const span = e - w;
  const topo = world(span < 30 ? "10m" : span < 130 ? "50m" : "110m");
  const draw = geoPath(projection).digits(1);
  const step = span < 6 ? 1 : span < 30 ? 5 : 15;
  const atlas: Atlas = {
    land: draw(landOf(topo)) ?? "",
    borders: draw(mesh(topo, topo.objects.countries, (a, b) => a !== b)) ?? "",
    graticule: draw(geoGraticule().step([step, step])()) ?? "",
    project: (lon, lat) => projection([lon, lat]) ?? [0, 0],
  };
  if (cache.size > 40) cache.clear();
  cache.set(key, atlas);
  return atlas;
}
