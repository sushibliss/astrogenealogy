"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { randomBytes, randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { signIn, signOut } from "@/auth";
import { db, schema } from "@/db";
import { REQUEST_STATUSES, type RequestStatus } from "@/db/schema";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { requestForUser } from "@/lib/access";
import { demoEnabled } from "@/lib/demo";
import { uploadPath } from "@/lib/documents";
import { INTAKE_PATHS, PATH_RE } from "@/lib/people";
import { cleanPersonInput } from "@/lib/person-input";
import { DEMO_PASSWORD, DEMO_USER_EMAIL, ensureDemoData } from "@/lib/seed";
import { adminEmail, currentUser, isAdmin } from "@/lib/session";

export type FormState = { error?: string } | undefined;

const safeLocale = (v: unknown) => (routing.locales.includes(v as "en") ? (v as string) : routing.defaultLocale);

async function authed() {
  const user = await currentUser();
  if (!user) throw new Error("Not signed in");
  return user;
}

/* ---------- auth ---------- */

async function doSignIn(email: string, password: string, locale: string): Promise<FormState> {
  try {
    await signIn("credentials", { email, password, redirectTo: `/${locale}/dashboard` });
  } catch (e) {
    if (e instanceof AuthError) return { error: "invalid" };
    throw e; // Next.js redirect
  }
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  return doSignIn(String(form.get("email") ?? ""), String(form.get("password") ?? ""), safeLocale(form.get("locale")));
}

export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = safeLocale(form.get("locale"));
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const password = String(form.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { error: "email" };
  if (password.length < 8 || password.length > 200) return { error: "password" };
  if (db.select().from(schema.users).where(eq(schema.users.email, email)).get()) return { error: "taken" };
  db.insert(schema.users)
    .values({ id: randomUUID(), email, name, locale, passwordHash: await bcrypt.hash(password, 10), createdAt: new Date() })
    .run();
  return doSignIn(email, password, locale);
}

export async function demoLoginAction(form: FormData) {
  if (!demoEnabled()) throw new Error("Demo login is disabled");
  ensureDemoData();
  const email = form.get("role") === "admin" ? adminEmail() : DEMO_USER_EMAIL;
  const locale = safeLocale(form.get("locale"));
  await signIn("credentials", {
    email,
    password: DEMO_PASSWORD,
    redirectTo: form.get("role") === "admin" ? `/${locale}/admin` : `/${locale}/dashboard`,
  });
}

export async function logoutAction(form: FormData) {
  await signOut({ redirectTo: `/${safeLocale(form.get("locale"))}` });
}

/* ---------- intake ---------- */

export type IntakePayload = { focusNotes: string; people: unknown[] };

export async function saveIntakeAction(
  locale: string,
  requestId: string | null,
  payload: IntakePayload,
  submit: boolean,
): Promise<{ error: string } | void> {
  const user = await authed();
  locale = safeLocale(locale);
  const now = new Date();
  let id = requestId;

  if (id) {
    const access = requestForUser(id, user);
    if (!access || !access.isOwner) return { error: "forbidden" };
    if (access.request.status !== "draft") return { error: "locked" };
  }

  const cleaned = INTAKE_PATHS.map((path) => {
    const raw = (payload.people ?? []).find((p) => (p as { path?: string })?.path === path);
    return { path, ...cleanPersonInput(raw) };
  });

  if (submit) {
    // Minimum intake: the requester and both parents by name. Grandparents may
    // be left blank where unknown — finding them is what the research is for.
    for (const p of cleaned.filter((c) => c.path.length <= 1)) {
      if (!p.givenNames && !p.surnames) return { error: "names" };
    }
  }

  const focusNotes = String(payload.focusNotes ?? "").trim().slice(0, 4000);
  db.transaction((tx) => {
    if (!id) {
      id = randomUUID();
      tx.insert(schema.requests)
        .values({ id, ownerId: user.id, status: "draft", focusNotes, createdAt: now, updatedAt: now })
        .run();
    }
    tx.update(schema.requests)
      .set({ focusNotes, updatedAt: now, ...(submit ? { status: "submitted" as const, submittedAt: now } : {}) })
      .where(eq(schema.requests.id, id))
      .run();
    for (const p of cleaned) {
      const existing = tx
        .select()
        .from(schema.people)
        .where(and(eq(schema.people.requestId, id), eq(schema.people.path, p.path)))
        .get();
      if (existing) tx.update(schema.people).set(p).where(eq(schema.people.id, existing.id)).run();
      else tx.insert(schema.people).values({ id: randomUUID(), requestId: id, source: "intake", createdAt: now, ...p }).run();
    }
  });

  revalidatePath("/", "layout");
  return redirect({ href: submit ? `/requests/${id}` : "/dashboard", locale });
}

export async function deleteDraftAction(locale: string, requestId: string) {
  const user = await authed();
  const access = requestForUser(requestId, user);
  if (!access || !access.isOwner || access.request.status !== "draft") throw new Error("Forbidden");
  db.delete(schema.requests).where(eq(schema.requests.id, requestId)).run();
  revalidatePath("/", "layout");
  return redirect({ href: "/dashboard", locale: safeLocale(locale) });
}

/* ---------- people ---------- */

