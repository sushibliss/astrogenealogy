// Regenerates data/cities.tsv.gz from the GeoNames-derived `cities.json` package.
// Run: node scripts/build-cities.mjs
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import { writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const cities = require("cities.json/cities.json");
const admin1 = require("cities.json/admin1.json");
const regions = new Map(admin1.map((x) => [x.code, x.name]));
const rows = cities.map((c) =>
  [c.name, c.country, regions.get(`${c.country}.${c.admin1}`) || "", (+c.lat).toFixed(3), (+c.lng).toFixed(3)].join("\t"),
);
writeFileSync(new URL("../data/cities.tsv.gz", import.meta.url), gzipSync(rows.join("\n"), { level: 9 }));
console.log(`${rows.length} places written`);
