import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";

/**
 * Deliberately small: intake + publication + a light tree sketch.
 * Only portable column types are used so the schema maps 1:1 to Postgres
 * (text / integer / double precision / timestamp).
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  locale: text("locale").notNull().default("en"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const REQUEST_STATUSES = ["draft", "submitted", "in_research", "published"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const requests = sqliteTable(
  "requests",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<RequestStatus>().notNull().default("draft"),
    focusNotes: text("focus_notes").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("requests_owner_idx").on(t.ownerId)],
);

export const LIVING = ["alive", "deceased", "unknown"] as const;
export type Living = (typeof LIVING)[number];

export const people = sqliteTable(
  "people",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    /**
     * Position in the pedigree as a path from the requester:
     * "" = self, "f" = father, "m" = mother, "fm" = father's mother, "mff" = …
     * This is the only relationship link the app keeps.
     */
    path: text("path").notNull(),
    /** "intake" = entered by the requester, "research" = added by the researcher */
    source: text("source").$type<"intake" | "research">().notNull().default("intake"),
    givenNames: text("given_names").notNull().default(""),
    surnames: text("surnames").notNull().default(""),
    /** YYYY, YYYY-MM or YYYY-MM-DD */
    birthDate: text("birth_date"),
    /** HH:MM local time, when known */
    birthTime: text("birth_time"),
    birthPlace: text("birth_place").notNull().default(""),
    birthLat: real("birth_lat"),
    birthLon: real("birth_lon"),
    birthTz: text("birth_tz"),
    deathDate: text("death_date"),
    deathPlace: text("death_place").notNull().default(""),
    /** places they lived, one per line, optionally with years: "Girona (1930–1955)" */
    residences: text("residences").notNull().default(""),
    living: text("living").$type<Living>().notNull().default("unknown"),
    notes: text("notes").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("people_request_path_idx").on(t.requestId, t.path)],
);

export const publications = sqliteTable("publications", {
  id: text("id").primaryKey(),
  requestId: text("request_id")
    .notNull()
    .unique()
    .references(() => requests.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const invites = sqliteTable(
  "invites",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    label: text("label").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("invites_request_idx").on(t.requestId)],
);

/**
 * Original material behind a person's record: an uploaded PDF (stored on disk
 * under data/uploads) or a link to where the record lives.
 */
export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: text("kind").$type<"file" | "link">().notNull(),
    /** external address, for kind = "link" */
    url: text("url"),
    /** original file name, for kind = "file" */
    fileName: text("file_name"),
    size: integer("size"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("documents_person_idx").on(t.personId), index("documents_request_idx").on(t.requestId)],
);

export type User = typeof users.$inferSelect;
export type SourceDocument = typeof documents.$inferSelect;
export type ResearchRequest = typeof requests.$inferSelect;
export type Person = typeof people.$inferSelect;
export type Publication = typeof publications.$inferSelect;
export type Invite = typeof invites.$inferSelect;
