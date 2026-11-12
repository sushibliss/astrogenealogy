import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/db";
import type { Living } from "@/db/schema";
import { samplePdf, uploadPath } from "./documents";
import { adminEmail } from "./session";

export const DEMO_PASSWORD = "origen-demo";
export const DEMO_USER_EMAIL = "demo@origen.local";
export const DEMO_INVITE_TOKEN = "demo-invite-ferrer-vidal";

type SeedPerson = {
  path: string;
  source?: "intake" | "research";
  givenNames: string;
  surnames: string;
  birthDate?: string;
  birthTime?: string;
  place?: [name: string, lat: number, lon: number, tz: string];
  placeText?: string;
  deathDate?: string;
  deathPlace?: string;
  living: Living;
  notes?: string;
};

const BCN: SeedPerson["place"] = ["Barcelona, Catalonia, Spain", 41.389, 2.159, "Europe/Madrid"];
const GIRONA: SeedPerson["place"] = ["Girona, Catalonia, Spain", 41.983, 2.825, "Europe/Madrid"];
const VALENCIA: SeedPerson["place"] = ["Valencia, Valencia, Spain", 39.47, -0.377, "Europe/Madrid"];
const OLOT: SeedPerson["place"] = ["Olot, Catalonia, Spain", 42.181, 2.49, "Europe/Madrid"];
const ALBACETE: SeedPerson["place"] = ["Albacete, Castille-La Mancha, Spain", 38.994, -1.858, "Europe/Madrid"];
const BANYOLES: SeedPerson["place"] = ["Banyoles, Catalonia, Spain", 42.119, 2.766, "Europe/Madrid"];
const PUEBLA: SeedPerson["place"] = ["Puebla, Puebla, Mexico", 19.043, -98.198, "America/Mexico_City"];

// An invented family, for demonstration only.
const FERRER: SeedPerson[] = [
  { path: "", givenNames: "Lucía", surnames: "Ferrer Vidal", birthDate: "1991-04-12", birthTime: "09:40", place: BCN, living: "alive" },
  { path: "f", givenNames: "Jordi", surnames: "Ferrer Soler", birthDate: "1960-11-03", place: GIRONA, living: "alive" },
  { path: "m", givenNames: "Carmen", surnames: "Vidal Ruiz", birthDate: "1963-02-21", place: VALENCIA, living: "alive" },
  { path: "ff", givenNames: "Josep", surnames: "Ferrer Puig", birthDate: "1931-07-19", place: GIRONA, deathDate: "2004-01-28", deathPlace: "Girona", living: "deceased", notes: "Carpenter. The family says he was born at dawn, but nobody knows the hour." },
  { path: "fm", givenNames: "Montserrat", surnames: "Soler Camps", birthDate: "1934-12-08", place: OLOT, deathDate: "2015-06-02", deathPlace: "Girona", living: "deceased" },
  { path: "mf", givenNames: "Antonio", surnames: "Vidal Navarro", birthDate: "1929-03-30", place: VALENCIA, deathDate: "1998-10-11", deathPlace: "Valencia", living: "deceased" },
  { path: "mm", givenNames: "Dolores", surnames: "Ruiz Martín", birthDate: "1936-09-14", place: ALBACETE, deathDate: "2019-03-05", deathPlace: "Valencia", living: "deceased" },
  { path: "fff", source: "research", givenNames: "Narcís", surnames: "Ferrer Bosch", birthDate: "1898-05-02", place: GIRONA, deathDate: "1971-11-17", deathPlace: "Girona", living: "deceased", notes: "Baptism entry found in the parish books of Sant Feliu, Girona." },
  { path: "ffm", source: "research", givenNames: "Rosa", surnames: "Puig Casals", birthDate: "1902-10-23", place: BANYOLES, deathDate: "1989-02-09", deathPlace: "Girona", living: "deceased" },
  { path: "mff", source: "research", givenNames: "Vicente", surnames: "Vidal Ortiz", birthDate: "1895", placeText: "Valencia (parish not yet identified)", living: "deceased", notes: "Only the year is confirmed so far (1920 census)." },
];

