import type { Person } from "@/db/schema";
import { DEMO_RESIDENCES, FERRER, PUBLICATION_BODY } from "./seed";
import { sortPeople } from "./people";

/**
 * The invented Ferrer Vidal family as a ready-made request, held in memory so
 * the public sample report works on any installation, seeded or not.
 */
export const SAMPLE_TITLE = { en: "The Ferrer and Vidal lines: first findings", es: "Las líneas Ferrer y Vidal: primeros hallazgos" };
export const SAMPLE_BODY = PUBLICATION_BODY;

const created = new Date("2026-10-20T00:00:00Z");

export const samplePeople: Person[] = sortPeople(
  FERRER.map((p) => ({
    id: `sample-${p.path || "self"}`,
    requestId: "sample",
    path: p.path,
    source: p.source ?? "intake",
    givenNames: p.givenNames,
    surnames: p.surnames,
    birthDate: p.birthDate ?? null,
    birthTime: p.birthTime ?? null,
    birthPlace: p.place?.[0] ?? p.placeText ?? "",
    birthLat: p.place?.[1] ?? null,
    birthLon: p.place?.[2] ?? null,
    birthTz: p.place?.[3] ?? null,
    deathDate: p.deathDate ?? null,
    deathPlace: p.deathPlace ?? "",
    residences: DEMO_RESIDENCES[p.path] ?? "",
    living: p.living,
    notes: p.notes ?? "",
    createdAt: created,
  })),
);