export async function savePersonAction(
  locale: string,
  requestId: string,
  personId: string | null,
  raw: unknown,
  returnTo: "request" | "admin",
): Promise<{ error: string } | void> {
  const user = await authed();
  locale = safeLocale(locale);
  const access = requestForUser(requestId, user);
  if (!access) return { error: "forbidden" };
  const data = cleanPersonInput(raw);
  let id = personId;

  if (id) {
    if (!access.people.some((p) => p.id === id)) return { error: "forbidden" };
    db.update(schema.people).set(data).where(eq(schema.people.id, id)).run();
  } else {
    // Only the researcher adds people beyond the intake.
    if (!access.isAdmin) return { error: "forbidden" };
    const path = String((raw as { path?: unknown })?.path ?? "");
    if (!PATH_RE.test(path) || path === "") return { error: "path" };
    if (access.people.some((p) => p.path === path)) return { error: "exists" };
    if (!access.people.some((p) => p.path === path.slice(0, -1))) return { error: "path" };
    id = randomUUID();
    db.insert(schema.people)
      .values({ id, requestId, path, source: "research", createdAt: new Date(), ...data })
      .run();
  }
  db.update(schema.requests).set({ updatedAt: new Date() }).where(eq(schema.requests.id, requestId)).run();
  revalidatePath("/", "layout");
  return redirect({
    href: returnTo === "admin" && access.isAdmin ? `/admin/requests/${requestId}` : `/requests/${requestId}/people/${id}`,
    locale,
  });
}

export async function deletePersonAction(form: FormData) {
  const user = await authed();
  if (!isAdmin(user)) throw new Error("Forbidden");
  const requestId = String(form.get("requestId"));
  const personId = String(form.get("personId"));
  const access = requestForUser(requestId, user);
  const person = access?.people.find((p) => p.id === personId);
  if (!access || !person || person.source !== "research") throw new Error("Forbidden");
  // Never orphan descendants-in-the-tree: only leaves can be removed.
  if (access.people.some((p) => p.path.length > person.path.length && p.path.startsWith(person.path))) {
    throw new Error("Remove this person's ancestors first");
  }
  db.delete(schema.people).where(eq(schema.people.id, personId)).run();
  revalidatePath("/", "layout");
}

export async function deleteDocumentAction(form: FormData) {
  const user = await authed();
  if (!isAdmin(user)) throw new Error("Forbidden");
  const doc = db.select().from(schema.documents).where(eq(schema.documents.id, String(form.get("documentId")))).get();
  if (!doc) return;
  db.delete(schema.documents).where(eq(schema.documents.id, doc.id)).run();
  if (doc.kind === "file") rmSync(uploadPath(doc.id), { force: true });
  revalidatePath("/", "layout");
}

/* ---------- admin ---------- */

export async function setStatusAction(form: FormData) {
  const user = await authed();
  if (!isAdmin(user)) throw new Error("Forbidden");
  const requestId = String(form.get("requestId"));
  const status = String(form.get("status")) as RequestStatus;
  if (!REQUEST_STATUSES.includes(status) || status === "draft") throw new Error("Bad status");
  const pub = db.select().from(schema.publications).where(eq(schema.publications.requestId, requestId)).get();
  if (status === "published" && !pub?.publishedAt) throw new Error("Publish the findings first");
  db.update(schema.requests).set({ status, updatedAt: new Date() }).where(eq(schema.requests.id, requestId)).run();
  revalidatePath("/", "layout");
}

export async function savePublicationAction(
  requestId: string,
  title: string,
  body: string,
  publish: boolean,
): Promise<{ error?: string; ok?: boolean }> {
  const user = await authed();
  if (!isAdmin(user)) return { error: "forbidden" };
  const request = db.select().from(schema.requests).where(eq(schema.requests.id, requestId)).get();
  if (!request || request.status === "draft") return { error: "forbidden" };
  title = title.trim().slice(0, 200);
  body = body.slice(0, 200_000);
  if (publish && (!title || !body.trim())) return { error: "empty" };
  const now = new Date();
  const existing = db.select().from(schema.publications).where(eq(schema.publications.requestId, requestId)).get();
  const publishedAt = publish ? (existing?.publishedAt ?? now) : (existing?.publishedAt ?? null);
  if (existing) {
    db.update(schema.publications).set({ title, body, updatedAt: now, publishedAt }).where(eq(schema.publications.id, existing.id)).run();
  } else {
    db.insert(schema.publications).values({ id: randomUUID(), requestId, title, body, updatedAt: now, publishedAt }).run();
  }
  if (publish) {
    db.update(schema.requests).set({ status: "published", updatedAt: now }).where(eq(schema.requests.id, requestId)).run();
    // Email notification is a later slice; for now the requester sees it on their dashboard.
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------- invites ---------- */

export async function createInviteAction(form: FormData) {
  const user = await authed();
  const requestId = String(form.get("requestId"));
  const access = requestForUser(requestId, user);
  if (!access) throw new Error("Forbidden");
  db.insert(schema.invites)
    .values({
      id: randomUUID(),
      requestId,
      token: randomBytes(24).toString("base64url"),
      label: String(form.get("label") ?? "").trim().slice(0, 120),
      createdAt: new Date(),
    })
    .run();
  revalidatePath("/", "layout");
}

export async function revokeInviteAction(form: FormData) {
  const user = await authed();
  const invite = db.select().from(schema.invites).where(eq(schema.invites.id, String(form.get("inviteId")))).get();
  if (!invite || !requestForUser(invite.requestId, user)) throw new Error("Forbidden");
  db.update(schema.invites).set({ revokedAt: new Date() }).where(eq(schema.invites.id, invite.id)).run();
  revalidatePath("/", "layout");
}