const ROJAS: SeedPerson[] = [
  { path: "", givenNames: "Mateo", surnames: "Rojas Luna", birthDate: "1987-08-25", place: PUEBLA, living: "alive" },
  { path: "f", givenNames: "Ernesto", surnames: "Rojas Castillo", birthDate: "1955-01-17", place: PUEBLA, living: "alive" },
  { path: "m", givenNames: "Alicia", surnames: "Luna Herrera", birthDate: "1958-06-09", place: PUEBLA, living: "alive" },
  { path: "ff", givenNames: "Fidel", surnames: "Rojas", birthDate: "1924", placeText: "Atlixco, Puebla", living: "deceased" },
  { path: "fm", givenNames: "Esperanza", surnames: "Castillo", living: "unknown" },
  { path: "mf", givenNames: "Rubén", surnames: "Luna", birthDate: "1930-03", placeText: "Puebla", living: "deceased" },
  { path: "mm", givenNames: "", surnames: "Herrera", living: "unknown", notes: "We never knew her first name." },
];

const PUBLICATION_BODY = `## Summary

Your paternal line is firmly documented in **Girona** back to 1898, and I could extend it one generation beyond what you gave me. The maternal line in **Valencia** is harder: one great-grandfather is confirmed only by year so far.

## What I found

### Narcís Ferrer Bosch (1898–1971)

Your great-grandfather, father of Josep. His baptism is entered in the parish books of Sant Feliu, Girona, on 4 May 1898, two days after his birth. The entry names his parents as *Joan Ferrer* and *Maria Bosch*, both "naturals de Girona".

### Rosa Puig Casals (1902–1989)

Your great-grandmother, born in Banyoles. She appears with Narcís in the 1930 municipal register of Girona, at Carrer de la Força, with three children. Josep is listed as the youngest.

### Vicente Vidal Ortiz (b. 1895)

Father of Antonio. The 1920 census of Valencia gives his age as 25 and his trade as *ebanista* (cabinet-maker). I have not yet located his baptism, so the exact birth date is open, and his birth report will appear once it is known.

## Sources

1. Parish register of Sant Feliu (Girona), baptisms 1895–1900, f. 112.
2. Padró municipal de Girona, 1930.
3. Censo de población de Valencia, 1920, district 4.

## Open questions

- The parish of Vicente Vidal Ortiz's baptism.
- Whether *Joan Ferrer* (b. c. 1865) is the same man recorded as a cork worker in Cassà de la Selva.

> A note on the charts: none of your ancestors' birth hours are recorded, so their reports show planets by sign only. Your own chart includes the Ascendant because you gave me your hour.
`;

function insertPeople(requestId: string, list: SeedPerson[], now: Date) {
  for (const p of list) {
    db.insert(schema.people)
      .values({
        id: randomUUID(),
        requestId,
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
        living: p.living,
        notes: p.notes ?? "",
        createdAt: now,
      })
      .run();
  }
}

function ensureUser(email: string, name: string, locale: string, hash: string) {
  const existing = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (existing) return { user: existing, created: false };
  const user = { id: randomUUID(), email, name, locale, passwordHash: hash, createdAt: new Date() };
  db.insert(schema.users).values(user).run();
  return { user, created: true };
}

/** Sample source documents for the demo family (added once). */
function ensureDemoDocuments(ownerId: string) {
  const request = db.select().from(schema.requests).where(eq(schema.requests.ownerId, ownerId)).all()[0];
  if (!request) return;
  if (db.select().from(schema.documents).where(eq(schema.documents.requestId, request.id)).all().length > 0) return;
  const person = (path: string) =>
    db
      .select()
      .from(schema.people)
      .where(and(eq(schema.people.requestId, request.id), eq(schema.people.path, path)))
      .get();
  const now = new Date();
  const narcis = person("fff");
  if (narcis) {
    const id = randomUUID();
    const pdf = samplePdf([
      "Sample document (demo data)",
      "Parish of Sant Feliu, Girona. Baptisms 1895-1900, folio 112.",
      "",
      "On the fourth day of May of 1898 was baptised Narcis, born on the second",
      "day of the same month, legitimate son of Joan Ferrer and Maria Bosch,",
      "both natives of Girona.",
      "",
      "This is an invented transcription used to demonstrate Origen.",
    ]);
    writeFileSync(uploadPath(id), pdf);
    db.insert(schema.documents)
      .values({ id, requestId: request.id, personId: narcis.id, title: "Baptism entry, Sant Feliu (transcription)", kind: "file", fileName: "baptism-narcis-ferrer.pdf", size: pdf.length, createdAt: now })
      .run();
  }
  const vicente = person("mff");
  if (vicente) {
    db.insert(schema.documents)
      .values({ id: randomUUID(), requestId: request.id, personId: vicente.id, title: "1920 census of Valencia, catalogue record (sample link)", kind: "link", url: "https://pares.cultura.gob.es/", createdAt: now })
      .run();
  }
}

/** Places the demo family lived, for the map (added once, also to databases seeded before the map existed). */
const DEMO_RESIDENCES: Record<string, string> = {
  ff: "Girona (1931–2004)",
  fm: "Girona (1956–2015)",
  mf: "Sagunto (1951–1960)\nValencia (1960–1998)",
  mm: "Valencia (1958–2019)",
  fff: "Cassà de la Selva (1915–1922)\nGirona (1922–1971)",
  ffm: "Girona (1925–1989)",
  mff: "Xàtiva (1930s)",
};

function ensureDemoResidences(ownerId: string) {
  const request = db.select().from(schema.requests).where(eq(schema.requests.ownerId, ownerId)).all()[0];
  if (!request) return;
  const list = db.select().from(schema.people).where(eq(schema.people.requestId, request.id)).all();
  if (list.some((p) => p.residences)) return;
  for (const p of list) {
    const residences = DEMO_RESIDENCES[p.path];
    if (residences) db.update(schema.people).set({ residences }).where(eq(schema.people.id, p.id)).run();
  }
}

/** Idempotent: creates the admin, the demo users and their sample requests if missing. */
export function ensureDemoData() {
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  ensureUser(adminEmail(), "Teresa", "es", hash);
  const demo = ensureUser(DEMO_USER_EMAIL, "Lucía Ferrer", "en", hash);
  const mateo = ensureUser("mateo@origen.local", "Mateo Rojas", "es", hash);
  const day = 86400000;

  if (demo.created) {
    const requestId = randomUUID();
    const t0 = new Date(Date.now() - 21 * day);
    db.insert(schema.requests)
      .values({
        id: requestId,
        ownerId: demo.user.id,
        status: "published",
        focusNotes:
          "I would love to know where the Ferrer line was before Girona, and anything at all about my mother's grandfather Vicente.",
        createdAt: t0,
        updatedAt: new Date(Date.now() - 2 * day),
        submittedAt: t0,
      })
      .run();
    insertPeople(requestId, FERRER, t0);
    db.insert(schema.publications)
      .values({
        id: randomUUID(),
        requestId,
        title: "The Ferrer and Vidal lines: first findings",
        body: PUBLICATION_BODY,
        publishedAt: new Date(Date.now() - 2 * day),
        updatedAt: new Date(Date.now() - 2 * day),
      })
      .run();
    db.insert(schema.invites)
      .values({
        id: randomUUID(),
        requestId,
        token: DEMO_INVITE_TOKEN,
        label: "Tía Mercè",
        createdAt: new Date(Date.now() - day),
      })
      .run();
  }

  ensureDemoDocuments(demo.user.id);
  ensureDemoResidences(demo.user.id);

  if (mateo.created) {
    const requestId = randomUUID();
    const t0 = new Date(Date.now() - 3 * day);
    db.insert(schema.requests)
      .values({
        id: requestId,
        ownerId: mateo.user.id,
        status: "submitted",
        focusNotes: "Mi abuela materna: nunca supimos su nombre de pila ni de dónde venía.",
        createdAt: t0,
        updatedAt: t0,
        submittedAt: t0,
      })
      .run();
    insertPeople(requestId, ROJAS, t0);
  }
}
